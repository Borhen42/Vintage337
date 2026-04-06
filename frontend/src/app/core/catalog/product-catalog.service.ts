import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import type { CatalogProduct, ProductVariant } from './catalog-product.model';

/** Unwrap string / array-of-one / { data: {...} } shapes some proxies or serializers produce */
function normalizeProductJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null;
  }
  let v: unknown = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v)) {
    if (v.length === 1 && v[0] != null && typeof v[0] === 'object' && !Array.isArray(v[0])) {
      v = v[0];
    } else {
      return null;
    }
  }
  if (typeof v !== 'object' || v == null) {
    return null;
  }
  const o = v as Record<string, unknown>;
  const data = o['data'];
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return o;
}

function mapApiProduct(raw: unknown, fallbackId?: number): CatalogProduct {
  const o = normalizeProductJson(raw);
  if (o == null) {
    throw new Error('Invalid product payload');
  }

  const variantsRaw = o['variants'];
  const variants: ProductVariant[] | undefined = Array.isArray(variantsRaw)
    ? variantsRaw
        .filter((v): v is Record<string, unknown> => v != null && typeof v === 'object')
        .map((v) => ({
          size: String(v['size'] ?? '').trim(),
          color: String(v['color'] ?? '').trim(),
          stock: Math.max(0, Math.floor(Number(v['stock'] ?? 0))),
        }))
        .filter((v) => v.size.length > 0 && v.color.length > 0)
    : undefined;

  let createdAt = '';
  const ca = o['createdAt'];
  if (typeof ca === 'string') {
    createdAt = ca;
  } else if (typeof ca === 'number' && Number.isFinite(ca)) {
    const ms = ca < 1e12 ? ca * 1000 : ca;
    createdAt = new Date(ms).toISOString();
  } else if (Array.isArray(ca) && ca.length >= 3) {
    const y = Number(ca[0]);
    const mo = Number(ca[1]);
    const d = Number(ca[2]);
    const h = ca.length > 3 ? Number(ca[3]) : 12;
    const mi = ca.length > 4 ? Number(ca[4]) : 0;
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(d)) {
      createdAt = new Date(y, mo - 1, d, h, mi).toISOString();
    }
  }

  const priceRaw = o['price'];
  const priceNum =
    typeof priceRaw === 'number'
      ? priceRaw
      : typeof priceRaw === 'string'
        ? Number.parseFloat(priceRaw)
        : Number(priceRaw);

  const imageUrlsRaw = o['imageUrls'];
  const imageUrls = Array.isArray(imageUrlsRaw)
    ? (imageUrlsRaw as unknown[]).map((u) => String(u ?? '').trim()).filter(Boolean)
    : undefined;

  const fromJson = Number(o['id'] ?? o['productId']);
  const idCandidate = Number.isFinite(fromJson) && fromJson >= 1 ? Math.trunc(fromJson) : fallbackId;
  const id = idCandidate != null && Number.isFinite(idCandidate) && idCandidate >= 1 ? Math.trunc(idCandidate) : NaN;
  if (!Number.isFinite(id)) {
    throw new Error('Invalid product id');
  }

  return {
    id,
    name: String(o['name'] ?? ''),
    category: String(o['category'] ?? ''),
    price: Number.isFinite(priceNum) ? priceNum : 0,
    stock: Math.max(0, Math.floor(Number(o['stock'] ?? 0))),
    description: o['description'] == null || o['description'] === '' ? null : String(o['description']),
    imageUrl: String(o['imageUrl'] ?? '').trim(),
    imageUrls: imageUrls?.length ? imageUrls : undefined,
    variants: variants?.length ? variants : undefined,
    createdAt: createdAt || new Date().toISOString(),
  };
}

export type CreateProductPayload = {
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrls: string[];
  variants: ProductVariant[];
};

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly http = inject(HttpClient);
  private readonly _items = signal<CatalogProduct[]>([]);
  private readonly _loadError = signal(false);
  /** True after the first catalog load request finishes (success or error). */
  private readonly _listHydrated = signal(false);

  readonly items = this._items.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly listHydrated = this._listHydrated.asReadonly();
  readonly productCount = computed(() => this._items().length);

  getById(id: number): Observable<CatalogProduct> {
    return this.http
      .get<unknown>(`/api/products/${id}`)
      .pipe(map((raw) => mapApiProduct(raw, id)));
  }

  load(): void {
    this._loadError.set(false);
    this.http
      .get<unknown[]>('/api/products')
      .pipe(
        map((list) => {
          if (!Array.isArray(list)) return [];
          const out: CatalogProduct[] = [];
          for (const raw of list) {
            try {
              out.push(mapApiProduct(raw));
            } catch {
              /* skip malformed row */
            }
          }
          return out;
        }),
        tap((list) => this._items.set(list)),
        catchError(() => {
          this._loadError.set(true);
          this._items.set([]);
          return of([]);
        }),
        finalize(() => this._listHydrated.set(true)),
      )
      .subscribe();
  }

  uploadProductImages(files: File[]): Observable<string[]> {
    const fd = new FormData();
    for (const f of files) {
      fd.append('files', f);
    }
    return this.http.post<{ urls: string[] }>('/api/admin/uploads', fd).pipe(map((r) => r.urls ?? []));
  }

  createProduct(body: CreateProductPayload): Observable<CatalogProduct> {
    return this.http.post<unknown>('/api/admin/products', body).pipe(
      map((raw) => mapApiProduct(raw)),
      tap(() => this.load()),
    );
  }

  updateProduct(id: number, body: CreateProductPayload): Observable<CatalogProduct> {
    return this.http.put<unknown>(`/api/admin/products/${id}`, body).pipe(
      map((raw) => mapApiProduct(raw)),
      tap(() => this.load()),
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`).pipe(tap(() => this.load()));
  }
}
