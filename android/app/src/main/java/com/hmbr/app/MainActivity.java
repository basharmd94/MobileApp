package com.hmbr.app;

import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        WebSettings settings = webView.getSettings();

        // Allow HTTP inside HTTPS page
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Expose a tiny native bridge so the web app can open the app settings page.
        webView.addJavascriptInterface(new AppSettingsBridge(), "NativeSettings");
    }

    private class AppSettingsBridge {
        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", getPackageName(), null));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            });
        }

        // Checks the most recent location fix from any provider for the
        // mock-location flag. Relies on location permission already granted
        // via the Capacitor Geolocation plugin earlier in the order flow.
        @JavascriptInterface
        public boolean isMockLocationEnabled() {
            LocationManager locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                return false;
            }
            String[] providers = {
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER
            };
            for (String provider : providers) {
                try {
                    Location location = locationManager.getLastKnownLocation(provider);
                    if (location != null && location.isFromMockProvider()) {
                        return true;
                    }
                } catch (SecurityException e) {
                    // Location permission not granted yet; nothing to check.
                }
            }
            return false;
        }

        @JavascriptInterface
        public boolean isDeveloperOptionsEnabled() {
            return Settings.Global.getInt(
                getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                0
            ) == 1;
        }
    }
}

