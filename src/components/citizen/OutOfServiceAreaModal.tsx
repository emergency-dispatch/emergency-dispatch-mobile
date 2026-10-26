import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MapPinOff, PhoneCall, X, AlertTriangle } from 'lucide-react-native';

interface OutOfServiceAreaModalProps {
  visible: boolean;
  onClose: () => void;
  areaName?: string | null;
  radiusKm?: number;
  distanceOutsideKm?: number;
  latitude?: number;
  longitude?: number;
}

export const OutOfServiceAreaModal: React.FC<OutOfServiceAreaModalProps> = ({
  visible,
  onClose,
  areaName,
  radiusKm,
  distanceOutsideKm,
  latitude,
  longitude,
}) => {
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeIconBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <MapPinOff size={32} color="#DC2626" />
          </View>

          <Text style={styles.title}>Ngoài Phạm Vi Phục Vụ</Text>

          <View style={styles.reasonBox}>
            <AlertTriangle size={18} color="#D97706" style={{ marginTop: 2 }} />
            <Text style={styles.reasonText}>
              Không thể gửi yêu cầu cứu nạn vì toạ độ hiện tại của bạn nằm ngoài bán kính hoạt động của nền tảng.
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Khu vực tiếp nhận: </Text>
              <Text style={styles.detailValue}>{areaName || 'Khu vực hoạt động ResQ'}</Text>
            </Text>
            {!!radiusKm && (
              <Text style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bán kính phủ sóng: </Text>
                <Text style={styles.detailValue}>{radiusKm} km</Text>
              </Text>
            )}
            {typeof distanceOutsideKm === 'number' && distanceOutsideKm > 0 && (
              <Text style={styles.detailRow}>
                <Text style={styles.detailLabel}>Khoảng cách vượt ngoài: </Text>
                <Text style={[styles.detailValue, { color: '#DC2626', fontWeight: '700' }]}>
                  {distanceOutsideKm.toFixed(1)} km
                </Text>
              </Text>
            )}
            {typeof latitude === 'number' && typeof longitude === 'number' && (
              <Text style={styles.coordText}>
                Toạ độ: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <Text style={styles.hotlinePrompt}>
            Vui lòng gọi ngay đầu số cứu hộ quốc gia để được trợ giúp tức thì:
          </Text>

          <View style={styles.hotlineRow}>
            <TouchableOpacity
              style={[styles.hotlineBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => handleCall('114')}
              activeOpacity={0.8}
            >
              <PhoneCall size={18} color="#FFFFFF" />
              <Text style={styles.hotlineBtnText}>114 Cứu hoả</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.hotlineBtn, { backgroundColor: '#0284C7' }]}
              onPress={() => handleCall('115')}
              activeOpacity={0.8}
            >
              <PhoneCall size={18} color="#FFFFFF" />
              <Text style={styles.hotlineBtnText}>115 Cấp cứu</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Đã hiểu & Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  reasonBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  detailRow: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailLabel: {
    color: '#64748B',
  },
  detailValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  coordText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hotlinePrompt: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 10,
  },
  hotlineRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14,
  },
  hotlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  hotlineBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});
