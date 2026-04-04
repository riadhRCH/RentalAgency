import { Injectable, signal } from '@angular/core';
import { DEFAULT_LANGUAGE, Language, translations } from './translations';

const STORAGE_KEY = 'app-language';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  readonly language = signal<Language>(this.getInitialLanguage());

  setLanguage(language: Language) {
    this.language.set(language);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }

  translate(key: string, params?: Record<string, string | number | null | undefined>) {
    const dictionary = translations[this.language()];
    const fallbackDictionary = translations[DEFAULT_LANGUAGE];
    const template = dictionary[key] ?? fallbackDictionary[key] ?? key;

    if (!params) {
      return template;
    }

    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => {
      const value = params[token];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private getInitialLanguage(): Language {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'fr') {
        return stored;
      }
    }

    return DEFAULT_LANGUAGE;
  }
}
