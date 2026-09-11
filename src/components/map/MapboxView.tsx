import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MapMarkerItem } from '../../services/mapbox.service';

export interface MapboxViewRef {
  flyTo: (latitude: number, longitude: number, zoom?: number) => void;
  recenter: () => void;
  fitBounds: () => void;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface MapboxViewProps {
  userLatitude?: number;
  userLongitude?: number;
  markers?: MapMarkerItem[];
  routeCoordinates?: RouteCoordinate[];
  fitBounds?: boolean;
  interactive?: boolean;
  onMarkerPress?: (marker: MapMarkerItem) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
}

export const MapboxView = forwardRef<MapboxViewRef, MapboxViewProps>(
  (
    {
      userLatitude = 10.776889,
      userLongitude = 106.700806,
      markers = [],
      routeCoordinates = [],
      fitBounds = false,
      interactive = true,
      onMarkerPress,
      onMapPress,
      style,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const isMapReadyRef = useRef(false);

    // Sync markers whenever markers array changes without reloading the webview
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setMarkers) {
            window.setMarkers(${JSON.stringify(markers)});
          }
          ${fitBounds ? `if (window.fitAllBounds) { window.fitAllBounds(${userLatitude}, ${userLongitude}, ${JSON.stringify(markers)}, ${JSON.stringify(routeCoordinates)}); }` : ''}
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [markers, fitBounds, userLatitude, userLongitude, routeCoordinates]);

    // Sync route polyline coordinates
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setRoute) {
            window.setRoute(${JSON.stringify(routeCoordinates)});
          }
          ${fitBounds ? `if (window.fitAllBounds) { window.fitAllBounds(${userLatitude}, ${userLongitude}, ${JSON.stringify(markers)}, ${JSON.stringify(routeCoordinates)}); }` : ''}
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [routeCoordinates, fitBounds, markers, userLatitude, userLongitude]);

    // Sync user location marker when user coordinates update
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setUserLocation) {
            window.setUserLocation(${userLatitude}, ${userLongitude});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [userLatitude, userLongitude]);

    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom = 16) => {
        const js = `
          if (window.map) {
            window.map.flyTo([${lat}, ${lng}], ${zoom}, { duration: 1.2 });
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
      recenter: () => {
        const js = `
          if (window.map) {
            window.map.flyTo([${userLatitude}, ${userLongitude}], 16, { duration: 1.2 });
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
      fitBounds: () => {
        const js = `
          if (window.fitAllBounds) {
            window.fitAllBounds(${userLatitude}, ${userLongitude}, ${JSON.stringify(markers)}, ${JSON.stringify(routeCoordinates)});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
    }));

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload.type === 'MAP_READY') {
          isMapReadyRef.current = true;
          // Initial push of markers, route, and user location
          const js = `
            if (window.setUserLocation) window.setUserLocation(${userLatitude}, ${userLongitude});
            if (window.setMarkers) window.setMarkers(${JSON.stringify(markers)});
            if (window.setRoute) window.setRoute(${JSON.stringify(routeCoordinates)});
            ${fitBounds ? `if (window.fitAllBounds) { window.fitAllBounds(${userLatitude}, ${userLongitude}, ${JSON.stringify(markers)}, ${JSON.stringify(routeCoordinates)}); }` : ''}
            true;
          `;
          webViewRef.current?.injectJavaScript(js);
        } else if (payload.type === 'MARKER_CLICK') {
          const found = markers.find((m) => m.id === payload.markerId);
          if (found && onMarkerPress) {
            onMarkerPress(found);
          }
        } else if (payload.type === 'MAP_CLICK' && onMapPress) {
          onMapPress({
            latitude: payload.latitude,
            longitude: payload.longitude,
          });
        }
      } catch {
        // ignore
      }
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Emergency Safety Map</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Pulsing user location dot */
    .user-marker-icon {
      position: relative;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);
    }
    .user-pulse-ring {
      position: absolute;
      top: -9px;
      left: -9px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.35);
      animation: pulseAnim 2s infinite ease-out;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Custom emergency marker pills */
    .emergency-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 18px;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 800;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .marker-hospital { background: #10B981; }
    .marker-incident-critical {
      background: #DC2626;
      animation: alertPulse 1.2s infinite alternate;
    }
    .marker-incident-high { background: #EA580C; }
    .marker-shelter { background: #2563EB; }
    .marker-fire { background: #D97706; }
    .marker-ambulance {
      background: #0284C7;
      animation: ambPulse 1.2s infinite alternate;
    }

    @keyframes alertPulse {
      from { box-shadow: 0 0 8px rgba(220, 38, 38, 0.5); }
      to { box-shadow: 0 0 20px rgba(220, 38, 38, 0.95); }
    }

    @keyframes ambPulse {
      from { box-shadow: 0 0 8px rgba(2, 132, 199, 0.5); }
      to { box-shadow: 0 0 20px rgba(2, 132, 199, 0.95); }
    }

    /* Custom popup styling */
    .leaflet-popup-content-wrapper {
      padding: 0;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
      overflow: hidden;
    }
    .leaflet-popup-content {
      margin: 12px 14px;
      line-height: 1.4;
    }
    .popup-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 800;
      margin-bottom: 5px;
    }
    .badge-green { background: #D1FAE5; color: #059669; }
    .badge-red { background: #FEE2E2; color: #DC2626; }
    .badge-blue { background: #DBEAFE; color: #2563EB; }
    .popup-title { font-size: 13.5px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
    .popup-desc { font-size: 11.5px; color: #64748B; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${userLatitude}, ${userLongitude}],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: ${interactive ? 'true' : 'false'},
      touchZoom: ${interactive ? 'true' : 'false'},
      doubleClickZoom: ${interactive ? 'true' : 'false'},
      scrollWheelZoom: ${interactive ? 'true' : 'false'}
    });
    window.map = map;

    // High definition Google Maps road tiles - fast, clear, zero watermarks & zero API keys needed
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20
    }).addTo(map);

    // Layer group for dynamic POI markers
    window.markersLayer = L.layerGroup().addTo(map);

    // Layer group for route polyline
    window.routeLayer = L.layerGroup().addTo(map);

    // User location marker
    var userMarker = null;
    window.setUserLocation = function(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-pulse-ring"></div><div class="user-marker-icon"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon })
          .bindPopup('<div class="popup-title">Vị Trí Của Bạn</div><div class="popup-desc">Độ chính xác GPS cao</div>')
          .addTo(map);
      }
    };

    // Update all POI & Incident markers dynamically without reloading
    window.setMarkers = function(markersData) {
      window.markersLayer.clearLayers();
      if (!markersData || !Array.isArray(markersData)) return;

      markersData.forEach(function(m) {
        var iconClass = 'marker-shelter';
        var iconEmoji = '🛡️';
        var badgeText = 'ĐIỂM TRÚ ẨN';
        var badgeClass = 'badge-blue';

        if (m.type === 'hospital') {
          iconClass = 'marker-hospital';
          iconEmoji = '🏥';
          badgeText = 'Y TẾ KHẨN CẤP';
          badgeClass = 'badge-green';
        } else if (m.type === 'incident') {
          iconClass = (m.severity === 'Critical') ? 'marker-incident-critical' : 'marker-incident-high';
          iconEmoji = '🔥';
          badgeText = 'SỰ CỐ HIỆN TRƯỜNG';
          badgeClass = 'badge-red';
        } else if (m.type === 'fire_station') {
          iconClass = 'marker-fire';
          iconEmoji = '🚒';
          badgeText = 'TRẠM PCCC';
          badgeClass = 'badge-red';
        } else if (m.type === 'ambulance') {
          iconClass = 'marker-ambulance';
          iconEmoji = '🚑';
          badgeText = 'XE CỨU THƯƠNG';
          badgeClass = 'badge-blue';
        }

        var customIcon = L.divIcon({
          className: '',
          html: '<div class="emergency-marker ' + iconClass + '">' + iconEmoji + '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        var popupHtml = '<span class="popup-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<div class="popup-title">' + m.title + '</div>' +
          '<div class="popup-desc">' + m.description + '</div>';

        var marker = L.marker([m.latitude, m.longitude], { icon: customIcon })
          .bindPopup(popupHtml);

        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MARKER_CLICK',
              markerId: m.id
            }));
          }
        });

        window.markersLayer.addLayer(marker);
      });
    };

    // Update route polyline
    window.setRoute = function(coords) {
      window.routeLayer.clearLayers();
      if (!coords || !Array.isArray(coords) || coords.length < 2) return;
      var latLngs = coords.map(function(c) { return [c.latitude, c.longitude]; });

      // Outer polyline glow
      L.polyline(latLngs, {
        color: '#38BDF8',
        weight: 6,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(window.routeLayer);

      // Core crisp polyline
      L.polyline(latLngs, {
        color: '#0284C7',
        weight: 3.5,
        opacity: 0.95,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(window.routeLayer);
    };

    // Fit bounds including markers and route
    window.fitAllBounds = function(userLat, userLng, markersData, routeCoords) {
      var bounds = L.latLngBounds([]);
      if (typeof userLat === 'number' && typeof userLng === 'number') {
        bounds.extend([userLat, userLng]);
      }
      if (markersData && Array.isArray(markersData)) {
        markersData.forEach(function(m) {
          if (typeof m.latitude === 'number' && typeof m.longitude === 'number') {
            bounds.extend([m.latitude, m.longitude]);
          }
        });
      }
      if (routeCoords && Array.isArray(routeCoords)) {
        routeCoords.forEach(function(c) {
          if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
            bounds.extend([c.latitude, c.longitude]);
          }
        });
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
      }
    };

    // Map tap listener
    map.on('click', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICK',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      }
    });

    // Notify React Native that map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
    `;

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent, baseUrl: 'https://unpkg.com' }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
            </View>
          )}
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
