import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCurrency as formatTnd } from '../../../core/format/currency';
import type { AdminOrder } from '../../../core/orders/models';
import { AdminOrderService } from '../../../core/orders/admin-order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly ordersApi = inject(AdminOrderService);

  readonly orders = signal<AdminOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionId = signal<number | null>(null);
  readonly downloadId = signal<number | null>(null);
  readonly cancelId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  formatCurrency(amount: number): string {
    return formatTnd(amount);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.ordersApi.list().subscribe({
      next: (rows) => {
        this.orders.set(rows);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const detail =
          err.status === 0
            ? 'Nothing answered at 127.0.0.1:8080 — the Spring Boot API is not running or is on another port.'
            : `Request failed (HTTP ${err.status}).`;
        this.error.set(detail);
        this.loading.set(false);
      },
    });
  }

  acceptCommand(o: AdminOrder): void {
    if (!o.awaitingConfirmation) return;
    this.actionId.set(o.id);
    this.ordersApi.acceptPdf(o.id).subscribe({
      next: (resp) => {
        const fallback = `Vintage337-Command-${o.orderNumber}.pdf`;
        this.savePdfFromResponse(resp, fallback);
        this.actionId.set(null);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.actionId.set(null);
        this.alertPdfHttpError(err, 'Could not accept command.');
      },
    });
  }

  downloadCommandRecord(o: AdminOrder): void {
    if (!this.canDownloadCommandRecord(o.status)) return;
    this.downloadId.set(o.id);
    const fallback = `Vintage337-Command-${o.orderNumber}.pdf`;
    this.ordersApi.commandRecordPdf(o.id).subscribe({
      next: (resp) => {
        this.savePdfFromResponse(resp, fallback);
        this.downloadId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.downloadId.set(null);
        this.alertPdfHttpError(err, 'Could not download command record.');
      },
    });
  }

  canDownloadCommandRecord(status: string): boolean {
    const s = status.toUpperCase();
    return s !== 'PENDING' && s !== 'CANCELLED';
  }

  canCancelAfterAccept(status: string): boolean {
    const s = status.toUpperCase();
    return (
      s === 'CONFIRMED' || s === 'PROCESSING' || s === 'SHIPPING' || s === 'COMPLETED'
    );
  }

  cancelCommand(o: AdminOrder): void {
    if (!this.canCancelAfterAccept(o.status)) return;
    if (
      !window.confirm(
        'Cancel this command? Vault stock for every line will be restored (pieces return to the catalogue). The sealed command record will be removed.',
      )
    ) {
      return;
    }
    this.cancelId.set(o.id);
    this.ordersApi.cancel(o.id).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.cancelId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.cancelId.set(null);
        const msg =
          err.error && typeof err.error === 'object' && err.error !== null && 'message' in err.error
            ? String((err.error as { message: string }).message)
            : 'Could not cancel command.';
        alert(msg);
      },
    });
  }

  private savePdfFromResponse(resp: HttpResponse<Blob>, fallbackFilename: string): void {
    const blob = resp.body;
    if (!blob || blob.size === 0) {
      alert('Empty PDF response.');
      return;
    }
    const ct = (resp.headers.get('Content-Type') ?? '').toLowerCase();
    if (ct.includes('json')) {
      void blob.text().then((t) =>
        alert(this.messageFromErrorBodyText(t, resp.status)),
      );
      return;
    }
    if (blob.size < 4096 && (!blob.type || blob.type === 'application/octet-stream')) {
      void blob.text().then((t) => {
        if (t.trimStart().startsWith('{')) {
          alert(this.messageFromErrorBodyText(t, resp.status));
          return;
        }
        this.triggerPdfFileDownload(blob, resp, fallbackFilename);
      });
      return;
    }
    this.triggerPdfFileDownload(blob, resp, fallbackFilename);
  }

  private triggerPdfFileDownload(
    blob: Blob,
    resp: HttpResponse<Blob>,
    fallbackFilename: string,
  ): void {
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

  /** Spring Boot default errors use `error` + `path`; API uses `message`; RFC7807 uses `detail`. */
  private messageFromErrorBodyText(text: string, status: number): string {
    const trimmed = text.trim();
    if (!trimmed) {
      return `Request failed (HTTP ${status}).`;
    }
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      const msg = j['message'];
      if (typeof msg === 'string' && msg.length > 0) {
        return msg;
      }
      const detail = j['detail'];
      if (typeof detail === 'string' && detail.length > 0) {
        return detail;
      }
      const errStr = j['error'];
      if (typeof errStr === 'string' && errStr.length > 0) {
        const path = j['path'];
        return typeof path === 'string' ? `${errStr} — ${path}` : errStr;
      }
      return `Request failed (HTTP ${status}).`;
    } catch {
      return trimmed.length < 300 ? trimmed : `Request failed (HTTP ${status}).`;
    }
  }

  private alertPdfHttpError(err: HttpErrorResponse, fallback: string): void {
    if (err.status === 0) {
      alert(
        'Cannot reach the API (network). Start Spring Boot on port 8080 and ensure the dev proxy targets 127.0.0.1:8080.',
      );
      return;
    }
    if (err.error instanceof Blob) {
      void err.error.text().then((t) => alert(this.messageFromErrorBodyText(t, err.status)));
      return;
    }
    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      alert(String((err.error as { message: string }).message));
      return;
    }
    if (typeof err.error === 'string') {
      alert(this.messageFromErrorBodyText(err.error, err.status));
      return;
    }
    alert(`${fallback} (HTTP ${err.status}).`);
  }

  rejectCommand(o: AdminOrder): void {
    if (!o.awaitingConfirmation) return;
    if (!window.confirm('Reject this command? Vault stock will not change.')) return;
    this.actionId.set(o.id);
    this.ordersApi.reject(o.id).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.actionId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.actionId.set(null);
        const msg =
          err.error && typeof err.error === 'object' && err.error !== null && 'message' in err.error
            ? String((err.error as { message: string }).message)
            : 'Could not reject command.';
        alert(msg);
      },
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
    return status.replaceAll('_', ' ');
  }

  lineSummary(o: AdminOrder): string {
    return o.items.map((i) => `${i.quantity}× ${i.productName}`).join(' · ');
  }
}
