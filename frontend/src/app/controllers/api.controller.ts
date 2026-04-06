import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HealthStatus } from '../models/health-status.model';

/**
 * Controller layer: calls the backend REST API (proxied to Spring on :8080 in dev).
 */
@Injectable({ providedIn: 'root' })
export class ApiController {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.base}/health`);
  }
}
