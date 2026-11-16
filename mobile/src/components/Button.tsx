import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants';

type Variant = 'primary' | 'teal' | 'coral' | 'success' | 'purple' | 'danger' | 'outline' | 'dangerOutline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

const looks: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.navy, fg: colors.white },
  teal: { bg: colors.teal, fg: colors.white },
  coral: { bg: colors.coral, fg: colors.white },
  success: { bg: colors.green, fg: colors.white },
  purple: { bg: colors.purple, fg: colors.white },
  danger: { bg: colors.red, fg: colors.white },
  outline: { bg: colors.white, fg: colors.navy, border: colors.border },
  dangerOutline: { bg: colors.white, fg: colors.red, border: '#F9B4B4' },
};

/** The app's only button. `loading` shows a spinner and blocks repeated taps. */
export default function Button({ title, onPress, variant = 'primary', icon, loading, disabled, small, style }: ButtonProps) {
  const look = looks[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: look.bg },
        look.border && { borderWidth: 1.5, borderColor: look.border },
        (pressed || isDisabled) && { opacity: isDisabled ? 0.55 : 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={small ? 16 : 20} color={look.fg} />}
          <Text style={[styles.text, small && styles.smallText, { color: look.fg }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 40, paddingHorizontal: 12, borderRadius: radius.sm },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 16, fontWeight: '700' },
  smallText: { fontSize: 14 },
});
