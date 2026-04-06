/**
 * Writes frontend/src/environments/environment.prod.ts from VINTAGE337_API_BASE_URL or API_BASE_URL.
 * Run from repo root: node scripts/set-api-url.mjs
 * Or from frontend: node ../scripts/set-api-url.mjs
 */
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const candidates = [
  join(repoRoot, 'frontend', 'src', 'environments', 'environment.prod.ts'),
  join(process.cwd(), 'src', 'environments', 'environment.prod.ts'),
];

const target = candidates.find((p) => existsSync(p));
if (!target) {
  console.error('set-api-url: could not find environment.prod.ts');
  process.exit(1);
}

const url = (process.env.VINTAGE337_API_BASE_URL || process.env.API_BASE_URL || '').trim();
if (!url) {
  console.log(
    'set-api-url: VINTAGE337_API_BASE_URL / API_BASE_URL unset — leaving environment.prod.ts unchanged'
  );
  process.exit(0);
}

const escaped = url.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const contents = `/**
 * Production build. Filled by scripts/set-api-url.mjs from VINTAGE337_API_BASE_URL or API_BASE_URL.
 * Or edit apiBaseUrl manually before ng build.
 */
export const environment = {
  production: true,
  apiBaseUrl: '${escaped}',
};
`;

writeFileSync(target, contents, 'utf8');
console.log(`set-api-url: wrote apiBaseUrl=${JSON.stringify(url)} to ${target}`);
