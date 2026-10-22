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
  Modal,
  TextInput,
  ActivityIndicator,
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
  Camera,
  X,
  Mail,
  Images,
} from 'lucide-react-native';
import { mediaService } from '../../services/media.service';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
];
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal, LanguageSelectorModal, Avatar } from '../../components/common';
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
import { formatDobWithAge } from '../../types/user';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout } = useAppStore();
  const {
    profile,
    loadProfile,
    updateProfile,
    toggleAutoSendSms,
    removeIceContact,
  } = useProfileStore();

  const { t, i18n } = useTranslation();
  const [isMedicalModalVisible, setIsMedicalModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editInitialTab, setEditInitialTab] = useState<TabKey>('identity');
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleOpenAvatarModal = () => {
    setTempAvatarUrl(profile.avatarUrl || '');
    setIsAvatarModalVisible(true);
  };

  const handleSaveAvatar = async () => {
    await updateProfile({ avatarUrl: tempAvatarUrl.trim() || undefined });
    setIsAvatarModalVisible(false);
  };

  const handleTakePhoto = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (!asset) return;
      setIsUploadingAvatar(true);
      const url = await mediaService.uploadMedia(asset);
      setTempAvatarUrl(url);
      await updateProfile({ avatarUrl: url });
      setIsAvatarModalVisible(false);
      Alert.alert('Thành công', 'Đã chụp và cập nhật ảnh đại diện mới!');
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh đại diện lên máy chủ.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePickLibrary = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (!asset) return;
      setIsUploadingAvatar(true);
      const url = await mediaService.uploadMedia(asset);
      setTempAvatarUrl(url);
      await updateProfile({ avatarUrl: url });
      setIsAvatarModalVisible(false);
      Alert.alert('Thành công', 'Đã tải ảnh lên và cập nhật ảnh đại diện mới!');
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh đại diện lên máy chủ.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setTempAvatarUrl('');
    await updateProfile({ avatarUrl: undefined });
    setIsAvatarModalVisible(false);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
    (navigation as any).navigate('Auth', { screen: 'Login' });
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
    { text: profile.fullName || t('profile.badge_no_name'), color: '#0F172A', bg: 'rgba(220, 38, 38, 0.08)', borderColor: 'rgba(220, 38, 38, 0.2)' },
    { text: profile.phoneNumber || t('profile.badge_no_phone'), color: '#DC2626' },
    { text: profile.email || t('profile.badge_no_email'), color: '#64748B' },
  ];

  const medicalBadges: SummaryBadgeItem[] = [
    { text: t('profile.badge_blood', { type: medicalId.bloodType || t('profile.unknown') }), color: '#DC2626', bg: '#FEE2E2', borderColor: '#FECACA' },
    { text: t('profile.badge_allergies', { count: medicalId.allergies?.length || 0 }), color: '#DC2626', bg: '#FEE2E2', borderColor: '#FECACA' },
    { text: t('profile.badge_conditions', { count: medicalId.chronicConditions?.length || 0 }), color: '#B45309', bg: '#FEF3C7', borderColor: '#FDE68A' },
  ];

  const iceBadges: SummaryBadgeItem[] = [
    { text: t('profile.badge_relatives', { count: ice.contacts?.length || 0 }), color: '#059669', bg: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' },
    {
      text: ice.autoSendSmsOnSos ? t('profile.badge_sms_on') : t('profile.badge_sms_off'),
      color: ice.autoSendSmsOnSos ? '#059669' : '#64748B',
    },
  ];

  const specialBadges: SummaryBadgeItem[] = [
    { text: specialInfo.preferredLanguage || (i18n.language?.startsWith('vi') ? 'Tiếng Việt' : 'English'), color: '#334155', bg: '#F1F5F9', borderColor: '#E2E8F0' },
    { text: specialInfo.dependentsNote ? t('profile.badge_has_dependents') : t('profile.badge_no_dependents'), color: '#334155', bg: '#F1F5F9', borderColor: '#E2E8F0' },
  ];

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
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
            {t('profile.header_title')}
          </Text>
          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            {t('profile.header_subtitle')}
          </Text>
        </View>

        {/* Quick Language Toggle Flag Button */}
        <TouchableOpacity
          style={styles.headerLangBtn}
          onPress={() => setIsLanguageModalVisible(true)}
          activeOpacity={0.8}
        >
          <Languages size={14} color="#DC2626" />
          <Text style={styles.headerLangText}>
            {i18n.language?.startsWith('vi') ? '🇻🇳 VI' : '🇬🇧 EN'}
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
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleOpenAvatarModal}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel={t('profile.edit_avatar')}
            >
              <Avatar
                url={profile.avatarUrl}
                name={profile.fullName}
                size={moderateScale(76)}
              />
              {profile.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={10} color="#FFFFFF" />
                </View>
              ) : null}
              <View style={styles.cameraBadge}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.heroTextInfo}>
              <View style={styles.statusPill}>
                <Sparkles size={11} color="#10B981" />
                <Text style={styles.statusPillText}>{t('profile.ready_badge')}</Text>
              </View>
              <Text style={styles.heroName}>{profile.fullName || t('profile.no_name')}</Text>
              <Text style={styles.heroPhone}>{profile.phoneNumber || t('profile.no_phone')}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroAddressRow}>
            <MapPin size={15} color="#DC2626" style={styles.addressIcon} />
            <Text style={styles.heroAddressText} numberOfLines={2}>
              {profile.address || t('profile.no_address')}
            </Text>
          </View>
        </View>

        {/* 3. Hero Action: Open Emergency Medical ID Sheet */}
        <TouchableOpacity
          style={styles.medicalIdBanner}
          activeOpacity={0.8}
          onPress={() => setIsMedicalModalVisible(true)}
          accessible={true}
          accessibilityLabel={t('profile.open_medical_card')}
        >
          <View style={styles.medicalBannerLeft}>
            <View style={styles.medicalBannerIconWrap}>
              <HeartPulse size={24} color="#FFFFFF" />
            </View>
            <View style={styles.medicalBannerTextCol}>
              <Text style={styles.medicalBannerTitle}>
                {t('profile.medical_banner_title')}
              </Text>
              <Text style={styles.medicalBannerSubtitle}>
                {t('profile.medical_banner_sub')}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#FCA5A5" />
        </TouchableOpacity>

        {/* 4. Controls: Section List Title & Toggle All Button */}
        <View style={styles.controlsRow}>
          <View style={styles.controlsLeft}>
            <Layers size={16} color="#DC2626" />
            <Text style={styles.controlsTitle}>{t('profile.sections_title')}</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleAllBtn}
            onPress={toggleExpandAll}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleAllText}>
              {isAllExpanded ? t('profile.collapse_all') : t('profile.expand_all')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* CARD 1: THÔNG TIN ĐỊNH DANH & LIÊN LẠC (EXPANDABLE)       */}
        {/* ========================================================= */}
        <AccordionSection
          id="identity"
          title={t('profile.section_identity_title')}
          subtitle={t('profile.section_identity_sub')}
          icon={<User size={20} color="#DC2626" />}
          iconBgColor="rgba(220, 38, 38, 0.08)"
          titleColor="#0F172A"
          isExpanded={!!expandedCards.identity}
          onToggle={() => toggleCard('identity')}
          summaryBadges={identityBadges}
          onQuickEdit={() => handleOpenEditTab('identity')}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <User size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.fullname_label')}</Text>
              </View>
              <Text style={styles.infoValue}>{profile.fullName || t('profile.not_updated')}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Phone size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.phone_label')}</Text>
              </View>
              <Text style={[styles.infoValue, { color: '#DC2626' }]}>
                {profile.phoneNumber || t('profile.not_updated')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Mail size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.email_label')}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {profile.email || t('profile.not_updated')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <CreditCard size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.id_card_label')}</Text>
              </View>
              <Text style={styles.infoValue}>
                {profile.idCardNumber || t('profile.not_updated')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Calendar size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.dob_gender_label')}</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDobWithAge(profile.dateOfBirth) || '--'} • {profile.gender || t('profile.unknown')}
              </Text>
            </View>

            <View style={styles.addressSection}>
              <View style={styles.infoLabelRow}>
                <MapPin size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.residence_label')}</Text>
              </View>
              <View style={styles.addressBox}>
                <Text style={styles.addressBoxText}>
                  {profile.address || t('profile.not_updated')}
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
          title={t('profile.section_medical_title')}
          subtitle={t('profile.section_medical_sub')}
          icon={<HeartPulse size={20} color="#DC2626" />}
          iconBgColor="#FEE2E2"
          titleColor="#0F172A"
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
                <Text style={styles.bloodTypeNoteTitle}>{t('profile.indicated_blood_type')}</Text>
                <Text style={styles.bloodTypeNoteDesc}>
                  {t('profile.blood_type_desc')}
                </Text>
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <AlertTriangle size={15} color="#DC2626" />
                <Text style={[styles.subCatTitle, { color: '#991B1B' }]}>
                  {t('profile.allergies_title')}
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
                <Text style={styles.emptyNoteText}>{t('profile.no_allergies')}</Text>
              )}
            </View>

            {/* Chronic Conditions */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <HeartPulse size={15} color="#D97706" />
                <Text style={[styles.subCatTitle, { color: '#B45309' }]}>
                  {t('profile.conditions_title')}
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
                <Text style={styles.emptyNoteText}>{t('profile.no_conditions')}</Text>
              )}
            </View>

            {/* Medications */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <Pill size={15} color="#0284C7" />
                <Text style={[styles.subCatTitle, { color: '#0369A1' }]}>
                  {t('profile.medications_title')}
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
                <Text style={styles.emptyNoteText}>{t('profile.no_medications')}</Text>
              )}
            </View>

            {/* Mobility / Disability */}
            <View style={styles.subCategoryBlock}>
              <View style={styles.subCatHeader}>
                <Accessibility size={15} color="#7C3AED" />
                <Text style={[styles.subCatTitle, { color: '#6D28D9' }]}>
                  {t('profile.mobility_title')}
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
                <Text style={styles.emptyNoteText}>{t('profile.normal_mobility')}</Text>
              )}
            </View>

            {medicalId.additionalNotes ? (
              <View style={styles.additionalNoteBox}>
                <Info size={14} color="#64748B" />
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
          title={t('profile.section_ice_title')}
          subtitle={t('profile.section_ice_sub')}
          icon={<PhoneCall size={20} color="#059669" />}
          iconBgColor="rgba(16, 185, 129, 0.1)"
          titleColor="#0F172A"
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
                  <MessageSquare size={13} color="#DC2626" />
                  <Text style={styles.smsTag}>{t('profile.auto_sms_tag')}</Text>
                </View>
                <Text style={styles.smsToggleTitle}>
                  {t('profile.auto_sms_title')}
                </Text>
                <Text style={styles.smsToggleDesc}>
                  {t('profile.auto_sms_desc')}
                </Text>
              </View>

              <Switch
                value={ice.autoSendSmsOnSos}
                onValueChange={handleToggleSms}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* List of ICE Contacts */}
            <Text style={styles.iceListHeader}>
              {t('profile.ice_list_title')}
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
                  {t('profile.no_ice_contacts')}
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
          title={t('profile.section_special_title')}
          subtitle={t('profile.section_special_sub')}
          icon={<Users size={20} color="#D97706" />}
          iconBgColor="#FEF3C7"
          titleColor="#0F172A"
          isExpanded={!!expandedCards.special}
          onToggle={() => toggleCard('special')}
          summaryBadges={specialBadges}
          onQuickEdit={() => handleOpenEditTab('special')}
        >
          <View style={styles.cardContent}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsLanguageModalVisible(true)}
              style={styles.infoRow}
            >
              <View style={styles.infoLabelRow}>
                <Languages size={14} color="#DC2626" />
                <Text style={[styles.infoLabel, { color: '#0F172A', fontWeight: '700' }]}>
                  {t('language.preferred_lang')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.infoValue, { fontWeight: '700', color: '#DC2626' }]}>
                  {i18n.language?.startsWith('vi') ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                </Text>
                <ChevronRight size={14} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.infoLabelRow}>
                <FileText size={14} color="#64748B" />
                <Text style={styles.infoLabel}>{t('profile.dependents_note_label')}</Text>
              </View>
            </View>

            <View style={styles.dependentsBox}>
              <Text style={styles.dependentsText}>
                {specialInfo.dependentsNote || t('profile.no_dependents_note')}
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
          <Text style={styles.fullEditBtnText}>{t('profile.update_full_profile')}</Text>
        </TouchableOpacity>

        {/* Logout / Switch Account Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setIsLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Confirmation Modal: Logout */}
      <ConfirmationModal
        visible={isLogoutModalVisible}
        type="danger"
        title={t('profile.confirm_logout_title')}
        description={t('profile.confirm_logout_desc')}
        confirmText={t('profile.logout')}
        cancelText={t('profile.stay')}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
      />

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

      {/* Modal: Quick Edit Avatar */}
      <Modal
        visible={isAvatarModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isUploadingAvatar && setIsAvatarModalVisible(false)}
      >
        <View style={styles.avatarModalBackdrop}>
          <View style={styles.avatarModalCard}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>{t('profile.avatar_modal_title')}</Text>
              <TouchableOpacity
                onPress={() => !isUploadingAvatar && setIsAvatarModalVisible(false)}
                disabled={isUploadingAvatar}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarModalPreviewCenter}>
              {tempAvatarUrl ? (
                <Image source={{ uri: tempAvatarUrl }} style={styles.avatarModalBigImg} />
              ) : (
                <View style={styles.avatarModalBigPlaceholder}>
                  <User size={48} color="#94A3B8" />
                </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.avatarLoadingText}>{t('profile.avatar_loading')}</Text>
                </View>
              )}
            </View>

            {/* Direct Upload Buttons: Camera & Library */}
            <View style={styles.avatarPickerRow}>
              <TouchableOpacity
                style={[styles.avatarPickerBtn, styles.avatarCameraBtn]}
                onPress={handleTakePhoto}
                disabled={isUploadingAvatar}
                activeOpacity={0.8}
              >
                <Camera size={18} color="#FFFFFF" />
                <Text style={styles.avatarCameraBtnText}>{t('profile.take_new_photo')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.avatarPickerBtn, styles.avatarLibraryBtn]}
                onPress={handlePickLibrary}
                disabled={isUploadingAvatar}
                activeOpacity={0.8}
              >
                <Images size={18} color="#0284C7" />
                <Text style={styles.avatarLibraryBtnText}>{t('profile.pick_library')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarModalLabel}>{t('profile.avatar_url_label')}</Text>
            <TextInput
              style={styles.avatarModalInput}
              value={tempAvatarUrl}
              onChangeText={setTempAvatarUrl}
              placeholder={t('profile.avatar_url_placeholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              editable={!isUploadingAvatar}
            />

            <Text style={[styles.avatarModalLabel, { marginTop: 10 }]}>{t('profile.avatar_preset_label')}</Text>
            <View style={styles.avatarModalPresetRow}>
              {AVATAR_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  disabled={isUploadingAvatar}
                  onPress={() => setTempAvatarUrl(preset)}
                  style={[
                    styles.avatarModalPresetItem,
                    tempAvatarUrl === preset && styles.avatarModalPresetActive,
                  ]}
                >
                  <Image source={{ uri: preset }} style={styles.avatarModalPresetImg} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.avatarModalActions}>
              {tempAvatarUrl || profile.avatarUrl ? (
                <TouchableOpacity
                  disabled={isUploadingAvatar}
                  onPress={handleRemoveAvatar}
                  style={styles.avatarClearBtn}
                >
                  <Text style={styles.avatarClearText}>{t('profile.avatar_delete_btn')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                disabled={isUploadingAvatar}
                onPress={() => setIsAvatarModalVisible(false)}
                style={styles.avatarCancelBtn}
              >
                <Text style={styles.avatarCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isUploadingAvatar}
                onPress={handleSaveAvatar}
                style={styles.avatarSaveBtn}
              >
                <Text style={styles.avatarSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selector Bottom Sheet Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
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
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: moderateScale(10),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  headerLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLangText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    gap: moderateScale(5),
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    flexShrink: 0,
  },
  editHeaderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    color: '#DC2626',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    borderColor: '#DC2626',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  heroTextInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroPhone: {
    fontSize: 13.5,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
    color: '#475569',
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
    shadowOpacity: 0.25,
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
    color: '#64748B',
    letterSpacing: 0.6,
  },
  toggleAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    borderBottomColor: '#F1F5F9',
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  addressSection: {
    paddingTop: 2,
    gap: 8,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressBoxText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 19,
  },
  bloodTypeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodTypeNote: {
    flex: 1,
  },
  bloodTypeNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  bloodTypeNoteDesc: {
    fontSize: 11,
    color: '#7F1D1D',
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
    color: '#0F172A',
  },
  badgeFlexWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyNoteText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  additionalNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  additionalNoteText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  smsToggleBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  smsToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  smsToggleDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  iceListHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  noIceBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noIceText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dependentsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dependentsText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  fullEditBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  fullEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    marginTop: 12,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14.5,
    fontWeight: '700',
  },
  footerSpace: {
    height: 30,
  },
  avatarModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  avatarModalPreviewCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarModalBigImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#DC2626',
  },
  avatarModalBigPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  avatarLoadingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  avatarPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  avatarPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  avatarCameraBtn: {
    backgroundColor: '#DC2626',
  },
  avatarCameraBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarLibraryBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  avatarLibraryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  avatarModalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  avatarModalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  avatarModalPresetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 18,
  },
  avatarModalPresetItem: {
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'transparent',
    padding: 1,
  },
  avatarModalPresetActive: {
    borderColor: '#DC2626',
  },
  avatarModalPresetImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarClearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  avatarClearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  avatarCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  avatarCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  avatarSaveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  avatarSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});


