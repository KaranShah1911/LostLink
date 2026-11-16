import { ColorValue, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants';
import HeaderAvatar from './HeaderAvatar';

type IconName = keyof typeof Ionicons.glyphMap;

/** Look shared by the student and admin tab bars: navy header with the profile avatar on the right. */
export const tabScreenOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '800' as const },
  headerTitleAlign: 'left' as const,
  headerRight: () => <HeaderAvatar />,
  tabBarActiveTintColor: colors.teal,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
  sceneStyle: { backgroundColor: colors.background },
};

/** Outline icon normally, filled icon when the tab is selected. */
export function tabIcon(name: IconName, activeName: IconName) {
  function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={focused ? activeName : name} size={size} color={color as string} />;
  }
  return TabIcon;
}

/** The highlighted coral "+" used for the student's Report tab. */
export function ReportTabIcon() {
  return (
    <View style={styles.report}>
      <Ionicons name="add" size={30} color={colors.white} />
    </View>
  );
}

/** "LostLink" with its logo, shown as the header title on the two landing screens. */
export function BrandTitle({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Ionicons name="link" size={18} color={colors.navy} />
      </View>
      <View>
        <Text style={styles.brand}>LostLink</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  report: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18, // lifts the button above the tab bar
    borderWidth: 4,
    borderColor: colors.white,
    elevation: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 20, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 10, fontWeight: '800', color: colors.turquoise, letterSpacing: 1.5 },
});
