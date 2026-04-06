import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { HeritageProductPolaroidGridComponent } from '../heritage-shared/heritage-product-polaroid-grid.component';

@Component({
  selector: 'app-catalogue-page',
  standalone: true,
  imports: [EditorialNavbarComponent, RouterLink, HeritageProductPolaroidGridComponent],
  templateUrl: './catalogue-page.component.html',
})
export class CataloguePageComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);
  private readonly route = inject(ActivatedRoute);
  readonly selectedCategory = signal<string>('All');

  /** From URL ?q= — case-insensitive match on product name */
  readonly nameSearch = toSignal(
    this.route.queryParamMap.pipe(map((m) => (m.get('q') ?? '').trim())),
    { initialValue: '' },
  );

  readonly categoryOptions = computed(() => {
    const cats = new Set<string>();
    for (const p of this.catalog.items()) {
      cats.add((p.category || '').trim() || 'Uncategorized');
    }
    return ['All', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  });

  readonly filteredItems = computed(() => {
    const all = this.catalog.items();
    const sel = this.selectedCategory();
    let list = sel === 'All' ? all : all.filter((p) => ((p.category || '').trim() || 'Uncategorized') === sel);
    const q = this.nameSearch().toLowerCase();
    if (q.length) {
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    return list;
  });

  readonly searchActive = computed(() => this.nameSearch().trim().length > 0);

  readonly gridEmptyMessage = computed(() => {
    const q = this.nameSearch().trim();
    if (q.length) {
      return `No pieces match “${q}” in the name. Try another term or clear the search.`;
    }
    return 'No pieces match this filter, or the vault is still empty. Try another category or add stock in admin.';
  });

  ngOnInit(): void {
    this.catalog.load();
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }
}
