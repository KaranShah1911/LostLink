import { useState } from 'react';
import { Alert } from 'react-native';
import { claimsApi, getErrorMessage } from './api';
import type { Claim } from '@/types';

/**
 * Approve / reject logic shared by the Claims Received list and the Item Details screen.
 * `onReviewed` reloads the screen's data afterwards (also after an error, because the
 * claim may have been processed in the meantime).
 */
export function useClaimReview(onReviewed: () => void) {
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);

  function approve(itemId: string, claim: Claim) {
    const name = claim.claimedBy?.name ?? 'this student';
    Alert.alert(
      'Approve this claim?',
      `${name} will be recorded as the owner. The item will be marked RECOVERED and any other pending claims will be closed automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setBusyClaimId(claim._id);
            try {
              const message = await claimsApi.approve(itemId, claim._id);
              Alert.alert('Claim approved', `${message}\n\nUse "Email Claimant" to arrange the hand-over.`);
            } catch (error) {
              Alert.alert('Could not approve claim', getErrorMessage(error));
            } finally {
              setBusyClaimId(null);
              onReviewed();
            }
          },
        },
      ]
    );
  }

  async function reject(itemId: string, claim: Claim, reason: string) {
    setBusyClaimId(claim._id);
    try {
      const message = await claimsApi.reject(itemId, claim._id, reason);
      Alert.alert('Claim rejected', message);
    } catch (error) {
      Alert.alert('Could not reject claim', getErrorMessage(error));
    } finally {
      setBusyClaimId(null);
      onReviewed();
    }
  }

  return { busyClaimId, approve, reject };
}
