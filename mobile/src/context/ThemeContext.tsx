import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import { profileApi } from '@/lib/api';
import { palette, THEME_IDS, ThemeColors, ThemeId, THEMES } from '@/constants';

const THEME_KEY = 'lostlink_theme';

function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEME_IDS as readonly string[]).includes(value);
}

/** The theme saved on this phone, read synchronously so the very first screen already uses it. */
function savedTheme(): ThemeId {
  try {
    const stored = SecureStore.getItem(THEME_KEY);
    return isThemeId(stored) ? stored : 'vjti';
  } catch {
    return 'vjti';
  }
}

interface ThemeContextValue {
  themeId: ThemeId;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Holds the selected colour theme.
 * The choice is saved in two places:
 *   - on the phone (Secure Store), so the app opens in the right theme even before login;
 *   - in the user's MongoDB document (selectedTheme), so it follows the user to another phone.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(savedTheme);

  // After login / session restore, switch to the theme stored on the user's account.
  // (Adjusting state during render when an input changes is the pattern React recommends
  // instead of an effect.)
  const accountTheme = user?.selectedTheme;
  const [appliedAccountTheme, setAppliedAccountTheme] = useState(accountTheme);
  if (accountTheme !== appliedAccountTheme) {
    setAppliedAccountTheme(accountTheme);
    if (isThemeId(accountTheme)) setThemeId(accountTheme);
  }

  // Remember the current theme on this phone, so the next app start (even before login) uses it.
  useEffect(() => {
    SecureStore.setItemAsync(THEME_KEY, themeId).catch(() => {});
  }, [themeId]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeId(id); // applies immediately
      // Save to the account in the background. If it fails, the theme still works on this phone.
      if (user) profileApi.updateTheme(id).then(updateUser).catch(() => {});
    },
    [user, updateUser]
  );

  const value = useMemo(
    () => ({ themeId, colors: { ...palette, ...THEMES[themeId].tokens }, setTheme }),
    [themeId, setTheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Gives a component the current theme colours. Pass a `makeStyles(colors)` function to also
 * get a StyleSheet built with those colours; it is rebuilt only when the theme changes.
 *
 *   const { colors, styles } = useTheme(makeStyles);
 */
export function useTheme(): ThemeContextValue;
export function useTheme<S>(makeStyles: (colors: ThemeColors) => S): ThemeContextValue & { styles: S };
export function useTheme<S>(makeStyles?: (colors: ThemeColors) => S) {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  const styles = useMemo(() => (makeStyles ? makeStyles(context.colors) : undefined), [makeStyles, context.colors]);
  return { ...context, styles };
}
