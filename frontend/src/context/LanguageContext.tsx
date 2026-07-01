import React, { createContext, useContext, useState } from 'react';
import T, { LangCode, TranslationKeys, LANGUAGES } from '../i18n/translations';

interface LanguageCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: keyof TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: 'en', setLang: () => {}, t: (k) => k as string, isRTL: false,
});

const stored = (): LangCode => {
  const v = localStorage.getItem('memozy_language');
  return (v as LangCode) || 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(stored);

  const setLang = (l: LangCode) => {
    localStorage.setItem('memozy_language', l);
    setLangState(l);
  };

  const t = (key: keyof TranslationKeys): string =>
    T?.[lang]?.[key] ?? T?.['en']?.[key] ?? (key as string);
  const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
