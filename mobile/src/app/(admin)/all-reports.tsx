import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminReportCard from '@/components/AdminReportCard';
import Segmented from '@/components/Segmented';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { adminApi } from '@/lib/api';
import { useAdminDelete } from '@/lib/useAdminDelete';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

type StatusFilter = 'ALL' | 'ACTIVE' | 'RECOVERED';
const STATUS_FILTERS = [
  { value: 'ALL', label: 'Any status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RECOVERED', label: 'Recovered' },
] as const;
type TypeFilter = 'ALL' | 'LOST' | 'FOUND';
const TYPE_FILTERS = [
  { value: 'ALL', label: 'Lost & Found' },
  { value: 'LOST', label: 'Lost' },
  { value: 'FOUND', label: 'Found' },
] as const;

/** Admin → All Reports: every report in the system, with View Details and Delete. */
export default function AllReportsScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const fetchAll = useCallback(() => adminApi.listAll(), []);
  const { data: items, loading, error, refreshing, refresh, retry } = useFocusData(fetchAll);
  const { deletingId, confirmDelete } = useAdminDelete(refresh);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [search, setSearch] = useState('');

  if (loading) return <Loading />;
  if (error && !items) return <ErrorState message={error} onRetry={retry} />;

  // The admin list already holds every report, so these filters run on the phone.
  const query = search.trim().toLowerCase();
  const visible = (items ?? []).filter(
    (item) =>
      (status === 'ALL' || item.status === status) &&
      (type === 'ALL' || item.type === type) &&
      (!query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.reportedBy?.name ?? '').toLowerCase().includes(query) ||
        (item.reportedBy?.email ?? '').toLowerCase().includes(query))
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.controls}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.secondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search item, category or reporter"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {!!search && <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setSearch('')} />}
        </View>
        <Segmented options={TYPE_FILTERS} value={type} onChange={setType} />
        <Segmented options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <Text style={styles.count}>
          Showing {visible.length} of {items?.length ?? 0} reports
        </Text>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.secondary]} />}
        ListEmptyComponent={<EmptyState icon="albums-outline" title="No reports" message="There are no reports to show here." />}
        renderItem={({ item }) => (
          <AdminReportCard item={item} deleting={deletingId === item._id} disabled={deletingId !== null} onDelete={() => confirmDelete(item)} />
        )}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    controls: { padding: 16, paddingBottom: 4, gap: 8 },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.white,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      ...cardShadow,
    },
    searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
    count: { fontSize: 12, color: colors.muted, fontWeight: '600' },
    list: { padding: 16, flexGrow: 1 },
  });
