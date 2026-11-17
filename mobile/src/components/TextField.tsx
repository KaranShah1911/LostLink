import { ComponentRef, Ref, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  hint?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>; // lets a form move the focus to this field (React 19 passes ref as a prop)
}

/**
 * Labelled text input. Password fields (secureTextEntry) get an eye button
 * that shows or hides what was typed.
 */
export default function TextField({ ref, label, error, icon, hint, multiline, secureTextEntry, style, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const { colors, styles } = useTheme(makeStyles);
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, multiline && styles.multilineBox, focused && styles.boxFocused, !!error && styles.boxError]}>
        {icon && (
          <Ionicons name={icon} size={18} color={focused ? colors.secondary : colors.muted} style={multiline ? styles.iconTop : undefined} />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          secureTextEntry={secureTextEntry && hidden}
          style={[styles.input, multiline && styles.multiline, inputProps.editable === false && styles.disabled, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
    },
    multilineBox: { alignItems: 'flex-start' },
    boxFocused: { borderColor: colors.secondary },
    boxError: { borderColor: colors.red },
    iconTop: { marginTop: 14 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
    disabled: { color: colors.muted },
    multiline: { minHeight: 110, textAlignVertical: 'top' },
    error: { color: colors.red, fontSize: 13, marginTop: 4 },
    hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  });
