import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Save,
  User,
  HeartPulse,
  Phone,
  Info,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Pill,
  Accessibility,
  Droplet,
  Camera,
  Calendar,
  ChevronDown,
  Images,
} from 'lucide-react-native';
import { mediaService } from '../../services/media.service';
import {
  UserEmergencyProfile,
  BloodType,
  IceContact,
} from '../../types/profile';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
];

import {
  calculateAgeFromParts,
  validateDobAge18,
  formatDobWithAge,
} from '../../types/user';

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const CURRENT_DAY = CURRENT_DATE.getDate();
const MAX_BIRTH_YEAR = CURRENT_YEAR - 18;
const MIN_BIRTH_YEAR = CURRENT_YEAR - 100;

const DECADES = [
  { label: '2000s', start: 2000, end: MAX_BIRTH_YEAR },
  { label: '1990s', start: 1990, end: 1999 },
  { label: '1980s', start: 1980, end: 1989 },
  { label: '1970s', start: 1970, end: 1979 },
  { label: '1960s', start: 1960, end: 1969 },
  { label: '< 1960', start: MIN_BIRTH_YEAR, end: 1959 },
];

import { EmergencyBadge } from './EmergencyBadge';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserEmergencyProfile;
  onSave: (updatedProfile: UserEmergencyProfile) => void;
  initialTab?: TabKey;
}

export type TabKey = 'identity' | 'medical' | 'ice' | 'special';

