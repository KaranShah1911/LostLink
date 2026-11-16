import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors, HERO_IMAGE } from '@/constants';

interface CampusBackdropProps {
  /**
   * "light" = whitened photo under dark text (Home, error screen).
   * "clear" = the photo in its natural colours, with only a soft neutral shadow behind
   *           white text (Login, Sign up).
   */
  tint: 'light' | 'clear';
  /** Blend the bottom edge into the page background (used on Home). */
  fadeBottom?: boolean;
}

/**
 * The VJTI campus photo, placed behind a screen's content (fills its parent, which needs
 * position: relative / overflow hidden). resizeMode="cover" crops the photo to fit and never
 * stretches it. A translucent layer on top keeps text readable. If the photo cannot be loaded,
 * only the coloured layer is shown, so the screen still looks fine.
 */
export default function CampusBackdrop({ tint, fadeBottom }: CampusBackdropProps) {
  const [failed, setFailed] = useState(false);
  const overlay = tint === 'light' ? styles.lightOverlay : styles.clearOverlay;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {!failed && <Image source={HERO_IMAGE} style={styles.photo} resizeMode="cover" onError={() => setFailed(true)} />}
      <View style={[StyleSheet.absoluteFill, overlay, failed && (tint === 'light' ? styles.lightFallback : styles.clearFallback)]} />
      {fadeBottom && <View style={styles.bottomFade} />}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: '100%' },
  lightOverlay: { backgroundColor: 'rgba(255,255,255,0.58)' },
  // No colour tint: a light black shade that is a little stronger near the bottom, where the text sits.
  clearOverlay: {
    experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.45) 100%)',
  },
  lightFallback: { backgroundColor: colors.tealSoft },
  clearFallback: { backgroundColor: colors.navy },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    experimental_backgroundImage: `linear-gradient(to bottom, rgba(243,245,250,0) 0%, ${colors.background} 100%)`,
  },
});
