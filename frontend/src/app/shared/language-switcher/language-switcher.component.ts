import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService, type AppLang } from '../../core/i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  readonly lang = inject(LanguageService);

  setLang(code: AppLang): void {
    this.lang.use(code);
  }

  isActive(code: AppLang): boolean {
    return this.lang.currentLang() === code;
  }
}
