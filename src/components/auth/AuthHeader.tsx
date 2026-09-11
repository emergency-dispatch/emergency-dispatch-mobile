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
  badgeText,
  showLogo = true,
  style,
}) => {
  // Pulse animation for the emergency badge dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!badgeText) return;

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
  }, [pulseAnim, badgeText]);

  return (
    <View style={[styles.container, style]}>
      {/* Top Bar with Back Button and System Status Badge */}
      {(showBack || !!badgeText) && (
        <View style={styles.topRow}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Quay lại"
            >
              <ArrowLeft color="#0F172A" size={moderateScale(20)} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderBack} />
          )}

          {/* Emergency System Badge */}
          {!!badgeText && (
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
          )}
        </View>
      )}

      {/* Main Logo & Branding */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <View style={styles.iconRing}>
            <View style={styles.iconCenter}>
              <ShieldAlert color="#DC2626" size={moderateScale(30)} strokeWidth={2.4} />
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderBack: {
    width: moderateScale(38),
    height: moderateScale(38),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pulseDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#DC2626',
    marginRight: moderateScale(6),
  },
  badgeText: {
    color: '#DC2626',
    fontSize: moderateScale(10),
    fontWeight: '800',
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  iconCenter: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: verticalScale(4),
    lineHeight: verticalScale(18),
    paddingHorizontal: moderateScale(12),
  },
});

