import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import {
  User,
  ShieldCheck,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  HeartPulse,
  AlertTriangle,
  Pill,
  Accessibility,
  PhoneCall,
  MessageSquare,
  Users,
  Languages,
  FileText,
  Edit3,
  ChevronRight,
  Info,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  LogOut,
  Truck,
  Repeat,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';

import { BloodTypeBadge } from '../../components/profile/BloodTypeBadge';
import { EmergencyBadge } from '../../components/profile/EmergencyBadge';
import { IceContactCard } from '../../components/profile/IceContactCard';
import { MedicalIdCardModal } from '../../components/profile/MedicalIdCardModal';
import {
  ProfileEditModal,
  TabKey,
} from '../../components/profile/ProfileEditModal';
import { AccordionSection, SummaryBadgeItem } from '../../components/profile/AccordionSection';
import { UserEmergencyProfile } from '../../types/profile';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, user, switchDemoRole } = useAppStore();
  const {
    profile,
    loadProfile,
    updateProfile,
    toggleAutoSendSms,
    removeIceContact,
  } = useProfileStore();

  const [isMedicalModalVisible, setIsMedicalModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editInitialTab, setEditInitialTab] = useState<TabKey>('identity');

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất Tài Khoản',
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống điều phối cứu hộ?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: () => {
            logout();
            (navigation as any).navigate('Auth', { screen: 'Login' });
          },
        },
      ]
    );
  };

  const handleSwitchRole = () => {
    const nextRole = user?.role === 'staff' ? 'citizen' : 'staff';
    const nextRoleName = nextRole === 'staff' ? 'Đội Cứu Hộ 115' : 'Người Dân';
    Alert.alert(
      'Chuyển Đổi Giao Diện Vai Trò',
      `Bạn có muốn chuyển sang giao diện dành cho [${nextRoleName}]?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chuyển Đổi Ngay',
          onPress: () => {
            switchDemoRole(nextRole);
          },
        },
      ]
    );
  };


  // Accordion state: Track which cards are expanded
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    identity: false,
    medical: true, // Medical ID expanded by default for rescue priority
    ice: false,
    special: false,
  });

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { medicalId, ice, specialInfo } = profile;

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isAllExpanded = Object.values(expandedCards).every(Boolean);

  const toggleExpandAll = () => {
    const nextState = !isAllExpanded;
    setExpandedCards({
      identity: nextState,
      medical: nextState,
      ice: nextState,
      special: nextState,
    });
  };

  const handleOpenEditTab = (tab: TabKey) => {
    setEditInitialTab(tab);
    setIsEditModalVisible(true);
  };

  const handleToggleSms = (val: boolean) => {
    toggleAutoSendSms(val);
    Alert.alert(
      val ? 'Đã bật tự động gửi SMS' : 'Đã tắt tự động gửi SMS',
      val
        ? 'Khi bạn nhấn SOS, toạ độ GPS chính xác sẽ được tự động gửi qua tin nhắn SMS đến các liên hệ ICE.'
        : 'Hệ thống sẽ không tự động gửi tin nhắn SMS khi bạn kích hoạt SOS.'
    );
  };

  const handleSaveProfile = (updated: UserEmergencyProfile) => {
    updateProfile(updated);
  };

  // Summary badges for collapsed preview
  const identityBadges: SummaryBadgeItem[] = [
    { text: profile.fullName, color: '#FFFFFF', bg: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' },
    { text: profile.phoneNumber, color: '#38BDF8' },
    { text: 'Đã xác thực', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  ];

  const medicalBadges: SummaryBadgeItem[] = [
    { text: `Máu: ${medicalId.bloodType || 'O+'}`, color: '#FFFFFF', bg: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' },
    { text: `${medicalId.allergies?.length || 0} Dị ứng`, color: '#FCA5A5' },
    { text: `${medicalId.chronicConditions?.length || 0} Bệnh nền`, color: '#FCD34D' },
  ];

  const iceBadges: SummaryBadgeItem[] = [
    { text: `${ice.contacts?.length || 0} Người thân`, color: '#FFFFFF', bg: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
    {
      text: ice.autoSendSmsOnSos ? 'SMS SOS: BẬT' : 'SMS SOS: TẮT',
      color: ice.autoSendSmsOnSos ? '#10B981' : '#94A3B8',
    },
  ];

  const specialBadges: SummaryBadgeItem[] = [
    { text: specialInfo.preferredLanguage || 'Tiếng Việt', color: '#FCD34D' },
    { text: specialInfo.dependentsNote ? 'Có người phụ thuộc' : 'Không có phụ thuộc', color: '#CBD5E1' },
  ];

  return (
    <ScreenContainer
      backgroundColor="#0F172A"
      edges={['top', 'left', 'right']}
      style={styles.container}
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTextGroup}>
          <Text
            style={styles.headerTitle}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            Hồ Sơ Cứu Hộ
          </Text>
          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            Medical ID & Thông Tin Định Danh
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => handleOpenEditTab('identity')}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="Chỉnh sửa hồ sơ"
        >
          <Edit3 size={moderateScale(15)} color="#38BDF8" />
          <Text
            style={styles.editHeaderBtnText}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            Chỉnh sửa
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Hero Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrapper}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={36} color="#94A3B8" />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroTextInfo}>
              <View style={styles.statusPill}>
                <Sparkles size={11} color="#10B981" />
                <Text style={styles.statusPillText}>HỒ SƠ ĐÃ SẴN SÀNG CỨU HỘ</Text>
              </View>
              <Text style={styles.heroName}>{profile.fullName}</Text>
              <Text style={styles.heroPhone}>{profile.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroAddressRow}>
            <MapPin size={15} color="#38BDF8" style={styles.addressIcon} />
            <Text style={styles.heroAddressText} numberOfLines={2}>
              {profile.address}
            </Text>
          </View>
        </View>

        {/* 3. Hero Action: Open Emergency Medical ID Sheet */}
        <TouchableOpacity
          style={styles.medicalIdBanner}
          activeOpacity={0.8}
          onPress={() => setIsMedicalModalVisible(true)}
          accessible={true}
          accessibilityLabel="Mở thẻ y tế cấp cứu khẩn cấp"
        >
          <View style={styles.medicalBannerLeft}>
            <View style={styles.medicalBannerIconWrap}>
              <HeartPulse size={24} color="#FFFFFF" />
            </View>
            <View style={styles.medicalBannerTextCol}>
              <Text style={styles.medicalBannerTitle}>
                THẺ Y TẾ CẤP CỨU (MEDICAL ID)
              </Text>
              <Text style={styles.medicalBannerSubtitle}>
                Chế độ hiển thị nhanh cho Bác sĩ & Cứu hộ 114/115
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#FCA5A5" />
        </TouchableOpacity>

        {/* 4. Controls: Section List Title & Toggle All Button */}
        <View style={styles.controlsRow}>
          <View style={styles.controlsLeft}>
            <Layers size={16} color="#38BDF8" />
            <Text style={styles.controlsTitle}>CÁC NHÓM THÔNG TIN CỨU HỘ</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleAllBtn}
            onPress={toggleExpandAll}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleAllText}>
              {isAllExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* CARD 1: THÔNG TIN ĐỊNH DANH & LIÊN LẠC (EXPANDABLE)       */}
        {/* ========================================================= */}
        <AccordionSection
          id="identity"
          title="1. Định Danh & Liên Lạc"
          subtitle="Xác thực danh tính & nhận diện nạn nhân tại hiện trường"
          icon={<User size={20} color="#38BDF8" />}
          iconBgColor="rgba(56, 189, 248, 0.15)"
          titleColor="#38BDF8"
          isExpanded={!!expandedCards.identity}
          onToggle={() => toggleCard('identity')}
          summaryBadges={identityBadges}
          onQuickEdit={() => handleOpenEditTab('identity')}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <User size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Họ và tên đầy đủ</Text>
              </View>
              <Text style={styles.infoValue}>{profile.fullName}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Phone size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Số điện thoại chính chủ</Text>
              </View>
              <Text style={[styles.infoValue, { color: '#38BDF8' }]}>
                {profile.phoneNumber}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <CreditCard size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Số CCCD / CMND</Text>
              </View>
              <Text style={styles.infoValue}>
                {profile.idCardNumber || 'Chưa cập nhật'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Calendar size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Ngày sinh & Giới tính</Text>
              </View>
              <Text style={styles.infoValue}>
                {profile.dateOfBirth || '--'} • {profile.gender || 'Nam'}
              </Text>
            </View>

            <View style={styles.addressSection}>
              <View style={styles.infoLabelRow}>
                <MapPin size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Nơi ở thường trú</Text>
              </View>
              <View style={styles.addressBox}>
                <Text style={styles.addressBoxText}>
                  {profile.address || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>
          </View>
        </AccordionSection>

        {/* ========================================================= */}
        {/* CARD 2: THÔNG TIN Y TẾ KHẨN CẤP (MEDICAL ID - EXPANDABLE)  */}
        {/* ========================================================= */}
        <AccordionSection
          id="medical"
          title="2. Y Tế Khẩn Cấp (Medical ID)"
          subtitle="Chuẩn bị phác đồ cấp cứu & phòng ngừa sốc phản vệ"
          icon={<HeartPulse size={20} color="#EF4444" />}
          iconBgColor="rgba(239, 68, 68, 0.15)"
          titleColor="#EF4444"
          isExpanded={!!expandedCards.medical}
          onToggle={() => toggleCard('medical')}
          summaryBadges={medicalBadges}
          onQuickEdit={() => handleOpenEditTab('medical')}
        >
          <View style={styles.cardContent}>
            {/* Blood Type Display */}
            <View style={styles.bloodTypeCardRow}>
              <BloodTypeBadge bloodType={medicalId.bloodType} size="medium" />
              <View style={styles.bloodTypeNote}>
                <Text style={styles.bloodTypeNoteTitle}>Nhóm máu chỉ định</Text>
                <Text style={styles.bloodTypeNoteDesc}>
                  Hỗ trợ lực lượng 115 chuẩn bị sẵn túi máu tương thích khi tiếp cận.
                </Text>
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <AlertTriangle size={15} color="#EF4444" />
                <Text style={[styles.subCatTitle, { color: '#FCA5A5' }]}>
                  Dị ứng (Thuốc / Thức ăn / Môi trường)
                </Text>
              </View>
              {medicalId.allergies && medicalId.allergies.length > 0 ? (
                <View style={styles.badgeFlexWrap}>
                  {medicalId.allergies.map((alg, index) => (
                    <EmergencyBadge
                      key={`alg_${index}`}
                      label={alg}
                      variant="allergy"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNoteText}>Chưa ghi nhận dị ứng</Text>
              )}
            </View>

            {/* Chronic Conditions */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <HeartPulse size={15} color="#F59E0B" />
                <Text style={[styles.subCatTitle, { color: '#FCD34D' }]}>
                  Tiền sử bệnh nền mãn tính
                </Text>
              </View>
              {medicalId.chronicConditions &&
              medicalId.chronicConditions.length > 0 ? (
                <View style={styles.badgeFlexWrap}>
                  {medicalId.chronicConditions.map((cond, index) => (
                    <EmergencyBadge
                      key={`cond_${index}`}
                      label={cond}
                      variant="condition"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNoteText}>Không có bệnh nền mãn tính</Text>
              )}
            </View>

            {/* Medications */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <Pill size={15} color="#38BDF8" />
                <Text style={[styles.subCatTitle, { color: '#7DD3FC' }]}>
                  Thuốc đang điều trị thường xuyên
                </Text>
              </View>
              {medicalId.currentMedications &&
              medicalId.currentMedications.length > 0 ? (
                <View style={styles.badgeFlexWrap}>
                  {medicalId.currentMedications.map((med, index) => (
                    <EmergencyBadge
                      key={`med_${index}`}
                      label={med}
                      variant="medication"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNoteText}>Không dùng thuốc định kỳ</Text>
              )}
            </View>

            {/* Mobility / Disability */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <Accessibility size={15} color="#A855F7" />
                <Text style={[styles.subCatTitle, { color: '#D8B4FE' }]}>
                  Tình trạng khuyết tật & Khó khăn vận động
                </Text>
              </View>
              {medicalId.mobilityLimitations &&
              medicalId.mobilityLimitations.length > 0 ? (
                <View style={styles.badgeFlexWrap}>
                  {medicalId.mobilityLimitations.map((mob, index) => (
                    <EmergencyBadge
                      key={`mob_${index}`}
                      label={mob}
                      variant="mobility"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNoteText}>Vận động bình thường</Text>
              )}
            </View>

            {medicalId.additionalNotes ? (
              <View style={styles.additionalNoteBox}>
                <Info size={14} color="#94A3B8" />
                <Text style={styles.additionalNoteText}>
                  {medicalId.additionalNotes}
                </Text>
              </View>
            ) : null}
          </View>
        </AccordionSection>

        {/* ========================================================= */}
        {/* CARD 3: LIÊN HỆ KHẨN CẤP (ICE - EXPANDABLE)               */}
        {/* ========================================================= */}
        <AccordionSection
          id="ice"
          title="3. Người Thân Khẩn Cấp (ICE)"
          subtitle="Báo tin tức thời & liên lạc người thân khi nguy kịch"
          icon={<PhoneCall size={20} color="#10B981" />}
          iconBgColor="rgba(16, 185, 129, 0.15)"
          titleColor="#10B981"
          isExpanded={!!expandedCards.ice}
          onToggle={() => toggleCard('ice')}
          summaryBadges={iceBadges}
          onQuickEdit={() => handleOpenEditTab('ice')}
        >
          <View style={styles.cardContent}>
            {/* Toggle: Auto Send SMS GPS */}
            <View style={styles.smsToggleBox}>
              <View style={styles.smsToggleTextCol}>
                <View style={styles.smsTagRow}>
                  <MessageSquare size={13} color="#38BDF8" />
                  <Text style={styles.smsTag}>TỰ ĐỘNG GỬI SMS</Text>
                </View>
                <Text style={styles.smsToggleTitle}>
                  Gửi toạ độ cho người thân khi bấm SOS
                </Text>
                <Text style={styles.smsToggleDesc}>
                  Khi bấm SOS, tự động gửi tin nhắn SMS chứa liên kết GPS tới các số điện thoại ICE bên dưới.
                </Text>
              </View>

              <Switch
                value={ice.autoSendSmsOnSos}
                onValueChange={handleToggleSms}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* List of ICE Contacts */}
            <Text style={styles.iceListHeader}>
              Danh sách người thân nhận báo động:
            </Text>

            {ice.contacts && ice.contacts.length > 0 ? (
              ice.contacts.map((contact) => (
                <IceContactCard
                  key={contact.id}
                  contact={contact}
                  onDelete={removeIceContact}
                  showActions={true}
                />
              ))
            ) : (
              <View style={styles.noIceBox}>
                <Text style={styles.noIceText}>
                  Chưa có người liên hệ khẩn cấp nào. Hãy bấm "Chỉnh sửa" để thêm người thân.
                </Text>
              </View>
            )}
          </View>
        </AccordionSection>

        {/* ========================================================= */}
        {/* CARD 4: THÔNG TIN BỔ SUNG ĐẶC THÙ (EXPANDABLE)           */}
        {/* ========================================================= */}
        <AccordionSection
          id="special"
          title="4. Thông Tin Đặc Thù & Gia Đình"
          subtitle="Ưu tiên nguồn lực cứu nạn khi sơ tán trẻ nhỏ & người già"
          icon={<Users size={20} color="#F59E0B" />}
          iconBgColor="rgba(245, 158, 11, 0.15)"
          titleColor="#F59E0B"
          isExpanded={!!expandedCards.special}
          onToggle={() => toggleCard('special')}
          summaryBadges={specialBadges}
          onQuickEdit={() => handleOpenEditTab('special')}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Languages size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Ngôn ngữ ưu tiên giao tiếp</Text>
              </View>
              <Text style={[styles.infoValue, { fontWeight: '700' }]}>
                {specialInfo.preferredLanguage || 'Tiếng Việt'}
              </Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.infoLabelRow}>
                <FileText size={14} color="#94A3B8" />
                <Text style={styles.infoLabel}>Ghi chú người phụ thuộc</Text>
              </View>
            </View>

            <View style={styles.dependentsBox}>
              <Text style={styles.dependentsText}>
                {specialInfo.dependentsNote || 'Không có ghi chú người phụ thuộc đặc biệt.'}
              </Text>
            </View>
          </View>
        </AccordionSection>

        {/* Bottom Button to Edit Everything */}
        <TouchableOpacity
          style={styles.fullEditBtn}
          onPress={() => handleOpenEditTab('identity')}
          activeOpacity={0.8}
        >
          <Edit3 size={18} color="#FFFFFF" />
          <Text style={styles.fullEditBtnText}>Cập Nhật Toàn Bộ Hồ Sơ</Text>
        </TouchableOpacity>

        {/* Role Switcher Quick Access Card */}
        <View style={styles.roleCard}>
          <View style={styles.roleCardLeft}>
            <View
              style={[
                styles.roleIconWrap,
                user?.role === 'staff'
                  ? styles.roleIconWrapStaff
                  : styles.roleIconWrapCitizen,
              ]}
            >
              {user?.role === 'staff' ? (
                <Truck size={moderateScale(18)} color="#38BDF8" />
              ) : (
                <User size={moderateScale(18)} color="#EF4444" />
              )}
            </View>
            <View style={styles.roleInfoTextGroup}>
              <Text style={styles.roleCurrentLabel}>VAI TRÒ GIAO DIỆN HIỆN TẠI</Text>
              <Text style={styles.roleCurrentTitle}>
                {user?.role === 'staff'
                  ? 'Đội Cứu Hộ 115 (Staff)'
                  : 'Người Dân (Citizen)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchRoleBtn}
            activeOpacity={0.85}
            onPress={handleSwitchRole}
          >
            <Repeat size={moderateScale(14)} color="#FFFFFF" />
            <Text style={styles.switchRoleBtnText}>Đổi Role</Text>
          </TouchableOpacity>
        </View>

        {/* Logout / Switch Account Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Đăng Xuất / Đổi Tài Khoản</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>


      {/* Modal: Full Emergency Medical ID Sheet */}
      <MedicalIdCardModal
        visible={isMedicalModalVisible}
        onClose={() => setIsMedicalModalVisible(false)}
        profile={profile}
      />

      {/* Modal: Edit Profile */}
      <ProfileEditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        profile={profile}
        onSave={handleSaveProfile}
        initialTab={editInitialTab}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
    width: '100%',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: moderateScale(10),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    gap: moderateScale(5),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    flexShrink: 0,
  },
  editHeaderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    color: '#38BDF8',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#38BDF8',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  heroTextInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroPhone: {
    fontSize: 13.5,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  heroAddressText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 17,
  },
  medicalIdBanner: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  medicalBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  medicalBannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalBannerTextCol: {
    flex: 1,
  },
  medicalBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  medicalBannerSubtitle: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: -4,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  toggleAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  addressSection: {
    paddingTop: 2,
    gap: 8,
  },
  addressBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressBoxText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    lineHeight: 19,
  },
  bloodTypeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  bloodTypeNote: {
    flex: 1,
  },
  bloodTypeNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F87171',
  },
  bloodTypeNoteDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  subCategoryBlock: {
    marginTop: 4,
  },
  subCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  subCatTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  badgeFlexWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyNoteText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  additionalNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  additionalNoteText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 16,
  },
  smsToggleBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  smsToggleTextCol: {
    flex: 1,
    marginRight: 10,
  },
  smsTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  smsTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  smsToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  smsToggleDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  iceListHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
  },
  noIceBox: {
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  noIceText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  dependentsBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dependentsText: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  fullEditBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  fullEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginTop: 12,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 14.5,
    fontWeight: '700',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 12,
  },
  roleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roleIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapCitizen: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  roleIconWrapStaff: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  roleInfoTextGroup: {
    flex: 1,
  },
  roleCurrentLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  roleCurrentTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 1,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(10),
    gap: scale(4),
  },
  switchRoleBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerSpace: {
    height: 30,
  },
});

