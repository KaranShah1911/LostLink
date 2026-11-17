import { Types } from 'mongoose';
import { MAX_NOTIFICATIONS, NotificationType, User } from '../models/User';

interface NewNotification {
  type: NotificationType;
  title: string;
  message: string;
  relatedItem?: Types.ObjectId | string;
  relatedClaim?: Types.ObjectId | string;
}

/**
 * Adds an in-app notification to one user's embedded notifications list.
 * $slice keeps only the newest MAX_NOTIFICATIONS entries.
 *
 * Notifications are created only by the backend, right after the event really happened
 * (claim submitted, approved, rejected, report removed). Each of those events can only
 * happen once per claim/item, because the database updates behind them are conditional,
 * so the same notification is never created twice.
 *
 * A failure here is logged but never breaks the main action.
 */
export async function notify(userId: Types.ObjectId | string, notification: NewNotification): Promise<void> {
  try {
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          notifications: {
            $each: [{ ...notification, isRead: false, createdAt: new Date() }],
            $slice: -MAX_NOTIFICATIONS,
          },
        },
      }
    );
  } catch (error) {
    console.error('Could not save notification', error);
  }
}
