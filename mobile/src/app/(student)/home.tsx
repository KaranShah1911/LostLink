import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import CampusBackdrop from '@/components/CampusBackdrop';
import ItemCard from '@/components/ItemCard';
import StatCard from '@/components/StatCard';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { itemsApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, colors, radius } from '@/constants';

const RECENT_COUNT = 5;
const PHOTO_HEIGHT = 380;

export default function HomeScreen() {
  const { user } = useAuth();
  // The list endpoint returns every ACTIVE report, so the counts below are exact.
  const fetchItems = useCallback(() => itemsApi.list('ALL'), []);
  const { data: items, loading, error, refreshing, refresh, retry } = useFocusData(fetchItems);

  const lostCount = items ? items.filter((item) => item.type === 'LOST').length : null;
  const foundCount = items ? items.filter((item) => item.type === 'FOUND').length : null;
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.teal]} />}
    >
      {/* Faded VJTI campus photo behind the top of the screen (see CampusBackdrop). */}
      <View style={styles.photoArea}>
        <CampusBackdrop tint="light" fadeBottom />
      </View>

      <View style={styles.hero}>
        <View style={styles.campusChip}>
          <Ionicons name="school" size={14} color={colors.navy} />
          <Text style={styles.campusText}>VJTI CAMPUS LOST & FOUND</Text>
        </View>
        <Text style={styles.welcome}>Welcome, {firstName} 👋</Text>
        <Text style={styles.tagline}>Lost something on campus? Let&apos;s help you find it.</Text>
      </View>

      <View style={styles.actions}>
        <ActionCard
          title="Report Lost"
          text="Tell others what you lost"
          icon="alert-circle"
          color={colors.coral}
          onPress={() => router.push('/report/LOST')}
        />
        <ActionCard
          title="Report Found"
          text="Help an owner get it back"
          icon="checkmark-circle"
          color={colors.green}
          onPress={() => router.push('/report/FOUND')}
        />
      </View>

      <View style={styles.stats}>
        <StatCard label="Active lost items" value={loading ? null : lostCount} icon="search" color={colors.red} soft={colors.redSoft} />
        <StatCard label="Active found items" value={loading ? null : foundCount} icon="cube" color={colors.green} soft={colors.greenSoft} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <Text style={styles.seeAll} onPress={() => router.push('/browse')}>
          See all
        </Text>
      </View>

      {loading ? (
        <Loading />
      ) : error && !items ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !items?.length ? (
        <EmptyState title="No reports yet" message="Be the first to report a lost or found item on campus." />
      ) : (
        <>
          {items.slice(0, RECENT_COUNT).map((item) => (
            <ItemCard key={item._id} item={item} onPress={() => router.push(`/item/${item._id}`)} />
          ))}
          <Button title="Browse All Items" icon="search-outline" variant="teal" onPress={() => router.push('/browse')} />
        </>
      )}
    </ScrollView>
  );
}

interface ActionCardProps {
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

/** Big coloured shortcut button (coral for Lost, green for Found). */
function ActionCard({ title, text, icon, color, onPress }: ActionCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: color }, pressed && { opacity: 0.88 }]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  photoArea: { position: 'absolute', top: 0, left: 0, right: 0, height: PHOTO_HEIGHT },
  hero: { paddingTop: 18, paddingBottom: 26 },
  campusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  campusText: { color: colors.navy, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  welcome: { color: colors.navy, fontSize: 30, fontWeight: '800', marginTop: 14 },
  tagline: { color: colors.text, fontSize: 16, marginTop: 6, lineHeight: 22, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionCard: { flex: 1, borderRadius: radius.lg, padding: 14, ...cardShadow },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.white },
  actionText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 3 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  seeAll: { color: colors.teal, fontWeight: '800' },
});
