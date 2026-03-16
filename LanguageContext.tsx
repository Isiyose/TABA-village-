import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '../lib/i18n';

type LanguageContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState('en');

  const t = (key: string) => {
    if (translations[lang] && translations[lang][key]) return translations[lang][key];
    if (translations['en'] && translations['en'][key]) return translations['en'][key];
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
