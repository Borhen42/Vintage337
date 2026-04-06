import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCatalogService } from '../../../core/catalog/product-catalog.service';
import type { CatalogProduct } from '../../../core/catalog/catalog-product.model';
import { formatCurrency } from '../../../core/format/currency';

@Component({
  selector: 'app-editorial-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './editorial-categories.component.html',
  styleUrl: './editorial-categories.component.scss',
})
export class EditorialCategoriesComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);

  /** Newest + second-newest (API order: createdAt desc). */
  readonly livePair = computed(() => {
    const list = this.catalog.items();
    if (!list.length) return null;
    return {
      featured: list[0]!,
      side: (list[1] ?? list[0])!,
    };
  });

  ngOnInit(): void {
    this.catalog.load();
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  /** Feature strip under title: category · short description or fallback */
  seriesMeta(p: CatalogProduct): string {
    const desc = p.description?.trim();
    if (desc) {
      const line = desc.split(/[\n.]/)[0]?.trim() ?? desc;
      const short = line.length > 44 ? `${line.slice(0, 41)}…` : line;
      return `${p.category} · ${short}`;
    }
    return `${p.category} · Heritage archive`;
  }

  displaySizes(p: CatalogProduct): string[] {
    const v = p.variants;
    if (!v?.length) {
      return ['OS'];
    }
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
    return Number.isNaN(d.getTime()) ? '1999' : String(d.getFullYear());
  }
}
