import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, radius, ThemeColors } from '@/constants';

/**
 * Covers a form while it is being submitted. It sits on top of every field and button,
 * so nothing on the form can be tapped, edited or removed until the server has answered.
 */
export default function SubmittingOverlay({ visible, title, message }: { visible: boolean; title: string; message: string }) {
  const { colors, styles } = useTheme(makeStyles);
  if (!visible) return null;
  return (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLiveRegion="polite">
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      zIndex: 10,
      elevation: 10,
    },
    card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24, alignItems: 'center', maxWidth: 320, ...cardShadow },
    title: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 14, textAlign: 'center' },
    message: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  });
