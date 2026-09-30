export const LANGUAGE_KEY = 'simple-bank-language';
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function localeFor(language: string): string {
  if (language.startsWith('es')) return 'es-ES';
  if (language.startsWith('fr')) return 'fr-FR';
  return 'en-US';
}

export function normalizeLanguage(language: string | undefined): AppLanguage {
  const base = (language || 'en').slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base) ? (base as AppLanguage) : 'en';
}
