import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { HERO_IMAGE, ThemeColors } from '@/constants';

/**
 * The faded VJTI campus photo, placed behind a screen's content. It fills its parent.
 * Used on Login, Sign up, Home, Profile and the "Try again" error screen only.
 *
 * - resizeMode="cover" crops the photo to fit and never stretches it.
 * - A white translucent layer on top gives the faded "institute website" look and keeps text readable.
 * - The photo is the same in every theme.
 * - If the photo cannot be loaded, only a light background is shown and the screen still works.
 */
export default function CampusBackdrop({ fadeBottom }: { fadeBottom?: boolean }) {
  const { styles } = useTheme(makeStyles);
  const [failed, setFailed] = useState(false);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {!failed && <Image source={HERO_IMAGE} style={styles.photo} resizeMode="cover" onError={() => setFailed(true)} />}
      <View style={[StyleSheet.absoluteFill, failed ? styles.fallback : styles.whiteWash]} />
      {/* Blends the bottom edge of the photo into the page background (Home). */}
      {fadeBottom && <View style={styles.bottomFade} />}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    photo: { width: '100%', height: '100%' },
    whiteWash: { backgroundColor: 'rgba(255,255,255,0.58)' },
    fallback: { backgroundColor: colors.secondarySoft },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 180,
      experimental_backgroundImage: `linear-gradient(to bottom, transparent 0%, ${colors.background} 100%)`,
    },
  });
