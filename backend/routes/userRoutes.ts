import { Router } from 'express';
import { isThemeId, toPublicUser, User } from '../models/User';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadImage as parseImage } from '../middleware/uploadMiddleware';
import { deleteImage, uploadRequestImage } from '../config/cloudinary';
import { asString, isValidId } from '../utils/validation';

const router = Router();

router.use(requireAuth);

// PATCH /api/users/profile — body: { "name"?: "New Name", "selectedTheme"?: "vjti" | "ocean" | "sunset" | "lavender" | "forest" }
// Only the name and theme can be changed here; email and role are never read from the request.
router.patch('/profile', async (req, res) => {
  const user = req.user!;
  const hasName = req.body?.name !== undefined;
  const hasTheme = req.body?.selectedTheme !== undefined;
  if (!hasName && !hasTheme) {
    return res.status(400).json({ success: false, message: 'Nothing to update' });
  }

  if (hasName) {
    const name = asString(req.body.name);
    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 2 and 60 characters' });
    }
    user.name = name;
  }
  if (hasTheme) {
    const theme = asString(req.body.selectedTheme);
    if (!isThemeId(theme)) {
      return res.status(400).json({ success: false, message: 'Unknown theme' });
    }
    user.selectedTheme = theme;
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated', data: { user: toPublicUser(user) } });
});

// POST /api/users/profile/image — multipart/form-data with the photo in the "image" field.
// Uploads or replaces the profile photo.
router.post('/profile/image', parseImage, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose a photo to upload' });
  }
  const upload = await uploadRequestImage(req.file, 'profile');
  if (upload.error) {
    return res.status(upload.error.status).json({ success: false, message: upload.error.message });
  }

  const user = req.user!;
  const oldPublicId = user.profileImagePublicId;
  user.profileImage = upload.image!.url;
  user.profileImagePublicId = upload.image!.publicId;
  await user.save();
  // Remove the previous photo from Cloudinary so unused images do not pile up.
  await deleteImage(oldPublicId);

  res.json({ success: true, message: 'Profile photo updated', data: { user: toPublicUser(user) } });
});

// DELETE /api/users/profile/image — removes the photo; the app falls back to the default avatar.
router.delete('/profile/image', async (req, res) => {
  const user = req.user!;
  const oldPublicId = user.profileImagePublicId;
  user.profileImage = undefined;
  user.profileImagePublicId = undefined;
  await user.save();
  await deleteImage(oldPublicId);

  res.json({ success: true, message: 'Profile photo removed', data: { user: toPublicUser(user) } });
});

// GET /api/users/notifications — the logged-in user's notifications, newest first, plus the unread count.
router.get('/notifications', async (req, res) => {
  const user = await User.findById(req.user!._id).select('+notifications');
  const notifications = [...(user?.notifications ?? [])].reverse();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, data: { notifications, unreadCount } });
});

// PATCH /api/users/notifications/read-all — mark every notification as read.
// Declared before "/:id/read" so "read-all" is not treated as an id.
router.patch('/notifications/read-all', async (req, res) => {
  await User.updateOne({ _id: req.user!._id }, { $set: { 'notifications.$[].isRead': true } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// PATCH /api/users/notifications/:id/read — mark one notification as read.
router.patch('/notifications/:id/read', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid notification id' });
  }
  // The filter includes the user id, so nobody can touch another user's notifications.
  const result = await User.updateOne(
    { _id: req.user!._id, 'notifications._id': req.params.id },
    { $set: { 'notifications.$.isRead': true } }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, message: 'Notification marked as read' });
});

export default router;
