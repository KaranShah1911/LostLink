import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import ClaimCard from '@/components/ClaimCard';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { claimsApi } from '@/lib/api';
import { useClaimReview } from '@/lib/useClaimReview';
import { useFocusData } from '@/lib/useFocusData';
import { ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import KeyboardAvoider from '@/components/KeyboardAvoider';

/** My Activity → Claims Received: claims on FOUND items I reported, which only I can approve or reject. */
export default function ClaimsReceivedList() {
  const { colors, styles } = useTheme(makeStyles);
  const fetchReceived = useCallback(() => claimsApi.received(), []);
  const { data: claims, loading, error, refreshing, refresh, retry } = useFocusData(fetchReceived);
  const { busyClaimId, approve, reject } = useClaimReview(refresh);

  if (loading) return <Loading />;
  if (error && !claims) return <ErrorState message={error} onRetry={retry} />;

  return (
    // Keeps the rejection note above the keyboard.
    <KeyboardAvoider>
    <FlatList
      data={claims ?? []}
      keyExtractor={(claim) => claim._id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.purple]} />}
      ListEmptyComponent={
        <EmptyState
          icon="hand-left-outline"
          title="No claims received"
          message="No one has claimed your reported items yet."
          color={colors.purple}
          soft={colors.purpleSoft}
        />
      }
      renderItem={({ item: claim }) => (
        <ClaimCard
          claim={claim}
          itemTitle={claim.item.title}
          item={{
            imageUrl: claim.item.imageUrl,
            category: claim.item.category,
            onPress: () => router.push(`/item/${claim.item._id}`),
          }}
          canReview={claim.status === 'PENDING' && claim.item.status === 'ACTIVE'}
          busy={busyClaimId === claim._id}
          onApprove={() => approve(claim.item._id, claim)}
          onReject={(reason) => reject(claim.item._id, claim, reason)}
        />
      )}
    />
    </KeyboardAvoider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { padding: 16, flexGrow: 1 },
  });
