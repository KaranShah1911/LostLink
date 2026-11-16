import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/AuthHeader';
import Button from '@/components/Button';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import TextField from '@/components/TextField';
import { ErrorBanner } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { EMAIL_PATTERN } from '@/lib/format';
import { colors, radius } from '@/constants';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthHeader>
            <View style={styles.hero}>
              <View style={styles.logo}>
                <Ionicons name="link" size={32} color={colors.navy} />
              </View>
              <Text style={styles.brand}>LostLink</Text>
              <Text style={styles.campus}>VJTI CAMPUS LOST & FOUND</Text>
              <Text style={styles.tagline}>Find what matters. Return what belongs.</Text>
            </View>
          </AuthHeader>

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
              error={errors.email}
            />
            <TextField
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 36, paddingBottom: 30 },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  // Text shadows keep the white text readable on top of the photo.
  brand: { fontSize: 34, fontWeight: '800', color: colors.white, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  campus: { fontSize: 12, fontWeight: '800', color: colors.white, letterSpacing: 2, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  tagline: { fontSize: 15, fontWeight: '600', color: colors.white, marginTop: 10, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingTop: 28,
  },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  subheading: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 22 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.teal, fontWeight: '800', fontSize: 14 },
});
