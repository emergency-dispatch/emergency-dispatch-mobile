import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Bell,
  AlertTriangle,
  Info,
  CloudRain,
  Radio,
  CheckCircle2,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { DispatchNotification } from '../../types/staff';

interface StaffNotificationsModalProps {
  visible: boolean;
  notifications: DispatchNotification[];
  onClose: () => void;
  onMarkAllRead?: () => void;
}

export const StaffNotificationsModal: React.FC<StaffNotificationsModalProps> = ({
  visible,
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  const getNotificationIcon = (type: DispatchNotification['type']) => {
    switch (type) {
      case 'urgent':
        return { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'weather':
        return { icon: CloudRain, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' };
      case 'traffic':
        return { icon: Radio, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { icon: Info, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
  };

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
              <View style={styles.badgeIconBg}>
                <Bell size={moderateScale(20)} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Thông Báo Điều Phối 115</Text>
                <Text style={styles.modalSubtitle}>Kênh phát thanh khẩn cấp</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={moderateScale(20)} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* List of Notifications */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((item) => {
              const iconConfig = getNotificationIcon(item.type);
              const IconComp = iconConfig.icon;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    !item.isRead && styles.unreadCard,
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                    <IconComp size={moderateScale(18)} color={iconConfig.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardTime}>{item.timestamp}</Text>
                    </View>
                    <Text style={styles.cardMessage}>{item.message}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.markReadButton}
              onPress={() => {
                onMarkAllRead?.();
                onClose();
              }}
            >
              <CheckCircle2 size={moderateScale(16)} color="#FFFFFF" />
              <Text style={styles.markReadText}>Đã Đọc Tất Cả</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
    paddingBottom: verticalScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  badgeIconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  closeButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  scrollList: {
    marginTop: verticalScale(8),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    gap: verticalScale(10),
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#334155',
  },
  unreadCard: {
    borderColor: '#38BDF8',
    backgroundColor: '#1E293B',
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(4),
  },
  cardTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: scale(6),
  },
  cardTime: {
    fontSize: moderateScale(10),
    color: '#64748B',
  },
  cardMessage: {
    fontSize: moderateScale(11.5),
    color: '#94A3B8',
    lineHeight: moderateScale(16),
  },
  modalFooter: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    gap: scale(6),
  },
  markReadText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
