import { Router } from 'express';
import { toPublicUser } from '../models/User';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadImage as parseImage } from '../middleware/uploadMiddleware';
import { deleteImage, uploadRequestImage } from '../config/cloudinary';
import { asString } from '../utils/validation';

const router = Router();

router.use(requireAuth);

// PATCH /api/users/profile — body: { "name": "New Name" }. Only the name can be changed here;
// email and role are never read from the request.
router.patch('/profile', async (req, res) => {
  const name = asString(req.body?.name);
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ success: false, message: 'Name must be between 2 and 60 characters' });
  }
  const user = req.user!;
  user.name = name;
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

export default router;
