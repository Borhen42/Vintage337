import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  readonly uniqueItems = computed(() =>
    this.catalog.items().filter((p) => p.stock === 1)
  );

  ngOnInit(): void {
    this.catalog.load();
  }
}
