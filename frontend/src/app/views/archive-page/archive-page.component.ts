import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCatalogService } from '../../core/catalog/product-catalog.service';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { HeritageProductPolaroidGridComponent } from '../heritage-shared/heritage-product-polaroid-grid.component';

@Component({
  selector: 'app-archive-page',
  standalone: true,
  imports: [EditorialNavbarComponent, RouterLink, HeritageProductPolaroidGridComponent],
  templateUrl: './archive-page.component.html',
})
export class ArchivePageComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);

  ngOnInit(): void {
    this.catalog.load();
  }
}
