import React, { useState, useCallback } from 'react';
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
import { ShieldAlert, Zap, Radio, BellRing, Flame } from 'lucide-react-native';
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
import { MOCK_EMERGENCY_INCIDENT, EmergencyIncident } from '../../types/dispatch';



// Mock Initial Missions Data
const MOCK_MISSIONS: MissionItem[] = [
  {
    id: 'm1',
    code: '#EM-240901',
    type: 'traffic_accident',
    title: 'Tai nạn giao thông - Va chạm đa chấn thương',
    severity: 'critical',
    address: 'Ngã tư CMT8 - Nguyễn Đình Chiểu, Phường 5, Quận 3',
    completedAt: '11:20 (35 phút trước)',
    durationMinutes: 28,
    distanceKm: 4.2,
    etaMinutes: 6.5,
    status: 'completed',
    patientCount: 2,
    destinationHospital: 'Bệnh viện Cấp Cứu Trưng Vương',
    notes: '2 nạn nhân đa chấn thương gãy cẳng chân, đã nẹp cố định & truyền dịch NaCl 0.9%.',
  },
  {
    id: 'm2',
    code: '#EM-240898',
    type: 'cardiac_arrest',
    title: 'Cấp cứu tim mạch - Đau thắt ngực khó thở',
    severity: 'urgent',
    address: 'Căn hộ 12B, Chung cư Hà Đô Centrosa, P.12, Quận 10',
    completedAt: '09:45 (2 giờ trước)',
    durationMinutes: 34,
    distanceKm: 2.8,
    etaMinutes: 5.0,
    status: 'completed',
    patientCount: 1,
    destinationHospital: 'Bệnh viện Tim Tâm Đức / Chợ Rẫy',
    notes: 'Bệnh nhân nam 62 tuổi có tiền sử nhồi máu cơ tim, đã sốc tim AED 1 nhịp và hỗ trợ thở Oxy mask.',
  },
  {
    id: 'm3',
    code: '#EM-240885',
    type: 'fire_rescue',
    title: 'Hỗ trợ sơ cứu nạn nhân ngạt khói dân cư',
    severity: 'urgent',
    address: 'Hẻm 458 Ba Tháng Hai, Phường 14, Quận 10',
    completedAt: '07:50 (4 giờ trước)',
    durationMinutes: 45,
    distanceKm: 3.5,
    etaMinutes: 7.2,
    status: 'completed',
    patientCount: 3,
    destinationHospital: 'Bệnh viện Trưng Vương TP.HCM',
    notes: 'Phối hợp Đội PCCC & CNCH Quận 10, cấp cứu ngạt khí CO cho 3 cư dân.',
  },
];

// Mock Dispatch Notifications
const MOCK_NOTIFICATIONS: DispatchNotification[] = [
  {
    id: 'n1',
    title: 'Lệnh điều động dự bị ưu tiên Vùng 2',
    message: 'Trung tâm điều phối chuyển mức sẵn sàng lên cấp 1 do thời tiết mưa lớn giờ cao điểm.',
    type: 'urgent',
    timestamp: '11:45',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Cảnh báo kẹt xe & ngập nước cục bộ',
    message: 'Tuyến đường Ba Tháng Hai giao Lê Đại Hành ngập sâu 30cm. Đề xuất xe cứu thương chọn hướng Lý Thường Kiệt.',
    type: 'traffic',
    timestamp: '10:30',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'Bệnh viện Chợ Rẫy mở thêm 4 giường ICU',
    message: 'Khoa Cấp cứu tiếp nhận bình thường cho các ca chấn thương sọ não và tim mạch.',
    type: 'info',
    timestamp: '08:15',
    isRead: true,
  },
];

