import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { ShieldAlert, CheckCircle2, PhoneCall, XCircle } from 'lucide-react-native';

interface SosSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  address: string;
}

export const SosSuccessModal: React.FC<SosSuccessModalProps> = ({
  visible,
  onClose,
  address,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible) {
      setSecondsElapsed(0);
      Vibration.vibrate([0, 250, 100, 250]);
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Status Icon */}
          <View style={styles.iconCircle}>
            <ShieldAlert size={48} color="#EF4444" strokeWidth={2.5} />
          </View>

          <Text style={styles.alertHeader}>TÍN HIỆU SOS ĐÃ PHÁT</Text>
          <Text style={styles.alertCode}>MÃ SỰ CỐ: #SOS-{(Date.now() % 100000).toString()}</Text>

          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.statusText}>Đã gửi toạ độ GPS chính xác</Text>
            </View>
            <View style={styles.statusRow}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.statusText}>Đang kết nối trung tâm điều phối 114/115</Text>
            </View>
          </View>

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
              activeOpacity={0.7}
              style={styles.cancelButton}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Hủy báo động SOS nếu bấm nhầm"
            >
              <XCircle size={16} color="#94A3B8" />
              <Text style={styles.cancelButtonText}>Hủy báo động (Bấm nhầm)</Text>
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
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  alertHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
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
    color: '#F1F5F9',
    fontWeight: '600',
  },
  locationBox: {
    width: '100%',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 11,
    color: '#94A3B8',
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
    paddingVertical: 10,
    gap: 6,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
