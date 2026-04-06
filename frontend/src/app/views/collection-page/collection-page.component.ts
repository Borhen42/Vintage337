import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../core/catalog/catalog-product.model';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { HeritageProductPolaroidGridComponent } from '../heritage-shared/heritage-product-polaroid-grid.component';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [EditorialNavbarComponent, RouterLink, HeritageProductPolaroidGridComponent],
  templateUrl: './collection-page.component.html',
})
export class CollectionPageComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);

  readonly groups = computed(() => {
    const items = this.catalog.items();
    const map = new Map<string, CatalogProduct[]>();
    for (const p of items) {
      const key = (p.category || '').trim() || 'Uncategorized';
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, products], blockIndex) => ({ name, products, blockIndex }));
  });

  ngOnInit(): void {
    this.catalog.load();
  }

  blockOffset(blockIndex: number): number {
    return blockIndex * 3;
  }
}
