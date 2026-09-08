import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { ShieldAlert, Radio } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

interface SosPulseButtonProps {
  onSosTriggered: () => void;
  holdDuration?: number; // default 2000ms
}

export const SosPulseButton: React.FC<SosPulseButtonProps> = ({
  onSosTriggered,
  holdDuration = 2000,
}) => {
  const { width, isSmallDevice, isShortScreen, moderateScale, fontScale } = useResponsive();

  // Dynamic responsive sizing
  const buttonSize = isSmallDevice || isShortScreen
    ? Math.min(Math.round(width * 0.48), 180)
    : Math.min(Math.round(width * 0.54), 220);
  const outerSize = buttonSize + (isSmallDevice ? 36 : 50);
  const iconSize = isSmallDevice || isShortScreen ? 40 : 50;

  const [isPressing, setIsPressing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Pulse animation for idle state
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.6)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.4)).current;

  // Press-and-hold progress & scale animation
  const holdProgressAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start continuous ambient pulsing animation
  useEffect(() => {
    const pulse1 = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim1, {
          toValue: 1.35,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(pulseAnim2, {
            toValue: 1.55,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity2, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse1.start();
    pulse2.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
    };
  }, []);

  const handlePressIn = () => {
    setIsPressing(true);
    Vibration.vibrate(50);

    // Button shrinks slightly on press
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      friction: 4,
      useNativeDriver: true,
    }).start();

    // Progress animation
    Animated.timing(holdProgressAnim, {
      toValue: 1,
      duration: holdDuration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Visual percentage counter
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(Math.round((elapsed / holdDuration) * 100), 100);
      setProgressPercent(currentPct);
    }, 30);

    // Success trigger timer
    holdTimerRef.current = setTimeout(() => {
      Vibration.vibrate([0, 300, 100, 300]);
      onSosTriggered();
      handlePressOut();
    }, holdDuration);
  };

  const handlePressOut = () => {
    setIsPressing(false);
    setProgressPercent(0);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    holdProgressAnim.setValue(0);

    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const ringScale = holdProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  return (
    <View style={[styles.outerContainer, { width: outerSize, height: outerSize }]}>
      {/* Ambient Pulsing Background Waves */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [{ scale: pulseAnim2 }],
            opacity: pulseOpacity2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [{ scale: pulseAnim1 }],
            opacity: pulseOpacity1,
          },
        ]}
      />

      {/* Press Active Expanding Progress Ring */}
      {isPressing && (
        <Animated.View
          style={[
            styles.activeRing,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
      )}

      {/* Main Massive Button */}
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_disableSound={true}
          style={({ pressed }) => [
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
            },
            pressed && styles.buttonPressed,
          ]}
          accessible={true}
          accessibilityLabel="Nút báo động khẩn cấp SOS. Nhấn và giữ 2 giây để gửi tín hiệu cứu nạn"
          accessibilityRole="button"
        >
          <View
            style={[
              styles.innerGlow,
              {
                width: buttonSize - 16,
                height: buttonSize - 16,
                borderRadius: (buttonSize - 16) / 2,
              },
            ]}
          >
            {/* Top Indicator */}
            <View style={styles.topBadge}>
              <Radio size={isSmallDevice ? 12 : 14} color="#FCA5A5" />
              <Text
                style={[
                  styles.topBadgeText,
                  { fontSize: fontScale(isSmallDevice ? 9 : 10) },
                ]}
              >
                EMERGENCY
              </Text>
            </View>

            {/* Central SOS Icon & Text */}
            <ShieldAlert size={iconSize} color="#FFFFFF" strokeWidth={2.4} />
            <Text
              style={[
                styles.sosTitle,
                {
                  fontSize: fontScale(isSmallDevice || isShortScreen ? 26 : 32),
                  lineHeight: fontScale(isSmallDevice || isShortScreen ? 28 : 34),
                },
              ]}
            >
              SOS
            </Text>

            {/* Hold instruction or Progress */}
            <View style={styles.statusContainer}>
              {isPressing ? (
                <Text
                  style={[
                    styles.holdingText,
                    { fontSize: fontScale(isSmallDevice ? 10.5 : 12) },
                  ]}
                >
                  GIỮ... {progressPercent}%
                </Text>
              ) : (
                <Text
                  style={[
                    styles.holdText,
                    { fontSize: fontScale(isSmallDevice ? 9.5 : 11) },
                  ]}
                >
                  GIỮ 2 GIÂY ĐỂ PHÁT SOS
                </Text>
              )}
            </View>

            {/* Subtext */}
            <Text
              style={[
                styles.subtext,
                { fontSize: fontScale(isSmallDevice ? 8.5 : 9.5) },
              ]}
            >
              Tự động gửi GPS + Camera
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: '#DC2626',
    zIndex: 1,
  },
  activeRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FEF08A',
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    zIndex: 2,
  },
  button: {
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#EF4444',
    zIndex: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 16,
  },
  buttonPressed: {
    backgroundColor: '#B91C1C',
    borderColor: '#F87171',
  },
  innerGlow: {
    backgroundColor: '#B91C1C',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
    gap: 4,
  },
  topBadgeText: {
    fontWeight: '800',
    color: '#FEE2E2',
    letterSpacing: 1.2,
  },
  sosTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  statusContainer: {
    marginVertical: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
  },
  holdText: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  holdingText: {
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.8,
  },
  subtext: {
    color: '#FCA5A5',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
});
