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
  Maximize2,
  Minimize2,
  Layers,
  X,
  Phone,
  Clock,
  Truck,
  Shield,
  AlertTriangle,
  PlusCircle,
  Search,
} from 'lucide-react-native';
import { MapboxView, MapboxViewRef, RouteCoordinate, RoutePathItem } from '../../components/map/MapboxView';
import {
  SosConfirmModal,
  SosSuccessModal,
  OutOfServiceAreaModal,
  SupplementModal,
  SosCameraModal,
  SosCameraCaptureResult,
  PendingAudioDraft,
} from '../../components/citizen';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';
import { incidentService, ServiceAreaDto } from '../../services/incident.service';
import { mobileTrackingHub, mobileIncidentHub, MobileHubEvents } from '../../services/signalr.service';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { mediaService } from '../../services/media.service';
import { storage } from '../../services/storage';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/useLocationStore';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { IncidentResponseDto } from '../../types/incident';
import { requireSosAuth } from '../../utils/sosAuth';

export const SafetyMapScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapboxViewRef>(null);
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const trackingIncidentId = route.params?.trackingIncidentId;
  const focusPublicAlertId = route.params?.focusPublicAlertId;
  const isViewingDuplicateHistory = Boolean(route.params?.asDuplicateReporter);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'dark'>('satellite');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  const toggleFullscreenMap = () => {
    const next = !isFullscreenMap;
    setIsFullscreenMap(next);
    navigation.setParams({ fullscreenMap: next });
  };
  const lastVehicleCoordsRef = useRef<Map<string, { lat: number; lng: number; heading: number }>>(new Map());

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
  const [isSosCameraVisible, setIsSosCameraVisible] = useState(false);
  const [isSosConfirmModalVisible, setIsSosConfirmModalVisible] = useState(false);
  const [isSosSuccessModalVisible, setIsSosSuccessModalVisible] = useState(false);
  const [activeReportedIncident, setActiveReportedIncident] = useState<IncidentResponseDto | null>(null);
  const [pendingSosAsset, setPendingSosAsset] = useState<any | null>(null);
  const [pendingSosAudio, setPendingSosAudio] = useState<PendingAudioDraft | null>(null);
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
  const [routePaths, setRoutePaths] = useState<RoutePathItem[]>([]);
  const [trackedIncidentIds, setTrackedIncidentIds] = useState<string[]>([]);
  const [selectedSosId, setSelectedSosId] = useState<string | null>(null);
  const [isApproximateRoute, setIsApproximateRoute] = useState(false);
  const routeCacheRef = useRef<
    Map<string, { originLat: number; originLng: number; destLat: number; destLng: number; points: RouteCoordinate[]; isApproximate: boolean }>
  >(new Map());
  const hasActiveTrackingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTrackingEta, setActiveTrackingEta] = useState<{
    incidentId: string;
    incidentCode?: string;
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
  const [pendingIncident, setPendingIncident] = useState<{
    incidentId: string;
    incidentCode?: string;
    title?: string;
    status: string;
  } | null>(null);
  const [supplementIncidentId, setSupplementIncidentId] = useState<string | null>(null);

  // Manual location search & map pick state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; latitude: number; longitude: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCenteredIncidentIdRef = useRef<string | null>(null);

  // Reset centered incident tracker when tracking target changes
  useEffect(() => {
    lastCenteredIncidentIdRef.current = null;
  }, [trackingIncidentId]);

  // Synchronize search input with store address initially and on GPS refresh
  useEffect(() => {
    if (currentAddress && currentAddress !== 'Đang xác định vị trí...') {
      setSearchQuery(currentAddress);
    }
  }, [currentAddress]);

  // Load real user GPS & real incidents, rescue units, stations from backend
  const loadMapData = async (isSilent = false, overrideTrackingId?: string | null) => {
    if (!isSilent) setIsRefreshing(true);
    const activeTrackingTargetId =
      overrideTrackingId !== undefined ? (overrideTrackingId || undefined) : trackingIncidentId;
    try {
      // 1. Shared GPS location (chạy song song, không chặn các API sự cố / vùng phục vụ)
      void refreshLocation();

      // 2. Load incidents from local device cache + API
      const localCachedIncidents = (await storage.getItem<any[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];
      let incidentList: Array<{
        id: string;
        code?: string;
        title?: string;
        description?: string;
        locationAddress?: string;
        latitude?: number;
        longitude?: number;
        severity?: any;
        status?: any;
        category?: string;
        eventType?: string;
        reportedEventType?: string;
        aiClassification?: { eventType?: string | null; incidentType?: string | null } | null;
        mediaUrls?: string[];
        mediaItems?: Array<{ mediaUrl: string; mediaType?: string }>;
      }> = [];

      // Helper: check completed or cancelled status
      const cancelledIds = (await storage.getItem<string[]>('CANCELLED_INCIDENT_IDS')) || [];
      const isCompletedOrCancelled = (id?: string, s?: any) => {
        if (id && cancelledIds.includes(id)) return true;
        const str = String(s || '').toLowerCase();
        return (
          str.includes('cancel') ||
          str.includes('complet') ||
          str.includes('resolv') ||
          str.includes('closed') ||
          str.includes('hủy') ||
          str.includes('link') ||
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
                code: a.incidentCode,
                title: a.incidentTitle || (currentLang === 'en' ? 'Dispatched Incident' : 'Sự Cố Đang Điều Phối'),
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
              const cacheById = new Map(localCachedIncidents.map((c: any) => [c.id, c]));
              incidentList = res.items.map((i: any) => {
                const cached = cacheById.get(i.id);
                return {
                  id: i.id,
                  code: i.code,
                  title: i.title,
                  description: i.description,
                  locationAddress: i.locationAddress,
                  latitude: i.latitude ?? cached?.latitude,
                  longitude: i.longitude ?? cached?.longitude,
                  severity: i.severity,
                  status: i.status,
                  eventType: i.eventType ?? cached?.eventType,
                  reportedEventType: i.reportedEventType ?? cached?.reportedEventType,
                  aiClassification: i.aiClassification ?? cached?.aiClassification,
                  mediaUrls: i.mediaUrls ?? cached?.mediaUrls,
                  mediaItems: cached?.mediaItems,
                };
              });

              // Thêm cả sự cố gốc của các báo cáo đã gom/xác nhận trùng nếu còn hoạt động (hỗ trợ xem 2+ SOS cùng lúc)
              const existingIds = new Set(incidentList.map((x) => x.id));
              for (const i of res.items as any[]) {
                const parentId = i.linkedToIncidentId;
                const parentClosed = isCompletedOrCancelled(parentId, i.linkedToIncidentStatus);
                const isDupLink =
                  i.status === 'Linked' ||
                  (i.status === 'Cancelled' && /trùng|duplicate/i.test(i.cancellationReason || ''));
                if (parentId && isDupLink && !parentClosed && !existingIds.has(parentId)) {
                  existingIds.add(parentId);
                  incidentList.push({
                    id: parentId,
                    code: i.linkedToIncidentCode,
                    title: i.linkedToIncidentTitle || i.title,
                    locationAddress: i.linkedToIncidentAddress || i.locationAddress,
                    status: i.linkedToIncidentStatus || 'Verified',
                    reportedEventType: i.reportedEventType,
                    mediaUrls: i.mediaUrls,
                  });
                }
              }

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
            if (!isCompletedOrCancelled(cached.id, cached.status)) {
              incidentList.push({
                id: cached.id,
                code: cached.code,
                title: cached.title,
                description: cached.description,
                locationAddress: cached.locationAddress,
                latitude: cached.latitude,
                longitude: cached.longitude,
                severity: cached.severity,
                status: cached.status,
                eventType: cached.eventType,
                reportedEventType: cached.reportedEventType,
                aiClassification: cached.aiClassification,
                mediaUrls: cached.mediaUrls,
                mediaItems: cached.mediaItems,
              });
            }
          }
        }
      }

      let activeIncidents = incidentList.filter((inc) => !isCompletedOrCancelled(inc.id, inc.status));

      // If a specific incident was requested from MyReports, prioritize it first (nếu vẫn còn active)
      if (activeTrackingTargetId) {
        if (isCompletedOrCancelled(activeTrackingTargetId)) {
          navigation.setParams({ trackingIncidentId: undefined });
        } else {
          const matchIdx = activeIncidents.findIndex((i) => i.id === activeTrackingTargetId);
          if (matchIdx > 0) {
            const [targeted] = activeIncidents.splice(matchIdx, 1);
            activeIncidents.unshift(targeted);
          } else if (matchIdx === -1) {
            activeIncidents.unshift({ id: activeTrackingTargetId } as any);
          }
        }
      }

      // 3. Fetch tracking for ALL active incident(s) & units to get real-time vehicle locations & multi-routes
      const calculatedRoutes: RoutePathItem[] = [];
      const ROUTE_COLORS = ['#0284C7', '#7C3AED', '#059669', '#EA580C'];
      const trackedVehicles: MapMarkerItem[] = [];
      let latestEtaInfo: {
        incidentId: string;
        incidentCode?: string;
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
      let pendingIncidentInfo: {
        incidentId: string;
        incidentCode?: string;
        title?: string;
        status: string;
      } | null = null;

      for (let incIdx = 0; incIdx < Math.min(activeIncidents.length, 6); incIdx++) {
        const inc = activeIncidents[incIdx];
        const routeColor = ROUTE_COLORS[incIdx % ROUTE_COLORS.length];
        try {
          const tracking = await incidentService.getTracking(inc.id);
          if (tracking) {
            if (isCompletedOrCancelled(inc.id, tracking.incidentStatus)) {
              inc.status = 'Cancelled';
              continue;
            }

            // Backfill incident coordinates, code & status if missing from getMyReports
            if (tracking.incidentStatus) {
              inc.status = tracking.incidentStatus as any;
            }
            if (tracking.incidentCode && !inc.code) {
              inc.code = tracking.incidentCode;
            }
            if (tracking.dispatchStatus) {
              (inc as any)._dispatchStage = tracking.dispatchStatus;
            }
            if ((!inc.latitude || !inc.longitude) && tracking.incidentLat && tracking.incidentLng) {
              inc.latitude = tracking.incidentLat;
              inc.longitude = tracking.incidentLng;
            }
            if (tracking.incidentTitle && !inc.title) {
              inc.title = tracking.incidentTitle;
            }

            const rawUnits =
              Array.isArray(tracking.units) && tracking.units.length > 0
                ? tracking.units
                : tracking.rescueUnitId || (tracking.vehicleLat && tracking.vehicleLng && tracking.plateNumber)
                  ? [
                      {
                        assignmentId: `primary-${inc.id}`,
                        rescueUnitId: tracking.rescueUnitId || `veh-${inc.id}`,
                        plateNumber: tracking.plateNumber,
                        unitTypeName: tracking.unitTypeName,
                        stationName: tracking.stationName,
                        stationPhoneNumber: tracking.stationPhoneNumber,
                        vehicleLat: tracking.vehicleLat || 0,
                        vehicleLng: tracking.vehicleLng || 0,
                        routeTrajectory: tracking.routeTrajectory || [],
                        isApproximateRoute: tracking.isApproximateRoute,
                        distanceKm: tracking.distanceKm || 0,
                        estimatedArrivalMinutes: tracking.estimatedArrivalMinutes || 5,
                        dispatchStatus: tracking.dispatchStatus,
                      },
                    ]
                  : [];

            const activeUnits = rawUnits.filter(
              (u) =>
                u.dispatchStatus &&
                u.dispatchStatus !== 'PendingDispatch' &&
                u.dispatchStatus !== 'Cancelled' &&
                u.dispatchStatus !== 'Completed'
            );

            const isDispatched =
              inc.status === 'Dispatched' || inc.status === 'InProgress' || activeUnits.length > 0;

            if (isDispatched && activeUnits.length > 0) {
              for (const unit of activeUnits) {
                const vehKey = unit.rescueUnitId || `veh-${inc.id}`;
                const etaMins = unit.estimatedArrivalMinutes || tracking.estimatedArrivalMinutes || 5;
                const distKm = unit.distanceKm ?? tracking.distanceKm;
                const uLat = unit.vehicleLat;
                const uLng = unit.vehicleLng;

                if (uLat && uLng) {
                  const prevCoord = lastVehicleCoordsRef.current.get(vehKey);
                  let heading = prevCoord?.heading ?? 0;
                  if (prevCoord && Math.hypot(uLat - prevCoord.lat, uLng - prevCoord.lng) > 0.00002) {
                    const toRad = (d: number) => (d * Math.PI) / 180;
                    const dLon = toRad(uLng - prevCoord.lng);
                    const y = Math.sin(dLon) * Math.cos(toRad(uLat));
                    const x =
                      Math.cos(toRad(prevCoord.lat)) * Math.sin(toRad(uLat)) -
                      Math.sin(toRad(prevCoord.lat)) * Math.cos(toRad(uLat)) * Math.cos(dLon);
                    heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
                  }
                  lastVehicleCoordsRef.current.set(vehKey, { lat: uLat, lng: uLng, heading });

                  const vehStatusMap: Record<string, string> =
                    currentLang === 'en'
                      ? {
                          EnRoute: 'En Route',
                          Dispatched: 'Dispatched',
                          Accepted: 'Accepted',
                          OnScene: 'On Scene',
                          Completed: 'Completed',
                        }
                      : {
                          EnRoute: 'Đang di chuyển',
                          Dispatched: 'Đang điều phối',
                          Accepted: 'Đã nhận lệnh',
                          OnScene: 'Tại hiện trường',
                          Completed: 'Hoàn thành',
                        };
                  const rawVehStatus = unit.dispatchStatus || 'EnRoute';
                  const vehStatusText = vehStatusMap[rawVehStatus] || rawVehStatus;
                  trackedVehicles.push({
                    id: vehKey,
                    title: `${unit.plateNumber || tracking.plateNumber || (currentLang === 'en' ? 'Rescue Unit' : 'Xe cứu hộ')} (${unit.unitTypeName || tracking.unitTypeName || (currentLang === 'en' ? 'Responding' : 'Đang phản ứng')})`,
                    description:
                      currentLang === 'en'
                        ? `Station: ${unit.stationName || tracking.stationName || 'Rescue'} • Status: ${vehStatusText} • ETA: ~${etaMins} min`
                        : `Trạm: ${unit.stationName || tracking.stationName || 'Cứu hộ'} • Trạng thái: ${vehStatusText} • Dự kiến: ~${etaMins} phút`,
                    latitude: uLat,
                    longitude: uLng,
                    type: 'rescue_unit',
                    unitType: unit.unitTypeName || tracking.unitTypeName || 'rescue',
                    status: rawVehStatus,
                    plateNumber: unit.plateNumber || tracking.plateNumber,
                    phoneNumber: unit.stationPhoneNumber || tracking.stationPhoneNumber,
                    etaMinutes: etaMins,
                    distanceKm: distKm,
                    heading,
                  });
                }

                // Route trajectory cho từng xe (hỗ trợ nhiều xe / nhiều SOS cùng lúc)
                if (unit.routeTrajectory && unit.routeTrajectory.length > 1 && !unit.isApproximateRoute) {
                  calculatedRoutes.push({
                    id: `${vehKey}-${inc.id}`,
                    incidentId: inc.id,
                    coordinates: unit.routeTrajectory,
                    isApproximate: false,
                    color: routeColor,
                  });
                } else if (
                  uLat &&
                  uLng &&
                  inc.latitude &&
                  inc.longitude &&
                  (Math.abs(uLat - inc.latitude) >= 0.0002 || Math.abs(uLng - inc.longitude) >= 0.0002)
                ) {
                  const cacheKey = `${vehKey}-${inc.id}`;
                  const cachedRoad = routeCacheRef.current.get(cacheKey);
                  const movedFar =
                    !cachedRoad ||
                    Math.hypot(uLat - cachedRoad.originLat, uLng - cachedRoad.originLng) > 0.0008 ||
                    Math.hypot(inc.latitude - cachedRoad.destLat, inc.longitude - cachedRoad.destLng) > 0.0002;
                  if (!movedFar && cachedRoad) {
                    calculatedRoutes.push({
                      id: cacheKey,
                      incidentId: inc.id,
                      coordinates: cachedRoad.points,
                      isApproximate: cachedRoad.isApproximate,
                      color: routeColor,
                    });
                  } else {
                    const road = await mapboxService.getRouteWithDetails(
                      { latitude: uLat, longitude: uLng },
                      { latitude: inc.latitude, longitude: inc.longitude }
                    );
                    if (!road.isApproximate && road.points.length > 1) {
                      routeCacheRef.current.set(cacheKey, {
                        originLat: uLat,
                        originLng: uLng,
                        destLat: inc.latitude,
                        destLng: inc.longitude,
                        points: road.points,
                        isApproximate: false,
                      });
                      calculatedRoutes.push({
                        id: cacheKey,
                        incidentId: inc.id,
                        coordinates: road.points,
                        isApproximate: false,
                        color: routeColor,
                      });
                    }
                  }
                }
              }

              const primaryUnit = activeUnits[0];
              if (!latestEtaInfo || inc.id === activeTrackingTargetId) {
                latestEtaInfo = {
                  incidentId: inc.id,
                  incidentCode: tracking.incidentCode || inc.code,
                  incidentTitle: inc.title || tracking.incidentTitle,
                  rescueUnitId: primaryUnit.rescueUnitId || tracking.rescueUnitId,
                  plateNumber: primaryUnit.plateNumber || tracking.plateNumber,
                  unitTypeName: primaryUnit.unitTypeName || tracking.unitTypeName,
                  stationName: primaryUnit.stationName || tracking.stationName,
                  status: primaryUnit.dispatchStatus || tracking.dispatchStatus,
                  etaMinutes: primaryUnit.estimatedArrivalMinutes || tracking.estimatedArrivalMinutes || 5,
                  distanceKm: primaryUnit.distanceKm ?? tracking.distanceKm,
                  isApproximate: Boolean(primaryUnit.isApproximateRoute ?? tracking.isApproximateRoute),
                };
              }
            } else if (!pendingIncidentInfo) {
              pendingIncidentInfo = {
                incidentId: inc.id,
                incidentCode: inc.code || tracking.incidentCode,
                title: inc.title || tracking.incidentTitle || (currentLang === 'en' ? 'Awaiting Dispatch' : 'Sự Cố Đang Chờ Điều Phối'),
                status: inc.status || 'Pending',
              };
            }
          }
        } catch {
          if (!pendingIncidentInfo && !isCompletedOrCancelled(inc.id, inc.status)) {
            pendingIncidentInfo = {
              incidentId: inc.id,
              incidentCode: inc.code,
              title: inc.title || (currentLang === 'en' ? 'Awaiting Dispatch' : 'Sự Cố Đang Chờ Điều Phối'),
              status: inc.status || 'Pending',
            };
          }
        }
      }

      // Backfill coordinates, photo, code, status & eventType from detail API when missing
      const isKnownEv = (v: any) => Boolean(v && v !== 'None' && v !== 'Unknown' && v !== 0);
      for (const inc of activeIncidents) {
        const hasEventType =
          isKnownEv(inc.aiClassification?.eventType) ||
          isKnownEv((inc.aiClassification as any)?.incidentType) ||
          isKnownEv(inc.eventType) ||
          isKnownEv(inc.reportedEventType);
        const hasPhoto = Boolean(
          inc.mediaItems?.some((m) => m.mediaType !== 'Audio' && m.mediaUrl) ||
          inc.mediaUrls?.some((u) => !/\.(mp3|wav|m4a|webm|ogg)$/i.test(u))
        );
        if (!inc.latitude || !inc.longitude || !hasEventType || !inc.code || !hasPhoto) {
          try {
            const detail = await incidentService.getIncidentById(inc.id);
            if (isCompletedOrCancelled(inc.id, detail?.status)) {
              inc.status = 'Cancelled';
              if (inc.id === activeTrackingTargetId) {
                navigation.setParams({ trackingIncidentId: undefined });
              }
              continue;
            }
            if (detail?.status) inc.status = detail.status;
            if (detail?.latitude && detail?.longitude) {
              inc.latitude = detail.latitude;
              inc.longitude = detail.longitude;
            }
            if (detail?.eventType) inc.eventType = detail.eventType;
            if ((detail as any)?.reportedEventType) inc.reportedEventType = (detail as any).reportedEventType;
            if (detail?.aiClassification) inc.aiClassification = detail.aiClassification;
            if (detail?.code) inc.code = detail.code;
            if (detail?.mediaItems) inc.mediaItems = detail.mediaItems;
            if (detail?.severity) inc.severity = detail.severity;
            if (detail?.title) inc.title = detail.title;
            if (detail?.description) inc.description = detail.description;
          } catch {
            // ignore
          }
        }
      }

      activeIncidents = activeIncidents.filter((inc) => !isCompletedOrCancelled(inc.id, inc.status));

      const isCitizenRole = isAuthenticated && user?.role !== 'staff';

      // 4. Load public rescue units, stations, service area, and public citizen incidents
      const [rescueUnitsRes, stationsRes, serviceAreaRes, citizenMapRes] = await Promise.allSettled([
        incidentService.getRescueUnits(),
        incidentService.getStations(),
        incidentService.getServiceArea(),
        isCitizenRole ? incidentService.getCitizenMapIncidents() : Promise.resolve([]),
      ]);

      if (serviceAreaRes.status === 'fulfilled' && serviceAreaRes.value) {
        setServiceArea(serviceAreaRes.value);
      }

      const stationList = stationsRes.status === 'fulfilled' ? stationsRes.value || [] : [];
      const activeStationName = (latestEtaInfo?.stationName || '').toLowerCase();
      const stationMarkers: MapMarkerItem[] = stationList
        .filter((s) => s.latitude && s.longitude)
        .map((s) => ({
          id: s.id,
          title: s.name,
          description:
            currentLang === 'en'
              ? `${s.address} • ${s.activeUnitsCount || 0}/${s.totalUnitsCount || 0} units on standby`
              : `${s.address} • ${s.activeUnitsCount || 0}/${s.totalUnitsCount || 0} xe trực chiến`,
          latitude: s.latitude,
          longitude: s.longitude,
          type: 'station',
          phoneNumber: s.phoneNumber,
          isMine: Boolean(activeStationName && s.name?.toLowerCase().includes(activeStationName)),
        }));

      const unitList = rescueUnitsRes.status === 'fulfilled' ? rescueUnitsRes.value || [] : [];
      const publicActiveUnits = unitList.filter(
        (u) =>
          u.currentLat &&
          u.currentLng &&
          (u.status === 'Dispatched' || u.status === 'OnScene' || u.status === 'EnRoute' || u.status === 'Accepted')
      );

      const publicUnitMarkers: MapMarkerItem[] = publicActiveUnits.map((u) => {
        const pubStatus =
          currentLang === 'en'
            ? u.status === 'Dispatched' || u.status === 'EnRoute' || u.status === 'Accepted'
              ? 'Dispatched / En Route'
              : u.status === 'OnScene'
                ? 'On Scene'
                : u.status
            : u.status === 'Dispatched'
              ? 'Đang điều phối'
              : u.status === 'OnScene'
                ? 'Tại hiện trường'
                : u.status;
        return {
          id: u.id,
          title: `${u.plateNumber || (currentLang === 'en' ? 'Rescue Unit' : 'Xe cứu hộ')} (${u.unitTypeName || u.unitType || (currentLang === 'en' ? 'Rescue' : 'Cứu hộ')})`,
          description:
            currentLang === 'en'
              ? `Station: ${u.stationName || 'Station'} • Status: ${pubStatus}`
              : `Thuộc: ${u.stationName || 'Trạm'} • Trạng thái: ${pubStatus}`,
          latitude: u.currentLat,
          longitude: u.currentLng,
          type: 'rescue_unit',
          unitType: u.unitType,
          status: u.status,
          plateNumber: u.plateNumber,
        };
      });

      // Merge trackedVehicles and publicUnitMarkers (deduplicating by plateNumber or id)
      const mergedVehiclesMap = new Map<string, MapMarkerItem>();
      publicUnitMarkers.forEach((v) => mergedVehiclesMap.set(v.plateNumber || v.id, v));
      trackedVehicles.forEach((v) => mergedVehiclesMap.set(v.plateNumber || v.id, v));
      const unitMarkers = Array.from(mergedVehiclesMap.values());

      // 5. Build Incident markers
      const isEnMap = currentLang === 'en';
      const statusLabels: Record<string, string> = isEnMap
        ? {
            Pending: 'PENDING',
            AiProcessing: 'PENDING',
            AiProcessed: 'PENDING',
            Verified: 'VERIFIED',
            Dispatched: 'RESCUE IN PROGRESS',
            InProgress: 'RESCUE IN PROGRESS',
            Completed: 'COMPLETED',
            Cancelled: 'CANCELLED',
          }
        : {
            Pending: 'CHỜ XỬ LÝ',
            AiProcessing: 'CHỜ XỬ LÝ',
            AiProcessed: 'CHỜ XỬ LÝ',
            Verified: 'ĐÃ XÁC MINH',
            Dispatched: 'ĐANG CỨU HỘ',
            InProgress: 'ĐANG CỨU HỘ',
            Completed: 'ĐÃ HOÀN THÀNH',
            Cancelled: 'ĐÃ HỦY',
          };
      const incidentMarkers: MapMarkerItem[] = activeIncidents
        .filter((inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && inc.latitude !== 0 && inc.longitude !== 0)
        .map((inc) => {
          const title = inc.title || '';
          const desc = inc.description || '';
          const fullText = `${title} ${desc}`;
          const evType: any = isKnownEv(inc.eventType)
            ? inc.eventType
            : isKnownEv(inc.aiClassification?.eventType)
              ? inc.aiClassification?.eventType
              : inc.reportedEventType;
          const aiType: any = (inc.aiClassification as any)?.incidentType;
          const isAccident =
            evType === 'TrafficAccident' ||
            inc.aiClassification?.eventType === 'TrafficAccident' ||
            evType === 2 ||
            aiType === 'accident' ||
            /tai nạn|accident|va chạm|ô tô|xe máy|giao thông/i.test(fullText) ||
            inc.category === 'accident';
          const isFire =
            evType === 'FireExplosion' ||
            inc.aiClassification?.eventType === 'FireExplosion' ||
            evType === 1 ||
            aiType === 'fire' ||
            /cháy|hỏa hoạn|nổ|khói|fire|explosion/i.test(fullText) ||
            inc.category === 'fire';
          const resolvedCategory = isAccident
            ? 'accident'
            : isFire
              ? 'fire'
              : evType === 'Other' || inc.aiClassification?.eventType === 'Other' || evType === 3 || inc.category === 'other'
                ? 'other'
                : 'unknown';
          const displayTitle =
            resolvedCategory === 'fire'
              ? (isEnMap ? 'Fire & Explosion' : 'Hỏa hoạn & Cháy nổ')
              : resolvedCategory === 'accident'
                ? (isEnMap ? 'Traffic Accident' : 'Tai nạn giao thông')
                : resolvedCategory === 'other'
                  ? (isEnMap ? 'Area Incident' : 'Sự cố khu vực')
                  : title && !/tín hiệu|sos/i.test(title)
                    ? title
                    : (isEnMap ? 'SOS Signal' : 'Tín hiệu SOS');
          const firstImageUrl =
            inc.mediaItems?.find((m) => m.mediaType !== 'Audio')?.mediaUrl ||
            inc.mediaUrls?.find((u) => !/\.(mp3|wav|m4a|webm|ogg)$/i.test(u));
          return {
            id: inc.id,
            title: displayTitle,
            description: inc.locationAddress || (isEnMap ? 'Incident scene' : 'Hiện trường'),
            latitude: inc.latitude!,
            longitude: inc.longitude!,
            type: 'incident',
            category: resolvedCategory,
            severity: inc.severity,
            status: inc.status,
            code: inc.code,
            imageUrl: firstImageUrl,
            statusLabel:
              (inc as any)._dispatchStage === 'OnScene'
                ? (isEnMap ? 'ON SCENE' : 'ĐÃ ĐẾN HIỆN TRƯỜNG')
                : (inc.status && statusLabels[inc.status]) || inc.status || (isEnMap ? 'PENDING' : 'CHỜ XỬ LÝ'),
          };
        });

      const ownIncidentIds = new Set(activeIncidents.map((i) => i.id));
      const publicIncidentList = citizenMapRes.status === 'fulfilled' ? citizenMapRes.value || [] : [];
      const publicIncidentMarkers: MapMarkerItem[] = publicIncidentList
        .filter(
          (item) =>
            !ownIncidentIds.has(item.id) &&
            typeof item.latitude === 'number' &&
            typeof item.longitude === 'number'
        )
        .map((item) => {
          const ev: any = item.eventType;
          const pCat =
            ev === 'TrafficAccident' || ev === 2
              ? 'accident'
              : ev === 'FireExplosion' || ev === 1
                ? 'fire'
                : ev && ev !== 'None' && ev !== 'Unknown' && ev !== 0
                  ? 'other'
                  : 'unknown';
          const rawMsg = item.message || item.area || '';
          const areaClean = item.area || rawMsg.replace(/^(?:An incident has been reported at|Có sự cố tại)\s+/i, '').replace(/\.$/, '');
          const displayMsg =
            currentLang === 'en'
              ? (/^Có sự cố tại /i.test(rawMsg) ? `An incident has been reported at ${areaClean}.` : (rawMsg || 'Public incident alert'))
              : (/^An incident has been reported at /i.test(rawMsg) ? `Có sự cố tại ${areaClean}.` : (rawMsg || 'Cảnh báo sự cố'));
          return {
            id: item.id,
            title: displayMsg,
            description: `📍 ${item.area}`,
            latitude: item.latitude,
            longitude: item.longitude,
            type: 'public_incident',
            category: pCat,
            severity: item.severity,
            status: item.status,
          };
        });

      hasActiveTrackingRef.current = Boolean(latestEtaInfo);
      setTrackedIncidentIds(activeIncidents.map((x) => x.id));
      setMarkers([...stationMarkers, ...unitMarkers, ...incidentMarkers, ...publicIncidentMarkers]);
      setRoutePaths(calculatedRoutes);
      setRouteCoordinates(calculatedRoutes[0]?.coordinates || []);
      setIsApproximateRoute(Boolean(calculatedRoutes[0]?.isApproximate));
      setActiveTrackingEta(latestEtaInfo);
      setPendingIncident(pendingIncidentInfo);

      // Tự bay đến sự cố/xe mới 1 lần cho mỗi mã sự cố; không tự kéo lại khi đang zoom
      const primaryFocusId = activeTrackingTargetId || incidentMarkers[0]?.id || null;
      if (primaryFocusId && lastCenteredIncidentIdRef.current !== primaryFocusId) {
        if (activeTrackingTargetId) {
          const targetVehicle =
            trackedVehicles.find((v) => v.id.includes(activeTrackingTargetId) || v.id === `veh-${activeTrackingTargetId}`) ||
            trackedVehicles[0] ||
            unitMarkers[0];

          if (targetVehicle) {
            lastCenteredIncidentIdRef.current = primaryFocusId;
            mapRef.current?.flyTo(targetVehicle.latitude, targetVehicle.longitude, 16, true);
            mapRef.current?.openMarkerPopup?.(targetVehicle.id);
          } else if (incidentMarkers.length > 0) {
            lastCenteredIncidentIdRef.current = primaryFocusId;
            const targetInc = incidentMarkers.find((i) => i.id === activeTrackingTargetId) || incidentMarkers[0];
            mapRef.current?.flyTo(targetInc.latitude, targetInc.longitude, 16, true);
            mapRef.current?.openMarkerPopup?.(targetInc.id);
          }
        } else if (incidentMarkers.length > 0) {
          lastCenteredIncidentIdRef.current = primaryFocusId;
          mapRef.current?.flyTo(incidentMarkers[0].latitude, incidentMarkers[0].longitude, 15, true);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  };

  // Periodic background refresh (3s when tracking live incident, 8s otherwise) — không restart timer khi activeTrackingEta đổi
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleNext = () => {
      if (!alive) return;
      const intervalMs = trackingIncidentId || hasActiveTrackingRef.current ? 3000 : 8000;
      timer = setTimeout(async () => {
        await loadMapData(true);
        scheduleNext();
      }, intervalMs);
    };
    loadMapData(false).then(scheduleNext);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, user?.role, trackingIncidentId, currentLang]);

  useFocusEffect(
    React.useCallback(() => {
      loadMapData(true);
    }, [isAuthenticated, user?.role, trackingIncidentId, currentLang])
  );

  // SignalR WebSocket real-time vehicle movement for ALL active/tracked citizen incidents
  const subIncidentIds = Array.from(
    new Set([
      ...(trackingIncidentId ? [trackingIncidentId] : []),
      ...trackedIncidentIds,
      ...(activeTrackingEta?.incidentId ? [activeTrackingEta.incidentId] : []),
      ...(pendingIncident?.incidentId ? [pendingIncident.incidentId] : []),
    ])
  );
  const subIdsKey = subIncidentIds.join(',');
  useEffect(() => {
    if (!isAuthenticated || subIncidentIds.length === 0) return;

    let subscribed = false;
    const subscribeAll = async () => {
      try {
        await mobileTrackingHub.start();
        for (const id of subIncidentIds) {
          await mobileTrackingHub.invoke('SubscribeIncident', id);
        }
        subscribed = true;
      } catch {
        // polling fallback stays active
      }
      mobileIncidentHub
        .start()
        .then((ok) => {
          if (ok) {
            subIncidentIds.forEach((id) => {
              mobileIncidentHub.invoke('SubscribeIncident', id).catch(() => { });
            });
          }
        })
        .catch(() => { });
    };
    subscribeAll();

    const unsubReconn = mobileTrackingHub.onReconnected(() => {
      subIncidentIds.forEach((id) => mobileTrackingHub.invoke('SubscribeIncident', id).catch(() => { }));
      loadMapData(true);
    });
    const unsubIncReconn = mobileIncidentHub.onReconnected(() => {
      subIncidentIds.forEach((id) => mobileIncidentHub.invoke('SubscribeIncident', id).catch(() => { }));
      loadMapData(true);
    });

    const subSet = new Set(subIncidentIds.map((id) => id.toLowerCase()));
    const unsubLocation = mobileTrackingHub.on(MobileHubEvents.ReceiveRescueUnitLocation, (msg: any) => {
      if (!msg) return;
      const msgIncId = msg.incidentId || msg.IncidentId;
      if (msgIncId && !subSet.has(String(msgIncId).toLowerCase())) return;

      const unitId = msg.rescueUnitId || msg.RescueUnitId;
      const lat = msg.latitude ?? msg.Latitude;
      const lng = msg.longitude ?? msg.Longitude;
      const rawHeading = msg.headingDegrees ?? msg.HeadingDegrees;
      if (!unitId || typeof lat !== 'number' || typeof lng !== 'number') return;

      const prevCoord = lastVehicleCoordsRef.current.get(unitId);
      const moved = prevCoord && Math.hypot(lat - prevCoord.lat, lng - prevCoord.lng) > 0.00002;
      let heading = typeof rawHeading === 'number' && rawHeading > 0 ? rawHeading : prevCoord?.heading ?? 0;
      if ((typeof rawHeading !== 'number' || rawHeading === 0) && moved && prevCoord) {
        const toRad = (d: number) => (d * Math.PI) / 180;
        const dLon = toRad(lng - prevCoord.lng);
        const y = Math.sin(dLon) * Math.cos(toRad(lat));
        const x =
          Math.cos(toRad(prevCoord.lat)) * Math.sin(toRad(lat)) -
          Math.sin(toRad(prevCoord.lat)) * Math.cos(toRad(lat)) * Math.cos(dLon);
        heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      }
      lastVehicleCoordsRef.current.set(unitId, { lat, lng, heading });

      // Di chuyển tức thì trên Leaflet WebView không cần chờ vòng React re-render
      mapRef.current?.updateMarkerLocation?.(unitId, lat, lng, heading);

      setMarkers((prev) =>
        prev.map((m) =>
          m.id === unitId || (msgIncId && m.id === `veh-${msgIncId}`)
            ? { ...m, latitude: lat, longitude: lng, heading }
            : m
        )
      );
    });

    const unsubAssign = mobileIncidentHub.on(MobileHubEvents.ReceiveAssignmentStatus, (evt: any) => {
      const nextStatus = String(evt?.status || evt?.Status || '').toLowerCase();
      if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        setActiveTrackingEta(null);
      }
      loadMapData(true);
    });
    const unsubIncStatus = mobileIncidentHub.on(MobileHubEvents.ReceiveIncidentStatus, (evt: any) => {
      const nextStatus = String(evt?.status || evt?.Status || '').toLowerCase();
      if (trackingIncidentId && (nextStatus === 'completed' || nextStatus === 'cancelled')) {
        navigation.setParams({ trackingIncidentId: undefined });
      }
      loadMapData(true);
    });
    const unsubIncUpdate = mobileIncidentHub.on(MobileHubEvents.ReceiveIncidentUpdate, () => {
      loadMapData(true);
    });

    return () => {
      if (subscribed) {
        subIncidentIds.forEach((id) => {
          mobileTrackingHub.invoke('UnsubscribeIncident', id).catch(() => { });
          mobileIncidentHub.invoke('UnsubscribeIncident', id).catch(() => { });
        });
      }
      unsubReconn();
      unsubIncReconn();
      unsubLocation();
      unsubAssign();
      unsubIncStatus();
      unsubIncUpdate();
    };
  }, [isAuthenticated, subIdsKey, trackingIncidentId]);

  // Đăng ký nhận thay đổi bản đồ sự cố công khai Citizen qua SignalR
  const lastCitizenMapRevisionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'staff') return;
    let active = true;
    mobileIncidentHub
      .start()
      .then((ok) => {
        if (ok && active) mobileIncidentHub.invoke('SubscribeCitizenMap').catch(() => { });
      })
      .catch(() => { });

    const unsubReconn = mobileIncidentHub.onReconnected(() => {
      mobileIncidentHub.invoke('SubscribeCitizenMap').catch(() => { });
      loadMapData(true);
    });
    const unsubMapChanged = mobileIncidentHub.on(MobileHubEvents.ReceiveCitizenMapChanged, (evt: any) => {
      const rev = evt?.revision;
      if (rev && rev === lastCitizenMapRevisionRef.current) return;
      lastCitizenMapRevisionRef.current = rev || null;
      loadMapData(true);
    });
    const unsubSettingsChanged = mobileIncidentHub.on(MobileHubEvents.ReceiveSettingsChanged, (evt: any) => {
      if (String(evt?.key ?? '').toLowerCase() !== 'servicearea') return;
      incidentService.getServiceArea().then((area) => {
        if (active && area) setServiceArea(area);
      }).catch(() => { });
    });

    return () => {
      active = false;
      unsubReconn();
      unsubMapChanged();
      unsubSettingsChanged();
      mobileIncidentHub.invoke('UnsubscribeCitizenMap').catch(() => { });
    };
  }, [isAuthenticated, user?.role]);

  // Nếu mở bản đồ từ thông báo khu vực Citizen: căn giữa tới marker còn hiệu lực
  useEffect(() => {
    if (!focusPublicAlertId || !isAuthenticated || user?.role === 'staff') return;
    let cancelled = false;
    incidentService.getCitizenMapIncidentByAlert(focusPublicAlertId).then((item) => {
      if (cancelled) return;
      navigation.setParams({ focusPublicAlertId: undefined });
      if (!item) {
        loadMapData(true);
        return;
      }
      loadMapData(true).then(() => {
        if (cancelled) return;
        mapRef.current?.flyTo(item.latitude, item.longitude, 15);
        setTimeout(() => mapRef.current?.openMarkerPopup?.(item.id), 350);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [focusPublicAlertId, isAuthenticated, user?.role]);

  useEffect(() => {
    const tmr = setTimeout(() => mapRef.current?.invalidateSize?.(), 100);
    return () => clearTimeout(tmr);
  }, [isFullscreenMap]);

  const handleMarkerSelect = (marker: MapMarkerItem) => {
    mapRef.current?.flyTo(marker.latitude, marker.longitude, 16, true);
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
        const results = await mapboxService.searchLocation(text.trim(), {
          proximity: userCoords && userCoords.latitude !== 0 ? userCoords : undefined,
        });
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
      // Người dân bấm nút tìm: cho phép fallback sang Nominatim 1 lần duy nhất nếu Mapbox không tìm thấy
      const results = await mapboxService.searchLocationExplicit(query, {
        proximity: userCoords && userCoords.latitude !== 0 ? userCoords : undefined,
      });
      if (results.length > 0) {
        await handleSelectSuggestion(results[0]);
      } else {
        Alert.alert(
          t('common.notification', 'Thông báo'),
          currentLang === 'en' ? 'No matching location found.' : 'Không tìm thấy địa điểm phù hợp'
        );
      }
    } catch {
      Alert.alert(
        t('common.notification', 'Thông báo'),
        currentLang === 'en' ? 'Error searching location.' : 'Lỗi khi tìm kiếm địa điểm'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Map tap handler: deselect SOS route if one is focused, else pick fixed location
  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    if (selectedSosId) {
      setSelectedSosId(null);
      return;
    }
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

  const handleFullReload = async () => {
    setIsRefreshing(true);
    setSuggestions([]);
    Keyboard.dismiss();
    try {
      // 1. Gỡ bỏ target theo dõi sự cố trùng nếu được truyền từ màn khác sang
      if (trackingIncidentId) {
        navigation.setParams({ trackingIncidentId: undefined });
      }

      // 2. Reset vị trí về GPS thực của thiết bị
      setPickedLocation(null);
      const loc = await resetToGps().catch(() => null);
      if (loc?.address) {
        setSearchQuery(loc.address);
      }

      // 3. Reset flag căn giữa để bản đồ tự động bay về sự cố mới / GPS
      lastCenteredIncidentIdRef.current = null;

      // 4. Tải lại toàn bộ dữ liệu từ server, overrideTrackingId = null để không bị gán lại ID cũ
      await loadMapData(false, null);

      // 5. Nếu không có sự cố nào cần theo dõi, bay về tọa độ GPS hiện tại
      if (loc && !lastCenteredIncidentIdRef.current) {
        mapRef.current?.flyTo(loc.latitude, loc.longitude, 16);
      }
    } catch {
      mapRef.current?.recenter();
    } finally {
      setIsRefreshing(false);
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

      const cancelled = (await storage.getItem<string[]>('CANCELLED_INCIDENT_IDS')) || [];
      if (!cancelled.includes(incidentId)) {
        await storage.setItem('CANCELLED_INCIDENT_IDS', [incidentId, ...cancelled]);
      }

      try {
        await incidentService.cancelIncident(
          incidentId,
          currentLang === 'en' ? 'Citizen cancelled SOS alert' : 'Người dân hủy báo động SOS'
        );
      } catch {
        // ignore
      }

      navigation.setParams({ trackingIncidentId: undefined });
      setIsSosSuccessModalVisible(false);
      setActiveReportedIncident(null);
      setActiveTrackingEta(null);
      setPendingIncident(null);
      setRouteCoordinates([]);
      setMarkers((prev) => prev.filter((m) => m.id !== incidentId && !m.id.includes(incidentId)));
      const cooldownKey = user?.id ? `LAST_SOS_REPORTED_AT_${user.id}` : 'LAST_SOS_REPORTED_AT';
      await storage.removeItem(cooldownKey);
      await storage.removeItem('LAST_SOS_REPORTED_AT');
      loadMapData(false);
    } catch {
      setIsSosSuccessModalVisible(false);
    }
  };

  const handleSosAtPickedLocation = async () => {
    if (!requireSosAuth(isAuthenticated, navigation as any, t)) return;
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
      const cooldownKey = user?.id ? `LAST_SOS_REPORTED_AT_${user.id}` : 'LAST_SOS_REPORTED_AT';
      const last = await storage.getItem<number>(cooldownKey);
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

      setIsSosCameraVisible(true);
    } catch {
      setIsSosConfirmModalVisible(true);
    }
  };

  const handleCameraCaptured = (result: SosCameraCaptureResult) => {
    setIsSosCameraVisible(false);
    if (result.photoAsset) {
      setPendingSosAsset(result.photoAsset);
    }
    if (result.audioUri) {
      setPendingSosAudio({
        uri: result.audioUri,
        durationSeconds: result.audioDurationSeconds || 1,
        mimeType: result.audioMimeType || 'audio/mp4',
        transcript: result.transcript || pendingSosAudio?.transcript || '',
      });
    }
    setIsSosConfirmModalVisible(true);
  };

  const handleConfirmSosDispatch = async (
    note: string,
    eventType?: 'FireExplosion' | 'TrafficAccident',
    customLocation?: { address: string; latitude: number; longitude: number },
    submittedAudio?: PendingAudioDraft | null
  ) => {
    if (!requireSosAuth(isAuthenticated, navigation as any, t)) return;
    setIsSosConfirmModalVisible(false);
    setIsSendingSos(true);
    try {
      const targetLat = customLocation?.latitude ?? pickedLocation?.latitude ?? userCoords.latitude;
      const targetLng = customLocation?.longitude ?? pickedLocation?.longitude ?? userCoords.longitude;
      const targetAddr = customLocation?.address ?? pickedLocation?.address ?? currentAddress;

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

      const mediaUrls: string[] = [];
      if (pendingSosAsset) {
        const url = await mediaService.uploadMedia(pendingSosAsset);
        if (url) mediaUrls.push(url);
      }

      const activeAudio = submittedAudio ?? pendingSosAudio;
      const audioAttachments = [];
      if (activeAudio?.uri) {
        audioAttachments.push(await mediaService.uploadAudioAttachment(activeAudio));
      }

      const rawPhone = (user?.phone || profile.phoneNumber || '').trim().replace(/[\s.-]/g, '');
      const validPhone = /^(0|\+84)[35789][0-9]{8}$/.test(rawPhone) ? rawPhone : undefined;

      const created = await incidentService.createIncident({
        title: t('sos.emergency_sos_title', 'Báo động SOS Khẩn cấp'),
        description: (note.trim() || t('sos.default_description', 'Người dân chọn vị trí trên bản đồ báo SOS khẩn cấp.')).slice(0, 4000),
        latitude: targetLat,
        longitude: targetLng,
        locationAddress: targetAddr,
        reporterName: user?.name || profile.fullName || (currentLang === 'en' ? 'SOS Citizen' : 'Công dân SOS'),
        reporterPhone: validPhone,
        mediaUrls,
        audioAttachments: audioAttachments.length > 0 ? audioAttachments : undefined,
        reportedEventType: eventType,
      });

      if (created.guestCancellationToken) {
        await storage.setItem('GUEST_CANCEL_TOKEN_' + created.id, created.guestCancellationToken);
      }

      setActiveReportedIncident(created);
      await recordIncidentId(created.id, { ...created, reportedEventType: eventType } as any);
      const cooldownKey = user?.id ? `LAST_SOS_REPORTED_AT_${user.id}` : 'LAST_SOS_REPORTED_AT';
      await storage.setItem(cooldownKey, Date.now());
      setPendingSosAsset(null);
      setPendingSosAudio(null);
      setIsSosSuccessModalVisible(true);
      loadMapData(true);
    } catch (err: any) {
      Alert.alert(
        currentLang === 'en' ? 'SOS Error' : 'Lỗi gửi SOS',
        err.message || (currentLang === 'en' ? 'Unable to send SOS alert.' : 'Không thể gửi báo động SOS.')
      );
    } finally {
      setIsSendingSos(false);
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={isFullscreenMap ? [] : ['top', 'left', 'right']}
      statusBarStyle="dark-content"
      style={[styles.container, isFullscreenMap && styles.containerFullscreen]}
    >
      {/* 1. Sleek Search & Manual Location Input Bar (ẩn khi phóng to toàn màn hình) */}
      {!isFullscreenMap && (
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <TouchableOpacity
              onPress={handleSearchSubmit}
              disabled={isGeocoding || isSearching}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t('common.search', 'Tìm kiếm')}
            >
              {isGeocoding || isSearching ? (
                <ActivityIndicator size="small" color="#DC2626" style={styles.searchIcon} />
              ) : (
                <Search size={18} color="#DC2626" style={styles.searchIcon} />
              )}
            </TouchableOpacity>

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
              onPress={handleFullReload}
              disabled={isRefreshing}
              activeOpacity={0.7}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <RefreshCw size={16} color="#0F172A" />
              )}
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
      )}

      {/* 2. Interactive Mapbox View with In-Map Floating Controls */}
      <View style={[styles.mapContainer, isFullscreenMap && styles.mapContainerFullscreen]}>
        <MapboxView
          ref={mapRef}
          userLatitude={userCoords.latitude}
          userLongitude={userCoords.longitude}
          markers={markers}
          routeCoordinates={routeCoordinates}
          routes={
            selectedSosId && routePaths.some((r) => r.incidentId === selectedSosId)
              ? routePaths.filter((r) => r.incidentId === selectedSosId)
              : routePaths
          }
          isApproximateRoute={isApproximateRoute}
          serviceArea={serviceArea}
          pickedLocation={pickedLocation}
          language={currentLang}
          onMarkerPress={handleMarkerSelect}
          onMapPress={handleMapPress}
          onPopupOpen={(markerId) => {
            const m = markers.find((x) => x.id === markerId);
            setSelectedSosId(m?.type === 'incident' ? markerId : null);
          }}
          onPopupClose={() => setSelectedSosId(null)}
          mapStyle={mapStyle}
          style={[styles.mapboxView, isFullscreenMap && { borderRadius: 0 }]}
        />

        {/* Floating KCN Service Area Badge (ẩn khi phóng to toàn màn hình) */}
        {!isFullscreenMap && serviceArea && (
          <TouchableOpacity
            style={styles.serviceAreaPill}
            onPress={() => mapRef.current?.flyTo(serviceArea.centerLat, serviceArea.centerLng, 14)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={
              currentLang === 'en'
                ? `Service area: ${serviceArea.name || 'SHTP'}. Radius ${serviceArea.radiusKm} km`
                : `Khu vực KCN: ${serviceArea.name || 'SHTP'}. Bán kính ${serviceArea.radiusKm} km`
            }
          >
            <Shield size={13} color="#DC2626" />
            <Text style={styles.serviceAreaPillText} numberOfLines={1}>
              {serviceArea.boundaryGeoJson
                ? serviceArea.name || t('map.service_area_badge', 'Khu vực phục vụ')
                : t('map.kcn_radius_badge', 'Bán kính KCN ({{radius}} km)', { radius: serviceArea.radiusKm })}
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

        {/* Floating Live ETA Banner directly on map (CHỈ hiện khi đã có xe điều phối) */}
        {activeTrackingEta ? (
          <View style={[styles.floatingEtaCard, isFullscreenMap && { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.etaMainRow}
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
                    {activeTrackingEta.plateNumber
                      ? (currentLang === 'en' ? `Unit ${activeTrackingEta.plateNumber}` : `Xe ${activeTrackingEta.plateNumber}`)
                      : (currentLang === 'en' ? 'Rescue Vehicle' : 'Xe Cứu Hộ')}
                    {activeTrackingEta.unitTypeName ? ` • ${activeTrackingEta.unitTypeName}` : ''}
                  </Text>
                  <Text style={styles.etaSub} numberOfLines={1}>
                    {activeTrackingEta.status === 'OnScene'
                      ? (currentLang === 'en' ? 'Arrived on scene' : 'Đã tới hiện trường')
                      : activeTrackingEta.stationName
                        ? (currentLang === 'en' ? `From: ${activeTrackingEta.stationName}` : `Từ: ${activeTrackingEta.stationName}`)
                        : (currentLang === 'en' ? 'En route to your location' : 'Đang di chuyển tới vị trí của bạn')}
                  </Text>
                </View>
              </View>
              <View style={styles.etaBadgeRight}>
                <Text style={styles.etaBadgeLabel}>{currentLang === 'en' ? 'ETA' : 'DỰ KIẾN TỚI'}</Text>
                <Text style={styles.etaTime}>~{activeTrackingEta.etaMinutes} {currentLang === 'en' ? 'min' : 'phút'}</Text>
                {typeof activeTrackingEta.distanceKm === 'number' && (
                  <Text style={styles.etaDistance}>{activeTrackingEta.distanceKm.toFixed(1)} km</Text>
                )}
              </View>
            </TouchableOpacity>

            {!isViewingDuplicateHistory && (
              <TouchableOpacity
                style={styles.etaSupplementRow}
                activeOpacity={0.8}
                onPress={() => setSupplementIncidentId(activeTrackingEta.incidentId)}
              >
                <PlusCircle size={13} color="#0284C7" />
                <Text style={styles.etaSupplementText}>
                  {currentLang === 'en' ? 'Add scene details' : 'Bổ sung thông tin hiện trường'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : pendingIncident ? (
          <View style={styles.floatingEtaCard}>
            <View style={styles.etaMainRow}>
              <View style={styles.etaHeaderLeft}>
                <ActivityIndicator size="small" color="#D97706" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.etaTitle} numberOfLines={1}>
                    {pendingIncident.title || (currentLang === 'en' ? 'SOS Emergency Signal' : 'Tín hiệu cứu nạn SOS')}
                  </Text>
                  <Text style={[styles.etaSub, { color: '#B45309' }]} numberOfLines={1}>
                    {currentLang === 'en' ? 'Received • Waiting for dispatcher to assign unit' : 'Đang tiếp nhận • Chờ điều phối viên giao xe cứu hộ'}
                  </Text>
                </View>
              </View>
              <View style={[styles.etaBadgeRight, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Text style={[styles.etaBadgeLabel, { color: '#92400E' }]}>{currentLang === 'en' ? 'STATUS' : 'TRẠNG THÁI'}</Text>
                <Text style={[styles.etaTime, { color: '#B45309', fontSize: 13 }]}>{currentLang === 'en' ? 'PENDING' : 'CHỜ TIẾP NHẬN'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.etaSupplementRow}
              activeOpacity={0.8}
              onPress={() => setSupplementIncidentId(pendingIncident.incidentId)}
            >
              <PlusCircle size={13} color="#0284C7" />
              <Text style={styles.etaSupplementText}>
                {currentLang === 'en' ? 'Add scene details' : 'Bổ sung thông tin hiện trường'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Floating Layer Picker, Fullscreen, Zoom & Recenter Controls Stack */}
        <View style={[styles.mapControlsWrapper, isFullscreenMap && { bottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.layerControlAnchor}>
            {isLayerMenuOpen && (
              <View style={styles.layerPopover}>
                {(
                  [
                    { id: 'satellite', label: currentLang === 'en' ? 'Satellite' : 'Vệ tinh' },
                    { id: 'streets', label: currentLang === 'en' ? 'Streets' : 'Đường phố' },
                    { id: 'dark', label: currentLang === 'en' ? 'CAD Dark' : 'CAD Tối' },
                  ] as const
                ).map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.layerPopoverItem,
                      mapStyle === mode.id && styles.layerPopoverItemActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setMapStyle(mode.id);
                      setIsLayerMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.layerPopoverText,
                        mapStyle === mode.id && styles.layerPopoverTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.floatingRecenterBtn,
                isLayerMenuOpen && { backgroundColor: '#DC2626', borderColor: '#DC2626' },
              ]}
              onPress={() => setIsLayerMenuOpen((v) => !v)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={currentLang === 'en' ? 'Select map layer' : 'Chọn lớp bản đồ'}
            >
              <Layers size={18} color={isLayerMenuOpen ? '#FFFFFF' : '#0F172A'} strokeWidth={2.3} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.floatingRecenterBtn}
            onPress={toggleFullscreenMap}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={
              currentLang === 'en'
                ? (isFullscreenMap ? 'Exit fullscreen map' : 'Fullscreen map')
                : (isFullscreenMap ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ')
            }
          >
            {isFullscreenMap ? (
              <Minimize2 size={18} color="#0F172A" strokeWidth={2.4} />
            ) : (
              <Maximize2 size={18} color="#0F172A" strokeWidth={2.4} />
            )}
          </TouchableOpacity>

          {/* Zoom In & Out Stack */}
          <View style={styles.zoomControlCard}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomIn()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={currentLang === 'en' ? 'Zoom in' : 'Phóng to bản đồ'}
            >
              <Plus size={18} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.zoomDivider} />

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomOut()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={currentLang === 'en' ? 'Zoom out' : 'Thu nhỏ bản đồ'}
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
            accessibilityLabel={currentLang === 'en' ? 'Recenter to my location' : 'Về vị trí của tôi'}
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

      {/* SOS Camera Modal with Auto Audio Recording */}
      <SosCameraModal
        visible={isSosCameraVisible}
        onClose={() => {
          setIsSosCameraVisible(false);
          if (pendingSosAsset || pendingSosAudio) {
            setIsSosConfirmModalVisible(true);
          }
        }}
        onCaptured={handleCameraCaptured}
      />

      {/* SOS Confirm Modal */}
      <SosConfirmModal
        visible={isSosConfirmModalVisible}
        onClose={() => {
          setIsSosConfirmModalVisible(false);
          setPendingSosAsset(null);
          setPendingSosAudio(null);
        }}
        photoUri={pendingSosAsset?.uri}
        audioDraft={pendingSosAudio}
        onChangeAudioDraft={setPendingSosAudio}
        address={pickedLocation ? pickedLocation.address : currentAddress}
        initialCoords={
          pickedLocation
            ? { latitude: pickedLocation.latitude, longitude: pickedLocation.longitude }
            : userCoords && userCoords.latitude !== 0
              ? userCoords
              : null
        }
        onConfirm={handleConfirmSosDispatch}
        onRetakePhoto={() => {
          setIsSosConfirmModalVisible(false);
          setIsSosCameraVisible(true);
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
        onUnlink={async () => {
          loadMapData(true);
        }}
        onTrackOriginal={(origId) => {
          navigation.setParams({ trackingIncidentId: origId });
          loadMapData(true);
        }}
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

      {/* Supplement Modal */}
      {supplementIncidentId && (
        <SupplementModal
          visible={Boolean(supplementIncidentId)}
          onClose={() => setSupplementIncidentId(null)}
          incidentId={supplementIncidentId}
          incidentCode={
            supplementIncidentId === activeTrackingEta?.incidentId
              ? activeTrackingEta.incidentCode
              : pendingIncident?.incidentCode
          }
        />
      )}
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
  containerFullscreen: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
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
  mapContainerFullscreen: {
    borderRadius: 0,
    borderWidth: 0,
    marginTop: 0,
  },
  layerControlAnchor: {
    position: 'relative',
    alignItems: 'center',
  },
  layerPopover: {
    position: 'absolute',
    right: 50,
    top: -4,
    width: 132,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 5,
    gap: 3,
    zIndex: 40,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
  layerPopoverItem: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  layerPopoverItemActive: {
    backgroundColor: '#DC2626',
  },
  layerPopoverText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  layerPopoverTextActive: {
    color: '#FFFFFF',
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
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 40,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  etaMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  etaSupplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  etaSupplementText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
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

