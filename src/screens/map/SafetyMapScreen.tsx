import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { MapPin, Navigation, Shield, AlertTriangle } from 'lucide-react-native';

export const SafetyMapScreen: React.FC = () => {
  return (
    <ScreenContainer
      backgroundColor="#0F172A"
      edges={['top', 'left', 'right']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bản Đồ An Toàn</Text>
        <Text style={styles.subtitle}>Cảnh báo sự cố & điểm trú ẩn khẩn cấp xung quanh</Text>
      </View>

      {/* Mock Map View Area */}
      <View style={styles.mapArea}>
        <View style={styles.centerPill}>
          <MapPin size={24} color="#EF4444" />
          <Text style={styles.centerPillText}>Vị trí của bạn (Độ chính xác cao ±3m)</Text>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <Shield size={16} color="#10B981" />
            <Text style={styles.legendText}>Trạm y tế / Bệnh viện</Text>
          </View>
          <View style={styles.legendItem}>
            <AlertTriangle size={16} color="#F59E0B" />
            <Text style={styles.legendText}>Khu vực cảnh báo ngập / cháy</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.recenterButton}
        accessible={true}
        accessibilityLabel="Định vị lại vị trí hiện tại"
      >
        <Navigation size={18} color="#FFFFFF" />
        <Text style={styles.recenterText}>ĐỊNH VỊ LẠI VỊ TRÍ HIỆN TẠI</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  centerPill: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  centerPillText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  recenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  recenterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
