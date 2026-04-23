import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../core/catalog/catalog-product.model';
import { formatCurrency } from '../../core/format/currency';
import { UploadSrcPipe } from '../../core/media/upload-src.pipe';

@Component({
  selector: 'app-heritage-product-polaroid-grid',
  standalone: true,
  imports: [RouterLink, UploadSrcPipe],
  templateUrl: './heritage-product-polaroid-grid.component.html',
})
export class HeritageProductPolaroidGridComponent {
  products = input.required<CatalogProduct[]>();
  loading  = input(false);
  loadError = input(false);
  errorMessage = input(
    'The archive could not be reached. Start the API (mvn spring-boot:run) and refresh.',
  );
  emptyMessage = input('');
  placeholderText = input('Authenticated Archives Only.');
  placeholderAfterIndex = input(2);
  showPlaceholderWhenFew = input(true);
  showPlaceholderTile = input(true);
  indexOffset = input(0);

  formatMeta(p: CatalogProduct): string {
    const y = this.yearFromCreated(p.createdAt);
    return `EST. ${y} / ${p.category.toUpperCase()}`;
  }

  yearFromCreated(iso: string): string {
    if (!iso) return String(new Date().getFullYear());
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(new Date().getFullYear()) : String(d.getFullYear());
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  showSeal(index: number, p: CatalogProduct): boolean {
    return (index + p.id) % 3 !== 1;
  }

  showQuickAdd(index: number, p: CatalogProduct): boolean {
    return (index + p.id) % 4 === 0 && p.stock > 0;
  }

  polaroidMod(index: number): string {
    const mods = [
      'archive-polaroid--a',
      'archive-polaroid--b',
      'archive-polaroid--c',
      'archive-polaroid--d',
      'archive-polaroid--e',
      'archive-polaroid--f',
      'archive-polaroid--g',
    ];
    return mods[(index + this.indexOffset()) % mods.length];
  }

  imageToneClass(index: number): string {
    const tones = ['tone-a', 'tone-b', 'tone-c', 'tone-d', 'tone-e', 'tone-f', 'tone-g'];
    return tones[(index + this.indexOffset()) % tones.length];
  }
}
