import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'en' | 'fr' | 'ar';

const STORAGE_KEY = 'vintage337_lang';
const LANGS: AppLang[] = ['en', 'fr', 'ar'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  readonly currentLang = signal<AppLang>('en');

  constructor() {
    this.translate.addLangs([...LANGS]);
    this.translate.setFallbackLang('en');
    const initial = this.readStoredLang();
    this.translate.use(initial).subscribe(() => {
      this.applyDocumentLang(initial);
      this.currentLang.set(initial);
    });
  }

  use(lang: AppLang): void {
    if (!LANGS.includes(lang)) return;
    this.translate.use(lang).subscribe(() => {
      this.applyDocumentLang(lang);
      this.currentLang.set(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* private mode */
      }
    });
  }

  private readStoredLang(): AppLang {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'en' || v === 'fr' || v === 'ar') return v;
    } catch {
      /* ignore */
    }
    return 'en';
  }

  private applyDocumentLang(lang: AppLang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
