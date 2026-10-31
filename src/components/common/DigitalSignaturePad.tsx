import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PenTool, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export interface DigitalSignaturePadProps {
  title?: string;
  placeholder?: string;
  onSignatureChange?: (hasSignature: boolean, svgString: string) => void;
  onDrawingChange?: (isDrawing: boolean) => void;
  strokeColor?: string;
  strokeWidth?: number;
  height?: number;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  title = 'CHỮ KÝ SỐ CỦA CHỈ HUY HIỆN TRƯỜNG / NGƯỜI BÀN GIAO',
  placeholder = 'Ký trực tiếp bằng ngón tay vào đây',
  onSignatureChange,
  onDrawingChange,
  strokeColor = '#0F172A',
  strokeWidth = 2.5,
  height = verticalScale(130),
}) => {
  const [strokes, setStrokes] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const currentPathRef = useRef<string>('');
  const strokesRef = useRef<string[]>([]);

  // Keep strokesRef in sync
  strokesRef.current = strokes;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderGrant: (evt: GestureResponderEvent) => {
          onDrawingChange?.(true);
          const { locationX, locationY } = evt.nativeEvent;
          // Include an immediate tiny segment so tap dots are captured
          const startPt = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)} L ${(locationX + 0.1).toFixed(1)} ${(locationY + 0.1).toFixed(1)}`;
          currentPathRef.current = startPt;
          setCurrentPath(startPt);
        },

        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          const nextPt = `${currentPathRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          currentPathRef.current = nextPt;
          setCurrentPath(nextPt);
        },

        onPanResponderRelease: () => {
          onDrawingChange?.(false);
          if (currentPathRef.current) {
            const updated = [...strokesRef.current, currentPathRef.current];
            strokesRef.current = updated;
            setStrokes(updated);
            currentPathRef.current = '';
            setCurrentPath('');
            onSignatureChange?.(true, updated.join(' '));
          }
        },

        onPanResponderTerminate: () => {
          onDrawingChange?.(false);
          if (currentPathRef.current) {
            const updated = [...strokesRef.current, currentPathRef.current];
            strokesRef.current = updated;
            setStrokes(updated);
            currentPathRef.current = '';
            setCurrentPath('');
            onSignatureChange?.(true, updated.join(' '));
          }
        },
      }),
    [onDrawingChange, onSignatureChange]
  );

  const handleClear = () => {
    strokesRef.current = [];
    setStrokes([]);
    currentPathRef.current = '';
    setCurrentPath('');
    onSignatureChange?.(false, '');
  };

  const hasSignature = strokes.length > 0 || !!currentPath;

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <PenTool size={moderateScale(15)} color="#DC2626" />
          <Text style={styles.titleText}>{title}</Text>
        </View>

        {hasSignature && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.clearBtn}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RotateCcw size={moderateScale(12)} color="#DC2626" />
            <Text style={styles.clearBtnText}>Ký lại</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Signature Canvas Box */}
      <View
        style={[styles.canvasBox, { height }]}
        {...panResponder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {strokes.map((d, index) => (
            <Path
              key={`stroke-${index}`}
              d={d}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>

        {!hasSignature && (
          <View style={styles.placeholderContainer} pointerEvents="none">
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}

        {hasSignature && (
          <View style={styles.signedBadge} pointerEvents="none">
            <CheckCircle2 size={moderateScale(12)} color="#059669" />
            <Text style={styles.signedBadgeText}>ĐÃ KÝ SỐ</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: scale(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    flex: 1,
  },
  titleText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearBtnText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#DC2626',
  },
  canvasBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  placeholderText: {
    fontSize: moderateScale(12),
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  signedBadge: {
    position: 'absolute',
    bottom: verticalScale(6),
    right: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  signedBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
});
