import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
  PhoneCall,
  LogOut,
  Flame,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export type ConfirmationType =
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'primary';

export interface ConfirmationModalProps {
  visible: boolean;
  type?: ConfirmationType;
  title: string;
  description?: string;
  highlightBadge?: string;
  highlightText?: string;
  confirmText?: string;
  cancelText?: string;
  singleButton?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  type = 'primary',
  title,
  description,
  highlightBadge,
  highlightText,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  singleButton = false,
  loading = false,
  icon,
  onConfirm,
  onCancel,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      if (type === 'danger' || type === 'warning') {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.95,
              duration: 700,
              useNativeDriver: true,
            }),
          ])
        );
        pulse.start();
        return () => pulse.stop();
      }
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim, pulseAnim, type]);

  // Color mappings based on type
  const getThemeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          primaryColor: '#EF4444',
          primaryDark: '#DC2626',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          bgColor: 'rgba(239, 68, 68, 0.12)',
          defaultIcon: <ShieldAlert size={moderateScale(24)} color="#EF4444" />,
          btnText: '#FFFFFF',
          btnBg: '#DC2626',
          btnBorder: '#EF4444',
        };
      case 'warning':
        return {
          primaryColor: '#F59E0B',
          primaryDark: '#D97706',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          bgColor: 'rgba(245, 158, 11, 0.12)',
          defaultIcon: <AlertTriangle size={moderateScale(24)} color="#F59E0B" />,
          btnText: '#FFFFFF',
          btnBg: '#D97706',
          btnBorder: '#FBBF24',
        };
      case 'success':
        return {
          primaryColor: '#10B981',
          primaryDark: '#059669',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          bgColor: 'rgba(16, 185, 129, 0.12)',
          defaultIcon: <CheckCircle2 size={moderateScale(24)} color="#10B981" />,
          btnText: '#FFFFFF',
          btnBg: '#10B981',
          btnBorder: '#34D399',
        };
      case 'info':
        return {
          primaryColor: '#38BDF8',
          primaryDark: '#0284C7',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          bgColor: 'rgba(56, 189, 248, 0.12)',
          defaultIcon: <Info size={moderateScale(24)} color="#38BDF8" />,
          btnText: '#FFFFFF',
          btnBg: '#0284C7',
          btnBorder: '#38BDF8',
        };
      default:
        return {
          primaryColor: '#3B82F6',
          primaryDark: '#2563EB',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          bgColor: 'rgba(59, 130, 246, 0.12)',
          defaultIcon: <AlertCircle size={moderateScale(24)} color="#3B82F6" />,
          btnText: '#FFFFFF',
          btnBg: '#2563EB',
          btnBorder: '#60A5FA',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                  borderColor: theme.borderColor,
                },
              ]}
            >
              {/* Top Icon Badge with Glow Ring */}
              <View style={styles.iconContainer}>
                {(type === 'danger' || type === 'warning') && (
                  <Animated.View
                    style={[
                      styles.iconPulseRing,
                      {
                        borderColor: theme.primaryColor,
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: theme.bgColor,
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  {icon || theme.defaultIcon}
                </View>
              </View>

              {/* Highlight Badge if provided */}
              {highlightBadge && (
                <View
                  style={[
                    styles.badgeContainer,
                    {
                      backgroundColor: theme.bgColor,
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: theme.primaryColor }]}
                  >
                    {highlightBadge}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={styles.titleText}>{title}</Text>

              {/* Description */}
              {description ? (
                <Text style={styles.descriptionText}>{description}</Text>
              ) : null}

              {/* Highlight Box if provided */}
              {highlightText ? (
                <View
                  style={[
                    styles.highlightBox,
                    {
                      backgroundColor: theme.bgColor,
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.highlightBoxText,
                      { color: theme.primaryColor },
                    ]}
                  >
                    {highlightText}
                  </Text>
                </View>
              ) : null}

              {/* Buttons Row */}
              <View style={styles.actionsRow}>
                {!singleButton && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.cancelBtn}
                    onPress={onCancel}
                    disabled={loading}
                  >
                    <Text style={styles.cancelBtnText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.confirmBtn,
                    singleButton && styles.confirmBtnFull,
                    {
                      backgroundColor: theme.btnBg,
                      borderColor: theme.btnBorder,
                    },
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.confirmBtnText,
                        { color: theme.btnText },
                      ]}
                    >
                      {confirmText}
                    </Text>
                  )}
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
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalCard: {
    width: '100%',
    maxWidth: scale(340),
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(18),
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
  },
  iconPulseRing: {
    position: 'absolute',
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(31),
    borderWidth: 1.5,
    opacity: 0.6,
  },
  iconCircle: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeContainer: {
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    marginBottom: verticalScale(8),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(8),
  },
  descriptionText: {
    fontSize: moderateScale(12.5),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(14),
  },
  highlightBox: {
    width: '100%',
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    marginBottom: verticalScale(14),
    alignItems: 'center',
  },
  highlightBoxText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    width: '100%',
    marginTop: verticalScale(4),
  },
  cancelBtn: {
    flex: 1,
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#94A3B8',
  },
  confirmBtn: {
    flex: 1.2,
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmBtnFull: {
    flex: 1,
  },
  confirmBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
