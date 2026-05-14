/**
 * Get current device location via browser Geolocation API.
 * Falls back to {lat: 0, lng: 0} on error or if unsupported.
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0 });
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => {
          console.warn('Geolocation error, falling back to 0,0:', error);
          resolve({ lat: 0, lng: 0 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
};
