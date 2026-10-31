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
  Image,
} from 'react-native';
import {
  X,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Building2,
  User,
  Phone,
  FileText,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ResolveAssignmentPayload } from '../../types/dispatch';
import { mediaService } from '../../services/media.service';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';

interface StaffClosureReportModalProps {
  visible: boolean;
  incidentCode?: string;
  onClose: () => void;
  onSubmitResolve: (payload: ResolveAssignmentPayload) => Promise<void> | void;
}

const QUICK_SUGGESTIONS = [
  'Bình Oxy 10L',
  'Bộ nẹp cố định',
  'Máy sốc tim AED',
  'Băng gạc & garo',
  'Kìm cắt thủy lực',
  'Cáng cứu thương',
  'Bình chữa cháy',
];

export const StaffClosureReportModal: React.FC<StaffClosureReportModalProps> = ({
  visible,
  incidentCode,
  onClose,
  onSubmitResolve,
}) => {
  const [summary, setSummary] = useState('');
  const [victimsCount, setVictimsCount] = useState(1);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipmentInputText, setEquipmentInputText] = useState('');
  const [handoverEntity, setHandoverEntity] = useState('');
  const [handoverContactName, setHandoverContactName] = useState('');
  const [handoverContactPhone, setHandoverContactPhone] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSummaryValid = summary.trim().length >= 10;
  const hasPhotos = evidenceUrls.length >= 1;
  const canSubmit = isSummaryValid && hasPhotos && !isSubmitting && !isUploading;

  const handleAddCustomEquipment = () => {
    const trimmed = equipmentInputText.trim();
    if (!trimmed) return;
    const items = trimmed
      .split(/[,;\n]+/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    setSelectedEquipment((prev) => {
      const next = [...prev];
      for (const it of items) {
        if (!next.includes(it)) {
          next.push(it);
        }
      }
      return next;
    });
    setEquipmentInputText('');
  };

  const handleRemoveEquipment = (indexToRemove: number) => {
    setSelectedEquipment((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const toggleSuggestion = (item: string) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      }
      return [...prev, item];
    });
  };

  const handlePickCamera = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (!asset) return;
      setIsUploading(true);
      const url = await mediaService.uploadMedia(asset);
      setEvidenceUrls((prev) => [...prev, url]);
    } catch (err: any) {
      Alert.alert('Lỗi Chụp Ảnh', err.message || 'Không thể tải ảnh lên máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickLibrary = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (!asset) return;
      setIsUploading(true);
      const url = await mediaService.uploadMedia(asset);
      setEvidenceUrls((prev) => [...prev, url]);
    } catch (err: any) {
      Alert.alert('Lỗi Tải Ảnh', err.message || 'Không thể tải ảnh lên máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!isSummaryValid) {
      Alert.alert('Tóm Tắt Quá Ngắn', 'Vui lòng nhập tóm tắt kết thúc ca tối thiểu 10 ký tự.');
      return;
    }
    if (!hasPhotos) {
      Alert.alert('Thiếu Ảnh Bằng Chứng', 'Vui lòng chụp hoặc tải lên tối thiểu 1 ảnh hiện trường sau cứu hộ.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Include any typed equipment that hasn't been added to selectedEquipment yet
      let finalEquipment = [...selectedEquipment];
      if (equipmentInputText.trim()) {
        const extraItems = equipmentInputText
          .trim()
          .split(/[,;\n]+/)
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
        for (const it of extraItems) {
          if (!finalEquipment.includes(it)) {
            finalEquipment.push(it);
          }
        }
      }

      await onSubmitResolve({
        resolutionSummary: summary.trim(),
        evidenceMediaUrls: evidenceUrls,
        victimsAssistedCount: victimsCount,
        equipmentUsed: finalEquipment.length > 0 ? finalEquipment : undefined,
        handoverEntity: handoverEntity.trim() || undefined,
        handoverContactName: handoverContactName.trim() || undefined,
        handoverContactPhone: handoverContactPhone.trim() || undefined,
        handoverNotes: handoverNotes.trim() || undefined,
        signatureSvg: signatureData || undefined,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi Nghiệm Thu', err.message || 'Không thể gửi báo cáo nghiệm thu.');
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
                <ShieldCheck size={moderateScale(20)} color="#059669" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Báo Cáo Nghiệm Thu Ca Trực</Text>
                <Text style={styles.modalSubtitle}>
                  {incidentCode ? `Nhiệm vụ: ${incidentCode}` : 'Hoàn tất & bàn giao ca cứu hộ'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isSubmitting || isUploading}
            >
              <X size={moderateScale(18)} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form ScrollBody */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDrawingSignature}
          >
            {/* 1. Resolution Summary (Required >= 10 chars) */}
            <View style={styles.formSection}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>
                  TÓM TẮT XỬ LÝ HIỆN TRƯỜNG <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    !isSummaryValid && styles.counterTextError,
                  ]}
                >
                  {summary.trim().length}/10 ký tự (tối thiểu)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.multilineInput,
                  !isSummaryValid && summary.length > 0 && styles.inputErrorBorder,
                ]}
                placeholder="Mô tả tóm tắt quá trình sơ cứu, dập tắt đám cháy hoặc giải phóng nạn nhân..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={summary}
                onChangeText={setSummary}
                editable={!isSubmitting}
              />
            </View>

            {/* 2. Photo Evidence (Required >= 1 photo) */}
            <View style={styles.formSection}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>
                  ẢNH BẰNG CHỨNG HIỆN TRƯỜNG <Text style={styles.requiredAsterisk}>* (≥ 1 ẢNH)</Text>
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    !hasPhotos && styles.counterTextError,
                  ]}
                >
                  Đã có {evidenceUrls.length} ảnh
                </Text>
              </View>

              {/* Photos Grid & Picker Buttons */}
              <View style={styles.photosRow}>
                {evidenceUrls.map((url, idx) => (
                  <View key={idx} style={styles.photoThumbWrap}>
                    <Image source={{ uri: url }} style={styles.photoThumb} />
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.removePhotoBtn}
                      onPress={() => handleRemovePhoto(idx)}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={moderateScale(12)} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.addPhotoBtn}
                  onPress={handlePickCamera}
                  disabled={isUploading || isSubmitting}
                >
                  <Camera size={moderateScale(18)} color="#DC2626" />
                  <Text style={styles.addPhotoText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.addPhotoBtn, styles.addPhotoBtnOutline]}
                  onPress={handlePickLibrary}
                  disabled={isUploading || isSubmitting}
                >
                  <ImageIcon size={moderateScale(18)} color="#0284C7" />
                  <Text style={[styles.addPhotoText, { color: '#0284C7' }]}>Chọn ảnh</Text>
                </TouchableOpacity>
              </View>

              {isUploading && (
                <View style={styles.uploadingBox}>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.uploadingText}>Đang tải ảnh hiện trường lên Cloudinary...</Text>
                </View>
              )}
            </View>

            {/* 3. Victims Count Stepper (Required >= 0) */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>
                SỐ LƯỢNG NẠN NHÂN ĐÃ CẤP CỨU / HỖ TRỢ <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.stepBtn}
                  onPress={() => setVictimsCount((prev) => Math.max(0, prev - 1))}
                  disabled={isSubmitting || victimsCount <= 0}
                >
                  <Minus size={moderateScale(16)} color="#0F172A" />
                </TouchableOpacity>

                <View style={styles.stepValueBox}>
                  <Text style={styles.stepValueText}>{victimsCount}</Text>
                  <Text style={styles.stepValueSub}>nạn nhân</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.stepBtn}
                  onPress={() => setVictimsCount((prev) => prev + 1)}
                  disabled={isSubmitting}
                >
                  <Plus size={moderateScale(16)} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Equipment Used Input (Optional) */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>TRANG THIẾT BỊ / VẬT TƯ TIÊU HAO (TÙY CHỌN):</Text>

              {/* Text Input Row to let users type their own equipment */}
              <View style={styles.equipmentInputRow}>
                <TextInput
                  style={styles.equipmentInput}
                  placeholder="Nhập trang thiết bị, vật tư đã sử dụng..."
                  placeholderTextColor="#94A3B8"
                  value={equipmentInputText}
                  onChangeText={setEquipmentInputText}
                  onSubmitEditing={handleAddCustomEquipment}
                  returnKeyType="done"
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.addEquipmentBtn,
                    !equipmentInputText.trim() && styles.addEquipmentBtnDisabled,
                  ]}
                  onPress={handleAddCustomEquipment}
                  disabled={!equipmentInputText.trim() || isSubmitting}
                >
                  <Plus size={moderateScale(15)} color={equipmentInputText.trim() ? '#FFFFFF' : '#94A3B8'} />
                  <Text
                    style={[
                      styles.addEquipmentBtnText,
                      !equipmentInputText.trim() && styles.addEquipmentBtnTextDisabled,
                    ]}
                  >
                    Thêm
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tag List of Added Equipment */}
              {selectedEquipment.length > 0 && (
                <View style={styles.selectedEquipmentWrap}>
                  {selectedEquipment.map((item, index) => (
                    <View key={`${item}-${index}`} style={styles.equipmentTag}>
                      <Text style={styles.equipmentTagText} numberOfLines={1}>
                        {item}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveEquipment(index)}
                        style={styles.removeTagBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={moderateScale(12)} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Suggestions below */}
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionTitle}>Gợi ý nhanh (chạm để thêm vào danh sách):</Text>
                <View style={styles.chipsWrap}>
                  {QUICK_SUGGESTIONS.map((item) => {
                    const isAdded = selectedEquipment.includes(item);
                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.75}
                        style={[
                          styles.chip,
                          isAdded && styles.chipAdded,
                        ]}
                        onPress={() => toggleSuggestion(item)}
                        disabled={isSubmitting}
                      >
                        {isAdded ? (
                          <CheckCircle2 size={moderateScale(12)} color="#059669" />
                        ) : (
                          <Plus size={moderateScale(12)} color="#64748B" />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isAdded && styles.chipTextAdded,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 5. Inter-Agency Handover Info (Optional) */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>THÔNG TIN BÀN GIAO LIÊN NGÀNH (BỆNH VIỆN / CÔNG AN):</Text>

              <View style={styles.inputField}>
                <Building2 size={moderateScale(14)} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.singleInput}
                  placeholder="Đơn vị tiếp nhận (Bệnh viện / Cơ quan công an bàn giao)"
                  placeholderTextColor="#94A3B8"
                  value={handoverEntity}
                  onChangeText={setHandoverEntity}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputField}>
                <User size={moderateScale(14)} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.singleInput}
                  placeholder="Họ tên người tiếp nhận (BS / Điều dưỡng / Trực ban)"
                  placeholderTextColor="#94A3B8"
                  value={handoverContactName}
                  onChangeText={setHandoverContactName}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputField}>
                <Phone size={moderateScale(14)} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.singleInput}
                  placeholder="Số điện thoại người tiếp nhận (tùy chọn)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={handoverContactPhone}
                  onChangeText={setHandoverContactPhone}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputField}>
                <FileText size={moderateScale(14)} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.singleInput}
                  placeholder="Ghi chú bàn giao thêm..."
                  placeholderTextColor="#94A3B8"
                  value={handoverNotes}
                  onChangeText={setHandoverNotes}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* 6. Digital Signature of On-Scene Commander / Handover Person */}
            <View style={styles.formSection}>
              <DigitalSignaturePad
                title="CHỮ KÝ SỐ CỦA CHỈ HUY HIỆN TRƯỜNG / NGƯỜI BÀN GIAO"
                placeholder="Ký trực tiếp bằng ngón tay vào đây"
                onDrawingChange={setIsDrawingSignature}
                onSignatureChange={(_hasSig, svgStr) => setSignatureData(svgStr)}
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting || isUploading}
            >
              <Text style={styles.cancelBtnText}>Quay Lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <CheckCircle2 size={moderateScale(16)} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Nghiệm Thu Hoàn Thành</Text>
                </View>
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
    maxHeight: '92%',
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: '900',
    color: '#0F172A',
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
    marginTop: verticalScale(8),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    gap: verticalScale(14),
  },
  formSection: {
    gap: verticalScale(6),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '900',
  },
  counterText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#64748B',
  },
  counterTextError: {
    color: '#DC2626',
  },
  multilineInput: {
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
  inputErrorBorder: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    alignItems: 'center',
  },
  photoThumbWrap: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(10),
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(2),
  },
  addPhotoBtnOutline: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  addPhotoText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#DC2626',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#FFFBEB',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: verticalScale(4),
  },
  uploadingText: {
    fontSize: moderateScale(10.5),
    color: '#B45309',
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: scale(6),
    maxWidth: scale(220),
  },
  stepBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueBox: {
    alignItems: 'center',
    paddingHorizontal: scale(14),
  },
  stepValueText: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  stepValueSub: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(16),
  },
  chipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#065F46',
    fontWeight: '800',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(10),
    gap: scale(8),
    marginBottom: verticalScale(6),
  },
  fieldIcon: {
    marginRight: 2,
  },
  singleInput: {
    flex: 1,
    paddingVertical: verticalScale(9),
    fontSize: moderateScale(11.5),
    color: '#0F172A',
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
  submitBtn: {
    flex: 2,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#A7F3D0',
    elevation: 0,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  submitBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  equipmentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  equipmentInput: {
    flex: 1,
    height: verticalScale(38),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: scale(12),
    fontSize: moderateScale(11.5),
    color: '#0F172A',
  },
  addEquipmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    height: verticalScale(38),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(10),
    gap: scale(4),
  },
  addEquipmentBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  addEquipmentBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addEquipmentBtnTextDisabled: {
    color: '#94A3B8',
  },
  selectedEquipmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginBottom: verticalScale(8),
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: verticalScale(4),
    paddingLeft: scale(9),
    paddingRight: scale(6),
    borderRadius: moderateScale(14),
    gap: scale(5),
  },
  equipmentTagText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#065F46',
    maxWidth: scale(180),
  },
  removeTagBtn: {
    padding: scale(2),
    borderRadius: moderateScale(8),
    backgroundColor: '#FEE2E2',
  },
  suggestionSection: {
    marginTop: verticalScale(2),
  },
  suggestionTitle: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: verticalScale(6),
  },
  chipAdded: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  chipTextAdded: {
    color: '#065F46',
    fontWeight: '800',
  },
});
