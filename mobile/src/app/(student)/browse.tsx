import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ItemCard from '@/components/ItemCard';
import Segmented from '@/components/Segmented';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { itemsApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, colors, radius } from '@/constants';
import type { ItemType } from '@/types';

type Filter = 'ALL' | ItemType;
const FILTERS = [
  { value: 'ALL', label: 'All Items' },
  { value: 'LOST', label: 'Lost' },
  { value: 'FOUND', label: 'Found' },
] as const;

export default function BrowseScreen() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  // Re-created when the filter changes, which makes useFocusData fetch again.
  const fetchItems = useCallback(() => itemsApi.list(filter), [filter]);
  const { data: items, loading, error, refreshing, refresh, retry } = useFocusData(fetchItems);

  // Search runs on the already-loaded active items, by item name or category.
  const query = search.trim().toLowerCase();
  const visible = (items ?? []).filter(
    (item) => !query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.teal} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by item name or category"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!search && <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setSearch('')} />}
        </View>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      {loading ? (
        <Loading />
      ) : error && !items ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => <ItemCard item={item} showReporter onPress={() => router.push(`/item/${item._id}`)} />}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No items found" message="No items found. Try changing your filters." />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { padding: 16, paddingBottom: 8, gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    ...cardShadow,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
});
