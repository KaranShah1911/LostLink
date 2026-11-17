import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GuideSection, { GuideLine } from '@/components/GuideSection';
import { useTheme } from '@/context/ThemeContext';
import { radius, ThemeColors } from '@/constants';
import { useBottomPadding } from '@/lib/useBottomPadding';

/** Short safety advice for using LostLink. Purely informational. */
export default function SafetyScreen() {
  const bottomPadding = useBottomPadding();
  const { colors, styles } = useTheme(makeStyles);
  const sections = [
    {
      icon: 'shield-checkmark' as const,
      color: colors.purple,
      soft: colors.purpleSoft,
      title: 'Ownership verification',
      lines: [
        'Never approve a claim without checking that the claimant is the genuine owner.',
        'Ask for identifying details that are not shown in the listing, such as initials, contents or marks.',
      ],
    },
    {
      icon: 'lock-closed' as const,
      color: colors.red,
      soft: colors.redSoft,
      title: 'Personal information',
      lines: [
        'Do not put sensitive details (ID numbers, card numbers, phone numbers) in item descriptions.',
        'Never share passwords, OTPs or account credentials with anyone.',
      ],
    },
    {
      icon: 'location' as const,
      color: colors.green,
      soft: colors.greenSoft,
      title: 'Safe collection',
      lines: [
        'Meet in a safe, public campus location such as the library entrance or main gate.',
        'Prefer well-known campus areas during college hours.',
        'Do not hand over valuable belongings without reasonable verification.',
      ],
    },
    {
      icon: 'flag' as const,
      color: colors.amber,
      soft: colors.amberSoft,
      title: 'Responsible reporting',
      lines: [
        'Report only genuine lost and found items.',
        'Avoid duplicate, fake or misleading listings. Administrators remove them.',
        'Mark your lost item as recovered, or delete your report, once it is no longer needed.',
      ],
    },
    {
      icon: 'mail' as const,
      color: colors.secondary,
      soft: colors.secondarySoft,
      title: 'Communication',
      lines: [
        'Use the Contact / Email buttons in LostLink, which use your registered college email.',
        'Do not share unnecessary personal details while arranging a hand-over.',
      ],
    },
  ];

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.intro}>
        <Ionicons name="shield-half" size={22} color={colors.highlight} />
        <Text style={styles.introText}>A few simple habits keep LostLink safe and trustworthy for everyone on campus.</Text>
      </View>
      {sections.map((section) => (
        <GuideSection key={section.title} icon={section.icon} color={section.color} soft={section.soft} title={section.title}>
          {section.lines.map((line) => (
            <GuideLine key={line} text={line} color={section.color} />
          ))}
        </GuideSection>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 16 },
    intro: { flexDirection: 'row', gap: 10, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, marginBottom: 16 },
    introText: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 20 },
  });
