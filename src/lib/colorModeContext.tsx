'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

export type ColorModePreference = 'light' | 'dark';

type ColorModeContextValue = {
  preference: ColorModePreference;
  setPreference: (mode: ColorModePreference) => void;
  resolvedMode: 'light' | 'dark';
};

const STORAGE_KEY = 'plutus-color-mode';

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

function setColorModeCookie(mode: ColorModePreference) {
  if (typeof document === 'undefined') {
    return;
  }
  try {
    document.cookie = `${STORAGE_KEY}=${mode};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function readStoredPreference(): ColorModePreference | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const subscribeStorage = (listener: () => void) => {
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
};

export function ColorModeProvider({
  children,
  initialColorMode = 'light',
}: {
  children: React.ReactNode;
  initialColorMode?: ColorModePreference;
}) {
  const storedPreference = useSyncExternalStore(subscribeStorage, readStoredPreference, () => initialColorMode);
  const [chosenPreference, setPreferenceState] = useState<ColorModePreference | null>(null);
  const preference = chosenPreference ?? storedPreference ?? initialColorMode;

  const setPreference = useCallback((mode: ColorModePreference) => {
    setPreferenceState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    setColorModeCookie(mode);
  }, []);

  const resolvedMode = preference;

  useLayoutEffect(() => {
    setColorModeCookie(resolvedMode);
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
