export type SupportedLanguage = 'en' | 'hi' | 'ta';

export const i18n = {
  locale: 'en' as SupportedLanguage,
  t: (key: string) => key,
};
