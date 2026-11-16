import { Router, Request } from 'express';
import { Item, isItemCategory, isItemType } from '../models/Item';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadImage as parseImage } from '../middleware/uploadMiddleware';
import { deleteImage, uploadRequestImage } from '../config/cloudinary';
import { asString, isValidId } from '../utils/validation';

const router = Router();

// Every item route needs a logged-in user.
router.use(requireAuth);

// Reporter fields that may be shown to other students. Never the password.
const REPORTER_FIELDS = 'name email profileImage';

function isOwner(req: Request, reportedBy: unknown): boolean {
  return String(reportedBy) === req.user!._id.toString();
}

// GET /api/items?type=ALL|LOST|FOUND — ACTIVE reports only, newest first.
// Recovered items stay in the database but are not listed here. Claims are never included.
router.get('/', async (req, res) => {
  const type = asString(req.query.type).toUpperCase();
  const filter: Record<string, string> = { status: 'ACTIVE' };

  if (type && type !== 'ALL') {
    if (!isItemType(type)) {
      return res.status(400).json({ success: false, message: 'type must be ALL, LOST or FOUND' });
    }
    filter.type = type;
  }

  const items = await Item.find(filter).sort({ createdAt: -1 }).populate('reportedBy', 'name profileImage');
  res.json({ success: true, data: { items } });
});

// GET /api/items/my — every report created by the logged-in user (ACTIVE and RECOVERED),
// with the number of pending claims on each so the reporter knows what needs review.
// Declared before "/:id" so "my" is not treated as an id.
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
          }
        : null,
      pendingClaimCount: viewerIsReporter ? claims.filter((claim) => claim.status === 'PENDING').length : null,
    },
  });
});

// POST /api/items — multipart/form-data with the fields below and an optional "image" file.
router.post('/', parseImage, async (req, res) => {
  const title = asString(req.body?.title);
  const type = asString(req.body?.type).toUpperCase();
  const category = asString(req.body?.category);
  const description = asString(req.body?.description);
  const location = asString(req.body?.location);
  const date = new Date(asString(req.body?.date));

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

  const upload = await uploadRequestImage(req.file, 'item');
  if (upload.error) {
    return res.status(upload.error.status).json({ success: false, message: upload.error.message });
  }

  const item = await Item.create({
    title,
    type,
    category,
    description: description || undefined,
    location: location || undefined,
    date,
    imageUrl: upload.image?.url,
    imagePublicId: upload.image?.publicId,
    reportedBy: req.user!._id,
    status: 'ACTIVE',
  });
  await item.populate('reportedBy', 'name profileImage');

  const { claims: _claims, ...created } = item.toObject();
  res.status(201).json({
    success: true,
    message: type === 'LOST' ? 'Lost item reported successfully' : 'Found item reported successfully',
    data: { item: created },
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
