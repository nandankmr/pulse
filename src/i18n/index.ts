// src/i18n/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      home: 'Home',
      profile: 'Profile',
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido',
      home: 'Inicio',
      profile: 'Perfil',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
