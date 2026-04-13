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
          const msg = this.loginErrorMessage(err);
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
          const msg = this.registerErrorMessage(err);
          return throwError(() => new Error(msg));
        }),
      );
  }

  private registerErrorMessage(err: HttpErrorResponse): string {
    const body = this.messageFromErrorBody(err);
    if (err.status === 0) {
      return "We couldn't reach the server. Check your connection and try again.";
    }
    if (err.status >= 500) {
      return 'Something went wrong on our side. Please try again in a moment.';
    }
    return body ?? 'Could not create your account.';
  }

  /** Maps HTTP failures for sign-in: network, 5xx, 401/403, and API `message` when present. */
  private loginErrorMessage(err: HttpErrorResponse): string {
    const body = this.messageFromErrorBody(err);
    if (err.status === 0) {
      return "We couldn't reach the server. Check your connection and try again.";
    }
    if (err.status >= 500) {
      return 'Something went wrong on our side. Please try again in a moment.';
    }
    if (err.status === 401) {
      return body ?? 'Invalid email or password.';
    }
    if (err.status === 403) {
      return body ?? "You don't have permission to sign in. Contact support if you need help.";
    }
    if (err.status === 429) {
      return body ?? 'Too many attempts. Please wait a moment and try again.';
    }
    return body ?? 'Sign-in failed. Please try again.';
  }

  private messageFromErrorBody(err: HttpErrorResponse): string | null {
    const e = err.error;
    if (typeof e === 'object' && e !== null && 'message' in e) {
      const m = (e as { message: unknown }).message;
      if (typeof m === 'string' && m.trim()) {
        return m.trim();
      }
    }
    if (typeof e === 'string' && e.trim()) {
      return e.trim();
    }
    return null;
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
