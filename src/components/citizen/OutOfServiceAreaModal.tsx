import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MapPinOff, MapPin, PhoneCall } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface OutOfServiceAreaModalProps {
  visible: boolean;
  onClose: () => void;
  areaName?: string | null;
  radiusKm?: number;
  distanceOutsideKm?: number;
  latitude?: number;
  longitude?: number;
  onPickOnMap?: () => void;
}

export const OutOfServiceAreaModal: React.FC<OutOfServiceAreaModalProps> = ({
  visible,
  onClose,
  areaName,
  radiusKm,
  distanceOutsideKm,
  onPickOnMap,
}) => {
  const { t } = useTranslation();
  const displayArea = areaName || 'Khu Công nghệ cao (SHTP)';
  const displayRadius = radiusKm ?? 4.5;
  const displayOutside = distanceOutsideKm ? distanceOutsideKm.toFixed(1) : '1.0';

  const handleCall = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
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
          <View style={styles.iconCircle}>
            <MapPinOff size={28} color="#DC2626" />
          </View>

          <Text style={styles.title}>{t('out_of_area.title', 'Ngoài Phạm Vi Cứu Hộ KCN')}</Text>

          <Text style={styles.message}>
            {t('out_of_area.message_part1', 'Toạ độ hiện tại nằm ngoài khu vực hoạt động chuyên trách của ')}
            <Text style={styles.highlightText}>{displayArea}</Text>
            {t('out_of_area.message_part2', ' khoảng ')}
            <Text style={styles.highlightText}>~{displayOutside} km</Text>
            {t('out_of_area.message_part3', ' (Bán kính hỗ trợ: {{radius}} km).', { radius: displayRadius })}
          </Text>

          <Text style={styles.subMessage}>
            {t('out_of_area.submessage', 'Nếu bạn đang ở gần hoặc bị định vị lệch, hãy chọn vị trí cố định trên bản đồ hoặc gọi trực tiếp tổng đài khẩn cấp quốc gia:')}
          </Text>

          {/* Quick Call Row */}
          <View style={styles.callRow}>
            <TouchableOpacity
              style={[styles.callBtn, styles.callBtn114]}
              onPress={() => handleCall('114')}
              activeOpacity={0.8}
            >
              <PhoneCall size={14} color="#DC2626" />
              <Text style={styles.callBtnText114}>{t('out_of_area.call_114', 'Gọi 114 (PCCC)')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callBtn, styles.callBtn115]}
              onPress={() => handleCall('115')}
              activeOpacity={0.8}
            >
              <PhoneCall size={14} color="#0284C7" />
              <Text style={styles.callBtnText115}>{t('out_of_area.call_115', 'Gọi 115 (Y Tế)')}</Text>
            </TouchableOpacity>
          </View>

          {onPickOnMap && (
            <TouchableOpacity
              style={styles.pickMapButton}
              onPress={() => {
                onClose();
                onPickOnMap();
              }}
              activeOpacity={0.8}
            >
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.pickMapButtonText}>{t('out_of_area.pick_on_map', 'Chọn Vị Trí Trên Bản Đồ')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>{t('out_of_area.understood_close', 'Đã hiểu & Đóng')}</Text>
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
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  highlightText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  subMessage: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  callRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  callBtn114: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  callBtnText114: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12.5,
  },
  callBtn115: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  callBtnText115: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 12.5,
  },
  pickMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pickMapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
});

