import multer from 'multer';

export const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Keeps the uploaded image in memory (no temp files) so it can be streamed
 * straight to Cloudinary. Accepts one optional file in the "image" field.
 */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
    }
  },
}).single('image');
