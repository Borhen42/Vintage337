import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EditorialNavbarComponent } from '../editorial-landing/editorial-navbar/editorial-navbar.component';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { formatCurrency } from '../../core/format/currency';
import { UploadSrcPipe } from '../../core/media/upload-src.pipe';

export type FulfillmentOption = 'standard' | 'pickup' | 'cod';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [EditorialNavbarComponent, RouterLink, FormsModule, UploadSrcPipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  readonly cart = inject(CartService);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly fulfillment = signal<FulfillmentOption>('pickup');
  readonly orderAck = signal(false);
  readonly lastOrderNumber = signal<string | null>(null);
  readonly attempted = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');

  fullName = '';
  phone = '';
  altPhone = '';
  /** Required when fulfillment is delivery (standard or post). */
  address = '';
  postalCode = '';

  readonly requiresShipToAddress = computed(() => {
    const f = this.fulfillment();
    return f === 'standard' || f === 'cod';
  });

  readonly itemBadge = computed(() => {
    const n = this.cart.lines().length;
    if (n <= 0) return '00 ITEMS';
    if (n === 1) return '01 ITEM';
    return `${String(n).padStart(2, '0')} ITEMS`;
  });

  readonly logisticsAmount = computed(() => {
    switch (this.fulfillment()) {
      case 'standard':
        return 8;
      case 'pickup':
        return 0;
      case 'cod':
        return 10;
      default:
        return 0;
    }
  });

  readonly logisticsLabel = computed(() => {
    const a = this.logisticsAmount();
    if (a <= 0) return 'FREE';
    return this.formatPrice(a);
  });

  readonly taxEstimate = computed(() => {
    const sub = this.cart.subtotal();
    return Math.round(sub * 0.065 * 100) / 100;
  });

  readonly total = computed(() => this.cart.subtotal() + this.logisticsAmount() + this.taxEstimate());

  readonly paymentHeadline = computed(() => {
    switch (this.fulfillment()) {
      case 'cod':
        return 'PAYMENT IN POST';
      case 'pickup':
        return 'IN-STORE PICKUP';
      default:
        return 'PAYMENT ON DELIVERY';
    }
  });

  readonly paymentSub = computed(() => {
    switch (this.fulfillment()) {
      case 'cod':
        return 'Available for long distance district.';
      case 'pickup':
        return 'Main Archive, Sector 337.';
      default:
        return 'Arrives in 3–5 heritage days.';
    }
  });

  setFulfillment(v: FulfillmentOption): void {
    this.fulfillment.set(v);
  }

  formatPrice(n: number): string {
    return formatCurrency(n);
  }

  lineCompareAt(line: { compareAt: number; price: number }): string {
    const c = line.compareAt > line.price ? line.compareAt : Math.ceil(line.price * 1.18 * 100) / 100;
    return this.formatPrice(c);
  }

  secureHeritage(): void {
    this.attempted.set(true);
    this.submitError.set('');
    if (!this.cart.lines().length) return;
    const ok = this.fullName.trim().length >= 2 && this.phone.trim().length >= 6;
    if (!ok) return;
    if (this.requiresShipToAddress()) {
      if (this.address.trim().length < 4 || this.postalCode.trim().length < 2) {
        return;
      }
    }
    const email = this.auth.email();
    if (!email?.trim()) {
      this.submitError.set('Sign in again to place an order.');
      return;
    }
    const lines = this.cart.lines();
    const items = lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.price,
      variantSize: l.size === 'OS' ? null : l.size,
      variantColor: l.color === 'Default' ? null : l.color,
    }));
    const alt = this.altPhone.trim();
    const ship = this.requiresShipToAddress();
    const body = {
      customerName: this.fullName.trim(),
      customerEmail: email.trim(),
      customerPhone: this.phone.trim(),
      customerPhoneSecondary: alt.length > 0 ? alt : null,
      fulfillment: this.fulfillment(),
      shippingAddress: ship ? this.address.trim() : null,
      postalCode: ship ? this.postalCode.trim() : null,
      items,
      totalAmount: this.total(),
    };
    this.submitting.set(true);
    this.http.post<{ orderNumber: string }>('/api/orders', body).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.lastOrderNumber.set(res.orderNumber);
        this.orderAck.set(true);
        this.cart.clear();
        this.attempted.set(false);
        this.fullName = '';
        this.phone = '';
        this.altPhone = '';
        this.address = '';
        this.postalCode = '';
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const msg =
          err.error && typeof err.error === 'object' && err.error !== null && 'message' in err.error
            ? String((err.error as { message: string }).message)
            : 'Could not place order.';
        this.submitError.set(msg);
      },
    });
  }
}
