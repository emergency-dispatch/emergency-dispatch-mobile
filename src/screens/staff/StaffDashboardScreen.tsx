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
import { ConfirmationModal } from '../../components/common';
import {
  StaffProfileHeader,
  DutyStatusSelector,
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
    message: 'Trung tâm 115 chuyển mức sẵn sàng lên cấp 1 do thời tiết mưa lớn giờ cao điểm.',
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

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

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
    Linking.openURL('tel:115').catch(() => {
      Alert.alert('Thông Báo', 'Đang kết nối qua kênh đàm thoại nội bộ 115...');
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
      backgroundColor="#0B0F19"
      edges={['top', 'left', 'right']}
      safeArea
      statusBarStyle="light-content"
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
              tintColor="#38BDF8"
              colors={['#38BDF8', '#10B981', '#EF4444']}
            />
          }
        >
          {/* 1. Staff Profile Bar */}
          <StaffProfileHeader
            name="Lê Quốc Huy"
            role="Đội Cứu Hộ 01 • Cấp Cứu 115"
            staffId="ST-8821"
            vehiclePlate="51A-999.99"
            dutyStatus={dutyStatus}
            unreadNotificationsCount={unreadNotificationsCount}
            onPressNotifications={() => setIsNotificationModalVisible(true)}
            onPressSettings={handleOpenSettings}
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
                <Text style={styles.emergencyTagText}>CODE RED • ĐIỀU ĐỘNG KHẨN</Text>
              </View>
              <View style={styles.liveTimerPill}>
                <Text style={styles.liveTimerText}>CHẠM ĐỂ XEM ⚡</Text>
              </View>
            </View>

            <Text style={styles.emergencyBannerTitle}>
              TAI NẠN GIAO THÔNG LIÊN HOÀN (3 NẠN NHÂN)
            </Text>
            <Text style={styles.emergencyBannerSub}>
              📍 120 Võ Văn Tần, P.6, Q.3 • Cách 2.4 km (ETA: 6 phút)
            </Text>
          </TouchableOpacity>

          {/* 3. Duty Status Selector */}
          <DutyStatusSelector
            currentStatus={dutyStatus}
            onStatusChange={setDutyStatus}
            gpsStatusText="GPS: Tốt (±3m)"
            serverStatusText="Máy chủ: Đã kết nối"
            radioChannelText="Kênh 04 (115 TT)"
          />

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
            stationName="Trạm Cứu Hộ Quận 10 - BV Trưng Vương"
            stationAddress="201 Lý Thường Kiệt, P.7, Q.10, TP.HCM"
            vehicleModel="Xe Cứu Thương ICU Chuyên Dụng #AMB-04"
            vehicleStatus={
              dutyStatus === 'online'
                ? 'Đang trực tại trạm • Sẵn sàng xuất kích'
                : dutyStatus === 'busy'
                ? 'Tạm nghỉ bảo dưỡng & nạp Oxy'
                : 'Đã nghỉ ca • Bàn giao xe'
            }
            latitude={10.7712}
            longitude={106.6578}
            onPressNavigateStation={() => setIsNavigateStationModalVisible(true)}
            onPressOpenFullMap={() => setIsNavigateStationModalVisible(true)}
          />

          {/* 6. Recent Missions List */}
          <RecentMissionsList
            missions={MOCK_MISSIONS}
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
          title="Gọi Trực Ban Điều Phối 115"
          description="Bạn đang yêu cầu kết nối thoại khẩn cấp đến Trung tâm Chỉ huy Điều phối Cứu hộ 115 TP.HCM."
          highlightBadge="ĐÀM THOẠI TRỰC BAN 115"
          confirmText="Gọi Ngay (115)"
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
      </View>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
    backgroundColor: 'rgba(220, 38, 38, 0.22)',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: verticalScale(12),
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexShrink: 0,
  },
  liveTimerText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#FBBF24',
  },
  emergencyBannerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  emergencyBannerSub: {
    fontSize: moderateScale(11),
    color: '#FCA5A5',
    fontWeight: '600',
    marginTop: verticalScale(3),
  },
});

