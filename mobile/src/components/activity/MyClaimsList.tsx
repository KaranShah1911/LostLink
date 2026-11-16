import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import ItemImage from '@/components/ItemImage';
import StatusBadge from '@/components/StatusBadge';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { claimsApi } from '@/lib/api';
import { openEmail } from '@/lib/email';
import { formatTimestamp } from '@/lib/format';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, colors, radius, STATUS_COLORS } from '@/constants';
import type { MyClaim } from '@/types';

const STATUS_MESSAGES = {
  PENDING: 'Waiting for the finder to review your claim.',
  APPROVED: 'The finder approved your ownership claim. Email them to arrange the hand-over.',
  REJECTED: 'Your claim was not accepted.',
};

/** My Activity → My Claims: claims I submitted and what happened to them. */
export default function MyClaimsList() {
  const fetchMine = useCallback(() => claimsApi.mine(), []);
  const { data: claims, loading, error, refreshing, refresh, retry } = useFocusData(fetchMine);

  if (loading) return <Loading />;
  if (error && !claims) return <ErrorState message={error} onRetry={retry} />;

  return (
    <FlatList
      data={claims ?? []}
      keyExtractor={(claim) => claim._id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.purple]} />}
      ListEmptyComponent={
        <EmptyState
          icon="ribbon-outline"
          title="No claims submitted"
          message="You haven't submitted any claims yet."
          actionLabel="Browse found items"
          onAction={() => router.push('/browse')}
          color={colors.purple}
          soft={colors.purpleSoft}
        />
      }
      renderItem={({ item: claim }) => <MyClaimCard claim={claim} />}
    />
  );
}

function MyClaimCard({ claim }: { claim: MyClaim }) {
  const finder = claim.item.reportedBy;
  const statusColor = STATUS_COLORS[claim.status];

  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(`/item/${claim.item._id}`)} style={styles.row}>
        <ItemImage uri={claim.item.imageUrl} category={claim.item.category} style={styles.thumb} iconSize={28} />
        <View style={{ flex: 1, gap: 3 }}>
          <StatusBadge label={claim.status} />
          <Text style={styles.title} numberOfLines={1}>
            {claim.item.title}
          </Text>
          <Text style={styles.meta}>Claimed on {formatTimestamp(claim.createdAt)}</Text>
        </View>
      </Pressable>

      <View style={[styles.message, { backgroundColor: statusColor.bg }]}>
        <Text style={styles.messageText}>{STATUS_MESSAGES[claim.status]}</Text>
        {claim.status === 'REJECTED' && !!claim.rejectionReason && (
          <Text style={[styles.messageText, styles.reason]}>Reason: {claim.rejectionReason}</Text>
        )}
      </View>

      {claim.status === 'APPROVED' && finder?.email && (
        <Button
          title={`Email ${finder.name.split(' ')[0]}`}
          icon="mail-outline"
          variant="success"
          small
          style={{ marginTop: 10 }}
          onPress={() =>
            openEmail(
              finder.email!,
              `LostLink: collecting "${claim.item.title}"`,
              `Hi ${finder.name},\n\nThank you for approving my claim for "${claim.item.title}" on LostLink. When and where can I collect it?\n\n`
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
    padding: 12,
    marginBottom: 12,
    ...cardShadow,
  },
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  message: { marginTop: 12, padding: 10, borderRadius: radius.sm },
  messageText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  reason: { marginTop: 4, fontWeight: '700' },
});
