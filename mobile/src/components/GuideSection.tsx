import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, radius, ThemeColors } from '@/constants';

interface GuideSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** A coloured card with an icon and a heading, used by How LostLink Works and Safety Guidelines. */
export default function GuideSection({ icon, color, soft, title, subtitle, children }: GuideSectionProps) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

/** One line in a guide card: a numbered step (number) or a bullet point (no number). */
export function GuideLine({ text, number, color }: { text: string; number?: number; color: string }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.line}>
      {number ? (
        <View style={[styles.number, { backgroundColor: color }]}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
      ) : (
        <Ionicons name="checkmark-circle" size={18} color={color} style={{ marginTop: 1 }} />
      )}
      <Text style={styles.lineText}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderTopWidth: 4,
      padding: 16,
      marginBottom: 14,
      ...cardShadow,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 17, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    line: { flexDirection: 'row', gap: 10, marginBottom: 9, alignItems: 'flex-start' },
    number: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    numberText: { color: colors.white, fontSize: 12, fontWeight: '800' },
    lineText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  });
