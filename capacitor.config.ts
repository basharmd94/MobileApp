import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hmbr.app',
  appName: 'HMBR App',
  webDir: 'dist',

  // 👇 Allow HTTP API calls during development
  server: {
    cleartext: true,
    allowNavigation: ['*'],
  },
  
  plugins: {
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  },
};

export default config;