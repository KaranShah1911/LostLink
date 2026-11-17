import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

interface StatCardProps {
  label: string;
  value: number | null; // null while loading
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string; // light version of `color` for the icon bubble
  compact?: boolean; // icon above the number, for three cards in a row (Home)
}

/** A small number tile, used on the Home screen and the Admin dashboard. */
export default function StatCard({ label, value, icon, color, soft, compact }: StatCardProps) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={compact ? undefined : { flex: 1 }}>
        <Text style={[styles.value, { color }]}>{value ?? '–'}</Text>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    compact: { minWidth: 90, flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 12 },
    icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: 24, fontWeight: '800' },
    label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  });
