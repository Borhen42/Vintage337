import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../../core/catalog/catalog-product.model';
import { resolveMediaUrl } from '../../../core/media/resolve-media-url';
import { ProductCatalogService } from '../../../core/catalog/product-catalog.service';
import { formatCurrency } from '../../../core/format/currency';
import { AdminOrderService } from '../../../core/orders/admin-order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly catalog = inject(ProductCatalogService);
  private readonly ordersApi = inject(AdminOrderService);

  readonly productCount = this.catalog.productCount;
  readonly previewProducts = computed(() => this.catalog.items().slice(0, 6));
  readonly deletingId = signal<number | null>(null);
  readonly shippingExportLoading = signal(false);

  ngOnInit(): void {
    this.catalog.load();
  }

  previewPrimarySrc(p: CatalogProduct): string {
    const fromGallery = p.imageUrls?.map((u) => String(u ?? '').trim()).find((u) => u.length > 0);
    const raw = fromGallery || String(p.imageUrl ?? '').trim();
    return resolveMediaUrl(raw || null);
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  stockLabel(stock: number): { text: string; variant: 'ok' | 'low' | 'out' } {
    if (stock <= 0) return { text: 'Sold out', variant: 'out' };
    if (stock <= 5) return { text: `${stock} left`, variant: 'low' };
    return { text: `${stock} in stock`, variant: 'ok' };
  }

  removeProduct(p: CatalogProduct, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const ok = window.confirm(
      `Remove "${p.name}" from the storefront? The listing will be hidden; past orders are unchanged.`,
    );
    if (!ok) return;
    this.deletingId.set(p.id);
    this.catalog.deleteProduct(p.id).subscribe({
      next: () => this.deletingId.set(null),
      error: () => {
        this.deletingId.set(null);
        window.alert('Could not remove the product. Is the API running?');
      },
    });
  }

  exportShippingLogs(): void {
    if (this.shippingExportLoading()) return;
    this.shippingExportLoading.set(true);
    const fallback = `Vintage337-shipping-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    this.ordersApi.shippingLogsCsv().subscribe({
      next: (resp) => {
        const blob = resp.body;
        if (!blob || blob.size === 0) {
          this.shippingExportLoading.set(false);
          window.alert('The export file was empty.');
          return;
        }
        this.triggerFileDownload(blob, resp, fallback);
        this.shippingExportLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.shippingExportLoading.set(false);
        if (err.status === 0) {
          window.alert(
            'Cannot reach the API. Start Spring Boot on port 8080 and ensure the dev proxy targets 127.0.0.1:8080.',
          );
          return;
        }
        if (err.error instanceof Blob) {
          void err.error.text().then((t) => window.alert(t.trim() || `Export failed (HTTP ${err.status}).`));
          return;
        }
        window.alert(`Could not export shipping logs (HTTP ${err.status}).`);
      },
    });
  }

  private triggerFileDownload(blob: Blob, resp: HttpResponse<Blob>, fallbackFilename: string): void {
    let filename = fallbackFilename;
    const cd = resp.headers.get('Content-Disposition');
    const m = cd?.match(/filename="([^"]+)"/);
    if (m) filename = m[1];
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
