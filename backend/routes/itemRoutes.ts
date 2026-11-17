import { createHash } from 'node:crypto';
import { Router, Request } from 'express';
import { Item, isItemCategory, isItemType } from '../models/Item';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadImage as parseImage } from '../middleware/uploadMiddleware';
import { deleteImage, uploadRequestImage } from '../config/cloudinary';
import { asString, isValidId, REQUEST_ID_PATTERN } from '../utils/validation';

const router = Router();

// Every item route needs a logged-in user.
router.use(requireAuth);

// Reporter fields that may be shown to other students. Never the password.
const REPORTER_FIELDS = 'name email profileImage';

function isOwner(req: Request, reportedBy: unknown): boolean {
  return String(reportedBy) === req.user!._id.toString();
}

const DATE_RANGES: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30 };

/** Escapes text so it can be used safely inside a regular expression (for "contains" searches). */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/items — Browse. All query parameters are optional and can be combined:
 *   type      ALL | LOST | FOUND
 *   category  one of the 9 categories
 *   location  text contained in the location (case-insensitive)
 *   q         text contained in the item name or category
 *   reported  1d | 7d | 30d   (reported in the last day / week / month)
 *   status    ACTIVE (default) | RECOVERED
 *   sort      newest (default) | oldest
 * The filtering and sorting happen in MongoDB, not on the phone. Claims are never included.
 */
router.get('/', async (req, res) => {
  const type = asString(req.query.type).toUpperCase();
  const category = asString(req.query.category);
  const location = asString(req.query.location);
  const q = asString(req.query.q);
  const reported = asString(req.query.reported);
  const status = asString(req.query.status).toUpperCase() || 'ACTIVE';
  const sort = asString(req.query.sort) || 'newest';

  const filter: Record<string, unknown> = {};

  if (status !== 'ACTIVE' && status !== 'RECOVERED') {
    return res.status(400).json({ success: false, message: 'status must be ACTIVE or RECOVERED' });
  }
  filter.status = status;

  if (type && type !== 'ALL') {
    if (!isItemType(type)) {
      return res.status(400).json({ success: false, message: 'type must be ALL, LOST or FOUND' });
    }
    filter.type = type;
  }
  if (category) {
    if (!isItemCategory(category)) {
      return res.status(400).json({ success: false, message: 'Unknown category' });
    }
    filter.category = category;
  }
  if (location) {
    filter.location = { $regex: escapeRegex(location.slice(0, 120)), $options: 'i' };
  }
  if (q) {
    const pattern = { $regex: escapeRegex(q.slice(0, 80)), $options: 'i' };
    filter.$or = [{ title: pattern }, { category: pattern }];
  }
  if (reported) {
    const days = DATE_RANGES[reported];
    if (!days) {
      return res.status(400).json({ success: false, message: 'reported must be 1d, 7d or 30d' });
    }
    filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }
  if (sort !== 'newest' && sort !== 'oldest') {
    return res.status(400).json({ success: false, message: 'sort must be newest or oldest' });
  }

  const items = await Item.find(filter)
    .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
    .populate('reportedBy', 'name profileImage');
  res.json({ success: true, data: { items } });
});

// GET /api/items/stats — numbers shown on the student Home screen.
router.get('/stats', async (_req, res) => {
  const [activeLost, activeFound, recovered] = await Promise.all([
    Item.countDocuments({ status: 'ACTIVE', type: 'LOST' }),
    Item.countDocuments({ status: 'ACTIVE', type: 'FOUND' }),
    Item.countDocuments({ status: 'RECOVERED' }),
  ]);
  res.json({ success: true, data: { stats: { activeLost, activeFound, recovered } } });
});

// GET /api/items/my — every report created by the logged-in user (ACTIVE and RECOVERED),
// with the number of pending claims on each so the reporter knows what needs review.
// Declared before "/:id" so "my" and "stats" are not treated as ids.
router.get('/my', async (req, res) => {
  const items = await Item.find({ reportedBy: req.user!._id })
    .select('+claims')
    .sort({ createdAt: -1 })
    .populate('reportedBy', 'name profileImage');

  const result = items.map((item) => {
    const { claims, ...rest } = item.toObject();
    return { ...rest, pendingClaimCount: claims.filter((claim) => claim.status === 'PENDING').length };
  });
  res.json({ success: true, data: { items: result } });
});

