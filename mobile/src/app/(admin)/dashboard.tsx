import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminClaimCard from '@/components/AdminClaimCard';
import AdminReportCard from '@/components/AdminReportCard';
import StatCard from '@/components/StatCard';
import { ErrorState, Loading } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { useAdminDelete } from '@/lib/useAdminDelete';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

const PREVIEW_COUNT = 3;

/** Admin landing screen: statistics, newest reports and the newest pending claims. */
export default function AdminDashboardScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const { user } = useAuth();
  const fetchDashboard = useCallback(async () => {
    const [stats, items, claims] = await Promise.all([adminApi.stats(), adminApi.listAll(), adminApi.claims('PENDING')]);
    return { stats, items, claims };
  }, []);
  const { data, loading, error, refreshing, refresh, retry } = useFocusData(fetchDashboard);
  const { deletingId, confirmDelete } = useAdminDelete(refresh);

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error && !data) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;
  const { stats } = data;
  const totalReports = stats.activeLost + stats.activeFound + stats.recovered;
  const recoveryRate = totalReports ? Math.round((stats.recovered / totalReports) * 100) : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.secondary]} />}
    >
      <Text style={styles.hello}>Hello, {user?.name.split(' ')[0]}</Text>
      <Text style={styles.sub}>Here is what is happening on LostLink.</Text>

      <View style={styles.stats}>
        <StatCard label="Total users" value={stats.totalUsers} icon="people" color={colors.purple} soft={colors.purpleSoft} />
        <StatCard label="Active lost items" value={stats.activeLost} icon="search" color={colors.coral} soft={colors.coralSoft} />
        <StatCard label="Active found items" value={stats.activeFound} icon="cube" color={colors.secondary} soft={colors.secondarySoft} />
        <StatCard label="Recovered items" value={stats.recovered} icon="checkmark-done" color={colors.green} soft={colors.greenSoft} />
      </View>

      <Text style={styles.sectionTitle}>Moderation</Text>
      <View style={styles.moderation}>
        <ModerationRow
          icon="hourglass"
          color={colors.amber}
          value={stats.pendingClaims}
          text="claims waiting for the finder's decision (admins can inspect, only finders decide)"
        />
        <ModerationRow icon="calendar" color={colors.secondary} value={stats.reportsThisWeek} text="new reports in the last 7 days" />
        <ModerationRow
          icon="trending-up"
          color={colors.green}
          value={`${recoveryRate}%`}
          text="of all reports have been recovered"
        />
      </View>

      <SectionHeader title="Recent Reports" action="View all" onAction={() => router.push('/all-reports')} />
      {data.items.length === 0 ? (
        <Text style={styles.empty}>No reports yet.</Text>
      ) : (
        data.items
          .slice(0, PREVIEW_COUNT)
          .map((item) => (
            <AdminReportCard key={item._id} item={item} deleting={deletingId === item._id} disabled={deletingId !== null} onDelete={() => confirmDelete(item)} />
          ))
      )}

      <SectionHeader title="Pending Claims" action="View all" onAction={() => router.push('/claims')} />
      {data.claims.length === 0 ? (
        <Text style={styles.empty}>No pending claims to review.</Text>
      ) : (
        data.claims.slice(0, PREVIEW_COUNT).map((claim) => <AdminClaimCard key={claim._id} claim={claim} />)
      )}
    </ScrollView>
  );
}

/** One line of the moderation summary: a coloured number and what it means. */
function ModerationRow({ icon, color, value, text }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: number | string; text: string }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.modRow}>
      <View style={[styles.modIcon, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.modValue, { color }]}>{value}</Text>
      <Text style={styles.modText}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction} onPress={onAction}>
        {action}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    hello: { fontSize: 24, fontWeight: '800', color: colors.text },
    sub: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 16 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
    moderation: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 4, ...cardShadow },
    modRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    modIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    modValue: { fontSize: 20, fontWeight: '800', minWidth: 44 },
    modText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12 },
    sectionAction: { color: colors.secondary, fontWeight: '800' },
    empty: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  });
