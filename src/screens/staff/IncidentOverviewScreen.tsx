import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  PhoneCall,
  Radio,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Minimize2,
  ChevronUp,
  Flame,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Navigation as NavigationIcon,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { MissionStepper } from '../../components/dispatch/MissionStepper';
import { IncidentTacticalMap } from '../../components/dispatch/IncidentTacticalMap';
import { IncidentDetailCard } from '../../components/dispatch/IncidentDetailCard';
import { SwipeToAction } from '../../components/dispatch/SwipeToAction';
import { StaffClosureReportModal } from '../../components/staff/StaffClosureReportModal';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { useAppStore } from '../../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmergencyIncident,
  MissionStage,
  ResolveAssignmentPayload,
  mapBackendStatusToStage,
  mapAssignmentToIncident,
} from '../../types/dispatch';
import { RoutePoint, mapboxService, isValidVietnamRoute } from '../../services/mapbox.service';
import { locationService, isCoordinatesInVietnam } from '../../services/location.service';

interface IncidentOverviewScreenProps {
  navigation?: any;
  route?: {
    params?: {
      incident?: EmergencyIncident;
      assignmentId?: string;
    };
  };
}

export const IncidentOverviewScreen: React.FC<IncidentOverviewScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const passedIncident =
    route?.params?.incident && !route.params.incident.id.startsWith('inc-2409')
      ? route.params.incident
      : null;
  const assignmentId = route?.params?.assignmentId || passedIncident?.assignmentId;

  // Active Assignment ID state
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | undefined>(assignmentId);

  // Active Incident Data state (null if no active mission)
  const [activeIncidentData, setActiveIncidentData] = useState<EmergencyIncident | null>(passedIncident);
  const [isLoadingActiveMission, setIsLoadingActiveMission] = useState<boolean>(!passedIncident);

  const [routeTrajectory, setRouteTrajectory] = useState<RoutePoint[]>([]);

  // Mission State Management (4 Stages) - initialized from backend status or AsyncStorage
  const initialStage = passedIncident?.backendStatus
    ? mapBackendStatusToStage(passedIncident.backendStatus)
    : 'accepted';
  const [currentStage, setCurrentStage] = useState<MissionStage>(initialStage);
  const user = useAppStore((s) => s.user);

  // Throttling & Caching references to avoid freezing the UI on tab switch
  const lastCheckTimeRef = useRef<number>(0);
  const hasLoadedInitialRef = useRef<boolean>(!!passedIncident);

  // Check active mission from real backend assignments (fast with in-memory caching)
  const checkActiveMission = useCallback(async (isForced = false) => {
    const now = Date.now();
    // Throttle automatic focus calls: skip if called within last 8 seconds unless forced
    if (!isForced && now - lastCheckTimeRef.current < 8000) {
      return;
    }
    lastCheckTimeRef.current = now;

    // Only show full-screen blocking spinner on very first mount if no cached data exists
    if (!hasLoadedInitialRef.current && !activeIncidentData) {
      setIsLoadingActiveMission(true);
    }

    try {
      const myAssignments = await staffDispatchService.getMyAssignments(isForced);
      const activeAssign = myAssignments.find(
        (a) =>
          a.status === 'Accepted' ||
          a.status === 'EnRoute' ||
          a.status === 'OnScene' ||
          a.status === 'Dispatched'
      );
      if (activeAssign) {
        const mapped = mapAssignmentToIncident(activeAssign);
        setActiveIncidentData(mapped);
        setActiveAssignmentId(activeAssign.id);
        const stage = mapBackendStatusToStage(activeAssign.status);
        setCurrentStage(stage);
        if (mapped.id) {
          AsyncStorage.setItem(`@mission_stage_${mapped.id}`, stage).catch(() => {});
        }
      } else {
        setActiveIncidentData(null);
        setActiveAssignmentId(undefined);
      }
    } catch (err: any) {
      console.warn('Check active mission error:', err?.message);
    } finally {
      hasLoadedInitialRef.current = true;
      setIsLoadingActiveMission(false);
    }
  }, [activeIncidentData]);

  // When focused on this tab, verify if there is an active mission (throttled & non-blocking)
  useFocusEffect(
    useCallback(() => {
      const paramInc = route?.params?.incident;
      if (!paramInc || paramInc.id.startsWith('inc-2409')) {
        checkActiveMission(false);
      }
    }, [route?.params?.incident, checkActiveMission])
  );

  // 0. Persistent Step Recovery: Load locally stored stage for this incident immediately
  useEffect(() => {
    const targetIncidentId = activeIncidentData?.id;
    if (!targetIncidentId || targetIncidentId.startsWith('inc-2409')) return;

    AsyncStorage.getItem(`@mission_stage_${targetIncidentId}`)
      .then((savedStage) => {
        if (
          savedStage &&
          ['accepted', 'en_route', 'on_scene', 'completed'].includes(savedStage)
        ) {
          setCurrentStage(savedStage as MissionStage);
        }
      })
      .catch(() => {});
  }, [activeIncidentData?.id]);

  // Sync state if navigation route params change
  useEffect(() => {
    const routeIncident = route?.params?.incident;
    if (routeIncident && !routeIncident.id.startsWith('inc-2409')) {
      setActiveIncidentData((prev) => ({
        ...(prev || routeIncident),
        ...routeIncident,
      }));
      if (routeIncident.assignmentId) {
        setActiveAssignmentId(routeIncident.assignmentId);
      }
      if (routeIncident.backendStatus) {
        const mapped = mapBackendStatusToStage(routeIncident.backendStatus);
        setCurrentStage(mapped);
      }
      setIsLoadingActiveMission(false);
    }
    if (route?.params?.assignmentId) {
      setActiveAssignmentId(route.params.assignmentId);
    }
  }, [route?.params?.incident, route?.params?.assignmentId]);

  // Cache to avoid refetching same incident details repeatedly
  const lastFetchedDetailsIncidentIdRef = useRef<string | null>(null);

  // Load real backend details in a single parallel batch:
  // GET /api/incidents/{id}, GET /api/dispatch/tracking/incident/{id}, GET /api/dispatch/assignments/incident/{id}
  useEffect(() => {
    const targetIncidentId = activeIncidentData?.id;
    if (!targetIncidentId || targetIncidentId.startsWith('inc-2409')) {
      return;
    }

    // Skip duplicate fetches if this incident was already fetched
    if (lastFetchedDetailsIncidentIdRef.current === targetIncidentId) {
      return;
    }
    lastFetchedDetailsIncidentIdRef.current = targetIncidentId;

    let isMounted = true;

    Promise.allSettled([
      staffDispatchService.getIncidentDetails(targetIncidentId),
      staffDispatchService.getTracking(targetIncidentId),
      staffDispatchService.getAssignmentsByIncident(targetIncidentId),
    ]).then(async ([detailsSettled, trackingSettled, assignmentsSettled]) => {
      if (!isMounted) return;

      const details = detailsSettled.status === 'fulfilled' ? detailsSettled.value : null;
      const tracking = trackingSettled.status === 'fulfilled' ? trackingSettled.value : null;
      const assignments = assignmentsSettled.status === 'fulfilled' ? assignmentsSettled.value : null;

      // 1. Process tracking status & route
      let newTrajectory: RoutePoint[] | null = null;
      let newDistanceKm: number | undefined;
      let newEtaMinutes: number | undefined;

      if (tracking) {
        if (tracking.dispatchStatus) {
          const mappedStage = mapBackendStatusToStage(tracking.dispatchStatus);
          setCurrentStage(mappedStage);
          AsyncStorage.setItem(`@mission_stage_${targetIncidentId}`, mappedStage).catch(() => {});
        }

        const isRouteValid =
          tracking.distanceKm < 150 &&
          isValidVietnamRoute(tracking.routeTrajectory);

        if (isRouteValid && tracking.routeTrajectory && tracking.routeTrajectory.length > 0) {
          newTrajectory = tracking.routeTrajectory;
          newDistanceKm = tracking.distanceKm;
          newEtaMinutes = tracking.estimatedArrivalMinutes;
        }
      }

      // 2. Process assignments (find my assignment ID & stage)
      let foundAssignmentId: string | undefined;
      let cooperating: typeof assignments = [];

      if (assignments && assignments.length > 0) {
        const myAssignment = assignments.find(
          (u) =>
            u.id === activeAssignmentId ||
            u.rescueUnitId === user?.rescueUnitId ||
            u.incidentId === targetIncidentId
        );
        if (myAssignment) {
          foundAssignmentId = myAssignment.id;
          setActiveAssignmentId(myAssignment.id);
          if (myAssignment.status) {
            const stageFromAssignment = mapBackendStatusToStage(myAssignment.status);
            setCurrentStage(stageFromAssignment);
            AsyncStorage.setItem(`@mission_stage_${targetIncidentId}`, stageFromAssignment).catch(() => {});
          }
        }
        cooperating = assignments.filter((u) => u.id !== (myAssignment?.id || activeAssignmentId));
      }

      // If no valid tracking route from backend, use fast local routing
      if (!newTrajectory && (!routeTrajectory || routeTrajectory.length === 0)) {
        try {
          const safeOrigin =
            activeIncidentData &&
            isCoordinatesInVietnam(
              activeIncidentData.originCoords.latitude,
              activeIncidentData.originCoords.longitude
            )
              ? activeIncidentData.originCoords
              : { latitude: 10.8415, longitude: 106.8098, label: 'FPT Station' };
          const safeTarget =
            activeIncidentData &&
            isCoordinatesInVietnam(
              activeIncidentData.targetCoords.latitude,
              activeIncidentData.targetCoords.longitude
            )
              ? activeIncidentData.targetCoords
              : {
                  latitude: 10.845,
                  longitude: 106.814,
                  label: activeIncidentData?.address || 'Hiện trường',
                };
          const localRoute = await mapboxService.getRouteWithDetails(safeOrigin, safeTarget);
          if (isMounted) {
            newTrajectory = localRoute.points;
            newDistanceKm = localRoute.distanceKm;
            newEtaMinutes = localRoute.durationMinutes;
          }
        } catch {
          // ignore
        }
      }

      if (newTrajectory && isMounted) {
        setRouteTrajectory(newTrajectory);
      }

      // 3. Single atomic state update
      setActiveIncidentData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          title: details?.title || prev.title,
          address: details?.locationAddress || prev.address,
          category: details?.eventType || prev.category,
          callerName: details?.reporterName || prev.callerName,
          callerPhone: prev.isPhoneRevealed ? prev.callerPhone : (details?.reporterPhone || prev.callerPhone),
          mediaUrls: details?.mediaUrls || prev.mediaUrls || [],
          operatorNotes: details?.operatorNotes || prev.operatorNotes || '',
          targetCoords: details?.latitude && details?.longitude
            ? {
                latitude: details.latitude,
                longitude: details.longitude,
                label: details.locationAddress || prev.targetCoords.label,
              }
            : prev.targetCoords,
          distanceKm: newDistanceKm ?? prev.distanceKm,
          etaMinutes: newEtaMinutes ?? prev.etaMinutes,
          cooperatingUnits: cooperating && cooperating.length > 0 ? cooperating : prev.cooperatingUnits,
          assignmentId: foundAssignmentId || prev.assignmentId,
        };
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeIncidentData?.id, activeAssignmentId, user?.rescueUnitId]);

  // Periodic location telemetry when en_route or on_scene (every 15s)
  useEffect(() => {
    const unitId = user?.rescueUnitId;
    if (!unitId || (currentStage !== 'en_route' && currentStage !== 'on_scene')) {
      return;
    }

    const sendTelemetry = async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        // Guard against sending any invalid emulator coords outside VN
        if (
          loc.latitude &&
          loc.longitude &&
          unitId &&
          isCoordinatesInVietnam(loc.latitude, loc.longitude)
        ) {
          await staffDispatchService.updateVehicleLocation(
            unitId,
            loc.latitude,
            loc.longitude
          );
        }
      } catch (err: any) {
        console.warn('Vehicle location telemetry error:', err?.message);
      }
    };

    sendTelemetry();
    const interval = setInterval(sendTelemetry, 15000);
    return () => clearInterval(interval);
  }, [user?.rescueUnitId, currentStage]);

  // Interactive View Modes: 'split' (default), 'map_expanded' (full map), 'details_expanded' (full details)
  const [viewMode, setViewMode] = useState<'split' | 'map_expanded' | 'details_expanded'>('split');

  const handleToggleMapExpand = useCallback(() => {
    setViewMode((prev) => (prev === 'map_expanded' ? 'split' : 'map_expanded'));
  }, []);

  const handleToggleExpandDetails = useCallback(() => {
    setViewMode((prev) => (prev === 'details_expanded' ? 'split' : 'details_expanded'));
  }, []);

  // Confirmation Modal states
  const [isCallDispatcherModalVisible, setIsCallDispatcherModalVisible] = useState(false);
  const [isClosureModalVisible, setIsClosureModalVisible] = useState(false);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  // Unmask / Reveal reporter phone with audit trail
  const handleRevealReporterPhone = useCallback(async () => {
    if (!activeIncidentData?.id) return;
    try {
      const phone = await staffDispatchService.revealReporterPhone(activeIncidentData.id);
      setActiveIncidentData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          callerPhone: phone,
          isPhoneRevealed: true,
        };
      });
      Alert.alert(
        'Đã Mở Khóa Số Điện Thoại',
        `Số điện thoại của người báo tin: ${phone}\n(Hành động này đã được ghi nhận vào nhật ký kiểm toán BR-32)`
      );
    } catch (err: any) {
      Alert.alert('Không Thể Mở Khóa', err.message || 'Lỗi khi yêu cầu mở khóa số điện thoại.');
    }
  }, [activeIncidentData?.id]);

  // Quick Dispatcher Hotline Call (using real stationOperator phone if available)
  const handleConfirmCallDispatcher = () => {
    setIsCallDispatcherModalVisible(false);
    const dispatcherPhone = user?.stationOperatorPhone || '112';
    const dispatcherName = user?.stationOperatorName || 'Tổng Đài Điều Phối';
    Linking.openURL(`tel:${dispatcherPhone}`).catch(() => {
      Alert.alert('Đàm Thoại', `Đang kết nối qua kênh đàm thoại điều phối: ${dispatcherName} (${dispatcherPhone})`);
    });
  };

  // Handle Swipe to En Route
  const handleSwipeEnRoute = useCallback(async () => {
    setCurrentStage('en_route');
    if (activeIncidentData?.id) {
      AsyncStorage.setItem(`@mission_stage_${activeIncidentData.id}`, 'en_route').catch(() => {});
    }
    const targetId = activeAssignmentId || assignmentId;
    if (targetId) {
      try {
        await staffDispatchService.updateStatus(targetId, 'EnRoute');
      } catch (err: any) {
        console.warn('Update EnRoute status failed:', err.message);
      }
    }
  }, [activeAssignmentId, assignmentId, activeIncidentData?.id]);

  // Handle Advance Stage
  const handleAdvanceStage = useCallback(
    async (nextStage: MissionStage) => {
      setCurrentStage(nextStage);
      if (activeIncidentData?.id) {
        AsyncStorage.setItem(`@mission_stage_${activeIncidentData.id}`, nextStage).catch(() => {});
      }
      const targetId = activeAssignmentId || assignmentId;

      if (nextStage === 'en_route') {
        if (targetId) {
          try {
            await staffDispatchService.updateStatus(targetId, 'EnRoute');
          } catch (err: any) {
            console.warn('Update EnRoute status failed:', err.message);
          }
        }
      } else if (nextStage === 'on_scene') {
        if (targetId) {
          try {
            await staffDispatchService.updateStatus(targetId, 'OnScene');
          } catch (err: any) {
            console.warn('Update OnScene status failed:', err.message);
          }
        }
      } else if (nextStage === 'completed') {
        setIsClosureModalVisible(true);
      }
    },
    [activeAssignmentId, assignmentId, activeIncidentData?.id]
  );

  // Handle Complete Mission -> Open closure modal
  const handleCompleteMission = useCallback(() => {
    setIsClosureModalVisible(true);
  }, []);

  // Handle Submit Closure Report
  const handleSubmitClosureReport = async (payload: ResolveAssignmentPayload) => {
    const targetId = activeAssignmentId || assignmentId;
    if (targetId) {
      try {
        await staffDispatchService.resolveAssignment(targetId, payload);
      } catch (err: any) {
        console.warn('Resolve assignment failed:', err.message);
      }
    }
    setCurrentStage('completed');
    if (activeIncidentData?.id) {
      AsyncStorage.setItem(`@mission_stage_${activeIncidentData.id}`, 'completed').catch(() => {});
    }
    setIsCompleteModalVisible(true);
  };

  // Handle Back
  const handleGoBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  // 1. Loading State
  if (isLoadingActiveMission) {
    return (
      <ScreenContainer
        backgroundColor="#F8FAFC"
        edges={['top', 'left', 'right', 'bottom']}
        safeArea
        statusBarStyle="dark-content"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang kiểm tra lệnh điều phối tác chiến...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // 2. Empty State (No Active Incident Assigned)
  if (!activeIncidentData) {
    return (
      <ScreenContainer
        backgroundColor="#F8FAFC"
        edges={['top', 'left', 'right', 'bottom']}
        safeArea
        statusBarStyle="dark-content"
      >
        <View style={styles.rootContainer}>
          {/* Top Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <ArrowLeft size={moderateScale(18)} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.standbyBadge}>
              <View style={styles.standbyDot} />
              <Text style={styles.standbyBadgeText} numberOfLines={1}>TRỰC SẴN SÀNG</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.callDispatcherBtn}
              onPress={() => setIsCallDispatcherModalVisible(true)}
            >
              <PhoneCall size={moderateScale(13)} color="#FFFFFF" />
              <Text style={styles.callDispatcherText} numberOfLines={1}>
                Gọi Điều Hành
              </Text>
            </TouchableOpacity>
          </View>

          {/* Empty State Scrollable Body */}
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Visual Icon with soft rings */}
            <View style={styles.emptyIconOuterRing}>
              <View style={styles.emptyIconCircle}>
                <ShieldCheck size={moderateScale(44)} color="#10B981" />
              </View>
            </View>

            <Text style={styles.emptyTitle}>Không Có Sự Cố Cần Xử Lý</Text>
            <Text style={styles.emptySubtitle}>
              Hiện tại không có ca cấp cứu hoặc lệnh điều động nào được giao cho bạn hoặc kíp trực. Hệ thống CAD sẽ tự động phát tín hiệu chuông khẩn cấp và hiển thị bản đồ lộ trình ngay khi có lệnh mới.
            </Text>

            {/* CAD Standby Status Card */}
            <View style={styles.cadStatusBox}>
              <View style={styles.cadStatusHeader}>
                <View style={styles.standbyDot} />
                <Text style={styles.cadStatusHeaderText}>KÍP TRỰC SẴN SÀNG NHẬN LỆNH</Text>
              </View>

              <View style={styles.cadDivider} />

              <View style={styles.cadStatusRow}>
                <Text style={styles.cadStatusLabel}>Đơn vị tác chiến:</Text>
                <Text style={styles.cadStatusValue} numberOfLines={1}>
                  {user?.teamName || user?.name || user?.vehiclePlate || 'Đội cứu hộ cơ động'}
                </Text>
              </View>

              <View style={styles.cadStatusRow}>
                <Text style={styles.cadStatusLabel}>Trạm điều phối:</Text>
                <Text style={styles.cadStatusValue} numberOfLines={1}>
                  {user?.stationName || 'Trung tâm Điều phối Cứu hộ 115'}
                </Text>
              </View>

              <View style={styles.cadStatusRow}>
                <Text style={styles.cadStatusLabel}>Kênh trực ban:</Text>
                <Text style={styles.cadStatusValue} numberOfLines={1}>
                  {user?.stationOperatorPhone
                    ? `${user.stationOperatorName || 'Tổng đài'} (${user.stationOperatorPhone})`
                    : 'Tổng đài 112 / 115'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.emptyActionsContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.emptyRefreshBtn}
                onPress={() => checkActiveMission(true)}
              >
                <RefreshCw size={moderateScale(18)} color="#FFFFFF" />
                <Text style={styles.emptyRefreshBtnText}>Quét & Làm Mới Lệnh Điều Động</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.emptyNavBtn}
                onPress={() => {
                  if (navigation?.navigate) {
                    navigation.navigate('StaffDashboard');
                  } else if (navigation?.canGoBack()) {
                    navigation.goBack();
                  }
                }}
              >
                <Radio size={moderateScale(18)} color="#0284C7" />
                <Text style={styles.emptyNavBtnText}>Về Bảng Điều Khiển Ca Trực</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Hotline Modal for Dispatcher */}
          <ConfirmationModal
            visible={isCallDispatcherModalVisible}
            type="danger"
            title={t('staff.call_dispatcher')}
            description={`Kết nối trực tiếp đến kênh đàm thoại điều phối viên ${
              user?.stationOperatorName || 'Tổng Đài'
            }?`}
            highlightBadge="KÊNH KHẨN CẤP ĐIỀU PHỐI"
            confirmText={t('staff.call_dispatcher')}
            cancelText={t('common.cancel')}
            onConfirm={handleConfirmCallDispatcher}
            onCancel={() => setIsCallDispatcherModalVisible(false)}
          />
        </View>
      </ScreenContainer>
    );
  }

  // 3. Guaranteed non-null incident for active mission rendering
  const incident = activeIncidentData;

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right', 'bottom']}
      safeArea
      statusBarStyle="dark-content"
    >
      <View style={styles.rootContainer}>
        {/* If NOT in full-screen map mode, show standard Top Header & Mission Stepper */}
        {viewMode !== 'map_expanded' && (
          <>
            {/* 1. Header Bar */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <ArrowLeft size={moderateScale(20)} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.incidentCodeBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.incidentCodeText} numberOfLines={1}>
                  {incident.code}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.callDispatcherBtn}
                onPress={() => setIsCallDispatcherModalVisible(true)}
              >
                <PhoneCall size={moderateScale(13)} color="#FFFFFF" />
                <Text
                  style={styles.callDispatcherText}
                  numberOfLines={1}
                >
                  Gọi Điều Hành
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Mission Stepper (4 Stages) */}
            <MissionStepper
              currentStage={currentStage}
              onSelectStage={handleAdvanceStage}
              interactive={true}
            />
          </>
        )}

        {/* 3. Main Workspace */}
        {viewMode === 'map_expanded' ? (
          /* TRUE 100% FULLSCREEN MAP */
          <View style={styles.fullscreenMapWrapper}>
            <IncidentTacticalMap
              currentStage={currentStage}
              incidentAddress={incident.address}
              distanceKm={incident.distanceKm}
              etaMinutes={incident.etaMinutes}
              originCoords={incident.originCoords}
              targetCoords={incident.targetCoords}
              assignedUnit={incident.assignedUnit}
              incidentTitle={incident.title}
              backendRouteTrajectory={routeTrajectory}
              onRecenter={() => {}}
              isMapExpanded={true}
              onToggleMapExpand={handleToggleMapExpand}
            />

            {/* Floating Top Nav Overlay on Fullscreen Map */}
            <View style={styles.fullscreenTopOverlay}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.floatingOverlayCircleBtn}
                onPress={handleGoBack}
              >
                <ArrowLeft size={moderateScale(18)} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.floatingCodePill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.floatingCodeText}>{incident.code}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.floatingExitMapBtn}
                onPress={handleToggleMapExpand}
              >
                <Minimize2 size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.floatingExitMapText}>{t('staff.minimize_map')}</Text>
              </TouchableOpacity>
            </View>

            {/* Ultra-compact Floating Action Dock on Fullscreen Map */}
            <View style={styles.fullscreenCompactDock}>
              {/* Compact Details Chip */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.compactDetailsChip}
                onPress={handleToggleExpandDetails}
                accessible={true}
                accessibilityLabel="Xem chi tiết ca trực"
              >
                <ChevronUp size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.compactDetailsChipText}>{t('staff.details')}</Text>
              </TouchableOpacity>

              {/* Action Area */}
              <View style={styles.compactActionWrap}>
                {currentStage === 'accepted' && (
                  <SwipeToAction
                    onSwipeSuccess={handleSwipeEnRoute}
                    title={t('staff.swipe_en_route')}
                    successTitle={t('staff.en_route_confirmed')}
                    sliderColor="#10B981"
                    activeTrackColor="rgba(16, 185, 129, 0.3)"
                  />
                )}

                {currentStage === 'en_route' && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.compactAdvanceBtnRed}
                    onPress={() => handleAdvanceStage('on_scene')}
                  >
                    <Flame size={moderateScale(15)} color="#FFFFFF" />
                    <Text style={styles.compactAdvanceBtnText}>
                      {t('staff.arrived_on_scene')}
                    </Text>
                    <ArrowRight size={moderateScale(15)} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                {currentStage === 'on_scene' && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.compactAdvanceBtnGreen}
                    onPress={handleCompleteMission}
                  >
                    <ShieldCheck size={moderateScale(15)} color="#FFFFFF" />
                    <Text style={styles.compactAdvanceBtnText}>
                      {t('staff.complete_mission')}
                    </Text>
                    <CheckCircle2 size={moderateScale(14)} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                {currentStage === 'completed' && (
                  <View style={styles.compactCompletedBox}>
                    <CheckCircle2 size={moderateScale(14)} color="#10B981" />
                    <Text style={styles.compactCompletedText}>
                      {t('staff.stage_completed').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* SPLIT OR FULL DETAILS MODE */
          <View style={styles.contentSplitLayout}>
            {/* Map Area */}
            <View
              style={[
                styles.mapAreaContainer,
                viewMode === 'details_expanded' && styles.mapAreaMinimized,
              ]}
            >
              <IncidentTacticalMap
                currentStage={currentStage}
                incidentAddress={incident.address}
                distanceKm={incident.distanceKm}
                etaMinutes={incident.etaMinutes}
                originCoords={incident.originCoords}
                targetCoords={incident.targetCoords}
                assignedUnit={incident.assignedUnit}
                incidentTitle={incident.title}
                backendRouteTrajectory={routeTrajectory}
                onRecenter={() => {}}
                isMapExpanded={false}
                onToggleMapExpand={handleToggleMapExpand}
              />
            </View>

            {/* Detail Bottom Card */}
            <View
              style={[
                styles.bottomCardContainer,
                viewMode === 'details_expanded' && styles.bottomCardExpanded,
              ]}
            >
              <IncidentDetailCard
                incident={incident}
                currentStage={currentStage}
                onSwipeEnRoute={handleSwipeEnRoute}
                onAdvanceStage={handleAdvanceStage}
                onCompleteMission={handleCompleteMission}
                onRevealPhone={handleRevealReporterPhone}
                viewMode={viewMode}
                onToggleExpandDetails={handleToggleExpandDetails}
                onToggleExpandMap={handleToggleMapExpand}
              />
            </View>
          </View>
        )}

        {/* 1. Modal: Call Dispatcher Hotline */}
        <ConfirmationModal
          visible={isCallDispatcherModalVisible}
          type="danger"
          title={t('staff.call_dispatcher')}
          description={`Kết nối thoại trực tiếp đến Tổng đài Điều phối Cứu hộ cho Ca trực ${incident.code}?`}
          highlightBadge="KÊNH KHẨN CẤP ĐIỀU PHỐI"
          confirmText={t('staff.call_dispatcher')}
          cancelText={t('common.cancel')}
          onConfirm={handleConfirmCallDispatcher}
          onCancel={() => setIsCallDispatcherModalVisible(false)}
        />

        {/* 2. Modal: Complete Mission Resolution Report (Required by Backend) */}
        <StaffClosureReportModal
          visible={isClosureModalVisible}
          incidentCode={incident.code}
          onClose={() => setIsClosureModalVisible(false)}
          onSubmitResolve={handleSubmitClosureReport}
        />

        {/* 3. Modal: Complete Mission Success Notification */}
        <ConfirmationModal
          visible={isCompleteModalVisible}
          type="success"
          title="Nghiệm Thu Thành Công"
          description="Báo cáo nghiệm thu ca trực đã được đồng bộ về máy chủ CAD thành công."
          highlightBadge="ĐÃ HOÀN TẤT"
          singleButton
          confirmText="Về Bảng Điều Khiển"
          onConfirm={() => {
            setIsCompleteModalVisible(false);
            if (navigation?.canGoBack()) {
              navigation.goBack();
            }
          }}
          onCancel={() => setIsCompleteModalVisible(false)}
        />
      </View>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: scale(8),
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  incidentCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(20),
    gap: scale(5),
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  livePulseDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#EF4444',
  },
  incidentCodeText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  callDispatcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(10),
    gap: scale(5),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  callDispatcherText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contentSplitLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mapAreaContainer: {
    flex: 56,
  },
  mapAreaMinimized: {
    flex: 16,
  },
  bottomCardContainer: {
    flex: 44,
  },
  bottomCardExpanded: {
    flex: 84,
  },
  fullscreenMapWrapper: {
    flex: 1,
    position: 'relative',
  },
  fullscreenTopOverlay: {
    position: 'absolute',
    top: verticalScale(8),
    left: scale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  floatingOverlayCircleBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: scale(6),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCodeText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  floatingExitMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingExitMapText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
  fullscreenCompactDock: {
    position: 'absolute',
    bottom: verticalScale(50),
    left: scale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    zIndex: 40,
  },
  compactDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: verticalScale(38),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(19),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  compactDetailsChipText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  compactActionWrap: {
    flex: 1,
  },
  compactAdvanceBtnRed: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    gap: scale(6),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compactAdvanceBtnGreen: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    gap: scale(6),
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compactAdvanceBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  compactCompletedBox: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
  },
  compactCompletedText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#059669',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: verticalScale(12),
  },
  loadingText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#64748B',
  },
  standbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(20),
    gap: scale(6),
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  standbyDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#10B981',
  },
  standbyBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.3,
  },
  emptyScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(36),
  },
  emptyIconOuterRing: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconCircle: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(8),
  },
  cadStatusBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: scale(16),
    marginBottom: verticalScale(24),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cadStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  cadStatusHeaderText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  cadDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(12),
  },
  cadStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  cadStatusLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '500',
  },
  cadStatusValue: {
    fontSize: moderateScale(12),
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
  },
  emptyActionsContainer: {
    width: '100%',
    gap: verticalScale(10),
  },
  emptyRefreshBtn: {
    width: '100%',
    height: verticalScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyRefreshBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyNavBtn: {
    width: '100%',
    height: verticalScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  emptyNavBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0284C7',
  },
});
