import { ComponentRef, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthBrand from '@/components/AuthBrand';
import CampusBackdrop from '@/components/CampusBackdrop';
import Button from '@/components/Button';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import TextField from '@/components/TextField';
import { ErrorBanner } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { EMAIL_PATTERN } from '@/lib/format';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function LoginScreen() {
  const { styles } = useTheme(makeStyles);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function handleLogin() {
    const nextErrors: typeof errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address';
    if (!password) nextErrors.password = 'Enter your password';
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length) return;

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // On success the root layout sends the user to Student Home or the Admin Dashboard.
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Full-screen faded VJTI campus photo behind the form. */}
      <CampusBackdrop />
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthBrand />

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Log in to your LostLink account</Text>

            <TextField
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.password}
            />

            <ErrorBanner message={serverError} />

            <Button title="Log In" icon="log-in-outline" onPress={handleLogin} loading={submitting} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to LostLink? </Text>
              <Link href="/register" style={styles.link}>
                Create an account
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    // Slightly see-through white card, so the campus photo still shows around the form.
    card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.xl, padding: 22, ...cardShadow },
    heading: { fontSize: 24, fontWeight: '800', color: colors.text },
    subheading: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 22 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
    footerText: { color: colors.muted, fontSize: 14 },
    link: { color: colors.secondary, fontWeight: '800', fontSize: 14 },
  });
