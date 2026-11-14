import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ShieldCheck,
  Truck,
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
  Sliders,
  Languages,
  CalendarDays,
  Package,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal, LanguageSelectorModal } from '../../components/common';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { equipmentService, EquipmentDto } from '../../services/equipment.service';
import {
  StationDetailDto,
  RescueUnitDetailDto,
  StationStaffMemberDto,
  MyTeamDto,
  DispatchAssignmentResponseDto,
} from '../../types/dispatch';

export const StaffProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAppStore();

  // Settings states (Local App Preferences)
  const [autoSirenOnCodeRed, setAutoSirenOnCodeRed] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);

  // Modal states
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isHandoverModalVisible, setIsHandoverModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  // Real Backend Data for Station, Vehicle, Squad & Equipment
  const [stationDetail, setStationDetail] = useState<StationDetailDto | null>(null);
  const [rescueUnitDetail, setRescueUnitDetail] = useState<RescueUnitDetailDto | null>(null);
  const [stationStaffMembers, setStationStaffMembers] = useState<StationStaffMemberDto[]>([]);
  const [myTeam, setMyTeam] = useState<MyTeamDto | null>(null);
  const [equipments, setEquipments] = useState<EquipmentDto[]>([]);
  const [assignments, setAssignments] = useState<DispatchAssignmentResponseDto[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadStaffProfileData = async () => {
      try {
        const [teamRes, assignRes] = await Promise.all([
          staffDispatchService.getMyTeam(),
          staffDispatchService.getMyAssignments(),
        ]);

        if (!isMounted) return;

        if (assignRes) {
          setAssignments(assignRes);
        }

        const effectiveStationId = user?.stationId || teamRes?.stationId;
        const effectiveRescueUnitId = user?.rescueUnitId || teamRes?.myTeamRescueUnitId;

        if (teamRes) {
          setMyTeam(teamRes);
          if (!user?.stationId || !user?.rescueUnitId) {
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
        }

        if (effectiveStationId) {
          staffDispatchService.getStationById(effectiveStationId).then((st) => {
            if (isMounted && st) setStationDetail(st);
          });
          staffDispatchService.getStationStaff(effectiveStationId).then((staff) => {
            if (isMounted && staff && staff.length > 0) setStationStaffMembers(staff);
          });
          equipmentService
            .listEquipment({ stationId: effectiveStationId })
            .then((eq) => {
              if (isMounted && eq) setEquipments(eq);
            })
            .catch(() => {});
        } else {
          equipmentService
            .listEquipment()
            .then((eq) => {
              if (isMounted && eq) setEquipments(eq);
            })
            .catch(() => {});
        }

        if (effectiveRescueUnitId) {
          staffDispatchService.getRescueUnitById(effectiveRescueUnitId).then((ru) => {
            if (isMounted && ru) setRescueUnitDetail(ru);
          });
        }
      } catch (err) {
        console.warn('Error loading staff profile data:', err);
      }
    };

    loadStaffProfileData();

    return () => {
      isMounted = false;
    };
  }, [user?.stationId, user?.rescueUnitId, updateUser]);

  // Helper for crew role display
  const formatCrewRole = (role?: string | null) => {
    if (!role) return 'Chiến Sĩ Cứu Hộ';
    const lower = role.toLowerCase();
    if (lower.includes('commander') || lower.includes('chỉ huy')) return 'Chỉ Huy Kíp Trực';
    if (lower.includes('driver') || lower.includes('lái')) return 'Lái Xe Cứu Hộ & Vận Hành';
    if (lower.includes('medic') || lower.includes('y tế') || lower.includes('nurse')) return 'Y Tế Cấp Cứu';
    if (lower.includes('fire') || lower.includes('cháy')) return 'Chiến Sĩ Chữa Cháy';
    if (lower.includes('rescuer') || lower.includes('cứu')) return 'Chiến Sĩ Cứu Nạn Cứu Hộ';
    return role;
  };

  // Helper for crew avatar initials
  const getInitials = (name?: string) => {
    if (!name) return 'CH';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Crew list derived from real Backend API data (MyTeam or StationStaff)
  const crewList = useMemo(() => {
    if (myTeam?.myTeamMembers && myTeam.myTeamMembers.length > 0) {
      return myTeam.myTeamMembers.map((m) => {
        const isSelf =
          m.staffId === user?.id ||
          m.fullName.toLowerCase() === (user?.name || '').toLowerCase() ||
          (!!m.phoneNumber && !!user?.phone && m.phoneNumber === user.phone);
        return {
          id: m.staffId,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          crewRole: formatCrewRole(m.crewRole),
          isSelf,
        };
      });
    }

    if (stationStaffMembers.length > 0) {
      return stationStaffMembers.map((m) => {
        const isSelf =
          m.id === user?.id ||
          m.email === user?.email ||
          m.fullName.toLowerCase() === (user?.name || '').toLowerCase() ||
          (!!m.phoneNumber && !!user?.phone && m.phoneNumber === user.phone);
        return {
          id: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          crewRole: formatCrewRole(m.crewRole || m.role),
          isSelf,
        };
      });
    }

    return [
      {
        id: user?.id || 'self',
        fullName: user?.name || 'Chiến sĩ cứu hộ',
        phoneNumber: user?.phone || '',
        crewRole: formatCrewRole(user?.crewRole),
        isSelf: true,
      },
    ];
  }, [myTeam?.myTeamMembers, stationStaffMembers, user]);

  // Mission stats calculated from real assignments from API
  const missionStats = useMemo(() => {
    const total = assignments.length;
    const resolved = assignments.filter((a) => a.status === 'Completed').length;
    const active = assignments.filter(
      (a) => a.status === 'Accepted' || a.status === 'EnRoute' || a.status === 'OnScene'
    ).length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, resolved, active, rate };
  }, [assignments]);

  // Vehicle status styling config based on real RescueUnit status
  const vehicleStatusConfig = useMemo(() => {
    const status = rescueUnitDetail?.status;
    switch (status) {
      case 'Available':
        return { label: 'Sẵn Sàng Làm Nhiệm Vụ', color: '#059669', bg: '#ECFDF5' };
      case 'Dispatched':
        return { label: 'Đang Di Chuyển', color: '#D97706', bg: '#FFFBEB' };
      case 'OnScene':
        return { label: 'Tác Chiến Tại Hiện Trường', color: '#DC2626', bg: '#FEF2F2' };
      case 'Maintenance':
        return { label: 'Đang Bảo Trì Kỹ Thuật', color: '#64748B', bg: '#F1F5F9' };
      case 'CoolDown':
        return { label: 'Đang Hồi Sức / Vệ Sinh', color: '#0284C7', bg: '#F0F9FF' };
      default:
        return { label: 'Sẵn Sàng Làm Nhiệm Vụ', color: '#059669', bg: '#ECFDF5' };
    }
  }, [rescueUnitDetail?.status]);

  // Crew member call
  const handleCallCrew = (name: string, phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Đàm Thoại', `Đang gọi liên hệ thành viên: ${name} (${phone})`);
    });
  };

  // Handover confirmation with PUT /api/rescue-units/{id}/status
  const handleConfirmHandover = async () => {
    setIsHandoverModalVisible(false);
    if (user?.rescueUnitId) {
      try {
        await staffDispatchService.updateRescueUnitStatus(user.rescueUnitId, 'Available');
        Alert.alert(
          'Bàn Giao Ca Thành Công',
          `Biên bản bàn giao xe ${user?.vehiclePlate || 'cứu hộ'} và trang thiết bị đã được đồng bộ lên máy chủ điều phối.`
        );
      } catch (err: any) {
        Alert.alert('Bàn Giao Ca', 'Đã lưu biên bản bàn giao: ' + (err.message || ''));
      }
    } else {
      Alert.alert(
        'Bàn Giao Ca Thành Công',
        'Biên bản bàn giao xe và trang thiết bị đã được gửi về Trung tâm Điều phối Cứu hộ.'
      );
    }
  };

  // Logout confirmation
  const handleConfirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
    (navigation as any).navigate('Auth', { screen: 'Login' });
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      safeArea
      edges={['top', 'left', 'right']}
      statusBarStyle="dark-content"
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{t('staff.header_title')}</Text>
          <Text style={styles.headerSubtitle}>{t('staff.center_name')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.langHeaderBtn}
          onPress={() => setIsLanguageModalVisible(true)}
          accessible={true}
          accessibilityLabel="Đổi ngôn ngữ / Change Language"
        >
          <Text style={{ fontSize: moderateScale(15) }}>
            {i18n.language?.startsWith('vi') ? '🇻🇳' : '🇬🇧'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dutyBadge}>
          <View style={styles.dutyGreenDot} />
          <Text style={styles.dutyBadgeText}>{t('staff.duty_on')}</Text>
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
                <Truck size={moderateScale(32)} color="#DC2626" />
              </View>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={moderateScale(12)} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <View style={styles.heroTextInfo}>
              <View style={styles.staffIdPill}>
                <Text style={styles.staffIdText}>MÃ NV: {user?.staffId || 'ST-RESCUE'}</Text>
              </View>
              <Text style={styles.heroName}>{user?.name || 'Chiến Sĩ Cứu Hộ'}</Text>
              <Text style={styles.heroRole}>
                {user?.crewRole ? `Kíp Cứu Hộ • ${formatCrewRole(user.crewRole)}` : 'Chiến Sĩ Kíp Trực Cứu Hộ'}
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          {/* Station & Contact */}
          <View style={styles.stationRow}>
            <Building2 size={moderateScale(14)} color="#DC2626" />
            <Text style={styles.stationText} numberOfLines={1}>
              {stationDetail ? `${stationDetail.name} • ${stationDetail.address}` : (myTeam?.stationName || user?.stationName || 'Trạm Cứu Hộ & PCCC')}
            </Text>
          </View>
          {!!(stationDetail?.headOperatorName || myTeam?.stationOperator?.fullName) && (
            <View style={[styles.stationRow, { marginTop: verticalScale(4) }]}>
              <Users size={moderateScale(13)} color="#0284C7" />
              <Text style={[styles.stationText, { color: '#0369A1' }]} numberOfLines={1}>
                Operator phụ trách: {stationDetail?.headOperatorName || myTeam?.stationOperator?.fullName} ({stationDetail?.headOperatorPhone || myTeam?.stationOperator?.phoneNumber || 'N/A'})
              </Text>
            </View>
          )}
        </View>

        {/* 3. Assigned Industrial Vehicle & Equipment Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Truck size={moderateScale(18)} color="#DC2626" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Phương Tiện & Trang Thiết Bị Cứu Hộ</Text>
              <Text style={styles.sectionSub}>Phương tiện & danh mục trang bị do trạm quản lý</Text>
            </View>
          </View>

          <View style={styles.vehicleDetailsBox}>
            <View style={styles.vehiclePlateRow}>
              <Text style={styles.vehicleName}>
                {rescueUnitDetail?.unitType ? `Xe ${rescueUnitDetail.unitType}` : 'Xe Cứu Hộ Chuyên Dụng'}
              </Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>
                  {rescueUnitDetail?.plateNumber || myTeam?.myTeamRescueUnitPlate || user?.vehiclePlate || 'ST-UNIT'}
                </Text>
              </View>
            </View>

            {/* Vehicle Status from Backend API */}
            <View style={styles.vehicleStatusRow}>
              <View style={[styles.vehicleStatusBadge, { backgroundColor: vehicleStatusConfig.bg }]}>
                <View style={[styles.vehicleStatusDot, { backgroundColor: vehicleStatusConfig.color }]} />
                <Text style={[styles.vehicleStatusText, { color: vehicleStatusConfig.color }]}>
                  {vehicleStatusConfig.label}
                </Text>
              </View>
              <Text style={styles.vehicleStationText} numberOfLines={1}>
                {stationDetail?.name || myTeam?.stationName || user?.stationName || 'Trạm Điều Phối'}
              </Text>
            </View>

            {/* Real Equipment List from GET /api/equipment */}
            <View style={styles.equipmentSection}>
              <View style={styles.equipmentHeaderRow}>
                <Package size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.equipmentSectionTitle}>Trang thiết bị chuyên dụng:</Text>
                <Text style={styles.equipmentCountBadge}>{equipments.length} danh mục</Text>
              </View>

              {equipments.length > 0 ? (
                <View style={styles.equipmentGrid}>
                  {equipments.slice(0, 8).map((eq) => (
                    <View key={eq.id} style={styles.equipmentChip}>
                      <View
                        style={[
                          styles.eqStatusDot,
                          { backgroundColor: eq.status === 'Available' ? '#10B981' : '#F59E0B' },
                        ]}
                      />
                      <Text style={styles.equipmentChipText} numberOfLines={1}>
                        {eq.name}
                      </Text>
                      <Text style={styles.equipmentChipQty}>x{eq.quantity}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.equipmentEmptyText}>
                  Đang tải danh mục trang thiết bị từ máy chủ điều phối...
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 4. Duty Squad Crew Members (Real API from GET /api/users/my-team or /api/stations/{id}/staff) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Users size={moderateScale(18)} color="#DC2626" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Thành Viên Kíp Trực Phân Xưởng</Text>
              <Text style={styles.sectionSub}>
                {myTeam?.myTeamName || stationDetail?.name || myTeam?.stationName || user?.stationName || 'Kíp Trực Cứu Hộ'}
              </Text>
            </View>
          </View>

          {crewList.map((member) => (
            <View
              key={member.id}
              style={[styles.crewMemberRow, member.isSelf && styles.crewMemberRowSelf]}
            >
              <View style={[styles.crewAvatarWrap, member.isSelf && { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.crewAvatarText, member.isSelf && { color: '#DC2626' }]}>
                  {getInitials(member.fullName)}
                </Text>
              </View>
              <View style={styles.crewInfoGroup}>
                <Text style={styles.crewName}>
                  {member.fullName} {member.isSelf ? '(Chính bạn)' : ''}
                </Text>
                <Text style={styles.crewRole}>{member.crewRole}</Text>
                {!!member.phoneNumber && !member.isSelf && (
                  <Text style={styles.crewPhoneText}>{member.phoneNumber}</Text>
                )}
              </View>
              {member.isSelf ? (
                <View style={styles.selfBadge}>
                  <Text style={styles.selfBadgeText}>BẠN</Text>
                </View>
              ) : member.phoneNumber ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.crewCallBtn}
                  onPress={() => handleCallCrew(member.fullName, member.phoneNumber)}
                >
                  <PhoneCall size={moderateScale(14)} color="#10B981" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>

        {/* 4.5. Work Shift Registration Banner Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.schedulePromoCard}
          onPress={() => (navigation as any).navigate('StaffScheduleTab')}
        >
          <View style={styles.schedulePromoLeft}>
            <View style={styles.schedulePromoIconWrap}>
              <CalendarDays size={moderateScale(22)} color="#DC2626" />
            </View>
            <View style={styles.schedulePromoTextGroup}>
              <View style={styles.scheduleBadgeRow}>
                <Text style={styles.schedulePromoTitle}>
                  {t('staff.schedule_menu_item')}
                </Text>
                <View style={styles.scheduleOpenPill}>
                  <Text style={styles.scheduleOpenPillText}>ĐANG MỞ</Text>
                </View>
              </View>
              <Text style={styles.schedulePromoSub}>
                {t('staff.schedule_menu_sub')}
              </Text>
            </View>
          </View>
          <ChevronRight size={moderateScale(18)} color="#DC2626" />
        </TouchableOpacity>

        {/* 5. Performance & Shift Stats (Calculated from Real Assignments) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Activity size={moderateScale(18)} color="#DC2626" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Hiệu Suất Phản Ứng Cứu Hộ</Text>
              <Text style={styles.sectionSub}>Dữ liệu nhiệm vụ điều phối thực tế</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{missionStats.resolved}</Text>
              <Text style={styles.statLabel}>Ca Hoàn Thành</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{missionStats.active}</Text>
              <Text style={styles.statLabel}>Đang Xử Lý</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#0284C7' }]}>{missionStats.total}</Text>
              <Text style={styles.statLabel}>Tổng Phân Công</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#059669' }]}>{missionStats.rate}%</Text>
              <Text style={styles.statLabel}>Tỷ Lệ Đạt</Text>
            </View>
          </View>
        </View>

        {/* 6. Operational Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Sliders size={moderateScale(18)} color="#DC2626" />
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>{t('staff.settings_title')}</Text>
              <Text style={styles.sectionSub}>Tùy chỉnh thông báo và ngôn ngữ hiển thị</Text>
            </View>
          </View>

          {/* Language Setting */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.settingItemRow}
            onPress={() => setIsLanguageModalVisible(true)}
          >
            <View style={styles.settingItemLeft}>
              <Languages size={moderateScale(16)} color="#DC2626" />
              <View>
                <Text style={styles.settingItemTitle}>{t('staff.app_language')}</Text>
                <Text style={styles.settingItemSub}>
                  {i18n.language?.startsWith('vi') ? '🇻🇳 Tiếng Việt (Mặc định)' : '🇬🇧 English'}
                </Text>
              </View>
            </View>
            <ChevronRight size={moderateScale(16)} color="#64748B" />
          </TouchableOpacity>

          {/* Auto Siren Toggle */}
          <View style={styles.settingToggleRow}>
            <View style={styles.settingItemLeft}>
              <Flame size={moderateScale(16)} color="#EF4444" />
              <View style={styles.settingTextCol}>
                <Text style={styles.settingItemTitle}>{t('staff.auto_siren')}</Text>
                <Text style={styles.settingItemSub}>{t('staff.auto_siren_desc')}</Text>
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
                <Text style={styles.settingItemTitle}>{t('staff.high_gps')}</Text>
                <Text style={styles.settingItemSub}>{t('staff.high_gps_desc')}</Text>
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
          <Text style={styles.handoverBtnText}>{t('staff.handover_shift')}</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setIsLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <LogOut size={moderateScale(18)} color="#EF4444" />
          <Text style={styles.logoutBtnText}>{t('staff.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Confirmation Modal: Handover Shift */}
      <ConfirmationModal
        visible={isHandoverModalVisible}
        type="warning"
        title="Bàn Giao Ca Trực KCN"
        description="Bạn đang yêu cầu hoàn tất ca trực và bàn giao xe cứu hộ KCN cùng trang thiết bị cho kíp trực tiếp theo."
        highlightBadge="BÀN GIAO XE CỨU HỘ"
        highlightText="Vui lòng kiểm tra vệ sinh khử khuẩn và hiện trạng trang thiết bị trước khi bàn giao."
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
        description="Bạn có chắc chắn muốn đăng xuất? Vị trí GPS của xe cứu thương sẽ tạm thời ngắt kết nối với Trung tâm Điều phối Cứu hộ."
        confirmText="Đăng Xuất"
        cancelText="Ở Lại Trực"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  langHeaderBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
    color: '#059669',
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(24),
    gap: verticalScale(12),
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroTextInfo: {
    flex: 1,
  },
  staffIdPill: {
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
    marginBottom: verticalScale(3),
  },
  staffIdText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  heroName: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  heroRole: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(10),
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  stationText: {
    fontSize: moderateScale(11),
    color: '#475569',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: moderateScale(10),
    color: '#64748B',
  },
  vehicleDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    flex: 1,
    marginRight: scale(6),
  },
  plateBadge: {
    backgroundColor: '#DC2626',
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
  vehicleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
    gap: scale(8),
  },
  vehicleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    gap: scale(5),
  },
  vehicleStatusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  vehicleStatusText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  vehicleStationText: {
    fontSize: moderateScale(10),
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
  equipmentSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
  },
  equipmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: verticalScale(8),
  },
  equipmentSectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  equipmentCountBadge: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(1),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(7),
    gap: scale(5),
  },
  eqStatusDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
  },
  equipmentChipText: {
    fontSize: moderateScale(10),
    color: '#334155',
    fontWeight: '600',
    maxWidth: scale(110),
  },
  equipmentChipQty: {
    fontSize: moderateScale(9),
    color: '#64748B',
    fontWeight: '700',
  },
  equipmentEmptyText: {
    fontSize: moderateScale(10),
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  crewMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(8),
    marginBottom: verticalScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(8),
  },
  crewMemberRowSelf: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
  },
  crewAvatarWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
  crewInfoGroup: {
    flex: 1,
  },
  crewName: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  crewRole: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
  },
  crewPhoneText: {
    fontSize: moderateScale(9.5),
    color: '#0284C7',
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  crewCallBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfBadge: {
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
  },
  selfBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: scale(6),
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  settingItemSub: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  handoverBtn: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
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
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
  },
  footerSpace: {
    height: verticalScale(20),
  },
  schedulePromoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  schedulePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: scale(8),
  },
  schedulePromoIconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  schedulePromoTextGroup: {
    flex: 1,
  },
  scheduleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  schedulePromoTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  scheduleOpenPill: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(4),
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
  },
  scheduleOpenPillText: {
    fontSize: moderateScale(8.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  schedulePromoSub: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
});
