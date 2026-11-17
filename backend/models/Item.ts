import { Schema, model, InferSchemaType } from 'mongoose';

export const ITEM_TYPES = ['LOST', 'FOUND'] as const;
export const ITEM_STATUSES = ['ACTIVE', 'RECOVERED'] as const;
export const CLAIM_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const ITEM_CATEGORIES = [
  'Electronics',
  'Identity Cards',
  'Wallets',
  'Bags',
  'Books',
  'Clothing',
  'Accessories',
  'Keys',
  'Other',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

// Validation helpers that also tell TypeScript the string is one of the allowed values.
export const isItemType = (value: string): value is ItemType =>
  (ITEM_TYPES as readonly string[]).includes(value);
export const isItemCategory = (value: string): value is ItemCategory =>
  (ITEM_CATEGORIES as readonly string[]).includes(value);
export const isClaimStatus = (value: string): value is ClaimStatus =>
  (CLAIM_STATUSES as readonly string[]).includes(value);

/**
 * A claim is a request by a student who believes a FOUND item is theirs.
 * Claims are embedded inside the item document (there is no separate claims collection).
 */
const claimSchema = new Schema(
  {
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Private: only the claimant and the item's reporter can see this.
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: CLAIM_STATUSES, default: 'PENDING' },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
    // Random id the app creates once per claim form. Re-sending the same id (after a timeout)
    // returns this claim instead of adding another one. See POST /api/items/:id/claims.
    requestId: { type: String, maxlength: 64 },
  },
  { timestamps: true }
);

const itemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    type: { type: String, enum: ITEM_TYPES, required: true },
    category: { type: String, enum: ITEM_CATEGORIES, required: true },
    // Required for FOUND items, optional for LOST items (the owner may not know where it was lost).
    // The rule is checked in the POST /api/items route.
    description: { type: String, trim: true, maxlength: 1000 },
    location: { type: String, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ITEM_STATUSES, default: 'ACTIVE' },
    // select: false means claims are never included in item responses unless a route
    // explicitly asks for them with .select('+claims'). This keeps claim details private.
    claims: { type: [claimSchema], default: [], select: false },
    // Idempotency key: a random id the app creates once per report form. If the same id is
    // sent again (e.g. the user retries after a timeout), the existing report is returned
    // instead of creating a duplicate. Guaranteed by the unique index below.
    submissionId: { type: String, maxlength: 64 },
    // Fingerprint of what was submitted with that id, to detect the same id being reused
    // for different details. Internal only, never sent to the app.
    submissionHash: { type: String, select: false },
  },
  { timestamps: true }
);

// Browse/Home: active items filtered by type, newest first.
itemSchema.index({ status: 1, type: 1, createdAt: -1 });
// My Reports: a user's own items, newest first.
itemSchema.index({ reportedBy: 1, createdAt: -1 });
// My Claims: items a user has claimed.
itemSchema.index({ 'claims.claimedBy': 1 });
// Report idempotency: one item per (reporter, submissionId). The index is "partial", so it only
// covers documents that have a submissionId. Reports created before this field existed are ignored.
itemSchema.index(
  { reportedBy: 1, submissionId: 1 },
  { unique: true, partialFilterExpression: { submissionId: { $type: 'string' } } }
);

export type ItemFields = InferSchemaType<typeof itemSchema>;

export const Item = model('Item', itemSchema);