const BLOOD_TYPES: BloodType[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Chưa rõ'];

const SUGGESTED_ALLERGIES = [
  'Penicillin',
  'Aspirin',
  'Kháng sinh Sulfonamide',
  'Hải sản (Tôm, Cua)',
  'Đậu phộng (Lạc)',
  'Phấn hoa',
  'Vết đốt côn trùng/ong',
];

const SUGGESTED_CONDITIONS = [
  'Hen suyễn',
  'Tim mạch / Thiếu máu cục bộ',
  'Tăng huyết áp',
  'Tiểu đường Type 2',
  'Động kinh',
  'Rối loạn đông máu',
  'Suy thận mãn',
];

const SUGGESTED_MOBILITY = [
  'Khiếm thính',
  'Khiếm thị',
  'Sử dụng xe lăn',
  'Liệt chi / Yếu cơ',
  'Khó thở khi gắng sức',
  'Gãy xương đang cố định',
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  profile,
  onSave,
  initialTab = 'identity',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Form states initialized with current profile
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleModalTakePhoto = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (!asset) return;
      setIsUploadingAvatar(true);
      const url = await mediaService.uploadMedia(asset);
      setAvatarUrl(url);
      Alert.alert('Thành công', 'Đã tải ảnh đại diện lên máy chủ!');
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên máy chủ.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleModalPickLibrary = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (!asset) return;
      setIsUploadingAvatar(true);
      const url = await mediaService.uploadMedia(asset);
      setAvatarUrl(url);
      Alert.alert('Thành công', 'Đã tải ảnh đại diện lên!');
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên!');
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const [address, setAddress] = useState(profile.address || '');
  const [idCardNumber, setIdCardNumber] = useState(profile.idCardNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>(
    profile.gender || 'Nam'
  );

  // Medical state
  const [bloodType, setBloodType] = useState<BloodType>(
    profile.medicalId?.bloodType || 'Chưa rõ'
  );
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    profile.medicalId?.chronicConditions || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    profile.medicalId?.allergies || []
  );
  const [currentMedications, setCurrentMedications] = useState<string[]>(
    profile.medicalId?.currentMedications || []
  );
  const [mobilityLimitations, setMobilityLimitations] = useState<string[]>(
    profile.medicalId?.mobilityLimitations || []
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    profile.medicalId?.additionalNotes || ''
  );

  // Input states for custom chips
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [customMed, setCustomMed] = useState('');
  const [customMobility, setCustomMobility] = useState('');

  // ICE state
  const [contacts, setContacts] = useState<IceContact[]>(
    profile.ice?.contacts || []
  );
  const [autoSendSmsOnSos, setAutoSendSmsOnSos] = useState(
    profile.ice?.autoSendSmsOnSos ?? true
  );
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Special Info state
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile.specialInfo?.preferredLanguage || 'Tiếng Việt'
  );
  const [dependentsNote, setDependentsNote] = useState(
    profile.specialInfo?.dependentsNote || ''
  );
  const [householdMembersCount, setHouseholdMembersCount] = useState(
    profile.specialInfo?.householdMembersCount !== undefined && profile.specialInfo?.householdMembersCount !== null
      ? String(profile.specialInfo.householdMembersCount)
      : ''
  );

  // Date of Birth & Age 18+ Validation States
  const [dobError, setDobError] = useState('');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [pickerTab, setPickerTab] = useState<'year' | 'month' | 'day'>('year');
  const [pickerDecade, setPickerDecade] = useState('2000s');
  const [pickerDay, setPickerDay] = useState(1);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerYear, setPickerYear] = useState(MAX_BIRTH_YEAR - 2);
  const [pickerInputText, setPickerInputText] = useState('');

  const handleOpenDatePicker = () => {
    let d = 1;
    let m = 1;
    let y = MAX_BIRTH_YEAR - 4;
    if (dateOfBirth && dateOfBirth.includes('/')) {
      const parts = dateOfBirth.split('/');
      if (parts.length === 3) {
        const pd = parseInt(parts[0], 10);
        const pm = parseInt(parts[1], 10);
        const py = parseInt(parts[2], 10);
        if (!isNaN(pd) && !isNaN(pm) && !isNaN(py)) {
          d = pd;
          m = pm;
          y = py;
        }
      }
    }
    setPickerDay(d);
    setPickerMonth(m);
    setPickerYear(y <= MAX_BIRTH_YEAR ? y : MAX_BIRTH_YEAR);
    setPickerInputText(
      dateOfBirth ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}` : ''
    );

    if (y >= 2000) setPickerDecade('2000s');
    else if (y >= 1990) setPickerDecade('1990s');
    else if (y >= 1980) setPickerDecade('1980s');
    else if (y >= 1970) setPickerDecade('1970s');
    else if (y >= 1960) setPickerDecade('1960s');
    else setPickerDecade('< 1960');

    setPickerTab('year');
    setIsDatePickerVisible(true);
  };

  const handleDirectDobInput = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    } else if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    }
    setPickerInputText(formatted);

    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
        setPickerDay(d);
        setPickerMonth(m);
        setPickerYear(y);
        if (y >= 2000) setPickerDecade('2000s');
        else if (y >= 1990) setPickerDecade('1990s');
        else if (y >= 1980) setPickerDecade('1980s');
        else if (y >= 1970) setPickerDecade('1970s');
        else if (y >= 1960) setPickerDecade('1960s');
        else setPickerDecade('< 1960');
      }
    }
  };

  const pickerAge = calculateAgeFromParts(pickerDay, pickerMonth, pickerYear);
  const daysInSelectedMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const isDayValid = pickerDay >= 1 && pickerDay <= daysInSelectedMonth;
  const isAgeValid = pickerAge >= 18;
  const isNotFuture = pickerYear <= CURRENT_YEAR && pickerAge >= 0;
  const isPickerValid = isAgeValid && isNotFuture && isDayValid && pickerYear >= MIN_BIRTH_YEAR;

  const currentDecadeObj =
    DECADES.find((d) => d.label === pickerDecade) || DECADES[0];
  const activeDecadeYears = Array.from(
    { length: currentDecadeObj.end - currentDecadeObj.start + 1 },
    (_, i) => currentDecadeObj.end - i
  );

  const handleConfirmDate = () => {
    if (!isPickerValid) {
      if (!isNotFuture) {
        Alert.alert(
          'Ngày sinh không hợp lệ',
          `Ngày sinh không thể ở tương lai (Năm ${pickerYear}). Yêu cầu từ đủ 18 tuổi trở lên (sinh năm ${MAX_BIRTH_YEAR} trở về trước).`
        );
      } else if (!isDayValid) {
        Alert.alert(
          'Ngày không hợp lệ',
          `Tháng ${pickerMonth}/${pickerYear} chỉ có tối đa ${daysInSelectedMonth} ngày.`
        );
      } else if (!isAgeValid) {
        Alert.alert(
          'Chưa đủ 18 tuổi',
          `Người dùng phải từ đủ 18 tuổi trở lên (Hiện tại: ${pickerAge} tuổi). Yêu cầu sinh ngày ${String(CURRENT_DAY).padStart(2, '0')}/${String(CURRENT_MONTH).padStart(2, '0')}/${MAX_BIRTH_YEAR} trở về trước.`
        );
      }
      return;
    }
    const formatted = `${String(pickerDay).padStart(2, '0')}/${String(pickerMonth).padStart(2, '0')}/${pickerYear}`;
    setDateOfBirth(formatted);
    setDobError('');
    setIsDatePickerVisible(false);
  };

  // Synchronize internal form state when modal becomes visible or profile updates
  React.useEffect(() => {
    if (visible) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setFullName(profile.fullName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setAvatarUrl(profile.avatarUrl || '');
      setAddress(profile.address || '');
      setIdCardNumber(profile.idCardNumber || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setGender(profile.gender || 'Nam');
      setDobError('');

      setBloodType(profile.medicalId?.bloodType || 'Chưa rõ');
      setChronicConditions(profile.medicalId?.chronicConditions || []);
      setAllergies(profile.medicalId?.allergies || []);
      setCurrentMedications(profile.medicalId?.currentMedications || []);
      setMobilityLimitations(profile.medicalId?.mobilityLimitations || []);
      setAdditionalNotes(profile.medicalId?.additionalNotes || '');

      setContacts(profile.ice?.contacts || []);
      setAutoSendSmsOnSos(profile.ice?.autoSendSmsOnSos ?? true);

      setPreferredLanguage(profile.specialInfo?.preferredLanguage || 'Tiếng Việt');
      setDependentsNote(profile.specialInfo?.dependentsNote || '');
    }
  }, [visible, profile, initialTab]);

  const handleAddAllergy = (item: string) => {
    if (item.trim() && !allergies.includes(item.trim())) {
      setAllergies([...allergies, item.trim()]);
      setCustomAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddCondition = (item: string) => {
    if (item.trim() && !chronicConditions.includes(item.trim())) {
      setChronicConditions([...chronicConditions, item.trim()]);
      setCustomCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  const handleAddMedication = (item: string) => {
    if (item.trim() && !currentMedications.includes(item.trim())) {
      setCurrentMedications([...currentMedications, item.trim()]);
      setCustomMed('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    setCurrentMedications(currentMedications.filter((_, i) => i !== index));
  };

  const handleAddMobility = (item: string) => {
    if (item.trim() && !mobilityLimitations.includes(item.trim())) {
      setMobilityLimitations([...mobilityLimitations, item.trim()]);
      setCustomMobility('');
    }
  };

  const handleRemoveMobility = (index: number) => {
    setMobilityLimitations(mobilityLimitations.filter((_, i) => i !== index));
  };

  const handleAddIceContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại người thân.');
      return;
    }
    const cleanContactPhone = newContactPhone.trim().replace(/\s/g, '');
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanContactPhone)) {
      Alert.alert('Số điện thoại không hợp lệ', 'Số điện thoại người thân không đúng định dạng di động Việt Nam (ví dụ: 0912345678).');
      return;
    }
    const newContact: IceContact = {
      id: `ice_${Date.now()}`,
      name: newContactName.trim(),
      relationship: newContactRelation.trim() || 'Người thân',
      phoneNumber: cleanContactPhone,
      isPrimary: contacts.length === 0,
    };
    setContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setIsAddingContact(false);
  };

  const handleRemoveIceContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId));
  };

  const handleSaveAll = () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống.');
      return;
    }
    const cleanPhone = phoneNumber.trim().replace(/\s/g, '');
    if (!cleanPhone) {
      Alert.alert('Lỗi', 'Số điện thoại không được để trống.');
      return;
    }
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
      Alert.alert('Số điện thoại không hợp lệ', 'Số điện thoại không đúng định dạng di động Việt Nam (ví dụ: 0912345678).');
      return;
    }

    if (!dateOfBirth.trim()) {
      setDobError('Vui lòng chọn ngày sinh (từ đủ 18 tuổi trở lên)');
      Alert.alert('Lỗi ngày sinh', 'Ngày sinh là bắt buộc. Ứng dụng yêu cầu người dùng từ đủ 18 tuổi trở lên.');
      setActiveTab('identity');
      return;
    }

    const ageCheck = validateDobAge18(dateOfBirth);
    if (!ageCheck.isValid) {
      setDobError(ageCheck.error || 'Ngày sinh không hợp lệ');
      Alert.alert('Lỗi ngày sinh', ageCheck.error);
      setActiveTab('identity');
      return;
    }

    const cleanId = idCardNumber.trim();
    if (cleanId && !/^[0-9]{9}([0-9]{3})?$/.test(cleanId)) {
      Alert.alert('Số CCCD không hợp lệ', 'Số CMND/CCCD phải gồm đúng 9 hoặc 12 chữ số.');
      setActiveTab('identity');
      return;
    }

    const updatedProfile: UserEmergencyProfile = {
      ...profile,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      address: address.trim(),
      idCardNumber: idCardNumber.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender,
      medicalId: {
        bloodType,
        chronicConditions,
        allergies,
        currentMedications,
        mobilityLimitations,
        additionalNotes: additionalNotes.trim(),
      },
      ice: {
        ...profile.ice,
        contacts,
        autoSendSmsOnSos,
      },
      specialInfo: {
        ...profile.specialInfo,
        preferredLanguage: preferredLanguage.trim(),
        dependentsNote: dependentsNote.trim(),
        householdMembersCount: householdMembersCount.trim() ? parseInt(householdMembersCount.trim(), 10) : undefined,
      },
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProfile);
    Alert.alert('Thành Công', 'Đã lưu thông tin hồ sơ cứu hộ và đồng bộ dữ liệu.');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Chỉnh Sửa Hồ Sơ Cứu Hộ</Text>
                  <Text style={styles.headerSubtitle}>
                    Cập nhật các trường thông tin phục vụ cứu nạn
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessible={true}
                  accessibilityLabel="Đóng modal chỉnh sửa"
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Navigation Tab Bar */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'identity' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('identity')}
                >
                  <User
                    size={14}
                    color={activeTab === 'identity' ? '#DC2626' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === 'identity' && styles.tabLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    Định Danh
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'medical' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('medical')}
                >
                  <HeartPulse
                    size={14}
                    color={activeTab === 'medical' ? '#DC2626' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === 'medical' && styles.tabLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    Y Tế
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'ice' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('ice')}
                >
                  <Phone
                    size={14}
                    color={activeTab === 'ice' ? '#10B981' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === 'ice' && styles.tabLabelActive,
                      activeTab === 'ice' && { color: '#059669' },
                    ]}
                    numberOfLines={1}
                  >
                    Người Thân
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'special' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('special')}
                >
                  <Info
                    size={14}
                    color={activeTab === 'special' ? '#F59E0B' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === 'special' && styles.tabLabelActive,
                      activeTab === 'special' && { color: '#D97706' },
                    ]}
                    numberOfLines={1}
                  >
                    Đặc Thù
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Contents */}
              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* TAB 1: IDENTITY */}
                {activeTab === 'identity' && (
                  <View style={styles.tabContainer}>
                    {/* Avatar Edit Section */}
                    <View style={styles.avatarEditCard}>
                      <Text style={styles.label}>Ảnh đại diện</Text>
                      <View style={styles.avatarRow}>
                        <View style={styles.avatarPreviewWrap}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImg} />
                          ) : (
                            <View style={styles.avatarPreviewPlaceholder}>
                              <User size={30} color="#94A3B8" />
                            </View>
                          )}
                          {isUploadingAvatar ? (
                            <View style={styles.avatarOverlayLoading}>
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                          ) : (
                            <View style={styles.cameraIconBadge}>
                              <Camera size={11} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={styles.avatarActionRow}>
                            <TouchableOpacity
                              style={[styles.avatarMiniBtn, styles.avatarCameraMiniBtn]}
                              onPress={handleModalTakePhoto}
                              disabled={isUploadingAvatar}
                              activeOpacity={0.8}
                            >
                              <Camera size={13} color="#FFFFFF" />
                              <Text style={styles.avatarCameraMiniBtnText}>Chụp ảnh</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.avatarMiniBtn, styles.avatarLibraryMiniBtn]}
                              onPress={handleModalPickLibrary}
                              disabled={isUploadingAvatar}
                              activeOpacity={0.8}
                            >
                              <Images size={13} color="#0284C7" />
                              <Text style={styles.avatarLibraryMiniBtnText}>Thư viện</Text>
                            </TouchableOpacity>
                          </View>

                          <TextInput
                            style={[styles.input, { height: 38, fontSize: 12.5, paddingVertical: 4 }]}
                            value={avatarUrl}
                            onChangeText={setAvatarUrl}
                            placeholder="Hoặc dán liên kết ảnh (URL)"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                            editable={!isUploadingAvatar}
                          />
                          {avatarUrl ? (
                            <TouchableOpacity
                              onPress={() => setAvatarUrl('')}
                              style={styles.clearAvatarBtn}
                              disabled={isUploadingAvatar}
                            >
                              <Text style={styles.clearAvatarText}>Xóa ảnh đại diện</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>

                      <Text style={[styles.subLabel, { marginTop: 8 }]}>Hoặc chọn ảnh mẫu nhanh:</Text>
                      <View style={styles.presetRow}>
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setAvatarUrl(preset)}
                            style={[
                              styles.presetItem,
                              avatarUrl === preset && styles.presetItemActive,
                            ]}
                          >
                            <Image source={{ uri: preset }} style={styles.presetImg} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Họ và tên đầy đủ *</Text>
                      <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="VD: Nguyễn Văn An"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Số điện thoại chính chủ *</Text>
                      <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="VD: 0912 345 678"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Địa chỉ thường trú / Nơi ở cố định *
                      </Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={address}
                        onChangeText={setAddress}
                        multiline={true}
                        numberOfLines={2}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1.1 }]}>
                        <Text style={styles.label}>
                          Ngày sinh <Text style={{ color: '#DC2626' }}>*</Text>{' '}
                          <Text style={styles.subLabel}>(≥ 18 tuổi)</Text>
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.datePickerBtn,
                            dobError ? styles.datePickerBtnError : null,
                          ]}
                          onPress={handleOpenDatePicker}
                          activeOpacity={0.75}
                        >
                          <Calendar size={15} color={dateOfBirth ? '#DC2626' : '#94A3B8'} />
                          <Text
                            style={[
                              styles.datePickerBtnText,
                              !dateOfBirth && styles.datePickerBtnPlaceholder,
                            ]}
                            numberOfLines={1}
                          >
                            {formatDobWithAge(dateOfBirth) || 'Chọn ngày sinh'}
                          </Text>
                          {dateOfBirth ? (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                setDateOfBirth('');
                                setDobError('');
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={14} color="#94A3B8" />
                            </TouchableOpacity>
                          ) : (
                            <ChevronDown size={13} color="#94A3B8" />
                          )}
                        </TouchableOpacity>
                        {dobError ? (
                          <Text style={styles.dobErrorText}>{dobError}</Text>
                        ) : dateOfBirth ? (
                          <Text style={styles.dobValidText}>✓ Đã xác thực ≥ 18 tuổi</Text>
                        ) : (
                          <Text style={styles.dobHintText}>Bắt buộc từ đủ 18 tuổi</Text>
                        )}
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Số CCCD / CMND</Text>
                        <TextInput
                          style={styles.input}
                          value={idCardNumber}
                          onChangeText={setIdCardNumber}
                          placeholder="12 chữ số"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Giới tính</Text>
                      <View style={styles.genderRow}>
                        {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[
                              styles.genderBtn,
                              gender === g && styles.genderBtnActive,
                            ]}
                            onPress={() => setGender(g)}
                          >
                            <Text
                              style={[
                                styles.genderText,
                                gender === g && styles.genderTextActive,
                              ]}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* TAB 2: MEDICAL ID */}
                {activeTab === 'medical' && (
                  <View style={styles.tabContainer}>
                    {/* Blood Type Selector */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nhóm máu (Blood Type)</Text>
                      <View style={styles.bloodTypeGrid}>
                        {BLOOD_TYPES.map((bt) => (
                          <TouchableOpacity
                            key={bt}
                            style={[
                              styles.bloodBtn,
                              bloodType === bt && styles.bloodBtnActive,
                            ]}
                            onPress={() => setBloodType(bt)}
                          >
                            <Droplet
                              size={14}
                              color={bloodType === bt ? '#FFFFFF' : '#EF4444'}
                            />
                            <Text
                              style={[
                                styles.bloodText,
                                bloodType === bt && styles.bloodTextActive,
                              ]}
                            >
                              {bt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Allergies */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: '#FCA5A5' }]}>
                        Dị ứng (Thuốc, Thức ăn, Môi trường)
                      </Text>
                      <View style={styles.chipsWrap}>
                        {allergies.map((alg, index) => (
                          <EmergencyBadge
                            key={`alg_edit_${index}`}
                            label={alg}
                            variant="allergy"
                            isRemovable={true}
                            onRemove={() => handleRemoveAllergy(index)}
                          />
                        ))}
                      </View>
                      <View style={styles.addRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={customAllergy}
                          onChangeText={setCustomAllergy}
                          placeholder="Thêm dị ứng khác (vd: Dị ứng Paracetamol)..."
                          placeholderTextColor="#64748B"
                        />
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddAllergy(customAllergy)}
                        >
                          <Plus size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      {/* Suggestions */}
                      <Text style={styles.suggestionTitle}>Gợi ý phổ biến:</Text>
                      <View style={styles.suggestionWrap}>
                        {SUGGESTED_ALLERGIES.filter((s) => !allergies.includes(s))
                          .slice(0, 4)
                          .map((sug) => (
                            <TouchableOpacity
                              key={sug}
                              style={styles.sugChip}
                              onPress={() => handleAddAllergy(sug)}
                            >
                              <Text style={styles.sugText}>+ {sug}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>

                    {/* Chronic Conditions */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: '#FCD34D' }]}>
                        Tiền sử bệnh nền mãn tính
                      </Text>
                      <View style={styles.chipsWrap}>
                        {chronicConditions.map((cond, index) => (
                          <EmergencyBadge
                            key={`cond_edit_${index}`}
                            label={cond}
                            variant="condition"
                            isRemovable={true}
                            onRemove={() => handleRemoveCondition(index)}
                          />
                        ))}
                      </View>
                      <View style={styles.addRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={customCondition}
                          onChangeText={setCustomCondition}
                          placeholder="Thêm bệnh nền khác..."
                          placeholderTextColor="#64748B"
                        />
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: '#F59E0B' }]}
                          onPress={() => handleAddCondition(customCondition)}
                        >
                          <Plus size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      {/* Suggestions */}
                      <Text style={styles.suggestionTitle}>Gợi ý phổ biến:</Text>
                      <View style={styles.suggestionWrap}>
                        {SUGGESTED_CONDITIONS.filter(
                          (s) => !chronicConditions.includes(s)
                        )
                          .slice(0, 4)
                          .map((sug) => (
                            <TouchableOpacity
                              key={sug}
                              style={styles.sugChip}
                              onPress={() => handleAddCondition(sug)}
                            >
                              <Text style={styles.sugText}>+ {sug}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>

                    {/* Current Medications */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: '#7DD3FC' }]}>
                        Thuốc đang điều trị thường xuyên
                      </Text>
                      <View style={styles.chipsWrap}>
                        {currentMedications.map((med, index) => (
                          <EmergencyBadge
                            key={`med_edit_${index}`}
                            label={med}
                            variant="medication"
                            isRemovable={true}
                            onRemove={() => handleRemoveMedication(index)}
                          />
                        ))}
                      </View>
                      <View style={styles.addRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={customMed}
                          onChangeText={setCustomMed}
                          placeholder="Thêm tên thuốc & liều lượng..."
                          placeholderTextColor="#64748B"
                        />
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: '#38BDF8' }]}
                          onPress={() => handleAddMedication(customMed)}
                        >
                          <Plus size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Mobility Limitations */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: '#D8B4FE' }]}>
                        Tình trạng khuyết tật / Khó khăn vận động
                      </Text>
                      <View style={styles.chipsWrap}>
                        {mobilityLimitations.map((mob, index) => (
                          <EmergencyBadge
                            key={`mob_edit_${index}`}
                            label={mob}
                            variant="mobility"
                            isRemovable={true}
                            onRemove={() => handleRemoveMobility(index)}
                          />
                        ))}
                      </View>
                      <View style={styles.addRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={customMobility}
                          onChangeText={setCustomMobility}
                          placeholder="Thêm tình trạng hạn chế..."
                          placeholderTextColor="#64748B"
                        />
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: '#A855F7' }]}
                          onPress={() => handleAddMobility(customMobility)}
                        >
                          <Plus size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      {/* Suggestions */}
                      <Text style={styles.suggestionTitle}>Gợi ý phổ biến:</Text>
                      <View style={styles.suggestionWrap}>
                        {SUGGESTED_MOBILITY.filter(
                          (s) => !mobilityLimitations.includes(s)
                        )
                          .slice(0, 3)
                          .map((sug) => (
                            <TouchableOpacity
                              key={sug}
                              style={styles.sugChip}
                              onPress={() => handleAddMobility(sug)}
                            >
                              <Text style={styles.sugText}>+ {sug}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>

                    {/* Additional notes */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Ghi chú y khoa khác</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                        multiline={true}
                        numberOfLines={2}
                        placeholder="Ghi chú chi tiết cho bác sĩ/cứu hộ..."
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}

                {/* TAB 3: ICE CONTACTS & SMS TOGGLE */}
                {activeTab === 'ice' && (
                  <View style={styles.tabContainer}>
                    {/* Auto SMS GPS switch */}
                    <View style={styles.switchBox}>
                      <View style={styles.switchTextCol}>
                        <Text style={styles.switchTitle}>
                          Tự động gửi SMS toạ độ khi bấm SOS
                        </Text>
                        <Text style={styles.switchDesc}>
                          Hệ thống sẽ ngay lập tức soạn và gửi tin nhắn chứa toạ độ GPS cứu hộ tới các số liên hệ ICE khi kích hoạt báo động.
                        </Text>
                      </View>
                      <Switch
                        value={autoSendSmsOnSos}
                        onValueChange={setAutoSendSmsOnSos}
                        trackColor={{ false: '#334155', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
                      Danh sách người thân khẩn cấp (1 - 2 người)
                    </Text>

                    {contacts.map((c) => (
                      <View key={c.id} style={styles.contactItemRow}>
                        <View style={styles.contactItemInfo}>
                          <Text style={styles.contactItemName}>{c.name}</Text>
                          <Text style={styles.contactItemMeta}>
                            Mối quan hệ: {c.relationship} • SĐT: {c.phoneNumber}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveIceContact(c.id)}
                          style={styles.deleteContactBtn}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add contact button or form */}
                    {isAddingContact ? (
                      <View style={styles.addContactCard}>
                        <Text style={styles.addContactTitle}>
                          Thêm người thân khẩn cấp mới
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={newContactName}
                          onChangeText={setNewContactName}
                          placeholder="Họ và tên người thân"
                          placeholderTextColor="#64748B"
                        />
                        <TextInput
                          style={styles.input}
                          value={newContactRelation}
                          onChangeText={setNewContactRelation}
                          placeholder="Mối quan hệ (VD: Vợ, Bố, Chồng, Bạn thân)"
                          placeholderTextColor="#64748B"
                        />
                        <TextInput
                          style={styles.input}
                          value={newContactPhone}
                          onChangeText={setNewContactPhone}
                          keyboardType="phone-pad"
                          placeholder="Số điện thoại"
                          placeholderTextColor="#64748B"
                        />
                        <View style={styles.addContactActions}>
                          <TouchableOpacity
                            style={styles.cancelAddBtn}
                            onPress={() => setIsAddingContact(false)}
                          >
                            <Text style={styles.cancelAddText}>Huỷ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.confirmAddBtn}
                            onPress={handleAddIceContact}
                          >
                            <Text style={styles.confirmAddText}>Thêm</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      contacts.length < 3 && (
                        <TouchableOpacity
                          style={styles.addNewContactBtn}
                          onPress={() => setIsAddingContact(true)}
                        >
                          <Plus size={18} color="#38BDF8" />
                          <Text style={styles.addNewContactText}>
                            + Thêm Người Liên Hệ Khẩn Cấp
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}

                {/* TAB 4: SPECIAL INFO */}
                {activeTab === 'special' && (
                  <View style={styles.tabContainer}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Ngôn ngữ ưu tiên giao tiếp</Text>
                      <TextInput
                        style={styles.input}
                        value={preferredLanguage}
                        onChangeText={setPreferredLanguage}
                        placeholder="VD: Tiếng Việt, Tiếng Anh, Tiếng Trung..."
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Số lượng thành viên trong hộ gia đình
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={householdMembersCount}
                        onChangeText={(txt) => setHouseholdMembersCount(txt.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="VD: 4"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Ghi chú người phụ thuộc trong hộ gia đình
                      </Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={dependentsNote}
                        onChangeText={setDependentsNote}
                        multiline={true}
                        numberOfLines={3}
                        placeholder="VD: Căn hộ có trẻ sơ sinh 8 tháng tuổi và người già 80 tuổi đi lại khó khăn..."
                        placeholderTextColor="#64748B"
                      />
                      <Text style={styles.helperText}>
                        * Thông tin này cực kỳ quan trọng giúp đội cứu hộ huy động lực lượng đưa người phụ thuộc ra khỏi vùng nguy hiểm trước.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer Action Buttons */}
              <View
                style={[
                  styles.footer,
                  { paddingBottom: Math.max(insets.bottom + 12, 16) },
                ]}
              >
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Huỷ bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveAll}
                  activeOpacity={0.8}
                >
                  <Save size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Date of Birth Picker Overlay (18+ validation) - In-modal view to avoid Android dialog conflicts */}
          {isDatePickerVisible && (
            <View style={styles.dobModalBackdrop}>
              <View style={styles.dobModalCard}>
                {/* Header */}
                <View style={styles.dobModalHeader}>
                  <View style={styles.dobHeaderTitleRow}>
                    <View style={styles.dobIconCircle}>
                      <Calendar size={17} color="#DC2626" />
                    </View>
                    <View>
                      <Text style={styles.dobModalTitle}>Chọn Ngày Sinh</Text>
                      <Text style={styles.dobModalSubtitle}>
                        Yêu cầu từ đủ 18 tuổi trở lên
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsDatePickerVisible(false)}
                    style={styles.dobCloseBtn}
                  >
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Live Age & Validation Status Banner */}
                <View
                  style={[
                    styles.ageStatusBanner,
                    isPickerValid ? styles.ageStatusOk : styles.ageStatusWarn,
                  ]}
                >
                  <View style={styles.ageStatusRow}>
                    {isPickerValid ? (
                      <Check size={15} color="#059669" />
                    ) : (
                      <AlertTriangle size={15} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.ageStatusText,
                        isPickerValid ? styles.ageStatusTextOk : styles.ageStatusTextWarn,
                      ]}
                    >
                      {isPickerValid
                        ? `${String(pickerDay).padStart(2, '0')}/${String(pickerMonth).padStart(2, '0')}/${pickerYear} • ${pickerAge} tuổi (Hợp lệ)`
                        : !isDayValid
                          ? `Tháng ${pickerMonth}/${pickerYear} chỉ có tối đa ${daysInSelectedMonth} ngày`
                          : (pickerYear > CURRENT_YEAR || pickerAge < 0)
                            ? `Ngày sinh không thể ở tương lai (Năm ${pickerYear})`
                            : `Chưa đủ 18 tuổi (${pickerAge} tuổi)`}
                    </Text>
                  </View>
                  {!isPickerValid && (
                    <Text style={styles.ageStatusSubtext}>
                      {pickerAge < 18
                        ? `* Cần sinh ngày ${String(CURRENT_DAY).padStart(2, '0')}/${String(CURRENT_MONTH).padStart(2, '0')}/${MAX_BIRTH_YEAR} trở về trước`
                        : 'Vui lòng chọn ngày hợp lệ'}
                    </Text>
                  )}
                </View>

                {/* Quick Direct Input Bar */}
                <View style={styles.quickInputContainer}>
                  <Text style={styles.quickInputLabel}>Nhập nhanh (DD/MM/YYYY):</Text>
                  <View style={styles.quickInputWrapper}>
                    <TextInput
                      style={styles.quickInput}
                      value={pickerInputText}
                      onChangeText={handleDirectDobInput}
                      placeholder="VD: 14/01/2004"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    {pickerInputText ? (
                      <TouchableOpacity onPress={() => handleDirectDobInput('')}>
                        <X size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Picker Navigation Tabs: Năm, Tháng, Ngày */}
                <View style={styles.pickerTabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.pickerTabBtn,
                      pickerTab === 'year' && styles.pickerTabBtnActive,
                    ]}
                    onPress={() => setPickerTab('year')}
                  >
                    <Text
                      style={[
                        styles.pickerTabBtnText,
                        pickerTab === 'year' && styles.pickerTabBtnTextActive,
                      ]}
                    >
                      Năm {pickerYear}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pickerTabBtn,
                      pickerTab === 'month' && styles.pickerTabBtnActive,
                    ]}
                    onPress={() => setPickerTab('month')}
                  >
                    <Text
                      style={[
                        styles.pickerTabBtnText,
                        pickerTab === 'month' && styles.pickerTabBtnTextActive,
                      ]}
                    >
                      Tháng {pickerMonth}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pickerTabBtn,
                      pickerTab === 'day' && styles.pickerTabBtnActive,
                    ]}
                    onPress={() => setPickerTab('day')}
                  >
                    <Text
                      style={[
                        styles.pickerTabBtnText,
                        pickerTab === 'day' && styles.pickerTabBtnTextActive,
                      ]}
                    >
                      Ngày {pickerDay}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tab Content Box */}
                <View style={styles.pickerTabContentBox}>
                  {/* TAB YEAR */}
                  {pickerTab === 'year' && (
                    <View style={styles.yearTabWrapper}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.decadesScroll}
                        contentContainerStyle={styles.decadesContainer}
                      >
                        {DECADES.map((dec) => (
                          <TouchableOpacity
                            key={dec.label}
                            style={[
                              styles.decadeChip,
                              pickerDecade === dec.label && styles.decadeChipActive,
                            ]}
                            onPress={() => setPickerDecade(dec.label)}
                          >
                            <Text
                              style={[
                                styles.decadeChipText,
                                pickerDecade === dec.label && styles.decadeChipTextActive,
                              ]}
                            >
                              {dec.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <ScrollView
                        style={styles.yearsScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        <View style={styles.yearsGrid}>
                          {activeDecadeYears.map((y) => (
                            <TouchableOpacity
                              key={y}
                              style={[
                                styles.yearGridItem,
                                pickerYear === y && styles.yearGridItemActive,
                              ]}
                              onPress={() => {
                                setPickerYear(y);
                                const maxDays = new Date(y, pickerMonth, 0).getDate();
                                const newDay = pickerDay > maxDays ? maxDays : pickerDay;
                                setPickerDay(newDay);
                                setPickerInputText(
                                  `${String(newDay).padStart(2, '0')}/${String(pickerMonth).padStart(2, '0')}/${y}`
                                );
                                setPickerTab('month');
                              }}
                            >
                              <Text
                                style={[
                                  styles.yearGridItemText,
                                  pickerYear === y && styles.yearGridItemTextActive,
                                ]}
                              >
                                {y}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* TAB MONTH */}
                  {pickerTab === 'month' && (
                    <View style={styles.monthsGrid}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.monthGridItem,
                            pickerMonth === m && styles.monthGridItemActive,
                          ]}
                          onPress={() => {
                            setPickerMonth(m);
                            const maxDays = new Date(pickerYear, m, 0).getDate();
                            const newDay = pickerDay > maxDays ? maxDays : pickerDay;
                            setPickerDay(newDay);
                            setPickerInputText(
                              `${String(newDay).padStart(2, '0')}/${String(m).padStart(2, '0')}/${pickerYear}`
                            );
                            setPickerTab('day');
                          }}
                        >
                          <Text
                            style={[
                              styles.monthGridItemText,
                              pickerMonth === m && styles.monthGridItemTextActive,
                            ]}
                          >
                            Tháng {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* TAB DAY */}
                  {pickerTab === 'day' && (
                    <ScrollView
                      style={styles.daysScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.daysGrid}>
                        {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((d) => (
                          <TouchableOpacity
                            key={d}
                            style={[
                              styles.dayGridItem,
                              pickerDay === d && styles.dayGridItemActive,
                            ]}
                            onPress={() => {
                              setPickerDay(d);
                              setPickerInputText(
                                `${String(d).padStart(2, '0')}/${String(pickerMonth).padStart(2, '0')}/${pickerYear}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.dayGridItemText,
                                pickerDay === d && styles.dayGridItemTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.dobModalFooter}>
                  <TouchableOpacity
                    style={styles.dobCancelBtn}
                    onPress={() => setIsDatePickerVisible(false)}
                  >
                    <Text style={styles.dobCancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dobConfirmBtn,
                      !isPickerValid && styles.dobConfirmBtnDisabled,
                    ]}
                    onPress={handleConfirmDate}
                    disabled={!isPickerValid}
                  >
                    <Text style={styles.dobConfirmBtnText}>
                      {isPickerValid
                        ? `Chọn ${String(pickerDay).padStart(2, '0')}/${String(pickerMonth).padStart(2, '0')}/${pickerYear}`
                        : 'Chưa đủ 18 tuổi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    height: '92%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 9,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#DC2626',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tabContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  genderTextActive: {
    color: '#DC2626',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  bloodText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  bloodTextActive: {
    color: '#FFFFFF',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: '#DC2626',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  sugChip: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sugText: {
    fontSize: 11,
    color: '#475569',
  },
  switchBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactItemInfo: {
    flex: 1,
  },
  contactItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactItemMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteContactBtn: {
    padding: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 8,
  },
  addNewContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addNewContactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  addContactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  addContactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  addContactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  confirmAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 11,
    color: '#D97706',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  avatarEditCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  avatarPreviewWrap: {
    position: 'relative',
  },
  avatarPreviewImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  avatarPreviewPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarOverlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  avatarCameraMiniBtn: {
    backgroundColor: '#DC2626',
  },
  avatarCameraMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarLibraryMiniBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  avatarLibraryMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  clearAvatarBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearAvatarText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  presetItem: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 1,
  },
  presetItemActive: {
    borderColor: '#DC2626',
  },
  presetImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  datePickerBtnError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  datePickerBtnText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  datePickerBtnPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  dobErrorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
  dobValidText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  dobHintText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  dobModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
    elevation: 20,
  },
  dobModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  dobModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dobHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dobIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dobModalSubtitle: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 1,
  },
  dobCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  ageStatusBanner: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  ageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ageStatusOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ageStatusWarn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  ageStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  ageStatusTextOk: {
    color: '#059669',
  },
  ageStatusTextWarn: {
    color: '#DC2626',
  },
  ageStatusSubtext: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  quickInputContainer: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  quickInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  quickInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    height: 36,
  },
  quickInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    padding: 0,
  },
  pickerTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  pickerTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerTabBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  pickerTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pickerTabBtnTextActive: {
    color: '#FFFFFF',
  },
  pickerTabContentBox: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    marginBottom: 12,
  },
  yearTabWrapper: {
    flex: 1,
  },
  decadesScroll: {
    maxHeight: 34,
    marginBottom: 6,
  },
  decadesContainer: {
    gap: 6,
  },
  decadeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  decadeChipActive: {
    backgroundColor: '#0F172A',
  },
  decadeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  decadeChipTextActive: {
    color: '#FFFFFF',
  },
  yearsScroll: {
    flex: 1,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  yearGridItem: {
    width: '31%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  yearGridItemActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  yearGridItemText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  yearGridItemTextActive: {
    color: '#FFFFFF',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  monthGridItem: {
    width: '31%',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 4,
  },
  monthGridItemActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  monthGridItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  monthGridItemTextActive: {
    color: '#FFFFFF',
  },
  daysScroll: {
    flex: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  dayGridItem: {
    width: '12.5%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGridItemActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  dayGridItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dayGridItemTextActive: {
    color: '#FFFFFF',
  },
  dobModalFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  dobCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  dobCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dobConfirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  dobConfirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  dobConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
