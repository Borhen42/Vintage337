import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  private readonly http = inject(HttpClient);

  pendingOrderCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/admin/notifications/pending-orders');
  }
}
