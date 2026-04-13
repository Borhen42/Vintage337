import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AdminAttentionSummary = {
  pendingOrders: number;
  pendingReclamations: number;
};

export type NotificationFeed = {
  pendingOrders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    createdAt: string;
  }>;
  pendingReclamations: Array<{
    id: number;
    email: string;
    subject: string;
    createdAt: string;
  }>;
};

@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  private readonly http = inject(HttpClient);

  /** Pending checkout commands + réclamations still awaiting an admin reply. */
  attentionSummary(): Observable<AdminAttentionSummary> {
    return this.http.get<AdminAttentionSummary>('/api/admin/notifications/summary');
  }

  /** Rows for the admin notification drawer (orders + réclamations). */
  attentionFeed(): Observable<NotificationFeed> {
    return this.http.get<NotificationFeed>('/api/admin/notifications/feed');
  }

  pendingOrderCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/admin/notifications/pending-orders');
  }
}
