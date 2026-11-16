import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';

/** Item photos and profile photos go into separate folders on Cloudinary. */
export type ImageKind = 'item' | 'profile';

const UPLOAD_OPTIONS: Record<ImageKind, UploadApiOptions> = {
  item: { folder: 'lostlink/items' },
  // Profile photos are cropped to a 400x400 square around the face to keep them small.
  profile: {
    folder: 'lostlink/profiles',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
};

let configured = false;

/** Reads Cloudinary credentials from the environment. Call once at startup. */
export function configureCloudinary(): void {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    configured = false;
    console.warn('Cloudinary credentials are missing. Everything except photo uploads will still work.');
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return configured;
}

/** Uploads an in-memory image buffer and returns its secure URL and public ID. */
export function uploadImage(buffer: Buffer, kind: ImageKind): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...UPLOAD_OPTIONS[kind], resource_type: 'image' },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary returned no result'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Uploads the image attached to a request, if there is one.
 * Returns undefined when no file was sent, or an error message the route can send back.
 */
export async function uploadRequestImage(
  file: Express.Multer.File | undefined,
  kind: ImageKind
): Promise<{ image?: { url: string; publicId: string }; error?: { status: number; message: string } }> {
  if (!file) return {};
  if (!configured) {
    return {
      error: { status: 503, message: 'Photo uploads are not configured on the server. Try again without a photo.' },
    };
  }
  try {
    return { image: await uploadImage(file.buffer, kind) };
  } catch (error) {
    console.error('Cloudinary upload failed', error);
    return { error: { status: 502, message: 'Photo upload failed. Please try again' } };
  }
}

/** Deletes an image. Failures are logged, not thrown, so the main action never fails because of it. */
export async function deleteImage(publicId?: string | null): Promise<void> {
  if (!publicId || !configured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete Cloudinary image', publicId, error);
  }
}
