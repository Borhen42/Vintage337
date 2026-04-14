import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import gsap from 'gsap';
import { EMPTY, catchError, finalize, of, switchMap } from 'rxjs';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import type { CatalogProduct } from '../../core/catalog/catalog-product.model';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { formatCurrency } from '../../core/format/currency';
import { resolveMediaUrl } from '../../core/media/resolve-media-url';

/** Minimal SVG placeholder for products without assigned images */
function placeholderImageSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8dcc8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d6c8b0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#grad)" />
  <g opacity="0.3">
    <text x="450" y="380" font-family="sans-serif" font-size="80" font-weight="300" text-anchor="middle" fill="#5c3d2e">
      archive
    </text>
    <text x="450" y="480" font-family="sans-serif" font-size="32" text-anchor="middle" fill="#5c3d2e">
      no image
    </text>
  </g>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [EditorialNavbarComponent, RouterLink],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(ProductCatalogService);
  readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Main hero image — animated when the archive colorway changes. */
  /** Main hero image — animated when the archive colorway changes. */
  private readonly mainImgEl = viewChild<ElementRef<HTMLImageElement>>('mainImg');
  /** Shell used for zoom tracking on hover. */
  private readonly imgShellEl = viewChild<ElementRef<HTMLElement>>('imgShell');

  readonly product = signal<CatalogProduct | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly selectedImageIndex = signal(0);
  readonly selectedColor = signal<string | null>(null);
  readonly selectedSize = signal<string | null>(null);
  readonly addAck = signal(false);
  /** Mobile: show fixed buy bar when the main CTA scrolls out of view (max-width: 959px). */
