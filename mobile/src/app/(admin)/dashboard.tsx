import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import AdminClaimCard from '@/components/AdminClaimCard';
import AdminReportCard from '@/components/AdminReportCard';
import StatCard from '@/components/StatCard';
import { ErrorState, Loading } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { useAdminDelete } from '@/lib/useAdminDelete';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius } from '@/constants';

const PREVIEW_COUNT = 3;

/** Admin landing screen: statistics, newest reports and the newest pending claims. */
export default function AdminDashboardScreen() {
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
    >
      <Text style={styles.hello}>Hello, {user?.name.split(' ')[0]}</Text>
      <Text style={styles.sub}>Here is what is happening on LostLink.</Text>

      <View style={styles.stats}>
        <StatCard label="Total users" value={stats.totalUsers} icon="people" color={colors.purple} soft={colors.purpleSoft} />
        <StatCard label="Active lost items" value={stats.activeLost} icon="search" color={colors.coral} soft={colors.coralSoft} />
        <StatCard label="Active found items" value={stats.activeFound} icon="cube" color={colors.teal} soft={colors.tealSoft} />
        <StatCard label="Recovered items" value={stats.recovered} icon="checkmark-done" color={colors.green} soft={colors.greenSoft} />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerNumber}>{data.claims.length}</Text>
        <Text style={styles.bannerText}>
          {data.claims.length === 1 ? 'claim is' : 'claims are'} waiting for the finder&apos;s decision. Admins can inspect claims
          but only the finder can approve or reject them.
        </Text>
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

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction} onPress={onAction}>
        {action}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 8,
  },
  bannerNumber: { fontSize: 30, fontWeight: '800', color: colors.amber },
  bannerText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionAction: { color: colors.teal, fontWeight: '800' },
  empty: { color: colors.muted, fontSize: 14, marginBottom: 8 },
});
