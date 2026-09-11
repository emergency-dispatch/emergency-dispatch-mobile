import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { MapPin, Navigation, Shield, AlertTriangle } from 'lucide-react-native';

export const SafetyMapScreen: React.FC = () => {
  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
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
          <MapPin size={24} color="#DC2626" />
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
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  centerPill: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  centerPillText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  recenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  recenterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
