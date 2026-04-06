import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import type { LoginResponse } from './auth.models';

const TOKEN_KEY = 'vintage337_access_token';
const EMAIL_KEY = 'vintage337_user_email';
const ROLE_KEY = 'vintage337_user_role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.read(TOKEN_KEY));
  private readonly _email = signal<string | null>(this.read(EMAIL_KEY));
  private readonly _role = signal<string | null>(this.read(ROLE_KEY));

  readonly token = this._token.asReadonly();
  readonly email = this._email.asReadonly();
  readonly role = this._role.asReadonly();

  readonly isAuthenticated = computed(() => this._token() !== null && this._token() !== '');
  /** Admin dashboard access: ADMIN or STAFF. */
  readonly isAdmin = computed(() => {
    const r = this._role();
    return r === 'ADMIN' || r === 'STAFF';
  });

  /** Shopper cart / checkout: registered customers only. */
  readonly isCustomer = computed(() => this._role() === 'CUSTOMER');

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', {
        email: email.trim(),
        password,
      })
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err: HttpErrorResponse) => {
          const msg = this.apiErrorMessage(err, 'Invalid email or password.');
          return throwError(() => new Error(msg));
        }),
      );
  }

  register(body: {
    fullName: string;
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/register', {
        fullName: body.fullName.trim(),
        email: body.email.trim(),
        password: body.password,
      })
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err: HttpErrorResponse) => {
          const msg = this.apiErrorMessage(err, 'Could not create your account.');
          return throwError(() => new Error(msg));
        }),
      );
  }

  private apiErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (typeof err.error === 'object' && err.error !== null && 'message' in err.error) {
      return String((err.error as { message: string }).message);
    }
    return fallback;
  }

  logout(): void {
    this._token.set(null);
    this._email.set(null);
    this._role.set(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      sessionStorage.removeItem(ROLE_KEY);
    } catch {
      /* ignore */
    }
  }

  /** Authorization header value for future API calls. */
  authHeader(): string | null {
    const t = this._token();
    return t ? `Bearer ${t}` : null;
  }

  private persistSession(res: LoginResponse): void {
    this._token.set(res.accessToken);
    this._email.set(res.email);
    this._role.set(res.role);
    try {
      sessionStorage.setItem(TOKEN_KEY, res.accessToken);
      sessionStorage.setItem(EMAIL_KEY, res.email);
      sessionStorage.setItem(ROLE_KEY, res.role);
    } catch {
      /* private mode */
    }
  }

  private read(key: string): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
