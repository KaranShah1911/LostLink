import type { ImageSourcePropType } from 'react-native';

/**
 * LostLink design system. Every screen takes its colours from here.
 *
 *   navy       headers, navigation, primary buttons
 *   teal       secondary actions, links, highlights
 *   turquoise  small accents on navy (logo, avatar ring)
 *   coral      "Report Lost" and attention elements
 *   green      found items, success, approved claims
 *   red        lost badges, rejected claims, destructive actions
 *   purple     everything about claims
 *   amber      pending / warning
 */
export const colors = {
  navy: '#13294B',
  navyLight: '#2A4573',
  teal: '#0D9488',
  tealSoft: '#D9F3F0',
  turquoise: '#2DD4BF',
  coral: '#F4673C',
  coralSoft: '#FEE8E0',
  green: '#16A34A',
  greenSoft: '#DCF5E5',
  red: '#DC2626',
  redSoft: '#FDE5E5',
  purple: '#7C3AED',
  purpleSoft: '#EDE7FD',
  amber: '#B45309',
  amberSoft: '#FEF1C7',
  yellow: '#F5B301',
  background: '#F3F5FA',
  card: '#FFFFFF',
  white: '#FFFFFF',
  text: '#14213D',
  muted: '#64748B',
  border: '#E2E8F0',
  onNavy: '#C7D4EA', // secondary text on navy backgrounds
};

/** One colour pair per status, so a status looks the same on every screen. */
export const STATUS_COLORS = {
  LOST: { bg: colors.redSoft, fg: colors.red },
  FOUND: { bg: colors.greenSoft, fg: colors.green },
  ACTIVE: { bg: colors.tealSoft, fg: colors.teal },
  RECOVERED: { bg: '#E3EFE7', fg: '#3F7A56' },
  PENDING: { bg: colors.amberSoft, fg: colors.amber },
  APPROVED: { bg: colors.greenSoft, fg: colors.green },
  REJECTED: { bg: colors.redSoft, fg: colors.red },
} as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 26, pill: 999 };

/** Soft card shadow used across the app (elevation on Android, shadow* on iOS). */
export const cardShadow = {
  elevation: 2,
  shadowColor: '#13294B',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
};

/**
 * Home screen background photo: the VJTI quadrangle and dome.
 * Photo by Paras2130, Wikimedia Commons, licence CC BY-SA 4.0 (see assets/images/README.md).
 * Stored locally so the app does not depend on the internet to show it.
 */
export const HERO_IMAGE: ImageSourcePropType = require('../assets/images/vjti-campus.jpg');

export const CATEGORIES = [
  'Electronics',
  'Identity Cards',
  'Wallets',
  'Bags',
  'Books',
  'Clothing',
  'Accessories',
  'Keys',
  'Other',
] as const;

export const MAX_IMAGE_SIZE_MB = 5;
