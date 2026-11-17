import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants';
import HeaderAvatar from './HeaderAvatar';

/** Right side of every tab header: the notification bell (students) and the profile avatar. */
export default function HeaderActions({ showBell }: { showBell: boolean }) {
  const { colors, styles } = useTheme(makeStyles);
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.row}>
      {showBell && (
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          style={({ pressed }) => [styles.bell, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name={unreadCount ? 'notifications' : 'notifications-outline'} size={24} color={colors.white} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      )}
      <HeaderAvatar />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bell: { padding: 6 },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.coral,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  });
