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

const THUMB_SIZE_FACTOR = 32; // Compact thumb width/height

export const SwipeToAction: React.FC<SwipeToActionProps> = ({
  onSwipeSuccess,
  title = 'VUỐT ĐỂ XUẤT PHÁT (SWIPE TO EN ROUTE)',
  successTitle = 'ĐÃ XÁC NHẬN XUẤT PHÁT!',
  sliderColor = '#10B981',
  activeTrackColor = 'rgba(16, 185, 129, 0.25)',
  inactiveTrackColor = '#F1F5F9',
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

  // Refs for dynamic mutable state accessed inside PanResponder callbacks
  const disabledRef = useRef(disabled);
  const isCompletedRef = useRef(isCompleted);
  const onSwipeSuccessRef = useRef(onSwipeSuccess);
  const maxDragRef = useRef(0);
  const trackWidthRef = useRef(0);

  // Sync refs on each render
  useEffect(() => {
    disabledRef.current = disabled;
    isCompletedRef.current = isCompleted;
    onSwipeSuccessRef.current = onSwipeSuccess;
  });

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(chevronPulse, {
          toValue: 0.35,
          duration: 800,
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
    if (width > 0) {
      setTrackWidth(width);
      trackWidthRef.current = width;
      const calculatedMax = Math.max(0, width - thumbSize - moderateScale(8));
      maxDragRef.current = calculatedMax;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !isCompletedRef.current,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !disabledRef.current &&
          !isCompletedRef.current &&
          (Math.abs(gestureState.dx) > 3 || gestureState.dx > 0)
        );
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return (
          !disabledRef.current &&
          !isCompletedRef.current &&
          Math.abs(gestureState.dx) > 3
        );
      },
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (isCompletedRef.current || disabledRef.current) return;
        const max = maxDragRef.current;
        if (max <= 0) return;
        const newDx = Math.max(0, Math.min(gestureState.dx, max));
        translateX.setValue(newDx);
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        setIsDragging(false);
        if (isCompletedRef.current || disabledRef.current) return;
        const max = maxDragRef.current;
        if (max <= 0) return;

        // Trigger if dragged over 60% of track
        if (gestureState.dx >= max * 0.6) {
          // Smoothly animate thumb to the end
          Animated.timing(translateX, {
            toValue: max,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setIsCompleted(true);
            isCompletedRef.current = true;
            onSwipeSuccessRef.current?.();
          });
        } else {
          // Snap back with spring
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(translateX, {
          toValue: 0,
          friction: 7,
          tension: 50,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Safe interpolation limits
  const safeMaxDrag = Math.max(1, maxDrag);

  // Text opacity interpolates as thumb moves
  const textOpacity = translateX.interpolate({
    inputRange: [0, safeMaxDrag * 0.55],
    outputRange: [1, 0.05],
    extrapolate: 'clamp',
  });

  // Track progress fill width
  const trackFillWidth = translateX.interpolate({
    inputRange: [0, safeMaxDrag],
    outputRange: [thumbSize + moderateScale(8), safeMaxDrag + thumbSize + moderateScale(8)],
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
            ? '#DC2626'
            : '#E2E8F0',
          backgroundColor: inactiveTrackColor,
        },
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
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
              : isDragging
              ? 'rgba(220, 38, 38, 0.25)'
              : activeTrackColor,
          },
        ]}
        pointerEvents="none"
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
          <ChevronsRight size={moderateScale(18)} color="#DC2626" />
        </Animated.View>

        <Text
          style={styles.titleText}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
        >
          {title}
        </Text>

        <Animated.View
          style={[styles.chevronGroup, { opacity: chevronPulse }]}
        >
          <ChevronsRight size={moderateScale(18)} color="#DC2626" />
        </Animated.View>
      </Animated.View>

      {/* Success Completed Text */}
      {isCompleted && (
        <View style={styles.completedContainer} pointerEvents="none">
          <ShieldCheck size={moderateScale(20)} color="#FFFFFF" />
          <Text
            style={styles.completedText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {successTitle}
          </Text>
        </View>
      )}

      {/* Draggable Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: isCompleted
              ? '#10B981'
              : isDragging
              ? '#0284C7'
              : '#EF4444',
            transform: [{ translateX }],
          },
        ]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        {isCompleted ? (
          <Check size={moderateScale(18)} color="#FFFFFF" strokeWidth={2.6} />
        ) : icon ? (
          icon
        ) : (
          <View style={styles.thumbInner}>
            <Truck size={moderateScale(15)} color="#FFFFFF" />
            <ArrowRight
              size={moderateScale(10)}
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
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(3),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: moderateScale(20),
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
    paddingHorizontal: scale(36),
    gap: scale(5),
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
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
    gap: scale(6),
  },

  completedText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
