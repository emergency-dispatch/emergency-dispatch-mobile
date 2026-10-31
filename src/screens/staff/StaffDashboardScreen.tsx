import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ShieldAlert, Zap, Radio, BellRing, Flame, CalendarDays, ChevronRight, CheckCircle2, Navigation } from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal, LanguageSelectorModal } from '../../components/common';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileHeader,
  DutyStatus,
  ShiftMetricsGrid,
  StationMiniMapCard,
  RecentMissionsList,
  QuickActionDock,
  MedicalEquipmentModal,
  MissionDetailModal,
  StaffNotificationsModal,
} from '../../components/staff';
import { EmergencyAlertModal } from '../../components/dispatch/EmergencyAlertModal';
import { MissionItem, DispatchNotification } from '../../types/staff';
import {
  MOCK_EMERGENCY_INCIDENT,
  EmergencyIncident,
  DispatchAssignmentResponseDto,
  RejectAssignmentPayload,
  MyTeamDto,
} from '../../types/dispatch';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { useAppStore } from '../../store/useAppStore';

// Helper to convert DispatchAssignmentResponseDto into EmergencyIncident
const mapAssignmentToIncident = (dto: DispatchAssignmentResponseDto): EmergencyIncident => {
  return {
    id: dto.incidentId || dto.id,
    code: `#${(dto.incidentId || dto.id).slice(0, 8).toUpperCase()}`,
    severity: dto.incidentSeverity === 'Level3' ? 'code_red' : dto.incidentSeverity === 'Level2' ? 'code_orange' : 'code_yellow',
    severityLabel: `MỨC ĐỘ: ${dto.incidentSeverity || 'Level3'}`,
    title: dto.incidentTitle || 'SỰ CỐ KHẨN CẤP ĐƯỢC ĐIỀU PHỐI',
    category: dto.rescueUnitType || 'Cứu hộ khẩn cấp',
    address: dto.incidentAddress || 'Hiện trường sự cố',
    distanceKm: dto.distanceKm ?? 2.4,
    etaMinutes: dto.estimatedArrivalMinutes ?? 5,
    assignedUnit: dto.rescueUnitPlate || 'Xe Cứu Thương ICU',
    vehiclePlate: dto.rescueUnitPlate || '51A-999.99',
    patientCount: 1,
    patientSummary: 'Nạn nhân cần cấp cứu và giải cứu khẩn cấp',
    triageLevel: dto.incidentSeverity === 'Level3' ? 'T1' : 'T2',
    callerName: 'Tổng Đài CAD',
    callerRole: 'Điều Phối Viên',
    callerPhone: '114',
    emergencyNotes: dto.notes || 'Khẩn trương tiếp cận hiện trường và bật còi ưu tiên.',
    requiredEquipment: ['Bình Oxy', 'Kìm cắt thủy lực', 'Bộ nẹp cổ & nẹp chi cố định'],
    recommendedHospital: 'Bệnh viện Cấp Cứu Trưng Vương',
    hospitalDistance: '1.8 km',
    timeoutSeconds: 30,
    originCoords: {
      latitude: 10.7712,
      longitude: 106.6578,
      label: dto.stationName || 'Trạm Cứu Hộ',
    },
    targetCoords: {
      latitude: dto.incidentLatitude ?? 10.7785,
      longitude: dto.incidentLongitude ?? 106.6892,
      label: dto.incidentAddress || 'Hiện trường',
    },
    createdAt: dto.dispatchedAt || new Date().toISOString(),
  };
};

