import React, { useRef, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Linking, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MapMarkerItem, MAPBOX_ACCESS_TOKEN } from '../../services/mapbox.service';

export interface MapboxViewRef {
  flyTo: (latitude: number, longitude: number, zoom?: number) => void;
  recenter: () => void;
  fitBounds: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  openMarkerPopup?: (markerId: string) => void;
  updateMarkerLocation?: (markerId: string, latitude: number, longitude: number, heading?: number) => void;
  invalidateSize?: () => void;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface ServiceAreaCircle {
  enabled?: boolean;
  name?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  boundaryGeoJson?: string | null;
}

export interface PickedLocationItem {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapboxViewProps {
  userLatitude?: number;
  userLongitude?: number;
  markers?: MapMarkerItem[];
  routeCoordinates?: RouteCoordinate[];
  isApproximateRoute?: boolean;
  serviceArea?: ServiceAreaCircle | null;
  pickedLocation?: PickedLocationItem | null;
  fitBounds?: boolean;
  interactive?: boolean;
  mapStyle?: 'streets' | 'satellite' | 'dark';
  language?: 'vi' | 'en';
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
      isApproximateRoute = false,
      serviceArea = null,
      pickedLocation = null,
      fitBounds = false,
      interactive = true,
      mapStyle = 'satellite',
      language = 'vi',
      onMarkerPress,
      onMapPress,
      style,
    },
    ref
  ) => {
    const webViewRef = useRef<any>(null);
    const isMapReadyRef = useRef(false);
    // Đóng băng tâm & style khởi tạo để tránh reload WebView khi di chuyển map hoặc đổi lớp bản đồ
    const initialCenterRef = useRef({ lat: userLatitude, lng: userLongitude });
    const initialStyleRef = useRef(mapStyle);
    const latestStateRef = useRef({
      userLatitude,
      userLongitude,
      serviceArea,
      pickedLocation,
      markers,
      routeCoordinates,
      isApproximateRoute,
      fitBounds,
    });
    latestStateRef.current = {
      userLatitude,
      userLongitude,
      serviceArea,
      pickedLocation,
      markers,
      routeCoordinates,
      isApproximateRoute,
      fitBounds,
    };

    // Sync service area circle
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setServiceArea) {
            window.setServiceArea(${JSON.stringify(serviceArea)});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [serviceArea]);

