import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CampusBackdrop from '@/components/CampusBackdrop';
import ItemCard from '@/components/ItemCard';
import StatCard from '@/components/StatCard';
import { EmptyState, ErrorState, Loading } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { itemsApi } from '@/lib/api';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const { user } = useAuth();
  // Statistics are counted by the database; the list holds the newest active reports.
  const fetchHome = useCallback(async () => {
    const [stats, items] = await Promise.all([itemsApi.stats(), itemsApi.list()]);
    return { stats, items: items.slice(0, RECENT_COUNT) };
  }, []);
  const { data, loading, error, refreshing, refresh, retry } = useFocusData(fetchHome);
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.secondary]} />}
    >
      {/* Faded VJTI campus photo behind the top of the screen (see CampusBackdrop). */}
      <View style={styles.photoArea}>
        <CampusBackdrop fadeBottom />
      </View>

      <View style={styles.hero}>
        <View style={styles.campusChip}>
          <Ionicons name="school" size={14} color={colors.primary} />
          <Text style={styles.campusText}>VJTI CAMPUS LOST & FOUND</Text>
        </View>
        <Text style={styles.welcome}>Welcome, {firstName} 👋</Text>
        <Text style={styles.tagline}>Lost something on campus? Let&apos;s help you find it.</Text>
      </View>

      <View style={styles.actions}>
        <ActionCard title="Report Lost" text="Tell others what you lost" icon="alert-circle" color={colors.coral} onPress={() => router.push('/report/LOST')} />
        <ActionCard title="Report Found" text="Help an owner get it back" icon="checkmark-circle" color={colors.green} onPress={() => router.push('/report/FOUND')} />
      </View>

      <View style={styles.stats}>
        <StatCard label="Active lost" value={data?.stats.activeLost ?? null} icon="search" color={colors.red} soft={colors.redSoft} compact />
        <StatCard label="Active found" value={data?.stats.activeFound ?? null} icon="cube" color={colors.green} soft={colors.greenSoft} compact />
        <StatCard label="Recovered" value={data?.stats.recovered ?? null} icon="checkmark-done" color={colors.purple} soft={colors.purpleSoft} compact />
      </View>

      <View style={styles.help}>
        <HelpCard title="How LostLink Works" icon="map" color={colors.secondary} href="/guide/how-it-works" />
        <HelpCard title="Safety Guidelines" icon="shield-checkmark" color={colors.amber} href="/guide/safety" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <Text style={styles.seeAll} onPress={() => router.push('/browse')}>
          See all
        </Text>
      </View>

      {loading ? (
        <Loading />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !data?.items.length ? (
        <EmptyState title="No reports yet" message="Be the first to report a lost or found item on campus." />
      ) : (
        data.items.map((item) => <ItemCard key={item._id} item={item} onPress={() => router.push(`/item/${item._id}`)} />)
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
  const { styles } = useTheme(makeStyles);
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

/** Small card linking to one of the help screens. */
function HelpCard({ title, icon, color, href }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; href: Href }) {
  const { styles } = useTheme(makeStyles);
  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => [styles.helpCard, pressed && { opacity: 0.85 }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.helpText} numberOfLines={2}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={color} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },
    photoArea: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
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
    campusText: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    welcome: { color: colors.primary, fontSize: 30, fontWeight: '800', marginTop: 14 },
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
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    help: { flexDirection: 'row', gap: 10, marginBottom: 22 },
    helpCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: 12,
      ...cardShadow,
    },
    helpText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    seeAll: { color: colors.secondary, fontWeight: '800' },
  });
