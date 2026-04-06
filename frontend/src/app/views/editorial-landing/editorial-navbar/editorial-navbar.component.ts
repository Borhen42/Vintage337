import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/cart/cart.service';

@Component({
  selector: 'app-editorial-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './editorial-navbar.component.html',
  styleUrl: './editorial-navbar.component.scss',
})
export class EditorialNavbarComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly router = inject(Router);

  readonly logoSrc = signal('/assets/imgs/logo.jpg');
  readonly menuOpen = signal(false);

  logout(): void {
    this.cart.clear();
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  onLogoError(): void {
    const current = this.logoSrc();
    if (current.endsWith('logo.jpg')) {
      this.logoSrc.set('/assets/imgs/logo.png');
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => {
      const next = !v;
      this.setBodyScrollLocked(next);
      return next;
    });
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.setBodyScrollLocked(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 900) {
      this.closeMenu();
    }
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const raw = new FormData(form).get('q');
    const q = typeof raw === 'string' ? raw.trim() : '';
    void this.router.navigate(['/catalogue'], { queryParams: q.length ? { q } : {} });
  }

  onDrawerSearchSubmit(event: Event): void {
    this.onSearchSubmit(event);
    this.closeMenu();
  }
}
