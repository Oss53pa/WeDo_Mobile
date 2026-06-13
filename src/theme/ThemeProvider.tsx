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
import {
  AMBIANCES,
  applyAmbiance,
  type AmbianceKey,
  type AdinkraKey,
} from './ambiances';
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
const AMBIANCE_KEY = '@wedo/ambiance';

export interface ThemedTokens {
  scheme: ColorScheme;
  isDark: boolean;
  colors: AppColors;
  gradients: AppGradients;
  /** Selected ambiance (mood) + its signature adinkra & greeting. */
  ambiance: AmbianceKey;
  adinkra: AdinkraKey;
  greeting: string;
  balanceLabel: string;
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
  setAmbiance: (key: AmbianceKey) => void;
}

const buildTokens = (scheme: ColorScheme, ambiance: AmbianceKey): ThemedTokens => {
  const {colors, gradients} = applyAmbiance(
    schemes[scheme],
    gradientSchemes[scheme],
    ambiance,
  );
  const def = AMBIANCES[ambiance] ?? AMBIANCES.standard;
  return {
    scheme,
    isDark: scheme === 'dark',
    colors,
    gradients,
    ambiance,
    adinkra: def.adinkra,
    greeting: def.greeting,
    balanceLabel: def.balanceLabel,
    typography,
    spacing,
    borderRadius,
    iconSize,
    avatarSize,
    touchTarget,
    shadows,
    motion,
  };
};

const ThemeContext = createContext<ThemeContextValue>({
  ...buildTokens('light', 'standard'),
  preference: 'system',
  setScheme: () => {},
  toggleScheme: () => {},
  setAmbiance: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [preference, setPreference] = useState<SchemePreference>('system');
  const [ambiance, setAmbianceState] = useState<AmbianceKey>('standard');
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );
  const hydrated = useRef(false);

  // Load saved preferences once
  useEffect(() => {
    (async () => {
      try {
        const [savedScheme, savedAmbiance] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(AMBIANCE_KEY),
        ]);
        if (savedScheme === 'light' || savedScheme === 'dark' || savedScheme === 'system') {
          setPreference(savedScheme);
        }
        if (savedAmbiance && savedAmbiance in AMBIANCES) {
          setAmbianceState(savedAmbiance as AmbianceKey);
        }
      } catch {
        // ignore — fall back to defaults
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

  const setAmbiance = useCallback((key: AmbianceKey) => {
    setAmbianceState(key);
    AsyncStorage.setItem(AMBIANCE_KEY, key).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...buildTokens(scheme, ambiance),
      preference,
      setScheme,
      toggleScheme,
      setAmbiance,
    }),
    [scheme, ambiance, preference, setScheme, toggleScheme, setAmbiance],
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
    [tokens.scheme, tokens.ambiance],
  );
}

export default ThemeProvider;
