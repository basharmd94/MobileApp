import { useEffect, useRef, useState } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Geolocation, PermissionStatus, Position } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import api from '../api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

declare global {
  interface Window {
    NativeSettings?: {
      openAppSettings?: () => void;
    };
  }
}

const API_URL = '/location/create';
const FOLLOW_UP_DELAY_MS = 180_000;
const GPS_TIMEOUT_MS = 10_000;
const API_TIMEOUT_MS = 5_000;
const PENDING_QUEUE_KEY = 'pending_locations';
const LAST_KNOWN_LOCATION_KEY = 'last_known_location';
const AUTH_STATE_EVENT = 'auth-state-changed';

type JwtPayload = {
  username?: string;
  user_id?: string;
  businessId?: string | number;
  business_id?: string | number;
};

type CachedUser = {
  username?: string;
  user_id?: string;
};

export type LocationPayload = {
  username: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
  business_id: number;
};

/**
 * Decode the JWT payload locally so tracking can still build payloads while offline.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Normalize numeric values so the backend always receives finite coordinates.
 */
function toFiniteNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

/**
 * Read the authenticated user information directly from the stored JWT.
 */
function getTrackingIdentity(): { username: string; name: string; businessId: number } | null {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  const payload = decodeJwt(token);
  if (!payload) {
    return null;
  }

  // Fall back to cached user data when a token field is missing in offline scenarios.
  const cachedUserRaw = localStorage.getItem('cachedUser');
  const cachedUser: CachedUser | null = cachedUserRaw ? JSON.parse(cachedUserRaw) as CachedUser : null;

  // The API expects the login name in `username`.
  const username = payload.username || cachedUser?.username;

  // The API expects the employee/user ID in `name`.
  const name = payload.user_id || cachedUser?.user_id;
  const businessId = Number(payload.businessId ?? payload.business_id ?? 0);

  if (!username || !name || !Number.isFinite(businessId) || businessId <= 0) {
    return null;
  }

  return {
    username,
    name,
    businessId,
  };
}

/**
 * Persist the full pending queue in Capacitor storage.
 */
async function setPendingQueue(queue: LocationPayload[]): Promise<void> {
  await Preferences.set({
    key: PENDING_QUEUE_KEY,
    value: JSON.stringify(queue),
  });
}

/**
 * Read the pending queue and recover gracefully from malformed storage values.
 */
async function getPendingQueue(): Promise<LocationPayload[]> {
  try {
    const { value } = await Preferences.get({ key: PENDING_QUEUE_KEY });
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is LocationPayload => {
      return (
        typeof item?.username === 'string' &&
        typeof item?.name === 'string' &&
        typeof item?.timestamp === 'string' &&
        typeof item?.business_id === 'number' &&
        typeof item?.latitude === 'number' &&
        typeof item?.longitude === 'number' &&
        typeof item?.altitude === 'number'
      );
    });
  } catch {
    return [];
  }
}

/**
 * Append a failed payload to the offline queue without losing any existing entries.
 */
async function enqueuePendingLocation(payload: LocationPayload): Promise<void> {
  const queue = await getPendingQueue();
  queue.push(payload);
  await setPendingQueue(queue);
}

/**
 * Keep the last successful location as a lightweight recovery and audit snapshot.
 */
async function setLastKnownLocation(payload: LocationPayload): Promise<void> {
  await Preferences.set({
    key: LAST_KNOWN_LOCATION_KEY,
    value: JSON.stringify(payload),
  });
}

/**
 * Build a backend payload from a fresh GPS reading and JWT-derived user identity.
 */
function buildLocationPayload(position: Position): LocationPayload | null {
  const identity = getTrackingIdentity();
  if (!identity) {
    return null;
  }

  return {
    username: identity.username,
    name: identity.name,
    latitude: toFiniteNumber(position.coords.latitude),
    longitude: toFiniteNumber(position.coords.longitude),
    altitude: toFiniteNumber(position.coords.altitude),
    timestamp: new Date().toISOString(),
    business_id: identity.businessId,
  };
}

/**
 * Check if location tracking is enabled (not in development mode).
 */
function isLocationTrackingEnabled(): boolean {
  return import.meta.env.VITE_ENVIRONMENT !== 'development';
}

/**
 * Request location permission only when needed and stop cleanly when denied.
 */
async function ensureLocationPermission(): Promise<boolean> {
  // Skip location permission in development mode
  if (!isLocationTrackingEnabled()) {
    return true;
  }

  try {
    const currentPermissions: PermissionStatus = await Geolocation.checkPermissions();
    if (
      currentPermissions.location === 'granted' ||
      currentPermissions.coarseLocation === 'granted'
    ) {
      return true;
    }

    const requestedPermissions = await Geolocation.requestPermissions();
    return (
      requestedPermissions.location === 'granted' ||
      requestedPermissions.coarseLocation === 'granted'
    );
  } catch (error) {
    console.warn('Location permission check failed.', error);
    return false;
  }
}

/**
 * Read a single GPS position with a strict timeout so the UI never hangs.
 */
async function getCurrentPosition(): Promise<Position | null> {
  try {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: GPS_TIMEOUT_MS,
      maximumAge: 0,
    });
  } catch (error) {
    console.warn('Failed to fetch the current device location.', error);
    return null;
  }
}

/**
 * Send a single payload with an explicit Authorization header and a short API timeout.
 */
