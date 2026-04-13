import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { CircleMarker, Map as LeafletMap } from 'leaflet';
import { Subscription } from 'rxjs';

const STORE_LAT = 36.7987764;
const STORE_LNG = 10.1811531;
const STORE_ZOOM = 16;

@Component({
  selector: 'app-store-map',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './store-map.component.html',
  styleUrl: './store-map.component.scss',
})
export class StoreMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: false }) mapHost!: ElementRef<HTMLElement>;

  readonly lat = STORE_LAT;
  readonly lng = STORE_LNG;

  private readonly translate = inject(TranslateService);
  private map?: LeafletMap;
  private marker?: CircleMarker;
  private resizeObserver?: ResizeObserver;
  private langSub?: Subscription;

  async ngAfterViewInit(): Promise<void> {
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    const el = this.mapHost?.nativeElement;
    if (!el || typeof window === 'undefined') return;

    const L = await import('leaflet');

    this.map = L.map(el, {
      center: [STORE_LAT, STORE_LNG],
      zoom: STORE_ZOOM,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.map);

    this.marker = L.circleMarker([STORE_LAT, STORE_LNG], {
      radius: 14,
      color: '#3d2314',
      weight: 3,
      fillColor: '#994703',
      fillOpacity: 0.9,
    }).addTo(this.map);

    this.updateMarkerPopup();
    this.langSub = this.translate.onLangChange.subscribe(() => this.updateMarkerPopup());

    const invalidate = () => this.map?.invalidateSize();
    requestAnimationFrame(() => {
      invalidate();
      requestAnimationFrame(invalidate);
    });
    setTimeout(invalidate, 100);
    setTimeout(invalidate, 400);

    this.resizeObserver = new ResizeObserver(() => invalidate());
    this.resizeObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.langSub = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.marker?.remove();
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  private updateMarkerPopup(): void {
    this.marker?.bindPopup(`<strong>Vintage 337</strong><br>${this.translate.instant('landing.store.popup')}`);
  }
}
