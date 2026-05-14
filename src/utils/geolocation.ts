import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

/**
 * Get current device location using Capacitor Geolocation plugin.
 * This ensures proper native permission prompts on Android/iOS.
 * Falls back to {lat: 0, lng: 0} on error or if denied.
 */
export const getCurrentLocation = async (): Promise<{ lat: number; lng: number }> => {
  try {
    // If running as a native Android/iOS app, request permissions first
    if (Capacitor.isNativePlatform()) {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          console.warn('Geolocation permission denied by user.');
          return { lat: 0, lng: 0 };
        }
      }
    }

    // Get position (works on both native and web)
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.warn('Geolocation error, falling back to 0,0:', error);
    return { lat: 0, lng: 0 };
  }
};