// GET /api/items/:id — one report with the reporter's name and email (for "Contact Reporter").
// Claim details are NOT included. Instead the response says:
//   myClaim           — the viewer's own claim on this item (status only), if any
//   pendingClaimCount — number of pending claims, only when the viewer is the reporter
router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item id' });
  }
  const item = await Item.findById(req.params.id).select('+claims').populate('reportedBy', REPORTER_FIELDS);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  const { claims, ...publicItem } = item.toObject();
  const viewerId = req.user!._id.toString();
  const ownClaim = claims.find((claim) => claim.claimedBy.toString() === viewerId);
  const viewerIsReporter = item.reportedBy?._id.toString() === viewerId;

  res.json({
    success: true,
    data: {
      item: publicItem,
      myClaim: ownClaim
        ? {
            _id: ownClaim._id,
            status: ownClaim.status,
            rejectionReason: ownClaim.rejectionReason ?? null,
            createdAt: ownClaim.createdAt,
            updatedAt: ownClaim.updatedAt,
          }
        : null,
      pendingClaimCount: viewerIsReporter ? claims.filter((claim) => claim.status === 'PENDING').length : null,
    },
  });
});

/** Sends a report to the app without internal fields (claims, submissionHash). */
function reportResponse(item: InstanceType<typeof Item>) {
  const { claims: _claims, submissionHash: _hash, ...rest } = item.toObject();
  return rest;
}

/**
 * POST /api/items — multipart/form-data with the fields below, an optional "image" file and
 * an optional "submissionId" (idempotency key).
 *
 * Idempotency (no duplicate reports):
 *   The app creates one random submissionId per report form and sends it with every attempt.
 *   If the first attempt was saved but the phone never got the answer (timeout, lost signal),
 *   the retry carries the same id, and this route returns the report that already exists
 *   instead of creating a second one.
 *   - A unique MongoDB index on (reportedBy, submissionId) is the real guarantee: even two
 *     requests arriving at the same moment cannot both insert. The loser gets a duplicate-key
 *     error (code 11000), deletes the photo it had just uploaded, and returns the winner's report.
 *   - submissionHash is a fingerprint of the submitted details. If the same id comes back with
 *     different details, the app is told (409) instead of silently ignoring the changes.
 */
