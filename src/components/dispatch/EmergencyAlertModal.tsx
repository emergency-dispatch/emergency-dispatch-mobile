import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  MapPin,
  Navigation,
  Truck,
  Users,
  ShieldAlert,
  CheckCircle2,
  X,
  Radio,
  Zap,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  EmergencyIncident,
  MOCK_EMERGENCY_INCIDENT,
  RejectAssignmentPayload,
} from '../../types/dispatch';
import { StaffRejectModal } from '../staff/StaffRejectModal';
import { MapboxView } from '../map/MapboxView';
import { mapboxService, MapMarkerItem, RoutePoint } from '../../services/mapbox.service';

interface EmergencyAlertModalProps {
  visible: boolean;
  incident?: EmergencyIncident;
  assignmentId?: string;
  onAccept: (incident: EmergencyIncident) => Promise<void> | void;
  onDecline: (payload?: RejectAssignmentPayload) => Promise<void> | void;
  onTimeout?: () => void;
}

const TOTAL_COUNTDOWN = 30; // 30 seconds auto-decline countdown

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  visible,
  incident = MOCK_EMERGENCY_INCIDENT,
  assignmentId,
  onAccept,
  onDecline,
  onTimeout,
}) => {
  const insets = useSafeAreaInsets();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_COUNTDOWN);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);

  // Safe area insets calculation across Android/iOS devices
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : insets.top;
  const topSafePadding = Math.max(insets.top, statusBarHeight, 24);
  const bottomSafePadding = Math.max(insets.bottom, 16);

  // Animation values
  const pulseBorderAnim = useRef(new Animated.Value(0.4)).current;
  const beaconGlowAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Compute markers for Mapbox (Ambulance + Incident location)
  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    return [
      {
        id: 'origin-ambulance',
        title: incident.assignedUnit || 'Xe Cứu Thương',
        description: incident.originCoords?.label || 'Vị trí xe hiện tại',
        latitude: incident.originCoords.latitude,
        longitude: incident.originCoords.longitude,
        type: 'ambulance',
      },
      {
        id: 'target-incident',
        title: incident.title || 'Hiện Trường Khẩn Cấp',
        description: incident.address || 'Vị trí tai nạn',
        latitude: incident.targetCoords.latitude,
        longitude: incident.targetCoords.longitude,
        type: 'incident',
        severity: 'Critical',
      },
    ];
  }, [incident]);

  // Fetch actual driving route from OSRM / fallback to linear route
  useEffect(() => {
    if (visible && incident?.originCoords && incident?.targetCoords) {
      let isMounted = true;
      mapboxService
        .getRoute(incident.originCoords, incident.targetCoords)
        .then((coords) => {
          if (isMounted) {
            setRouteCoordinates(coords);
          }
        })
        .catch(() => {
          if (isMounted) {
            setRouteCoordinates([incident.originCoords, incident.targetCoords]);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [visible, incident]);

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

      return () => {
        if (timer) clearInterval(timer);
        pulseLoop.stop();
        beaconLoop.stop();
      };
    }
  }, [visible, onDecline, onTimeout, pulseBorderAnim, beaconGlowAnim, progressAnim]);

  const isUrgentTimer = secondsRemaining <= 10;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
      <View
        style={[
          styles.modalRoot,
          {
            paddingTop: topSafePadding + verticalScale(4),
            paddingBottom: bottomSafePadding,
          },
        ]}
      >
        {/* Pulsing Emergency Ambient Glow Border */}
        <Animated.View
          style={[
            styles.pulsingGlowFrame,
            {
              opacity: pulseBorderAnim,
              borderColor: isUrgentTimer ? '#EF4444' : '#FCA5A5',
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
            <ShieldAlert size={moderateScale(15)} color="#DC2626" />
            <Text style={styles.severityBadgeText} numberOfLines={1}>
              {incident.severityLabel}
            </Text>
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
              color={isUrgentTimer ? '#DC2626' : '#D97706'}
            />
            <Text
              style={[
                styles.countdownText,
                isUrgentTimer && styles.countdownTextUrgent,
              ]}
              numberOfLines={1}
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
          {/* Hero Incident Title Card */}
          <View style={styles.titleCard}>
            <View style={styles.emergencyTagRow}>
              <View style={styles.priorityTag}>
                <Zap size={moderateScale(12)} color="#B45309" />
                <Text style={styles.priorityTagText}>ƯU TIÊN BẬC 1 (TRIAGE T1)</Text>
              </View>
              <Text style={styles.codeText}>{incident.code}</Text>
            </View>

            <Text style={styles.incidentTitle}>{incident.title}</Text>
            <Text style={styles.incidentSubtitle}>{incident.category}</Text>
          </View>

          {/* Quick Metrics Grid (5 Key Metrics) */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Address */}
            <View style={[styles.metricCard, styles.metricCardFull]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <MapPin size={moderateScale(18)} color="#DC2626" />
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
              <View style={[styles.metricIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <Navigation size={moderateScale(16)} color="#0284C7" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>KHOẢNG CÁCH</Text>
                <Text style={[styles.metricValue, { color: '#0284C7' }]}>
                  {incident.distanceKm} km
                </Text>
              </View>
            </View>

            {/* Metric 3: ETA */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Clock size={moderateScale(16)} color="#059669" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>ETA DỰ KIẾN</Text>
                <Text style={[styles.metricValue, { color: '#059669' }]}>
                  ~{incident.etaMinutes} phút
                </Text>
              </View>
            </View>

            {/* Metric 4: Assigned Unit */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Truck size={moderateScale(16)} color="#D97706" />
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
              <View style={[styles.metricIconWrap, { backgroundColor: '#FDF2F8' }]}>
                <Users size={moderateScale(16)} color="#DB2777" />
              </View>
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>SỐ LƯỢNG NẠN NHÂN</Text>
                <Text style={[styles.metricValue, { color: '#DB2777' }]}>
                  {incident.patientCount} người (Kẹt)
                </Text>
              </View>
            </View>
          </View>

          {/* Interactive Mapbox Map Preview */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapTitleGroup}>
                <Radio size={moderateScale(14)} color="#0284C7" />
                <Text style={styles.mapSectionTitle}>LỘ TRÌNH TIẾP CẬN DỰ KIẾN</Text>
              </View>
              <View style={styles.routePill}>
                <Text style={styles.routePillText}>Lộ trình nhanh nhất</Text>
              </View>
            </View>

            {/* Live Mapbox Container */}
            <View style={styles.miniMapContainer}>
              <MapboxView
                userLatitude={incident.originCoords.latitude}
                userLongitude={incident.originCoords.longitude}
                markers={mapMarkers}
                routeCoordinates={routeCoordinates}
                fitBounds={true}
                interactive={true}
                style={styles.mapboxMap}
              />

              {/* Floating Distance Badge on Map */}
              <View style={styles.mapEtaFloatingBadge}>
                <Navigation size={moderateScale(11)} color="#0284C7" />
                <Text style={styles.mapEtaFloatingText}>
                  {incident.distanceKm} km • ~{incident.etaMinutes} phút
                </Text>
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
            onPress={() => setIsRejectModalVisible(true)}
          >
            <X size={moderateScale(18)} color="#DC2626" />
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

        {/* Modal: Decline Incident with Required Reason & Notes */}
        <StaffRejectModal
          visible={isRejectModalVisible}
          incidentCode={incident.code}
          onClose={() => setIsRejectModalVisible(false)}
          onSubmitReject={async (payload) => {
            setIsRejectModalVisible(false);
            await onDecline(payload);
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  pulsingGlowFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: moderateScale(3),
    zIndex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(6),
    gap: scale(8),
  },
  severityBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    gap: scale(6),
    minWidth: 0,
  },
  sirenDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#DC2626',
  },
  severityBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    gap: scale(5),
    flexShrink: 0,
  },
  countdownBadgeUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  countdownText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#B45309',
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  countdownTextUrgent: {
    color: '#DC2626',
  },
  progressBarTrack: {
    height: verticalScale(3.5),
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: verticalScale(12),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: verticalScale(2.5),
    paddingHorizontal: scale(7),
    borderRadius: moderateScale(4),
    gap: scale(4),
  },
  priorityTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#B45309',
  },
  codeText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  incidentTitle: {
    fontSize: moderateScale(17),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: moderateScale(22),
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  incidentSubtitle: {
    fontSize: moderateScale(12),
    color: '#475569',
    marginTop: verticalScale(4),
    fontWeight: '600',
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
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metricValuePrimary: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(2),
  },
  metricValue: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  metricValueSmall: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  routePill: {
    backgroundColor: '#F0F9FF',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  routePillText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#0284C7',
  },
  miniMapContainer: {
    height: verticalScale(175),
    backgroundColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapboxMap: {
    flex: 1,
    borderRadius: moderateScale(12),
  },
  mapEtaFloatingBadge: {
    position: 'absolute',
    top: verticalScale(8),
    left: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: verticalScale(3.5),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  mapEtaFloatingText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#0284C7',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(8),
    gap: scale(10),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  declineButton: {
    width: '30%',
    height: verticalScale(56),
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(2),
  },
  declineButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#DC2626',
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
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
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
