import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { AdminDashboardStats } from './admin-dashboard.models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>('/api/admin/dashboard/stats');
  }
}