readonly stickyBuyVisible = signal(false);
readonly lightboxOpen = signal(false);
private readonly buyCtaRef = viewChild<ElementRef<HTMLElement>>('buyCtaAnchor');
private readonly lightboxImgEl = viewChild<ElementRef<HTMLImageElement>>('lightboxImg');
private readonly boundLightboxKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.closeLightbox(); };  private stickyBuyObserver: IntersectionObserver | null = null;
  private addAckTimer: ReturnType<typeof window.setTimeout> | null = null;
  private stickyBuyMq: MediaQueryList | null = null;
  private stickyBuyMqListener: (() => void) | null = null;
  private readonly boundOnImageMove = (e: MouseEvent) => this.onImageMove(e);


  readonly gallery = computed(() => {
    const p = this.product();
    if (!p) return [] as string[];
    const urls = p.imageUrls?.filter((u) => u?.trim()) ?? [];
    const raw = urls.length ? urls : p.imageUrl ? [p.imageUrl] : [];
    return raw.map((u) => resolveMediaUrl(u));
  });

  /** Avoids undefined [src] if the gallery or index is briefly out of sync */
  readonly mainImageUrl = computed(() => {
    const g = this.gallery();
    const i = this.selectedImageIndex();
    if (!g.length) return placeholderImageSvg();
    const clamped = Math.min(Math.max(0, i), g.length - 1);
    return g[clamped] ?? '';
  });

  readonly uniqueColors = computed(() => {
    const v = this.product()?.variants;
    if (!v?.length) return [] as string[];
    return [...new Set(v.map((x) => (x.color ?? '').trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  });

  readonly sizesForColor = computed(() => {
    const p = this.product();
    const color = this.selectedColor();
    const v = p?.variants;
    if (!v?.length || !color) return [] as string[];
    const sizes = v
      .filter((x) => (x.color ?? '').trim() === color)
      .map((x) => (x.size ?? '').trim())
      .filter(Boolean);
    return [...new Set(sizes)];
  });

  readonly stockForSelection = computed(() => {
    const p = this.product();
    const c = this.selectedColor();
    const s = this.selectedSize();
    const v = p?.variants;
    if (!v?.length) return p?.stock ?? 0;
    if (!c || !s) return 0;
    const row = v.find((x) => (x.color ?? '').trim() === c && (x.size ?? '').trim() === s);
    return row?.stock ?? 0;
  });

  readonly descriptionParagraphs = computed(() => {
    const d = this.product()?.description?.trim();
    const fallback =
      'A verified heritage piece from the Vintage337 vault—authenticated and catalogued with the same rigor we apply to every archive entry. Heavy-duty materials, honest construction, and a silhouette that carries the late-century workwear lineage.';
    if (!d) return [fallback];
    const parts = d.split(/\n\n+/).map((x) => x.trim()).filter(Boolean);
    return parts.length ? parts : [d];
  });

  readonly breadcrumbPieces = computed(() => {
    const p = this.product();
    if (!p) return [] as string[];
    return [
      'Archive',
      (p.category ?? 'Collection').toUpperCase(),
      (p.name ?? 'Piece').toUpperCase(),
    ];
  });

  readonly thumbSlots = computed(() => {
    const g = this.gallery();
    const n = g.length;
    if (n === 0) return [] as { src: string; index: number; more: number }[];
    if (n <= 4) {
      return g.map((src, index) => ({ src, index, more: 0 }));
    }
    const more = n - 4;
    return [
      { src: g[0], index: 0, more: 0 },
      { src: g[1], index: 1, more: 0 },
      { src: g[2], index: 2, more: 0 },
      { src: g[3], index: 3, more },
    ];
  });

  readonly limitedBadge = computed(() => {
    const p = this.product();
    if (!p) return false;
    const t = p.stock;
    return t > 0 && t <= 24;
  });

  /** Short label for sticky bar (size / colorway when variants exist). */
  readonly stickyVariantHint = computed(() => {
    if (!this.uniqueColors().length) {
      return '';
    }
    const s = this.selectedSize();
    const c = this.selectedColor();
    if (s && c) {
      return `${s} · ${c}`;
    }
    return s ?? c ?? '';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
  if (this.addAckTimer !== null) {
    window.clearTimeout(this.addAckTimer);
    this.addAckTimer = null;
  }
  const el = this.mainImgEl()?.nativeElement;
  if (el) gsap.killTweensOf(el);
  this._teardownLightbox();
  this.teardownStickyBuyBar();
});


    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((pm) => {
          const raw = pm.get('id');
          const id = raw ? Number.parseInt(raw, 10) : NaN;
          if (!Number.isFinite(id) || id < 1) {
            this.teardownStickyBuyBar();
            this.loading.set(false);
            this.notFound.set(true);
            this.product.set(null);
            return EMPTY;
          }
          this.teardownStickyBuyBar();
          this.loading.set(true);
          this.notFound.set(false);
          this.product.set(null);
          return this.catalog.getById(id).pipe(
            catchError(() => {
              this.notFound.set(true);
              this.product.set(null);
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((p) => {
        if (p === null) {
          this.teardownStickyBuyBar();
          return;
        }
        this.notFound.set(false);
        this.product.set(p);
        this.applyVariantSelection(p);
        afterNextRender(
          () => {
            if (this.destroyRef.destroyed) {
              return;
            }
            const img = this.mainImgEl()?.nativeElement;
            if (img) {
              gsap.killTweensOf(img);
              gsap.set(img, { opacity: 1, scale: 1 });
            }
          },
          { injector: this.injector },
        );
        this.setupStickyBuyBar();
      });
  }

  private setupStickyBuyBar(): void {
    this.teardownStickyBuyBar();
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.stickyBuyMq = window.matchMedia('(max-width: 959px)');
    const attach = () => {
      this.stickyBuyObserver?.disconnect();
      this.stickyBuyObserver = null;
      if (!this.stickyBuyMq?.matches) {
        this.stickyBuyVisible.set(false);
        return;
      }
      const el = this.buyCtaRef()?.nativeElement;
      if (!el) {
        return;
      }
      this.stickyBuyObserver = new IntersectionObserver(
        ([entry]) => {
          if (!this.stickyBuyMq?.matches) {
            this.stickyBuyVisible.set(false);
            return;
          }
          this.stickyBuyVisible.set(!entry.isIntersecting);
        },
        { root: null, threshold: 0, rootMargin: '0px' },
      );
      this.stickyBuyObserver.observe(el);
    };

    afterNextRender(() => { if (!this.destroyRef.destroyed) attach(); }, { injector: this.injector });

    this.stickyBuyMqListener = () => attach();
    this.stickyBuyMq.addEventListener('change', this.stickyBuyMqListener);
  }

  private teardownStickyBuyBar(): void {
    this.stickyBuyObserver?.disconnect();
    this.stickyBuyObserver = null;
    if (this.stickyBuyMq && this.stickyBuyMqListener) {
      this.stickyBuyMq.removeEventListener('change', this.stickyBuyMqListener);
    }
    this.stickyBuyMq = null;
    this.stickyBuyMqListener = null;
    this.stickyBuyVisible.set(false);
  }

  private applyVariantSelection(p: CatalogProduct): void {
    const variants = p.variants ?? [];
    const colors = [...new Set(variants.map((x) => (x.color ?? '').trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
    const firstColor = colors[0] ?? null;
    const imageIdx = firstColor ? this.colorToGalleryIndex(firstColor) : 0;
    this.selectedImageIndex.set(imageIdx);
    this.selectedColor.set(firstColor);
    const sizes = firstColor
      ? [
        ...new Set(
          variants
            .filter((x) => (x.color ?? '').trim() === firstColor)
            .map((x) => (x.size ?? '').trim())
            .filter(Boolean),
        ),
      ]
      : [];
    this.selectedSize.set(sizes[0] ?? null);
  }

  /**
   * Gallery slot for a colorway: first color → first image, etc. (typical lookbook order).
   * Clamps when there are fewer photos than colors.
   */
  private colorToGalleryIndex(color: string): number {
    const g = this.gallery();
    if (!g.length) {
      return 0;
    }
    const colors = this.uniqueColors();
    const ci = colors.indexOf(color);
    const safe = ci >= 0 ? ci : 0;
    return Math.min(safe, g.length - 1);
  }

  private applyColorSelection(color: string, imageIndex: number): void {
    this.selectedColor.set(color);
    const p = this.product();
    const sizes =
      p?.variants
        ?.filter((x) => (x.color ?? '').trim() === color)
        .map((x) => (x.size ?? '').trim())
        .filter(Boolean) ?? [];
    const uniq = [...new Set(sizes)];
    const cur = this.selectedSize();
    this.selectedSize.set(cur && uniq.includes(cur) ? cur : uniq[0] ?? null);
    this.selectedImageIndex.set(imageIndex);
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  selectImage(i: number): void {
    const g = this.gallery();
    if (i >= 0 && i < g.length) this.selectedImageIndex.set(i);
  }

  selectColor(color: string): void {
    const nextIdx = this.colorToGalleryIndex(color);
    const g = this.gallery();
    const nextUrl = g[nextIdx] ?? '';
    const currentUrl = this.mainImageUrl();

    if (color === this.selectedColor() && nextIdx === this.selectedImageIndex()) {
      return;
    }

    if (this.prefersReducedMotion() || !nextUrl || nextUrl === currentUrl) {
      this.applyColorSelection(color, nextIdx);
      return;
    }

    const el = this.mainImgEl()?.nativeElement;
    if (!el) {
      this.applyColorSelection(color, nextIdx);
      return;
    }

    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      scale: 0.96,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => {
        if (this.destroyRef.destroyed) {
          return;
        }
        this.applyColorSelection(color, nextIdx);
        afterNextRender(
          () => {
            if (this.destroyRef.destroyed) {
              return;
            }
            const img = this.mainImgEl()?.nativeElement;
            if (!img) {
              return;
            }
            gsap.killTweensOf(img);
            const runEnter = () => {
              gsap.fromTo(
                img,
                { opacity: 0, scale: 1.035 },
                {
                  opacity: 1,
                  scale: 1,
                  duration: 0.48,
                  ease: 'power3.out',
                  clearProps: 'transform',
                },
              );
            };
            if (img.complete && img.naturalWidth > 0) {
              runEnter();
            } else {
              const done = () => {
                img.removeEventListener('load', done);
                img.removeEventListener('error', done);
                runEnter();
              };
              img.addEventListener('load', done);
              img.addEventListener('error', done);
            }
          },
          { injector: this.injector },
        );
      },
    });
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  /** Editorial “reference” value — not a live promo price; keeps the lookbook rhythm from the mockup */
  compareAtPrice(p: CatalogProduct): string {
    const base = Number(p.price);
    const safe = Number.isFinite(base) ? base : 0;
    const bumped = Math.ceil(safe * 1.18 * 100) / 100;
    return this.formatPrice(bumped);
  }

  yearEst(iso: string): string {
    if (!iso) return 'Now';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? 'Now' : String(d.getFullYear());
  }

  addToArchive(): void {
    const p = this.product();
    if (!p || this.stockForSelection() <= 0) return;
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (!this.auth.isCustomer()) {
      void this.router.navigate(['/'], { fragment: 'heritage-series' });
      return;
    }
    const size = this.selectedSize() ?? 'OS';
    const color = this.selectedColor() ?? 'Default';
    this.cart.addFromProduct(p, size, color, this.stockForSelection());
    this.addAck.set(true);
    if (this.addAckTimer !== null) {
      window.clearTimeout(this.addAckTimer);
    }
    this.addAckTimer = window.setTimeout(() => {
      if (this.destroyRef.destroyed) {
        return;
      }
      this.addAck.set(false);
      void this.router.navigateByUrl('/cart');
    }, 400);
  }

  goBack(): void {
    void this.router.navigateByUrl('/catalogue');
  }

  /** Maps admin color labels to swatch palette keys (fallback: neutral) */
  swatchTone(color: string): string {
    const c = color.toLowerCase();
    if (/(black|noir|ink)/.test(c)) return 'black';
    if (/(tan|sand|camel|khaki|beige)/.test(c)) return 'tan';
    if (/(navy|blue|indigo|denim)/.test(c)) return 'navy';
    if (/(green|olive|sage|forest)/.test(c)) return 'green';
    if (/(red|burgundy|wine)/.test(c)) return 'red';
    if (/(white|cream|natural)/.test(c)) return 'cream';
    if (/(grey|gray|charcoal|washed)/.test(c)) return 'grey';
    if (/(brown|chocolate|coffee)/.test(c)) return 'brown';
    return 'brown';
  }



  /** Bound reference kept for proper removeEventListener cleanup. */

onImageEnter(): void {
  if (this.prefersReducedMotion()) return;
  const shell = this.imgShellEl()?.nativeElement;
  if (shell) shell.addEventListener('mousemove', this.boundOnImageMove);
  const img = this.mainImgEl()?.nativeElement;
  if (!img) return;
  gsap.killTweensOf(img);
  gsap.to(img, { scale: 1.07, duration: 0.55, ease: 'power2.out' });
}

onImageLeave(): void {
  if (this.prefersReducedMotion()) return;
  const shell = this.imgShellEl()?.nativeElement;
  if (shell) shell.removeEventListener('mousemove', this.boundOnImageMove);
  const img = this.mainImgEl()?.nativeElement;
  if (!img) return;
  gsap.killTweensOf(img);
  gsap.to(img, {
    scale: 1,
    x: 0,
    y: 0,
    duration: 0.55,
    ease: 'power3.out',
    clearProps: 'transform',
  });
}

private onImageMove(e: MouseEvent): void {
  if (this.prefersReducedMotion()) return;
  const shell = this.imgShellEl()?.nativeElement;
  const img  = this.mainImgEl()?.nativeElement;
  if (!shell || !img) return;

  const { left, top, width, height } = shell.getBoundingClientRect();
  // Normalized -0.5 → +0.5 relative to shell center
  const nx = (e.clientX - left) / width  - 0.5;
  const ny = (e.clientY - top)  / height - 0.5;

  // Max pan in px — image stays inside shell at scale 1.07
  const maxX = width  * 0.04;
  const maxY = height * 0.04;

  gsap.to(img, {
    x: nx * maxX * 2,
    y: ny * maxY * 2,
    duration: 0.6,
    ease: 'power1.out',
    overwrite: 'auto',
  });
}






// ── Lightbox ──────────────────────────────────────────────────────────────

openLightbox(): void {
  this.lightboxOpen.set(true);
  document.addEventListener('keydown', this.boundLightboxKey);
  document.body.style.overflow = 'hidden';

  afterNextRender(
    () => {
      if (this.destroyRef.destroyed) {
        return;
      }
      const img = this.lightboxImgEl()?.nativeElement;
      if (!img) return;
      gsap.fromTo(
        img,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 0.42, ease: 'power3.out' },
      );
    },
    { injector: this.injector },
  );
}

closeLightbox(): void {
  const img = this.lightboxImgEl()?.nativeElement;
  if (!img) {
    this._teardownLightbox();
    return;
  }
  gsap.to(img, {
    opacity: 0,
    scale: 0.88,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: () => this._teardownLightbox(),
  });
}

private _teardownLightbox(): void {
  this.lightboxOpen.set(false);
  document.removeEventListener('keydown', this.boundLightboxKey);
  document.body.style.overflow = '';
}
}
