import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MAX_IMAGE_SIZE_MB } from '@/constants';
import type { PickedImage } from '@/types';

export type ImageSource = 'camera' | 'gallery';

/**
 * Takes a photo with the camera or opens the phone's gallery, and returns the chosen image.
 * Returns null if the user cancels, refuses permission, or picks something unusable;
 * in the last two cases a friendly message is shown. Never throws.
 *
 * This is the only place in the app that talks to expo-image-picker.
 */
export async function pickImage(source: ImageSource, { square = false } = {}): Promise<PickedImage | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true, // lets the user crop after choosing
    aspect: square ? [1, 1] : undefined,
    quality: 0.7, // compress to keep uploads small
  };

  let result: ImagePicker.ImagePickerResult;
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        explainDenied('Camera', permission.canAskAgain);
        return null;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      // The system photo picker needs no permission on current Android and iOS versions.
      // If an older device refuses, the catch block below explains what to do.
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
  } catch {
    if (source === 'gallery') explainDenied('Photos', false);
    else Alert.alert('Camera unavailable', 'The camera could not be opened on this device. Try choosing from the gallery.');
    return null;
  }

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
    Alert.alert('Not an image', 'Please choose a photo (JPG, PNG or WEBP).');
    return null;
  }
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    Alert.alert('Image too large', `Please choose an image smaller than ${MAX_IMAGE_SIZE_MB} MB.`);
    return null;
  }
  const extension = (asset.fileName ?? asset.uri).split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = asset.mimeType ?? (extension === 'png' ? 'image/png' : 'image/jpeg');
  return { uri: asset.uri, name: asset.fileName ?? `photo.${extension}`, mimeType };
}

function explainDenied(what: 'Camera' | 'Photos', canAskAgain: boolean) {
  Alert.alert(
    `${what} permission needed`,
    canAskAgain
      ? `LostLink needs ${what.toLowerCase()} access to add a picture. Please allow it when asked.`
      : `${what} access is turned off for this app. You can turn it on in your phone's Settings.`,
    canAskAgain
      ? [{ text: 'OK' }]
      : [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]
  );
}
