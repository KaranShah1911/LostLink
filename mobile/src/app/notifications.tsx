import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationsApi } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';
import type { AppNotification, NotificationType } from '@/types';
import { useBottomPadding } from '@/lib/useBottomPadding';

/** Notifications for the logged-in student (stored in their user document on the server). */
export default function NotificationsScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const { refreshUnread } = useNotifications();
  const fetchNotifications = useCallback(() => notificationsApi.list(), []);
  const { data, setData, loading, error, refreshing, refresh, retry } = useFocusData(fetchNotifications);
  const [markingAll, setMarkingAll] = useState(false);
  const bottomPadding = useBottomPadding(16);

  const looks: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }> = {
    CLAIM_RECEIVED: { icon: 'hand-left', color: colors.purple, soft: colors.purpleSoft },
    CLAIM_APPROVED: { icon: 'checkmark-circle', color: colors.green, soft: colors.greenSoft },
    CLAIM_REJECTED: { icon: 'close-circle', color: colors.red, soft: colors.redSoft },
    CLAIM_CLOSED: { icon: 'lock-closed', color: colors.amber, soft: colors.amberSoft },
    REPORT_REMOVED: { icon: 'trash', color: colors.red, soft: colors.redSoft },
  };

  function markLocallyRead(id?: string) {
    setData((current) =>
      current
        ? {
            notifications: current.notifications.map((n) => (!id || n._id === id ? { ...n, isRead: true } : n)),
            unreadCount: id ? Math.max(0, current.unreadCount - 1) : 0,
          }
        : current
    );
  }

  async function open(notification: AppNotification) {
    if (!notification.isRead) {
      markLocallyRead(notification._id);
      notificationsApi.markRead(notification._id).then(refreshUnread).catch(() => {});
    }
    if (notification.relatedItem) router.push(`/item/${notification.relatedItem}`);
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      markLocallyRead();
      refreshUnread();
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={retry} />;

  const unread = data?.unreadCount ?? 0;

  return (
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(n) => n._id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        ListHeaderComponent={
          unread > 0 ? (
            <View style={styles.topRow}>
              <Text style={styles.unreadText}>
                {unread} unread
              </Text>
              <Pressable onPress={markAllRead} disabled={markingAll} hitSlop={8} accessibilityRole="button">
                <Text style={styles.markAll}>{markingAll ? 'Marking…' : 'Mark all as read'}</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.secondary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications yet"
            message="You will be notified here when someone claims your found item or when your claim is reviewed."
          />
        }
        renderItem={({ item: n }) => {
          const look = looks[n.type];
          return (
            <Pressable
              onPress={() => open(n)}
              style={({ pressed }) => [styles.card, !n.isRead && styles.unreadCard, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.icon, { backgroundColor: look.soft }]}>
                <Ionicons name={look.icon} size={22} color={look.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !n.isRead && { fontWeight: '800' }]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  {!n.isRead && <View style={styles.dot} />}
                </View>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>
                  {timeAgo(n.createdAt)}
                  {n.relatedItem ? ' · Tap to open the item' : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { padding: 16, flexGrow: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    unreadText: { fontSize: 13, color: colors.muted, fontWeight: '700' },
    markAll: { color: colors.secondary, fontWeight: '800', fontSize: 14 },
    card: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 14,
      marginBottom: 10,
      ...cardShadow,
    },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.secondary },
    icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.coral },
    message: { fontSize: 13, color: colors.text, marginTop: 3, lineHeight: 19 },
    time: { fontSize: 12, color: colors.muted, marginTop: 6 },
  });
