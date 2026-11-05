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
  Shield,
  AlertTriangle,
} from 'lucide-react-native';
import { MapboxView, MapboxViewRef, RouteCoordinate } from '../../components/map/MapboxView';
import {
  SosConfirmModal,
  SosSuccessModal,
  OutOfServiceAreaModal,
} from '../../components/citizen';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';
import { incidentService, ServiceAreaDto } from '../../services/incident.service';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { mediaService } from '../../services/media.service';
import { storage } from '../../services/storage';
import { useRoute } from '@react-navigation/native';
import { useLocationStore } from '../../store/useLocationStore';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { IncidentResponseDto } from '../../types/incident';

export const SafetyMapScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const mapRef = useRef<MapboxViewRef>(null);
  const route = useRoute<any>();
  const trackingIncidentId = route.params?.trackingIncidentId;

  const {
    coords: userCoords,
    address: currentAddress,
    isCustomLocation,
    refreshLocation,
    setLocation,
    resetToGps,
  } = useLocationStore();

  const { isAuthenticated, user } = useAppStore();
  const { profile } = useProfileStore();

  const [serviceArea, setServiceArea] = useState<ServiceAreaDto | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    isOutside?: boolean;
    distanceOutsideKm?: number;
  } | null>(null);

  // SOS direct reporting state from map
  const [isSosConfirmModalVisible, setIsSosConfirmModalVisible] = useState(false);
  const [isSosSuccessModalVisible, setIsSosSuccessModalVisible] = useState(false);
  const [activeReportedIncident, setActiveReportedIncident] = useState<IncidentResponseDto | null>(null);
  const [pendingSosAsset, setPendingSosAsset] = useState<any | null>(null);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [outOfAreaInfo, setOutOfAreaInfo] = useState<{
    visible: boolean;
    areaName?: string | null;
    radiusKm?: number;
    distanceOutsideKm?: number;
    latitude?: number;
    longitude?: number;
  }>({ visible: false });

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

      // Helper: check completed or cancelled status
      const isCompletedOrCancelled = (s?: any) => {
        const str = String(s || '').toLowerCase();
        return (
          str.includes('cancel') ||
          str.includes('complet') ||
          str.includes('resolv') ||
          str.includes('closed') ||
          str.includes('hủy') ||
          str === '6' || // IncidentStatus.Completed
          str === '7'    // IncidentStatus.Cancelled
        );
      };

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

              // Sync local storage: remove items deleted on server
              const activeServerIds = new Set(res.items.map((i: any) => i.id));
              const updatedCache = localCachedIncidents.filter((c: any) => activeServerIds.has(c.id));
              await storage.setItem('MY_REPORTED_INCIDENTS_CACHE', updatedCache);
            }
          } catch {
            // ignore
          }
        } else {
          // Guest mode: only load non-cancelled cached items
          for (const cached of localCachedIncidents) {
            if (!isCompletedOrCancelled(cached.status)) {
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
            }
          }
        }
      }

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
                description: `Trạm: ${tracking.stationName || 'Cứu hộ'} • Trạng thái: ${tracking.dispatchStatus || 'Đang di chuyển'
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

      // 4. Load public rescue units, stations, and service area configuration
      const [rescueUnitsRes, stationsRes, serviceAreaRes] = await Promise.allSettled([
        incidentService.getRescueUnits(),
        incidentService.getStations(),
        incidentService.getServiceArea(),
      ]);

      if (serviceAreaRes.status === 'fulfilled' && serviceAreaRes.value) {
        setServiceArea(serviceAreaRes.value);
      }

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
        description: `Thuộc: ${u.stationName || 'Trạm'} • Trạng thái: ${u.status === 'Dispatched' ? 'Đang điều phối' : u.status === 'OnScene' ? 'Tại hiện trường' : u.status
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

  // Periodic background refresh (2.5s when tracking live incident, 8s otherwise)
  useEffect(() => {
    loadMapData(false);
    const intervalMs = (trackingIncidentId || activeTrackingEta) ? 2500 : 8000;
    const timer = setInterval(() => {
      loadMapData(true);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role, trackingIncidentId, Boolean(activeTrackingEta)]);

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

  const handleSelectSuggestion = async (item: { name: string; latitude: number; longitude: number }) => {
    setSuggestions([]);
    setSearchQuery(item.name);
    const areaCheck = await incidentService.checkOutsideServiceArea(item.latitude, item.longitude);
    setPickedLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.name,
      isOutside: areaCheck.isOutside,
      distanceOutsideKm: areaCheck.distanceOutsideKm,
    });
    setLocation(item.latitude, item.longitude, item.name, true);
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
          const areaCheck = await incidentService.checkOutsideServiceArea(lat, lng);
          setPickedLocation({
            latitude: lat,
            longitude: lng,
            address: addr,
            isOutside: areaCheck.isOutside,
            distanceOutsideKm: areaCheck.distanceOutsideKm,
          });
          setLocation(lat, lng, addr, true);
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
        await handleSelectSuggestion(results[0]);
      } else {
        Alert.alert(t('common.notification', 'Thông báo'), 'Không tìm thấy địa điểm phù hợp');
      }
    } catch {
      Alert.alert(t('common.notification', 'Thông báo'), 'Lỗi khi tìm kiếm địa điểm');
    } finally {
      setIsSearching(false);
    }
  };

  // Map tap handler: pick fixed location by tapping directly on the map
  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setSuggestions([]);
    Keyboard.dismiss();
    setIsGeocoding(true);
    try {
      const addr = await mapboxService.reverseGeocode(coords.latitude, coords.longitude);
      const displayAddress = addr || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      const areaCheck = await incidentService.checkOutsideServiceArea(coords.latitude, coords.longitude);

      setPickedLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: displayAddress,
        isOutside: areaCheck.isOutside,
        distanceOutsideKm: areaCheck.distanceOutsideKm,
      });

      setLocation(coords.latitude, coords.longitude, displayAddress, true);
      setSearchQuery(displayAddress);
    } catch {
      // ignore
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleRecenter = async () => {
    setSuggestions([]);
    setPickedLocation(null);
    Keyboard.dismiss();
    try {
      const loc = await resetToGps();
      setSearchQuery(loc.address);
      mapRef.current?.flyTo(loc.latitude, loc.longitude, 16);
    } catch {
      mapRef.current?.recenter();
    }
  };

  const recordIncidentId = async (id: string, incident?: IncidentResponseDto) => {
    try {
      const existing = (await storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS')) || [];
      if (!existing.includes(id)) {
        await storage.setItem('MY_REPORTED_INCIDENT_IDS', [id, ...existing]);
      }
      if (incident) {
        const cached = (await storage.getItem<IncidentResponseDto[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];
        await storage.setItem('MY_REPORTED_INCIDENTS_CACHE', [incident, ...cached.filter((x) => x.id !== id)]);
      }
    } catch {
      // ignore
    }
  };

  const handleCancelIncident = async (incidentId: string) => {
    try {
      const existing = (await storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS')) || [];
      await storage.setItem('MY_REPORTED_INCIDENT_IDS', existing.filter((id) => id !== incidentId));
      const cached = (await storage.getItem<any[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];
      await storage.setItem('MY_REPORTED_INCIDENTS_CACHE', cached.filter((x: any) => x.id !== incidentId));
      try {
        await incidentService.cancelIncident(incidentId, 'Người dân hủy báo động SOS');
      } catch {
        // ignore
      }
      setIsSosSuccessModalVisible(false);
      setActiveReportedIncident(null);
      loadMapData(false);
    } catch {
      setIsSosSuccessModalVisible(false);
    }
  };

  const handleSosAtPickedLocation = async () => {
    const targetLat = pickedLocation?.latitude ?? userCoords.latitude;
    const targetLng = pickedLocation?.longitude ?? userCoords.longitude;

    try {
      const areaCheck = await incidentService.checkOutsideServiceArea(targetLat, targetLng);
      if (areaCheck.isOutside) {
        setOutOfAreaInfo({
          visible: true,
          areaName: areaCheck.area?.name,
          radiusKm: areaCheck.area?.radiusKm,
          distanceOutsideKm: areaCheck.distanceOutsideKm,
          latitude: targetLat,
          longitude: targetLng,
        });
        return;
      }

      // Check cooldown
      const last = await storage.getItem<number>('LAST_SOS_REPORTED_AT');
      if (last && Date.now() - Number(last) < 180000) {
        const remaining = Math.ceil((180000 - (Date.now() - Number(last))) / 1000);
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        Alert.alert(
          t('map.cooldown_wait_title', 'Vui Lòng Chờ'),
          t('map.cooldown_wait_desc', 'Bạn vừa gửi một yêu cầu cứu hộ. Vui lòng chờ {{min}}:{{sec}} trước khi gửi lại.', {
            min: m,
            sec: s < 10 ? `0${s}` : s,
          })
        );
        return;
      }

      const asset = await mediaService.pickFromCamera();
      if (asset) setPendingSosAsset(asset);
      setIsSosConfirmModalVisible(true);
    } catch {
      setIsSosConfirmModalVisible(true);
    }
  };

  const handleConfirmSosDispatch = async (note: string) => {
    setIsSosConfirmModalVisible(false);
    setIsSendingSos(true);
    try {
      const targetLat = pickedLocation?.latitude ?? userCoords.latitude;
      const targetLng = pickedLocation?.longitude ?? userCoords.longitude;
      const targetAddr = pickedLocation?.address ?? currentAddress;

      const areaCheck = await incidentService.checkOutsideServiceArea(targetLat, targetLng);
      if (areaCheck.isOutside) {
        setIsSendingSos(false);
        setOutOfAreaInfo({
          visible: true,
          areaName: areaCheck.area?.name,
          radiusKm: areaCheck.area?.radiusKm,
          distanceOutsideKm: areaCheck.distanceOutsideKm,
          latitude: targetLat,
          longitude: targetLng,
        });
        return;
      }

      let mediaUrls: string[] = [];
      if (pendingSosAsset) {
        const url = await mediaService.uploadMedia(pendingSosAsset);
        if (url) mediaUrls.push(url);
      }

      const created = await incidentService.createIncident({
        title: t('sos.emergency_sos_title', 'Báo động SOS Khẩn cấp'),
        description: note.trim() || t('sos.default_description', 'Người dân chọn vị trí trên bản đồ báo SOS khẩn cấp.'),
        latitude: targetLat,
        longitude: targetLng,
        locationAddress: targetAddr,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls,
      });

      setActiveReportedIncident(created);
      await recordIncidentId(created.id, created);
      await storage.setItem('LAST_SOS_REPORTED_AT', Date.now());
      setPendingSosAsset(null);
      setIsSosSuccessModalVisible(true);
      loadMapData(true);
    } catch (err: any) {
      Alert.alert('Lỗi gửi SOS', err.message || 'Không thể gửi báo động SOS.');
    } finally {
      setIsSendingSos(false);
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
          serviceArea={serviceArea}
          pickedLocation={pickedLocation}
          language={currentLang}
          onMarkerPress={handleMarkerSelect}
          onMapPress={handleMapPress}
          mapStyle="satellite"
          style={styles.mapboxView}
        />

        {/* Floating KCN Service Area Badge */}
        {serviceArea && (
          <TouchableOpacity
            style={styles.serviceAreaPill}
            onPress={() => mapRef.current?.flyTo(serviceArea.centerLat, serviceArea.centerLng, 14)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={`Khu vực KCN: ${serviceArea.name || 'SHTP'}. Bán kính ${serviceArea.radiusKm} km`}
          >
            <Shield size={13} color="#DC2626" />
            <Text style={styles.serviceAreaPillText} numberOfLines={1}>
              {t('map.kcn_radius_badge', 'Bán kính KCN ({{radius}} km)', { radius: serviceArea.radiusKm })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Floating Picked Location Card for SOS */}
        {pickedLocation && (
          <View style={styles.pickedLocationCard}>
            <View style={styles.pickedHeaderRow}>
              <View style={styles.pickedTitleWrapper}>
                <MapPin size={15} color="#DC2626" />
                <Text style={styles.pickedTitleText}>
                  {t('map.picked_location_title', 'Vị Trí Đã Chọn Báo SOS')}
                </Text>
              </View>
              {pickedLocation.isOutside ? (
                <View style={styles.pickedBadgeOutside}>
                  <Text style={styles.pickedBadgeTextOutside}>
                    {t('map.outside_kcn_badge', '⚠️ Ngoài KCN (~{{distance}} km)', {
                      distance: pickedLocation.distanceOutsideKm?.toFixed(1) || '1.0',
                    })}
                  </Text>
                </View>
              ) : (
                <View style={styles.pickedBadgeInside}>
                  <Text style={styles.pickedBadgeTextInside}>
                    {t('map.inside_kcn_badge', '✅ Trong phạm vi KCN')}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.pickedAddressText} numberOfLines={2}>
              {pickedLocation.address}
            </Text>

            <View style={styles.pickedActionRow}>
              <TouchableOpacity
                style={styles.clearPickedBtn}
                onPress={() => {
                  setPickedLocation(null);
                  resetToGps();
                  if (currentAddress) setSearchQuery(currentAddress);
                }}
                activeOpacity={0.7}
              >
                <X size={15} color="#64748B" />
                <Text style={styles.clearPickedBtnText}>{t('map.unpin_btn', 'Bỏ ghim')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosAtLocationBtn}
                onPress={handleSosAtPickedLocation}
                activeOpacity={0.8}
              >
                <AlertTriangle size={15} color="#FFFFFF" />
                <Text style={styles.sosAtLocationBtnText}>{t('map.sos_here_btn', 'Báo SOS Tại Đây')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      {/* Fullscreen Emergency Loading Overlay */}
      {isSendingSos && (
        <View style={styles.emergencyLoadingOverlay}>
          <View style={styles.emergencyLoadingCard}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.emergencyLoadingTitle}>
              {t('map.sos_loading_title', 'ĐANG KÍCH HOẠT CỨU HỘ SOS')}
            </Text>
            <Text style={styles.emergencyLoadingText}>
              {t('map.sos_loading_text', 'Đang gửi toạ độ đã chọn tới trung tâm điều phối...')}
            </Text>
          </View>
        </View>
      )}

      {/* SOS Confirm Modal */}
      <SosConfirmModal
        visible={isSosConfirmModalVisible}
        onClose={() => {
          setIsSosConfirmModalVisible(false);
          setPendingSosAsset(null);
        }}
        photoUri={pendingSosAsset?.uri}
        address={pickedLocation ? pickedLocation.address : currentAddress}
        onConfirm={handleConfirmSosDispatch}
        onRetakePhoto={async () => {
          const asset = await mediaService.pickFromCamera();
          if (asset) setPendingSosAsset(asset);
        }}
        onPickLibrary={async () => {
          const asset = await mediaService.pickFromLibrary();
          if (asset) setPendingSosAsset(asset);
        }}
        onRemovePhoto={() => setPendingSosAsset(null)}
      />

      {/* SOS Success Modal */}
      <SosSuccessModal
        visible={isSosSuccessModalVisible}
        onClose={() => {
          setIsSosSuccessModalVisible(false);
          if (activeReportedIncident) {
            mapRef.current?.flyTo(activeReportedIncident.latitude, activeReportedIncident.longitude, 16);
            mapRef.current?.openMarkerPopup?.(activeReportedIncident.id);
          }
          setActiveReportedIncident(null);
        }}
        onCancelIncident={handleCancelIncident}
        address={pickedLocation ? pickedLocation.address : currentAddress}
        incident={activeReportedIncident}
      />

      {/* Out of Service Area Modal */}
      <OutOfServiceAreaModal
        visible={outOfAreaInfo.visible}
        onClose={() => setOutOfAreaInfo((prev) => ({ ...prev, visible: false }))}
        areaName={outOfAreaInfo.areaName}
        radiusKm={outOfAreaInfo.radiusKm}
        distanceOutsideKm={outOfAreaInfo.distanceOutsideKm}
        latitude={outOfAreaInfo.latitude}
        longitude={outOfAreaInfo.longitude}
      />
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
  serviceAreaPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  serviceAreaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  pickedLocationCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 30,
  },
  pickedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pickedTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickedTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  pickedBadgeInside: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pickedBadgeTextInside: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  pickedBadgeOutside: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pickedBadgeTextOutside: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  pickedAddressText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 17,
    marginBottom: 10,
  },
  pickedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearPickedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  clearPickedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  sosAtLocationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sosAtLocationBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emergencyLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  emergencyLoadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 280,
  },
  emergencyLoadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emergencyLoadingText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});

