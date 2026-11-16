import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants';

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of toggle buttons where exactly one is selected (filters and in-screen tabs). */
export default function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.text, selected && styles.selectedText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#E4E9F2', borderRadius: radius.md, padding: 4 },
  option: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.sm, alignItems: 'center' },
  selected: { backgroundColor: colors.navy },
  text: { fontWeight: '700', color: colors.muted, fontSize: 13 },
  selectedText: { color: colors.white },
});
