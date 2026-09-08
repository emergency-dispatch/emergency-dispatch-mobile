import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  badgeText?: string;
  showLogo?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  badgeText = 'HỆ THỐNG CỨU HỘ KHẨN CẤP 24/7',
  showLogo = true,
  style,
}) => {
  // Pulse animation for the emergency badge dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, style]}>
      {/* Top Bar with Back Button and System Status Badge */}
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại"
          >
            <ArrowLeft color="#F8FAFC" size={moderateScale(20)} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBack} />
        )}

        {/* Emergency System Badge */}
        <View style={styles.badge}>
          <Animated.View
            style={[
              styles.pulseDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text
            style={styles.badgeText}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            {badgeText}
          </Text>
        </View>
      </View>

      {/* Main Logo & Branding */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <View style={styles.iconRing}>
            <View style={styles.iconCenter}>
              <ShieldAlert color="#EF4444" size={moderateScale(30)} strokeWidth={2.4} />
            </View>
          </View>
        </View>
      )}

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text
          style={styles.title}
          allowFontScaling={false}
          maxFontSizeMultiplier={1.2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={styles.subtitle}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(16),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  backButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  placeholderBack: {
    width: moderateScale(38),
    height: moderateScale(38),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  pulseDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#EF4444',
    marginRight: moderateScale(6),
  },
  badgeText: {
    color: '#FCA5A5',
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  iconRing: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  iconCenter: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(12.5),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: verticalScale(4),
    lineHeight: verticalScale(18),
    paddingHorizontal: moderateScale(12),
  },
});