export const StaffDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // State
  const { t, i18n } = useTranslation();
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('online');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<DispatchNotification[]>(MOCK_NOTIFICATIONS);

  // Modals state
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionItem | null>(null);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [isEmergencyAlertVisible, setIsEmergencyAlertVisible] = useState(false);
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [isNavigateStationModalVisible, setIsNavigateStationModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const isEnglish = !i18n.language?.startsWith('vi');

  const localizedMissions: MissionItem[] = MOCK_MISSIONS.map((m) => {
    if (!isEnglish) return m;
    if (m.id === 'm1') {
      return {
        ...m,
        title: 'Traffic Collision - Multiple Trauma Casualties',
        completedAt: '11:20 (35 mins ago)',
        destinationHospital: 'Trung Vuong Emergency Hospital',
        notes: '2 victims with leg fractures, splinted & IV NaCl 0.9% administered.',
      };
    }
    if (m.id === 'm2') {
      return {
        ...m,
        title: 'Cardiac Emergency - Chest Pain & Dyspnea',
        completedAt: '09:45 (2 hrs ago)',
        destinationHospital: 'Tam Duc Heart Hospital / Cho Ray',
        notes: '62-year-old male with history of MI, AED shocked 1 cycle, O2 mask assisted.',
      };
    }
    if (m.id === 'm3') {
      return {
        ...m,
        title: 'Smoke Inhalation Rescue Support',
        completedAt: '07:50 (4 hrs ago)',
        destinationHospital: 'Trung Vuong Hospital HCMC',
        notes: 'Coordinated with Fire & Rescue Team Dist 10, CO inhalation treated for 3 residents.',
      };
    }
    return m;
  });

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // Accept emergency incident -> Go to IncidentOverviewScreen (Chặng 2)
  const handleAcceptEmergency = useCallback(
    (incident: EmergencyIncident) => {
      setIsEmergencyAlertVisible(false);
      navigation.navigate('IncidentOverview', { incident });
    },
    [navigation]
  );

  // SOS Emergency Hotline Call
  const handleConfirmSosCall = () => {
    setIsSosModalVisible(false);
    Linking.openURL('tel:112').catch(() => {
      Alert.alert('Thông Báo', 'Đang kết nối qua kênh đàm thoại nội bộ cứu hộ...');
    });
  };

  // Navigate to Station
  const handleConfirmNavigateStation = () => {
    setIsNavigateStationModalVisible(false);
    const url = Platform.select({
      ios: 'maps:0,0?q=Benh+Vien+Trung+Vuong+TPHCM',
      android: 'geo:0,0?q=Benh+Vien+Trung+Vuong+TPHCM',
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
      'Đã hoàn thành 3 ca cấp cứu trong ngày hôm nay. Tổng quãng đường di chuyển: 42 km.',
      [{ text: 'Đóng' }]
    );
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
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
            name="Lê Quốc Huy"
            role={t('staff.role_driver')}
            staffId="ST-8821"
            vehiclePlate="51A-999.99"
            dutyStatus={dutyStatus}
            unreadNotificationsCount={unreadNotificationsCount}
            onPressNotifications={() => setIsNotificationModalVisible(true)}
            onPressSettings={handleOpenSettings}
            onPressLanguage={() => setIsLanguageModalVisible(true)}
            currentLang={i18n.language}
            onPressAvatar={() =>
              Alert.alert('Nhân Viên', 'Lê Quốc Huy - Lái xe Cấp Cứu Hạng 1\nKinh nghiệm: 5 năm điều phối')
            }
          />

          {/* 2. Priority Emergency Dispatch Alert Simulation Trigger Banner */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.emergencyAlertBanner}
            onPress={() => setIsEmergencyAlertVisible(true)}
          >
            <View style={styles.emergencyBannerHeader}>
              <View style={styles.emergencyTag}>
                <Flame size={moderateScale(13)} color="#FFFFFF" />
                <Text style={styles.emergencyTagText}>{t('staff.code_red_alert')}</Text>
              </View>
              <View style={styles.liveTimerPill}>
                <Text style={styles.liveTimerText}>{t('staff.tap_to_view')}</Text>
              </View>
            </View>

            <Text style={styles.emergencyBannerTitle}>
              {t('staff.mock_incident_title')}
            </Text>
            <Text style={styles.emergencyBannerSub}>
              {t('staff.mock_incident_sub')}
            </Text>
          </TouchableOpacity>

          {/* 4. Shift Summary Metrics Grid */}
          <ShiftMetricsGrid
            completedMissions={3}
            totalDistanceKm={42}
            avgEtaMinutes={8.5}
            shiftHoursElapsed={6.5}
            totalShiftHours={12}
            onTimeRate={100}
          />

          {/* 5. Station & Vehicle Mini-Map Card */}
          <StationMiniMapCard
            stationName={
              isEnglish
                ? 'District 10 Dispatch Station - Trung Vuong Hospital'
                : 'Trạm Cứu Hộ Quận 10 - BV Trưng Vương'
            }
            stationAddress={
              isEnglish
                ? '201 Ly Thuong Kiet, W.7, Dist.10, HCMC'
                : '201 Lý Thường Kiệt, P.7, Q.10, TP.HCM'
            }
            vehicleModel={
              isEnglish
                ? 'Dedicated ICU Ambulance #AMB-04'
                : 'Xe Cứu Thương ICU Chuyên Dụng #AMB-04'
            }
            vehicleStatus={
              dutyStatus === 'online'
                ? (isEnglish ? 'On duty at station • Ready for dispatch' : 'Đang trực tại trạm • Sẵn sàng xuất kích')
                : dutyStatus === 'busy'
                ? (isEnglish ? 'Maintenance & Oxygen Refill' : 'Tạm nghỉ bảo dưỡng & nạp Oxy')
                : (isEnglish ? 'Off duty • Handed over' : 'Đã nghỉ ca • Bàn giao xe')
            }
            latitude={10.7712}
            longitude={106.6578}
            onPressNavigateStation={() => setIsNavigateStationModalVisible(true)}
            onPressOpenFullMap={() => setIsNavigateStationModalVisible(true)}
          />

          {/* 6. Recent Missions List */}
          <RecentMissionsList
            missions={localizedMissions}
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
          incident={MOCK_EMERGENCY_INCIDENT}
          onAccept={handleAcceptEmergency}
          onDecline={() => setIsEmergencyAlertVisible(false)}
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
});

