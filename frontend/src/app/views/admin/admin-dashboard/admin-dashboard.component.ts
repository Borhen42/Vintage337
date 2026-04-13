import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import type { CatalogProduct } from '../../../core/catalog/catalog-product.model';
import { AdminDashboardService } from '../../../core/admin/admin-dashboard.service';
import { resolveMediaUrl } from '../../../core/media/resolve-media-url';
import { ProductCatalogService } from '../../../core/catalog/product-catalog.service';
import { formatCurrency } from '../../../core/format/currency';
import { AdminOrderService } from '../../../core/orders/admin-order.service';
import type { AdminDashboardStats, MostSoldProduct } from '../../../core/admin/admin-dashboard.models';
import type { AdminOrder } from '../../../core/orders/models';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  readonly catalog = inject(ProductCatalogService);
  private readonly ordersApi = inject(AdminOrderService);
  private readonly dashboardApi = inject(AdminDashboardService);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);

  private readonly mostSoldRoot = viewChild<ElementRef<HTMLElement>>('mostSoldRoot');
  private mostSoldMotionDone = false;
  private mostSoldTimeline?: gsap.core.Timeline;

  readonly productCount = this.catalog.productCount;
  readonly previewProducts = computed(() => this.catalog.items().slice(0, 6));
  readonly deletingId = signal<number | null>(null);
  readonly shippingExportLoading = signal(false);

  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly statsLoading = signal(true);
  readonly statsError = signal(false);

  readonly orders = signal<AdminOrder[]>([]);
  readonly ordersLoading = signal(true);
  readonly ordersLoadError = signal(false);

  readonly recentOrders = computed(() => {
    const rows = [...this.orders()];
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows.slice(0, 5);
  });

  readonly archivistTrendText = computed(() => {
    this.lang.currentLang();
    const s = this.stats();
    if (!s || this.statsError()) return '—';
    const p = s.archivistGrowthPercent;
    const dirKey = p >= 0 ? 'adminDashboard.increase' : 'adminDashboard.decrease';
    return this.translate.instant('adminDashboard.archivistTrend', {
      value: Math.abs(p).toFixed(1),
      direction: this.translate.instant(dirKey),
    });
  });

  readonly revenueTrendText = computed(() => {
    this.lang.currentLang();
    const s = this.stats();
    if (!s || this.statsError()) return '—';
    const last = s.revenueLast30Days;
    const prior = s.revenuePrior30Days;
    if (prior <= 0 && last <= 0) return this.translate.instant('adminDashboard.noConfirmedOrdersYet');
    if (prior <= 0) return this.translate.instant('adminDashboard.firstConfirmedRevenue');
    const pct = ((last - prior) / prior) * 100;
    const dirKey = pct >= 0 ? 'adminDashboard.up' : 'adminDashboard.down';
    return this.translate.instant('adminDashboard.revenueTrend', {
      direction: this.translate.instant(dirKey),
      value: Math.abs(pct).toFixed(1),
    });
  });

  ngOnInit(): void {
    this.catalog.load();
    this.dashboardApi.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.statsLoading.set(false);
        afterNextRender(() => this.playMostSoldMotion(), { injector: this.injector });
      },
      error: () => {
        this.statsError.set(true);
        this.statsLoading.set(false);
        afterNextRender(() => this.playMostSoldMotion(), { injector: this.injector });
      },
    });
    this.ordersApi.list().subscribe({
      next: (o) => {
        this.orders.set(o);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoadError.set(true);
        this.ordersLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.mostSoldTimeline?.kill();
  }

  resolveMostSoldImage(m: MostSoldProduct): string {
    const raw = m.imageUrl?.trim();
    return raw ? resolveMediaUrl(raw) : '';
  }

  private playMostSoldMotion(): void {
    if (this.mostSoldMotionDone || this.statsLoading()) return;
    const root = this.mostSoldRoot()?.nativeElement;
    if (!root) return;
    this.mostSoldMotionDone = true;

    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set(root.querySelectorAll('[data-ms-animate]'), { opacity: 1, y: 0, scale: 1 });
      const curve = root.querySelector('.admin-most-sold__curve') as SVGPathElement | null;
      if (curve) {
        curve.style.strokeDasharray = '';
        curve.style.strokeDashoffset = '0';
      }
      const num = root.querySelector('.admin-most-sold__units-num') as HTMLElement | null;
      const u = this.stats()?.mostSoldProduct?.unitsSold;
      if (num && u != null) num.textContent = String(u);
      return;
    }

    this.mostSoldTimeline?.kill();
    const reveals = root.querySelectorAll<HTMLElement>('[data-ms-animate]');
    const figure = root.querySelector<HTMLElement>('.admin-most-sold__figure');
    const curve = root.querySelector<SVGPathElement>('.admin-most-sold__curve');
    const unitsEl = root.querySelector<HTMLElement>('.admin-most-sold__units-num');
    const targetUnits = this.stats()?.mostSoldProduct?.unitsSold ?? 0;

    gsap.set(reveals, { opacity: 0, y: 22 });
    if (figure) gsap.set(figure, { opacity: 0, scale: 0.94 });
    if (unitsEl && targetUnits > 0) unitsEl.textContent = '0';

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    this.mostSoldTimeline = tl;

    tl.to(reveals, { opacity: 1, y: 0, duration: 0.58, stagger: 0.09 }, 0);
    if (figure) {
      tl.to(figure, { opacity: 1, scale: 1, duration: 0.72, ease: 'power2.out' }, 0.08);
    }
    if (unitsEl && targetUnits > 0) {
      const proxy = { n: 0 };
      tl.to(
        proxy,
        {
          n: targetUnits,
          duration: 1.15,
          ease: 'power2.out',
          onUpdate: () => {
            unitsEl.textContent = String(Math.round(proxy.n));
          },
        },
        0.22,
      );
    }
    if (curve) {
      const len = curve.getTotalLength();
      curve.style.strokeDasharray = `${len}`;
      curve.style.strokeDashoffset = `${len}`;
      tl.to(curve, { strokeDashoffset: 0, duration: 1.35, ease: 'power2.inOut' }, 0.12);
    }
  }

  previewPrimarySrc(p: CatalogProduct): string {
    const fromGallery = p.imageUrls?.map((u) => String(u ?? '').trim()).find((u) => u.length > 0);
    const raw = fromGallery || String(p.imageUrl ?? '').trim();
    return resolveMediaUrl(raw || null);
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  formatArchivistCount(n: number): string {
    return new Intl.NumberFormat().format(n);
  }

  firstProductName(o: AdminOrder): string {
    const first = o.items?.[0];
    return first?.productName?.trim() ? first.productName : '—';
  }

  formatOrderDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  statusClass(status: string): string {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'admin-badge admin-badge--pending';
    if (s === 'CONFIRMED') return 'admin-badge admin-badge--confirmed';
    if (s === 'CANCELLED') return 'admin-badge admin-badge--rejected';
    if (s === 'COMPLETED') return 'admin-badge admin-badge--done';
    return 'admin-badge admin-badge--process';
  }

  formatStatus(status: string): string {
    this.lang.currentLang();
    return this.translate.instant(`adminDashboard.status.${status.toUpperCase()}`, {
      defaultValue: status.replaceAll('_', ' '),
    });
  }

  stockLabel(stock: number): { text: string; variant: 'ok' | 'low' | 'out' } {
    this.lang.currentLang();
    if (stock <= 0) return { text: this.translate.instant('adminDashboard.soldOut'), variant: 'out' };
    if (stock <= 5) {
      return { text: this.translate.instant('adminDashboard.stockLeft', { count: stock }), variant: 'low' };
    }
    return { text: this.translate.instant('adminDashboard.inStock', { count: stock }), variant: 'ok' };
  }

  removeProduct(p: CatalogProduct, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const ok = window.confirm(
      this.translate.instant('adminDashboard.removeConfirm', { name: p.name }),
    );
    if (!ok) return;
    this.deletingId.set(p.id);
    this.catalog.deleteProduct(p.id).subscribe({
      next: () => this.deletingId.set(null),
      error: () => {
        this.deletingId.set(null);
        window.alert(this.translate.instant('adminDashboard.removeError'));
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
          window.alert(this.translate.instant('adminDashboard.emptyExport'));
          return;
        }
        this.triggerFileDownload(blob, resp, fallback);
        this.shippingExportLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.shippingExportLoading.set(false);
        if (err.status === 0) {
          window.alert(this.translate.instant('adminDashboard.apiUnreachable'));
          return;
        }
        if (err.error instanceof Blob) {
          void err.error.text().then((t) => window.alert(t.trim() || this.translate.instant('adminDashboard.exportFailedWithStatus', { status: err.status })));
          return;
        }
        window.alert(this.translate.instant('adminDashboard.exportFailedWithStatus', { status: err.status }));
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
