import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Shield,
  ShieldCheck,
  Truck,
  Phone,
  Radio,
  Clock,
  Award,
  Users,
  Building2,
  FileCheck2,
  Zap,
  Activity,
  LogOut,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Flame,
  KeyRound,
  FileText,
  BadgeAlert,
  Sliders,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';

export const StaffProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAppStore();

  // Settings states
  const [autoSirenOnCodeRed, setAutoSirenOnCodeRed] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [radioChannel, setRadioChannel] = useState('Kênh 04 (154.250 MHz)');

  // Modal states
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isHandoverModalVisible, setIsHandoverModalVisible] = useState(false);
  const [isRadioModalVisible, setIsRadioModalVisible] = useState(false);

  // Crew member call
  const handleCallCrew = (name: string, phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Đàm Thoại', `Đang gọi liên hệ thành viên: ${name} (${phone})`);
    });
  };

  // Handover confirmation
  const handleConfirmHandover = () => {
    setIsHandoverModalVisible(false);
    Alert.alert(
      'Bàn Giao Ca Thành Công',
      'Biên bản bàn giao xe 51A-999.99 và trang thiết bị đã được gửi về Trung tâm Điều phối 115.'
    );
  };

  // Logout confirmation
  const handleConfirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
    (navigation as any).navigate('Auth', { screen: 'Login' });
  };

  return (
    <ScreenContainer
      backgroundColor="#0B0F19"
      safeArea
      edges={['top', 'left', 'right']}
      statusBarStyle="light-content"
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>HỒ SƠ KÍP TRỰC CỨU HỘ</Text>
          <Text style={styles.headerSubtitle}>Trung Tâm Điều Phối Cấp Cứu 115 TP.HCM</Text>
        </View>

        <View style={styles.dutyBadge}>
          <View style={styles.dutyGreenDot} />
          <Text style={styles.dutyBadgeText}>ĐANG TRỰC CA</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Hero Staff Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}>
                <Truck size={moderateScale(32)} color="#38BDF8" />
              </View>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={moderateScale(12)} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <View style={styles.heroTextInfo}>
              <View style={styles.staffIdPill}>
                <Text style={styles.staffIdText}>MÃ NV: {user?.staffId || 'ST-8821'}</Text>
              </View>
              <Text style={styles.heroName}>{user?.name || 'BS. Lê Quốc Huy'}</Text>
              <Text style={styles.heroRole}>Lái xe Cấp Cứu & Cứu Hộ Viên EMT-P</Text>
            </View>
          </View>

          {/* Credentials Badges */}
          <View style={styles.credentialsRow}>
            <View style={styles.credBadge}>
              <Award size={moderateScale(12)} color="#F59E0B" />
              <Text style={styles.credBadgeText}>5 Năm Cứu Hộ</Text>
            </View>
            <View style={styles.credBadge}>
              <Zap size={moderateScale(12)} color="#EF4444" />
              <Text style={styles.credBadgeText}>Code Red T1</Text>
            </View>
            <View style={styles.credBadge}>
              <Activity size={moderateScale(12)} color="#10B981" />
              <Text style={styles.credBadgeText}>Chứng Chỉ ACLS/AED</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          {/* Station & Contact */}
          <View style={styles.stationRow}>
            <Building2 size={moderateScale(14)} color="#38BDF8" />
            <Text style={styles.stationText} numberOfLines={1}>
              Trạm Q.10 - Bệnh viện Cấp Cứu Trưng Vương
            </Text>
          </View>
        </View>

        {/* 3. Assigned Ambulance & Equipment Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Truck size={moderateScale(18)} color="#38BDF8" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Phương Tiện & Trang Bị Quản Lý</Text>
              <Text style={styles.sectionSub}>Giao trách nhiệm bảo quản ca trực</Text>
            </View>
          </View>

          <View style={styles.vehicleDetailsBox}>
            <View style={styles.vehiclePlateRow}>
              <Text style={styles.vehicleName}>Xe Cứu Thương ICU Chuyên Dụng #AMB-04</Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{user?.vehiclePlate || '51A-999.99'}</Text>
              </View>
            </View>

            <View style={styles.vehicleMetricsGrid}>
              <View style={styles.vehicleMetricItem}>
                <Text style={styles.vMetricLabel}>Bình Nhiên Liệu</Text>
                <Text style={[styles.vMetricValue, { color: '#10B981' }]}>85% (Đầy)</Text>
              </View>
              <View style={styles.vehicleMetricItem}>
                <Text style={styles.vMetricLabel}>Oxy Trung Tâm</Text>
                <Text style={[styles.vMetricValue, { color: '#38BDF8' }]}>200 Bar (Chuẩn)</Text>
              </View>
              <View style={styles.vehicleMetricItem}>
                <Text style={styles.vMetricLabel}>Định Vị Telemetry</Text>
                <Text style={[styles.vMetricValue, { color: '#F59E0B' }]}>Online (±2m)</Text>
              </View>
            </View>

            <View style={styles.gearListRow}>
              <Text style={styles.gearListLabel}>Thiết bị chính:</Text>
              <Text style={styles.gearListText}>
                Máy sốc tim AED Zoll X • Máy thở Hamilton T1 • Kìm thủy lực Lukas
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Duty Squad Crew Members */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Users size={moderateScale(18)} color="#F59E0B" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Thành Viên Kíp Trực Cùng Ca</Text>
              <Text style={styles.sectionSub}>Đội Cứu Hộ 01 • Ca Trực 12 Giờ</Text>
            </View>
          </View>

          {/* Member 1: Doctor */}
          <View style={styles.crewMemberRow}>
            <View style={styles.crewAvatarWrap}>
              <Text style={styles.crewAvatarText}>BS</Text>
            </View>
            <View style={styles.crewInfoGroup}>
              <Text style={styles.crewName}>BS. CK1 Trần Văn Minh</Text>
              <Text style={styles.crewRole}>Bác sĩ Phụ Trách Ca • Khoa Cấp Cứu</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.crewCallBtn}
              onPress={() => handleCallCrew('BS. Trần Văn Minh', '0908112233')}
            >
              <PhoneCall size={moderateScale(14)} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Member 2: Nurse */}
          <View style={styles.crewMemberRow}>
            <View style={[styles.crewAvatarWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Text style={[styles.crewAvatarText, { color: '#EC4899' }]}>ĐD</Text>
            </View>
            <View style={styles.crewInfoGroup}>
              <Text style={styles.crewName}>ĐD. Nguyễn Thị Lan</Text>
              <Text style={styles.crewRole}>Điều Dưỡng Cấp Cứu Hồi Sức</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.crewCallBtn}
              onPress={() => handleCallCrew('ĐD. Nguyễn Thị Lan', '0912445566')}
            >
              <PhoneCall size={moderateScale(14)} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Member 3: Driver (You) */}
          <View style={[styles.crewMemberRow, styles.crewMemberRowSelf]}>
            <View style={[styles.crewAvatarWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Text style={[styles.crewAvatarText, { color: '#38BDF8' }]}>LX</Text>
            </View>
            <View style={styles.crewInfoGroup}>
              <Text style={styles.crewName}>{user?.name || 'Lê Quốc Huy'} (Chính bạn)</Text>
              <Text style={styles.crewRole}>Lái xe Cứu Hộ & Kỹ thuật viên EMT</Text>
            </View>
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>BẠN</Text>
            </View>
          </View>
        </View>

        {/* 5. Performance & Shift Stats */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Activity size={moderateScale(18)} color="#10B981" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Hiệu Suất Phản Ứng Cứu Hộ</Text>
              <Text style={styles.sectionSub}>Thống kê ghi nhận tháng này</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Ca Hoàn Thành</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#38BDF8' }]}>6.4m</Text>
              <Text style={styles.statLabel}>ETA Trung Bình</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>98.6%</Text>
              <Text style={styles.statLabel}>Đúng Giờ</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#FBBF24' }]}>4.9★</Text>
              <Text style={styles.statLabel}>Đánh Giá</Text>
            </View>
          </View>
        </View>

        {/* 6. Operational Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
              <Sliders size={moderateScale(18)} color="#94A3B8" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Cài Đặt Vận Hành Kíp Trực</Text>
              <Text style={styles.sectionSub}>Tùy chỉnh thông báo và kết nối bộ đàm</Text>
            </View>
          </View>

          {/* Radio Channel Setting */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.settingItemRow}
            onPress={() => setIsRadioModalVisible(true)}
          >
            <View style={styles.settingItemLeft}>
              <Radio size={moderateScale(16)} color="#38BDF8" />
              <View>
                <Text style={styles.settingItemTitle}>Kênh Bộ Đàm Nội Bộ</Text>
                <Text style={styles.settingItemSub}>{radioChannel}</Text>
              </View>
            </View>
            <ChevronRight size={moderateScale(16)} color="#64748B" />
          </TouchableOpacity>

          {/* Auto Siren Toggle */}
          <View style={styles.settingToggleRow}>
            <View style={styles.settingItemLeft}>
              <Flame size={moderateScale(16)} color="#EF4444" />
              <View style={styles.settingTextCol}>
                <Text style={styles.settingItemTitle}>Tự động bật còi ưu tiên khi nhận Code Red</Text>
                <Text style={styles.settingItemSub}>Kích hoạt đèn còi ngay khi nhận lệnh điều động</Text>
              </View>
            </View>
            <Switch
              value={autoSirenOnCodeRed}
              onValueChange={setAutoSirenOnCodeRed}
              trackColor={{ false: '#334155', true: '#EF4444' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* High Accuracy GPS Toggle */}
          <View style={styles.settingToggleRow}>
            <View style={styles.settingItemLeft}>
              <Zap size={moderateScale(16)} color="#10B981" />
              <View style={styles.settingTextCol}>
                <Text style={styles.settingItemTitle}>Đồng bộ GPS tần suất cao (Telemetry 1s)</Text>
                <Text style={styles.settingItemSub}>Tăng độ chính xác vị trí cho Trung tâm 115</Text>
              </View>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={setHighAccuracyGps}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 7. Action Buttons */}
        {/* Handover Shift Button */}
        <TouchableOpacity
          style={styles.handoverBtn}
          onPress={() => setIsHandoverModalVisible(true)}
          activeOpacity={0.8}
        >
          <FileCheck2 size={moderateScale(18)} color="#FFFFFF" />
          <Text style={styles.handoverBtnText}>Bàn Giao Ca Trực & Xe Cứu Thương</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setIsLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <LogOut size={moderateScale(18)} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Đăng Xuất Ca Trực 115</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Confirmation Modal: Handover Shift */}
      <ConfirmationModal
        visible={isHandoverModalVisible}
        type="warning"
        title="Bàn Giao Ca Trực 115"
        description="Bạn đang yêu cầu hoàn tất ca trực và bàn giao xe cứu thương 51A-999.99 cùng trang thiết bị cho kíp trực tiếp theo."
        highlightBadge="BÀN GIAO XE 51A-999.99"
        highlightText="Vui lòng đảm bảo bình Oxy đạt trên 180 Bar và vệ sinh khử trùng khoang cấp cứu."
        confirmText="Xác Nhận Bàn Giao"
        cancelText="Hủy Bỏ"
        onConfirm={handleConfirmHandover}
        onCancel={() => setIsHandoverModalVisible(false)}
      />

      {/* Confirmation Modal: Logout */}
      <ConfirmationModal
        visible={isLogoutModalVisible}
        type="danger"
        title="Đăng Xuất Khỏi Ca Trực"
        description="Bạn có chắc chắn muốn đăng xuất? Vị trí GPS của xe cứu thương sẽ tạm thời ngắt kết nối với Trung tâm Điều phối 115."
        confirmText="Đăng Xuất"
        cancelText="Ở Lại Trực"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
      />

      {/* Confirmation Modal: Radio Frequency Info */}
      <ConfirmationModal
        visible={isRadioModalVisible}
        type="info"
        title="Tần Số Vô Tuyến 115"
        description="Kênh vô tuyến chỉ huy trực ban Cứu hộ TP.HCM:"
        highlightBadge="TẦN SỐ: 154.250 MHZ"
        highlightText="Kênh 04 (Chỉ huy Vùng 2 - Quận 10 / Quận 3 / Quận 5). Bộ đàm luôn ở chế độ mở khi xe lăn bánh."
        singleButton
        confirmText="Đã Rõ"
        onConfirm={() => setIsRadioModalVisible(false)}
        onCancel={() => setIsRadioModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: moderateScale(10.5),
    color: '#94A3B8',
    marginTop: verticalScale(1),
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  dutyGreenDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#10B981',
  },
  dutyBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#10B981',
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(24),
    gap: verticalScale(12),
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0284C7',
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  heroTextInfo: {
    flex: 1,
  },
  staffIdPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
    marginBottom: verticalScale(3),
  },
  staffIdText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: 'monospace',
  },
  heroName: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#F8FAFC',
  },
  heroRole: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    marginTop: verticalScale(1),
  },
  credentialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginTop: verticalScale(10),
  },
  credBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(7),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#334155',
    gap: scale(4),
  },
  credBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#E2E8F0',
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: verticalScale(10),
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  stationText: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(10),
  },
  sectionIconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionSub: {
    fontSize: moderateScale(10),
    color: '#64748B',
  },
  vehicleDetailsBox: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehiclePlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  vehicleName: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#F1F5F9',
    flex: 1,
    marginRight: scale(6),
  },
  plateBadge: {
    backgroundColor: '#0284C7',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
  },
  plateText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  vehicleMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(6),
    justifyContent: 'space-around',
    marginBottom: verticalScale(8),
  },
  vehicleMetricItem: {
    alignItems: 'center',
  },
  vMetricLabel: {
    fontSize: moderateScale(9),
    color: '#64748B',
    fontWeight: '600',
  },
  vMetricValue: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    marginTop: verticalScale(1),
  },
  gearListRow: {
    flexDirection: 'row',
    gap: scale(4),
  },
  gearListLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#94A3B8',
  },
  gearListText: {
    fontSize: moderateScale(10),
    color: '#CBD5E1',
    flex: 1,
  },
  crewMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(10),
    padding: moderateScale(8),
    marginBottom: verticalScale(6),
    gap: scale(8),
  },
  crewMemberRowSelf: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
  },
  crewAvatarWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#38BDF8',
  },
  crewInfoGroup: {
    flex: 1,
  },
  crewName: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#F8FAFC',
  },
  crewRole: {
    fontSize: moderateScale(9.5),
    color: '#94A3B8',
  },
  crewCallBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
  },
  selfBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#38BDF8',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: scale(6),
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    alignItems: 'center',
  },
  statNumber: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: moderateScale(8.5),
    color: '#64748B',
    marginTop: verticalScale(2),
    fontWeight: '600',
    textAlign: 'center',
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
    marginRight: scale(6),
  },
  settingTextCol: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#F8FAFC',
  },
  settingItemSub: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  handoverBtn: {
    backgroundColor: '#0284C7',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  handoverBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
  },
  footerSpace: {
    height: verticalScale(20),
  },
});
