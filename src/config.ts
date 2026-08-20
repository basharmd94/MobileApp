// Build-time globals injected by vite.config.ts → `define`.
// We declare them here once so TypeScript knows their types.
declare const __APP_VERSION__: string | undefined;
declare const __APP_UPDATE_URL__: string | undefined;

/**
 * Current app version, baked in at build time from the APP_VERSION env var.
 * Falls back to '0.0.0' if not provided — the backend will then reject
 * the request, which is the correct safe-default behaviour.
 */
export const APP_VERSION: string =
  (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || '0.0.0';

/**
 * Optional Play-Store / APK URL that the "Update Required" modal opens.
 * If empty, the modal shows an "Exit App" button instead of "Update Now".
 * Set APP_UPDATE_URL in your .env to override.
 */
export const APP_UPDATE_URL: string =
  (typeof __APP_UPDATE_URL__ !== 'undefined' && __APP_UPDATE_URL__) || '';

/**
 * Returns a numeric comparable representation of the app version.
 * "3.70" → 3.70, "1.2.3" → 1.2, "10" → 10.
 * Returns 0 if unparseable.
 */
export function numericAppVersion(): number {
  const first = APP_VERSION.split('.')[0];
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : 0;
}
