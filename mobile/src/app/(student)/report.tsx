import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, colors, radius } from '@/constants';

const OPTIONS = [
  {
    type: 'LOST',
    title: 'Report Lost Item',
    text: 'You lost something on campus. Describe it so others can help.',
    icon: 'alert-circle',
    color: colors.coral,
    bg: colors.coralSoft,
  },
  {
    type: 'FOUND',
    title: 'Report Found Item',
    text: 'You found something. Post it so the owner can claim it.',
    icon: 'checkmark-circle',
    color: colors.green,
    bg: colors.greenSoft,
  },
] as const;

export default function ReportChoiceScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>What would you like to report?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.type}
          onPress={() => router.push(`/report/${option.type}`)}
          style={({ pressed }) => [styles.card, { borderLeftColor: option.color }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: option.bg }]}>
            <Ionicons name={option.icon} size={34} color={option.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{option.title}</Text>
            <Text style={styles.text}>{option.text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={option.color} />
        </Pressable>
      ))}

      <View style={styles.tip}>
        <Ionicons name="bulb" size={20} color={colors.amber} />
        <Text style={styles.tipText}>
          Found something? Keep one detail (like initials or the contents) out of the description. Ask claimants to
          mention it so you can check who the real owner is.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderLeftWidth: 5,
    padding: 18,
    marginBottom: 14,
    ...cardShadow,
  },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  tip: { flexDirection: 'row', gap: 10, backgroundColor: colors.amberSoft, padding: 14, borderRadius: radius.md, marginTop: 6 },
  tipText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
});
