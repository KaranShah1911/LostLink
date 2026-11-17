import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { radius, ThemeColors } from '@/constants';

/** LostLink logo, name and tagline shown above the Login and Sign up forms. */
export default function AuthBrand({ compact }: { compact?: boolean }) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={[styles.brandBlock, compact && { paddingVertical: 12 }]}>
      <View style={[styles.logo, compact && { width: 52, height: 52, borderRadius: 16 }]}>
        <Ionicons name="link" size={compact ? 26 : 32} color={colors.white} />
      </View>
      <Text style={[styles.brand, compact && { fontSize: 28 }]}>LostLink</Text>
      <View style={styles.campusChip}>
        <Ionicons name="school" size={13} color={colors.primary} />
        <Text style={styles.campus}>VJTI CAMPUS LOST & FOUND</Text>
      </View>
      {!compact && <Text style={styles.tagline}>Find what matters. Return what belongs.</Text>}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    brandBlock: { alignItems: 'center', paddingVertical: 28 },
    logo: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      borderWidth: 3,
      borderColor: colors.highlight,
    },
    brand: { fontSize: 34, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
    campusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.85)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginTop: 6,
    },
    campus: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.5 },
    tagline: { fontSize: 15, color: colors.text, marginTop: 10, textAlign: 'center', fontWeight: '700' },
  });
