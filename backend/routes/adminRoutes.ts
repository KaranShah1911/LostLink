import { Router } from 'express';
import { Item, isClaimStatus } from '../models/Item';
import { User } from '../models/User';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';
import { deleteImage } from '../config/cloudinary';
import { asString, isValidId } from '../utils/validation';

const router = Router();

// The role check happens on the server for every route below, so hiding the admin
// screen in the app is not the only protection.
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard/stats — counts calculated by the database.
router.get('/dashboard/stats', async (_req, res) => {
  const [totalUsers, activeLost, activeFound, recovered] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments({ status: 'ACTIVE', type: 'LOST' }),
    Item.countDocuments({ status: 'ACTIVE', type: 'FOUND' }),
    Item.countDocuments({ status: 'RECOVERED' }),
  ]);
  res.json({ success: true, data: { stats: { totalUsers, activeLost, activeFound, recovered } } });
});

// GET /api/admin/items — every report of every status (claims not included).
router.get('/items', async (_req, res) => {
  const items = await Item.find().sort({ createdAt: -1 }).populate('reportedBy', 'name email profileImage');
  res.json({ success: true, data: { items } });
});

// DELETE /api/admin/items/:id — remove any report (e.g. inappropriate or fraudulent content).
router.delete('/items/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item id' });
  }
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  await deleteImage(item.imagePublicId);
  res.json({ success: true, message: 'Report deleted by admin' });
});

// GET /api/admin/claims?status=PENDING|APPROVED|REJECTED|ALL — read-only list of claims for moderation.
// Defaults to PENDING. The private claim description is not included, and there is no admin
// approve/reject route: only the item's reporter can decide ownership.
router.get('/claims', async (req, res) => {
  const status = asString(req.query.status).toUpperCase() || 'PENDING';
  if (status !== 'ALL' && !isClaimStatus(status)) {
    return res.status(400).json({ success: false, message: 'status must be PENDING, APPROVED, REJECTED or ALL' });
  }

  const items = await Item.find(status === 'ALL' ? { 'claims.0': { $exists: true } } : { 'claims.status': status })
    .select('+claims')
    .populate('reportedBy', 'name email profileImage')
    .populate('claims.claimedBy', 'name email profileImage');

  const claims = items
    .flatMap((item) =>
      item.claims
        .filter((claim) => status === 'ALL' || claim.status === status)
        .map((claim) => ({
          _id: claim._id,
          status: claim.status,
          createdAt: claim.createdAt,
          claimedBy: claim.claimedBy,
          item: {
            _id: item._id,
            title: item.title,
            imageUrl: item.imageUrl,
            category: item.category,
            status: item.status,
            reportedBy: item.reportedBy,
          },
        }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: { claims } });
});

export default router;
