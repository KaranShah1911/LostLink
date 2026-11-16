import { ReactNode, useContext } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { HeaderHeightContext } from 'expo-router/react-navigation';

/**
 * Keeps the focused text input above the on-screen keyboard.
 *
 * On Android, Expo apps draw edge-to-edge, so the window is no longer resized when the
 * keyboard opens. Without this wrapper the keyboard simply covers the bottom of the screen.
 * behavior="padding" adds bottom padding equal to the keyboard height, which shrinks the
 * ScrollView inside and lets it scroll the focused input into view.
 *
 * keyboardVerticalOffset is the height of the navigation header above this view
 * (0 on screens without a header).
 */
export default function KeyboardAvoider({ children }: { children: ReactNode }) {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={headerHeight}>
      {children}
    </KeyboardAvoidingView>
  );
}
