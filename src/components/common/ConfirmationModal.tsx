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
          primaryColor: '#DC2626',
          primaryDark: '#B91C1C',
          borderColor: '#FECACA',
          bgColor: '#FEF2F2',
          defaultIcon: <ShieldAlert size={moderateScale(26)} color="#DC2626" strokeWidth={2.4} />,
          btnText: '#FFFFFF',
          btnBg: '#DC2626',
          btnBorder: '#DC2626',
        };
      case 'warning':
        return {
          primaryColor: '#D97706',
          primaryDark: '#B45309',
          borderColor: '#FDE68A',
          bgColor: '#FFFBEB',
          defaultIcon: <AlertTriangle size={moderateScale(26)} color="#D97706" strokeWidth={2.4} />,
          btnText: '#FFFFFF',
          btnBg: '#DC2626',
          btnBorder: '#DC2626',
        };
      case 'success':
        return {
          primaryColor: '#059669',
          primaryDark: '#047857',
          borderColor: '#A7F3D0',
          bgColor: '#ECFDF5',
          defaultIcon: <CheckCircle2 size={moderateScale(26)} color="#059669" strokeWidth={2.4} />,
          btnText: '#FFFFFF',
          btnBg: '#DC2626',
          btnBorder: '#DC2626',
        };
      case 'info':
      default:
        return {
          primaryColor: '#DC2626',
          primaryDark: '#B91C1C',
          borderColor: '#FECACA',
          bgColor: '#FEF2F2',
          defaultIcon: <AlertCircle size={moderateScale(26)} color="#DC2626" strokeWidth={2.4} />,
          btnText: '#FFFFFF',
          btnBg: '#DC2626',
          btnBorder: '#DC2626',
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
                  borderColor: '#E2E8F0',
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalCard: {
    width: '100%',
    maxWidth: scale(340),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(22),
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: moderateScale(64),
    height: moderateScale(64),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
  },
  iconPulseRing: {
    position: 'absolute',
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    borderWidth: 1.5,
    opacity: 0.4,
  },
  iconCircle: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
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
    fontSize: moderateScale(17.5),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: moderateScale(23),
    marginBottom: verticalScale(8),
  },
  descriptionText: {
    fontSize: moderateScale(13),
    color: '#475569',
    textAlign: 'center',
    lineHeight: moderateScale(19),
    marginBottom: verticalScale(16),
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.25,
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnFull: {
    flex: 1,
  },
  confirmBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
