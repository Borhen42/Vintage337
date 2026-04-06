import { Injectable, computed, signal } from '@angular/core';
import type { CatalogProduct } from '../catalog/catalog-product.model';

export interface CartLine {
  key: string;
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  compareAt: number;
  size: string;
  color: string;
  maxQty: number;
  quantity: number;
}

const STORAGE_KEY = 'vintage337_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>(this.readStorage());

  readonly lines = this._lines.asReadonly();
  readonly totalQuantity = computed(() => this._lines().reduce((s, l) => s + l.quantity, 0));
  readonly subtotal = computed(() => this._lines().reduce((s, l) => s + l.price * l.quantity, 0));

  clear(): void {
    this._lines.set([]);
    this.persist();
  }

  removeLine(key: string): void {
    this._lines.update((lines) => lines.filter((l) => l.key !== key));
    this.persist();
  }

  adjustQuantity(key: string, delta: number): void {
    this._lines.update((lines) =>
      lines.map((l) => {
        if (l.key !== key) return l;
        const n = Math.max(1, Math.min(l.quantity + delta, l.maxQty));
        return { ...l, quantity: n };
      }),
    );
    this.persist();
  }

  addFromProduct(p: CatalogProduct, size: string, color: string, maxQty: number, qty = 1): void {
    if (maxQty < 1 || !Number.isFinite(p.id)) return;
    const urls = p.imageUrls?.filter((u) => u?.trim()) ?? [];
    const imageUrl = urls.length ? urls[0]! : p.imageUrl?.trim() || '';
    const price = Number(p.price);
    const safePrice = Number.isFinite(price) ? price : 0;
    const compareAt = Math.ceil(safePrice * 1.18 * 100) / 100;
    const key = `${p.id}|${size}|${color}`;

    this._lines.update((lines) => {
      const next = [...lines];
      const i = next.findIndex((l) => l.key === key);
      const add = Math.max(1, Math.floor(qty));
      if (i >= 0) {
        const cur = next[i]!;
        const nq = Math.min(cur.quantity + add, maxQty);
        next[i] = {
          ...cur,
          quantity: nq,
          maxQty,
          price: safePrice,
          compareAt,
          name: p.name,
          imageUrl: imageUrl || cur.imageUrl,
        };
      } else {
        next.push({
          key,
          productId: p.id,
          name: p.name,
          imageUrl,
          price: safePrice,
          compareAt,
          size,
          color,
          maxQty,
          quantity: Math.min(add, maxQty),
        });
      }
      return next;
    });
    this.persist();
  }

  private readStorage(): CartLine[] {
    if (typeof sessionStorage === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((row): row is CartLine => {
        return (
          typeof row === 'object' &&
          row !== null &&
          'key' in row &&
          'productId' in row &&
          'quantity' in row
        );
      });
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._lines()));
    } catch {
      /* ignore */
    }
  }
}
