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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
            <PackageCheck size={moderateScale(19)} color="#DC2626" />
          </View>
          <Text
            style={styles.buttonLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.check_gear')}
          </Text>
          <Text
            style={styles.buttonSublabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.gear_subtitle')}
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
              {t('staff.call_dispatch')}
            </Text>
            <Text
              style={styles.sosSubText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              {t('staff.call_dispatch_sub')}
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
            <ClipboardList size={moderateScale(19)} color="#DC2626" />
          </View>
          <Text
            style={styles.buttonLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.shift_history')}
          </Text>
          <Text
            style={styles.buttonSublabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.shift_history_sub')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: verticalScale(8),
    paddingHorizontal: scale(12),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  dockButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: verticalScale(72),
    minWidth: 0,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#FEF2F2',
  },
  historyIconWrapper: {
    backgroundColor: '#FEF2F2',
  },
  buttonLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
  },
  buttonSublabel: {
    fontSize: moderateScale(8.5),
    fontWeight: '500',
    color: '#64748B',
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
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  sosMainButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    minHeight: verticalScale(72),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
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
