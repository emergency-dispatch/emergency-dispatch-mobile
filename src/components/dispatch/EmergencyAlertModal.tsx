import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Navigation,
  Truck,
  Users,
  ShieldAlert,
  CheckCircle2,
  X,
  Flame,
  Radio,
  Zap,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { EmergencyIncident, MOCK_EMERGENCY_INCIDENT } from '../../types/dispatch';

interface EmergencyAlertModalProps {
  visible: boolean;
  incident?: EmergencyIncident;
  onAccept: (incident: EmergencyIncident) => void;
  onDecline: () => void;
  onTimeout?: () => void;
}

const TOTAL_COUNTDOWN = 30; // 30 seconds auto-decline countdown

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  visible,
  incident = MOCK_EMERGENCY_INCIDENT,
  onAccept,
  onDecline,
  onTimeout,
}) => {
  const insets = useSafeAreaInsets();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_COUNTDOWN);
  const [isDeclineModalVisible, setIsDeclineModalVisible] = useState<boolean>(false);


  // Animation values
  const pulseBorderAnim = useRef(new Animated.Value(0.4)).current;
  const beaconGlowAnim = useRef(new Animated.Value(1)).current;
  const radarWaveAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Countdown Timer & Animation loops
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (visible) {

      setSecondsRemaining(TOTAL_COUNTDOWN);
      progressAnim.setValue(1);

      // Countdown progress bar animation
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: TOTAL_COUNTDOWN * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // Second-by-second countdown
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            if (onTimeout) {
              onTimeout();
            } else {
              onDecline();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Pulsing border effect (Emergency beacon)
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseBorderAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseBorderAnim, {
            toValue: 0.35,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Flashing alert beacon
      const beaconLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(beaconGlowAnim, {
            toValue: 1.35,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(beaconGlowAnim, {
            toValue: 0.9,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      beaconLoop.start();

      // Mini-map radar wave
      const radarLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(radarWaveAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarWaveAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      radarLoop.start();

      return () => {
        if (timer) clearInterval(timer);
        pulseLoop.stop();
        beaconLoop.stop();
        radarLoop.stop();
      };
    }
  }, [visible, onDecline, onTimeout, pulseBorderAnim, beaconGlowAnim, radarWaveAnim, progressAnim]);

  const handleConfirmDecline = () => {
    Alert.alert(
      'Từ Chối Lệnh Điều Động?',
      'Bạn có chắc chắn muốn từ chối nhiệm vụ cứu hộ khẩn cấp này? Lệnh sẽ được chuyển sang xe cứu thương dự bị tiếp theo.',
      [
        { text: 'Quay Lại', style: 'cancel' },
        {
          text: 'Xác Nhận Từ Chối',
          style: 'destructive',
          onPress: onDecline,
        },
      ]
    );
  };

  const isUrgentTimer = secondsRemaining <= 10;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#180404" />
      <View style={[styles.modalRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Pulsing Danger Ambient Outer Glow Frame */}
        <Animated.View
          style={[
            styles.pulsingGlowFrame,
            {
              opacity: pulseBorderAnim,
              borderColor: isUrgentTimer ? '#EF4444' : '#DC2626',
            },
          ]}
          pointerEvents="none"
        />

        {/* Top Emergency Siren Banner & Countdown */}
        <View style={styles.topHeader}>
          {/* Code Red Status Badge */}
          <View style={styles.severityBadge}>
            <Animated.View
              style={[
                styles.sirenDot,
                { transform: [{ scale: beaconGlowAnim }] },
              ]}
            />
            <ShieldAlert size={moderateScale(15)} color="#FCA5A5" />
            <Text style={styles.severityBadgeText}>{incident.severityLabel}</Text>
          </View>

          {/* Countdown Pill */}
          <View
            style={[
              styles.countdownBadge,
              isUrgentTimer && styles.countdownBadgeUrgent,
            ]}
          >
            <Clock
              size={moderateScale(14)}
              color={isUrgentTimer ? '#EF4444' : '#FBBF24'}
            />
            <Text
              style={[
                styles.countdownText,
                isUrgentTimer && styles.countdownTextUrgent,
              ]}
            >
              Còn {secondsRemaining}s
            </Text>
          </View>
        </View>

        {/* Countdown Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: isUrgentTimer ? '#EF4444' : '#F59E0B',
              },
            ]}
          />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Incident Title */}
          <View style={styles.titleCard}>
            <View style={styles.emergencyTagRow}>
              <View style={styles.priorityTag}>
                <Zap size={moderateScale(12)} color="#FBBF24" />
                <Text style={styles.priorityTagText}>ƯU TIÊN BẬC 1 (TRIAGE T1)</Text>
              </View>
              <Text style={styles.codeText}>{incident.code}</Text>
            </View>

            <Text style={styles.incidentTitle}>{incident.title}</Text>
            <Text style={styles.incidentSubtitle}>{incident.category}</Text>
          </View>

          {/* Quick Metrics Grid (4 Key Metrics) */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Address */}
            <View style={[styles.metricCard, styles.metricCardFull]}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}>
                <MapPin size={moderateScale(18)} color="#EF4444" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>ĐỊA CHỈ HIỆN TRƯỜNG</Text>
                <Text style={styles.metricValuePrimary} numberOfLines={2}>
                  {incident.address}
                </Text>
              </View>
            </View>

            {/* Metric 2: Distance */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]}>
                <Navigation size={moderateScale(16)} color="#38BDF8" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>KHOẢNG CÁCH</Text>
                <Text style={styles.metricValue}>{incident.distanceKm} km</Text>
              </View>
            </View>

            {/* Metric 3: ETA */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                <Clock size={moderateScale(16)} color="#10B981" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>ETA DỰ KIẾN</Text>
                <Text style={[styles.metricValue, { color: '#34D399' }]}>
                  ~{incident.etaMinutes} phút
                </Text>
              </View>
            </View>

            {/* Metric 4: Assigned Unit */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
                <Truck size={moderateScale(16)} color="#F59E0B" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>XE ĐIỀU ĐỘNG</Text>
                <Text style={styles.metricValueSmall} numberOfLines={1}>
                  {incident.assignedUnit}
                </Text>
              </View>
            </View>

            {/* Metric 5: Victims */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.18)' }]}>
                <Users size={moderateScale(16)} color="#EC4899" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>SỐ LƯỢNG NẠN NHÂN</Text>
                <Text style={[styles.metricValue, { color: '#F472B6' }]}>
                  {incident.patientCount} người (Kẹt)
                </Text>
              </View>
            </View>
          </View>

          {/* Mini-Map Preview (2 Locations & Route Polyline) */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapTitleGroup}>
                <Radio size={moderateScale(14)} color="#38BDF8" />
                <Text style={styles.mapSectionTitle}>LỘ TRÌNH TIẾP CẬN DỰ KIẾN</Text>
              </View>
              <View style={styles.routePill}>
                <Text style={styles.routePillText}>Lộ trình nhanh nhất</Text>
              </View>
            </View>

            {/* Simulated Vector Map Area */}
            <View style={styles.miniMapContainer}>
              {/* Tactical Radar Grid Lines */}
              <View style={styles.mapGridOverlay}>
                <View style={styles.gridH1} />
                <View style={styles.gridH2} />
                <View style={styles.gridV1} />
                <View style={styles.gridV2} />
              </View>

              {/* Glowing Simulated Route Line */}
              <View style={styles.routeLineWrapper}>
                <View style={styles.routePolylineGlow} />
                <View style={styles.routePolylineCore} />
                <View style={styles.routePolylineTurn} />
              </View>

              {/* Point A: Ambulance Origin */}
              <View style={styles.originMarker}>
                <Animated.View
                  style={[
                    styles.radarOriginWave,
                    {
                      transform: [
                        {
                          scale: radarWaveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.5],
                          }),
                        },
                      ],
                      opacity: radarWaveAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 0.4, 0],
                      }),
                    },
                  ]}
                />
                <View style={styles.originBadge}>
                  <Truck size={moderateScale(14)} color="#FFFFFF" />
                </View>
                <View style={styles.markerLabelOrigin}>
                  <Text style={styles.markerLabelOriginText}>Xe Cứu Thương</Text>
                </View>
              </View>

              {/* Point B: Incident Destination */}
              <View style={styles.targetMarker}>
                <Animated.View
                  style={[
                    styles.radarTargetBeacon,
                    { transform: [{ scale: beaconGlowAnim }] },
                  ]}
                />
                <View style={styles.targetBadge}>
                  <Flame size={moderateScale(16)} color="#FFFFFF" />
                </View>
                <View style={styles.markerLabelTarget}>
                  <Text style={styles.markerLabelTargetText}>Vị Trí Tai Nạn (Q.3)</Text>
                </View>
              </View>

              {/* Floating Distance Badge on Mini Map */}
              <View style={styles.mapEtaFloatingBadge}>
                <Text style={styles.mapEtaFloatingText}>2.4 km • ~6 phút</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Footer Buttons (30% Decline / 70% Accept) */}
        <View style={styles.footerContainer}>
          {/* Secondary Decline Button (30% Width) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.declineButton}
            onPress={() => setIsDeclineModalVisible(true)}
          >
            <X size={moderateScale(18)} color="#F87171" />
            <Text style={styles.declineButtonText}>Từ Chối</Text>
          </TouchableOpacity>

          {/* Primary CTA Accept Button (70% Width, Min-Height 56px) */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.acceptButton}
            onPress={() => onAccept(incident)}
          >
            <View style={styles.acceptButtonContent}>
              <CheckCircle2 size={moderateScale(22)} color="#FFFFFF" strokeWidth={2.6} />
              <View style={styles.acceptTextGroup}>
                <Text style={styles.acceptButtonText}>CHẤP NHẬN NHIỆM VỤ</Text>
                <Text style={styles.acceptButtonSubtext}>Xuất phát ngay lập tức</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reusable Confirmation Modal: Decline Incident */}
        <ConfirmationModal
          visible={isDeclineModalVisible}
          type="danger"
          title="Từ Chối Lệnh Điều Động?"
          description="Bạn có chắc chắn muốn từ chối nhiệm vụ cấp cứu khẩn cấp này?"
          highlightBadge="CODE RED • T1"
          highlightText="Lệnh điều động sẽ được chuyển sang xe cứu thương dự bị tiếp theo trong khu vực."
          confirmText="Xác Nhận Từ Chối"
          cancelText="Quay Lại"
          onConfirm={() => {
            setIsDeclineModalVisible(false);
            onDecline();
          }}
          onCancel={() => setIsDeclineModalVisible(false)}
        />
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0E0304',
    position: 'relative',
  },
  pulsingGlowFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: moderateScale(4),
    zIndex: 99,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    gap: scale(6),
  },
  sirenDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#EF4444',
  },
  severityBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#FEE2E2',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    gap: scale(5),
  },
  countdownBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#EF4444',
  },
  countdownText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FBBF24',
    fontFamily: 'monospace',
  },
  countdownTextUrgent: {
    color: '#EF4444',
  },
  progressBarTrack: {
    height: verticalScale(3.5),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginVertical: verticalScale(4),
  },
  progressBarFill: {
    height: '100%',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(16),
  },
  titleCard: {
    backgroundColor: 'rgba(30, 10, 12, 0.85)',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginBottom: verticalScale(12),
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(7),
    borderRadius: moderateScale(4),
    gap: scale(4),
  },
  priorityTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#FBBF24',
  },
  codeText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  incidentTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: moderateScale(23),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  incidentSubtitle: {
    fontSize: moderateScale(12),
    color: '#FCA5A5',
    marginTop: verticalScale(4),
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: verticalScale(12),
  },
  metricCardFull: {
    width: '100%',
  },
  metricCard: {
    flexBasis: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 12, 14, 0.8)',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: scale(10),
  },
  metricIconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextGroup: {
    flex: 1,
  },
  metricLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metricValuePrimary: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: verticalScale(2),
  },
  metricValue: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: verticalScale(1),
  },
  metricValueSmall: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: verticalScale(1),
  },
  mapSection: {
    backgroundColor: 'rgba(20, 8, 10, 0.85)',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  mapTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  mapSectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  routePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  routePillText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#38BDF8',
  },
  miniMapContainer: {
    height: verticalScale(145),
    backgroundColor: '#090A10',
    borderRadius: moderateScale(12),
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mapGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridH1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridH2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridV1: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridV2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeLineWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  routePolylineGlow: {
    position: 'absolute',
    top: '38%',
    left: '22%',
    width: '54%',
    height: verticalScale(4),
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    transform: [{ rotate: '24deg' }],
  },
  routePolylineCore: {
    position: 'absolute',
    top: '38%',
    left: '22%',
    width: '54%',
    height: verticalScale(2.5),
    backgroundColor: '#38BDF8',
    transform: [{ rotate: '24deg' }],
  },
  routePolylineTurn: {
    position: 'absolute',
    top: '52%',
    left: '52%',
    width: '28%',
    height: verticalScale(2.5),
    backgroundColor: '#38BDF8',
    transform: [{ rotate: '-15deg' }],
  },
  originMarker: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: scale(20),
    alignItems: 'center',
  },
  radarOriginWave: {
    position: 'absolute',
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  originBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  markerLabelOrigin: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(4),
    borderWidth: 1,
    borderColor: '#334155',
  },
  markerLabelOriginText: {
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    color: '#38BDF8',
  },
  targetMarker: {
    position: 'absolute',
    top: verticalScale(14),
    right: scale(22),
    alignItems: 'center',
  },
  radarTargetBeacon: {
    position: 'absolute',
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  targetBadge: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  markerLabelTarget: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(4),
  },
  markerLabelTargetText: {
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mapEtaFloatingBadge: {
    position: 'absolute',
    top: verticalScale(8),
    left: scale(8),
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  mapEtaFloatingText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#38BDF8',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(8),
    gap: scale(10),
    backgroundColor: '#0E0304',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
  },
  declineButton: {
    width: '30%',
    height: verticalScale(56),
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(2),
  },
  declineButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#FCA5A5',
  },
  acceptButton: {
    width: '67%',
    height: verticalScale(56),
    borderRadius: moderateScale(14),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  acceptButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  acceptTextGroup: {
    alignItems: 'flex-start',
  },
  acceptButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  acceptButtonSubtext: {
    fontSize: moderateScale(9.5),
    color: '#D1FAE5',
    fontWeight: '600',
  },
});
