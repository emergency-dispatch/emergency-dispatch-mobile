import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import {
  Navigation,
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
  Layers,
  Flame,
  Truck,
  CornerUpRight,
  ShieldAlert,
  Zap,
  Radio,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { MissionStage } from '../../types/dispatch';

interface IncidentTacticalMapProps {
  currentStage: MissionStage;
  incidentAddress?: string;
  distanceKm?: number;
  etaMinutes?: number;
  onRecenter?: () => void;
}

export const IncidentTacticalMap: React.FC<IncidentTacticalMapProps> = ({
  currentStage,
  incidentAddress = '120 Võ Văn Tần, P.6, Q.3, TP.HCM',
  distanceKm = 2.4,
  etaMinutes = 6,
  onRecenter,
}) => {
  const [sirenActive, setSirenActive] = useState<boolean>(true);
  const [trafficActive, setTrafficActive] = useState<boolean>(true);

  // Radar & Pulse Animations
  const radarWave1 = useRef(new Animated.Value(0)).current;
  const radarWave2 = useRef(new Animated.Value(0)).current;
  const incidentPulse = useRef(new Animated.Value(1)).current;
  const vehicleProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ambulance Radar Waves
    const waveLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const w1 = waveLoop(radarWave1, 0);
    const w2 = waveLoop(radarWave2, 1100);

    // Incident Code Red Beacon Pulse
    const incPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(incidentPulse, {
          toValue: 1.35,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(incidentPulse, {
          toValue: 0.9,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );

    // Vehicle Progress Animation when en_route
    const vehAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(vehicleProgress, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(vehicleProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    w1.start();
    w2.start();
    incPulse.start();
    if (currentStage === 'en_route') {
      vehAnim.start();
    } else {
      vehAnim.stop();
      vehicleProgress.setValue(0);
    }

    return () => {
      w1.stop();
      w2.stop();
      incPulse.stop();
      vehAnim.stop();
    };
  }, [currentStage, radarWave1, radarWave2, incidentPulse, vehicleProgress]);

  return (
    <View style={styles.mapRoot}>
      {/* Tactical Grid Background */}
      <View style={styles.gridLayer}>
        {/* Horizontal Roadways */}
        <View style={styles.roadMainH1}>
          <Text style={styles.streetNameText}>Đường Cách Mạng Tháng 8</Text>
        </View>
        <View style={styles.roadMainH2}>
          <Text style={styles.streetNameText}>Đường Võ Văn Tần</Text>
        </View>
        <View style={styles.roadSecondaryH1} />
        <View style={styles.roadSecondaryH2} />

        {/* Vertical Roadways */}
        <View style={styles.roadMainV1}>
          <Text style={[styles.streetNameText, styles.verticalStreetText]}>
            Lý Thường Kiệt
          </Text>
        </View>
        <View style={styles.roadMainV2}>
          <Text style={[styles.streetNameText, styles.verticalStreetText]}>
            Nguyễn Thị Minh Khai
          </Text>
        </View>
        <View style={styles.roadSecondaryV1} />
        <View style={styles.roadSecondaryV2} />
      </View>

      {/* Traffic Congestion Simulation Overlay (Green/Yellow glowing lines) */}
      {trafficActive && (
        <View style={styles.trafficOverlay} pointerEvents="none">
          <View style={styles.trafficGreen1} />
          <View style={styles.trafficYellow1} />
          <View style={styles.trafficGreen2} />
        </View>
      )}

      {/* Neon Route Polyline from Ambulance to Incident */}
      <View style={styles.routeContainer} pointerEvents="none">
        {/* Route Segment 1 */}
        <View style={styles.routeSegment1} />
        {/* Route Turn Junction */}
        <View style={styles.routeJunction} />
        {/* Route Segment 2 */}
        <View style={styles.routeSegment2} />
        {/* Directional Waypoint Markers */}
        <View style={styles.waypointNode1} />
        <View style={styles.waypointNode2} />
      </View>

      {/* Origin: Ambulance Vehicle Pin */}
      <View style={styles.ambulancePinWrapper}>
        {/* Radar concentric waves */}
        <Animated.View
          style={[
            styles.ambulanceRadarWave,
            {
              transform: [
                {
                  scale: radarWave1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 2.6],
                  }),
                },
              ],
              opacity: radarWave1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 0.3, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ambulanceRadarWave,
            {
              transform: [
                {
                  scale: radarWave2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 2.6],
                  }),
                },
              ],
              opacity: radarWave2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 0.3, 0],
              }),
            },
          ]}
        />

        {/* Ambulance Badge */}
        <View style={styles.ambulanceBadge}>
          <Truck size={moderateScale(16)} color="#FFFFFF" strokeWidth={2.4} />
          <View style={styles.ambulanceHeadingArrow}>
            <Navigation size={moderateScale(10)} color="#DC2626" />
          </View>
        </View>

        {/* Live Callout Label */}
        <View style={styles.ambulanceCallout}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.ambulanceCalloutText}>ICU-01 (Bạn)</Text>
        </View>
      </View>

      {/* Destination: Incident SOS Hazard Pin */}
      <View style={styles.incidentPinWrapper}>
        {/* Glowing Beacon Pulse */}
        <Animated.View
          style={[
            styles.incidentBeaconRing,
            { transform: [{ scale: incidentPulse }] },
          ]}
        />

        {/* Hazard Marker Badge */}
        <View style={styles.incidentBadge}>
          <Flame size={moderateScale(18)} color="#FFFFFF" strokeWidth={2.5} />
        </View>

        {/* Hazard Callout */}
        <View style={styles.incidentCallout}>
          <Text style={styles.incidentCalloutTitle}>ĐIỂM SỰ CỐ TAI NẠN</Text>
          <Text style={styles.incidentCalloutSub}>120 Võ Văn Tần (3 Nạn nhân)</Text>
        </View>
      </View>

      {/* Top Map HUD: Navigation Turn-by-Turn Instruction Banner */}
      <View style={styles.topNavHudBanner}>
        <View style={styles.navTurnIconWrap}>
          <CornerUpRight size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <View style={styles.navTurnTextGroup}>
          <Text style={styles.navTurnDistance}>Sau 300 mét</Text>
          <Text style={styles.navTurnInstruction} numberOfLines={1}>
            Rẽ phải vào Võ Văn Tần • Ưu tiên làn khẩn cấp
          </Text>
        </View>
        <View style={styles.navEtaChip}>
          <Text style={styles.navEtaTime}>{etaMinutes} min</Text>
          <Text style={styles.navEtaDist}>{distanceKm} km</Text>
        </View>
      </View>

      {/* Floating Tactical Controls (Right Side) */}
      <View style={styles.floatingControlsGroup}>
        {/* Siren / Audio Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.controlButton,
            sirenActive && styles.controlButtonActiveRed,
          ]}
          onPress={() => setSirenActive(!sirenActive)}
        >
          {sirenActive ? (
            <Volume2 size={moderateScale(16)} color="#DC2626" />
          ) : (
            <VolumeX size={moderateScale(16)} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Traffic Layer Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.controlButton,
            trafficActive && styles.controlButtonActiveCyan,
          ]}
          onPress={() => setTrafficActive(!trafficActive)}
        >
          <Layers
            size={moderateScale(16)}
            color={trafficActive ? '#DC2626' : '#94A3B8'}
          />
        </TouchableOpacity>

        {/* Recenter GPS */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.controlButton}
          onPress={onRecenter}
        >
          <Crosshair size={moderateScale(16)} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Bottom Floating Telemetry Bar */}
      <View style={styles.bottomTelemetryBar}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>TỐC ĐỘ</Text>
          <Text style={styles.telemetryValue}>
            {currentStage === 'en_route' ? '48' : '0'}{' '}
            <Text style={styles.telemetryUnit}>km/h</Text>
          </Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>KHOẢNG CÁCH</Text>
          <Text style={styles.telemetryValue}>
            {distanceKm} <Text style={styles.telemetryUnit}>km</Text>
          </Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>CÒI ƯU TIÊN</Text>
          <View style={styles.sirenStatusRow}>
            <View
              style={[
                styles.sirenDot,
                { backgroundColor: sirenActive ? '#16A34A' : '#94A3B8' },
              ]}
            />
            <Text
              style={[
                styles.sirenStatusText,
                { color: sirenActive ? '#16A34A' : '#64748B' },
              ]}
            >
              {sirenActive ? 'BẬT (115)' : 'TẮT'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapRoot: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  gridLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roadMainH1: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    height: verticalScale(18),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    paddingLeft: scale(12),
  },
  roadMainH2: {
    position: 'absolute',
    top: '68%',
    left: 0,
    right: 0,
    height: verticalScale(20),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    paddingLeft: scale(12),
  },
  roadSecondaryH1: {
    position: 'absolute',
    top: '18%',
    left: 0,
    right: 0,
    height: verticalScale(8),
    backgroundColor: '#E2E8F0',
  },
  roadSecondaryH2: {
    position: 'absolute',
    top: '88%',
    left: 0,
    right: 0,
    height: verticalScale(8),
    backgroundColor: '#E2E8F0',
  },
  roadMainV1: {
    position: 'absolute',
    left: '26%',
    top: 0,
    bottom: 0,
    width: scale(20),
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadMainV2: {
    position: 'absolute',
    left: '74%',
    top: 0,
    bottom: 0,
    width: scale(22),
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadSecondaryV1: {
    position: 'absolute',
    left: '8%',
    top: 0,
    bottom: 0,
    width: scale(8),
    backgroundColor: '#E2E8F0',
  },
  roadSecondaryV2: {
    position: 'absolute',
    left: '52%',
    top: 0,
    bottom: 0,
    width: scale(10),
    backgroundColor: '#E2E8F0',
  },
  streetNameText: {
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  verticalStreetText: {
    transform: [{ rotate: '-90deg' }],
    width: scale(120),
    textAlign: 'center',
  },
  trafficOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trafficGreen1: {
    position: 'absolute',
    top: '39%',
    left: '28%',
    width: '44%',
    height: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  trafficYellow1: {
    position: 'absolute',
    left: '27.5%',
    top: '42%',
    height: '24%',
    width: 3,
    backgroundColor: '#F59E0B',
  },
  trafficGreen2: {
    position: 'absolute',
    top: '69%',
    left: '28%',
    width: '46%',
    height: 3,
    backgroundColor: '#10B981',
  },
  routeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  routeSegment1: {
    position: 'absolute',
    top: '38%',
    left: '28%',
    width: '46%',
    height: verticalScale(5),
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  routeJunction: {
    position: 'absolute',
    top: '38%',
    left: '73%',
    width: scale(10),
    height: verticalScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#DC2626',
  },
  routeSegment2: {
    position: 'absolute',
    top: '39%',
    left: '74%',
    width: scale(5),
    height: '28%',
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  waypointNode1: {
    position: 'absolute',
    top: '37%',
    left: '50%',
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  waypointNode2: {
    position: 'absolute',
    top: '52%',
    left: '73.5%',
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  ambulancePinWrapper: {
    position: 'absolute',
    top: '33%',
    left: '18%',
    alignItems: 'center',
    zIndex: 20,
  },
  ambulanceRadarWave: {
    position: 'absolute',
    top: moderateScale(-6),
    left: moderateScale(-6),
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  ambulanceBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
  },
  ambulanceHeadingArrow: {
    position: 'absolute',
    top: moderateScale(-4),
    right: moderateScale(-4),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(7),
    padding: moderateScale(2),
    borderWidth: 1,
    borderColor: '#DC2626',
    transform: [{ rotate: '45deg' }],
  },
  ambulanceCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(4),
    gap: scale(4),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  liveGreenDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
    backgroundColor: '#10B981',
  },
  ambulanceCalloutText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#DC2626',
  },
  incidentPinWrapper: {
    position: 'absolute',
    top: '60%',
    left: '66%',
    alignItems: 'center',
    zIndex: 25,
  },
  incidentBeaconRing: {
    position: 'absolute',
    top: moderateScale(-8),
    left: moderateScale(-8),
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  incidentBadge: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  incidentCallout: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: verticalScale(4),
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  incidentCalloutTitle: {
    fontSize: moderateScale(8.5),
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  incidentCalloutSub: {
    fontSize: moderateScale(8),
    fontWeight: '600',
    color: '#334155',
  },
  topNavHudBanner: {
    position: 'absolute',
    top: verticalScale(10),
    left: scale(10),
    right: scale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(10),
    gap: scale(10),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 30,
  },
  navTurnIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTurnTextGroup: {
    flex: 1,
  },
  navTurnDistance: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  navTurnInstruction: {
    fontSize: moderateScale(10),
    color: '#64748B',
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  navEtaChip: {
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  navEtaTime: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
  navEtaDist: {
    fontSize: moderateScale(9),
    color: '#64748B',
    fontWeight: '600',
  },
  floatingControlsGroup: {
    position: 'absolute',
    right: scale(10),
    top: verticalScale(74),
    gap: verticalScale(8),
    zIndex: 30,
  },
  controlButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  controlButtonActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  controlButtonActiveCyan: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bottomTelemetryBar: {
    position: 'absolute',
    bottom: verticalScale(8),
    left: scale(10),
    right: scale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(6),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 30,
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  telemetryValue: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  telemetryUnit: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: '#64748B',
  },
  telemetryDivider: {
    width: 1,
    height: verticalScale(22),
    backgroundColor: '#E2E8F0',
  },
  sirenStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: verticalScale(2),
  },
  sirenDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  sirenStatusText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
});
