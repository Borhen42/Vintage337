import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-editorial-hero',
  standalone: true,
  templateUrl: './editorial-hero.component.html',
  styleUrl: './editorial-hero.component.scss',
})
export class EditorialHeroComponent {
  readonly heroLogoSrc = signal('/assets/imgs/logo.jpg');

  onHeroLogoError(): void {
    const current = this.heroLogoSrc();
    if (current.endsWith('logo.jpg')) {
      this.heroLogoSrc.set('/assets/imgs/logo.png');
    }
  }
}
