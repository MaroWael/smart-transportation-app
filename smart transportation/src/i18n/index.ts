import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from '@/i18n/locales/en.json';

export const SUPPORTED_LANGUAGES = ['en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type EnLocales = typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: EnLocales;
    };
  }
}

const detectedLanguage = getLocales()[0]?.languageTag?.split('-')[0] ?? 'en';
const language: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
  detectedLanguage as SupportedLanguage,
)
  ? (detectedLanguage as SupportedLanguage)
  : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: language,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'translation',
  ns: ['translation'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;