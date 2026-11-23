import React, { useState, useRef, useEffect } from 'react';
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
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Video, X, Send, CheckCircle2, AlertCircle, Images, Trash2, MapPin, Search, Edit2 } from 'lucide-react-native';
import { HazardItem } from './QuickHazardGrid';
import { mediaService } from '../../services/media.service';
import { mapboxService } from '../../services/mapbox.service';
import { useTranslation } from 'react-i18next';

interface MediaReportModalProps {
  visible: boolean;
  onClose: () => void;
  selectedHazard?: HazardItem | null;
  currentAddress: string;
  initialCoords?: { latitude: number; longitude: number } | null;
  onSubmitReport: (data: {
    hazardId?: string;
    mediaType: 'photo' | 'video' | 'none';
    mediaUrls?: string[];
    note: string;
    customLocation?: { address: string; latitude: number; longitude: number };
  }) => Promise<void> | void;
}

export const MediaReportModal: React.FC<MediaReportModalProps> = ({
  visible,
  onClose,
  selectedHazard,
  currentAddress,
  initialCoords,
  onSubmitReport,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedMedia, setSelectedMedia] = useState<'photo' | 'video' | 'none'>('none');
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý địa chỉ & gợi ý khi gõ
  const [addressText, setAddressText] = useState(currentAddress);
  const [confirmedCoords, setConfirmedCoords] = useState<{ latitude: number; longitude: number } | null>(initialCoords || null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddressDirty, setIsAddressDirty] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; latitude: number; longitude: number }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasVisibleRef = useRef(false);

  const hasGps = Boolean(
    initialCoords &&
    initialCoords.latitude !== 0 &&
    initialCoords.longitude !== 0 &&
    currentAddress &&
    currentAddress !== 'Đang xác định vị trí...'
  );

  // Chỉ khởi tạo khi modal vừa mở (tránh parent re-render làm mất địa chỉ đang gõ/chọn)
  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      wasVisibleRef.current = true;
      setAddressText(currentAddress || '');
      setConfirmedCoords(initialCoords || null);
      // Nếu không lấy được GPS thì mở sẵn ô nhập địa chỉ
      setIsEditingAddress(!hasGps);
      setIsAddressDirty(false);
      setSuggestions([]);
      setIsSearchingAddress(false);
    } else if (!visible && wasVisibleRef.current) {
      wasVisibleRef.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    }
  }, [visible, currentAddress, initialCoords, hasGps]);

  useEffect(() => {
    if (visible && hasGps && !isAddressDirty && (!confirmedCoords || confirmedCoords.latitude === 0)) {
      setAddressText(currentAddress || '');
      setConfirmedCoords(initialCoords || null);
    }
  }, [visible, hasGps, currentAddress, initialCoords, isAddressDirty, confirmedCoords]);

  const handleAddressChange = (text: string) => {
    setAddressText(text);
    setIsAddressDirty(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    // Dùng lại mapboxService.searchLocation và chờ khoảng 400 ms sau khi gõ như ở SafetyMapScreen
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const results = await mapboxService.searchLocation(text.trim(), {
          proximity: confirmedCoords || initialCoords || undefined,
        });
        setSuggestions(results.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (item: { name: string; latitude: number; longitude: number }) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setAddressText(item.name);
    setConfirmedCoords({ latitude: item.latitude, longitude: item.longitude });
    setSuggestions([]);
    setIsAddressDirty(false);
    setIsEditingAddress(false);
    Keyboard.dismiss();
  };

  const handleCapturePhoto = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (!asset) return;
      setIsUploadingMedia(true);
      const url = await mediaService.uploadMedia(asset);
      setUploadedMediaUrls((prev) => [...prev, url]);
      setSelectedMedia('photo');
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh hiện trường lên máy chủ.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePickLibrary = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (!asset) return;
      setIsUploadingMedia(true);
      const url = await mediaService.uploadMedia(asset);
      setUploadedMediaUrls((prev) => [...prev, url]);
      setSelectedMedia('photo');
    } catch (err: any) {
      Alert.alert('Lỗi chọn ảnh', err.message || 'Không thể tải ảnh hiện trường lên máy chủ.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setUploadedMediaUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setSelectedMedia('none');
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Nếu người dân gõ mà không chọn gợi ý thì không được gửi luôn, vì chỉ có chữ, không có toạ độ thì không điều xe được
    if (isAddressDirty) {
      Alert.alert(
        'Chưa chọn toạ độ hiện trường',
        'Bạn đã thay đổi địa chỉ nhưng chưa chọn địa điểm từ danh sách gợi ý. Vui lòng bấm vào một gợi ý bên dưới để hệ thống xác định chính xác toạ độ điều xe cứu hộ.'
      );
      return;
    }

    if (!confirmedCoords || confirmedCoords.latitude === 0 || confirmedCoords.longitude === 0) {
      Alert.alert(
        'Chưa có toạ độ cứu hộ',
        'Hệ thống chưa xác định được toạ độ hiện trường. Vui lòng nhập địa chỉ và bấm chọn gợi ý bên dưới.'
      );
      setIsEditingAddress(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const customLoc = {
      address: addressText.trim() || currentAddress,
      latitude: confirmedCoords.latitude,
      longitude: confirmedCoords.longitude,
    };
    const payload = {
      hazardId: selectedHazard?.id,
      mediaType: (uploadedMediaUrls.length > 0 ? 'photo' : selectedMedia) as 'photo' | 'video' | 'none',
      mediaUrls: [...uploadedMediaUrls],
      note,
      customLocation: customLoc,
    };
    // Close modal first and reset fields to avoid modal clash
    setUploadedMediaUrls([]);
    setSelectedMedia('none');
    setNote('');
    setIsAddressDirty(false);
    setSuggestions([]);
    onClose();

    try {
      await onSubmitReport(payload);
    } catch (err: any) {
      Alert.alert('Lỗi gửi báo cáo', err.message || 'Gửi báo cáo sự cố thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheetContainer,
                  { paddingBottom: Math.max(insets.bottom + 16, 28) },
                ]}
              >
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.header}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.title}>
                      {selectedHazard
                        ? t('sos_modal.title_prefix', { title: selectedHazard.title })
                        : t('sos_modal.default_title')}
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

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Address Section */}
                  <View style={styles.addressSection}>
                    <View style={styles.addressHeaderRow}>
                      <Text style={styles.addressSectionLabel}>
                        Vị trí hiện trường sự cố
                      </Text>
                      {hasGps && (
                        <TouchableOpacity
                          style={styles.changeAddressBtn}
                          onPress={() => setIsEditingAddress((prev) => !prev)}
                          activeOpacity={0.7}
                        >
                          <Edit2 size={12} color="#38BDF8" />
                          <Text style={styles.changeAddressText}>
                            {isEditingAddress ? 'Thu gọn' : 'Đổi địa chỉ'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!isEditingAddress ? (
                      <TouchableOpacity
                        style={styles.addressPill}
                        onPress={() => setIsEditingAddress(true)}
                        activeOpacity={0.8}
                      >
                        <MapPin size={16} color="#EF4444" style={{ marginTop: 2 }} />
                        <Text style={styles.addressPillText} numberOfLines={2}>
                          {addressText || currentAddress || 'Chưa xác định được địa chỉ'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.addressInputWrapper}>
                        <View style={styles.addressSearchBox}>
                          {isSearchingAddress ? (
                            <ActivityIndicator size="small" color="#38BDF8" style={styles.addressSearchIcon} />
                          ) : (
                            <Search size={16} color="#38BDF8" style={styles.addressSearchIcon} />
                          )}
                          <TextInput
                            style={styles.addressTextInput}
                            value={addressText}
                            onChangeText={handleAddressChange}
                            placeholder="Nhập địa chỉ hiện trường..."
                            placeholderTextColor="#64748B"
                            returnKeyType="done"
                            autoFocus={!hasGps}
                          />
                          {addressText.length > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                setAddressText('');
                                setSuggestions([]);
                                setIsAddressDirty(true);
                                setConfirmedCoords(null);
                              }}
                              style={styles.clearAddressBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={14} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {isAddressDirty && (
                          <Text style={styles.addressWarningText}>
                            ⚠️ Vui lòng chọn một địa chỉ từ gợi ý bên dưới để xác định toạ độ.
                          </Text>
                        )}

                        {/* Suggestions list */}
                        {suggestions.length > 0 && (
                          <View style={styles.suggestionsContainer}>
                            {suggestions.map((item, idx) => (
                              <TouchableOpacity
                                key={`${item.latitude}-${item.longitude}-${idx}`}
                                style={styles.suggestionItem}
                                onPress={() => handleSelectSuggestion(item)}
                                activeOpacity={0.7}
                              >
                                <MapPin size={14} color="#EF4444" style={{ marginTop: 2, marginRight: 6 }} />
                                <Text style={styles.suggestionText} numberOfLines={2}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
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
                        {selectedHazard.code ? `${selectedHazard.title} ${selectedHazard.code}` : selectedHazard.title}
                      </Text>
                    </View>
                  )}

                  {/* Quick Media Action Row */}
                  <Text style={styles.label}>{t('sos_modal.attach_media_label')}</Text>
                  <View style={styles.mediaRow}>
                    {/* Take Photo */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleCapturePhoto}
                      disabled={isUploadingMedia}
                      style={[
                        styles.mediaButton,
                        styles.mediaButtonActive,
                        { borderColor: '#38BDF8' },
                      ]}
                    >
                      <Camera size={20} color="#0284C7" />
                      <Text style={[styles.mediaButtonText, styles.mediaButtonTextActive]}>
                        {t('sos_modal.take_photo')}
                      </Text>
                    </TouchableOpacity>

                    {/* Pick From Library */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handlePickLibrary}
                      disabled={isUploadingMedia}
                      style={[
                        styles.mediaButton,
                        styles.mediaButtonActive,
                        { borderColor: '#10B981' },
                      ]}
                    >
                      <Images size={20} color="#059669" />
                      <Text style={[styles.mediaButtonText, { color: '#059669' }]}>
                        {t('sos_modal.pick_library')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Uploading indicator */}
                  {isUploadingMedia && (
                    <View style={styles.uploadingBox}>
                      <ActivityIndicator size="small" color="#0284C7" />
                      <Text style={styles.uploadingText}>{t('sos_modal.uploading_media')}</Text>
                    </View>
                  )}

                  {/* Preview Uploaded Thumbnails */}
                  {uploadedMediaUrls.length > 0 && (
                    <View style={styles.thumbnailRow}>
                      {uploadedMediaUrls.map((url, idx) => (
                        <View key={idx} style={styles.thumbnailWrap}>
                          <Image source={{ uri: url }} style={styles.thumbnailImg} />
                          <TouchableOpacity
                            style={styles.thumbnailRemoveBtn}
                            onPress={() => handleRemoveMedia(idx)}
                          >
                            <X size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Short Note Input */}
                  <Text style={styles.label}>{t('sos_modal.note_label')}</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t('sos_modal.note_placeholder')}
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
                        <Text style={styles.submitText}>{t('sos_modal.send_report_btn')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
  },
  scrollContent: {
    paddingBottom: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  addressSection: {
    marginBottom: 14,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  changeAddressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  addressPillText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  addressInputWrapper: {
    marginBottom: 4,
  },
  addressSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    minHeight: 44,
  },
  addressSearchIcon: {
    marginRight: 6,
  },
  addressTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    paddingVertical: 8,
  },
  clearAddressBtn: {
    padding: 4,
  },
  addressWarningText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '600',
    marginTop: 6,
  },
  suggestionsContainer: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
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
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  uploadingText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  thumbnailWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
