import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, toPublicUser } from '../models/User';
import { requireAuth, signToken } from '../middleware/authMiddleware';
import { uploadImage as parseImage } from '../middleware/uploadMiddleware';
import { uploadRequestImage } from '../config/cloudinary';
import { asString, EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from '../utils/validation';

const router = Router();

// POST /api/auth/register — creates a STUDENT account. Admins come only from the seed script.
// Accepts JSON, or multipart/form-data when an optional profile photo is sent in the "image" field.
router.post('/register', parseImage, async (req, res) => {
  const name = asString(req.body?.name);
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const confirmPassword = req.body?.confirmPassword;

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ success: false, message: 'Name must be between 2 and 60 characters' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  if (await User.exists({ email })) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  // Upload the optional photo only after every other check has passed.
  const upload = await uploadRequestImage(req.file, 'profile');
  if (upload.error) {
    return res.status(upload.error.status).json({ success: false, message: upload.error.message });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // role is never read from the request body, so nobody can register as an admin.
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'STUDENT',
    profileImage: upload.image?.url,
    profileImagePublicId: upload.image?.publicId,
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { token: signToken(user._id.toString()), user: toPublicUser(user) },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: { token: signToken(user._id.toString()), user: toPublicUser(user) },
  });
});

// GET /api/auth/me — returns the logged-in user (used to restore a session on app start).
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: { user: toPublicUser(req.user!) } });
});

export default router;
