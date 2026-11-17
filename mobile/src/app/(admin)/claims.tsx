import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminClaimCard from '@/components/AdminClaimCard';
import Segmented from '@/components/Segmented';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { adminApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

type Filter = 'PENDING' | 'ALL';
const FILTERS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ALL', label: 'All Claims' },
] as const;

/** Admin → Claims: read-only moderation view. There are deliberately no Approve / Reject buttons. */
export default function AdminClaimsScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const [filter, setFilter] = useState<Filter>('PENDING');
  const fetchClaims = useCallback(() => adminApi.claims(filter), [filter]);
  const { data: claims, loading, error, refreshing, refresh, retry } = useFocusData(fetchClaims);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.controls}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.note}>
          <Ionicons name="information-circle" size={18} color={colors.purple} />
          <Text style={styles.noteText}>
            Read-only. Only the student who found an item can approve or reject claims on it. Private claim descriptions
            are visible only to that student.
          </Text>
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : error && !claims ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={claims ?? []}
          keyExtractor={(claim) => claim._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.purple]} />}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title={filter === 'PENDING' ? 'All caught up' : 'No claims yet'}
              message={filter === 'PENDING' ? 'No pending claims to review.' : 'No one has submitted a claim yet.'}
              color={colors.purple}
              soft={colors.purpleSoft}
            />
          }
          renderItem={({ item: claim }) => <AdminClaimCard claim={claim} />}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    controls: { padding: 16, paddingBottom: 4, gap: 10 },
    note: { flexDirection: 'row', gap: 8, backgroundColor: colors.purpleSoft, padding: 12, borderRadius: radius.md },
    noteText: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 17 },
    list: { padding: 16, flexGrow: 1 },
  });
