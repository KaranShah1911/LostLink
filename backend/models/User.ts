import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

export const USER_ROLES = ['STUDENT', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** The five colour themes the app offers. The mobile app has the matching colour sets. */
export const THEME_IDS = ['vjti', 'ocean', 'sunset', 'lavender', 'forest'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const isThemeId = (value: string): value is ThemeId => (THEME_IDS as readonly string[]).includes(value);

export const NOTIFICATION_TYPES = [
  'CLAIM_RECEIVED', // someone claimed an item you found
  'CLAIM_APPROVED', // your claim was approved
  'CLAIM_REJECTED', // your claim was rejected by the finder
  'CLAIM_CLOSED', // your claim was closed because another claim was approved
  'REPORT_REMOVED', // an administrator removed your report
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Only the newest notifications are kept, so a user document never grows without limit. */
export const MAX_NOTIFICATIONS = 50;

/**
 * An in-app notification, embedded in the user it belongs to (there is no notifications collection).
 * relatedItem / relatedClaim let the app open the right screen when it is tapped.
 */
const notificationSchema = new Schema(
  {
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 300 },
    relatedItem: { type: Schema.Types.ObjectId, ref: 'Item' },
    relatedClaim: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

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
    // The colour theme the user picked in Profile (saved so it follows them to any phone).
    selectedTheme: { type: String, enum: THEME_IDS, default: 'vjti' },
    // select: false keeps notifications out of normal user queries; only the notification routes load them.
    notifications: { type: [notificationSchema], default: [], select: false },
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
    selectedTheme: user.selectedTheme ?? 'vjti',
    createdAt: user.createdAt,
  };
}

export const User = model('User', userSchema);
