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
} from 'react-native';
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
} from 'lucide-react-native';
import {
  UserEmergencyProfile,
  BloodType,
  IceContact,
} from '../../types/profile';
import { EmergencyBadge } from './EmergencyBadge';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserEmergencyProfile;
  onSave: (updatedProfile: UserEmergencyProfile) => void;
}

type TabKey = 'identity' | 'medical' | 'ice' | 'special';

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
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('identity');

  // Form states initialized with current profile
  const [fullName, setFullName] = useState(profile.fullName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [address, setAddress] = useState(profile.address);
  const [idCardNumber, setIdCardNumber] = useState(profile.idCardNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>(
    profile.gender || 'Nam'
  );

  // Medical state
  const [bloodType, setBloodType] = useState<BloodType>(
    profile.medicalId.bloodType
  );
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    profile.medicalId.chronicConditions || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    profile.medicalId.allergies || []
  );
  const [currentMedications, setCurrentMedications] = useState<string[]>(
    profile.medicalId.currentMedications || []
  );
  const [mobilityLimitations, setMobilityLimitations] = useState<string[]>(
    profile.medicalId.mobilityLimitations || []
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    profile.medicalId.additionalNotes || ''
  );

  // Input states for custom chips
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [customMed, setCustomMed] = useState('');
  const [customMobility, setCustomMobility] = useState('');

  // ICE state
  const [contacts, setContacts] = useState<IceContact[]>(
    profile.ice.contacts || []
  );
  const [autoSendSmsOnSos, setAutoSendSmsOnSos] = useState(
    profile.ice.autoSendSmsOnSos
  );
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Special Info state
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile.specialInfo.preferredLanguage || 'Tiếng Việt'
  );
  const [dependentsNote, setDependentsNote] = useState(
    profile.specialInfo.dependentsNote || ''
  );

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
    const newContact: IceContact = {
      id: `ice_${Date.now()}`,
      name: newContactName.trim(),
      relationship: newContactRelation.trim() || 'Người thân',
      phoneNumber: newContactPhone.trim(),
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
    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Số điện thoại không được để trống.');
      return;
    }

    const updatedProfile: UserEmergencyProfile = {
      ...profile,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
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
      },
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProfile);
    Alert.alert('Thành Công', 'Đã lưu thông tin hồ sơ cứu hộ và đồng bộ dữ liệu.');
    onClose();
  };

  return (
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
                  size={16}
                  color={activeTab === 'identity' ? '#38BDF8' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'identity' && styles.tabLabelActive,
                  ]}
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
                  size={16}
                  color={activeTab === 'medical' ? '#EF4444' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'medical' && styles.tabLabelActive,
                  ]}
                >
                  Medical ID
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
                  size={16}
                  color={activeTab === 'ice' ? '#10B981' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'ice' && styles.tabLabelActive,
                  ]}
                >
                  ICE Người Thân
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
                  size={16}
                  color={activeTab === 'special' ? '#F59E0B' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'special' && styles.tabLabelActive,
                  ]}
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
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Ngày sinh</Text>
                      <TextInput
                        style={styles.input}
                        value={dateOfBirth}
                        onChangeText={setDateOfBirth}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#64748B"
                      />
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
            <View style={styles.footer}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    height: '92%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  tabItemActive: {
    backgroundColor: '#0F172A',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFFFFF',
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
    color: '#CBD5E1',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
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
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  genderBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  genderTextActive: {
    color: '#0F172A',
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
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bloodBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bloodText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
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
    backgroundColor: '#EF4444',
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
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sugText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  switchBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactItemInfo: {
    flex: 1,
  },
  contactItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactItemMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteContactBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  addNewContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addNewContactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  addContactCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  addContactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
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
    backgroundColor: '#334155',
  },
  cancelAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
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
    color: '#F59E0B',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0284C7',
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
});
