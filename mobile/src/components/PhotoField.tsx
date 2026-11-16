import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MAX_IMAGE_SIZE_MB, radius } from '@/constants';
import type { PickedImage } from '@/types';
import Button from './Button';
import ImagePickerSheet from './ImagePickerSheet';

interface PhotoFieldProps {
  image?: PickedImage;
  onChange: (image: PickedImage | undefined) => void;
}

/** Optional item photo on the report form: add (Camera / Gallery), preview, retake, remove. */
export default function PhotoField({ image, onChange }: PhotoFieldProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>Photo (optional)</Text>
      {image ? (
        <View>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.actions}>
            <Button title="Retake / Choose Another" icon="camera-reverse-outline" variant="outline" small onPress={() => setSheetOpen(true)} style={{ flex: 1 }} />
            <Button title="Remove" icon="trash-outline" variant="dangerOutline" small onPress={() => onChange(undefined)} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setSheetOpen(true)} style={({ pressed }) => [styles.empty, pressed && { opacity: 0.8 }]} accessibilityRole="button">
          <View style={styles.emptyIcon}>
            <Ionicons name="camera" size={26} color={colors.teal} />
          </View>
          <Text style={styles.emptyTitle}>Add a photo</Text>
          <Text style={styles.hint}>Take one with the camera or pick from the gallery (up to {MAX_IMAGE_SIZE_MB} MB)</Text>
        </Pressable>
      )}

      <ImagePickerSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPicked={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  empty: {
    alignItems: 'center',
    padding: 22,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: colors.teal, fontWeight: '800', fontSize: 15 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  preview: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.border },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
