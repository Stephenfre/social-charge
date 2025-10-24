import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GluestackUIProvider } from '~/components/ui';
import { ModeType } from '~/components/ui/gluestack-ui-provider/types';

type ThemeMode = Extract<ModeType, 'light' | 'dark'>;

type ThemePalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  inverseText: string;
  tabBar: string;
  header: string;
  modal: string;
  overlay: string;
  accent: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  palette: ThemePalette;
};

const STORAGE_KEY = 'theme:color-scheme';

const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F7',
    surfaceMuted: '#EAEAED',
    border: '#D7D8DD',
    text: '#18191F',
    inverseText: '#FFFFFF',
    tabBar: '#FFFFFF',
    header: '#F7F7FA',
    modal: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.35)',
    accent: '#0056B3',
  },
  dark: {
    background: '#121212',
    surface: '#18191F',
    surfaceMuted: '#1F2026',
    border: '#2B2C33',
    text: '#F5F5F5',
    inverseText: '#111111',
    tabBar: '#0F1012',
    header: '#0F1012',
    modal: '#18191F',
    overlay: 'rgba(0,0,0,0.55)',
    accent: '#4A90E2',
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark' || stored === 'light') {
          setMode(stored);
        }
      })
      .catch(() => {
        /* noop: fall back to default */
      });
  }, []);

  const handleSetMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {
      /* noop */
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
        /* noop */
      });
      return next;
    });
  }, []);

  const palette = useMemo(() => THEME_PALETTES[mode], [mode]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      isLight: mode === 'light',
      setMode: handleSetMode,
      toggleMode,
      palette,
    }),
    [handleSetMode, mode, palette, toggleMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <GluestackUIProvider mode={mode}>{children}</GluestackUIProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
