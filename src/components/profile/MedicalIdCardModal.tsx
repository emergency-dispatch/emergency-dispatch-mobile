import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  X,
  HeartPulse,
  AlertTriangle,
  Pill,
  Accessibility,
  Phone,
  QrCode,
  Share2,
  ShieldCheck,
  User,
  MapPin,
  FileText,
  Languages,
  Users,
} from 'lucide-react-native';
import { UserEmergencyProfile } from '../../types/profile';
import { BloodTypeBadge } from './BloodTypeBadge';
import { EmergencyBadge } from './EmergencyBadge';

interface MedicalIdCardModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserEmergencyProfile;
}

export const MedicalIdCardModal: React.FC<MedicalIdCardModalProps> = ({
  visible,
  onClose,
  profile,
}) => {
  const { medicalId, ice, specialInfo } = profile;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Red Header */}
          <View style={styles.topHeader}>
            <View style={styles.headerTitleRow}>
              <HeartPulse size={20} color="#FFFFFF" />
              <Text style={styles.headerTitle}>THẺ Y TẾ CẤP CỨU (MEDICAL ID)</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityLabel="Đóng thẻ y tế"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Subheader Alert */}
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              DÀNH CHO ĐỘI CỨU HỘ & NHÂN VIÊN Y TẾ 114/115 TẠI HIỆN TRƯỜNG
            </Text>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Identity & Blood Type Overview */}
            <View style={styles.identityCard}>
              <View style={styles.avatarSection}>
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <User size={36} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.verifiedDot}>
                  <ShieldCheck size={14} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.nameBlock}>
                <Text style={styles.fullName}>{profile.fullName}</Text>
                <Text style={styles.subInfo}>
                  {profile.gender || 'Nam'} • {profile.dateOfBirth || '1995'} (
                  {profile.phoneNumber})
                </Text>
                <View style={styles.addressRow}>
                  <MapPin size={12} color="#94A3B8" />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {profile.address}
                  </Text>
                </View>
              </View>
            </View>

            {/* Blood Type Hero */}
            <View style={styles.bloodTypeSection}>
              <BloodTypeBadge
                bloodType={medicalId.bloodType}
                size="large"
                showLabel={true}
              />
              <View style={styles.bloodNote}>
                <Text style={styles.bloodNoteTitle}>LƯU Ý TRUYỀN MÁU</Text>
                <Text style={styles.bloodNoteDesc}>
                  Đối chiếu nhóm máu và phản ứng chéo trước khi thực hiện truyền chế phẩm máu tại chỗ.
                </Text>
              </View>
            </View>

            {/* CRITICAL: Allergies */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={18} color="#EF4444" />
                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                  DỊ ỨNG & CẢNH BÁO SỐC PHẢN VỆ
                </Text>
              </View>
              {medicalId.allergies && medicalId.allergies.length > 0 ? (
                <View style={styles.badgeWrap}>
                  {medicalId.allergies.map((allergy, idx) => (
                    <EmergencyBadge
                      key={`modal_alg_${idx}`}
                      label={allergy}
                      variant="allergy"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Chưa ghi nhận tiền sử dị ứng</Text>
              )}
            </View>

            {/* Chronic Conditions */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <HeartPulse size={18} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                  TIỀN SỬ BỆNH NỀN MÃN TÍNH
                </Text>
              </View>
              {medicalId.chronicConditions &&
              medicalId.chronicConditions.length > 0 ? (
                <View style={styles.badgeWrap}>
                  {medicalId.chronicConditions.map((condition, idx) => (
                    <EmergencyBadge
                      key={`modal_cond_${idx}`}
                      label={condition}
                      variant="condition"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Không có bệnh nền mãn tính</Text>
              )}
            </View>

            {/* Current Medications */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Pill size={18} color="#38BDF8" />
                <Text style={[styles.sectionTitle, { color: '#38BDF8' }]}>
                  THUỐC ĐANG ĐIỀU TRỊ THƯỜNG XUYÊN
                </Text>
              </View>
              {medicalId.currentMedications &&
              medicalId.currentMedications.length > 0 ? (
                <View style={styles.badgeWrap}>
                  {medicalId.currentMedications.map((med, idx) => (
                    <EmergencyBadge
                      key={`modal_med_${idx}`}
                      label={med}
                      variant="medication"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Không sử dụng thuốc thường xuyên</Text>
              )}
            </View>

            {/* Mobility Limitations */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Accessibility size={18} color="#A855F7" />
                <Text style={[styles.sectionTitle, { color: '#A855F7' }]}>
                  TÌNH TRẠNG KHUYẾT TẬT / VẬN ĐỘNG
                </Text>
              </View>
              {medicalId.mobilityLimitations &&
              medicalId.mobilityLimitations.length > 0 ? (
                <View style={styles.badgeWrap}>
                  {medicalId.mobilityLimitations.map((limit, idx) => (
                    <EmergencyBadge
                      key={`modal_mob_${idx}`}
                      label={limit}
                      variant="mobility"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Khả năng vận động bình thường</Text>
              )}
            </View>

            {/* ICE Contacts */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Phone size={18} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                  NGƯỜI THÂN KHẨN CẤP (ICE)
                </Text>
              </View>
              {ice.contacts && ice.contacts.length > 0 ? (
                ice.contacts.map((contact) => (
                  <View key={`ice_modal_${contact.id}`} style={styles.iceRow}>
                    <View>
                      <Text style={styles.iceName}>
                        {contact.name} ({contact.relationship})
                      </Text>
                      <Text style={styles.icePhone}>{contact.phoneNumber}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa cấu hình người thân ICE</Text>
              )}
            </View>

            {/* Special Information */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Users size={18} color="#E2E8F0" />
                <Text style={[styles.sectionTitle, { color: '#E2E8F0' }]}>
                  THÔNG TIN ĐẶC THÙ & HỘ GIA ĐÌNH
                </Text>
              </View>
              <View style={styles.specialRow}>
                <Languages size={15} color="#94A3B8" />
                <Text style={styles.specialText}>
                  Ngôn ngữ ưu tiên: <Text style={styles.boldText}>{specialInfo.preferredLanguage || 'Tiếng Việt'}</Text>
                </Text>
              </View>
              {specialInfo.dependentsNote ? (
                <View style={[styles.specialRow, { marginTop: 6 }]}>
                  <FileText size={15} color="#94A3B8" />
                  <Text style={styles.specialText}>
                    {specialInfo.dependentsNote}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
  },
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
  },
  alertText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarSection: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 2,
  },
  nameBlock: {
    flex: 1,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
  },
  bloodTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bloodNote: {
    flex: 1,
  },
  bloodNoteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 2,
  },
  bloodNoteDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  sectionBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  iceRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  icePhone: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  specialText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 17,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  doneBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
