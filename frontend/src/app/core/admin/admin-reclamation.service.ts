import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ReclamationRow = {
  id: number;
  userId: number | null;
  email: string;
  fullName: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string;
  repliedAt: string | null;
  createdAt: string;
};

export type CreateReclamationBody = {
  email: string;
  fullName?: string;
  subject: string;
  message: string;
};

@Injectable({ providedIn: 'root' })
export class AdminReclamationService {
  private readonly http = inject(HttpClient);

  list(): Observable<ReclamationRow[]> {
    return this.http.get<ReclamationRow[]>('/api/admin/reclamations');
  }

  reply(id: number, message: string): Observable<ReclamationRow> {
    return this.http.post<ReclamationRow>(`/api/admin/reclamations/${id}/reply`, { message });
  }

  /** Public — optional auth links reclamation to account */
  submit(body: CreateReclamationBody): Observable<ReclamationRow> {
    return this.http.post<ReclamationRow>('/api/reclamations', body);
  }
}
