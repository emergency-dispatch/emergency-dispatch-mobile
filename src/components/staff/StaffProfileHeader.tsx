import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  Bell,
  Settings,
  Shield,
  Truck,
  UserCheck,
  Radio,
  Flame,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface StaffProfileHeaderProps {
  name: string;
  role: string;
  staffId: string;
  vehiclePlate: string;
  unreadNotificationsCount?: number;
  dutyStatus: 'online' | 'busy' | 'offline';
  onPressNotifications?: () => void;
  onPressSettings?: () => void;
  onPressAvatar?: () => void;
}

export const StaffProfileHeader: React.FC<StaffProfileHeaderProps> = ({
  name,
  role,
  staffId,
  vehiclePlate,
  unreadNotificationsCount = 0,
  dutyStatus,
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
        return '#EF4444'; // Red
      default:
        return '#64748B';
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      {/* Top Row: Avatar + Info + Action Icons */}
      <View style={styles.topRow}>
        {/* Avatar with Status Ring */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressAvatar}
          style={styles.avatarWrapper}
        >
          <View style={[styles.avatarBorder, { borderColor: statusColor }]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>QH</Text>
            </View>
          </View>
          {/* Status Indicator Dot */}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor, borderColor: '#0F172A' },
            ]}
          />
        </TouchableOpacity>

        {/* Staff Main Info */}
        <View style={styles.infoWrapper}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.verifiedBadge}>
              <Shield size={moderateScale(11)} color="#06B6D4" strokeWidth={2.6} />
            </View>
          </View>
          <Text style={styles.staffRole} numberOfLines={1}>
            {role}
          </Text>
        </View>

        {/* Actions: Notifications & Settings */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.iconButton}
            onPress={onPressNotifications}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={moderateScale(20)} color="#F1F5F9" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.iconButton}
            onPress={onPressSettings}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Settings size={moderateScale(20)} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Row: Staff ID & Vehicle License Plate Badges */}
      <View style={styles.badgesRow}>
        {/* Staff ID Badge */}
        <View style={styles.metaBadge}>
          <View style={[styles.badgeIconBg, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <Shield size={moderateScale(13)} color="#06B6D4" />
          </View>
          <View style={styles.badgeTextCol}>
            <Text style={styles.badgeLabel} numberOfLines={1}>
              Mã nhân viên
            </Text>
            <Text style={styles.badgeValue} numberOfLines={1}>
              #{staffId}
            </Text>
          </View>
        </View>

        {/* Ambulance License Plate Badge */}
        <View style={styles.metaBadge}>
          <View style={[styles.badgeIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Truck size={moderateScale(13)} color="#EF4444" />
          </View>
          <View style={styles.badgeTextCol}>
            <Text style={styles.badgeLabel} numberOfLines={1}>
              Biển số xe trực
            </Text>
            <Text style={[styles.badgeValue, styles.plateValue]} numberOfLines={1}>
              {vehiclePlate}
            </Text>
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: verticalScale(12),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(24),
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    borderWidth: 2,
  },
  infoWrapper: {
    flex: 1,
    marginLeft: scale(12),
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    marginLeft: scale(6),
    padding: moderateScale(2),
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: moderateScale(10),
  },
  staffRole: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  iconButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(3),
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  badgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(12),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: scale(8),
  },
  metaBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 0,
  },
  badgeIconBg: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(7),
  },
  badgeTextCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  badgeLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    color: '#64748B',
  },
  badgeValue: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#F1F5F9',
    marginTop: verticalScale(1),
  },
  plateValue: {
    color: '#FCA5A5',
    fontFamily: 'monospace',
    letterSpacing: 0.4,
  },
});
