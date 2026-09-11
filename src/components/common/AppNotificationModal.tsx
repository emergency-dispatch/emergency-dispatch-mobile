import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  X,
} from 'lucide-react-native';
import { useNotificationStore } from '../../store/useNotificationStore';

export const AppNotificationModal: React.FC = () => {
  const { visible, options, hide } = useNotificationStore();
  const {
    type = 'info',
    title,
    message,
    confirmText = 'Đã Hiểu',
    cancelText = 'Hủy Bỏ',
    singleButton = true,
    onConfirm,
    onCancel,
  } = options;

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const handleConfirm = () => {
    hide();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    hide();
    if (onCancel) onCancel();
  };

  const getThemeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#059669" strokeWidth={2.4} />,
          iconBg: '#ECFDF5',
          iconBorder: '#A7F3D0',
          ringBg: 'rgba(16, 185, 129, 0.14)',
          btnBg: '#DC2626',
          btnShadow: '#DC2626',
          badgeText: 'THÀNH CÔNG',
          badgeColor: '#059669',
          badgeBg: '#ECFDF5',
        };
      case 'error':
        return {
          icon: <ShieldAlert size={32} color="#DC2626" strokeWidth={2.4} />,
          iconBg: '#FEF2F2',
          iconBorder: '#FECACA',
          ringBg: 'rgba(220, 38, 38, 0.14)',
          btnBg: '#DC2626',
          btnShadow: '#DC2626',
          badgeText: 'CẢNH BÁO LỖI',
          badgeColor: '#DC2626',
          badgeBg: '#FEF2F2',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="#D97706" strokeWidth={2.4} />,
          iconBg: '#FFFBEB',
          iconBorder: '#FDE68A',
          ringBg: 'rgba(245, 158, 11, 0.14)',
          btnBg: '#DC2626',
          btnShadow: '#DC2626',
          badgeText: 'LƯU Ý QUAN TRỌNG',
          badgeColor: '#D97706',
          badgeBg: '#FFFBEB',
        };
      case 'info':
      default:
        return {
          icon: <Info size={32} color="#DC2626" strokeWidth={2.4} />,
          iconBg: '#FEF2F2',
          iconBorder: '#FECACA',
          ringBg: 'rgba(220, 38, 38, 0.12)',
          btnBg: '#DC2626',
          btnShadow: '#DC2626',
          badgeText: 'THÔNG BÁO HỆ THỐNG',
          badgeColor: '#DC2626',
          badgeBg: '#FEF2F2',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Close Button Top Right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCancel}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Icon with Double Ring */}
              <View style={[styles.iconOuterRing, { backgroundColor: theme.ringBg }]}>
                <View
                  style={[
                    styles.iconInnerCircle,
                    {
                      backgroundColor: theme.iconBg,
                      borderColor: theme.iconBorder,
                    },
                  ]}
                >
                  {theme.icon}
                </View>
              </View>

              {/* Tag Badge */}
              <View
                style={[
                  styles.badgeWrap,
                  {
                    backgroundColor: theme.badgeBg,
                    borderColor: theme.iconBorder,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.badgeColor }]}>
                  {theme.badgeText}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.titleText}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {!singleButton && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    singleButton && styles.fullWidthBtn,
                    {
                      backgroundColor: theme.btnBg,
                      shadowColor: theme.btnShadow,
                    },
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeWrap: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  titleText: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  messageText: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.25,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  fullWidthBtn: {
    flex: 1,
  },
  confirmBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
