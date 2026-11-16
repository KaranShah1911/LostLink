import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/**
 * The app's entry route ("/"). It shows nothing itself: it sends each kind of user to
 * their own starting screen. This runs after login, after logout and when a saved
 * session is restored, so the role always decides where the user lands.
 *
 *   not logged in -> Login
 *   STUDENT       -> Student Home
 *   ADMIN         -> Admin Dashboard
 */
export default function Index() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'ADMIN' ? '/dashboard' : '/home'} />;
}
