import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import ClaimCard from '@/components/ClaimCard';
import ItemImage from '@/components/ItemImage';
import StatusBadge from '@/components/StatusBadge';
import { ErrorState, Loading } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { claimsApi, itemsApi } from '@/lib/api';
import { openEmail } from '@/lib/email';
import { formatDate, formatTimestamp } from '@/lib/format';
import { useClaimReview } from '@/lib/useClaimReview';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, colors, radius } from '@/constants';
import type { Claim, ItemDetails } from '@/types';

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  // The reporter of a FOUND item also gets the full list of claims to review.
  // Everyone else only gets the public item plus the status of their own claim (if any).
  const fetchDetails = useCallback(async () => {
    const details = await itemsApi.get(id);
    const viewerIsReporter = details.pendingClaimCount !== null;
    const claims = viewerIsReporter && details.item.type === 'FOUND' ? await claimsApi.forItem(id) : null;
    return { ...details, claims };
  }, [id]);
  const { data, loading, error, refreshing, refresh, retry } = useFocusData(fetchDetails);
  const { busyClaimId, approve, reject } = useClaimReview(refresh);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const { item, claims } = data;
  const isLost = item.type === 'LOST';
  const isActive = item.status === 'ACTIVE';
  const isOwnReport = data.pendingClaimCount !== null;
  const reporter = item.reportedBy;

  function contactReporter() {
    if (!reporter?.email) return;
    openEmail(
      reporter.email,
      `LostLink: ${item.title}`,
      `Hi ${reporter.name},\n\nI saw your ${isLost ? 'lost' : 'found'} item report "${item.title}" on LostLink.\n\n`
    );
  }

  const details: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'pricetag', label: 'Category', value: item.category },
    { icon: 'location', label: isLost ? 'Last seen location' : 'Found location', value: item.location || 'Not specified' },
    { icon: 'calendar', label: isLost ? 'Date lost' : 'Date found', value: formatDate(item.date) },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
    >
      <ItemImage uri={item.imageUrl} category={item.category} style={styles.image} iconSize={64} />

      <View style={styles.badges}>
        <StatusBadge label={item.type} />
        <StatusBadge label={item.status} />
      </View>
      <Text style={styles.title}>{item.title}</Text>

      <View style={styles.card}>
        {details.map((detail, index) => (
          <View key={detail.label} style={[styles.row, index > 0 && styles.rowBorder]}>
            <Ionicons name={detail.icon} size={20} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{detail.label}</Text>
              <Text style={styles.rowValue}>{detail.value}</Text>
            </View>
          </View>
        ))}
        <View style={[styles.row, styles.rowBorder]}>
          <Avatar name={reporter?.name ?? '?'} uri={reporter?.profileImage} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Reported by</Text>
            <Text style={styles.rowValue}>{reporter?.name ?? 'Deleted user'}</Text>
          </View>
          <Text style={styles.rowLabel}>{formatTimestamp(item.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={[styles.description, !item.description && styles.noDescription]}>
        {item.description || 'No description provided.'}
      </Text>

      {isOwnReport ? (
        <OwnReportSection data={data} claims={claims} busyClaimId={busyClaimId} approve={approve} reject={reject} />
      ) : (
        <>
          {data.myClaim && <MyClaimNotice claim={data.myClaim} />}

          {!isActive && !data.myClaim && (
            <Notice icon="checkmark-done-outline" color={colors.green}>
              This item has already been recovered.
            </Notice>
          )}

          {isActive && !isLost && !data.myClaim && user?.role === 'STUDENT' && (
            <Button
              title="Claim This Item"
              icon="hand-left-outline"
              variant="purple"
              onPress={() => router.push(`/claim/${item._id}`)}
              style={{ marginBottom: 10 }}
            />
          )}

          {isActive && reporter?.email && (
            <Button
              title={isLost ? 'I Found This – Contact Owner' : 'Contact Finder'}
              icon="mail-outline"
              variant={isLost ? 'primary' : 'outline'}
              onPress={contactReporter}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

type Review = ReturnType<typeof useClaimReview>;

/** What the reporter sees on their own item: a hint, and for FOUND items the claims to review. */
function OwnReportSection({
  data,
  claims,
  busyClaimId,
  approve,
  reject,
}: { data: ItemDetails; claims: Claim[] | null } & Review) {
  const { item } = data;

  if (item.type === 'LOST') {
    return (
      <Notice icon="information-circle-outline" color={colors.teal}>
        This is your report. Once you get the item back, mark it as recovered from My Activity → My Reports.
      </Notice>
    );
  }

  return (
    <View>
      <View style={styles.claimsHeader}>
        <Text style={styles.sectionTitle}>Claims ({claims?.length ?? 0})</Text>
        {!!data.pendingClaimCount && <StatusBadge label="PENDING" />}
      </View>
      {item.status === 'ACTIVE' && (
        <Text style={styles.claimsHint}>
          Check each description against details only the real owner would know, then approve one claim.
        </Text>
      )}
      {!claims?.length ? (
        <Notice icon="hourglass-outline" color={colors.muted}>
          No one has claimed this item yet. Claims will appear here.
        </Notice>
      ) : (
        claims.map((claim) => (
          <ClaimCard
            key={claim._id}
            claim={claim}
            itemTitle={item.title}
            canReview={claim.status === 'PENDING' && item.status === 'ACTIVE'}
            busy={busyClaimId === claim._id}
            onApprove={() => approve(item._id, claim)}
            onReject={(reason) => reject(item._id, claim, reason)}
          />
        ))
      )}
    </View>
  );
}

/** Shown to a student who has already claimed this item. */
function MyClaimNotice({ claim }: { claim: NonNullable<ItemDetails['myClaim']> }) {
  const text = {
    PENDING: 'You have claimed this item. The person who found it will review your claim.',
    APPROVED: 'Your claim was approved! Contact the finder to arrange the return.',
    REJECTED: `Your claim was rejected.${claim.rejectionReason ? ` Reason: ${claim.rejectionReason}` : ''}`,
  }[claim.status];
  const color = { PENDING: colors.amber, APPROVED: colors.green, REJECTED: colors.red }[claim.status];

  return (
    <View style={[styles.notice, { borderLeftColor: color }]}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.noticeTitle}>Your claim</Text>
          <StatusBadge label={claim.status} />
        </View>
        <Text style={styles.noticeText}>{text}</Text>
      </View>
    </View>
  );
}

function Notice({ icon, color, children }: { icon: keyof typeof Ionicons.glyphMap; color: string; children: string }) {
  return (
    <View style={[styles.notice, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.noticeText, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  image: { width: '100%', height: 260, borderRadius: radius.lg },
  badges: { flexDirection: 'row', gap: 8, marginTop: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, marginBottom: 20, ...cardShadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: 12, color: colors.muted },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  description: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 24 },
  noDescription: { color: colors.muted, fontStyle: 'italic' },
  claimsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  claimsHint: { fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 19 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    marginBottom: 12,
    ...cardShadow,
  },
  noticeTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  noticeText: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
