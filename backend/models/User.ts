import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

export const USER_ROLES = ['STUDENT', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Always a bcrypt hash, never the plain password.
    // select: false keeps it out of every query unless explicitly requested with .select('+password').
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'STUDENT' },
    // Optional profile photo stored on Cloudinary. The public id is kept so the old photo can be deleted.
    profileImage: { type: String },
    profileImagePublicId: { type: String },
  },
  { timestamps: true }
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserFields>;

/** The only user fields ever sent to the mobile app. */
export function toPublicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage ?? null,
    createdAt: user.createdAt,
  };
}

export const User = model('User', userSchema);
