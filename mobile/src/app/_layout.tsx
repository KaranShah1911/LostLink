import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/StateViews';
import { colors } from '@/constants';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
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

  // Role-based routing. A Stack.Protected group whose guard is false does not exist for
  // that user: its screens cannot be opened by any navigation or link, and anyone on one
  // of them is sent to "/" (index.tsx), which redirects to the right place for their role.
  // The role comes from the user object returned by the backend, never from the app itself.
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
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
        <Stack.Screen name="report/[type]" options={{ title: 'Report Item' }} />
        <Stack.Screen name="claim/[id]" options={{ title: 'Claim This Item' }} />
      </Stack.Protected>

      {/* Administrators only */}
      <Stack.Protected guard={isAdmin} redirectTo="/">
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Any logged-in user */}
      <Stack.Protected guard={!!user} redirectTo="/">
        <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack.Protected>
    </Stack>
  );
}
