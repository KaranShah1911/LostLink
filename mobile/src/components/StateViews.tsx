import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, ThemeColors } from '@/constants';
import Button from './Button';
import { useTheme } from '@/context/ThemeContext';
import CampusBackdrop from './CampusBackdrop';

/** Full-area loading indicator. */
export function Loading({ message }: { message?: string }) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.secondary} />
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;
  soft?: string;
  style?: ViewStyle;
}

/** Friendly placeholder for an empty list. With an action it is also used for errors. */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  color,
  soft,
  style,
}: EmptyStateProps) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={[styles.center, style]}>
      <View style={[styles.iconCircle, { backgroundColor: soft ?? colors.secondarySoft }]}>
        <Ionicons name={icon} size={38} color={color ?? colors.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} variant="teal" onPress={onAction} small style={{ marginTop: 16 }} />}
    </View>
  );
}

/** Shown when a screen's data could not be loaded (server down, no internet, no permission). */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors, styles } = useTheme(makeStyles);
  return (
    <View style={styles.errorScreen}>
      <CampusBackdrop />
      <View style={styles.errorCard}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Something went wrong"
          message={message}
          actionLabel="Try again"
          onAction={onRetry}
          color={colors.coral}
          soft={colors.coralSoft}
          style={styles.errorContent}
        />
      </View>
    </View>
  );
}

/** Inline red message box for form/server errors. */
export function ErrorBanner({ message }: { message: string }) {
  const { colors, styles } = useTheme(makeStyles);
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle" size={18} color={colors.red} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 260 },
    iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
    message: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    errorScreen: { flex: 1, justifyContent: 'center', padding: 20, overflow: 'hidden' },
    errorCard: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.xl },
    errorContent: { flex: 0, minHeight: 0, paddingVertical: 28 }, // card grows to fit its content
    banner: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      backgroundColor: colors.redSoft,
      padding: 12,
      borderRadius: radius.sm,
      marginBottom: 16,
    },
    bannerText: { flex: 1, color: colors.red, fontSize: 14 },
  });
