import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import ItemCard from '@/components/ItemCard';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { getErrorMessage, itemsApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { colors } from '@/constants';
import type { Item } from '@/types';

/** My Activity → My Reports: everything the student has reported, active and recovered. */
export default function MyReportsList() {
  const fetchMine = useCallback(() => itemsApi.mine(), []);
  const { data: items, setData, loading, error, refreshing, refresh, retry } = useFocusData(fetchMine);
  const [busyId, setBusyId] = useState<string | null>(null);

  function confirmRecovered(item: Item) {
    Alert.alert('Got it back?', `Mark "${item.title}" as recovered? It will be removed from Browse.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Recovered',
        onPress: async () => {
          setBusyId(item._id);
          try {
            const updated = await itemsApi.markRecovered(item._id);
            setData((current) => current?.map((it) => (it._id === updated._id ? { ...it, status: updated.status } : it)) ?? null);
          } catch (err) {
            Alert.alert('Could not update', getErrorMessage(err));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  function confirmDelete(item: Item) {
    Alert.alert('Delete report?', `"${item.title}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(item._id);
          try {
            await itemsApi.remove(item._id);
            setData((current) => current?.filter((it) => it._id !== item._id) ?? null);
          } catch (err) {
            Alert.alert('Could not delete', getErrorMessage(err));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  if (loading) return <Loading />;
  if (error && !items) return <ErrorState message={error} onRetry={retry} />;

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="No reports yet"
          message="You haven't reported any items yet."
          actionLabel="Report an item"
          onAction={() => router.push('/report')}
        />
      }
      renderItem={({ item }) => {
        const open = () => router.push(`/item/${item._id}`);
        const pending = item.pendingClaimCount ?? 0;

        return (
          <ItemCard item={item} showStatus onPress={open}>
            {item.status === 'RECOVERED' ? (
              <Text style={styles.recovered}>Recovered · kept in your history</Text>
            ) : (
              <View style={styles.actions}>
                {item.type === 'LOST' ? (
                  <Button
                    title="Mark Recovered"
                    icon="checkmark-done-outline"
                    variant="success"
                    small
                    loading={busyId === item._id}
                    disabled={busyId !== null}
                    onPress={() => confirmRecovered(item)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    title={pending ? `Review Claims (${pending})` : 'View Claims'}
                    icon="hand-left-outline"
                    variant={pending ? 'purple' : 'outline'}
                    small
                    onPress={open}
                    style={{ flex: 1 }}
                  />
                )}
                <Button
                  title="Delete"
                  icon="trash-outline"
                  variant="dangerOutline"
                  small
                  disabled={busyId !== null}
                  onPress={() => confirmDelete(item)}
                />
              </View>
            )}
          </ItemCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  actions: { flex: 1, flexDirection: 'row', gap: 8 },
  recovered: { color: '#3F7A56', fontWeight: '600', fontSize: 13 },
});
