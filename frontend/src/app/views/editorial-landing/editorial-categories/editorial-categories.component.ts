import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProductCatalogService } from '../../../core/catalog/product-catalog.service';
import type { CatalogProduct } from '../../../core/catalog/catalog-product.model';
import { formatCurrency } from '../../../core/format/currency';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-editorial-categories',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './editorial-categories.component.html',
  styleUrl: './editorial-categories.component.scss',
})
export class EditorialCategoriesComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);

  readonly livePair = computed(() => {
    const list = this.catalog.items();
    if (!list.length) return null;
    return {
      featured: list[0]!,
      side: (list[1] ?? list[0])!,
    };
  });

  readonly loadingText = computed(() => {
    this.lang.currentLang();
    return this.translate.instant('landing.categories.loading');
  });

  ngOnInit(): void {
    this.catalog.load();
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  seriesMeta(p: CatalogProduct): string {
    this.lang.currentLang();
    const desc = p.description?.trim();
    if (desc) {
      const line = desc.split(/[\n.]/)[0]?.trim() ?? desc;
      const short = line.length > 44 ? `${line.slice(0, 41)}...` : line;
      return `${p.category} · ${short}`;
    }
    return `${p.category} · ${this.translate.instant('landing.categories.seriesMetaFallback')}`;
  }

  displaySizes(p: CatalogProduct): string[] {
    const v = p.variants;
    if (!v?.length) return ['OS'];
    const sizes = [...new Set(v.map((x) => (x.size ?? '').trim()).filter(Boolean))];
    return sizes.length ? sizes.slice(0, 6) : ['OS'];
  }

  highlightedSize(p: CatalogProduct): string {
    const s = this.displaySizes(p);
    if (!s.length) return '';
    return s[Math.min(1, s.length - 1)]!;
  }

  primaryImage(p: CatalogProduct): string {
    const urls = p.imageUrls?.filter((u) => u?.trim()) ?? [];
    if (urls.length) return urls[0]!;
    return p.imageUrl || '';
  }

  vaultYear(p: CatalogProduct): string {
    const d = new Date(p.createdAt);
    return Number.isNaN(d.getTime()) ? 'Now' : String(d.getFullYear());
  }
}
