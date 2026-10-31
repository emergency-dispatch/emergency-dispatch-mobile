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
import {
  MapPin,
  Radio,
  PhoneCall,
  PackageCheck,
  ClipboardList,
  Sparkles,
  Flame,
  Navigation,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal, LanguageSelectorModal } from '../../components/common';
import { useTranslation } from 'react-i18next';
import {
  StaffProfileHeader,
  DutyStatus,
  ShiftMetricsGrid,
  StationMiniMapCard,
  RecentMissionsList,
  MedicalEquipmentModal,
  MissionDetailModal,
  StaffNotificationsModal,
} from '../../components/staff';
import { EmergencyAlertModal } from '../../components/dispatch/EmergencyAlertModal';
import { MissionItem, DispatchNotification } from '../../types/staff';
import {
  EmergencyIncident,
  DispatchAssignmentResponseDto,
  RejectAssignmentPayload,
  MyTeamDto,
  mapAssignmentToIncident,
} from '../../types/dispatch';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { useAppStore } from '../../store/useAppStore';

export const StaffDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAppStore();

  // State
  const { t } = useTranslation();
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
    destinationHospital: a.completionReport?.handoverEntity || '',
    notes: a.completionReport?.actionsSummary || a.notes || '',
  }));

  const activeIncident = dispatchedAssignment
    ? mapAssignmentToIncident(dispatchedAssignment)
    : activeMissionAssignment
    ? mapAssignmentToIncident(activeMissionAssignment)
    : undefined;

  // Tự động bật màn hình báo động nhận lệnh khi có sự cố được điều động đến xe
  useEffect(() => {
    if (dispatchedAssignment?.id) {
      setIsEmergencyAlertVisible(true);
    }
  }, [dispatchedAssignment?.id]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Identity specs
  const responderName = user?.name ? (user.name === 'Lê Quốc Huy' ? 'Trần Cứu Hộ' : user.name) : 'Trần Cứu Hộ';
  const responderRole = user?.crewRole || 'Medic';
  const responderPlate = user?.vehiclePlate || myTeam?.myTeamRescueUnitPlate || '51B-115.02';
  const currentStationName = myTeam?.stationName || user?.stationName || 'FPT Station';

  // Duty status toggle handler
  const handleToggleDutyStatus = () => {
    setDutyStatus((prev) => {
      if (prev === 'online') return 'busy';
      if (prev === 'busy') return 'offline';
      return 'online';
    });
  };

  const getStatusBadgeConfig = () => {
    switch (dutyStatus) {
      case 'online':
        return {
          label: '🟢 Đang Sẵn Sàng',
          sub: 'Ready to Dispatch',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          textColor: '#065F46',
          dotColor: '#10B981',
          operationalText: 'Sẵn sàng nhận lệnh điều động 24/7',
        };
      case 'busy':
        return {
          label: '🟡 Đang Bận',
          sub: 'On Mission',
          bg: '#FFFBEB',
          border: '#FDE68A',
          textColor: '#92400E',
          dotColor: '#F59E0B',
          operationalText: 'Đang thực hiện nhiệm vụ khẩn cấp',
        };
      case 'offline':
        return {
          label: '🔴 Nghỉ Ca',
          sub: 'Off Duty',
          bg: '#FEF2F2',
          border: '#FECACA',
          textColor: '#991B1B',
          dotColor: '#EF4444',
          operationalText: 'Đã hoàn tất ca trực & bàn giao xe',
        };
    }
  };

  const statusConfig = getStatusBadgeConfig();

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

  // SOS Emergency Hotline Call
  const handleConfirmSosCall = () => {
    setIsSosModalVisible(false);
    const operatorPhone = myTeam?.stationOperator?.phoneNumber || user?.stationOperatorPhone || '115';
    const operatorName = myTeam?.stationOperator?.fullName || user?.stationOperatorName || 'Tổng Đài Điều Hành Khẩn Cấp';
    Linking.openURL(`tel:${operatorPhone}`).catch(() => {
      Alert.alert('Thông Báo', `Đang kết nối qua kênh đàm thoại điều phối: ${operatorName} (${operatorPhone})`);
    });
  };

  // Navigate to Station
  const handleConfirmNavigateStation = () => {
    setIsNavigateStationModalVisible(false);
    const stationQuery = encodeURIComponent(currentStationName);
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
      `Đã ghi nhận ${completedAssignments.length} sự cố cứu hộ được tiếp nhận và xử lý trong ca trực hôm nay.`,
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
            { paddingBottom: verticalScale(90) },
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
          {/* 1. Header / Profile Section: Compact Row */}
          <StaffProfileHeader
            name={responderName}
            role={responderRole}
            vehiclePlate={responderPlate}
            dutyStatus={dutyStatus}
            unreadNotificationsCount={unreadNotificationsCount}
            onPressNotifications={() => setIsNotificationModalVisible(true)}
            onPressSettings={handleOpenSettings}
            onPressAvatar={() =>
              Alert.alert(
                'Kíp Trực Cấp Cứu',
                `${responderName}\nVai trò: ${responderRole}\nTrạm: ${currentStationName}\nXe trực: ${responderPlate}`
              )
            }
          />

          {/* 2. Shift & Operational Status (Hero Card) */}
          {dispatchedAssignment ? (
            /* High-Priority Active Dispatch Banner */
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.heroCard, styles.emergencyAlertBannerActive]}
              onPress={() => setIsEmergencyAlertVisible(true)}
            >
              <View style={styles.heroAlertHeader}>
                <View style={styles.emergencyTag}>
                  <Flame size={moderateScale(13)} color="#FFFFFF" />
                  <Text style={styles.emergencyTagText}>LỆNH ĐIỀU ĐỘNG KHẨN CẤP</Text>
                </View>
                <View style={styles.liveTimerPill}>
                  <Text style={styles.liveTimerText}>CHẠM TIẾP NHẬN ⚡</Text>
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
            /* Ongoing Active Mission Banner */
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.heroCard,
                { backgroundColor: '#F0FDF4', borderColor: '#10B981' },
              ]}
              onPress={handleResumeActiveMission}
            >
              <View style={styles.heroAlertHeader}>
                <View style={[styles.emergencyTag, { backgroundColor: '#059669' }]}>
                  <Navigation size={moderateScale(13)} color="#FFFFFF" />
                  <Text style={styles.emergencyTagText}>
                    ĐANG XỬ LÝ ({activeMissionAssignment.status.toUpperCase()})
                  </Text>
                </View>
                <View style={[styles.liveTimerPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.liveTimerText, { color: '#059669' }]}>TIẾP TỤC CA TRỰC →</Text>
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
            /* Hero Card: Current Station + Prominent Status Toggle */
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                {/* Current Station Info */}
                <View style={styles.stationInfoGroup}>
                  <View style={styles.stationPinWrap}>
                    <MapPin size={moderateScale(18)} color="#DC2626" />
                  </View>
                  <View style={styles.stationTextCol}>
                    <Text style={styles.stationSubLabel}>Trạm trực hiện tại</Text>
                    <Text style={styles.stationNameText} numberOfLines={1}>
                      {currentStationName}
                    </Text>
                  </View>
                </View>

                {/* Status Toggle / Indicator: Prominent Pill Badge */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.statusPillBadge,
                    { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
                  ]}
                  onPress={handleToggleDutyStatus}
                >
                  <Text style={[styles.statusPillText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Actionable High-Contrast Operational Status Row */}
              <View style={styles.operationalStatusRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.operationalBadge}
                  onPress={() => setIsEmergencyAlertVisible(true)}
                >
                  <Radio size={moderateScale(13)} color={statusConfig.dotColor} />
                  <Text style={[styles.operationalText, { color: statusConfig.textColor }]}>
                    {statusConfig.operationalText}
                  </Text>
                </TouchableOpacity>

                {/* Subtle Debug / Simulation Trigger */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.subtleDebugBtn}
                  onPress={() => setIsEmergencyAlertVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessible={true}
                  accessibilityLabel="Mô phỏng thử nghiệm điều phối"
                >
                  <Sparkles size={moderateScale(14)} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3. Daily Shift Metrics: Clean Flat Layout */}
          <ShiftMetricsGrid
            completedMissions={completedAssignments.length}
            totalDistanceKm={completedAssignments.length * 14}
            avgEtaMinutes={6.5}
            shiftHoursElapsed={4.5}
            totalShiftHours={12}
            onTimeRate={100}
            fuelStatus="Nhiên liệu 85%"
            etaComparison="Nhanh hơn 1.2m"
          />

          {/* 4. Quick Actions: 2-Column Clean Utility Grid */}
          <View style={styles.quickUtilityGrid}>
            {/* Kiểm tra trang bị */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.utilityCard}
              onPress={() => setIsEquipmentModalVisible(true)}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <PackageCheck size={moderateScale(20)} color="#2563EB" />
              </View>
              <View style={styles.utilityTextWrap}>
                <Text style={styles.utilityTitle} numberOfLines={1}>
                  {t('staff.check_gear') || 'Kiểm tra trang bị'}
                </Text>
                <Text style={styles.utilitySub} numberOfLines={1}>
                  {t('staff.gear_subtitle') || 'Vật tư & Thiết bị ICU'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Nhật ký sự cố */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.utilityCard}
              onPress={handleViewAllHistory}
            >
              <View style={[styles.utilityIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <ClipboardList size={moderateScale(20)} color="#DC2626" />
              </View>
              <View style={styles.utilityTextWrap}>
                <Text style={styles.utilityTitle} numberOfLines={1}>
                  {t('staff.shift_history') || 'Nhật ký sự cố'}
                </Text>
                <Text style={styles.utilitySub} numberOfLines={1}>
                  {completedAssignments.length > 0
                    ? `${completedAssignments.length} ca hoàn tất`
                    : 'Lịch sử tiếp nhận'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 5. Station & Tactical Mini-Map Card */}
          <StationMiniMapCard
            stationName={`${currentStationName} - Cứu Hộ & Cấp Cứu`}
            stationAddress="Lô E2a-7, Đường D1, Khu Công Nghệ Cao, TP. Thủ Đức"
            vehicleModel={`Xe Cứu Thương ICU #${responderPlate}`}
            vehicleStatus={
              dutyStatus === 'online'
                ? 'Đang trực tại trạm • Sẵn sàng xuất kích'
                : dutyStatus === 'busy'
                ? 'Kiểm tra thiết bị & nạp khí SCBA'
                : 'Đã nghỉ ca • Bàn giao xe'
            }
            latitude={10.8415}
            longitude={106.8098}
            onPressNavigateStation={() => setIsNavigateStationModalVisible(true)}
            onPressOpenFullMap={() => setIsNavigateStationModalVisible(true)}
          />

          {/* 6. Recent Missions List */}
          <RecentMissionsList
            missions={missionsList}
            onPressMission={(mission) => setSelectedMission(mission)}
            onPressViewAll={handleViewAllHistory}
          />
        </ScrollView>

        {/* 7. Fixed Emergency Action Bar: Full-Width High-Contrast SOS/Dispatch Button */}
        <View style={[styles.fixedEmergencyBar, { paddingBottom: Math.max(insets.bottom, verticalScale(10)) }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.emergencySosButton}
            onPress={() => setIsSosModalVisible(true)}
          >
            <PhoneCall size={moderateScale(18)} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.emergencySosButtonText}>
              GỌI ĐIỀU HÀNH KHẨN CẤP (24/7)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Modals */}
        {activeIncident && (
          <EmergencyAlertModal
            visible={isEmergencyAlertVisible}
            incident={activeIncident}
            assignmentId={dispatchedAssignment?.id}
            onAccept={handleAcceptEmergency}
            onDecline={handleDeclineEmergency}
            onTimeout={() => setIsEmergencyAlertVisible(false)}
          />
        )}

        <ConfirmationModal
          visible={isSosModalVisible}
          type="danger"
          title="Gọi Điều Hành Khẩn Cấp"
          description="Kết nối trực tiếp tới Trung tâm Chỉ huy Điều phối Cấp cứu 115 / CAD để báo cáo hoặc yêu cầu chi viện khẩn."
          highlightBadge="HOTLINE ĐIỀU PHỐI 24/7"
          confirmText="Gọi Ngay"
          cancelText="Hủy Bỏ"
          onConfirm={handleConfirmSosCall}
          onCancel={() => setIsSosModalVisible(false)}
        />

        <ConfirmationModal
          visible={isNavigateStationModalVisible}
          type="info"
          title="Dẫn Đường Về Trạm"
          description={`Khởi chạy lộ trình ưu tiên dẫn đường xe cấp cứu về ${currentStationName}.`}
          highlightBadge={`XE ${responderPlate}`}
          confirmText="Bắt Đầu Đi"
          cancelText="Đóng"
          onConfirm={handleConfirmNavigateStation}
          onCancel={() => setIsNavigateStationModalVisible(false)}
        />

        <ConfirmationModal
          visible={isSettingsModalVisible}
          type="primary"
          title="Cấu Hình Ca Trực & Xe"
          description="Thông tin phân công nhiệm vụ kíp trực hiện tại:"
          highlightBadge="KÍP TRỰC CẤP CỨU ICU"
          highlightText={`• Cán bộ trực: ${responderName}\n• Vai trò: ${responderRole}\n• Xe cấp cứu: ${responderPlate}\n• Trạm: ${currentStationName}`}
          singleButton
          confirmText="Đã Rõ"
          onConfirm={() => setIsSettingsModalVisible(false)}
          onCancel={() => setIsSettingsModalVisible(false)}
        />

        <MedicalEquipmentModal
          visible={isEquipmentModalVisible}
          onClose={() => setIsEquipmentModalVisible(false)}
        />

        <MissionDetailModal
          visible={!!selectedMission}
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
        />

        <StaffNotificationsModal
          visible={isNotificationModalVisible}
          notifications={notifications}
          onClose={() => setIsNotificationModalVisible(false)}
          onMarkAllRead={handleMarkAllRead}
        />

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
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
  },

  /* Hero Card: Shift & Operational Status */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(12),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: scale(8),
  },
  stationPinWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  stationTextCol: {
    flex: 1,
  },
  stationSubLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stationNameText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  statusPillBadge: {
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  operationalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  operationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    flex: 1,
  },
  operationalText: {
    fontSize: moderateScale(11.5),
    fontWeight: '600',
  },
  subtleDebugBtn: {
    padding: moderateScale(4),
    borderRadius: moderateScale(6),
  },

  /* Active Emergency Alert Banner in Hero Card */
  emergencyAlertBannerActive: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  heroAlertHeader: {
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
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    gap: scale(4),
  },
  emergencyTagText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveTimerPill: {
    backgroundColor: '#FFFBEB',
    paddingVertical: verticalScale(2.5),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  liveTimerText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#B45309',
  },
  emergencyBannerTitle: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  emergencyBannerSub: {
    fontSize: moderateScale(11.5),
    color: '#475569',
    fontWeight: '600',
    marginTop: verticalScale(3),
  },

  /* Quick Actions: 2-Column Clean Utility Grid */
  quickUtilityGrid: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: verticalScale(12),
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  utilityIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  utilityTextWrap: {
    flex: 1,
  },
  utilityTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  utilitySub: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(1.5),
  },

  /* Fixed Emergency Action Bar */
  fixedEmergencyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  emergencySosButton: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencySosButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
