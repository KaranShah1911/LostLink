import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import AdminReportCard from '@/components/AdminReportCard';
import Segmented from '@/components/Segmented';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { adminApi } from '@/lib/api';
import { useAdminDelete } from '@/lib/useAdminDelete';
import { useFocusData } from '@/lib/useFocusData';
import { colors } from '@/constants';

type Filter = 'ALL' | 'ACTIVE' | 'RECOVERED';
const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RECOVERED', label: 'Recovered' },
] as const;

/** Admin → All Reports: every report in the system, with View Details and Delete. */
export default function AllReportsScreen() {
  const fetchAll = useCallback(() => adminApi.listAll(), []);
  const { data: items, loading, error, refreshing, refresh, retry } = useFocusData(fetchAll);
  const { deletingId, confirmDelete } = useAdminDelete(refresh);
  const [filter, setFilter] = useState<Filter>('ALL');

  if (loading) return <Loading />;
  if (error && !items) return <ErrorState message={error} onRetry={retry} />;

  const visible = (items ?? []).filter((item) => filter === 'ALL' || item.status === filter);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.controls}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
        ListEmptyComponent={<EmptyState icon="albums-outline" title="No reports" message="There are no reports to show here." />}
        renderItem={({ item }) => (
          <AdminReportCard item={item} deleting={deletingId === item._id} disabled={deletingId !== null} onDelete={() => confirmDelete(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { padding: 16, paddingBottom: 4 },
  list: { padding: 16, flexGrow: 1 },
});
