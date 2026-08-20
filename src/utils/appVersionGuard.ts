/**
 * App-version upgrade guard.
 *
 * The backend returns HTTP 426 "Upgrade Required" with a JSON body like
 *   { detail: { message: "...", type: "app_version_error" } }
 * whenever the order's `xappver` field is older than the version stored
 * in the database.  The API interceptor in `api.ts` calls
 * `triggerAppVersionError(...)` whenever it sees a 426.
 *
 * `UpdateRequiredModal` subscribes via `subscribeAppVersionError` and
 * pops up a blocking modal — decoupled from the rest of the app so any
 * future API call (not just orders) can trigger the same modal.
 */

export interface AppVersionError {
  /** Human-readable message from the backend. */
  message: string;
  /** Backend error discriminator — always "app_version_error" today. */
  type: string;
  /** Minimum version required by the backend, if it was provided. */
  required_version?: string | number;
  /** The version the backend saw, if it was provided. */
  current_version?: string | number;
  /** Raw payload, for forward-compat (in case backend adds fields). */
  raw?: unknown;
}

type Listener = (detail: AppVersionError) => void;
const listeners: Set<Listener> = new Set();

/** Subscribe to 426 errors. Returns an unsubscribe function. */
export function subscribeAppVersionError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Fire the 426 handler. Idempotent — calling it multiple times just
 * notifies all subscribers, who are responsible for de-duping.
 */
export function triggerAppVersionError(detail: AppVersionError): void {
  listeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (err) {
      // Never let one bad subscriber block the others.
      // eslint-disable-next-line no-console
      console.error('appVersionGuard listener threw:', err);
    }
  });
}

/**
 * Normalize whatever the backend threw at us into our AppVersionError
 * shape. Handles every shape we've seen: the documented one, a plain
 * string, a plain object, or nothing at all.
 */
export function normalizeAppVersionError(payload: unknown): AppVersionError {
  // Default fallback when backend sends nothing useful.
  const fallback: AppVersionError = {
    message:
      'A newer version of the app is required to continue. Please update and try again.',
    type: 'app_version_error',
  };

  if (!payload) return fallback;

  // Plain string from backend?
  if (typeof payload === 'string') {
    return { ...fallback, message: payload };
  }

  // The documented shape: { detail: { message, type, ... } }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, any>;

    // detail can itself be a string or an object
    const detail = obj.detail;
    if (typeof detail === 'string') {
      return { ...fallback, message: detail, raw: payload };
    }
    if (detail && typeof detail === 'object') {
      return {
        message: detail.message || fallback.message,
        type: detail.type || 'app_version_error',
        required_version: detail.required_version,
        current_version: detail.current_version,
        raw: payload,
      };
    }

    // Sometimes the error body IS the detail (no wrapping)
    if (obj.message) {
      return {
        message: obj.message,
        type: obj.type || 'app_version_error',
        required_version: obj.required_version,
        current_version: obj.current_version,
        raw: payload,
      };
    }
  }

  return { ...fallback, raw: payload };
}
