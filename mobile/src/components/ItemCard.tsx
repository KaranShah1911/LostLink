import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, colors, radius, STATUS_COLORS } from '@/constants';
import { formatDate } from '@/lib/format';
import type { Item } from '@/types';
import CategoryIcon, { categoryColor } from './CategoryIcon';
import ItemImage from './ItemImage';
import StatusBadge from './StatusBadge';

interface ItemCardProps {
  item: Item;
  onPress: () => void;
  showStatus?: boolean; // ACTIVE / RECOVERED badge (My Reports, Admin)
  showReporter?: boolean; // "by <name>" line (Browse, Admin)
  children?: ReactNode; // optional action row (My Reports, Admin)
}

export default function ItemCard({ item, onPress, showStatus, showReporter, children }: ItemCardProps) {
  return (
    // The coloured strip on the left repeats the LOST (red) / FOUND (green) colour.
    <View style={[styles.card, { borderLeftColor: STATUS_COLORS[item.type].fg }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
        <ItemImage uri={item.imageUrl} category={item.category} style={styles.image} />
        <View style={styles.info}>
          <View style={styles.badges}>
            <StatusBadge label={item.type} />
            {showStatus && <StatusBadge label={item.status} />}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.meta}>
            <CategoryIcon category={item.category} size={14} />
            <Text style={[styles.category, { color: categoryColor(item.category) }]}>{item.category}</Text>
          </View>
          <Meta icon="location-outline" text={item.location || 'Location not specified'} />
          <Meta icon="calendar-outline" text={formatDate(item.date)} />
          {showReporter && <Meta icon="person-outline" text={`by ${item.reportedBy?.name ?? 'Deleted user'}`} />}
        </View>
      </Pressable>
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 12,
    ...cardShadow,
  },
  row: { flexDirection: 'row', gap: 12 },
  image: { width: 92, height: 92, borderRadius: radius.md },
  info: { flex: 1, gap: 3 },
  badges: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  category: { fontSize: 13, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
