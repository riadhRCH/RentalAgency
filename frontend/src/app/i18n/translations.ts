export type Language = 'en' | 'fr';

export const DEFAULT_LANGUAGE: Language = 'en';

import enNested from './en.json';
import frNested from './fe.json';

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value as string;
    }
  }
  return result;
}

export const translations: Record<Language, Record<string, string>> = {
  en: flatten(enNested),
  fr: flatten(frNested),
};
