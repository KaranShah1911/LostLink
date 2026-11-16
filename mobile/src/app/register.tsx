import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/AuthHeader';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import ImagePickerSheet from '@/components/ImagePickerSheet';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import TextField from '@/components/TextField';
import { ErrorBanner } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { EMAIL_PATTERN } from '@/lib/format';
import { colors, radius } from '@/constants';
import type { PickedImage } from '@/types';

type Field = 'name' | 'email' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState<Record<Field, string>>({ name: '', email: '', password: '', confirmPassword: '' });
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Field) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const goToLogin = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  function validate() {
    const next: Partial<Record<Field, string>> = {};
    const name = form.name.trim();
    if (name.length < 2 || name.length > 60) next.name = 'Name must be 2 to 60 characters';
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    setServerError('');
    if (!validate()) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        image: photo ?? undefined,
      });
      // Registering also logs the student in; the root layout then opens Student Home.
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthHeader>
            <View style={styles.top}>
              <Pressable onPress={goToLogin} hitSlop={12} style={styles.back} accessibilityLabel="Back to login">
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </Pressable>
              <Text style={styles.heading}>Join LostLink</Text>
              <Text style={styles.subheading}>Create a student account to report and find items on campus.</Text>
            </View>
          </AuthHeader>

          <View style={styles.card}>
            <View style={styles.photoRow}>
              <Pressable onPress={() => setSheetOpen(true)} accessibilityLabel="Choose profile photo">
                {photo ? (
                  <Avatar name={form.name || '?'} uri={photo.uri} size={76} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={28} color={colors.teal} />
                  </View>
                )}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoTitle}>Profile photo (optional)</Text>
                <View style={styles.photoActions}>
                  <Text style={styles.link} onPress={() => setSheetOpen(true)}>
                    {photo ? 'Retake / Choose another' : 'Add photo'}
                  </Text>
                  {photo && (
                    <Text style={[styles.link, { color: colors.red }]} onPress={() => setPhoto(null)}>
                      Remove
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <TextField label="Full name" icon="person-outline" value={form.name} onChangeText={update('name')} placeholder="e.g. Priya Sharma" error={errors.name} />
            <TextField
              label="Email"
              icon="mail-outline"
              value={form.email}
              onChangeText={update('email')}
              placeholder="you@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <TextField
              label="Password"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={update('password')}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />
            <TextField
              label="Confirm password"
              icon="lock-closed-outline"
              value={form.confirmPassword}
              onChangeText={update('confirmPassword')}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <ErrorBanner message={serverError} />

            <Button title="Create Account" icon="person-add-outline" variant="teal" onPress={handleRegister} loading={submitting} />

            <Text style={styles.footer}>
              Already registered?{' '}
              <Text style={styles.link} onPress={goToLogin}>
                Log in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoider>

      <ImagePickerSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPicked={setPhoto} square />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1 },
  top: { paddingTop: 12, paddingBottom: 24 },
  back: { marginBottom: 14, alignSelf: 'flex-start' },
  // Text shadows keep the white text readable on top of the photo.
  heading: { fontSize: 28, fontWeight: '800', color: colors.white, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  subheading: { fontSize: 14, fontWeight: '600', color: colors.white, marginTop: 6, lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  photoPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  photoActions: { flexDirection: 'row', gap: 16, marginTop: 6, flexWrap: 'wrap' },
  footer: { textAlign: 'center', marginTop: 20, color: colors.muted, fontSize: 14 },
  link: { color: colors.teal, fontWeight: '800', fontSize: 14 },
});
