import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import HeaderActions from '@/components/HeaderActions';
import { Loading } from '@/components/StateViews';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();

  // Nothing is shown until the saved session (and therefore the role) has been restored,
  // so an admin never sees the student screens flash by, or the other way round.
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading message="Loading LostLink..." />
      </View>
    );
  }

  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  // Bell (students only) + profile avatar on the right of the inner screens' headers, the same
  // HeaderActions used by the tab bars. Admins get only the avatar; Profile itself gets neither.
  const withActions = { headerRight: () => <HeaderActions showBell={isStudent} /> };
  const avatarOnly = { headerRight: () => <HeaderActions showBell={false} /> };

  // Role-based routing. A Stack.Protected group whose guard is false does not exist for
  // that user: its screens cannot be opened by any navigation or link, and anyone on one
  // of them is sent to "/" (index.tsx), which redirects to the right place for their role.
  // The role comes from the user object returned by the backend, never from the app itself.
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Logged out */}
      <Stack.Protected guard={!user} redirectTo="/">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Students only */}
      <Stack.Protected guard={isStudent} redirectTo="/">
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="report/[type]" options={{ title: 'Report Item', ...withActions }} />
        <Stack.Screen name="claim/[id]" options={{ title: 'Claim This Item', ...withActions }} />
        {/* No bell on the Notifications screen itself, only the avatar. */}
        <Stack.Screen name="notifications" options={{ title: 'Notifications', ...avatarOnly }} />
      </Stack.Protected>

      {/* Administrators only */}
      <Stack.Protected guard={isAdmin} redirectTo="/">
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Any logged-in user */}
      <Stack.Protected guard={!!user} redirectTo="/">
        <Stack.Screen name="item/[id]" options={{ title: 'Item Details', ...withActions }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="guide/how-it-works" options={{ title: 'How LostLink Works', ...withActions }} />
        <Stack.Screen name="guide/safety" options={{ title: 'Safety Guidelines', ...withActions }} />
      </Stack.Protected>
    </Stack>
  );
}
