import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X, MessageCircle, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Card } from './Card';
import { Button } from './Button';
import {
  APP_VERSION,
  APP_UPDATE_URL,
  numericAppVersion,
} from '../config';
import {
  subscribeAppVersionError,
  type AppVersionError,
} from '../utils/appVersionGuard';

/**
 * Blocking, full-screen "Update Required" modal.
 *
 * - Subscribes to 426 errors from anywhere in the app.
 * - Cannot be dismissed (the user must update or exit the app).
 * - Shows the backend's message, the current app version, and the
 *   minimum version when the backend provided it.
 * - If `APP_UPDATE_URL` is set, the primary button opens it (Play Store,
 *   APK page, etc.). Otherwise it falls back to "Exit App" using the
 *   Capacitor `App.exitApp()` if available, or just `window.close()`.
 */
export function UpdateRequiredModal() {
  const [error, setError] = useState<AppVersionError | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    return subscribeAppVersionError((detail) => {
      // Last write wins — the modal is single-instance so we don't need
      // to dedupe. If the user retries, the modal stays put.
      setError(detail);
    });
  }, []);

  if (!error) return null;

  // ─── Action handlers ────────────────────────────────────────────────
  const openUpdateUrl = async () => {
    if (!APP_UPDATE_URL || opening) return;
    setOpening(true);
    try {
      // Capacitor's Browser plugin is the right way to open external
      // links in a native app, but to keep the modal free of extra
      // deps we just use window.open which works in both WebView and
      // browser contexts. Fall back to location.assign otherwise.
      const w = window.open(APP_UPDATE_URL, '_blank', 'noopener,noreferrer');
      if (!w) {
        window.location.assign(APP_UPDATE_URL);
      }
    } catch (err) {
      // Last-ditch attempt.
      window.location.assign(APP_UPDATE_URL);
    } finally {
      // Keep the button in a "loading" state for a beat so the user
      // doesn't double-tap.
      setTimeout(() => setOpening(false), 1500);
    }
  };

  const exitApp = () => {
    // Best-effort: prefer the native exitApp if Capacitor is loaded.
    try {
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.exitApp();
      } else {
        window.close();
      }
    } catch {
      window.close();
    }
  };

  const currentNumeric = numericAppVersion();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-required-title"
      aria-describedby="update-required-desc"
      // z-[200] is above the regular ConfirmModal (z-[100]) and any
      // full-page overlays so this is the last thing the user sees.
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-sm !p-0 !rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ── Top warning banner ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-5 pt-7 pb-10 text-white overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg shadow-black/10 mb-3">
              <AlertTriangle className="w-8 h-8 text-white drop-shadow" strokeWidth={2.4} />
            </div>
            <h2
              id="update-required-title"
              className="text-[18px] font-extrabold tracking-tight leading-tight"
            >
              Update Required
            </h2>
            <p className="text-[11px] font-semibold text-white/85 mt-1 uppercase tracking-widest">
              App version outdated
            </p>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="p-5 -mt-4 relative z-10">
          <div className="bg-white border border-ui-border rounded-2xl shadow-sm p-4">
            <p
              id="update-required-desc"
              className="text-[13px] text-text-main leading-relaxed font-medium"
            >
              {error.message}
            </p>

            {/* Version comparison */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-bg-base border border-ui-border/60 p-2.5">
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
                  Your version
                </p>
                <p className="text-[14px] font-extrabold text-text-main flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-text-secondary" />
                  v{APP_VERSION}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                  Required
                </p>
                <p className="text-[14px] font-extrabold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {error.required_version !== undefined && error.required_version !== null
                    ? `v${error.required_version}`
                    : 'Newer'}
                </p>
              </div>
            </div>

            {/* Helpful context line */}
            {currentNumeric > 0 && (
              <p className="text-[10.5px] text-text-muted mt-3 leading-relaxed">
                Please update the app from the {APP_UPDATE_URL ? 'store' : 'Play Store / your administrator'} to continue sending orders.
                After updating, reopen the app — your data is safe.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-col gap-2">
            {APP_UPDATE_URL ? (
              <Button
                variant="primary"
                size="md"
                className="w-full !py-2.5 shadow-lg shadow-primary/25"
                onClick={openUpdateUrl}
                disabled={opening}
                isLoading={opening}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Update Now
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full !py-2.5 shadow-lg shadow-primary/25"
                onClick={exitApp}
              >
                <X className="w-4 h-4 mr-1.5" />
                Exit App
              </Button>
            )}

            {/* Secondary contact line, always visible for support */}
            <button
              type="button"
              onClick={() => {
                // No phone/email hardcoded — copy the error so the user
                // can paste it to support manually.
                const text = [
                  'App Version Update Required',
                  `Current version: ${APP_VERSION}`,
                  error.required_version !== undefined
                    ? `Required version: ${error.required_version}`
                    : '',
                  `Message: ${error.message}`,
                ]
                  .filter(Boolean)
                  .join('\n');
                try {
                  navigator.clipboard?.writeText(text);
                } catch {
                  /* noop */
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-primary active:scale-[0.98] transition-all py-2 rounded-lg"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Copy error details for support
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default UpdateRequiredModal;
