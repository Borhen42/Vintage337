import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/cart/cart.service';
import { formatCurrency } from '../../../core/format/currency';
import { LanguageSwitcherComponent } from '../../../shared/language-switcher/language-switcher.component';
import { UploadSrcPipe } from '../../../core/media/upload-src.pipe';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-editorial-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UploadSrcPipe, LanguageSwitcherComponent, TranslatePipe],
  templateUrl: './editorial-navbar.component.html',
  styleUrl: './editorial-navbar.component.scss',
})
export class EditorialNavbarComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly cartWrapRef = viewChild<ElementRef<HTMLElement>>('cartWrap');

  readonly logoSrc = signal('/assets/imgs/logo.jpg');
  readonly menuOpen = signal(false);
  /** Cart preview dropdown (customers only). */
  readonly cartPanelOpen = signal(false);

  logout(): void {
    this.cart.clear();
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
        this.closeCartPanel();
      });
  }

  toggleCartPanel(): void {
    this.closeMenu();
    this.cartPanelOpen.update((v) => !v);
  }

  closeCartPanel(): void {
    this.cartPanelOpen.set(false);
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  lineTotal(line: { price: number; quantity: number }): number {
    return line.price * line.quantity;
  }

  cartQuantityPadded(): string {
    return String(this.cart.totalQuantity()).padStart(2, '0');
  }

  cartItemsWord(): string {
    const key = this.cart.totalQuantity() === 1 ? 'nav.cartItem' : 'nav.cartItems';
    return this.translate.instant(key);
  }

  onLogoError(): void {
    const current = this.logoSrc();
    if (current.endsWith('logo.jpg')) {
      this.logoSrc.set('/assets/imgs/logo.png');
    }
  }

  toggleMenu(): void {
    this.closeCartPanel();
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
    this.closeCartPanel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.cartPanelOpen()) return;
    const root = this.cartWrapRef()?.nativeElement;
    const target = ev.target as Node | null;
    if (!root || !target || !root.contains(target)) {
      this.closeCartPanel();
    }
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
