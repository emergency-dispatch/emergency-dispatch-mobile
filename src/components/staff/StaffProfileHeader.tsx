import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface StaffProfileHeaderProps {
  name?: string;
  role?: string;
  vehiclePlate?: string;
  unreadNotificationsCount?: number;
  dutyStatus?: 'online' | 'busy' | 'offline';
  onPressNotifications?: () => void;
  onPressSettings?: () => void;
  onPressAvatar?: () => void;
  staffId?: string;
  onPressLanguage?: () => void;
  currentLang?: string;
}

export const StaffProfileHeader: React.FC<StaffProfileHeaderProps> = ({
  name = 'Trần Cứu Hộ',
  role = 'Medic',
  vehiclePlate = '51B-115.02',
  unreadNotificationsCount = 0,
  dutyStatus = 'online',
  onPressNotifications,
  onPressSettings,
  onPressAvatar,
}) => {
  const getStatusColor = () => {
    switch (dutyStatus) {
      case 'online':
        return '#10B981'; // Emerald Green
      case 'busy':
        return '#F59E0B'; // Amber
      case 'offline':
        return '#94A3B8'; // Slate Gray
      default:
        return '#10B981';
    }
  };

  const statusColor = getStatusColor();

  // Get 2-letter initials
  const initials = name
    ? name
        .trim()
        .split(' ')
        .map((part) => part[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'TC';

  return (
    <View style={styles.container}>
      {/* Left: Avatar with online status dot */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressAvatar}
        style={styles.avatarWrapper}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </TouchableOpacity>

      {/* Center: Responder Name + inline subtitle (Medic • Xe 51B-115.02) */}
      <View style={styles.infoWrapper}>
        <Text style={styles.responderName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {role} • Xe {vehiclePlate}
        </Text>
      </View>

      {/* Right: Notification bell with badge dot + Settings gear */}
      <View style={styles.actionsWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={onPressNotifications}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible={true}
          accessibilityLabel="Thông báo"
        >
          <Bell size={moderateScale(19)} color="#334155" strokeWidth={2} />
          {unreadNotificationsCount > 0 && <View style={styles.bellBadgeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={onPressSettings}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible={true}
          accessibilityLabel="Cài đặt"
        >
          <Settings size={moderateScale(19)} color="#334155" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
    marginBottom: verticalScale(12),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(11),
    height: moderateScale(11),
    borderRadius: moderateScale(5.5),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoWrapper: {
    flex: 1,
    marginLeft: scale(10),
    justifyContent: 'center',
  },
  responderName: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#64748B',
    marginTop: verticalScale(1.5),
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  iconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: moderateScale(7),
    right: moderateScale(8),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
