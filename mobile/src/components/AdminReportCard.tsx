import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants';
import { formatTimestamp } from '@/lib/format';
import type { Item } from '@/types';
import Button from './Button';
import ItemCard from './ItemCard';

/** A report in the admin lists: the normal item card plus reporter email, View Details and Delete. */
export default function AdminReportCard({ item, deleting, disabled, onDelete }: { item: Item; deleting: boolean; disabled: boolean; onDelete: () => void }) {
  const open = () => router.push(`/item/${item._id}`);
  return (
    <ItemCard item={item} showStatus showReporter onPress={open}>
      <View style={styles.footer}>
        <Text style={styles.meta} numberOfLines={1}>
          {item.reportedBy?.email ?? 'Deleted user'} · reported {formatTimestamp(item.createdAt)}
        </Text>
        <View style={styles.actions}>
          <Button title="View Details" icon="eye-outline" variant="outline" small onPress={open} style={{ flex: 1 }} />
          <Button title="Delete" icon="trash-outline" variant="danger" small loading={deleting} disabled={disabled} onPress={onDelete} style={{ flex: 1 }} />
        </View>
      </View>
    </ItemCard>
  );
}

const styles = StyleSheet.create({
  footer: { flex: 1, gap: 8 },
  meta: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
});
