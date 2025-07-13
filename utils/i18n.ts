import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';

const resources = {
  en: { translation: en },
  bn: { translation: bn },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // get saved language or default to 'en'
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n; 