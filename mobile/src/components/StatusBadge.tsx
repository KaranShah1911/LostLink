import { StyleSheet, Text, View } from 'react-native';
import { radius, STATUS_COLORS, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

/** Coloured pill for an item type, item status or claim status. Colours come from STATUS_COLORS. */
export default function StatusBadge({ label }: { label: keyof typeof STATUS_COLORS }) {
  const { styles } = useTheme(makeStyles);
  const { bg, fg } = STATUS_COLORS[label];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
    text: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  });
