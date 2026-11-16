import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, colors, radius } from '@/constants';

interface StatCardProps {
  label: string;
  value: number | null; // null while loading
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string; // light version of `color` for the icon bubble
}

/** A small number tile, used on the Home screen and the Admin dashboard. */
export default function StatCard({ label, value, icon, color, soft }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.value, { color }]}>{value ?? '–'}</Text>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    ...cardShadow,
  },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
