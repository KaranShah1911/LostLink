import type { ThemeId } from '@/constants';

export type UserRole = 'STUDENT' | 'ADMIN';
export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'ACTIVE' | 'RECOVERED';
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage: string | null;
  selectedTheme: ThemeId;
  createdAt: string;
}

/** A user as it appears inside an item or claim (reporter or claimant). */
export interface Person {
  _id: string;
  name: string;
  email?: string;
  profileImage?: string | null;
}

export interface Item {
  _id: string;
  title: string;
  type: ItemType;
  category: string;
  description?: string; // optional for LOST items
  location?: string; // optional for LOST items
  date: string;
  imageUrl?: string;
  status: ItemStatus;
  reportedBy: Person | null; // null if the reporter's account was removed
  pendingClaimCount?: number; // only on My Reports
  createdAt: string;
  updatedAt: string;
}

/** GET /items/:id — the item plus the viewer's own claim and, for the reporter, the pending count. */
export interface ItemDetails {
  item: Item;
  myClaim: { _id: string; status: ClaimStatus; rejectionReason: string | null; createdAt: string; updatedAt: string } | null;
  pendingClaimCount: number | null;
}

/** A claim as seen by the item's reporter. */
export interface Claim {
  _id: string;
  claimedBy: Person | null;
  description: string;
  status: ClaimStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Claims Received: a claim plus a summary of the reporter's item it was made on. */
export interface ReceivedClaim extends Claim {
  item: { _id: string; title: string; imageUrl?: string; category: string; status: ItemStatus };
}

/** My Claims: the student's own claim plus a summary of the item. */
export interface MyClaim {
  _id: string;
  description: string;
  status: ClaimStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  item: {
    _id: string;
    title: string;
    imageUrl?: string;
    category: string;
    location?: string;
    status: ItemStatus;
    reportedBy: Person | null;
  };
}

/** Admin moderation view of a claim (no private description). */
export interface AdminClaim {
  _id: string;
  status: ClaimStatus;
  createdAt: string;
  claimedBy: Person | null;
  item: { _id: string; title: string; imageUrl?: string; category: string; status: ItemStatus; reportedBy: Person | null };
}

export interface AdminStats {
  totalUsers: number;
  activeLost: number;
  activeFound: number;
  recovered: number;
  reportsThisWeek: number;
  pendingClaims: number;
}

export interface ItemStats {
  activeLost: number;
  activeFound: number;
  recovered: number;
}

export type NotificationType = 'CLAIM_RECEIVED' | 'CLAIM_APPROVED' | 'CLAIM_REJECTED' | 'CLAIM_CLOSED' | 'REPORT_REMOVED';

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItem?: string;
  relatedClaim?: string;
  isRead: boolean;
  createdAt: string;
}

/** Browse filters. Every field is optional and they can be combined. */
export interface ItemFilters {
  type?: 'ALL' | ItemType;
  category?: string;
  location?: string;
  q?: string;
  reported?: '1d' | '7d' | '30d';
  status?: ItemStatus;
  sort?: 'newest' | 'oldest';
}

/** An image chosen with the image picker, ready to be uploaded. */
export interface PickedImage {
  uri: string;
  name: string;
  mimeType: string;
}
