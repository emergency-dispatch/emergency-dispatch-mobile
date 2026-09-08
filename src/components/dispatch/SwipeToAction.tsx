import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {
  ChevronsRight,
  Check,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface SwipeToActionProps {
  onSwipeSuccess: () => void;
  title?: string;
  successTitle?: string;
  sliderColor?: string;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const THUMB_SIZE_FACTOR = 48; // Base thumb width/height

export const SwipeToAction: React.FC<SwipeToActionProps> = ({
  onSwipeSuccess,
  title = 'VUỐT ĐỂ XUẤT PHÁT (SWIPE TO EN ROUTE)',
  successTitle = 'ĐÃ XÁC NHẬN XUẤT PHÁT!',
  sliderColor = '#10B981',
  activeTrackColor = 'rgba(16, 185, 129, 0.25)',
  inactiveTrackColor = '#1E293B',
  thumbColor = '#FFFFFF',
  disabled = false,
  icon,
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const thumbSize = moderateScale(THUMB_SIZE_FACTOR);
  const translateX = useRef(new Animated.Value(0)).current;

  // Pulse animation for chevrons
  const chevronPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(chevronPulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();

    return () => pulseAnim.stop();
  }, [chevronPulse]);

  const maxDrag = Math.max(0, trackWidth - thumbSize - moderateScale(8));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setTrackWidth(width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isCompleted,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !disabled && !isCompleted && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (isCompleted || disabled || maxDrag <= 0) return;
        const newDx = Math.max(0, Math.min(gestureState.dx, maxDrag));
        translateX.setValue(newDx);
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        setIsDragging(false);
        if (isCompleted || disabled || maxDrag <= 0) return;

        // Trigger if dragged over 72% of max path
        if (gestureState.dx >= maxDrag * 0.72) {
          // Animate to end
          Animated.timing(translateX, {
            toValue: maxDrag,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            setIsCompleted(true);
            onSwipeSuccess();
          });
        } else {
          // Snap back with spring
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Text opacity interpolates as thumb moves
  const textOpacity = translateX.interpolate({
    inputRange: [0, maxDrag * 0.6 || 1],
    outputRange: [1, 0.1],
    extrapolate: 'clamp',
  });

  // Track progress fill width
  const trackFillWidth = translateX.interpolate({
    inputRange: [0, maxDrag || 1],
    outputRange: [thumbSize, maxDrag + thumbSize],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isCompleted
            ? '#10B981'
            : isDragging
            ? '#38BDF8'
            : '#334155',
          backgroundColor: inactiveTrackColor,
        },
      ]}
      onLayout={handleLayout}
      accessibilityRole="button"
      accessibilityLabel={isCompleted ? successTitle : title}
    >
      {/* Dynamic Animated Color Fill on Track */}
      <Animated.View
        style={[
          styles.trackFill,
          {
            width: trackFillWidth,
            backgroundColor: isCompleted
              ? 'rgba(16, 185, 129, 0.85)'
              : activeTrackColor,
          },
        ]}
      />

      {/* Guide Track Text & Pulsing Chevrons */}
      <Animated.View
        style={[
          styles.textContainer,
          { opacity: isCompleted ? 0 : textOpacity },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[styles.chevronGroup, { opacity: chevronPulse }]}
        >
          <ChevronsRight size={moderateScale(18)} color="#38BDF8" />
        </Animated.View>

        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>

        <Animated.View
          style={[styles.chevronGroup, { opacity: chevronPulse }]}
        >
          <ChevronsRight size={moderateScale(18)} color="#10B981" />
        </Animated.View>
      </Animated.View>

      {/* Success Completed Text */}
      {isCompleted && (
        <View style={styles.completedContainer} pointerEvents="none">
          <ShieldCheck size={moderateScale(20)} color="#FFFFFF" />
          <Text style={styles.completedText}>{successTitle}</Text>
        </View>
      )}

      {/* Draggable Thumb */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: isCompleted ? '#10B981' : isDragging ? '#0284C7' : '#EF4444',
            transform: [{ translateX }],
          },
        ]}
      >
        {isCompleted ? (
          <Check size={moderateScale(22)} color="#FFFFFF" strokeWidth={3} />
        ) : icon ? (
          icon
        ) : (
          <View style={styles.thumbInner}>
            <Truck size={moderateScale(20)} color="#FFFFFF" />
            <ArrowRight
              size={moderateScale(12)}
              color="#FFFFFF"
              style={styles.thumbArrow}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: verticalScale(56),
    borderRadius: moderateScale(28),
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(4),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: moderateScale(28),
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(48),
    gap: scale(6),
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  completedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },

  completedText: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: moderateScale(4),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  thumbInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbArrow: {
    marginLeft: scale(-2),
  },
});
