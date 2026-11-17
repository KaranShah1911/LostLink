import { Image, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

/** Profile photo, or the person's initials on a coloured circle when there is no photo. */
export default function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const { styles } = useTheme(makeStyles);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[circle, styles.image]} />;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <View style={[circle, styles.fallback]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    image: { backgroundColor: colors.border },
    fallback: { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    initials: { color: colors.white, fontWeight: '800' },
  });
