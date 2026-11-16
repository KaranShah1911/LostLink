import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants';
import Avatar from './Avatar';

/**
 * The round button at the top-right of every tab screen. It is the only way to open Profile.
 * It reads the user from AuthContext, so a new profile photo shows here immediately.
 */
export default function HeaderAvatar() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Pressable
      onPress={() => router.push('/profile')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      style={({ pressed }) => [styles.ring, pressed && { opacity: 0.7 }]}
    >
      <Avatar name={user.name} uri={user.profileImage} size={34} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { marginRight: 14, padding: 2, borderRadius: 21, borderWidth: 2, borderColor: colors.turquoise },
});
