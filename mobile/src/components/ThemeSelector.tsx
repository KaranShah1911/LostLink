import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { radius, THEME_IDS, ThemeColors, THEMES } from '@/constants';

/**
 * Profile → Theme. Each option shows a small preview (header colour, button colours, page colour).
 * Choosing one applies it at once and saves it (see ThemeContext).
 */
export default function ThemeSelector() {
  const { colors, styles, themeId, setTheme } = useTheme(makeStyles);

  return (
    <View style={styles.list}>
      {THEME_IDS.map((id) => {
        const theme = THEMES[id];
        const t = theme.tokens;
        const selected = id === themeId;
        return (
          <Pressable
            key={id}
            onPress={() => setTheme(id)}
            style={({ pressed }) => [styles.option, selected && { borderColor: colors.secondary }, pressed && { opacity: 0.85 }]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${theme.name} theme`}
          >
            {/* Mini preview of the theme: header bar, two "buttons" and the page background. */}
            <View style={[styles.preview, { backgroundColor: t.background }]}>
              <View style={[styles.previewHeader, { backgroundColor: t.primary }]}>
                <View style={[styles.previewDot, { backgroundColor: t.highlight }]} />
              </View>
              <View style={styles.previewBody}>
                <View style={[styles.previewButton, { backgroundColor: t.secondary }]} />
                <View style={[styles.previewButton, { backgroundColor: t.primaryLight, width: 14 }]} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{theme.name}</Text>
              <Text style={styles.description}>{theme.description}</Text>
            </View>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selected ? colors.secondary : colors.border}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: 8 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    preview: { width: 56, height: 44, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    previewHeader: { height: 14, justifyContent: 'center', paddingHorizontal: 5 },
    previewDot: { width: 6, height: 6, borderRadius: 3 },
    previewBody: { flexDirection: 'row', gap: 4, padding: 6, paddingTop: 8 },
    previewButton: { height: 12, width: 24, borderRadius: 4 },
    name: { fontSize: 15, fontWeight: '700', color: colors.text },
    description: { fontSize: 12, color: colors.muted, marginTop: 2 },
  });
