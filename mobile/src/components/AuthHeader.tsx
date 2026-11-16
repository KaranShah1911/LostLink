import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CampusBackdrop from './CampusBackdrop';

/** Top area of the Login and Sign up screens: the VJTI campus photo in its natural colours. */
export default function AuthHeader({ children }: { children: ReactNode }) {
  // The photo also runs behind the status bar; the padding keeps the content below it.
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <CampusBackdrop tint="clear" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Extra bottom padding so the photo continues behind the rounded corners of the form card.
  header: { paddingHorizontal: 24, paddingBottom: 26, marginBottom: -26, overflow: 'hidden' },
});
