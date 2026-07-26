import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { am } from './am';
import { en, type Locale, type TranslationDict } from './en';

const STORAGE_KEY = 'geoforage-locale';

const dictionaries: Record<Locale, TranslationDict> = { en, am };

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDict;
  /** Replace `{key}` placeholders in a translated string */
  tf: (template: string, vars: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'am' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? readStoredLocale() : 'en'
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'am' ? 'am' : 'en';
    document.documentElement.dataset.locale = locale;
    document.title =
      locale === 'am'
        ? 'GeoForage AI — የእንስሳት ጠባቂ የሳር መረጃ'
        : 'GeoForage AI — Pastoral Forage Intelligence';
  }, [locale]);

  const tf = useCallback((template: string, vars: Record<string, string | number>) => {
    return Object.entries(vars).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
      template
    );
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
      tf,
    }),
    [locale, setLocale, tf]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