async function sendLocationToApi(payload: LocationPayload): Promise<void> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Missing access token for location tracking.');
  }

  await api.post(API_URL, payload, {
    timeout: API_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

/**
 * Flush queued offline records in order and keep unsent items intact on the first failure.
 */
async function flushPendingQueue(): Promise<void> {
  const queue = await getPendingQueue();
  if (queue.length === 0) {
    return;
  }

  const remainingQueue: LocationPayload[] = [];

  for (let index = 0; index < queue.length; index += 1) {
    const payload = queue[index];

    try {
      await sendLocationToApi(payload);
      await setLastKnownLocation(payload);
    } catch (error) {
      console.warn('Failed to sync a queued location record.', error);
      remainingQueue.push(...queue.slice(index));
      break;
    }
  }

  await setPendingQueue(remainingQueue);
}

/**
 * Invisible global tracker that captures location, stores offline entries, and syncs safely.
 */
export default function LocationTracker() {
  const isProcessingRef = useRef(false);
  const followUpTimeoutRef = useRef<number | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  /**
   * Route the user to the app settings screen so they can manually enable location access.
   */
  const openLocationSettings = () => {
    if (Capacitor.isNativePlatform() && window.NativeSettings?.openAppSettings) {
      window.NativeSettings.openAppSettings();
      return;
    }

    console.warn('Native settings navigation is only available on the mobile app.');
  };

  useEffect(() => {
    let isMounted = true;

    /**
     * Protect sync work from overlapping interval ticks and lifecycle events.
     */
    const runTrackingCycle = async () => {
      if (!isMounted || isProcessingRef.current) {
        return;
      }

      // Skip tracking entirely in development mode
      if (!isLocationTrackingEnabled()) {
        setShowPermissionPrompt(false);
        return;
      }

      const identity = getTrackingIdentity();
      if (!identity) {
        return;
      }

      isProcessingRef.current = true;

      try {
        const hasPermission = await ensureLocationPermission();
        if (!hasPermission) {
          setShowPermissionPrompt(true);
          return;
        }

        setShowPermissionPrompt(false);

        const position = await getCurrentPosition();
        if (!position) {
          return;
        }

        const payload = buildLocationPayload(position);
        if (!payload) {
          return;
        }

        if (!navigator.onLine) {
          await enqueuePendingLocation(payload);
          return;
        }

        try {
          // Send the fresh live reading first so the backend sees the latest position immediately.
          await sendLocationToApi(payload);
        } catch (error) {
          // Preserve the current sample when the network drops mid-request or the API times out.
          await enqueuePendingLocation(payload);
          console.warn('Live location sync failed, stored payload in the offline queue.', error);
          return;
        }

        // Save a local backup after a successful live sync for recovery and diagnostics.
        await setLastKnownLocation(payload);

        // Flush older queued entries only after the current live payload succeeds.
        await flushPendingQueue();
      } catch (error) {
        console.warn('Location tracking cycle failed.', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    /**
     * Cancel any queued follow-up request when auth state or app visibility changes.
     */
    const clearFollowUpTimeout = () => {
      if (followUpTimeoutRef.current !== null) {
        window.clearTimeout(followUpTimeoutRef.current);
        followUpTimeoutRef.current = null;
      }
    };

    /**
     * Start a fresh tracking session for the current open app state.
     * Each session sends immediately and schedules one follow-up after 3 minutes.
     */
    const startTrackingSession = () => {
      clearFollowUpTimeout();

      if (!getTrackingIdentity()) {
        setShowPermissionPrompt(false);
        return;
      }

      void runTrackingCycle();

      followUpTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted || !getTrackingIdentity()) {
          return;
        }

        void runTrackingCycle();
        followUpTimeoutRef.current = null;
      }, FOLLOW_UP_DELAY_MS);
    };

    /**
     * React immediately to a successful login or logout in the current app session.
     */
    const handleAuthStateChange = () => {
      if (!getTrackingIdentity()) {
        clearFollowUpTimeout();
        setShowPermissionPrompt(false);
        return;
      }

      startTrackingSession();
    };

    /**
     * When the app becomes active again, restart the 2-send session.
     */
    const handleAppStateChange = async ({ isActive }: { isActive: boolean }) => {
      if (isActive) {
        startTrackingSession();
        return;
      }

      clearFollowUpTimeout();
    };

    startTrackingSession();

    window.addEventListener(AUTH_STATE_EVENT, handleAuthStateChange);

    let appStateListener: Promise<PluginListenerHandle> | null = null;

    if (Capacitor.isNativePlatform()) {
      appStateListener = CapacitorApp.addListener('appStateChange', handleAppStateChange);
    }

    return () => {
      isMounted = false;
      clearFollowUpTimeout();
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthStateChange);

      if (appStateListener) {
        void appStateListener.then((listener) => listener.remove());
      }
    };
  }, []);

  if (!showPermissionPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-sm !p-5 !rounded-2xl shadow-2xl">
        <h3 className="text-lg font-bold text-text-main mb-2">
          Location Permission Required
        </h3>
        <p className="text-sm text-text-muted mb-6">
          You must allow location access to continue using this app. Please open app settings and turn on location permission.
        </p>
        <Button
          variant="primary"
          className="w-full !py-2.5"
          onClick={openLocationSettings}
        >
          Open Settings
        </Button>
      </Card>
    </div>
  );
}
