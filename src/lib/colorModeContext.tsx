'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export type ColorModePreference = 'light' | 'dark';

type ColorModeContextValue = {
  preference: ColorModePreference;
  setPreference: (mode: ColorModePreference) => void;
  resolvedMode: 'light' | 'dark';
};

const STORAGE_KEY = 'plutus-color-mode';

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

function readStoredPreference(): ColorModePreference {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') {
      return v;
    }
    // Legacy "system" or unknown: default to light and normalize storage
    if (v === 'system' || v != null) {
      localStorage.setItem(STORAGE_KEY, 'light');
    }
  } catch {
    /* ignore */
  }
  return 'light';
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorModePreference>('light');

  // useLayoutEffect (not useEffect) so localStorage is applied before the first paint.
  // useEffect caused a visible flash: light theme background + dark-styled chrome until storage ran.
  useLayoutEffect(() => {
    setPreferenceState(readStoredPreference());
  }, []);

  const setPreference = useCallback((mode: ColorModePreference) => {
    setPreferenceState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const resolvedMode = preference;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedMode;
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  const value = useMemo(
    () => ({ preference, setPreference, resolvedMode }),
    [preference, setPreference, resolvedMode],
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode must be used within ColorModeProvider');
  }
  return ctx;
}
