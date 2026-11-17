import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { openEmail } from '@/lib/email';
import { formatTimestamp } from '@/lib/format';
import type { Claim } from '@/types';
import Avatar from './Avatar';
import Button from './Button';
import ItemImage from './ItemImage';
import StatusBadge from './StatusBadge';
import { useTheme } from '@/context/ThemeContext';

interface ClaimCardProps {
  claim: Claim;
  itemTitle: string;
  item?: { imageUrl?: string; category: string; onPress: () => void }; // show an item row (Claims Received list)
  canReview: boolean; // claim is PENDING and the item is still ACTIVE
  busy: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

/** A claim as seen by the item's reporter, with Approve / Reject buttons while it is pending. */
export default function ClaimCard({ claim, itemTitle, item, canReview, busy, onApprove, onReject }: ClaimCardProps) {
  const { colors, styles } = useTheme(makeStyles);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const claimant = claim.claimedBy;

  return (
    <View style={styles.card}>
      {item && (
        <Pressable onPress={item.onPress} style={styles.itemRow}>
          <ItemImage uri={item.imageUrl} category={item.category} style={styles.thumb} iconSize={20} />
          <Text style={styles.itemTitle} numberOfLines={1}>
            {itemTitle}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      )}

      <View style={styles.header}>
        <Avatar name={claimant?.name ?? '?'} uri={claimant?.profileImage} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {claimant?.name ?? 'Deleted user'}
          </Text>
          <Text style={styles.date}>Claimed on {formatTimestamp(claim.createdAt)}</Text>
        </View>
        <StatusBadge label={claim.status} />
      </View>

      <Text style={styles.label}>Why they think it is theirs</Text>
      <Text style={styles.description}>{claim.description}</Text>

      {claim.status === 'REJECTED' && !!claim.rejectionReason && (
        <Text style={styles.reason}>Reason: {claim.rejectionReason}</Text>
      )}

      {claim.status === 'APPROVED' && claimant?.email && (
        <Button
          title="Email Claimant"
          icon="mail-outline"
          variant="success"
          small
          style={styles.topGap}
          onPress={() =>
            openEmail(
              claimant.email!,
              `LostLink: returning "${itemTitle}"`,
              `Hi ${claimant.name},\n\nI have approved your claim for "${itemTitle}" on LostLink. When and where can we meet so I can return it?\n\n`
            )
          }
        />
      )}

      {canReview && !rejecting && (
        <View style={[styles.actions, styles.topGap]}>
          <Button title="Approve Claim" icon="checkmark-circle-outline" variant="success" small loading={busy} disabled={busy} onPress={onApprove} style={{ flex: 1 }} />
          <Button title="Reject" icon="close-circle-outline" variant="dangerOutline" small disabled={busy} onPress={() => setRejecting(true)} style={{ flex: 1 }} />
        </View>
      )}

      {canReview && rejecting && (
        <View style={styles.topGap}>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for rejecting (optional)"
            autoFocus
            editable={!busy}
            placeholderTextColor="#94A3B8"
            maxLength={300}
            multiline
            style={styles.reasonInput}
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" small disabled={busy} onPress={() => setRejecting(false)} style={{ flex: 1 }} />
            <Button
              title="Confirm Reject"
              variant="danger"
              small
              loading={busy}
              disabled={busy}
              onPress={() => onReject(reason.trim())}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.purple, // purple = claims
      padding: 14,
      marginBottom: 12,
      ...cardShadow,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 12,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    thumb: { width: 38, height: 38, borderRadius: radius.sm },
    itemTitle: { flex: 1, fontWeight: '700', color: colors.purple, fontSize: 15 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    name: { fontSize: 15, fontWeight: '700', color: colors.text },
    date: { fontSize: 12, color: colors.muted, marginTop: 2 },
    label: { fontSize: 11, fontWeight: '800', color: colors.purple, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
    description: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      backgroundColor: colors.purpleSoft,
      padding: 10,
      borderRadius: radius.sm,
    },
    reason: { fontSize: 13, color: colors.red, marginTop: 8 },
    actions: { flexDirection: 'row', gap: 8 },
    topGap: { marginTop: 12 },
    reasonInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: 10,
      minHeight: 60,
      textAlignVertical: 'top',
      color: colors.text,
      marginBottom: 8,
      fontSize: 14,
    },
  });
