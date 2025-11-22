import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'ms_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  current(): string { return this.translate.currentLang || 'es'; }

  use(lang: 'es' | 'en') {
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }
}
