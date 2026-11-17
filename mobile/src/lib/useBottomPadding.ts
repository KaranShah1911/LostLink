import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for screens without a tab bar (Profile, report forms, Item Details, ...).
 * On Android the app draws edge-to-edge, so content would otherwise end up behind the phone's
 * navigation bar / gesture area. `insets.bottom` is that area's real height on this phone,
 * plus `extra` normal spacing.
 */
export function useBottomPadding(extra = 24): number {
  return useSafeAreaInsets().bottom + extra;
}
