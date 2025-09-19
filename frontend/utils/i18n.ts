import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files directly
import enCommon from './locales/en/common';
import rwCommon from './locales/rw/common';

// Translation resources
const resources = {
  en: {
    common: enCommon
  },
  rw: {
    common: rwCommon
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'excom_language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;