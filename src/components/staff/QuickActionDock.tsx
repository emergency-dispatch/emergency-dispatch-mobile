import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {
  PackageCheck,
  PhoneCall,
  ClipboardList,
  AlertCircle,
  Radio,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface QuickActionDockProps {
  onPressCheckSupplies: () => void;
  onPressSosCall: () => void;
  onPressHistory: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onPressCheckSupplies,
  onPressSosCall,
  onPressHistory,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, verticalScale(12));

  // Pulse animation for the central SOS button
  const sosPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, {
          toValue: 1.12,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sosPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.dockContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.dockInner}>
        {/* Action 1: Check Medical Supplies */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.dockButton}
          onPress={onPressCheckSupplies}
        >
          <View style={[styles.iconWrapper, styles.suppliesIconWrapper]}>
            <PackageCheck size={moderateScale(19)} color="#06B6D4" />
          </View>
          <Text
            style={styles.buttonLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Kiểm tra vật tư
          </Text>
          <Text
            style={styles.buttonSublabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Oxy • AED • Thuốc
          </Text>
        </TouchableOpacity>

        {/* Action 2: Call Dispatch (SOS Hotline) - Prominent Center Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.sosButtonContainer}
          onPress={onPressSosCall}
        >
          <Animated.View
            style={[
              styles.sosGlowRing,
              { transform: [{ scale: sosPulse }] },
            ]}
          />
          <View style={styles.sosMainButton}>
            <PhoneCall size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.4} />
            <Text
              style={styles.sosButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              GỌI ĐIỀU PHỐI
            </Text>
            <Text
              style={styles.sosSubText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              Hotline 115 TT
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action 3: Detailed Mission History */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.dockButton}
          onPress={onPressHistory}
        >
          <View style={[styles.iconWrapper, styles.historyIconWrapper]}>
            <ClipboardList size={moderateScale(19)} color="#A78BFA" />
          </View>
          <Text
            style={styles.buttonLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Lịch sử ca trực
          </Text>
          <Text
            style={styles.buttonSublabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Biên bản • Báo cáo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: verticalScale(8),
    paddingHorizontal: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  dockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  dockButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: verticalScale(72),
    minWidth: 0,
  },
  iconWrapper: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(3),
  },
  suppliesIconWrapper: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  historyIconWrapper: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  buttonLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    width: '100%',
  },
  buttonSublabel: {
    fontSize: moderateScale(8.5),
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: verticalScale(1.5),
    textAlign: 'center',
    width: '100%',
  },
  sosButtonContainer: {
    flex: 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 0,
  },
  sosGlowRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  sosMainButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    minHeight: verticalScale(72),
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: verticalScale(3),
    letterSpacing: 0.3,
    textAlign: 'center',
    width: '100%',
  },
  sosSubText: {
    fontSize: moderateScale(8.5),
    fontWeight: '600',
    color: '#FEE2E2',
    marginTop: verticalScale(1),
    textAlign: 'center',
    width: '100%',
  },
});
