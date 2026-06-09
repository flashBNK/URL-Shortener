import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLanguage, type Language, type TranslationKey, translations } from "./translations";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const languageStorageKey = "url-shortener-language";
const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(languageStorageKey);
  return stored === "ru" || stored === "en" ? stored : defaultLanguage;
}

function translate(language: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  const [section, item] = key.split(".") as [keyof typeof translations.ru, string];
  const sectionMessages = translations[language][section] as Record<string, string>;
  let message = sectionMessages[item] ?? key;

  Object.entries(params ?? {}).forEach(([name, value]) => {
    message = message.replaceAll(`{${name}}`, String(value));
  });

  return message;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, params) => translate(language, key, params),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return value;
}
