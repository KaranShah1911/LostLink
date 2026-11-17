import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { formatDateTime } from '@/lib/format';
import type { ThemeColors } from '@/constants';
import type { ClaimStatus } from '@/types';

interface ClaimTrackerProps {
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
}

type StepState = 'done' | 'current' | 'waiting' | 'failed';

/**
 * Claim progress timeline: Submitted → Waiting for reporter → Approved / Rejected.
 * It only displays the claim's real status from the database; nothing here can change it.
 */
export default function ClaimTracker({ status, createdAt, updatedAt, rejectionReason }: ClaimTrackerProps) {
  const { colors, styles } = useTheme(makeStyles);
  const decided = status !== 'PENDING';

  const steps: { title: string; detail: string; state: StepState }[] = [
    { title: 'Claim submitted', detail: formatDateTime(createdAt), state: 'done' },
    {
      title: 'Waiting for reporter',
      detail: decided ? 'The finder reviewed your claim' : 'The finder is checking your details',
      state: decided ? 'done' : 'current',
    },
    status === 'APPROVED'
      ? { title: 'Approved', detail: formatDateTime(updatedAt), state: 'done' }
      : status === 'REJECTED'
        ? { title: 'Rejected', detail: formatDateTime(updatedAt), state: 'failed' }
        : { title: 'Approved or rejected', detail: 'Decision pending', state: 'waiting' },
  ];

  const look: Record<StepState, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    done: { color: colors.green, icon: 'checkmark' },
    current: { color: colors.amber, icon: 'hourglass-outline' },
    waiting: { color: colors.border, icon: 'ellipse-outline' },
    failed: { color: colors.red, icon: 'close' },
  };

  return (
    <View>
      {steps.map((step, index) => {
        const { color, icon } = look[step.state];
        const isLast = index === steps.length - 1;
        return (
          <View key={step.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: step.state === 'waiting' ? colors.white : color, borderColor: color }]}>
                <Ionicons name={icon} size={13} color={step.state === 'waiting' ? colors.muted : colors.white} />
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: step.state === 'done' ? colors.green : colors.border }]} />}
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, step.state === 'waiting' && { color: colors.muted }]}>{step.title}</Text>
              <Text style={styles.detail}>{step.detail}</Text>
            </View>
          </View>
        );
      })}

      {status === 'APPROVED' && (
        <View style={[styles.result, { backgroundColor: colors.greenSoft }]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.green} />
          <Text style={styles.resultText}>
            Ownership confirmed. Contact the finder and collect the item at a safe, public place on campus.
          </Text>
        </View>
      )}
      {status === 'REJECTED' && (
        <View style={[styles.result, { backgroundColor: colors.redSoft }]}>
          <Ionicons name="information-circle" size={18} color={colors.red} />
          <Text style={styles.resultText}>{rejectionReason ? `Reason: ${rejectionReason}` : 'No reason was given.'}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    step: { flexDirection: 'row', gap: 12 },
    rail: { alignItems: 'center', width: 24 },
    dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    line: { width: 2, flex: 1, minHeight: 16, marginVertical: 2 },
    text: { flex: 1, paddingBottom: 12 },
    title: { fontSize: 14, fontWeight: '700', color: colors.text },
    detail: { fontSize: 12, color: colors.muted, marginTop: 2 },
    result: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 10, alignItems: 'flex-start' },
    resultText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  });
