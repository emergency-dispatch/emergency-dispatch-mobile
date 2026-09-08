import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import {
  Check,
  Radio,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { MissionStage, MISSION_STEPS } from '../../types/dispatch';

interface MissionStepperProps {
  currentStage: MissionStage;
  onSelectStage?: (stage: MissionStage) => void;
  interactive?: boolean;
}

const STAGE_ORDER: MissionStage[] = [
  'accepted',
  'en_route',
  'on_scene',
  'completed',
];

export const MissionStepper: React.FC<MissionStepperProps> = ({
  currentStage,
  onSelectStage,
  interactive = false,
}) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  // Pulse animation for active node ring
  const activePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(activePulseAnim, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(activePulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [activePulseAnim]);

  const renderIcon = (stage: MissionStage, isCompleted: boolean, isActive: boolean) => {
    const iconSize = moderateScale(14);
    if (isCompleted) {
      return <Check size={iconSize} color="#FFFFFF" strokeWidth={3} />;
    }
    if (isActive) {
      switch (stage) {
        case 'accepted':
          return <Radio size={iconSize} color="#FFFFFF" strokeWidth={2.5} />;
        case 'en_route':
          return <Truck size={iconSize} color="#FFFFFF" strokeWidth={2.5} />;
        case 'on_scene':
          return <MapPin size={iconSize} color="#FFFFFF" strokeWidth={2.5} />;
        case 'completed':
          return <CheckCircle2 size={iconSize} color="#FFFFFF" strokeWidth={2.5} />;
        default:
          return <AlertCircle size={iconSize} color="#FFFFFF" />;
      }
    }
    // Pending
    switch (stage) {
      case 'accepted':
        return <Radio size={iconSize} color="#64748B" />;
      case 'en_route':
        return <Truck size={iconSize} color="#64748B" />;
      case 'on_scene':
        return <MapPin size={iconSize} color="#64748B" />;
      case 'completed':
        return <CheckCircle2 size={iconSize} color="#64748B" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepperTrack}>
        {MISSION_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <TouchableOpacity
                activeOpacity={interactive ? 0.7 : 1}
                disabled={!interactive}
                onPress={() => onSelectStage && onSelectStage(step.key)}
                style={styles.stepItem}
              >
                <View style={styles.nodeWrapper}>
                  {/* Glowing Radar Pulse for Active Stage */}
                  {isActive && (
                    <Animated.View
                      style={[
                        styles.activePulseRing,
                        {
                          borderColor:
                            step.key === 'accepted'
                              ? '#38BDF8'
                              : step.key === 'en_route'
                              ? '#F59E0B'
                              : step.key === 'on_scene'
                              ? '#EF4444'
                              : '#10B981',
                          transform: [{ scale: activePulseAnim }],
                        },
                      ]}
                    />
                  )}

                  {/* Node Circle */}
                  <View
                    style={[
                      styles.nodeCircle,
                      isCompleted && styles.nodeCircleCompleted,
                      isActive && [
                        styles.nodeCircleActive,
                        step.key === 'accepted' && { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
                        step.key === 'en_route' && { backgroundColor: '#D97706', borderColor: '#FBBF24' },
                        step.key === 'on_scene' && { backgroundColor: '#DC2626', borderColor: '#F87171' },
                        step.key === 'completed' && { backgroundColor: '#059669', borderColor: '#34D399' },
                      ],
                      isPending && styles.nodeCirclePending,
                    ]}
                  >
                    {renderIcon(step.key, isCompleted, isActive)}
                  </View>
                </View>

                {/* Text Labels */}
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isActive && styles.stepLabelActive,
                    isPending && styles.stepLabelPending,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>

                <Text
                  style={[
                    styles.stepSublabel,
                    isActive && styles.stepSublabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {step.sublabel}
                </Text>
              </TouchableOpacity>

              {/* Connecting Line between steps */}
              {index < MISSION_STEPS.length - 1 && (
                <View style={styles.connectorWrapper}>
                  <View
                    style={[
                      styles.connectorLine,
                      index < currentIndex
                        ? styles.connectorCompleted
                        : index === currentIndex
                        ? styles.connectorActive
                        : styles.connectorPending,
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: scale(68),
  },
  nodeWrapper: {
    width: moderateScale(34),
    height: moderateScale(34),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: verticalScale(4),
  },
  activePulseRing: {
    position: 'absolute',
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1.8,
    opacity: 0.8,
  },
  nodeCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  nodeCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  nodeCircleActive: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeCirclePending: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  connectorWrapper: {
    flex: 1,
    paddingTop: moderateScale(14),
    paddingHorizontal: scale(2),
  },
  connectorLine: {
    height: 2.5,
    borderRadius: 1.5,
  },
  connectorCompleted: {
    backgroundColor: '#10B981',
  },
  connectorActive: {
    backgroundColor: '#38BDF8',
  },
  connectorPending: {
    backgroundColor: '#334155',
  },
  stepLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#10B981',
  },
  stepLabelActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  stepLabelPending: {
    color: '#64748B',
  },
  stepSublabel: {
    fontSize: moderateScale(8.5),
    color: '#64748B',
    marginTop: verticalScale(1),
    textAlign: 'center',
  },
  stepSublabelActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
});
