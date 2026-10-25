import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SupportedLanguage, Translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'rocket_arena_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // 1. Check saved language
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && translations[saved]) {
      return saved;
    }
    
    // 2. Try browser language detection
    const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
    if (browserLang && (browserLang in translations)) {
      return browserLang as SupportedLanguage;
    }
    
    // 3. Fallback to Spanish as specified
    return 'es';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] || translations.es
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
