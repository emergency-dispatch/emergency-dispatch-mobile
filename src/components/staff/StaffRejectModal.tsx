import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import {
  RejectionReason,
  REJECTION_REASON_LABELS,
  RejectAssignmentPayload,
} from '../../types/dispatch';

interface StaffRejectModalProps {
  visible: boolean;
  incidentCode?: string;
  onClose: () => void;
  onSubmitReject: (payload: RejectAssignmentPayload) => Promise<void> | void;
}

const REASONS: RejectionReason[] = [
  'VehicleBreakdown',
  'AlreadyOnMission',
  'TooFar',
  'MedicalLeave',
  'NoResponse',
  'Other',
];

export const StaffRejectModal: React.FC<StaffRejectModalProps> = ({
  visible,
  incidentCode,
  onClose,
  onSubmitReject,
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReason>('VehicleBreakdown');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOther = selectedReason === 'Other';
  const isNotesValid = !isOther || notes.trim().length >= 5;

  const handleSubmit = async () => {
    if (isOther && notes.trim().length < 5) {
      Alert.alert('Ghi Chú Bắt Buộc', 'Vui lòng nhập lý do cụ thể tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReject({
        reason: selectedReason,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi Từ Chối', err.message || 'Không thể gửi lý do từ chối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={moderateScale(18)} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Từ Chối Lệnh Điều Động</Text>
                <Text style={styles.modalSubtitle}>
                  {incidentCode ? `Nhiệm vụ: ${incidentCode}` : 'Báo cáo nguyên nhân về Trung tâm'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <X size={moderateScale(18)} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>CHỌN NGUYÊN NHÂN TỪ CHỐI (BẮT BUỘC):</Text>
            <View style={styles.reasonsList}>
              {REASONS.map((reasonKey) => {
                const isSelected = selectedReason === reasonKey;
                return (
                  <TouchableOpacity
                    key={reasonKey}
                    activeOpacity={0.8}
                    style={[
                      styles.reasonOption,
                      isSelected && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reasonKey)}
                    disabled={isSubmitting}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        isSelected && styles.reasonTextSelected,
                      ]}
                    >
                      {REJECTION_REASON_LABELS[reasonKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <Text style={styles.sectionLabel}>
                  GHI CHÚ THÊM {isOther ? '(BẮT BUỘC ≥ 5 KÝ TỰ)' : '(TÙY CHỌN)'}:
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    isOther && notes.trim().length < 5 && styles.counterTextError,
                  ]}
                >
                  {notes.length} ký tự
                </Text>
              </View>
              <TextInput
                style={[
                  styles.notesInput,
                  isOther && notes.trim().length < 5 && styles.notesInputError,
                ]}
                placeholder={
                  isOther
                    ? 'Nhập nguyên nhân cụ thể (ví dụ: Xe hết bình ắc quy, thủng lốp...)'
                    : 'Nhập ghi chú thêm cho tổng đài điều phối...'
                }
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Lệnh điều động sẽ tự động chuyển sang xe cứu hộ dự bị tiếp theo trong khu vực. Hệ thống sẽ ghi nhận Audit Trail về nguyên nhân từ chối.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Quay Lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.confirmRejectBtn,
                (!isNotesValid || isSubmitting) && styles.confirmRejectBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isNotesValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmRejectBtnText}>Xác Nhận Từ Chối</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '88%',
    paddingBottom: verticalScale(14),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  iconCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  closeBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollBody: {
    marginTop: verticalScale(10),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(14),
  },
  sectionLabel: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: verticalScale(8),
  },
  reasonsList: {
    gap: verticalScale(6),
    marginBottom: verticalScale(12),
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(10),
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: '800',
    color: '#991B1B',
  },
  notesSection: {
    marginBottom: verticalScale(12),
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#94A3B8',
  },
  counterTextError: {
    color: '#DC2626',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: moderateScale(10),
    fontSize: moderateScale(12),
    color: '#0F172A',
    minHeight: verticalScale(70),
    textAlignVertical: 'top',
  },
  notesInputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: moderateScale(10),
  },
  warningText: {
    fontSize: moderateScale(10.5),
    color: '#92400E',
    lineHeight: moderateScale(15),
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: scale(10),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#475569',
  },
  confirmRejectBtn: {
    flex: 2,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmRejectBtnDisabled: {
    backgroundColor: '#FDA4AF',
    elevation: 0,
  },
  confirmRejectBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
