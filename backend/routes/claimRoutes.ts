/**
 * Claim workflow. Claims live inside Item documents (item.claims), not in their own collection.
 *
 *   1. A student submits a claim on an ACTIVE FOUND item     -> claim is PENDING, item stays ACTIVE
 *   2. The item's reporter (the finder) reviews the claims
 *      - Reject  -> that claim becomes REJECTED, item stays ACTIVE
 *      - Approve -> that claim becomes APPROVED, item becomes RECOVERED,
 *                   every other PENDING claim is REJECTED automatically
 *
 * Approve, reject and submit are each a single conditional MongoDB update, so two requests
 * arriving at the same time can never approve two claims or add duplicate claims.
 * Admins can view pending claims (see adminRoutes) but cannot approve or reject them.
 */
import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Item } from '../models/Item';
import { requireAuth } from '../middleware/authMiddleware';
import { asString, isValidId, REQUEST_ID_PATTERN } from '../utils/validation';
import { notify } from '../utils/notify';

const router = Router();

const CLAIMANT_FIELDS = 'name email profileImage';
const OTHER_CLAIM_CLOSED_REASON = 'The item has already been returned to another claimant.';

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

// POST /api/items/:id/claims — body: { "description": "why it is mine + identifying details", "requestId"?: "<random id>" }
//
// Idempotency: the app creates one random requestId per claim form and sends it with every attempt.
// The $push below can only succeed once per student per item (the filter checks both claimedBy and
// requestId atomically), so a retry after a timeout cannot add a second claim. When a retry arrives
// for a claim that was already saved, the saved claim is returned with 200 instead of an error.
router.post('/items/:id/claims', requireAuth, async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user!._id;
  const description = asString(req.body?.description);
  const requestId = asString(req.body?.requestId) || undefined;

  if (!isValidId(itemId)) return sendError(res, 400, 'Invalid item id');
  if (requestId && !REQUEST_ID_PATTERN.test(requestId)) return sendError(res, 400, 'Invalid request id');
  if (req.user!.role !== 'STUDENT') return sendError(res, 403, 'Only students can claim items');
  if (description.length < 10 || description.length > 1000) {
    return sendError(res, 400, 'Please describe the item in 10 to 1000 characters');
  }

  // Every rule is part of the filter, so the claim is only added if all of them hold at the moment of the update.
  const updated = await Item.findOneAndUpdate(
    {
      _id: itemId,
      type: 'FOUND',
      status: 'ACTIVE',
      reportedBy: { $ne: userId }, // cannot claim your own report
      'claims.claimedBy': { $ne: userId }, // one claim per student per item
      ...(requestId ? { 'claims.requestId': { $ne: requestId } } : {}), // the same request is never added twice
    },
    { $push: { claims: { claimedBy: userId, description, status: 'PENDING', requestId } } },
    { new: true, runValidators: true }
  ).select('+claims');

  if (!updated) {
    // Work out which rule failed so the student gets a useful message.
    const item = await Item.findById(itemId).select('+claims');
    if (!item) return sendError(res, 404, 'Item not found');
    // A retry of a claim that was already saved: return it instead of an error.
    const savedClaim = requestId ? item.claims.find((c) => c.claimedBy.equals(userId) && c.requestId === requestId) : undefined;
    if (savedClaim) {
      return res.status(200).json({
        success: true,
        message: 'Your claim was already submitted. No duplicate was created.',
        data: { claim: savedClaim, alreadySaved: true },
      });
    }
    if (item.type !== 'FOUND') return sendError(res, 400, 'Only FOUND items can be claimed');
    if (item.status !== 'ACTIVE') return sendError(res, 409, 'This item has already been recovered');
    if (item.reportedBy.equals(userId)) return sendError(res, 400, 'You cannot claim an item you reported');
    return sendError(res, 409, 'You have already submitted a claim for this item');
  }

  const claim = updated.claims.find((c) => c.claimedBy.equals(userId))!;
  await notify(updated.reportedBy, {
    type: 'CLAIM_RECEIVED',
    title: 'New claim on your found item',
    message: `${req.user!.name} says "${updated.title}" belongs to them. Review the claim.`,
    relatedItem: updated._id,
    relatedClaim: claim._id,
  });
  res.status(201).json({
    success: true,
    message: 'Claim submitted. The person who found this item will review it.',
    data: { claim },
  });
});

// GET /api/items/:id/claims — full claim details for one item. Only the item's reporter may see them.
router.get('/items/:id/claims', requireAuth, async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 400, 'Invalid item id');

  const item = await Item.findById(req.params.id).select('+claims').populate('claims.claimedBy', CLAIMANT_FIELDS);
  if (!item) return sendError(res, 404, 'Item not found');
  if (!item.reportedBy.equals(req.user!._id)) {
    return sendError(res, 403, 'Only the person who reported this item can view its claims');
  }

  const claims = [...item.claims].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({ success: true, data: { claims } });
});

