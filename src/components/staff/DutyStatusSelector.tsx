import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import {
  Radio,
  Wifi,
  MapPin,
  CheckCircle2,
  Clock,
  PowerOff,
  Activity,
  AlertCircle,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export type DutyStatus = 'online' | 'busy' | 'offline';

interface DutyStatusSelectorProps {
  currentStatus: DutyStatus;
  onStatusChange: (newStatus: DutyStatus) => void;
  gpsStatusText?: string;
  serverStatusText?: string;
  radioChannelText?: string;
}

export const DutyStatusSelector: React.FC<DutyStatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  gpsStatusText = 'GPS: Tốt (±3m)',
  serverStatusText = 'Máy chủ: Đã kết nối',
  radioChannelText = 'Kênh 04 (115 TT)',
}) => {
  // Pulsing animation for online/active status
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (currentStatus === 'online') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [currentStatus]);

  const handleSelectStatus = (status: DutyStatus) => {
    if (status === currentStatus) return;

    if (status === 'offline') {
      Alert.alert(
        'Xác Nhận Nghỉ Ca',
        'Bạn có chắc chắn muốn chuyển sang trạng thái Nghỉ Ca? Hệ thống sẽ ngừng phân phối các ca khẩn cấp.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Nghỉ Ca',
            style: 'destructive',
            onPress: () => onStatusChange('offline'),
          },
        ]
      );
    } else if (status === 'busy') {
      Alert.alert(
        'Tạm Nghỉ / Đang Tiếp Nhiên Liệu',
        'Chuyển trạng thái tạm nghỉ. Bạn sẽ tạm thời không nhận cuộc gọi điều phối mới trong 15-30 phút.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác Nhận',
            onPress: () => onStatusChange('busy'),
          },
        ]
      );
    } else {
      onStatusChange('online');
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Header Label */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Activity size={moderateScale(15)} color="#38BDF8" />
          <Text style={styles.headerTitle}>TRẠNG THÁI TRỰC CA</Text>
        </View>
        <View style={styles.activePill}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: currentStatus === 'online' ? pulseAnim : 1 }],
                backgroundColor:
                  currentStatus === 'online'
                    ? '#10B981'
                    : currentStatus === 'busy'
                    ? '#F59E0B'
                    : '#EF4444',
              },
            ]}
          />
          <Text
            style={[
              styles.activePillText,
              {
                color:
                  currentStatus === 'online'
                    ? '#10B981'
                    : currentStatus === 'busy'
                    ? '#F59E0B'
                    : '#EF4444',
              },
            ]}
          >
            {currentStatus === 'online'
              ? 'SẴN SÀNG NHẬN CA'
              : currentStatus === 'busy'
              ? 'TẠM NGHỈ'
              : 'NGHỈ CA'}
          </Text>
        </View>
      </View>

      {/* 3-State Toggle Segment */}
      <View style={styles.segmentedControl}>
        {/* 1. ONLINE Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            currentStatus === 'online' && styles.segmentOnlineActive,
          ]}
          onPress={() => handleSelectStatus('online')}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: '#10B981' },
              currentStatus === 'online' && styles.statusIndicatorActive,
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              currentStatus === 'online' && styles.segmentTextOnlineActive,
            ]}
          >
            Online
          </Text>
          <Text
            style={[
              styles.segmentSubtext,
              currentStatus === 'online' && styles.segmentSubtextOnlineActive,
            ]}
          >
            Sẵn sàng
          </Text>
        </TouchableOpacity>

        {/* 2. BUSY Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            currentStatus === 'busy' && styles.segmentBusyActive,
          ]}
          onPress={() => handleSelectStatus('busy')}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: '#F59E0B' },
              currentStatus === 'busy' && styles.statusIndicatorActive,
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              currentStatus === 'busy' && styles.segmentTextBusyActive,
            ]}
          >
            Busy
          </Text>
          <Text
            style={[
              styles.segmentSubtext,
              currentStatus === 'busy' && styles.segmentSubtextBusyActive,
            ]}
          >
            Tạm nghỉ
          </Text>
        </TouchableOpacity>

        {/* 3. OFFLINE Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            currentStatus === 'offline' && styles.segmentOfflineActive,
          ]}
          onPress={() => handleSelectStatus('offline')}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: '#EF4444' },
              currentStatus === 'offline' && styles.statusIndicatorActive,
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              currentStatus === 'offline' && styles.segmentTextOfflineActive,
            ]}
          >
            Offline
          </Text>
          <Text
            style={[
              styles.segmentSubtext,
              currentStatus === 'offline' && styles.segmentSubtextOfflineActive,
            ]}
          >
            Nghỉ ca
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network & Telemetry Status Badges */}
      <View style={styles.telemetryRow}>
        {/* GPS Badge */}
        <View style={styles.telemetryBadge}>
          <View style={[styles.telemetryDot, { backgroundColor: '#10B981' }]} />
          <MapPin size={moderateScale(11)} color="#10B981" />
          <Text style={styles.telemetryText}>{gpsStatusText}</Text>
        </View>

        {/* Server Badge */}
        <View style={styles.telemetryBadge}>
          <Wifi size={moderateScale(11)} color="#38BDF8" />
          <Text style={styles.telemetryText}>{serverStatusText}</Text>
        </View>

        {/* Radio Channel Badge */}
        <View style={styles.telemetryBadge}>
          <Radio size={moderateScale(11)} color="#A78BFA" />
          <Text style={styles.telemetryText}>{radioChannelText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: verticalScale(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  headerTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#334155',
    gap: scale(5),
  },
  pulseCircle: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
  },
  activePillText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(12),
    padding: scale(4),
    gap: scale(6),
    borderWidth: 1,
    borderColor: '#334155',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: verticalScale(9),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  segmentOnlineActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  segmentBusyActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  segmentOfflineActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  statusIndicator: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginBottom: verticalScale(3),
    opacity: 0.6,
  },
  statusIndicatorActive: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  segmentText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextOnlineActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  segmentTextBusyActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  segmentTextOfflineActive: {
    color: '#EF4444',
    fontWeight: '800',
  },
  segmentSubtext: {
    fontSize: moderateScale(9.5),
    fontWeight: '500',
    color: '#475569',
    marginTop: verticalScale(1),
  },
  segmentSubtextOnlineActive: {
    color: '#34D399',
  },
  segmentSubtextBusyActive: {
    color: '#FBBF24',
  },
  segmentSubtextOfflineActive: {
    color: '#F87171',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(7),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: scale(4),
  },
  telemetryDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
  },
  telemetryText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
