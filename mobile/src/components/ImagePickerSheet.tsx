import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, ThemeColors } from '@/constants';
import { ImageSource, pickImage } from '@/lib/pickImage';
import type { PickedImage } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (image: PickedImage) => void;
  square?: boolean; // crop to a square (profile photos)
}



/**
 * Bottom sheet with "Camera" and "Gallery". Used everywhere an image is chosen:
 * Report Lost, Report Found, registration and the profile photo.
 */
export default function ImagePickerSheet({ visible, onClose, onPicked, square }: ImagePickerSheetProps) {
  const { colors, styles } = useTheme(makeStyles);
  const insets = useSafeAreaInsets();
  const options: { source: ImageSource; title: string; text: string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }[] = [
    { source: 'camera', title: 'Camera', text: 'Take a new photograph', icon: 'camera', color: colors.coral, soft: colors.coralSoft },
    { source: 'gallery', title: 'Gallery', text: 'Select an existing photograph', icon: 'images', color: colors.secondary, soft: colors.secondarySoft },
  ];

  async function choose(source: ImageSource) {
    onClose();
    // iOS cannot open the camera/gallery while the sheet is still closing.
    if (Platform.OS === 'ios') await new Promise((resolve) => setTimeout(resolve, 400));
    const image = await pickImage(source, { square });
    if (image) onPicked(image);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {/* Tapping the dark area above the sheet closes it. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose an Image</Text>

        {options.map((option) => (
          <Pressable
            key={option.source}
            onPress={() => choose(option.source)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.background }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: option.soft }]}>
              <Ionicons name={option.icon} size={24} color={option.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionText}>{option.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))}

        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(19, 41, 75, 0.55)' },
    sheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: 16,
      paddingTop: 10,
      marginTop: -radius.xl, // lets the rounded corners sit over the backdrop
    },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, paddingHorizontal: 4 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4, borderRadius: radius.md },
    iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    optionText: { fontSize: 13, color: colors.muted, marginTop: 2 },
    cancel: {
      marginTop: 8,
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  });
