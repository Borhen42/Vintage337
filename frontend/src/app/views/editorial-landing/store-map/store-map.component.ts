import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import type { CircleMarker, Map as LeafletMap } from 'leaflet';

/** Le Palmarium, Tunis — OpenStreetMap reference point */
const STORE_LAT = 36.7987764;
const STORE_LNG = 10.1811531;
const STORE_ZOOM = 16;

@Component({
  selector: 'app-store-map',
  standalone: true,
  templateUrl: './store-map.component.html',
  styleUrl: './store-map.component.scss',
})
export class StoreMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: false }) mapHost!: ElementRef<HTMLElement>;

  /** Exposed for template link to openstreetmap.org */
  readonly lat = STORE_LAT;
  readonly lng = STORE_LNG;

  private map?: LeafletMap;
  private marker?: CircleMarker;
  private resizeObserver?: ResizeObserver;

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

    this.marker.bindPopup(
      '<strong>Vintage 337</strong><br>Boutique n° 156 · Centre commercial le Palmaruim, Tunis',
    );

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
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.marker?.remove();
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }
}
