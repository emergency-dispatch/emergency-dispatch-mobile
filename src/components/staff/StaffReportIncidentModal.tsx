import React, { useState, useEffect } from 'react';
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
import {
  X,
  AlertTriangle,
  Flame,
  Car,
  ShieldAlert,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Truck,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import {
  FieldIncidentReportPayload,
  FieldIncidentReportResultDto,
} from '../../types/dispatch';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { locationService, DEFAULT_VN_LOCATION } from '../../services/location.service';

interface StaffReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess: (result: FieldIncidentReportResultDto) => void;
  defaultVehicleId?: string;
  defaultPlate?: string;
  teamName?: string;
}

const QUICK_TITLES = [
  'Phát hiện đám cháy khu dân cư',
  'Tai nạn va chạm giao thông nghiêm trọng',
  'Chập điện phát hỏa đường dây',
  'Sạt lở / sập đổ công trình',
  'Cứu nạn cứu hộ khẩn cấp',
];

export const StaffReportIncidentModal: React.FC<StaffReportIncidentModalProps> = ({
  visible,
  onClose,
  onSubmitSuccess,
  defaultVehicleId,
  defaultPlate,
  teamName,
}) => {
  const [eventType, setEventType] = useState<'FireExplosion' | 'TrafficAccident' | 'Other'>('FireExplosion');
  const [severity, setSeverity] = useState<'Level1' | 'Level2' | 'Level3'>('Level2');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(DEFAULT_VN_LOCATION.latitude);
  const [longitude, setLongitude] = useState(DEFAULT_VN_LOCATION.longitude);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto fetch location on open
  useEffect(() => {
    if (visible) {
      fetchCurrentLocation();
    }
  }, [visible]);

  const fetchCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      if (loc.address) {
        setAddress(loc.address);
      }
    } catch {
      // Keep existing default
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ hiện trường sự cố.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: FieldIncidentReportPayload = {
        title: title.trim() || `Sự cố hiện trường - ${teamName || defaultPlate || 'Tổ cứu hộ'}`,
        description: description.trim() || undefined,
        latitude,
        longitude,
        locationAddress: address.trim(),
        eventType,
        severity,
        rescueUnitId: defaultVehicleId || undefined,
      };

      const result = await staffDispatchService.reportFieldIncident(payload);
      Alert.alert(
        'Thành công',
        `Đã tạo sự cố ${result.incidentCode || ''} và tự nhận tác chiến tại hiện trường.`
      );
      onClose();
      onSubmitSuccess(result);
    } catch (err: any) {
      Alert.alert('Lỗi báo cáo sự cố', err.message || 'Không thể gửi báo cáo sự cố hiện trường.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) {
    return null;
  }

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
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrapper}>
                <ShieldAlert size={moderateScale(20)} color="#DC2626" />
              </View>
              <View style={styles.headerTextWrapper}>
                <Text style={styles.modalTitle}>Báo Sự Cố Hiện Trường</Text>
                <Text style={styles.modalSubtitle}>
                  Tổ tự phát hiện sự cố & tự nhận xử lý tại chỗ (§64)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSubmitting}>
              <X size={moderateScale(18)} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Field Self-Dispatch Notice */}
            <View style={styles.noticeBox}>
              <ShieldAlert size={moderateScale(15)} color="#1D4ED8" />
              <Text style={styles.noticeText}>
                Hệ thống sẽ lập tức đưa tổ của bạn vào trạng thái <Text style={styles.boldText}>Đang ở hiện trường</Text> mà không cần qua quy trình duyệt lệnh hay rung chuông báo động.
              </Text>
            </View>

            {/* Event Type */}
            <Text style={styles.sectionLabel}>Loại sự cố phát hiện *</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeButton, eventType === 'FireExplosion' && styles.typeButtonActive]}
                onPress={() => setEventType('FireExplosion')}
              >
                <Flame size={moderateScale(18)} color={eventType === 'FireExplosion' ? '#DC2626' : '#64748B'} />
                <Text style={[styles.typeText, eventType === 'FireExplosion' && styles.typeTextActive]}>
                  Cháy nổ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, eventType === 'TrafficAccident' && styles.typeButtonActive]}
                onPress={() => setEventType('TrafficAccident')}
              >
                <Car size={moderateScale(18)} color={eventType === 'TrafficAccident' ? '#DC2626' : '#64748B'} />
                <Text style={[styles.typeText, eventType === 'TrafficAccident' && styles.typeTextActive]}>
                  Tai nạn xe
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, eventType === 'Other' && styles.typeButtonActive]}
                onPress={() => setEventType('Other')}
              >
                <AlertTriangle size={moderateScale(18)} color={eventType === 'Other' ? '#DC2626' : '#64748B'} />
                <Text style={[styles.typeText, eventType === 'Other' && styles.typeTextActive]}>
                  Sự cố khác
                </Text>
              </TouchableOpacity>
            </View>

            {/* Severity Level */}
            <Text style={styles.sectionLabel}>Mức độ nghiêm trọng *</Text>
            <View style={styles.severityRow}>
              {(['Level1', 'Level2', 'Level3'] as const).map((lvl) => {
                const isSelected = severity === lvl;
                const label = lvl === 'Level1' ? 'Cấp 1 · Nhẹ' : lvl === 'Level2' ? 'Cấp 2 · Vừa' : 'Cấp 3 · Nặng';
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.severityButton,
                      isSelected && (lvl === 'Level3' ? styles.severityLevel3 : lvl === 'Level2' ? styles.severityLevel2 : styles.severityLevel1),
                    ]}
                    onPress={() => setSeverity(lvl)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        isSelected && styles.severityTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Titles */}
            <Text style={styles.sectionLabel}>Gợi ý nhanh tiêu đề</Text>
            <View style={styles.chipsRow}>
              {QUICK_TITLES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.chipButton}
                  onPress={() => setTitle(t)}
                >
                  <Text style={styles.chipText}>+ {t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text style={styles.sectionLabel}>Tiêu đề sự cố</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tiêu đề sự cố..."
              value={title}
              onChangeText={setTitle}
            />

            {/* Location Address */}
            <View style={styles.locationLabelRow}>
              <Text style={styles.sectionLabel}>Địa chỉ hiện trường *</Text>
              <TouchableOpacity
                style={styles.refreshLocButton}
                onPress={fetchCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <RefreshCw size={moderateScale(12)} color="#2563EB" />
                    <Text style={styles.refreshLocText}>Lấy lại GPS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.locationInputWrapper}>
              <MapPin size={moderateScale(16)} color="#64748B" style={styles.locationIcon} />
              <TextInput
                style={[styles.textInput, styles.locationInput]}
                placeholder="Số nhà, tên đường, khu vực..."
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <Text style={styles.gpsCoordsText}>
              Tọa độ: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>

            {/* Vehicle Plate Info */}
            {defaultPlate && (
              <View style={styles.vehicleInfoBox}>
                <Truck size={moderateScale(16)} color="#047857" />
                <Text style={styles.vehicleInfoText}>
                  Phương tiện tác chiến: <Text style={styles.boldText}>{defaultPlate}</Text>
                </Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.sectionLabel}>Mô tả chi tiết hiện trường</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Nạn nhân, nguy cơ cháy lan, đặc điểm nhận dạng..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldAlert size={moderateScale(16)} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>TỰ NHẬN TÁC CHIẾN</Text>
                </>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '92%',
    paddingBottom: verticalScale(16),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(10),
  },
  headerIconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrapper: {
    flex: 1,
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  closeButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
  },
  scrollBody: {
    maxHeight: verticalScale(460),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  noticeText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: '#1E40AF',
    lineHeight: moderateScale(16),
  },
  boldText: {
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: verticalScale(6),
    marginTop: verticalScale(8),
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  typeButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    gap: verticalScale(4),
  },
  typeButtonActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  typeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  typeTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  severityButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  severityLevel1: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  severityLevel2: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  severityLevel3: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  severityText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#475569',
  },
  severityTextActive: {
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  chipButton: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: moderateScale(10),
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(12),
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  refreshLocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  refreshLocText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#2563EB',
  },
  locationInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  locationIcon: {
    position: 'absolute',
    left: scale(10),
    zIndex: 1,
  },
  locationInput: {
    paddingLeft: scale(32),
  },
  gpsCoordsText: {
    fontSize: moderateScale(10),
    color: '#94A3B8',
    marginTop: verticalScale(3),
    fontFamily: 'monospace',
  },
  vehicleInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginTop: verticalScale(8),
  },
  vehicleInfoText: {
    fontSize: moderateScale(11),
    color: '#065F46',
  },
  textArea: {
    height: verticalScale(60),
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scale(10),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },
  cancelButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
