import { useState } from 'react';
import { Alert } from 'react-native';
import { adminApi, getErrorMessage } from './api';
import type { Item } from '@/types';

/** Confirm-and-delete for admin moderation, shared by the Dashboard and All Reports tabs. */
export function useAdminDelete(onDeleted: () => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function confirmDelete(item: Item) {
    Alert.alert(
      'Remove report?',
      `Delete "${item.title}" reported by ${item.reportedBy?.name ?? 'unknown'}? This also removes any claims on it and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item._id);
            try {
              await adminApi.remove(item._id);
              onDeleted();
            } catch (err) {
              Alert.alert('Could not delete', getErrorMessage(err));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  return { deletingId, confirmDelete };
}
