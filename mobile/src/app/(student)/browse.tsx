import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FilterSheet, { DEFAULT_FILTERS, PanelFilters } from '@/components/FilterSheet';
import ItemCard from '@/components/ItemCard';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { useTheme } from '@/context/ThemeContext';
import { itemsApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';

const DATE_LABELS = { '1d': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days' };

export default function BrowseScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // the search text actually sent to the server
  const [filters, setFilters] = useState<PanelFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  // Wait until the user stops typing for 400 ms before searching, instead of one request per key.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtering, searching and sorting are all done by the backend (GET /api/items?...).
  const fetchItems = useCallback(() => itemsApi.list({ ...filters, q: query }), [filters, query]);
  const { data: items, loading, error, refreshing, refresh, retry } = useFocusData(fetchItems);

  // The active filters, shown as removable chips under the search bar.
  const active: { label: string; clear: Partial<PanelFilters> }[] = [];
  if (filters.type && filters.type !== 'ALL') active.push({ label: filters.type === 'LOST' ? 'Lost' : 'Found', clear: { type: 'ALL' } });
  if (filters.category) active.push({ label: filters.category, clear: { category: undefined } });
  if (filters.location) active.push({ label: `Location: ${filters.location}`, clear: { location: undefined } });
  if (filters.reported) active.push({ label: DATE_LABELS[filters.reported], clear: { reported: undefined } });
  if (filters.status === 'RECOVERED') active.push({ label: 'Recovered', clear: { status: 'ACTIVE' } });
  if (filters.sort === 'oldest') active.push({ label: 'Oldest first', clear: { sort: 'newest' } });

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.secondary} />
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
          <Pressable
            onPress={() => setPanelOpen(true)}
            style={({ pressed }) => [styles.filterButton, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options" size={22} color={colors.white} />
            {active.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{active.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {active.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeRow}>
            {active.map((filter) => (
              <Pressable key={filter.label} onPress={() => setFilters((current) => ({ ...current, ...filter.clear }))} style={styles.activeChip}>
                <Text style={styles.activeText}>{filter.label}</Text>
                <Ionicons name="close" size={14} color={colors.secondary} />
              </Pressable>
            ))}
            <Pressable onPress={() => setFilters(DEFAULT_FILTERS)} style={styles.clearAll}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {loading ? (
        <Loading />
      ) : error && !items ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <Text style={styles.count}>
              {items?.length ?? 0} {items?.length === 1 ? 'item' : 'items'}
              {filters.status === 'RECOVERED' ? ' recovered' : ' available'}
            </Text>
          }
          renderItem={({ item }) => (
            <ItemCard item={item} showReporter showStatus={item.status !== 'ACTIVE'} onPress={() => router.push(`/item/${item._id}`)} />
          )}
          ListEmptyComponent={<EmptyState icon="search-outline" title="No items found" message="No items found. Try changing your filters." />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.secondary]} />}
        />
      )}

      <FilterSheet
        visible={panelOpen}
        initial={filters}
        onClose={() => setPanelOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setPanelOpen(false);
        }}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    controls: { padding: 16, paddingBottom: 4, gap: 10 },
    searchRow: { flexDirection: 'row', gap: 10 },
    search: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.white,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      ...cardShadow,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
    filterButton: {
      width: 50,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...cardShadow,
    },
    filterBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.coral,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
    activeRow: { gap: 8, alignItems: 'center' },
    activeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.secondarySoft,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    activeText: { color: colors.secondary, fontWeight: '700', fontSize: 13 },
    clearAll: { paddingHorizontal: 6, paddingVertical: 6 },
    clearAllText: { color: colors.red, fontWeight: '700', fontSize: 13 },
    count: { fontSize: 13, color: colors.muted, fontWeight: '600', marginBottom: 10 },
    list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  });
