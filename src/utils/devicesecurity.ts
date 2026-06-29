import { Capacitor } from '@capacitor/core';

// Window.NativeSettings is declared globally in LocationTracker.tsx

/**
 * Reads device security signals from the native bridge (MainActivity.java).
 * Returns false for both flags on web/dev builds where the bridge isn't injected.
 */
export const getSecurityFlags = (): { is_mock_location: boolean; dev_options_enabled: boolean } => {
  if (!Capacitor.isNativePlatform() || !window.NativeSettings) {
    return { is_mock_location: false, dev_options_enabled: false };
  }

  try {
    return {
      is_mock_location: window.NativeSettings.isMockLocationEnabled?.() ?? false,
      dev_options_enabled: window.NativeSettings.isDeveloperOptionsEnabled?.() ?? false,
    };
  } catch (error) {
    console.warn('Security flag check failed:', error);
    return { is_mock_location: false, dev_options_enabled: false };
  }
};
