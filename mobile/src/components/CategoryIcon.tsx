import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Each category has its own icon and a fixed colour (the same in every theme). */
const CATEGORY_LOOKS: Record<string, { icon: IconName; color: string }> = {
  Electronics: { icon: 'cellphone', color: palette.purple },
  'Identity Cards': { icon: 'card-account-details-outline', color: '#0D9488' },
  Wallets: { icon: 'wallet-outline', color: palette.coral },
  Bags: { icon: 'bag-personal-outline', color: '#2A4573' },
  Books: { icon: 'book-open-page-variant-outline', color: palette.green },
  Clothing: { icon: 'tshirt-crew-outline', color: palette.purple },
  Accessories: { icon: 'watch-variant', color: palette.amber },
  Keys: { icon: 'key-variant', color: palette.yellow },
  Other: { icon: 'package-variant-closed', color: palette.muted },
};

export function categoryColor(category: string): string {
  return (CATEGORY_LOOKS[category] ?? CATEGORY_LOOKS.Other).color;
}

/** The icon for an item category (phone for Electronics, key for Keys, ...). */
export default function CategoryIcon({ category, size = 16, color }: { category: string; size?: number; color?: string }) {
  const look = CATEGORY_LOOKS[category] ?? CATEGORY_LOOKS.Other;
  return <MaterialCommunityIcons name={look.icon} size={size} color={color ?? look.color} />;
}