    // Sync picked fixed location marker
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setPickedLocation) {
            window.setPickedLocation(${JSON.stringify(pickedLocation)});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [pickedLocation]);

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
            window.setRoute(${JSON.stringify(routeCoordinates)}, ${isApproximateRoute ? 'true' : 'false'});
          }
          ${fitBounds ? `if (window.fitAllBounds) { window.fitAllBounds(${userLatitude}, ${userLongitude}, ${JSON.stringify(markers)}, ${JSON.stringify(routeCoordinates)}); }` : ''}
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [routeCoordinates, isApproximateRoute, fitBounds, markers, userLatitude, userLongitude]);

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
      openMarkerPopup: (markerId: string) => {
        const js = `
          if (window.openMarkerPopup) {
            window.openMarkerPopup(${JSON.stringify(markerId)});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
      updateMarkerLocation: (markerId: string, latitude: number, longitude: number, heading?: number) => {
        const js = `
          if (window.updateMarkerLocation) {
            window.updateMarkerLocation(${JSON.stringify(markerId)}, ${latitude}, ${longitude}, ${typeof heading === 'number' ? heading : 'null'});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
      invalidateSize: () => {
        const js = `
          if (window.map && window.map.invalidateSize) {
            setTimeout(function() { window.map.invalidateSize(true); }, 60);
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      },
    }));

    // Sync mapStyle dynamically inside Leaflet without reloading WebView
    useEffect(() => {
      if (isMapReadyRef.current) {
        const js = `
          if (window.setMapStyle) {
            window.setMapStyle(${JSON.stringify(mapStyle)});
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }, [mapStyle]);

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload.type === 'MAP_READY') {
          isMapReadyRef.current = true;
          const s = latestStateRef.current;
          // Initial push of markers, route, user location, service area, and picked location
          const js = `
            if (window.setMapStyle) window.setMapStyle(${JSON.stringify(mapStyle)});
            if (window.setUserLocation) window.setUserLocation(${s.userLatitude}, ${s.userLongitude});
            if (window.setServiceArea) window.setServiceArea(${JSON.stringify(s.serviceArea)});
            if (window.setPickedLocation) window.setPickedLocation(${JSON.stringify(s.pickedLocation)});
            if (window.setMarkers) window.setMarkers(${JSON.stringify(s.markers)});
            if (window.setRoute) window.setRoute(${JSON.stringify(s.routeCoordinates)}, ${s.isApproximateRoute ? 'true' : 'false'});
            ${s.fitBounds ? `if (window.fitAllBounds) { window.fitAllBounds(${s.userLatitude}, ${s.userLongitude}, ${JSON.stringify(s.markers)}, ${JSON.stringify(s.routeCoordinates)}); }` : ''}
            true;
          `;
          webViewRef.current?.injectJavaScript(js);
        } else if (payload.type === 'CALL_PHONE' && payload.phone) {
          Linking.openURL(`tel:${payload.phone}`).catch(() => {
            Alert.alert('Lỗi', 'Không thể khởi chạy cuộc gọi điện thoại.');
          });
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

    const htmlContent = useMemo(
      () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Emergency Safety Map</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';document.head.appendChild(s);"></script>
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
      background: #2563EB;
      animation: vehiclePulse 1.2s infinite alternate;
    }
    .vehicle-status-onscene {
      background: #F97316;
      animation: vehiclePulse 1.2s infinite alternate;
    }
    .vehicle-status-other { background: #64748B; }

    .vehicle-eta-pill {
      position: absolute;
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #38BDF8;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 6px;
      border: 1.2px solid #38BDF8;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      line-height: 12px;
      pointer-events: none;
    }

    .popup-eta-box {
      margin-top: 6px;
      padding: 5px 8px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 6px;
      font-size: 11.5px;
      color: #1D4ED8;
      font-weight: 700;
    }

    @keyframes glowPing {
      0% { transform: scale(1); opacity: 0.65; }
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.22; }
      50% { opacity: 0.1; }
    }
    .glow-ping { animation: glowPing 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; }
    .glow-pulse { animation: glowPulse 2s ease-in-out infinite; }
    .vehicle-eta-pill {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #38BDF8;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 6px;
      border: 1.2px solid #38BDF8;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      line-height: 12px;
      pointer-events: none;
      z-index: 2;
    }

    .popup-eta-box {
      margin-top: 6px;
      padding: 5px 8px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 6px;
      font-size: 11.5px;
      color: #1D4ED8;
      font-weight: 700;
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
      margin-top: 5px;
      color: #0284C7;
      text-decoration: none;
      font-weight: 700;
      font-size: 12px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-family: inherit;
    }
    .popup-pick-btn {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 7px 10px;
      border-radius: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      font-size: 11.5px;
      font-weight: 700;
      text-align: center;
      cursor: pointer;
      font-family: inherit;
    }

    /* Picked location custom pin */
    .picked-pin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      filter: drop-shadow(0 4px 12px rgba(220, 38, 38, 0.6));
      animation: bouncePin 0.4s ease-out;
    }
    .picked-marker-box {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      background: #DC2626;
      border: 3px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      box-shadow: 0 0 14px rgba(220, 38, 38, 0.7);
    }
    .picked-marker-arrow {
      width: 0;
      height: 0;
      margin-top: -3px;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 9px solid #DC2626;
    }
    .picked-pulse-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.45);
      animation: pulseAnim 1.6s infinite ease-out;
      pointer-events: none;
    }
    @keyframes bouncePin {
      0% { transform: translateY(-24px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var isEn = '${language}' === 'en';
    var map = L.map('map', {
      center: [${initialCenterRef.current.lat}, ${initialCenterRef.current.lng}],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: ${interactive ? 'true' : 'false'},
      touchZoom: ${interactive ? 'true' : 'false'},
      doubleClickZoom: ${interactive ? 'true' : 'false'},
      scrollWheelZoom: ${interactive ? 'true' : 'false'}
    });
    window.map = map;

    // Mapbox official styles & fallback tile switcher (không cần reload WebView)
    var mapboxToken = '${MAPBOX_ACCESS_TOKEN}';
    var activeTileLayer = null;

    function buildStyleUrls(styleName) {
      var mbId = styleName === 'satellite'
        ? 'mapbox/satellite-streets-v12'
        : styleName === 'dark'
        ? 'mapbox/dark-v11'
        : 'mapbox/streets-v12';
      var fbUrl = styleName === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : styleName === 'dark'
        ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      return {
        mapbox: 'https://api.mapbox.com/styles/v1/' + mbId + '/tiles/256/{z}/{x}/{y}@2x?access_token=' + mapboxToken,
        fallback: fbUrl
      };
    }

    var currentMapStyle = '${initialStyleRef.current}';
    window.setMapStyle = function(styleName) {
      if (!styleName) return;
      currentMapStyle = styleName;
      var urls = buildStyleUrls(styleName);
      if (activeTileLayer) {
        try { map.removeLayer(activeTileLayer); } catch(e) {}
        activeTileLayer = null;
      }
      var mbLayer = L.tileLayer(urls.mapbox, {
        maxZoom: 20,
        tileSize: 256,
        attribution: '&copy; Mapbox &copy; OpenStreetMap'
      });
      var fbLayer = L.tileLayer(urls.fallback, {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap'
      });
      var osmFallbackLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      });
      var switched = false;
      var fbSwitched = false;
      fbLayer.on('tileerror', function() {
        if (!fbSwitched && currentMapStyle === styleName) {
          fbSwitched = true;
          try { map.removeLayer(fbLayer); } catch(e) {}
          activeTileLayer = osmFallbackLayer.addTo(map);
        }
      });
      mbLayer.on('tileerror', function() {
        if (!switched && currentMapStyle === styleName) {
          switched = true;
          try { map.removeLayer(mbLayer); } catch(e) {}
          activeTileLayer = fbLayer.addTo(map);
        }
      });
      if (mapboxToken && mapboxToken.indexOf('pk.') === 0) {
        activeTileLayer = mbLayer.addTo(map);
      } else {
        activeTileLayer = fbLayer.addTo(map);
      }
    };

    window.setMapStyle(currentMapStyle);

    // Layer group for dynamic POI markers
    window.markersLayer = L.layerGroup().addTo(map);

    // Layer group for route polyline
    window.routeLayer = L.layerGroup().addTo(map);

    // Layer group for service area boundary circle
    window.serviceAreaLayer = L.layerGroup().addTo(map);

    // Layer group for picked location marker
    window.pickedLocationLayer = L.layerGroup().addTo(map);

    function emitMapClick(latlng) {
      if (!latlng || !window.ReactNativeWebView) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'MAP_CLICK',
        latitude: latlng.lat,
        longitude: latlng.lng
      }));
    }

    // Service area boundary updater (polygon GeoJSON if configured by Admin, else circle)
    var activeBoundaryPopup = null;
    var lastBoundaryTapLatLng = null;
    var boundaryPopupWasOpen = false;
    map.on('preclick', function() {
      // Capture state before Leaflet's preclick auto-closes the popup on tap
      boundaryPopupWasOpen = !!(activeBoundaryPopup && activeBoundaryPopup.isOpen());
    });
    window.__pickBoundaryLocation = function() {
      boundaryPopupWasOpen = false;
      if (activeBoundaryPopup) map.closePopup(activeBoundaryPopup);
      if (lastBoundaryTapLatLng) {
        emitMapClick(lastBoundaryTapLatLng);
      }
    };

    window.setServiceArea = function(area) {
      boundaryPopupWasOpen = false;
      if (activeBoundaryPopup && activeBoundaryPopup.isOpen()) {
        map.closePopup(activeBoundaryPopup);
      }
      activeBoundaryPopup = null;
      window.serviceAreaLayer.clearLayers();
      if (!area || area.enabled === false) return;
      var styleOpts = {
        color: '#DC2626',
        weight: 2.2,
        dashArray: '6, 6',
        fillColor: '#EF4444',
        fillOpacity: 0.08
      };
      var parsedBoundary = null;
      if (area.boundaryGeoJson) {
        try {
          parsedBoundary = JSON.parse(area.boundaryGeoJson);
        } catch (e) {
          parsedBoundary = null;
        }
      }

      var boundaryLayer = null;
      if (parsedBoundary && (parsedBoundary.type === 'Polygon' || parsedBoundary.type === 'MultiPolygon')) {
        boundaryLayer = L.geoJSON(parsedBoundary, { style: styleOpts }).addTo(window.serviceAreaLayer);
      } else {
        var centerLat = area.centerLat;
        var centerLng = area.centerLng;
        var radiusMeters = (area.radiusKm || 4.5) * 1000;
        if (typeof centerLat !== 'number' || typeof centerLng !== 'number') return;
        boundaryLayer = L.circle([centerLat, centerLng], Object.assign({ radius: radiusMeters }, styleOpts)).addTo(window.serviceAreaLayer);
      }

      var areaBadge = isEn ? 'OPERATIONAL BOUNDARY' : 'RANH GIỚI VẬN HÀNH';
      var areaName = area.name || (isEn ? 'Emergency Service Area (IZ)' : 'Khu Vực Phục Vụ Cứu Hộ (KCN)');
      var areaDesc = parsedBoundary
        ? (isEn ? 'Configured polygon boundary' : 'Phạm vi ranh giới đa giác đã cấu hình')
        : ((isEn ? 'Dispatch response radius: ' : 'Bán kính điều phối ứng cứu: ') + '<b>' + (area.radiusKm || 4.5) + ' km</b>');
      var pickPrompt = isEn ? '📍 Tap again to select as report location' : '📍 Chạm lần nữa để chọn làm vị trí báo cáo';

      activeBoundaryPopup = L.popup().setContent(
        '<div onclick="window.__pickBoundaryLocation && window.__pickBoundaryLocation()" style="cursor:pointer">' +
        '<div class="popup-badge badge-red">' + areaBadge + '</div>' +
        '<div class="popup-title">🛡️ ' + areaName + '</div>' +
        '<div class="popup-desc">' + areaDesc + '</div>' +
        '<button type="button" class="popup-pick-btn">' + pickPrompt + '</button>' +
        '</div>'
      );

      boundaryLayer.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (boundaryPopupWasOpen || (activeBoundaryPopup && activeBoundaryPopup.isOpen())) {
          boundaryPopupWasOpen = false;
          if (activeBoundaryPopup) map.closePopup(activeBoundaryPopup);
          emitMapClick(e.latlng);
          return;
        }
        lastBoundaryTapLatLng = e.latlng;
        if (activeBoundaryPopup) {
          activeBoundaryPopup.setLatLng(e.latlng).openOn(map);
        }
      });
    };

    // Shared 3D & Glow SVG icons matching web src/assets/map-icons & map-icons-3d
    var SVG_ICONS = {
      pickPin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40" style="display:block;overflow:visible">' +
        '<path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 39 15 39s14-13.7 14-24.1C29 7.2 22.7 1 15 1z" fill="#0F172A" stroke="#F87171" stroke-width="2.5"/>' +
        '<path d="M15 9.8v10.4 M9.8 15h10.4" stroke="#FCA5A5" stroke-width="2.8" stroke-linecap="round"/></svg>',
      fire: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="display:block"><path fill="{COLOR}" fill-rule="evenodd" d="M12.6 2.5c.6 3.2-1.3 5-2.9 6.7C8.2 10.8 6.5 12.8 6.5 15.6A5.6 5.6 0 0 0 12 21.5a5.6 5.6 0 0 0 5.5-5.8c0-2.2-.9-3.9-2.1-5.3.1 1.6-.6 2.8-1.7 3.4.7-3.9-.2-7.8-1.1-11.3Z M12 14.2c1.3 1.4 2.3 2.5 2.3 3.8a2.3 2.3 0 0 1-4.6 0c0-1.3 1-2.4 2.3-3.8Z"/></svg>',
      accident: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="display:block">' +
        '<path fill="{COLOR}" d="M5.93 1.48 7.34 4.47 9.58 3.25 8.64 5.62 11.6 6.64 8.56 7.36 9.02 9.49 7.15 8.37 5.55 10.83 5.48 7.9 3.12 7.96 4.8 6.3 2.94 4.3 5.63 4.78Z"/>' +
        '<g transform="translate(17.2 10.2) rotate(25) scale(.55) translate(-12 -12.25)"><path fill="{COLOR}" fill-rule="evenodd" d="M7.4 5h9.2a2 2 0 0 1 1.9 1.4L19.6 10H20a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 1-1 1H20v1.5a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V17H7.6v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V17h-.5a1 1 0 0 1-1-1v-4.5A1.5 1.5 0 0 1 4 10h.4l1.1-3.6A2 2 0 0 1 7.4 5Z M7.6 7h8.8l.9 3H6.7Z M5.2 13.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0Z M16.2 13.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0Z"/></g>' +
        '<g transform="translate(-.5 10.5) scale(.6)"><path fill="{COLOR}" fill-rule="evenodd" d="M7.4 5h9.2a2 2 0 0 1 1.9 1.4L19.6 10H20a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 1-1 1H20v1.5a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V17H7.6v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V17h-.5a1 1 0 0 1-1-1v-4.5A1.5 1.5 0 0 1 4 10h.4l1.1-3.6A2 2 0 0 1 7.4 5Z M7.6 7h8.8l.9 3H6.7Z M5.2 13.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0Z M16.2 13.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0Z"/></g></svg>',
      other: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="display:block"><path d="M12 3.4 21.6 20H2.4Z" fill="none" stroke="{COLOR}" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 9.6v4.8" fill="none" stroke="{COLOR}" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.45" fill="{COLOR}"/></svg>',
      unknown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="display:block"><path d="M8.6 8.6a3.4 3.4 0 1 1 5 3c-1 .5-1.6 1.2-1.6 2.3v1" fill="none" stroke="{COLOR}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="18.8" r="1.6" fill="{COLOR}"/></svg>',
      stationMine: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" style="display:block;overflow:visible">' +
        '<ellipse cx="34.7" cy="34.3" rx="22" ry="9" fill="#0F172A" opacity="0.24"/>' +
        '<polygon points="6.3,30.5 36.6,45.7 36.6,43.9 6.3,28.7" fill="#94A3B8"/><polygon points="58.3,34.8 36.6,45.7 36.6,43.9 58.3,33.0" fill="#7C8BA1"/><polygon points="28.0,17.8 58.3,33.0 36.6,43.9 6.3,28.7" fill="#E2E8F0"/>' +
        '<polygon points="13.0,26.9 20.4,30.6 20.4,22.0 13.0,18.3" fill="#E2E8F0"/><polygon points="32.7,24.5 20.4,30.6 20.4,22.0 32.7,15.9" fill="#B6C2D2"/><polygon points="25.3,12.2 32.7,15.9 20.4,22.0 13.0,18.3" fill="#EF4444"/>' +
        '<polygon points="18.4,31.7 30.7,37.8 30.7,21.0 18.4,14.8" fill="#E2E8F0"/><polygon points="47.1,29.6 30.7,37.8 30.7,21.0 47.1,12.8" fill="#B6C2D2"/><polygon points="34.8,6.6 47.1,12.8 30.7,21.0 18.4,14.8" fill="#F8FAFC"/>' +
        '<polygon points="45.4,21.6 42.3,23.2 42.3,20.5 45.4,18.9" fill="#2B5797"/><polygon points="40.7,24.0 37.6,25.5 37.6,22.8 40.7,21.3" fill="#2B5797"/><polygon points="36.0,26.3 32.9,27.9 32.9,25.2 36.0,23.7" fill="#2B5797"/>' +
        '<polygon points="45.4,17.1 42.3,18.6 42.3,16.0 45.4,14.4" fill="#2B5797"/><polygon points="40.7,19.5 37.6,21.0 37.6,18.3 40.7,16.8" fill="#2B5797"/><polygon points="36.0,21.8 32.9,23.4 32.9,20.7 36.0,19.2" fill="#2B5797"/>' +
        '<polygon points="20.0,32.5 29.0,37.0 29.0,29.8 20.0,25.3" fill="#475569"/><line x1="20.0" y1="30.7" x2="29.0" y2="35.2" stroke="#94A3B8" stroke-width="0.45"/><line x1="20.0" y1="29.0" x2="29.0" y2="33.5" stroke="#94A3B8" stroke-width="0.45"/><line x1="20.0" y1="27.2" x2="29.0" y2="31.8" stroke="#94A3B8" stroke-width="0.45"/>' +
        '<polygon points="20.0,22.8 23.1,24.4 23.1,21.5 20.0,20.0" fill="#3B6FB6"/><polygon points="25.9,25.8 29.0,27.4 29.0,24.5 25.9,22.9" fill="#3B6FB6"/>' +
        '<polygon points="17.1,14.8 30.7,21.6 30.7,19.8 17.1,13.0" fill="#B91C1C"/><polygon points="48.3,12.8 30.7,21.6 30.7,19.8 48.3,11.0" fill="#991B1B"/><polygon points="34.8,4.2 48.3,11.0 30.7,19.8 17.1,13.0" fill="#EF4444"/><polyline points="17.1,13.0 30.7,19.8 48.3,11.0" fill="none" stroke="#FCA5A5" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/>' +
        '<polygon points="30.0,12.1 32.5,13.3 32.5,11.1 30.0,9.8" fill="#B91C1C"/><polygon points="35.8,11.7 32.5,13.3 32.5,11.1 35.8,9.4" fill="#991B1B"/><polygon points="33.3,8.2 35.8,9.4 32.5,11.1 30.0,9.8" fill="#EF4444"/><polyline points="30.0,9.8 32.5,11.1 35.8,9.4" fill="none" stroke="#FFFFFF" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/>' +
        '<polygon points="32.7,36.8 40.1,40.5 40.1,31.9 32.7,28.2" fill="#E2E8F0"/><polygon points="52.4,34.3 40.1,40.5 40.1,31.9 52.4,25.7" fill="#B6C2D2"/><polygon points="45.0,22.0 52.4,25.7 40.1,31.9 32.7,28.2" fill="#F8FAFC"/>' +
        '<polygon points="50.5,31.8 47.5,33.3 47.5,30.6 50.5,29.1" fill="#2B5797"/><polygon points="45.4,34.3 42.3,35.9 42.3,33.2 45.4,31.7" fill="#2B5797"/>' +
        '<polygon points="31.9,28.2 40.1,32.3 40.1,30.8 31.9,26.7" fill="#B91C1C"/><polygon points="53.2,25.7 40.1,32.3 40.1,30.8 53.2,24.3" fill="#991B1B"/><polygon points="45.0,20.2 53.2,24.3 40.1,30.8 31.9,26.7" fill="#EF4444"/><polyline points="31.9,26.7 40.1,30.8 53.2,24.3" fill="none" stroke="#FCA5A5" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/></svg>',
      stationOther: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" style="display:block;overflow:visible">' +
        '<ellipse cx="34.7" cy="34.3" rx="22" ry="9" fill="#0F172A" opacity="0.24"/>' +
        '<polygon points="6.3,30.5 36.6,45.7 36.6,43.9 6.3,28.7" fill="#94A3B8"/><polygon points="58.3,34.8 36.6,45.7 36.6,43.9 58.3,33.0" fill="#7C8BA1"/><polygon points="28.0,17.8 58.3,33.0 36.6,43.9 6.3,28.7" fill="#E2E8F0"/>' +
        '<polygon points="13.0,26.9 20.4,30.6 20.4,22.0 13.0,18.3" fill="#E2E8F0"/><polygon points="32.7,24.5 20.4,30.6 20.4,22.0 32.7,15.9" fill="#B6C2D2"/><polygon points="25.3,12.2 32.7,15.9 20.4,22.0 13.0,18.3" fill="#94A3B8"/>' +
        '<polygon points="18.4,31.7 30.7,37.8 30.7,21.0 18.4,14.8" fill="#E2E8F0"/><polygon points="47.1,29.6 30.7,37.8 30.7,21.0 47.1,12.8" fill="#B6C2D2"/><polygon points="34.8,6.6 47.1,12.8 30.7,21.0 18.4,14.8" fill="#F8FAFC"/>' +
        '<polygon points="45.4,21.6 42.3,23.2 42.3,20.5 45.4,18.9" fill="#2B5797"/><polygon points="40.7,24.0 37.6,25.5 37.6,22.8 40.7,21.3" fill="#2B5797"/><polygon points="36.0,26.3 32.9,27.9 32.9,25.2 36.0,23.7" fill="#2B5797"/>' +
        '<polygon points="45.4,17.1 42.3,18.6 42.3,16.0 45.4,14.4" fill="#2B5797"/><polygon points="40.7,19.5 37.6,21.0 37.6,18.3 40.7,16.8" fill="#2B5797"/><polygon points="36.0,21.8 32.9,23.4 32.9,20.7 36.0,19.2" fill="#2B5797"/>' +
        '<polygon points="20.0,32.5 29.0,37.0 29.0,29.8 20.0,25.3" fill="#475569"/><line x1="20.0" y1="30.7" x2="29.0" y2="35.2" stroke="#94A3B8" stroke-width="0.45"/><line x1="20.0" y1="29.0" x2="29.0" y2="33.5" stroke="#94A3B8" stroke-width="0.45"/><line x1="20.0" y1="27.2" x2="29.0" y2="31.8" stroke="#94A3B8" stroke-width="0.45"/>' +
        '<polygon points="20.0,22.8 23.1,24.4 23.1,21.5 20.0,20.0" fill="#3B6FB6"/><polygon points="25.9,25.8 29.0,27.4 29.0,24.5 25.9,22.9" fill="#3B6FB6"/>' +
        '<polygon points="17.1,14.8 30.7,21.6 30.7,19.8 17.1,13.0" fill="#64748B"/><polygon points="48.3,12.8 30.7,21.6 30.7,19.8 48.3,11.0" fill="#475569"/><polygon points="34.8,4.2 48.3,11.0 30.7,19.8 17.1,13.0" fill="#94A3B8"/><polyline points="17.1,13.0 30.7,19.8 48.3,11.0" fill="none" stroke="#E2E8F0" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/>' +
        '<polygon points="30.0,12.1 32.5,13.3 32.5,11.1 30.0,9.8" fill="#64748B"/><polygon points="35.8,11.7 32.5,13.3 32.5,11.1 35.8,9.4" fill="#475569"/><polygon points="33.3,8.2 35.8,9.4 32.5,11.1 30.0,9.8" fill="#64748B"/><polyline points="30.0,9.8 32.5,11.1 35.8,9.4" fill="none" stroke="#FFFFFF" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/>' +
        '<polygon points="32.7,36.8 40.1,40.5 40.1,31.9 32.7,28.2" fill="#E2E8F0"/><polygon points="52.4,34.3 40.1,40.5 40.1,31.9 52.4,25.7" fill="#B6C2D2"/><polygon points="45.0,22.0 52.4,25.7 40.1,31.9 32.7,28.2" fill="#F8FAFC"/>' +
        '<polygon points="50.5,31.8 47.5,33.3 47.5,30.6 50.5,29.1" fill="#2B5797"/><polygon points="45.4,34.3 42.3,35.9 42.3,33.2 45.4,31.7" fill="#2B5797"/>' +
        '<polygon points="31.9,28.2 40.1,32.3 40.1,30.8 31.9,26.7" fill="#64748B"/><polygon points="53.2,25.7 40.1,32.3 40.1,30.8 53.2,24.3" fill="#475569"/><polygon points="45.0,20.2 53.2,24.3 40.1,30.8 31.9,26.7" fill="#94A3B8"/><polyline points="31.9,26.7 40.1,30.8 53.2,24.3" fill="none" stroke="#E2E8F0" stroke-width="0.8" stroke-linejoin="round" opacity="0.9"/></svg>',
      vehAmbulance: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" style="display:block;overflow:visible">' +
        '<rect x="22.5" y="11.5" width="24" height="48" rx="6" fill="#0F172A" opacity="0.28"/><rect x="18.4" y="17" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="17" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="18.4" y="43" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="43" width="3.2" height="8" rx="1.4" fill="#1F2937"/>' +
        '<rect x="20.0" y="8" width="24" height="48" rx="6" fill="#CBD5E1"/><rect x="20.0" y="8" width="21" height="46.5" rx="6" fill="#F8FAFC"/><rect x="21.2" y="10" width="1.6" height="42" rx="0.8" fill="#FFFFFF" opacity="0.8"/>' +
        '<path d="M23.0 20 L25.0 14.5 H38.0 L40.0 20 Z" fill="#1E293B"/><path d="M26.0 18.8 L27.5 15.5 H30.0 L28.5 18.8 Z" fill="#FFFFFF" opacity="0.4"/>' +
        '<rect x="25.0" y="21.5" width="6.5" height="2.6" rx="1" fill="#EF4444"/><rect x="31.5" y="21.5" width="6.5" height="2.6" rx="1" fill="#3B82F6"/>' +
        '<rect x="22.5" y="26.5" width="16" height="26.5" rx="2.5" fill="#E2E8F0"/><rect x="28.1" y="32.75" width="4.8" height="14" rx="1" fill="#DC2626"/><rect x="23.5" y="37.35" width="14" height="4.8" rx="1" fill="#DC2626"/><rect x="22.5" y="49" width="16" height="2.2" rx="1" fill="#DC2626"/></svg>',
      vehFire: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" style="display:block;overflow:visible">' +
        '<rect x="22.5" y="8.5" width="24" height="54" rx="6" fill="#0F172A" opacity="0.28"/><rect x="18.4" y="14" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="14" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="18.4" y="46" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="46" width="3.2" height="8" rx="1.4" fill="#1F2937"/>' +
        '<rect x="20.0" y="5" width="24" height="54" rx="6" fill="#991B1B"/><rect x="20.0" y="5" width="21" height="52.5" rx="6" fill="#DC2626"/><rect x="21.2" y="7" width="1.6" height="48" rx="0.8" fill="#F87171" opacity="0.8"/>' +
        '<path d="M23.0 17 L25.0 11.5 H38.0 L40.0 17 Z" fill="#1E293B"/><path d="M26.0 15.8 L27.5 12.5 H30.0 L28.5 15.8 Z" fill="#FFFFFF" opacity="0.4"/>' +
        '<rect x="25.0" y="18.5" width="6.5" height="2.6" rx="1" fill="#EF4444"/><rect x="31.5" y="18.5" width="6.5" height="2.6" rx="1" fill="#3B82F6"/>' +
        '<rect x="22.5" y="23.5" width="16" height="32.5" rx="2" fill="#B91C1C"/><rect x="25.0" y="25.0" width="2" height="29.5" rx="1" fill="#E5E7EB"/><rect x="34.5" y="25.0" width="2" height="29.5" rx="1" fill="#E5E7EB"/>' +
        '<rect x="25.0" y="27.5" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="31.7" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="35.9" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="40.1" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="44.3" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="48.5" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/><rect x="25.0" y="52.7" width="11.5" height="1.2" rx="0.5" fill="#CBD5E1"/></svg>',
      vehRescue: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" style="display:block;overflow:visible">' +
        '<rect x="22.5" y="9.5" width="24" height="52" rx="6" fill="#0F172A" opacity="0.28"/><rect x="18.4" y="15" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="15" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="18.4" y="45" width="3.2" height="8" rx="1.4" fill="#1F2937"/><rect x="42.4" y="45" width="3.2" height="8" rx="1.4" fill="#1F2937"/>' +
        '<rect x="20.0" y="6" width="24" height="52" rx="6" fill="#B45309"/><rect x="20.0" y="6" width="21" height="50.5" rx="6" fill="#F59E0B"/><rect x="21.2" y="8" width="1.6" height="46" rx="0.8" fill="#FCD34D" opacity="0.8"/>' +
        '<path d="M23.0 18 L25.0 12.5 H38.0 L40.0 18 Z" fill="#1E293B"/><path d="M26.0 16.8 L27.5 13.5 H30.0 L28.5 16.8 Z" fill="#FFFFFF" opacity="0.4"/>' +
        '<rect x="25.0" y="19.5" width="6.5" height="2.6" rx="1" fill="#F97316"/><rect x="31.5" y="19.5" width="6.5" height="2.6" rx="1" fill="#FBBF24"/>' +
        '<rect x="22.5" y="24.5" width="16" height="30.5" rx="2" fill="#374151"/><line x1="23.5" y1="30.6" x2="37.5" y2="30.6" stroke="#6B7280" stroke-width="0.9"/><line x1="23.5" y1="36.7" x2="37.5" y2="36.7" stroke="#6B7280" stroke-width="0.9"/><line x1="23.5" y1="42.8" x2="37.5" y2="42.8" stroke="#6B7280" stroke-width="0.9"/><line x1="23.5" y1="48.9" x2="37.5" y2="48.9" stroke="#6B7280" stroke-width="0.9"/>' +
        '<rect x="27.5" y="27.5" width="6" height="24.5" rx="1.2" fill="#F59E0B"/>' +
        '<path d="M23.0 55.5 l2.4 -3.2 h2.2 l-2.4 3.2 Z" fill="#111827"/><path d="M27.6 55.5 l2.4 -3.2 h2.2 l-2.4 3.2 Z" fill="#111827"/><path d="M32.2 55.5 l2.4 -3.2 h2.2 l-2.4 3.2 Z" fill="#111827"/><path d="M36.8 55.5 l2.4 -3.2 h2.2 l-2.4 3.2 Z" fill="#111827"/></svg>'
    };

    function buildSeverityArcs(sevNum) {
      var arcColor = sevNum >= 3 ? '#F87171' : sevNum === 2 ? '#FBBF24' : '#34D399';
      var idle = 'rgba(203,213,225,0.75)';
      var s = '';
      for (var i = 0; i < 3; i++) {
        var a0 = -90 + i * 120 + 9;
        var a1 = -90 + (i + 1) * 120 - 9;
        var r = 17.5;
        var x0 = (24 + r * Math.cos((a0 * Math.PI) / 180)).toFixed(2);
        var y0 = (24 + r * Math.sin((a0 * Math.PI) / 180)).toFixed(2);
        var x1 = (24 + r * Math.cos((a1 * Math.PI) / 180)).toFixed(2);
        var y1 = (24 + r * Math.sin((a1 * Math.PI) / 180)).toFixed(2);
        s += '<path d="M' + x0 + ' ' + y0 + 'A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1 + '" fill="none" stroke="' + (i < sevNum ? arcColor : idle) + '" stroke-width="3.6" stroke-linecap="round"/>';
      }
      return s;
    }

    // Picked fixed location marker updater
    window.setPickedLocation = function(loc) {
      window.pickedLocationLayer.clearLayers();
      if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;

      var pinIcon = L.divIcon({
        className: '',
        html: '<div style="position:relative;width:30px;height:39px;cursor:pointer;">' +
          '<span class="glow-ping" style="position:absolute;left:6px;bottom:-9px;width:18px;height:18px;border-radius:50%;background:#DC2626;opacity:0.55;pointer-events:none;"></span>' +
          '<div style="position:absolute;left:0;top:0;filter:drop-shadow(0 0 5px rgba(239,68,68,0.85)) drop-shadow(0 2px 3px rgba(0,0,0,0.45));">' +
          SVG_ICONS.pickPin + '</div></div>',
        iconSize: [30, 39],
        iconAnchor: [15, 39]
      });

      var pinBadge = isEn ? 'SELECTED SOS LOCATION' : 'ĐIỂM ĐÃ CHỌN BÁO SOS';
      var pinTitle = isEn ? '📍 Selected Location' : '📍 Vị Trí Bạn Đã Chọn';
      var coordsPrefix = isEn ? 'Coordinates: ' : 'Toạ độ: ';

      var marker = L.marker([loc.latitude, loc.longitude], {
        icon: pinIcon,
        zIndexOffset: 3500
      }).bindPopup(
        '<div class="popup-badge badge-red">' + pinBadge + '</div>' +
        '<div class="popup-title">' + pinTitle + '</div>' +
        '<div class="popup-desc">' + (loc.address || coordsPrefix + loc.latitude.toFixed(5) + ', ' + loc.longitude.toFixed(5)) + '</div>'
      ).addTo(window.pickedLocationLayer);

      marker.openPopup();
    };

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
        var userTitle = isEn ? 'Your Location' : 'Vị Trí Của Bạn';
        var userDesc = isEn ? 'High GPS accuracy' : 'Độ chính xác GPS cao';
        userMarker = L.marker([lat, lng], { icon: userIcon })
          .bindPopup('<div class="popup-title">' + userTitle + '</div><div class="popup-desc">' + userDesc + '</div>')
          .addTo(map);
      }
    };

    // Update all POI & Incident & Fleet markers in-place without destroying DOM nodes on live GPS ticks
    window.markerById = {};
    window.updateMarkerLocation = function(id, lat, lng, heading) {
      var marker = window.markerById[id];
      if (!marker || typeof lat !== 'number' || typeof lng !== 'number') return;
      marker.setLatLng([lat, lng]);
      if (typeof heading === 'number') {
        var el = marker.getElement();
        var rotEl = el && el.querySelector('.veh-rotate-box');
        if (rotEl) rotEl.style.transform = 'rotate(' + heading + 'deg)';
      }
    };

    window.setMarkers = function(markersData) {
      if (!markersData || !Array.isArray(markersData)) {
        window.markersLayer.clearLayers();
        window.markerById = {};
        return;
      }

      var nextIds = {};
      markersData.forEach(function(m) { nextIds[m.id] = true; });
      Object.keys(window.markerById).forEach(function(id) {
        if (!nextIds[id]) {
          window.markersLayer.removeLayer(window.markerById[id]);
          delete window.markerById[id];
        }
      });

      markersData.forEach(function(m) {
        var customHtml = '';
        var iconSize = [36, 36];
        var iconAnchor = [18, 18];
        var badgeText = 'ĐIỂM AN TOÀN';
        var badgeClass = 'badge-blue';

        if (m.type === 'station') {
          customHtml = '<div style="position:relative;width:48px;height:48px;cursor:pointer;">' +
            (m.isMine ? SVG_ICONS.stationMine : SVG_ICONS.stationOther) +
            '</div>';
          iconSize = [48, 48];
          iconAnchor = [24, 24];
          badgeText = 'TRẠM CỨU HỘ TRỰC CHIẾN';
          badgeClass = 'badge-navy';
        } else if (m.type === 'rescue_unit') {
          var status = (m.status || '').toLowerCase();
          var dotColor = '#10B981';
          var statusLabel = 'SẴN SÀNG';
          var vehBadgeClass = 'badge-green';
          var isEnRoute = false;

          if (status === 'dispatched' || status === 'enroute' || status === 'en_route' || status === 'accepted') {
            dotColor = '#2563EB';
            statusLabel = 'ĐANG ĐẾN';
            vehBadgeClass = 'badge-blue';
            isEnRoute = true;
          } else if (status === 'onscene' || status === 'on_scene') {
            dotColor = '#F97316';
            statusLabel = 'TẠI HIỆN TRƯỜNG';
            vehBadgeClass = 'badge-amber';
          }

          var uType = (m.unitType || '').toLowerCase();
          var vehArt = SVG_ICONS.vehRescue;
          if (uType.indexOf('ambulance') !== -1 || uType.indexOf('thương') !== -1) {
            vehArt = SVG_ICONS.vehAmbulance;
          } else if (uType.indexOf('fire') !== -1 || uType.indexOf('hỏa') !== -1 || uType.indexOf('cháy') !== -1) {
            vehArt = SVG_ICONS.vehFire;
          }

          var heading = typeof m.heading === 'number' ? m.heading : 0;
          var dotStyle = 'left:27.5px;top:-1px;width:11px;height:11px;position:absolute;border-radius:50%;pointer-events:none;';
          var dotPulse = isEnRoute
            ? '<span class="glow-ping" style="' + dotStyle + 'background:' + dotColor + ';opacity:0.6;"></span>'
            : '';
          var etaPill = (typeof m.etaMinutes === 'number' && m.etaMinutes > 0)
            ? '<div class="vehicle-eta-pill">~' + m.etaMinutes + 'p</div>'
            : '';
          customHtml = '<div style="position:relative;width:48px;height:48px;cursor:pointer;">' +
            etaPill +
            '<div class="veh-rotate-box" style="position:relative;width:48px;height:48px;transform:rotate(' + heading + 'deg);">' +
            '<div style="pointer-events:none;">' + vehArt + '</div>' +
            dotPulse +
            '<span style="' + dotStyle + 'background:' + dotColor + ';border:2px solid #FFFFFF;box-sizing:border-box;box-shadow:0 1px 2px rgba(0,0,0,0.4);"></span>' +
            '</div></div>';
          iconSize = [48, 48];
          iconAnchor = [24, 24];
          badgeText = 'LỰC LƯỢNG CỨU HỘ • ' + statusLabel;
          badgeClass = vehBadgeClass;
        } else if (m.type === 'incident') {
          var cat = (m.category || '').toLowerCase();
          var textBlob = ((m.title || '') + ' ' + (m.description || ''));
          var resolvedCat = cat;
          if (resolvedCat !== 'fire' && resolvedCat !== 'accident' && resolvedCat !== 'other' && resolvedCat !== 'unknown') {
            if (/tai nạn|accident|va chạm|giao thông/i.test(textBlob)) resolvedCat = 'accident';
            else if (/cháy|hỏa hoạn|nổ|khói|fire/i.test(textBlob)) resolvedCat = 'fire';
            else resolvedCat = 'unknown';
          }

          var glowColor = resolvedCat === 'accident' ? '#F97316' : resolvedCat === 'other' ? '#0891B2' : '#DC2626';
          var glyphColor = resolvedCat === 'accident' ? '#FDBA74' : resolvedCat === 'other' ? '#67E8F9' : '#FF7A6E';
          var glyphArt = SVG_ICONS[resolvedCat] || SVG_ICONS.unknown;

          var sevNum = 1;
          if (m.severity === 'Level3' || m.severity === 3 || m.severity === 'Critical') sevNum = 3;
          else if (m.severity === 'Level2' || m.severity === 2 || m.severity === 'High') sevNum = 2;
          else if (m.severity === 'Level1' || m.severity === 1 || m.severity === 'Low') sevNum = 1;
          else if (m.severity === 'Unclassified' || m.severity === 0) sevNum = 1;

          var incSize = 52;
          var k = incSize / 48;
          var gSize = (16 * k).toFixed(2);
          var gOffset = (16 * k).toFixed(2);
          customHtml = '<div style="position:relative;width:' + incSize + 'px;height:' + incSize + 'px;cursor:pointer;">' +
            '<svg viewBox="0 0 48 48" width="' + incSize + '" height="' + incSize + '" style="position:absolute;inset:0;overflow:visible;pointer-events:none;">' +
            '<circle cx="24" cy="24" r="22" fill="' + glowColor + '" opacity="0.22" class="glow-pulse"/>' +
            '<circle cx="24" cy="24" r="23.2" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>' +
            '<circle cx="24" cy="24" r="13.5" fill="#0F172A" stroke="' + glowColor + '" stroke-width="1.5"/>' +
            buildSeverityArcs(sevNum) +
            '</svg>' +
            '<div style="position:absolute;left:' + gOffset + 'px;top:' + gOffset + 'px;width:' + gSize + 'px;height:' + gSize + 'px;pointer-events:none;">' +
            glyphArt.replace('width="16" height="16"', 'width="' + gSize + '" height="' + gSize + '"').replace(/\{COLOR\}/g, glyphColor) +
            '</div></div>';
          iconSize = [incSize, incSize];
          iconAnchor = [incSize / 2, incSize / 2];
          var catTitle = resolvedCat === 'accident' ? 'TAI NẠN HIỆN TRƯỜNG' : resolvedCat === 'fire' ? 'HỎA HOẠN HIỆN TRƯỜNG' : 'SỰ CỐ KHẨN CẤP';
          badgeText = catTitle + ' • CẤP ' + sevNum;
          badgeClass = (sevNum === 3 ? 'badge-red' : sevNum === 2 ? 'badge-amber' : 'badge-green');
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

        var phoneHtml = m.phoneNumber
          ? '<br/><button type="button" onclick="window.callPhone(\\'' + m.phoneNumber + '\\')" class="popup-phone-link">📞 ' + m.phoneNumber + ' (Gọi ngay)</button>'
          : '';

        var etaPopupHtml = (typeof m.etaMinutes === 'number' && m.etaMinutes > 0)
          ? '<div class="popup-eta-box">⏱️ <b>Dự kiến đến (ETA):</b> ~' + m.etaMinutes + ' phút' +
            (m.distanceKm ? ' (' + m.distanceKm.toFixed(1) + ' km)' : '') + '</div>'
          : '';

        var popupHtml = '<span class="popup-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<div class="popup-title">' + m.title + '</div>' +
          '<div class="popup-desc">' + m.description + '</div>' +
          etaPopupHtml +
          phoneHtml;

        var zOffset = 500;
        if (m.type === 'incident') zOffset = 2500;
        else if (m.type === 'rescue_unit') zOffset = 2000;
        else if (m.type === 'station') zOffset = 1500;

        var visualKey = [
          m.type,
          m.status || '',
          m.unitType || '',
          m.category || '',
          m.severity || '',
          m.etaMinutes || '',
          m.distanceKm || '',
          m.isMine ? '1' : '0',
          typeof m.heading === 'number' ? Math.round(m.heading) : ''
        ].join('|');

        var existing = window.markerById[m.id];
        if (existing) {
          existing.setLatLng([m.latitude, m.longitude]);
          if (existing.__visualKey !== visualKey) {
            existing.setIcon(L.divIcon({
              className: '',
              html: customHtml,
              iconSize: iconSize,
              iconAnchor: iconAnchor
            }));
            existing.__visualKey = visualKey;
          }
          if (existing.__popupHtml !== popupHtml) {
            existing.setPopupContent(popupHtml);
            existing.__popupHtml = popupHtml;
          }
          return;
        }

        var customIcon = L.divIcon({
          className: '',
          html: customHtml,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        });

        var marker = L.marker([m.latitude, m.longitude], {
          icon: customIcon,
          zIndexOffset: zOffset
        }).bindPopup(popupHtml);

        marker.on('click', function(e) {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e);
          }
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MARKER_CLICK',
              markerId: m.id
            }));
          }
        });

        marker.markerId = m.id;
        marker.__visualKey = visualKey;
        marker.__popupHtml = popupHtml;
        window.markerById[m.id] = marker;
        window.markersLayer.addLayer(marker);
      });
    };

    window.openMarkerPopup = function(id) {
      if (!window.markersLayer) return;
      window.markersLayer.eachLayer(function(layer) {
        if (layer.markerId === id) {
          layer.openPopup();
        }
      });
    };

    window.callPhone = function(phone) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CALL_PHONE',
          phone: phone
        }));
      }
    };

    // Update route polyline
    window.setRoute = function(coords, isApproximate) {
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

      // Core crisp polyline - solid road line by default, dashed only when approximate
      var polyOptions = {
        color: '#0284C7',
        weight: 3.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      };
      if (isApproximate === true) {
        polyOptions.dashArray = '6, 8';
      }

      L.polyline(latLngs, polyOptions).addTo(window.routeLayer);
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
      emitMapClick(e.latlng);
    });

    // Notify React Native that map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
    `,
      [interactive, language]
    );

    useEffect(() => {
      isMapReadyRef.current = false;
    }, [htmlContent]);

    const webViewSource = useMemo(
      () => ({ html: htmlContent, baseUrl: 'https://api.mapbox.com' }),
      [htmlContent]
    );

    const RNWebView = WebView as any;

    return (
      <View style={[styles.container, style]}>
        <RNWebView
          ref={webViewRef}
          source={webViewSource}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          onError={(syntheticEvent: any) => {
            console.warn('[MapboxView] WebView error:', syntheticEvent?.nativeEvent);
          }}
          onShouldStartLoadWithRequest={(request: any) => {
            if (request.url.startsWith('tel:')) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
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
});
