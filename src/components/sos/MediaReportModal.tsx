import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Camera, Video, X, Send, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { HazardItem } from './QuickHazardGrid';

interface MediaReportModalProps {
  visible: boolean;
  onClose: () => void;
  selectedHazard?: HazardItem | null;
  currentAddress: string;
  onSubmitReport: (data: {
    hazardId?: string;
    mediaType: 'photo' | 'video' | 'none';
    note: string;
  }) => void;
}

export const MediaReportModal: React.FC<MediaReportModalProps> = ({
  visible,
  onClose,
  selectedHazard,
  currentAddress,
  onSubmitReport,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<'photo' | 'video' | 'none'>('none');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaSelect = (type: 'photo' | 'video') => {
    setSelectedMedia((prev) => (prev === type ? 'none' : type));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitReport({
        hazardId: selectedHazard?.id,
        mediaType: selectedMedia,
        note,
      });
      // Reset form
      setSelectedMedia('none');
      setNote('');
      onClose();
    }, 800);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Indicator */}
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>
                    {selectedHazard ? `Báo Cáo: ${selectedHazard.title}` : 'Báo Cáo Sự Cố Có Đính Kèm'}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {currentAddress}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityLabel="Đóng modal báo cáo"
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Selected Hazard Pill */}
              {selectedHazard && (
                <View
                  style={[
                    styles.hazardBadge,
                    { backgroundColor: selectedHazard.bgColor, borderColor: selectedHazard.borderColor },
                  ]}
                >
                  <AlertCircle size={16} color={selectedHazard.color} />
                  <Text style={[styles.hazardBadgeText, { color: selectedHazard.color }]}>
                    Mã sự cố: {selectedHazard.code}
                  </Text>
                </View>
              )}

              {/* Quick Media Action Row */}
              <Text style={styles.label}>ĐÍNH KÈM HÌNH ẢNH / VIDEO 5S</Text>
              <View style={styles.mediaRow}>
                {/* Take Photo */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleMediaSelect('photo')}
                  style={[
                    styles.mediaButton,
                    selectedMedia === 'photo' && styles.mediaButtonActive,
                  ]}
                >
                  <Camera
                    size={22}
                    color={selectedMedia === 'photo' ? '#38BDF8' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.mediaButtonText,
                      selectedMedia === 'photo' && styles.mediaButtonTextActive,
                    ]}
                  >
                    Chụp ảnh hiện trường
                  </Text>
                  {selectedMedia === 'photo' && (
                    <CheckCircle2 size={16} color="#38BDF8" />
                  )}
                </TouchableOpacity>

                {/* Record 5s Video */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleMediaSelect('video')}
                  style={[
                    styles.mediaButton,
                    selectedMedia === 'video' && styles.mediaButtonActive,
                  ]}
                >
                  <Video
                    size={22}
                    color={selectedMedia === 'video' ? '#EF4444' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.mediaButtonText,
                      selectedMedia === 'video' && styles.mediaButtonTextActive,
                    ]}
                  >
                    Quay video 5s
                  </Text>
                  {selectedMedia === 'video' && (
                    <CheckCircle2 size={16} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Short Note Input */}
              <Text style={styles.label}>GHI CHÚ BỔ SUNG (TÙY CHỌN)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ví dụ: Có người mắc kẹt tầng 2, đám cháy lan nhanh..."
                placeholderTextColor="#64748B"
                style={styles.textInput}
                multiline={true}
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{note.length}/200</Text>

              {/* Emergency Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={styles.submitButton}
                accessible={true}
                accessibilityLabel="Gửi báo cáo sự cố khẩn cấp ngay"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.submitContent}>
                    <Send size={18} color="#FFFFFF" />
                    <Text style={styles.submitText}>GỬI BÁO CÁO CỨU HỘ NGAY</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#94A3B8',
    maxWidth: 280,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  hazardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  hazardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'center',
  },
  mediaButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  mediaButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  mediaButtonTextActive: {
    color: '#F8FAFC',
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
