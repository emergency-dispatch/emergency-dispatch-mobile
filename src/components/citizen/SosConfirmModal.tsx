import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Camera,
  Images,
  Trash2,
  X,
  Send,
} from 'lucide-react-native';

interface SosConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  photoUri?: string | null;
  address: string;
  onConfirm: (note: string) => void;
  onRetakePhoto: () => void;
  onPickLibrary: () => void;
  onRemovePhoto: () => void;
}

export const SosConfirmModal: React.FC<SosConfirmModalProps> = ({
  visible,
  onClose,
  photoUri,
  address,
  onConfirm,
  onRetakePhoto,
  onPickLibrary,
  onRemovePhoto,
}) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleConfirm = () => {
    onConfirm(note);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          {/* Tapping backdrop dismisses modal/keyboard */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouchArea} />
          </TouchableWithoutFeedback>

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 18) }]}>
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.alertDot} />
                <Text style={styles.title}>XÁC NHẬN BÁO ĐỘNG SOS</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Address Pill */}
              <View style={styles.addressPill}>
                <MapPin size={16} color="#DC2626" />
                <Text style={styles.addressText} numberOfLines={2}>
                  {address}
                </Text>
              </View>

              {/* Photo Section with Cropping Preview */}
              {photoUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.previewImage} />
                  <View style={styles.photoActionsRow}>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={onRetakePhoto}
                      activeOpacity={0.7}
                    >
                      <Camera size={14} color="#0F172A" />
                      <Text style={styles.photoActionText}>Chụp lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={onPickLibrary}
                      activeOpacity={0.7}
                    >
                      <Images size={14} color="#0F172A" />
                      <Text style={styles.photoActionText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoActionBtn, styles.deleteActionBtn]}
                      onPress={onRemovePhoto}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#DC2626" />
                      <Text style={[styles.photoActionText, { color: '#DC2626' }]}>Xoá</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyPhotoBox}>
                  <Text style={styles.emptyPhotoTitle}>Chưa có ảnh hiện trường</Text>
                  <View style={styles.addPhotoButtonsRow}>
                    <TouchableOpacity
                      style={styles.addPhotoBtn}
                      onPress={onRetakePhoto}
                      activeOpacity={0.7}
                    >
                      <Camera size={16} color="#0284C7" />
                      <Text style={styles.addPhotoText}>Chụp ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addPhotoBtn}
                      onPress={onPickLibrary}
                      activeOpacity={0.7}
                    >
                      <Images size={16} color="#059669" />
                      <Text style={[styles.addPhotoText, { color: '#059669' }]}>Thư viện</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Note Section */}
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Ghi chú hiện trường (Mô tả tình huống khẩn cấp)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 250);
                  }}
                  placeholder="Ví dụ: Có người mắc kẹt tầng 2, khói đen mù mịt, cần xe thang cứu nạn..."
                  placeholderTextColor="#94A3B8"
                  style={styles.noteInput}
                  multiline={true}
                  numberOfLines={3}
                  maxLength={300}
                />
                <Text style={styles.charCount}>{note.length}/300</Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>CHẤP NHẬN & PHÁT TÍN HIỆU SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>HỦY BỎ</Text>
              </TouchableOpacity>
            </ScrollView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouchArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  photoContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  photoActionsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyPhotoBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  emptyPhotoTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  addPhotoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  noteSection: {
    marginBottom: 14,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