router.post('/', parseImage, async (req, res) => {
  const title = asString(req.body?.title);
  const type = asString(req.body?.type).toUpperCase();
  const category = asString(req.body?.category);
  const description = asString(req.body?.description);
  const location = asString(req.body?.location);
  const date = new Date(asString(req.body?.date));
  const submissionId = asString(req.body?.submissionId) || undefined;
  const reporterId = req.user!._id;

  if (submissionId && !REQUEST_ID_PATTERN.test(submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid submission id' });
  }
  if (title.length < 2 || title.length > 80) {
    return res.status(400).json({ success: false, message: 'Item name must be between 2 and 80 characters' });
  }
  if (!isItemType(type)) {
    return res.status(400).json({ success: false, message: 'type must be LOST or FOUND' });
  }
  if (!isItemCategory(category)) {
    return res.status(400).json({ success: false, message: 'Please choose a valid category' });
  }
  // Description and location are required for FOUND items and optional for LOST items.
  // When given, they must still have a sensible length.
  const detailsRequired = type === 'FOUND';
  if ((detailsRequired || description) && (description.length < 5 || description.length > 1000)) {
    return res
      .status(400)
      .json({ success: false, message: 'Description must be between 5 and 1000 characters' });
  }
  if ((detailsRequired || location) && (location.length < 2 || location.length > 120)) {
    return res.status(400).json({ success: false, message: 'Location must be between 2 and 120 characters' });
  }
  // Allow up to one day ahead to tolerate phone/server timezone differences.
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return res.status(400).json({ success: false, message: 'Please enter a valid date that is not in the future' });
  }

  // Fingerprint of everything that was submitted, including the photo's bytes.
  const submissionHash = createHash('sha256')
    .update(JSON.stringify([title, type, category, description, location, date.toISOString()]))
    .update(req.file ? createHash('sha256').update(req.file.buffer).digest('hex') : 'no-image')
    .digest('hex');

  /** Answer for a repeated submissionId: the original report, or 409 if the details differ. */
  async function replyWithExisting(existing: InstanceType<typeof Item>) {
    await existing.populate('reportedBy', 'name profileImage');
    if (existing.submissionHash !== submissionHash) {
      return res.status(409).json({
        success: false,
        code: 'SUBMISSION_CONFLICT',
        message:
          'Your earlier attempt was already saved with the previous details. Open your report and delete it if you want to report again.',
        data: { item: reportResponse(existing) },
      });
    }
    return res.status(200).json({
      success: true,
      message: 'This report was already saved. No duplicate was created.',
      data: { item: reportResponse(existing), alreadySaved: true },
    });
  }

  // Quick path for a retry: if this submission was already saved, answer straight away
  // (this also avoids uploading the same photo to Cloudinary twice).
  if (submissionId) {
    const existing = await Item.findOne({ reportedBy: reporterId, submissionId }).select('+submissionHash');
    if (existing) return replyWithExisting(existing);
  }

  const upload = await uploadRequestImage(req.file, 'item');
  if (upload.error) {
    return res.status(upload.error.status).json({ success: false, message: upload.error.message });
  }

  let item: InstanceType<typeof Item>;
  try {
    item = await Item.create({
      title,
      type,
      category,
      description: description || undefined,
      location: location || undefined,
      date,
      imageUrl: upload.image?.url,
      imagePublicId: upload.image?.publicId,
      reportedBy: reporterId,
      status: 'ACTIVE',
      submissionId,
      submissionHash: submissionId ? submissionHash : undefined,
    });
  } catch (error) {
    // The report was not saved by this request, so the photo this request just uploaded is
    // not referenced by any item. Delete it so it does not stay orphaned on Cloudinary.
    await deleteImage(upload.image?.publicId);
    const isDuplicate = (error as { code?: number })?.code === 11000;
    if (isDuplicate && submissionId) {
      // Another request with the same submissionId was saved a moment earlier.
      const existing = await Item.findOne({ reportedBy: reporterId, submissionId }).select('+submissionHash');
      if (existing) return replyWithExisting(existing);
    }
    throw error;
  }

  await item.populate('reportedBy', 'name profileImage');
  res.status(201).json({
    success: true,
    message: type === 'LOST' ? 'Lost item reported successfully' : 'Found item reported successfully',
    data: { item: reportResponse(item) },
  });
});

// PATCH /api/items/:id/status — reporter only. Body: { "status": "RECOVERED" }
// For LOST items: the owner marks their own lost item as recovered once they have it back.
// FOUND items become RECOVERED only when the reporter approves a claim (see claimRoutes).
router.patch('/:id/status', async (req, res) => {
  const status = asString(req.body?.status).toUpperCase();
  if (status !== 'RECOVERED') {
    return res.status(400).json({ success: false, message: 'status must be RECOVERED' });
  }
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item id' });
  }

  const item = await Item.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  if (!isOwner(req, item.reportedBy)) {
    return res.status(403).json({ success: false, message: 'You can only update your own reports' });
  }
  if (item.type !== 'LOST') {
    return res
      .status(400)
      .json({ success: false, message: 'Found items are marked as recovered by approving a claim' });
  }
  if (item.status === 'RECOVERED') {
    return res.status(409).json({ success: false, message: 'This item is already marked as recovered' });
  }

  item.status = 'RECOVERED';
  await item.save();
  await item.populate('reportedBy', 'name profileImage');

  res.json({ success: true, message: 'Report marked as RECOVERED', data: { item } });
});

// DELETE /api/items/:id — reporter only (admins use /api/admin/items/:id).
// Recovered reports are kept as history, so only ACTIVE reports can be deleted by students.
router.delete('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item id' });
  }
  const item = await Item.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  if (!isOwner(req, item.reportedBy)) {
    return res.status(403).json({ success: false, message: 'You can only delete your own reports' });
  }
  if (item.status === 'RECOVERED') {
    return res
      .status(409)
      .json({ success: false, message: 'Recovered reports are kept as a record and cannot be deleted' });
  }

  await item.deleteOne();
  await deleteImage(item.imagePublicId);

  res.json({ success: true, message: 'Report deleted' });
});

export default router;
