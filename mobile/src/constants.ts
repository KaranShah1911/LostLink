import type { ImageSourcePropType } from 'react-native';

/**
 * LostLink design system.
 *
 * `palette` holds the colours that never change, whatever theme is chosen. They carry meaning:
 *   coral      "Report Lost" and attention elements
 *   green      found items, success, approved claims
 *   red        lost badges, rejected claims, destructive actions
 *   purple     everything about claims
 *   amber      pending / warning
 *
 * The theme colours (primary, secondary, highlight, background...) come from THEMES below and
 * are read in components through useTheme() (src/context/ThemeContext.tsx).
 */
export const palette = {
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
  card: '#FFFFFF',
  white: '#FFFFFF',
  text: '#14213D',
  muted: '#64748B',
  border: '#E2E8F0',
};

/** The colours a theme is allowed to change. */
export interface ThemeTokens {
  primary: string; // headers, navigation, primary buttons
  primaryLight: string; // lighter version of primary
  secondary: string; // secondary actions, links, active tab
  secondarySoft: string; // light tint of secondary (chips, icon bubbles)
  highlight: string; // small accents on the primary colour (logo, avatar ring)
  background: string; // screen background
  onPrimary: string; // secondary text on primary-coloured areas
}

export const THEME_IDS = ['vjti', 'ocean', 'sunset', 'lavender', 'forest'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** The five themes offered in Profile → Theme. */
export const THEMES: Record<ThemeId, { name: string; description: string; tokens: ThemeTokens }> = {
  vjti: {
    name: 'VJTI Classic',
    description: 'Navy, teal and white',
    tokens: {
      primary: '#13294B',
      primaryLight: '#2A4573',
      secondary: '#0D9488',
      secondarySoft: '#D9F3F0',
      highlight: '#2DD4BF',
      background: '#F3F5FA',
      onPrimary: '#C7D4EA',
    },
  },
  ocean: {
    name: 'Ocean Breeze',
    description: 'Blue, turquoise and mint',
    tokens: {
      primary: '#0B4F8A',
      primaryLight: '#2F74B5',
      secondary: '#0891B2',
      secondarySoft: '#D4F1F7',
      highlight: '#6EE7B7',
      background: '#EEF8FA',
      onPrimary: '#CFE6F7',
    },
  },
  sunset: {
    name: 'Sunset',
    description: 'Coral, orange and warm yellow',
    tokens: {
      primary: '#B4421F',
      primaryLight: '#D9603A',
      secondary: '#EA7A0C',
      secondarySoft: '#FDEBD3',
      highlight: '#FCD34D',
      background: '#FFF7EE',
      onPrimary: '#FCE3D6',
    },
  },
  lavender: {
    name: 'Lavender',
    description: 'Purple, lavender and white',
    tokens: {
      primary: '#4C1D95',
      primaryLight: '#6D3FC0',
      secondary: '#8B5CF6',
      secondarySoft: '#EDE6FE',
      highlight: '#C4B5FD',
      background: '#F7F4FE',
      onPrimary: '#DDD3F7',
    },
  },
  forest: {
    name: 'Forest',
    description: 'Green, mint and cream',
    tokens: {
      primary: '#1F4D2E',
      primaryLight: '#2F6B43',
      secondary: '#15803D',
      secondarySoft: '#DDF2E3',
      highlight: '#86EFAC',
      background: '#F8F6EC',
      onPrimary: '#D6E8D9',
    },
  },
};

/** Everything a component can use: the fixed palette plus the current theme's colours. */
export type ThemeColors = typeof palette & ThemeTokens;

/** One colour pair per status. These are the same in every theme, so a status always looks the same. */
export const STATUS_COLORS = {
  LOST: { bg: palette.redSoft, fg: palette.red },
  FOUND: { bg: palette.greenSoft, fg: palette.green },
  ACTIVE: { bg: '#D9F3F0', fg: '#0D9488' },
  RECOVERED: { bg: '#E3EFE7', fg: '#3F7A56' },
  PENDING: { bg: palette.amberSoft, fg: palette.amber },
  APPROVED: { bg: palette.greenSoft, fg: palette.green },
  REJECTED: { bg: palette.redSoft, fg: palette.red },
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
