import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AdminUserRow = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  blocked: boolean;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  list(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>('/api/admin/users');
  }

  setRole(id: number, role: 'ADMIN' | 'CUSTOMER'): Observable<AdminUserRow> {
    return this.http.patch<AdminUserRow>(`/api/admin/users/${id}/role`, { role });
  }

  setBlocked(id: number, blocked: boolean): Observable<AdminUserRow> {
    return this.http.patch<AdminUserRow>(`/api/admin/users/${id}/blocked`, { blocked });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }
}
