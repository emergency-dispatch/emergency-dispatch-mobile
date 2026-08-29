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

interface SosPulseButtonProps {
  onSosTriggered: () => void;
  holdDuration?: number; // default 2000ms
}

export const SosPulseButton: React.FC<SosPulseButtonProps> = ({
  onSosTriggered,
  holdDuration = 2000,
}) => {
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
          toValue: 1.4,
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
            toValue: 1.6,
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

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / holdDuration) * 100), 100);
      setProgressPercent(progress);
    }, 30);

    holdTimerRef.current = setTimeout(() => {
      Vibration.vibrate([0, 200, 100, 300]);
      setIsPressing(false);
      setProgressPercent(0);
      Animated.spring(buttonScaleAnim, { toValue: 1, useNativeDriver: true }).start();
      Animated.timing(holdProgressAnim, { toValue: 0, duration: 100, useNativeDriver: false }).start();
      if (intervalRef.current) clearInterval(intervalRef.current);
      onSosTriggered();
    }, holdDuration);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsPressing(false);
    setProgressPercent(0);

    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    Animated.timing(holdProgressAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const ringScale = holdProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  return (
    <View style={styles.outerContainer}>
      {/* Background Ambient Glowing Rings */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim2 }],
            opacity: pulseOpacity2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing,
          {
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
            pressed && styles.buttonPressed,
          ]}
          accessible={true}
          accessibilityLabel="Nút báo động khẩn cấp SOS. Nhấn và giữ 2 giây để gửi tín hiệu cứu nạn"
          accessibilityRole="button"
        >
          <View style={styles.innerGlow}>
            {/* Top Indicator */}
            <View style={styles.topBadge}>
              <Radio size={14} color="#FCA5A5" />
              <Text style={styles.topBadgeText}>EMERGENCY</Text>
            </View>

            {/* Central SOS Icon & Text */}
            <ShieldAlert size={52} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.sosTitle}>SOS</Text>

            {/* Hold instruction or Progress */}
            <View style={styles.statusContainer}>
              {isPressing ? (
                <Text style={styles.holdingText}>GIỮ... {progressPercent}%</Text>
              ) : (
                <Text style={styles.holdText}>GIỮ 2 GIÂY ĐỂ PHÁT SOS</Text>
              )}
            </View>

            {/* Subtext */}
            <Text style={styles.subtext}>Tự động gửi GPS + Camera</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const BUTTON_SIZE = 216;

const styles = StyleSheet.create({
  outerContainer: {
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  glowRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#DC2626',
    zIndex: 1,
  },
  activeRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FEF08A',
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    zIndex: 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#EF4444',
    zIndex: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
  buttonPressed: {
    backgroundColor: '#B91C1C',
    borderColor: '#F87171',
  },
  innerGlow: {
    width: BUTTON_SIZE - 16,
    height: BUTTON_SIZE - 16,
    borderRadius: (BUTTON_SIZE - 16) / 2,
    backgroundColor: '#B91C1C',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
    gap: 4,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEE2E2',
    letterSpacing: 1.2,
  },
  sosTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    lineHeight: 36,
  },
  statusContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
  },
  holdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  holdingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.8,
  },
  subtext: {
    fontSize: 9.5,
    color: '#FCA5A5',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