const DEFAULT_FALLBACK_MISSIONS: MissionItem[] = [
  {
    id: 'm1',
    code: '#IP-240901',
    type: 'fire_rescue',
    title: 'Sự cố cháy phân xưởng dệt may & chập điện',
    severity: 'critical',
    address: 'Lô B4, Đường số 3, KCN Tân Bình, P. Tây Thạnh',
    completedAt: '11:20 (35 phút trước)',
    durationMinutes: 28,
    distanceKm: 1.8,
    etaMinutes: 4.5,
    status: 'completed',
    patientCount: 2,
    destinationHospital: 'Trạm Y Tế KCN Tân Bình & BV Đa Khoa Mỹ Đức',
    notes: 'Đã dập tắt đám cháy cục bộ, sơ cứu 2 công nhân ngạt khói và hỗ trợ thở Oxy mask.',
  },
  {
    id: 'm2',
    code: '#IP-240898',
    type: 'other',
    title: 'Rò rỉ khí Amoniac NH3 tại kho lạnh phân xưởng',
    severity: 'urgent',
    address: 'Lô C12, Đường D1, KCN Hiệp Phước, Huyện Nhà Bè',
    completedAt: '09:45 (2 giờ trước)',
    durationMinutes: 34,
    distanceKm: 2.2,
    etaMinutes: 5.0,
    status: 'completed',
    patientCount: 1,
    destinationHospital: 'Trạm Ứng Phó Khẩn Cấp KCN Hiệp Phước',
    notes: 'Kíp cứu hộ mang đồ Hazmat & SCBA khóa thành công van rò rỉ, thông gió phân xưởng.',
  },
];