// PATCH /api/items/:id/claims/:claimId — reporter only.
// Body: { "action": "APPROVE" } or { "action": "REJECT", "reason": "optional text" }
router.patch('/items/:id/claims/:claimId', requireAuth, async (req, res) => {
  const { id: itemId, claimId } = req.params;
  const action = asString(req.body?.action).toUpperCase();
  const reason = asString(req.body?.reason);

  if (!isValidId(itemId) || !isValidId(claimId)) return sendError(res, 400, 'Invalid item or claim id');
  if (action !== 'APPROVE' && action !== 'REJECT') return sendError(res, 400, 'action must be APPROVE or REJECT');
  if (reason.length > 300) return sendError(res, 400, 'Reason must be 300 characters or fewer');

  const claimObjectId = new Types.ObjectId(claimId);
  const now = new Date();

  // The update only matches if: the item exists, the logged-in user reported it, it is still ACTIVE,
  // and the chosen claim is still PENDING. Because MongoDB applies a single-document update atomically,
  // once one approval has turned the item RECOVERED no other approval can match.
  const filter = {
    _id: itemId,
    reportedBy: req.user!._id,
    status: 'ACTIVE' as const,
    claims: { $elemMatch: { _id: claimObjectId, status: 'PENDING' } },
  };

  // "chosen" is the claim being reviewed; "other" matches every other claim that is still PENDING.
  const approveUpdate = {
    status: 'RECOVERED',
    'claims.$[chosen].status': 'APPROVED',
    'claims.$[chosen].updatedAt': now,
    'claims.$[other].status': 'REJECTED',
    'claims.$[other].rejectionReason': OTHER_CLAIM_CLOSED_REASON,
    'claims.$[other].updatedAt': now,
  };
  const rejectUpdate = {
    'claims.$[chosen].status': 'REJECTED',
    'claims.$[chosen].rejectionReason': reason || undefined,
    'claims.$[chosen].updatedAt': now,
  };
  const arrayFilters: Record<string, unknown>[] = [{ 'chosen._id': claimObjectId }];
  if (action === 'APPROVE') {
    arrayFilters.push({ 'other._id': { $ne: claimObjectId }, 'other.status': 'PENDING' });
  }

  const updated = await Item.findOneAndUpdate(
    filter,
    { $set: action === 'APPROVE' ? approveUpdate : rejectUpdate },
    { arrayFilters, new: true }
  ).select('+claims');

  if (!updated) {
    // Explain why nothing was updated.
    const item = await Item.findById(itemId).select('+claims');
    if (!item) return sendError(res, 404, 'Item not found');
    if (!item.reportedBy.equals(req.user!._id)) {
      return sendError(res, 403, 'Only the person who reported this item can review its claims');
    }
    const claim = item.claims.find((c) => c._id.equals(claimObjectId));
    if (!claim) return sendError(res, 404, 'Claim not found');
    if (item.status !== 'ACTIVE') return sendError(res, 409, 'This item has already been recovered');
    return sendError(res, 409, `This claim has already been ${claim.status.toLowerCase()}`);
  }

  // Tell the claimant(s) what happened. The update above can only succeed once per claim,
  // so each of these notifications is sent exactly once.
  const chosen = updated.claims.find((c) => c._id.equals(claimObjectId))!;
  if (action === 'APPROVE') {
    await notify(chosen.claimedBy, {
      type: 'CLAIM_APPROVED',
      title: 'Your claim was approved',
      message: `The finder approved your claim for "${updated.title}". Contact them to arrange a safe hand-over.`,
      relatedItem: updated._id,
      relatedClaim: chosen._id,
    });
    // Claims closed automatically by this approval are the ones updated at the same moment.
    const closed = updated.claims.filter(
      (c) => !c._id.equals(claimObjectId) && c.status === 'REJECTED' && c.updatedAt.getTime() === now.getTime()
    );
    for (const other of closed) {
      await notify(other.claimedBy, {
        type: 'CLAIM_CLOSED',
        title: 'Your claim was closed',
        message: `"${updated.title}" has already been returned to another claimant.`,
        relatedItem: updated._id,
        relatedClaim: other._id,
      });
    }
  } else {
    await notify(chosen.claimedBy, {
      type: 'CLAIM_REJECTED',
      title: 'Your claim was rejected',
      message: reason
        ? `Your claim for "${updated.title}" was rejected. Reason: ${reason}`
        : `Your claim for "${updated.title}" was rejected by the finder.`,
      relatedItem: updated._id,
      relatedClaim: chosen._id,
    });
  }

  await updated.populate('claims.claimedBy', CLAIMANT_FIELDS);
  const claim = updated.claims.find((c) => c._id.equals(claimObjectId))!;
  res.json({
    success: true,
    message:
      action === 'APPROVE'
        ? 'Claim approved. The item is now marked as recovered.'
        : 'Claim rejected. The item stays listed for other students.',
    data: { claim, itemStatus: updated.status },
  });
});

// GET /api/claims/my — claims the logged-in student has submitted, with a short summary of each item.
router.get('/claims/my', requireAuth, async (req, res) => {
  const userId = req.user!._id;
  const items = await Item.find({ 'claims.claimedBy': userId })
    .select('+claims')
    .populate('reportedBy', 'name email profileImage');

  const claims = items
    .map((item) => {
      const claim = item.claims.find((c) => c.claimedBy.equals(userId))!;
      return {
        _id: claim._id,
        description: claim.description,
        status: claim.status,
        rejectionReason: claim.rejectionReason ?? null,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        item: {
          _id: item._id,
          title: item.title,
          imageUrl: item.imageUrl,
          category: item.category,
          location: item.location,
          status: item.status,
          reportedBy: item.reportedBy,
        },
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: { claims } });
});

// GET /api/claims/received — claims made on FOUND items the logged-in user reported. PENDING ones first.
router.get('/claims/received', requireAuth, async (req, res) => {
  const items = await Item.find({ reportedBy: req.user!._id, 'claims.0': { $exists: true } })
    .select('+claims')
    .populate('claims.claimedBy', CLAIMANT_FIELDS);

  const claims = items
    .flatMap((item) =>
      item.claims.map((claim) => ({
        ...claim.toObject(),
        item: { _id: item._id, title: item.title, imageUrl: item.imageUrl, category: item.category, status: item.status },
      }))
    )
    .sort((a, b) => {
      const pendingFirst = Number(b.status === 'PENDING') - Number(a.status === 'PENDING');
      return pendingFirst || b.createdAt.getTime() - a.createdAt.getTime();
    });

  res.json({ success: true, data: { claims } });
});

export default router;
