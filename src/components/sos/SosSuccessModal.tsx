import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ShieldAlert, CheckCircle2, PhoneCall, XCircle, Sparkles, X } from 'lucide-react-native';
import { IncidentResponseDto } from '../../types/incident';

interface SosSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelIncident?: (incidentId: string) => Promise<void> | void;
  address: string;
  incident?: IncidentResponseDto | null;
}

export const SosSuccessModal: React.FC<SosSuccessModalProps> = ({
  visible,
  onClose,
  onCancelIncident,
  address,
  incident,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible) {
      setSecondsElapsed(0);
      setIsCancelling(false);
      Vibration.vibrate([0, 250, 100, 250]);
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const handlePressCancel = () => {
    Alert.alert(
      'Hủy Báo Động SOS?',
      'Bạn có chắc chắn muốn hủy tín hiệu SOS vừa gửi vì bấm nhầm không?',
      [
        { text: 'Không, giữ lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            if (incident?.id && onCancelIncident) {
              setIsCancelling(true);
              try {
                await onCancelIncident(incident.id);
              } catch (err: any) {
                Alert.alert('Lỗi hủy báo động', err.message || 'Không thể hủy báo động lúc này.');
              } finally {
                setIsCancelling(false);
              }
            } else {
              onClose();
            }
          },
        },
      ]
    );
  };

  const incidentCode = incident
    ? `#${incident.id.slice(0, 8).toUpperCase()}`
    : `#SOS-${(Date.now() % 100000).toString()}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top-Right Close Button (X) */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityLabel="Đóng thông báo SOS"
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Top Status Icon */}
          <View style={styles.iconCircle}>
            <ShieldAlert size={44} color="#DC2626" strokeWidth={2.5} />
          </View>

          <Text style={styles.alertHeader}>TÍN HIỆU SOS ĐÃ TIẾP NHẬN</Text>
          <Text style={styles.alertCode}>MÃ SỰ CỐ: {incidentCode}</Text>

          {/* Status checklist */}
          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <CheckCircle2 size={16} color="#16A34A" />
              <Text style={styles.statusText}>Đã gửi toạ độ GPS chính xác</Text>
            </View>
            <View style={styles.statusRow}>
              <CheckCircle2 size={16} color="#16A34A" />
              <Text style={styles.statusText}>Đã kết nối trung tâm điều phối 114/115</Text>
            </View>
            {incident?.aiClassification && (
              <View style={[styles.statusRow, { alignItems: 'flex-start' }]}>
                <Sparkles size={16} color="#0284C7" style={{ marginTop: 2 }} />
                <Text style={[styles.statusText, { color: '#0284C7', flex: 1 }]}>
                  AI Phân Loại ({incident.severity}): {incident.aiClassification.summary}
                </Text>
              </View>
            )}
          </View>

          {/* Location box */}
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>VỊ TRÍ HIỆN TRƯỜNG:</Text>
            <Text style={styles.locationAddress}>{address}</Text>
            <Text style={styles.timerText}>Thời gian phát tín hiệu: {secondsElapsed}s trước</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.callButton}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Gọi trực tiếp 114 hoặc 115"
            >
              <PhoneCall size={18} color="#FFFFFF" />
              <Text style={styles.callButtonText}>GỌI TRỰC TIẾP TỔNG ĐÀI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dismissButton}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Đóng cửa sổ và theo dõi trên bản đồ"
            >
              <Text style={styles.dismissButtonText}>Đóng & Theo Dõi Ca Cứu Hộ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.cancelButton}
              onPress={handlePressCancel}
              disabled={isCancelling}
              accessible={true}
              accessibilityLabel="Hủy báo động SOS nếu bấm nhầm"
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <XCircle size={16} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>Hủy báo động (Bấm nhầm)</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  alertHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '600',
  },
  locationBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  dismissButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  closeIconButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
