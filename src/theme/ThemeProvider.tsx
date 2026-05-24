/**
 * ThemeProvider — light/dark scheme management for the whole app.
 *
 * Exposes:
 *  - useTheme(): { scheme, isDark, colors, gradients, ...tokens, setScheme, toggleScheme }
 *  - useThemedStyles(makeStyles): memoized StyleSheet rebuilt when the theme changes
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {schemes, type AppColors, type ColorScheme} from './colors';
import {gradientSchemes, type AppGradients} from './gradients';
import {typography} from './typography';
import {
  spacing,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  shadows,
} from './spacing';
import {motion} from './motion';

export type SchemePreference = ColorScheme | 'system';

const STORAGE_KEY = '@wedo/color-scheme';

export interface ThemedTokens {
  scheme: ColorScheme;
  isDark: boolean;
  colors: AppColors;
  gradients: AppGradients;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  iconSize: typeof iconSize;
  avatarSize: typeof avatarSize;
  touchTarget: typeof touchTarget;
  shadows: typeof shadows;
  motion: typeof motion;
}

export interface ThemeContextValue extends ThemedTokens {
  preference: SchemePreference;
  setScheme: (pref: SchemePreference) => void;
  toggleScheme: () => void;
}

const buildTokens = (scheme: ColorScheme): ThemedTokens => ({
  scheme,
  isDark: scheme === 'dark',
  colors: schemes[scheme],
  gradients: gradientSchemes[scheme],
  typography,
  spacing,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  shadows,
  motion,
});

const ThemeContext = createContext<ThemeContextValue>({
  ...buildTokens('light'),
  preference: 'system',
  setScheme: () => {},
  toggleScheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [preference, setPreference] = useState<SchemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );
  const hydrated = useRef(false);

  // Load saved preference once
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreference(saved);
        }
      } catch {
        // ignore — fall back to system
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // Track OS appearance changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(
      ({colorScheme}: {colorScheme: ColorSchemeName}) => {
        setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
      },
    );
    return () => sub.remove();
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? systemScheme : preference;

  const setScheme = useCallback((pref: SchemePreference) => {
    setPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...buildTokens(scheme),
      preference,
      setScheme,
      toggleScheme,
    }),
    [scheme, preference, setScheme, toggleScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

/**
 * useThemedStyles(makeStyles)
 * `makeStyles` receives the live themed tokens and returns a StyleSheet.
 * The result is memoized and only recomputed when the scheme changes.
 */
export function useThemedStyles<T extends Record<string, unknown>>(
  makeStyles: (t: ThemedTokens) => T,
): T {
  const tokens = useTheme();
  return useMemo(
    () => makeStyles(tokens),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens.scheme],
  );
}

export default ThemeProvider;
