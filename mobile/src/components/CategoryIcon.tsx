import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const CATEGORY_LOOKS: Record<string, { icon: IconName; color: string }> = {
  Electronics: { icon: 'cellphone', color: colors.purple },
  'Identity Cards': { icon: 'card-account-details-outline', color: colors.teal },
  Wallets: { icon: 'wallet-outline', color: colors.coral },
  Bags: { icon: 'bag-personal-outline', color: colors.navyLight },
  Books: { icon: 'book-open-page-variant-outline', color: colors.green },
  Clothing: { icon: 'tshirt-crew-outline', color: colors.purple },
  Accessories: { icon: 'watch-variant', color: colors.amber },
  Keys: { icon: 'key-variant', color: colors.yellow },
  Other: { icon: 'package-variant-closed', color: colors.muted },
};

export function categoryColor(category: string): string {
  return (CATEGORY_LOOKS[category] ?? CATEGORY_LOOKS.Other).color;
}

/** The icon for an item category (phone for Electronics, key for Keys, ...). */
export default function CategoryIcon({ category, size = 16, color }: { category: string; size?: number; color?: string }) {
  const look = CATEGORY_LOOKS[category] ?? CATEGORY_LOOKS.Other;
  return <MaterialCommunityIcons name={look.icon} size={size} color={color ?? look.color} />;
}
