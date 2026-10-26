import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Alert,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  RefreshCw,
  Crosshair,
  Plus,
  Minus,
  X,
  Phone,
  Clock,
  Truck,
} from 'lucide-react-native';
import { MapboxView, MapboxViewRef, RouteCoordinate } from '../../components/map/MapboxView';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';
import { incidentService } from '../../services/incident.service';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { storage } from '../../services/storage';
import { useRoute } from '@react-navigation/native';
import { useLocationStore } from '../../store/useLocationStore';
import { useAppStore } from '../../store/useAppStore';

export const SafetyMapScreen: React.FC = () => {
  const { t } = useTranslation();
  const mapRef = useRef<MapboxViewRef>(null);
  const route = useRoute<any>();
  const trackingIncidentId = route.params?.trackingIncidentId;

  const {
    coords: userCoords,
    address: currentAddress,
    refreshLocation,
    setLocation,
  } = useLocationStore();

  const { isAuthenticated, user } = useAppStore();
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [isApproximateRoute, setIsApproximateRoute] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTrackingEta, setActiveTrackingEta] = useState<{
    incidentId: string;
    incidentTitle?: string;
    rescueUnitId?: string;
    plateNumber?: string;
    unitTypeName?: string;
    stationName?: string;
    status?: string;
    etaMinutes: number;
    distanceKm?: number;
    isApproximate?: boolean;
  } | null>(null);

  // Manual location search & map pick state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; latitude: number; longitude: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialCenteredRef = useRef(false);

  // Reset initial centered flag when tracking target changes
  useEffect(() => {
    hasInitialCenteredRef.current = false;
  }, [trackingIncidentId]);

  // Synchronize search input with store address initially and on GPS refresh
  useEffect(() => {
    if (currentAddress && currentAddress !== 'Đang xác định vị trí...') {
      setSearchQuery(currentAddress);
    }
  }, [currentAddress]);

  // Load real user GPS & real incidents, rescue units, stations from backend
  const loadMapData = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      // 1. Shared GPS location
      await refreshLocation();

      // 2. Load incidents from local device cache + API
      const localCachedIncidents = (await storage.getItem<any[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];
      let incidentList: Array<{
        id: string;
        title?: string;
        description?: string;
        locationAddress?: string;
        latitude?: number;
        longitude?: number;
        severity?: any;
        status?: any;
        category?: string;
      }> = [];

      // 2a. Staff assignments
      if (isAuthenticated && user?.role === 'staff') {
        try {
          const assignments = await staffDispatchService.getMyAssignments();
          for (const a of assignments) {
            if (a.incidentId) {
              incidentList.push({
                id: a.incidentId,
                title: a.incidentTitle || 'Sự Cố Đang Điều Phối',
                locationAddress: a.incidentAddress,
                latitude: a.incidentLatitude,
                longitude: a.incidentLongitude,
                severity: a.incidentSeverity,
                status: a.status,
              });
            }
          }
        } catch {
          // ignore
        }
      } else {
        // Citizen / Guest
        if (isAuthenticated) {
          try {
            const res = await incidentService.getMyReports({ pageSize: 30 });
            if (res?.items) {
              incidentList = res.items.map((i: any) => ({
                id: i.id,
                title: i.title,
                description: i.description,
                locationAddress: i.locationAddress,
                latitude: i.latitude,
                longitude: i.longitude,
                severity: i.severity,
                status: i.status,
              }));
            }
          } catch {
            // ignore
          }
        }

        // Merge locally cached incidents (created on this device, guest SOS, etc.)
        const idSet = new Set(incidentList.map((i) => i.id));
        for (const cached of localCachedIncidents) {
          if (!idSet.has(cached.id)) {
            incidentList.push({
              id: cached.id,
              title: cached.title,
              description: cached.description,
              locationAddress: cached.locationAddress,
              latitude: cached.latitude,
              longitude: cached.longitude,
              severity: cached.severity,
              status: cached.status,
            });
            idSet.add(cached.id);
          } else {
            // If cached has lat/lng but incidentList doesn't, backfill it
            const existing = incidentList.find((i) => i.id === cached.id);
            if (existing && (!existing.latitude || !existing.longitude)) {
              existing.latitude = cached.latitude;
              existing.longitude = cached.longitude;
            }
          }
        }
      }

      // Filter out completed and cancelled incidents
      const isCompletedOrCancelled = (s?: any) => {
        const str = String(s || '').toLowerCase();
        return str.includes('cancel') || str.includes('complet') || str.includes('resolv') || str === '3' || str === '6';
      };
      let activeIncidents = incidentList.filter((inc) => !isCompletedOrCancelled(inc.status));

      // If a specific incident was requested from MyReports, prioritize it first
      if (trackingIncidentId) {
        const matchIdx = activeIncidents.findIndex((i) => i.id === trackingIncidentId);
        if (matchIdx > 0) {
          const [targeted] = activeIncidents.splice(matchIdx, 1);
          activeIncidents.unshift(targeted);
        } else if (matchIdx === -1) {
          activeIncidents.unshift({ id: trackingIncidentId } as any);
        }
      }

      // 3. Fetch tracking for active incident(s) to get real-time staff/vehicle location & route
      let calculatedRoute: RouteCoordinate[] = [];
      const trackedVehicles: MapMarkerItem[] = [];
      let latestEtaInfo: {
        incidentId: string;
        incidentTitle?: string;
        rescueUnitId?: string;
        plateNumber?: string;
        unitTypeName?: string;
        stationName?: string;
        status?: string;
        etaMinutes: number;
        distanceKm?: number;
        isApproximate?: boolean;
      } | null = null;

      for (const inc of activeIncidents.slice(0, 5)) {
        try {
          const tracking = await incidentService.getTracking(inc.id);
          if (tracking) {
            // Backfill incident coordinates if missing from getMyReports
            if ((!inc.latitude || !inc.longitude) && tracking.incidentLat && tracking.incidentLng) {
              inc.latitude = tracking.incidentLat;
              inc.longitude = tracking.incidentLng;
            }
            if (tracking.incidentTitle && !inc.title) {
              inc.title = tracking.incidentTitle;
            }

            const etaMins = tracking.estimatedArrivalMinutes || 5;
            const distKm = tracking.distanceKm;

            // Create marker for the responding rescue unit
            if (tracking.vehicleLat && tracking.vehicleLng) {
              trackedVehicles.push({
                id: tracking.rescueUnitId || `veh-${inc.id}`,
                title: `${tracking.plateNumber || 'Xe cứu hộ'} (${tracking.unitTypeName || 'Đang phản ứng'})`,
                description: `Trạm: ${tracking.stationName || 'Cứu hộ'} • Trạng thái: ${
                  tracking.dispatchStatus || 'Đang di chuyển'
                } • Dự kiến: ~${etaMins} phút`,
                latitude: tracking.vehicleLat,
                longitude: tracking.vehicleLng,
                type: 'rescue_unit',
                unitType: tracking.unitTypeName || 'rescue',
                status: tracking.dispatchStatus || 'EnRoute',
                plateNumber: tracking.plateNumber,
                phoneNumber: tracking.stationPhoneNumber,
                etaMinutes: etaMins,
                distanceKm: distKm,
              });
            }

            if (!latestEtaInfo || inc.id === trackingIncidentId) {
              latestEtaInfo = {
                incidentId: inc.id,
                incidentTitle: inc.title || tracking.incidentTitle,
                rescueUnitId: tracking.rescueUnitId,
                plateNumber: tracking.plateNumber,
                unitTypeName: tracking.unitTypeName,
                stationName: tracking.stationName,
                status: tracking.dispatchStatus,
                etaMinutes: etaMins,
                distanceKm: distKm,
                isApproximate: !!tracking.isApproximateRoute,
              };
            }

            // Route trajectory from backend
            if (tracking.routeTrajectory && tracking.routeTrajectory.length > 1 && calculatedRoute.length === 0) {
              calculatedRoute = tracking.routeTrajectory;
              setIsApproximateRoute(!!tracking.isApproximateRoute);
            } else if (
              calculatedRoute.length === 0 &&
              tracking.vehicleLat &&
              tracking.vehicleLng &&
              inc.latitude &&
              inc.longitude
            ) {
              calculatedRoute = await mapboxService.getRoute(
                { latitude: tracking.vehicleLat, longitude: tracking.vehicleLng },
                { latitude: inc.latitude, longitude: inc.longitude }
              );
              setIsApproximateRoute(false);
            }
          }
        } catch {
          // Tracking not available or not yet dispatched
        }
      }

      // If active incident still has no lat/lng, attempt detail fetch
      for (const inc of activeIncidents) {
        if (!inc.latitude || !inc.longitude) {
          try {
            const detail = await incidentService.getIncidentById(inc.id);
            if (detail?.latitude && detail?.longitude) {
              inc.latitude = detail.latitude;
              inc.longitude = detail.longitude;
            }
          } catch {
            // ignore
          }
        }
      }

      // 4. Load public rescue units and stations
      const [rescueUnitsRes, stationsRes] = await Promise.allSettled([
        incidentService.getRescueUnits(),
        incidentService.getStations(),
      ]);

      const stationList = stationsRes.status === 'fulfilled' ? stationsRes.value || [] : [];
      const stationMarkers: MapMarkerItem[] = stationList
        .filter((s) => s.latitude && s.longitude)
        .map((s) => ({
          id: s.id,
          title: s.name,
          description: `${s.address} • ${s.activeUnitsCount || 0}/${s.totalUnitsCount || 0} xe trực chiến`,
          latitude: s.latitude,
          longitude: s.longitude,
          type: 'station',
          phoneNumber: s.phoneNumber,
        }));

      const unitList = rescueUnitsRes.status === 'fulfilled' ? rescueUnitsRes.value || [] : [];
      const publicActiveUnits = unitList.filter(
        (u) =>
          u.currentLat &&
          u.currentLng &&
          (u.status === 'Dispatched' || u.status === 'OnScene' || u.status === 'EnRoute' || u.status === 'Accepted')
      );

      const publicUnitMarkers: MapMarkerItem[] = publicActiveUnits.map((u) => ({
        id: u.id,
        title: `${u.plateNumber || 'Xe cứu hộ'} (${u.unitTypeName || u.unitType || 'Cứu hộ'})`,
        description: `Thuộc: ${u.stationName || 'Trạm'} • Trạng thái: ${
          u.status === 'Dispatched' ? 'Đang điều phối' : u.status === 'OnScene' ? 'Tại hiện trường' : u.status
        }`,
        latitude: u.currentLat,
        longitude: u.currentLng,
        type: 'rescue_unit',
        unitType: u.unitType,
        status: u.status,
        plateNumber: u.plateNumber,
      }));

      // Merge trackedVehicles and publicUnitMarkers (deduplicating by plateNumber or id)
      const mergedVehiclesMap = new Map<string, MapMarkerItem>();
      publicUnitMarkers.forEach((v) => mergedVehiclesMap.set(v.plateNumber || v.id, v));
      trackedVehicles.forEach((v) => mergedVehiclesMap.set(v.plateNumber || v.id, v));
      const unitMarkers = Array.from(mergedVehiclesMap.values());

      // 5. Build Incident markers
      const incidentMarkers: MapMarkerItem[] = activeIncidents
        .filter((inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && inc.latitude !== 0 && inc.longitude !== 0)
        .map((inc) => {
          const title = inc.title || '';
          const desc = inc.description || '';
          const isAccident =
            /tai nạn|accident|va chạm|ô tô|xe máy|giao thông/i.test(title + ' ' + desc) ||
            inc.category === 'accident';
          return {
            id: inc.id,
            title: title || 'Sự Cố Khẩn Cấp',
            description: `${inc.locationAddress || 'Hiện trường'} • Mức độ: ${inc.severity || 'Khẩn cấp'}`,
            latitude: inc.latitude!,
            longitude: inc.longitude!,
            type: 'incident',
            category: isAccident ? 'accident' : 'fire',
            severity: inc.severity,
            status: inc.status,
          };
        });

      // 6. Route fallback if not already provided by tracking
      if (calculatedRoute.length === 0 && incidentMarkers.length > 0 && unitMarkers.length > 0) {
        const primeUnit = unitMarkers[0];
        const primeInc = incidentMarkers[0];
        try {
          calculatedRoute = await mapboxService.getRoute(
            { latitude: primeUnit.latitude, longitude: primeUnit.longitude },
            { latitude: primeInc.latitude, longitude: primeInc.longitude }
          );
        } catch {
          // ignore
        }
      }

      setMarkers([...stationMarkers, ...unitMarkers, ...incidentMarkers]);
      setRouteCoordinates(calculatedRoute);
      setActiveTrackingEta(latestEtaInfo);

      // Only auto-center and fly on initial entry; never interrupt user while panning/zooming during background refresh
      if (!hasInitialCenteredRef.current) {
        hasInitialCenteredRef.current = true;
        if (trackingIncidentId) {
          const targetVehicle =
            trackedVehicles.find((v) => v.id.includes(trackingIncidentId) || v.id === `veh-${trackingIncidentId}`) ||
            trackedVehicles[0] ||
            unitMarkers[0];

          if (targetVehicle) {
            mapRef.current?.flyTo(targetVehicle.latitude, targetVehicle.longitude, 16);
            mapRef.current?.openMarkerPopup?.(targetVehicle.id);
          } else if (incidentMarkers.length > 0) {
            const targetInc = incidentMarkers.find((i) => i.id === trackingIncidentId) || incidentMarkers[0];
            mapRef.current?.flyTo(targetInc.latitude, targetInc.longitude, 16);
            mapRef.current?.openMarkerPopup?.(targetInc.id);
          }
        } else if (incidentMarkers.length > 0) {
          // Auto-fly to the active reported incident on initial load
          mapRef.current?.flyTo(incidentMarkers[0].latitude, incidentMarkers[0].longitude, 15);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  };

  // Periodic background refresh (every 8s) to track live rescue units & routes
  useEffect(() => {
    loadMapData(false);
    const timer = setInterval(() => {
      loadMapData(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role, trackingIncidentId]);

  const handleMarkerSelect = (marker: MapMarkerItem) => {
    mapRef.current?.flyTo(marker.latitude, marker.longitude, 16);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await mapboxService.searchLocation(text.trim());
        setSuggestions(results.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (item: { name: string; latitude: number; longitude: number }) => {
    setSuggestions([]);
    setSearchQuery(item.name);
    setLocation(item.latitude, item.longitude, item.name);
    mapRef.current?.flyTo(item.latitude, item.longitude, 16);
    Keyboard.dismiss();
  };

  const handleSearchSubmit = async () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const query = searchQuery.trim();
    if (!query) return;

    // Check if user entered "lat, lng" coordinates directly
    const coordMatch = query.match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setIsGeocoding(true);
        setSuggestions([]);
        Keyboard.dismiss();
        try {
          const addr = await mapboxService.reverseGeocode(lat, lng);
          setLocation(lat, lng, addr);
          setSearchQuery(addr);
          mapRef.current?.flyTo(lat, lng, 16);
        } finally {
          setIsGeocoding(false);
        }
        return;
      }
    }

    setIsSearching(true);
    try {
      const results = await mapboxService.searchLocation(query);
      if (results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        Alert.alert(t('common.notification', 'Thông báo'), 'Không tìm thấy địa điểm phù hợp');
      }
    } catch {
      Alert.alert(t('common.notification', 'Thông báo'), 'Lỗi khi tìm kiếm địa điểm');
    } finally {
      setIsSearching(false);
    }
  };

  // Map tap handler: dismiss overlays & keyboard without altering location
  const handleMapPress = () => {
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleRecenter = async () => {
    setSuggestions([]);
    Keyboard.dismiss();
    try {
      const loc = await refreshLocation(true);
      setSearchQuery(loc.address);
      mapRef.current?.flyTo(loc.latitude, loc.longitude, 16);
    } catch {
      mapRef.current?.recenter();
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      statusBarStyle="dark-content"
      style={styles.container}
    >
      {/* 1. Sleek Search & Manual Location Input Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          {isGeocoding || isSearching ? (
            <ActivityIndicator size="small" color="#DC2626" style={styles.searchIcon} />
          ) : (
            <MapPin size={18} color="#DC2626" style={styles.searchIcon} />
          )}

          <TextInput
            style={styles.searchInput}
            placeholder={t('map.search_placeholder', 'Nhập địa chỉ tìm kiếm...')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            selectTextOnFocus
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => loadMapData(false)}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Autocomplete Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsDropdown}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={`${item.latitude}-${item.longitude}-${idx}`}
                style={[
                  styles.suggestionItem,
                  idx === suggestions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <MapPin size={14} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 2. Interactive Mapbox View with In-Map Floating Controls */}
      <View style={styles.mapContainer}>
        <MapboxView
          ref={mapRef}
          userLatitude={userCoords.latitude}
          userLongitude={userCoords.longitude}
          markers={markers}
          routeCoordinates={routeCoordinates}
          isApproximateRoute={isApproximateRoute}
          onMarkerPress={handleMarkerSelect}
          onMapPress={handleMapPress}
          mapStyle="satellite"
          style={styles.mapboxView}
        />

        {/* Floating Live ETA Banner directly on map */}
        {activeTrackingEta && (
          <TouchableOpacity
            style={styles.floatingEtaCard}
            activeOpacity={0.9}
            onPress={() => {
              const v = markers.find((m) => m.type === 'rescue_unit');
              if (v) {
                mapRef.current?.flyTo(v.latitude, v.longitude, 16);
                mapRef.current?.openMarkerPopup?.(v.id);
              }
            }}
          >
            <View style={styles.etaHeaderLeft}>
              <View style={styles.etaPulseDot} />
              <Truck size={17} color="#2563EB" strokeWidth={2.4} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.etaTitle} numberOfLines={1}>
                  {activeTrackingEta.plateNumber ? `Xe ${activeTrackingEta.plateNumber}` : 'Xe Cứu Hộ'}
                  {activeTrackingEta.unitTypeName ? ` • ${activeTrackingEta.unitTypeName}` : ''}
                </Text>
                <Text style={styles.etaSub} numberOfLines={1}>
                  {activeTrackingEta.status === 'OnScene'
                    ? 'Đã tới hiện trường'
                    : activeTrackingEta.stationName
                      ? `Từ: ${activeTrackingEta.stationName}`
                      : 'Đang di chuyển tới vị trí của bạn'}
                </Text>
              </View>
            </View>
            <View style={styles.etaBadgeRight}>
              <Text style={styles.etaBadgeLabel}>DỰ KIẾN TỚI</Text>
              <Text style={styles.etaTime}>~{activeTrackingEta.etaMinutes} phút</Text>
              {typeof activeTrackingEta.distanceKm === 'number' && (
                <Text style={styles.etaDistance}>{activeTrackingEta.distanceKm.toFixed(1)} km</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Floating Zoom & Recenter Controls Stack */}
        <View style={styles.mapControlsWrapper}>
          {/* Zoom In & Out Stack */}
          <View style={styles.zoomControlCard}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomIn()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Phóng to bản đồ"
            >
              <Plus size={18} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.zoomDivider} />

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomOut()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Thu nhỏ bản đồ"
            >
              <Minus size={18} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Small Floating Recenter Icon */}
          <TouchableOpacity
            style={styles.floatingRecenterBtn}
            onPress={handleRecenter}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Về vị trí của tôi"
          >
            <Crosshair size={20} color="#DC2626" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flex: 1,
  },
  searchWrapper: {
    marginBottom: 8,
    position: 'relative',
    zIndex: 50,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 8,
    minHeight: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 4,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
    overflow: 'hidden',
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 12,
    color: '#1E293B',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mapboxView: {
    flex: 1,
  },
  mapControlsWrapper: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  zoomControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  floatingRecenterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },

  floatingEtaCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  etaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  etaPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  etaTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  etaSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  etaBadgeRight: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: 78,
  },
  etaBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  etaTime: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  etaDistance: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },

});

