import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { AdminOrder } from './models';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly http = inject(HttpClient);

  list(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>('/api/admin/orders');
  }

  /** Accept: API returns PDF bytes (command record). */
  acceptPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.post(`/api/admin/orders/${id}/accept`, null, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  reject(id: number): Observable<AdminOrder> {
    return this.http.post<AdminOrder>(`/api/admin/orders/${id}/reject`, {});
  }

  /** Sealed command record PDF (GET — same document as on accept, for re-download). */
  commandRecordPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`/api/admin/orders/${id}/command-record`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  shippingLogsCsv(): Observable<HttpResponse<Blob>> {
    return this.http.get('/api/admin/orders/shipping-logs/export', {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
