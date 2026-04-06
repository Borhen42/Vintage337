import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, of, switchMap } from 'rxjs';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import type { CatalogProduct } from '../../core/catalog/catalog-product.model';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { formatCurrency } from '../../core/format/currency';
import { resolveMediaUrl } from '../../core/media/resolve-media-url';

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

  readonly product = signal<CatalogProduct | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly selectedImageIndex = signal(0);
  readonly selectedColor = signal<string | null>(null);
  readonly selectedSize = signal<string | null>(null);
  readonly addAck = signal(false);

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
    if (!g.length) return '';
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

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((pm) => {
          const raw = pm.get('id');
          const id = raw ? Number.parseInt(raw, 10) : NaN;
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.notFound.set(true);
            this.product.set(null);
            return EMPTY;
          }
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
          return;
        }
        this.notFound.set(false);
        this.product.set(p);
        this.applyVariantSelection(p);
      });
  }

  private applyVariantSelection(p: CatalogProduct): void {
    this.selectedImageIndex.set(0);
    const variants = p.variants ?? [];
    const colors = [...new Set(variants.map((x) => (x.color ?? '').trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
    const firstColor = colors[0] ?? null;
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

  selectImage(i: number): void {
    const g = this.gallery();
    if (i >= 0 && i < g.length) this.selectedImageIndex.set(i);
  }

  selectColor(color: string): void {
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
    if (!iso) return '1999';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '1999' : String(d.getFullYear());
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
    window.setTimeout(() => {
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
}
