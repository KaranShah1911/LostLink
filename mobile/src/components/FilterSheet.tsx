import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORIES, radius, ThemeColors } from '@/constants';
import type { ItemFilters } from '@/types';
import Button from './Button';
import CategoryIcon from './CategoryIcon';

/** The filters chosen in the panel (search text is typed on the Browse screen itself). */
export type PanelFilters = Omit<ItemFilters, 'q'>;

export const DEFAULT_FILTERS: PanelFilters = { type: 'ALL', status: 'ACTIVE', sort: 'newest' };

const TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'LOST', label: 'Lost' },
  { value: 'FOUND', label: 'Found' },
] as const;
const DATES = [
  { value: undefined, label: 'Any time' },
  { value: '1d', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;
const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RECOVERED', label: 'Recovered' },
] as const;
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const;

interface FilterSheetProps {
  visible: boolean;
  initial: PanelFilters;
  onApply: (filters: PanelFilters) => void;
  onClose: () => void;
}

/** Bottom panel with all Browse filters. Nothing changes until "Apply Filters" is pressed. */
export default function FilterSheet({ visible, initial, onApply, onClose }: FilterSheetProps) {
  const { colors, styles } = useTheme(makeStyles);
  const insets = useSafeAreaInsets();
  // A working copy, so closing the panel without applying keeps the old filters.
  const [draft, setDraft] = useState<PanelFilters>(initial);
  const set = (change: Partial<PanelFilters>) => setDraft((current) => ({ ...current, ...change }));

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onShow={() => setDraft(initial)} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
            <Text style={styles.label}>Item type</Text>
            <ChipRow options={TYPES} value={draft.type ?? 'ALL'} onChange={(type) => set({ type })} />

            <Text style={styles.label}>Category</Text>
            <View style={styles.wrap}>
              <Chip label="Any" selected={!draft.category} onPress={() => set({ category: undefined })} />
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  icon={<CategoryIcon category={category} size={14} color={draft.category === category ? colors.white : undefined} />}
                  selected={draft.category === category}
                  onPress={() => set({ category })}
                />
              ))}
            </View>

            <Text style={styles.label}>Location contains</Text>
            <View style={styles.input}>
              <Ionicons name="location-outline" size={18} color={colors.muted} />
              <TextInput
                value={draft.location ?? ''}
                onChangeText={(location) => set({ location })}
                placeholder="e.g. Library, Canteen"
                placeholderTextColor="#94A3B8"
                style={styles.inputText}
              />
            </View>

            <Text style={styles.label}>Date reported</Text>
            <ChipRow options={DATES} value={draft.reported} onChange={(reported) => set({ reported })} />

            <Text style={styles.label}>Status</Text>
            <ChipRow options={STATUSES} value={draft.status ?? 'ACTIVE'} onChange={(status) => set({ status })} />

            <Text style={styles.label}>Sort by</Text>
            <ChipRow options={SORTS} value={draft.sort ?? 'newest'} onChange={(sort) => set({ sort })} />
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Clear Filters" variant="outline" onPress={() => onApply(DEFAULT_FILTERS)} style={{ flex: 1 }} />
            <Button
              title="Apply Filters"
              icon="checkmark"
              variant="teal"
              onPress={() => onApply({ ...draft, location: draft.location?.trim() || undefined })}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChipRow<T>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const { styles } = useTheme(makeStyles);
  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <Chip key={option.label} label={option.label} selected={option.value === value} onPress={() => onChange(option.value)} />
      ))}
    </View>
  );
}

function Chip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: React.ReactNode }) {
  const { styles } = useTheme(makeStyles);
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]} accessibilityRole="button" accessibilityState={{ selected }}>
      {icon}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
    sheet: {
      maxHeight: '85%',
      backgroundColor: colors.white,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    label: { fontSize: 13, fontWeight: '800', color: colors.primary, marginTop: 14, marginBottom: 8, letterSpacing: 0.3 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
    chipTextSelected: { color: colors.white },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 12,
    },
    inputText: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
    footer: { flexDirection: 'row', gap: 10, paddingTop: 14 },
  });
