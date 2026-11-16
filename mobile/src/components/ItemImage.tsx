import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { colors } from '@/constants';
import CategoryIcon from './CategoryIcon';

interface ItemImageProps {
  uri?: string;
  category: string;
  style: StyleProp<ImageStyle>;
  iconSize?: number;
}

/** Item photo (never stretched: "cover"), or the category icon on a light tile when there is no photo. */
export default function ItemImage({ uri, category, style, iconSize = 34 }: ItemImageProps) {
  if (uri) return <Image source={{ uri }} style={style} resizeMode="cover" />;
  return (
    <View style={[style as object, styles.placeholder]}>
      <CategoryIcon category={category} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
