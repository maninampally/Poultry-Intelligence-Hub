// i18n setup. English only for now, but every user-facing string goes
// through t('key') so later translation is a data-only task (AGENTS.md #2).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';

export const defaultNS = 'translation';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
