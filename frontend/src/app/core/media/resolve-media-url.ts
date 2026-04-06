import { environment } from '../../../environments/environment';

function normalizeAssetPath(u: string): string {
  const x = u.trim();
  if (!x) return '';
  if (x.startsWith('http://') || x.startsWith('https://') || x.startsWith('blob:') || x.startsWith('data:')) {
    return x;
  }
  if (x.startsWith('/')) return x;
  if (x.startsWith('uploads/') || x.startsWith('api/')) {
    return `/${x}`;
  }
  return x;
}

/**
 * API origin for static files when the SPA runs on another port (e.g. ng serve :4200).
 */
function apiBaseForStaticFiles(): string {
  const fromEnv = (environment.apiBaseUrl ?? '').replace(/\/$/, '');
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window !== 'undefined' && window.location.port === '4200') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8080`;
  }
  return '';
}

/**
 * Browser <img src> skips HttpClient; relative /uploads/... would hit the dev server (4200).
 * Prefix the Spring Boot origin in dev, or same-host :8080 when env is empty but we're on :4200.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (url == null || url === '') return '';
  const normalized = normalizeAssetPath(String(url));
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:')
  ) {
    return normalized;
  }
  const base = apiBaseForStaticFiles();
  if (base && normalized.startsWith('/')) {
    return `${base}${normalized}`;
  }
  return normalized;
}
