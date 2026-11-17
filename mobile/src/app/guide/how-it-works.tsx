import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GuideSection, { GuideLine } from '@/components/GuideSection';
import { useTheme } from '@/context/ThemeContext';
import { radius, ThemeColors } from '@/constants';
import { useBottomPadding } from '@/lib/useBottomPadding';

const LOST_STEPS = [
  'Log in to LostLink.',
  'Open the Report tab (the + button) and choose Report Lost Item.',
  'Enter the item name and category. Description and last seen location help others, but are optional.',
  'Add a photo with the camera or from your gallery, if you have one.',
  'Submit the report. It appears in Browse for every student.',
  'Browse the FOUND items regularly to see if someone has handed it in.',
  'Use the Contact button on a report to email the student who posted it.',
];

const FOUND_STEPS = [
  'Open the Report tab and choose Report Found Item.',
  'Enter the item name, category, a description and where you found it.',
  'Add a photo if possible. Keep one private detail (initials, contents) out of the description.',
  'Submit the listing.',
  'Wait for claims. You get a notification when someone claims the item.',
  'Open My Activity → Claims Received and compare each claimant’s details with the item.',
  'Approve the genuine owner (all other claims close automatically) or reject a claim with a reason.',
  'Email the approved claimant and hand the item over at a safe campus location.',
];

const CLAIM_STEPS = [
  'Open the FOUND listing that looks like your item.',
  'Tap Claim This Item.',
  'Describe private identifying details that are not in the listing (initials, contents, marks).',
  'Submit the claim. The item stays listed while the finder reviews claims.',
  'Track the progress in My Activity → My Claims.',
  'Wait for the finder’s decision. You get a notification either way.',
  'If approved, email the finder and collect the item at a safe, public place.',
];

/** Beginner's guide to the three LostLink workflows. The steps match what the app actually does. */
export default function HowItWorksScreen() {
  const bottomPadding = useBottomPadding();
  const { colors, styles } = useTheme(makeStyles);
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.intro}>
        <Ionicons name="sparkles" size={22} color={colors.highlight} />
        <Text style={styles.introText}>
          LostLink connects students who lost something with students who found it, and lets the finder check who the
          real owner is before handing it back.
        </Text>
      </View>

      <GuideSection icon="alert-circle" color={colors.coral} soft={colors.coralSoft} title="If you LOST something" subtitle="Tell the campus what is missing">
        {LOST_STEPS.map((text, i) => (
          <GuideLine key={text} number={i + 1} text={text} color={colors.coral} />
        ))}
      </GuideSection>

      <GuideSection icon="checkmark-circle" color={colors.green} soft={colors.greenSoft} title="If you FOUND something" subtitle="Help the owner get it back">
        {FOUND_STEPS.map((text, i) => (
          <GuideLine key={text} number={i + 1} text={text} color={colors.green} />
        ))}
      </GuideSection>

      <GuideSection icon="hand-left" color={colors.purple} soft={colors.purpleSoft} title="If you are CLAIMING an item" subtitle="Prove that it is yours">
        {CLAIM_STEPS.map((text, i) => (
          <GuideLine key={text} number={i + 1} text={text} color={colors.purple} />
        ))}
      </GuideSection>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 16 },
    intro: { flexDirection: 'row', gap: 10, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, marginBottom: 16 },
    introText: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 20 },
  });
