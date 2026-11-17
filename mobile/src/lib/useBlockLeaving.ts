import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router/react-navigation';

/**
 * While `busy` is true, the user cannot leave the screen (Android back button, back gesture
 * or the header back arrow). Used while a report or claim is being sent, so the request is
 * never abandoned half-way.
 */
export function useBlockLeaving(busy: boolean) {
  usePreventRemove(busy, () => {
    Alert.alert('Please wait', 'LostLink is still sending your details. This screen will be unlocked in a moment.');
  });
}
