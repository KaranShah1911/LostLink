import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { formatTimestamp } from '@/lib/format';
import type { AdminClaim, Person } from '@/types';
import Avatar from './Avatar';
import ItemImage from './ItemImage';
import StatusBadge from './StatusBadge';
import { useTheme } from '@/context/ThemeContext';

/**
 * A claim as the administrator sees it: who claimed which item, who found it, when, and its status.
 * Read-only: there are no Approve / Reject buttons and the private claim text is not shown.
 */
export default function AdminClaimCard({ claim }: { claim: AdminClaim }) {
  const { styles } = useTheme(makeStyles);
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => router.push(`/item/${claim.item._id}`)}>
      <View style={styles.top}>
        <ItemImage uri={claim.item.imageUrl} category={claim.item.category} style={styles.thumb} iconSize={24} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {claim.item.title}
          </Text>
          <Text style={styles.meta}>Claimed on {formatTimestamp(claim.createdAt)}</Text>
        </View>
        <StatusBadge label={claim.status} />
      </View>
      <View style={styles.people}>
        <PersonCell label="Claimant" person={claim.claimedBy} />
        <PersonCell label="Reporter (finder)" person={claim.item.reportedBy} />
      </View>
    </Pressable>
  );
}

function PersonCell({ label, person }: { label: string; person: Person | null }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.person}>
      <Avatar name={person?.name ?? '?'} uri={person?.profileImage} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.personLabel}>{label}</Text>
        <Text style={styles.personName} numberOfLines={1}>
          {person?.name ?? 'Deleted user'}
        </Text>
        {!!person?.email && (
          <Text style={styles.meta} numberOfLines={1}>
            {person.email}
          </Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.purple,
      padding: 12,
      marginBottom: 12,
      ...cardShadow,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    thumb: { width: 48, height: 48, borderRadius: radius.sm },
    title: { fontSize: 15, fontWeight: '700', color: colors.text },
    meta: { fontSize: 12, color: colors.muted },
    people: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    person: { flex: 1, flexDirection: 'row', gap: 8 },
    personLabel: { fontSize: 10, color: colors.purple, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    personName: { fontSize: 14, fontWeight: '700', color: colors.text },
  });
