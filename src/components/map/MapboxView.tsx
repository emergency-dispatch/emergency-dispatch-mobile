import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MapMarkerItem, MAPBOX_ACCESS_TOKEN } from '../../services/mapbox.service';

export interface MapboxViewRef {
  flyTo: (latitude: number, longitude: number, zoom?: number) => void;
  recenter: () => void;
  fitBounds: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
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
  mapStyle?: 'streets' | 'satellite' | 'dark';
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
      mapStyle = 'streets',
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
      zoomIn: () => {
        const js = `
          if (window.map) {
            window.map.zoomIn();
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
      zoomOut: () => {
        const js = `
          if (window.map) {
            window.map.zoomOut();
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

    /* Custom emergency marker pills & standard symbols */
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
    .marker-shelter { background: #2563EB; }
    .marker-fire { background: #D97706; }
    .marker-ambulance { background: #0284C7; }

    /* Standard Station Pin */
    .station-marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.4));
    }
    .station-marker-box {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: #1E293B;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #FFFFFF;
    }
    .station-marker-arrow {
      width: 0;
      height: 0;
      margin-top: -1px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 7px solid #1E293B;
    }

    /* Standard Rescue Vehicle Marker */
    .vehicle-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 17px;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      font-size: 16px;
      color: #FFFFFF;
      cursor: pointer;
      position: relative;
    }
    .vehicle-status-available { background: #10B981; }
    .vehicle-status-dispatched {
      background: #0284C7;
      animation: vehiclePulse 1.2s infinite alternate;
    }
    .vehicle-status-onscene {
      background: #DC2626;
      animation: vehiclePulse 1.2s infinite alternate;
    }
    .vehicle-status-other { background: #64748B; }

    @keyframes vehiclePulse {
      from { box-shadow: 0 0 6px rgba(2, 132, 199, 0.5); }
      to { box-shadow: 0 0 18px rgba(2, 132, 199, 0.95); }
    }

    /* Standard Incident Marker with Severity Badge */
    .incident-marker-wrap {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 18px;
      border: 2.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      animation: alertPulse 1.2s infinite alternate;
      box-shadow: 0 3px 12px rgba(220, 38, 38, 0.6);
    }
    .incident-cat-fire { background: #DC2626; }
    .incident-cat-accident { background: #EA580C; }
    .incident-cat-medical { background: #DC2626; }
    .incident-cat-other { background: #7C3AED; }

    .incident-sev-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 17px;
      height: 17px;
      border-radius: 9px;
      border: 2px solid #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .sev-bg-3 { background: #DC2626; }
    .sev-bg-2 { background: #EA580C; }
    .sev-bg-1 { background: #10B981; }
    .sev-bg-0 { background: #7C3AED; }

    @keyframes alertPulse {
      from { box-shadow: 0 0 8px rgba(220, 38, 38, 0.5); }
      to { box-shadow: 0 0 20px rgba(220, 38, 38, 0.95); }
    }

    /* Custom popup styling */
    .leaflet-popup-content-wrapper {
      padding: 0;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
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
    .badge-amber { background: #FEF3C7; color: #D97706; }
    .badge-purple { background: #F3E8FF; color: #7C3AED; }
    .badge-navy { background: #E2E8F0; color: #0F172A; }
    .popup-title { font-size: 13.5px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
    .popup-desc { font-size: 11.5px; color: #64748B; }
    .popup-phone-link {
      display: inline-block;
      margin-top: 4px;
      color: #0284C7;
      text-decoration: none;
      font-weight: 700;
      font-size: 11.5px;
    }
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

    // Mapbox official styles and fallback layer
    var mapboxToken = '${MAPBOX_ACCESS_TOKEN}';
    var selectedStyle = '${mapStyle}';

    var mapboxStyleId = selectedStyle === 'satellite'
      ? 'mapbox/satellite-streets-v12'
      : selectedStyle === 'dark'
      ? 'mapbox/dark-v11'
      : 'mapbox/streets-v12';

    var fallbackUrl = selectedStyle === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      : selectedStyle === 'dark'
      ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    var mapboxLayer = L.tileLayer(
      'https://api.mapbox.com/styles/v1/' + mapboxStyleId + '/tiles/256/{z}/{x}/{y}@2x?access_token=' + mapboxToken,
      {
        maxZoom: 20,
        tileSize: 256,
        attribution: '&copy; Mapbox &copy; OpenStreetMap'
      }
    );

    var fallbackLayer = L.tileLayer(fallbackUrl, {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap'
    });

    var hasSwitched = false;
    mapboxLayer.on('tileerror', function() {
      if (!hasSwitched) {
        hasSwitched = true;
        try { map.removeLayer(mapboxLayer); } catch(e){}
        fallbackLayer.addTo(map);
      }
    });

    if (mapboxToken && mapboxToken.startsWith('pk.')) {
      mapboxLayer.addTo(map);
    } else {
      fallbackLayer.addTo(map);
    }

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

    // Update all POI & Incident & Fleet markers dynamically without reloading
    window.setMarkers = function(markersData) {
      window.markersLayer.clearLayers();
      if (!markersData || !Array.isArray(markersData)) return;

      markersData.forEach(function(m) {
        var customHtml = '';
        var iconSize = [36, 36];
        var iconAnchor = [18, 18];
        var badgeText = 'ĐIỂM AN TOÀN';
        var badgeClass = 'badge-blue';

        if (m.type === 'station') {
          // Standard Station Building Pin
          customHtml = '<div class="station-marker-wrap"><div class="station-marker-box">🏢</div><div class="station-marker-arrow"></div></div>';
          iconSize = [32, 38];
          iconAnchor = [16, 38];
          badgeText = 'TRẠM CỨU HỘ TRỰC CHIẾN';
          badgeClass = 'badge-navy';
        } else if (m.type === 'rescue_unit') {
          // Standard Vehicle with Status color
          var status = (m.status || '').toLowerCase();
          var statusClass = 'vehicle-status-available';
          var statusLabel = 'SẴN SÀNG';
          var vehBadgeClass = 'badge-green';

          if (status === 'dispatched' || status === 'enroute' || status === 'en_route') {
            statusClass = 'vehicle-status-dispatched';
            statusLabel = 'ĐANG ĐIỀU PHỐI';
            vehBadgeClass = 'badge-blue';
          } else if (status === 'onscene' || status === 'on_scene') {
            statusClass = 'vehicle-status-onscene';
            statusLabel = 'TẠI HIỆN TRƯỜNG';
            vehBadgeClass = 'badge-red';
          }

          var uType = (m.unitType || '').toLowerCase();
          var vehIcon = '🚨';
          if (uType.indexOf('ambulance') !== -1) vehIcon = '🚑';
          else if (uType.indexOf('fire') !== -1 || uType.indexOf('ladder') !== -1) vehIcon = '🚒';
          else if (uType.indexOf('police') !== -1) vehIcon = '🚓';
          else if (uType.indexOf('heavy') !== -1 || uType.indexOf('rescue') !== -1 || uType.indexOf('boat') !== -1) vehIcon = '🛠️';

          customHtml = '<div class="vehicle-marker ' + statusClass + '">' + vehIcon + '</div>';
          iconSize = [34, 34];
          iconAnchor = [17, 17];
          badgeText = 'XE CỨU HỘ • ' + statusLabel;
          badgeClass = vehBadgeClass;
        } else if (m.type === 'incident') {
          // Standard Incident with Category icon + Severity corner badge (0-3)
          var cat = (m.category || '').toLowerCase();
          var catClass = 'incident-cat-fire';
          var catEmoji = '🔥';
          if (cat === 'accident' || (m.title && m.title.toLowerCase().indexOf('tai nạn') !== -1)) {
            catClass = 'incident-cat-accident';
            catEmoji = '🚗';
          }

          var sevNum = '1';
          if (m.severity === 'Level3' || m.severity === 3 || m.severity === 'Critical') sevNum = '3';
          else if (m.severity === 'Level2' || m.severity === 2 || m.severity === 'High') sevNum = '2';
          else if (m.severity === 'Level1' || m.severity === 1 || m.severity === 'Low') sevNum = '1';
          else if (m.severity === 'Unclassified' || m.severity === 0) sevNum = '0';

          customHtml = '<div class="incident-marker-wrap ' + catClass + '">' + catEmoji +
            '<div class="incident-sev-badge sev-bg-' + sevNum + '">' + sevNum + '</div></div>';
          iconSize = [36, 36];
          iconAnchor = [18, 18];
          badgeText = 'SỰ CỐ HIỆN TRƯỜNG • CẤP ' + sevNum;
          badgeClass = (sevNum === '3' ? 'badge-red' : sevNum === '2' ? 'badge-amber' : sevNum === '1' ? 'badge-green' : 'badge-purple');
        } else if (m.type === 'hospital') {
          customHtml = '<div class="emergency-marker marker-hospital">🏥</div>';
          badgeText = 'Y TẾ KHẨN CẤP';
          badgeClass = 'badge-green';
        } else if (m.type === 'fire_station') {
          customHtml = '<div class="emergency-marker marker-fire">🚒</div>';
          badgeText = 'TRẠM PCCC';
          badgeClass = 'badge-red';
        } else if (m.type === 'ambulance') {
          customHtml = '<div class="emergency-marker marker-ambulance">🚑</div>';
          badgeText = 'XE CỨU THƯƠNG';
          badgeClass = 'badge-blue';
        } else {
          customHtml = '<div class="emergency-marker marker-shelter">🛡️</div>';
          badgeText = 'ĐIỂM TRÚ ẨN';
          badgeClass = 'badge-blue';
        }

        var customIcon = L.divIcon({
          className: '',
          html: customHtml,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        });

        var phoneHtml = m.phoneNumber
          ? '<br/><a href="tel:' + m.phoneNumber + '" class="popup-phone-link">📞 ' + m.phoneNumber + ' (Gọi ngay)</a>'
          : '';

        var popupHtml = '<span class="popup-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<div class="popup-title">' + m.title + '</div>' +
          '<div class="popup-desc">' + m.description + '</div>' +
          phoneHtml;

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