export const StaffDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAppStore();

  // State
  const { t, i18n } = useTranslation();
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('online');
  const [refreshing, setRefreshing] = useState(false);

  // Backend real data
  const [myTeam, setMyTeam] = useState<MyTeamDto | null>(null);
  const [assignments, setAssignments] = useState<DispatchAssignmentResponseDto[]>([]);
  const [notifications, setNotifications] = useState<DispatchNotification[]>([]);

  // Modals state
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionItem | null>(null);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [isEmergencyAlertVisible, setIsEmergencyAlertVisible] = useState(false);
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [isNavigateStationModalVisible, setIsNavigateStationModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  // Load Real Data from Backend
  const loadStaffData = useCallback(async () => {
    try {
      const [teamRes, assignRes, notifRes] = await Promise.all([
        staffDispatchService.getMyTeam(),
        staffDispatchService.getMyAssignments(),
        staffDispatchService.getNotifications(false, 1, 15),
      ]);

      if (teamRes) {
        setMyTeam(teamRes);
        updateUser({
          stationId: teamRes.stationId,
          stationName: teamRes.stationName,
          rescueUnitId: teamRes.myTeamRescueUnitId || undefined,
          vehiclePlate: teamRes.myTeamRescueUnitPlate || undefined,
          teamName: teamRes.myTeamName || undefined,
          crewRole: teamRes.myCrewRole || undefined,
          stationOperatorPhone: teamRes.stationOperator?.phoneNumber || undefined,
          stationOperatorName: teamRes.stationOperator?.fullName || undefined,
        });
      }

      if (assignRes) {
        setAssignments(assignRes);
      }

      if (notifRes && notifRes.length > 0) {
        const mappedNotifs: DispatchNotification[] = notifRes.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type === 'Escalation' ? 'urgent' : n.type === 'JobAssigned' ? 'urgent' : 'info',
          timestamp: new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isRead: n.isRead,
        }));
        setNotifications(mappedNotifs);
      }
    } catch (err: any) {
      console.warn('Load staff data error:', err?.message);
    }
  }, [updateUser]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStaffData();
    setRefreshing(false);
  }, [loadStaffData]);

  // Derived assignments
  const dispatchedAssignment = assignments.find((a) => a.status === 'Dispatched');
  const activeMissionAssignment = assignments.find(
    (a) => a.status === 'Accepted' || a.status === 'EnRoute' || a.status === 'OnScene'
  );
  const completedAssignments = assignments.filter((a) => a.status === 'Completed');

  // Convert completed assignments to RecentMissions
  const missionsList: MissionItem[] = completedAssignments.map((a) => ({
    id: a.id,
    code: `#${(a.incidentId || a.id).slice(0, 8).toUpperCase()}`,
    type: 'traffic_accident',
    title: a.incidentTitle || 'Nhiệm vụ cứu hộ khẩn cấp',
    severity: a.incidentSeverity === 'Level3' ? 'critical' : 'urgent',
    address: a.incidentAddress || 'Hiện trường',
    completedAt: a.completedAt ? new Date(a.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hoàn thành',
    durationMinutes: 24,
    distanceKm: a.distanceKm ?? 2.1,
    etaMinutes: a.estimatedArrivalMinutes ?? 5,
    status: 'completed',
    patientCount: a.completionReport?.victimsAssistedCount ?? 1,
    destinationHospital: a.completionReport?.handoverEntity || 'Bệnh viện Trưng Vương',
    notes: a.completionReport?.actionsSummary || a.notes || 'Đã bàn giao nạn nhân an toàn.',
  }));

  const activeIncident = dispatchedAssignment
    ? mapAssignmentToIncident(dispatchedAssignment)
    : activeMissionAssignment
    ? mapAssignmentToIncident(activeMissionAssignment)
    : MOCK_EMERGENCY_INCIDENT;

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const isEnglish = !i18n.language?.startsWith('vi');

  // Accept emergency incident -> Call API & Go to IncidentOverviewScreen
  const handleAcceptEmergency = useCallback(
    async (incident: EmergencyIncident) => {
      setIsEmergencyAlertVisible(false);
      const targetId = dispatchedAssignment?.id;
      if (targetId) {
        try {
          await staffDispatchService.updateStatus(targetId, 'Accepted');
        } catch (err: any) {
          console.warn('Accept assignment failed:', err.message);
        }
      }
      navigation.navigate('IncidentOverview', {
        incident,
        assignmentId: targetId,
      });
      loadStaffData();
    },
    [navigation, dispatchedAssignment, loadStaffData]
  );

  // Decline emergency incident -> Call API with required reason payload
  const handleDeclineEmergency = useCallback(
    async (payload?: RejectAssignmentPayload) => {
      setIsEmergencyAlertVisible(false);
      const targetId = dispatchedAssignment?.id;
      if (targetId && payload) {
        try {
          await staffDispatchService.rejectAssignment(targetId, payload);
          Alert.alert('Đã Từ Chối', 'Lệnh điều động đã được từ chối và chuyển tiếp tới trạm dự bị.');
          loadStaffData();
        } catch (err: any) {
          Alert.alert('Lỗi', err.message || 'Không thể từ chối lệnh điều động.');
        }
      }
    },
    [dispatchedAssignment, loadStaffData]
  );

  // Navigate to ongoing active mission
  const handleResumeActiveMission = () => {
    if (activeMissionAssignment) {
      navigation.navigate('IncidentOverview', {
        incident: mapAssignmentToIncident(activeMissionAssignment),
        assignmentId: activeMissionAssignment.id,
      });
    }
  };

  // SOS Emergency Hotline Call (uses real station operator phone if available)
  const handleConfirmSosCall = () => {
    setIsSosModalVisible(false);
    const operatorPhone = myTeam?.stationOperator?.phoneNumber || user?.stationOperatorPhone || '112';
    const operatorName = myTeam?.stationOperator?.fullName || user?.stationOperatorName || 'Tổng Đài Điều Phối';
    Linking.openURL(`tel:${operatorPhone}`).catch(() => {
      Alert.alert('Thông Báo', `Đang kết nối qua kênh đàm thoại điều phối: ${operatorName} (${operatorPhone})`);
    });
  };

  // Navigate to Station
  const handleConfirmNavigateStation = () => {
    setIsNavigateStationModalVisible(false);
    const stationQuery = encodeURIComponent(myTeam?.stationName || 'Benh Vien Trung Vuong TPHCM');
    const url = Platform.select({
      ios: `maps:0,0?q=${stationQuery}`,
      android: `geo:0,0?q=${stationQuery}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  // Settings action
  const handleOpenSettings = () => {
    setIsSettingsModalVisible(true);
  };

  // Full Mission History
  const handleViewAllHistory = () => {
    Alert.alert(
      'Nhật Ký Ca Trực',
      `Đã hoàn thành ${completedAssignments.length} ca cấp cứu trong ngày hôm nay.`,
      [{ text: 'Đóng' }]
    );
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    await staffDispatchService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      safeArea
      statusBarStyle="dark-content"
    >
      <View style={styles.mainWrapper}>
        {/* Scrollable Dashboard Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: verticalScale(16) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#DC2626"
              colors={['#DC2626', '#EF4444']}
            />
          }
        >
          {/* 1. Staff Profile Bar */}
          <StaffProfileHeader
            name={user?.name || 'Lê Quốc Huy'}
            role={user?.crewRole || myTeam?.myCrewRole || t('staff.role_driver')}
            staffId={user?.staffId || (myTeam?.myTeamName ? `#${myTeam.myTeamName}` : 'ST-8821')}
            vehiclePlate={myTeam?.myTeamRescueUnitPlate || user?.vehiclePlate || '51A-999.99'}
            dutyStatus={dutyStatus}
            unreadNotificationsCount={unreadNotificationsCount}
            onPressNotifications={() => setIsNotificationModalVisible(true)}
            onPressSettings={handleOpenSettings}
            onPressLanguage={() => setIsLanguageModalVisible(true)}
            currentLang={i18n.language}
            onPressAvatar={() =>
              Alert.alert(
                'Kíp Trực Cứu Hộ',
                `${user?.name || 'Lê Quốc Huy'}\nVai trò: ${user?.crewRole || myTeam?.myCrewRole || 'Cứu Hộ'}\nTrạm: ${myTeam?.stationName || 'Trạm Cứu Hộ KCN'}\nXe phụ trách: ${myTeam?.myTeamRescueUnitPlate || '51A-999.99'}`
              )
            }
          />

          {/* 2. Priority Emergency Dispatch Alert / Active Mission Banner */}
          {dispatchedAssignment ? (
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.emergencyAlertBanner, styles.emergencyAlertBannerActive]}
              onPress={() => setIsEmergencyAlertVisible(true)}
            >
              <View style={styles.emergencyBannerHeader}>
                <View style={styles.emergencyTag}>
                  <Flame size={moderateScale(13)} color="#FFFFFF" />
                  <Text style={styles.emergencyTagText}>LỆNH ĐIỀU ĐỘNG MỚI</Text>
                </View>
                <View style={styles.liveTimerPill}>
                  <Text style={styles.liveTimerText}>CHẠM ĐỂ XEM & TIẾP NHẬN</Text>
                </View>
              </View>

              <Text style={styles.emergencyBannerTitle}>
                {dispatchedAssignment.incidentTitle || 'SỰ CỐ KHẨN CẤP CẦN XUẤT KÍCH'}
              </Text>
              <Text style={styles.emergencyBannerSub} numberOfLines={2}>
                📍 {dispatchedAssignment.incidentAddress || 'Hiện trường sự cố'}
              </Text>
            </TouchableOpacity>
          ) : activeMissionAssignment ? (
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.emergencyAlertBanner,
                { backgroundColor: '#F0FDF4', borderColor: '#10B981' },
              ]}
              onPress={handleResumeActiveMission}
            >
              <View style={styles.emergencyBannerHeader}>
                <View style={[styles.emergencyTag, { backgroundColor: '#059669' }]}>
                  <Navigation size={moderateScale(13)} color="#FFFFFF" />
                  <Text style={styles.emergencyTagText}>
                    ĐANG XỬ LÝ ({activeMissionAssignment.status.toUpperCase()})
                  </Text>
                </View>
                <View
                  style={[
                    styles.liveTimerPill,
                    { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                  ]}
                >
                  <Text style={[styles.liveTimerText, { color: '#059669' }]}>TIẾP TỤC CA TRỰC</Text>
                </View>
              </View>

              <Text style={[styles.emergencyBannerTitle, { color: '#065F46' }]}>
                {activeMissionAssignment.incidentTitle || 'Nhiệm Vụ Cứu Hộ Đang Diễn Ra'}
              </Text>
              <Text style={styles.emergencyBannerSub} numberOfLines={2}>
                📍 {activeMissionAssignment.incidentAddress || 'Hiện trường sự cố'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.emergencyAlertBanner,
                { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
              ]}
              onPress={() => setIsEmergencyAlertVisible(true)}
            >
              <View style={styles.emergencyBannerHeader}>
                <View style={[styles.emergencyTag, { backgroundColor: '#475569' }]}>
                  <CheckCircle2 size={moderateScale(13)} color="#FFFFFF" />
                  <Text style={styles.emergencyTagText}>SẴN SÀNG NHẬN LỆNH</Text>
                </View>
                <View
                  style={[
                    styles.liveTimerPill,
                    { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
                  ]}
                >
                  <Text style={[styles.liveTimerText, { color: '#64748B' }]}>MÔ PHỎNG TEST</Text>
                </View>
              </View>

              <Text style={[styles.emergencyBannerTitle, { color: '#1E293B' }]}>
                Kíp Trực Đang Sẵn Sàng Tại Trạm
              </Text>
              <Text style={styles.emergencyBannerSub}>
                Xe {myTeam?.myTeamRescueUnitPlate || user?.vehiclePlate || '51A-999.99'} sẵn sàng xuất kích khi có cảnh báo điều phối.
              </Text>
            </TouchableOpacity>
          )}

          {/* 4. Shift Summary Metrics Grid */}
          <ShiftMetricsGrid
            completedMissions={completedAssignments.length}
            totalDistanceKm={completedAssignments.length * 14}
            avgEtaMinutes={6.5}
            shiftHoursElapsed={4.5}
            totalShiftHours={12}
            onTimeRate={100}
          />

          {/* 4.5. Duty Schedule Registration Quick Access Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.scheduleBannerCard}
            onPress={() => navigation.navigate('StaffScheduleTab')}
          >
            <View style={styles.scheduleBannerLeft}>
              <View style={styles.scheduleBannerIconWrap}>
                <CalendarDays size={moderateScale(20)} color="#DC2626" />
              </View>
              <View style={styles.scheduleBannerTextCol}>
                <View style={styles.scheduleBannerHeaderRow}>
                  <Text style={styles.scheduleBannerTitle}>
                    {t('staff.banner_schedule_title')}
                  </Text>
                  <View style={styles.scheduleLiveBadge}>
                    <Text style={styles.scheduleLiveBadgeText}>MỚI</Text>
                  </View>
                </View>
                <Text style={styles.scheduleBannerSub} numberOfLines={2}>
                  {t('staff.banner_schedule_sub')}
                </Text>
              </View>
            </View>
            <ChevronRight size={moderateScale(18)} color="#DC2626" />
          </TouchableOpacity>

          {/* 5. Station & Vehicle Mini-Map Card */}
          <StationMiniMapCard
            stationName={
              myTeam?.stationName ||
              (isEnglish
                ? 'Tan Binh IP Rescue & Fire Base'
                : 'Trạm Cứu Hộ & PCCC KCN Tân Bình')
            }
            stationAddress={
              myTeam?.stationName
                ? `Khu vực: ${myTeam.stationName}`
                : isEnglish
                ? 'Road CN13 & CN1, Tan Binh IP, Tan Phu, HCMC'
                : 'Đường CN13 & CN1, KCN Tân Bình, P. Tây Thạnh, Tân Phú'
            }
            vehicleModel={
              myTeam?.myTeamRescueUnitPlate
                ? `Xe Cứu Hộ & Hazmat (#${myTeam.myTeamRescueUnitPlate})`
                : isEnglish
                ? 'IP Hazmat & Technical Rescue Unit #RESCUE-04'
                : 'Xe Cứu Hộ & Xử Lý Hazmat KCN #RESCUE-04'
            }
            vehicleStatus={
              dutyStatus === 'online'
                ? (isEnglish ? 'On duty at Base • Ready for emergency deployment' : 'Đang trực tại trạm • Sẵn sàng xuất kích')
                : dutyStatus === 'busy'
                ? (isEnglish ? 'Refilling SCBA Cylinders & Equipment Check' : 'Nạp khí bình SCBA & kiểm tra thiết bị Hazmat')
                : (isEnglish ? 'Off duty • Handed over' : 'Đã nghỉ ca • Bàn giao xe')
            }
            latitude={10.8145}
            longitude={106.6268}
            onPressNavigateStation={() => setIsNavigateStationModalVisible(true)}
            onPressOpenFullMap={() => setIsNavigateStationModalVisible(true)}
          />

          {/* 6. Recent Missions List */}
          <RecentMissionsList
            missions={missionsList.length > 0 ? missionsList : DEFAULT_FALLBACK_MISSIONS}
            onPressMission={(mission) => setSelectedMission(mission)}
            onPressViewAll={handleViewAllHistory}
          />
        </ScrollView>

        {/* 7. Sticky Bottom Quick Action Dock */}
        <QuickActionDock
          onPressCheckSupplies={() => setIsEquipmentModalVisible(true)}
          onPressSosCall={() => setIsSosModalVisible(true)}
          onPressHistory={handleViewAllHistory}
        />

        {/* Interactive Modals */}
        {/* Chặng 1: Full-screen Emergency Alert Modal */}
        <EmergencyAlertModal
          visible={isEmergencyAlertVisible}
          incident={activeIncident}
          assignmentId={dispatchedAssignment?.id}
          onAccept={handleAcceptEmergency}
          onDecline={handleDeclineEmergency}
          onTimeout={() => setIsEmergencyAlertVisible(false)}
        />

        {/* Confirmation Modal: SOS Hotline Call */}
        <ConfirmationModal
          visible={isSosModalVisible}
          type="danger"
          title="Gọi Trực Ban Điều Phối Cứu Hộ"
          description="Bạn đang yêu cầu kết nối thoại khẩn cấp đến Trung tâm Chỉ huy Điều phối Cứu hộ TP.HCM."
          highlightBadge="ĐÀM THOẠI TRỰC BAN CỨU HỘ"
          confirmText="Gọi Ngay"
          cancelText="Hủy Bỏ"
          onConfirm={handleConfirmSosCall}
          onCancel={() => setIsSosModalVisible(false)}
        />

        {/* Confirmation Modal: Navigate to Station */}
        <ConfirmationModal
          visible={isNavigateStationModalVisible}
          type="info"
          title="Dẫn Đường Về Trạm Cứu Hộ"
          description="Khởi chạy lộ trình ưu tiên dẫn đường xe cấp cứu về Trạm Quận 10 - Bệnh viện Trưng Vương."
          highlightBadge="XE CẤP CỨU ICU 51A-999.99"
          confirmText="Bắt Đầu Đi"
          cancelText="Đóng"
          onConfirm={handleConfirmNavigateStation}
          onCancel={() => setIsNavigateStationModalVisible(false)}
        />

        {/* Confirmation Modal: Vehicle & Crew Config Info */}
        <ConfirmationModal
          visible={isSettingsModalVisible}
          type="primary"
          title="Cấu Hình Ca Trực & Xe"
          description="Thông tin phân công nhiệm vụ kíp trực hiện tại:"
          highlightBadge="KÍP TRỰC ĐỘI ICU 01"
          highlightText="• Bác sĩ: BS. Trần Văn Minh\n• Điều dưỡng: Nguyễn Thị Lan\n• Lái xe: Lê Quốc Huy\n• Xe cấp cứu: 51A-999.99"
          singleButton
          confirmText="Đã Rõ"
          onConfirm={() => setIsSettingsModalVisible(false)}
          onCancel={() => setIsSettingsModalVisible(false)}
        />

        {/* Medical Supplies & Gear Checklist Modal */}
        <MedicalEquipmentModal
          visible={isEquipmentModalVisible}
          onClose={() => setIsEquipmentModalVisible(false)}
        />

        {/* Detailed Mission Incident Modal */}
        <MissionDetailModal
          visible={!!selectedMission}
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
        />

        {/* Dispatch Notifications Modal */}
        <StaffNotificationsModal
          visible={isNotificationModalVisible}
          notifications={notifications}
          onClose={() => setIsNotificationModalVisible(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        {/* Language Selector Modal */}
        <LanguageSelectorModal
          visible={isLanguageModalVisible}
          onClose={() => setIsLanguageModalVisible(false)}
        />
      </View>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(10),
  },
  emergencyAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: verticalScale(12),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  emergencyAlertBannerActive: {
    borderColor: '#DC2626',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  emergencyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
    gap: scale(6),
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(2.5),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    gap: scale(4),
    flexShrink: 1,
  },
  emergencyTagText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveTimerPill: {
    backgroundColor: '#FFFBEB',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  liveTimerText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#B45309',
  },
  emergencyBannerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  emergencyBannerSub: {
    fontSize: moderateScale(11),
    color: '#475569',
    fontWeight: '600',
    marginTop: verticalScale(3),
  },
  scheduleBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  scheduleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: scale(6),
  },
  scheduleBannerIconWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  scheduleBannerTextCol: {
    flex: 1,
  },
  scheduleBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  scheduleBannerTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  scheduleLiveBadge: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(4),
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
  },
  scheduleLiveBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scheduleBannerSub: {
    fontSize: moderateScale(10.5),
    color: '#475569',
    marginTop: verticalScale(2),
    lineHeight: moderateScale(14),
  },
});

