import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Camera,
  Images,
  Trash2,
  X,
  Send,
  Flame,
  Car,
  HelpCircle,
  Search,
  Edit2,
} from 'lucide-react-native';
import { mapboxService } from '../../services/mapbox.service';

interface SosConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  photoUri?: string | null;
  address: string;
  initialCoords?: { latitude: number; longitude: number } | null;
  onConfirm: (
    note: string,
    eventType?: 'FireExplosion' | 'TrafficAccident',
    customLocation?: { address: string; latitude: number; longitude: number }
  ) => void;
  onRetakePhoto: () => void;
  onPickLibrary: () => void;
  onRemovePhoto: () => void;
}

export const SosConfirmModal: React.FC<SosConfirmModalProps> = ({
  visible,
  onClose,
  photoUri,
  address,
  initialCoords,
  onConfirm,
  onRetakePhoto,
  onPickLibrary,
  onRemovePhoto,
}) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [reportedEventType, setReportedEventType] = useState<'FireExplosion' | 'TrafficAccident' | undefined>(undefined);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Quản lý địa chỉ & gợi ý khi gõ
  const [addressText, setAddressText] = useState(address);
  const [confirmedCoords, setConfirmedCoords] = useState<{ latitude: number; longitude: number } | null>(initialCoords || null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddressDirty, setIsAddressDirty] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; latitude: number; longitude: number }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasGps = Boolean(
    initialCoords &&
    initialCoords.latitude !== 0 &&
    initialCoords.longitude !== 0 &&
    address &&
    address !== 'Đang xác định vị trí...'
  );

  useEffect(() => {
    if (visible) {
      setAddressText(address || '');
      setConfirmedCoords(initialCoords || null);
      // Nếu không lấy được GPS thì mở sẵn ô nhập địa chỉ
      setIsEditingAddress(!hasGps);
      setIsAddressDirty(false);
      setSuggestions([]);
      setIsSearchingAddress(false);
    } else {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    }
  }, [visible, address, initialCoords, hasGps]);

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

  const handleConfirm = () => {
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

    const customLoc = {
      address: addressText.trim() || address,
      latitude: confirmedCoords.latitude,
      longitude: confirmedCoords.longitude,
    };

    onConfirm(note, reportedEventType, customLoc);
    setNote('');
    setReportedEventType(undefined);
    setIsAddressDirty(false);
    setSuggestions([]);
  };

  const handleClose = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setNote('');
    setReportedEventType(undefined);
    setIsAddressDirty(false);
    setSuggestions([]);
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
                      <Edit2 size={12} color="#0284C7" />
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
                    <MapPin size={16} color="#DC2626" style={{ marginTop: 2 }} />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {addressText || address || 'Chưa xác định được địa chỉ'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addressInputWrapper}>
                    <View style={styles.addressSearchBox}>
                      {isSearchingAddress ? (
                        <ActivityIndicator size="small" color="#DC2626" style={styles.addressSearchIcon} />
                      ) : (
                        <Search size={16} color="#DC2626" style={styles.addressSearchIcon} />
                      )}
                      <TextInput
                        style={styles.addressTextInput}
                        value={addressText}
                        onChangeText={handleAddressChange}
                        placeholder="Nhập địa chỉ hiện trường..."
                        placeholderTextColor="#94A3B8"
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
                          <X size={14} color="#64748B" />
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
                            <MapPin size={14} color="#DC2626" style={{ marginTop: 2, marginRight: 6 }} />
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

              {/* Event Type Selector */}
              <View style={styles.eventTypeSection}>
                <Text style={styles.noteLabel}>Loại sự cố khẩn cấp</Text>
                <View style={styles.eventTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.eventTypeChip,
                      reportedEventType === 'FireExplosion' && styles.eventTypeChipActiveFire,
                    ]}
                    onPress={() =>
                      setReportedEventType((prev) => (prev === 'FireExplosion' ? undefined : 'FireExplosion'))
                    }
                    activeOpacity={0.7}
                  >
                    <Flame size={15} color={reportedEventType === 'FireExplosion' ? '#DC2626' : '#64748B'} />
                    <Text
                      style={[
                        styles.eventTypeText,
                        reportedEventType === 'FireExplosion' && styles.eventTypeTextActiveFire,
                      ]}
                    >
                      Cháy nổ
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.eventTypeChip,
                      reportedEventType === 'TrafficAccident' && styles.eventTypeChipActiveCrash,
                    ]}
                    onPress={() =>
                      setReportedEventType((prev) => (prev === 'TrafficAccident' ? undefined : 'TrafficAccident'))
                    }
                    activeOpacity={0.7}
                  >
                    <Car size={15} color={reportedEventType === 'TrafficAccident' ? '#2563EB' : '#64748B'} />
                    <Text
                      style={[
                        styles.eventTypeText,
                        reportedEventType === 'TrafficAccident' && styles.eventTypeTextActiveCrash,
                      ]}
                    >
                      Tai nạn
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.eventTypeChip,
                      reportedEventType === undefined && styles.eventTypeChipActiveNeutral,
                    ]}
                    onPress={() => setReportedEventType(undefined)}
                    activeOpacity={0.7}
                  >
                    <HelpCircle size={15} color={reportedEventType === undefined ? '#475569' : '#64748B'} />
                    <Text
                      style={[
                        styles.eventTypeText,
                        reportedEventType === undefined && styles.eventTypeTextActiveNeutral,
                      ]}
                    >
                      Không rõ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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
  addressSection: {
    marginBottom: 12,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
  },
  changeAddressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  addressInputWrapper: {
    marginBottom: 4,
  },
  addressSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    paddingHorizontal: 10,
    minHeight: 42,
  },
  addressSearchIcon: {
    marginRight: 6,
  },
  addressTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 8,
  },
  clearAddressBtn: {
    padding: 4,
  },
  addressWarningText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
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
  eventTypeSection: {
    marginBottom: 12,
  },
  eventTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  eventTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  eventTypeChipActiveFire: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  eventTypeChipActiveCrash: {
    backgroundColor: '#EFF6FF',
    borderColor: '#60A5FA',
  },
  eventTypeChipActiveNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#94A3B8',
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  eventTypeTextActiveFire: {
    color: '#DC2626',
    fontWeight: '800',
  },
  eventTypeTextActiveCrash: {
    color: '#2563EB',
    fontWeight: '800',
  },
  eventTypeTextActiveNeutral: {
    color: '#334155',
    fontWeight: '800',
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
