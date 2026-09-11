import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import {
  Navigation,
  MapPin,
  Shield,
  AlertTriangle,
  Flame,
  Building2,
  Crosshair,
  Layers,
  Radio,
  ArrowRight,
  Truck,
  Phone,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

interface MapMarkerItem {
  id: string;
  type: 'incident' | 'hospital' | 'station';
  code: string;
  title: string;
  address: string;
  distance: string;
  severity?: 'critical' | 'moderate';
  top: string;
  left: string;
}

const MOCK_MAP_ITEMS: MapMarkerItem[] = [
  {
    id: 'inc-1',
    type: 'incident',
    code: 'CC-115-8902',
    title: 'Tai Nạn Giao Thông Liên Hoàn (3 Nạn nhân)',
    address: '120 Võ Văn Tần, P.6, Q.3',
    distance: '2.4 km (6 phút)',
    severity: 'critical',
    top: '55%',
    left: '64%',
  },
  {
    id: 'inc-2',
    type: 'incident',
    code: 'CC-115-8905',
    title: 'Khó Thở Cấp / Suy Hô Hấp Người Cao Tuổi',
    address: '45 Cách Mạng Tháng 8, P.Bến Thành, Q.1',
    distance: '3.8 km (11 phút)',
    severity: 'moderate',
    top: '32%',
    left: '70%',
  },
  {
    id: 'hosp-1',
    type: 'hospital',
    code: 'BV-TRUNG-VUONG',
    title: 'Bệnh Viện Cấp Cứu Trưng Vương',
    address: '266 Lý Thường Kiệt, P.14, Q.10',
    distance: '1.8 km',
    top: '68%',
    left: '20%',
  },
  {
    id: 'hosp-2',
    type: 'hospital',
    code: 'BV-CHO-RAY',
    title: 'Bệnh Viện Chợ Rẫy (Trung Tâm Chấn Thương)',
    address: '201B Nguyễn Chí Thanh, P.12, Q.5',
    distance: '4.2 km',
    top: '20%',
    left: '32%',
  },
];

type FilterType = 'all' | 'incident' | 'hospital';

export const SafetyMapScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [activeItem, setActiveItem] = useState<MapMarkerItem>(MOCK_MAP_ITEMS[0]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Pulse animations
  const radarWave = useRef(new Animated.Value(0)).current;
  const beaconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarWave, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(radarWave, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(beaconPulse, {
          toValue: 1.25,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(beaconPulse, {
          toValue: 0.95,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    waveLoop.start();
    pulseLoop.start();

    return () => {
      waveLoop.stop();
      pulseLoop.stop();
    };
  }, [radarWave, beaconPulse]);

  const filteredItems = MOCK_MAP_ITEMS.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  const handleNavigateToActiveMission = () => {
    navigation?.navigate('ActiveMissionTab');
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      statusBarStyle="dark-content"
    >
      <View style={styles.rootContainer}>
        {/* 1. Header Bar (Hidden in Fullscreen mode) */}
        {!isFullscreen && (
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={styles.title}>Bản Đồ Tác Chiến 115</Text>
                <Text style={styles.subtitle}>
                  Giám sát thực địa & điều phối khẩn cấp thời gian thực
                </Text>
              </View>
              <View style={styles.telemetryBadge}>
                <View style={styles.liveGreenDot} />
                <Text style={styles.telemetryText}>GPS ±3m • 5G</Text>
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  selectedFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === 'all' && styles.filterTextActive,
                  ]}
                >
                  Tất cả (4)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  selectedFilter === 'incident' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter('incident')}
              >
                <Flame
                  size={moderateScale(12)}
                  color={selectedFilter === 'incident' ? '#FFFFFF' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === 'incident' && styles.filterTextActive,
                  ]}
                >
                  Sự cố khẩn (2)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  selectedFilter === 'hospital' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter('hospital')}
              >
                <Building2
                  size={moderateScale(12)}
                  color={selectedFilter === 'hospital' ? '#FFFFFF' : '#059669'}
                />
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === 'hospital' && styles.filterTextActive,
                  ]}
                >
                  Bệnh viện (2)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. Tactical Vector Map Canvas */}
        <View style={styles.mapCanvas}>
          {/* Street Grid Simulation */}
          <View style={styles.gridLayer}>
            {/* Horizontal Roads */}
            <View style={styles.roadMainH1}>
              <Text style={styles.streetNameText}>Đường Cách Mạng Tháng 8</Text>
            </View>
            <View style={styles.roadMainH2}>
              <Text style={styles.streetNameText}>Đường Võ Văn Tần</Text>
            </View>
            <View style={styles.roadSecondaryH1} />
            <View style={styles.roadSecondaryH2} />

            {/* Vertical Roads */}
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

          {/* User's Ambulance Unit Marker (ICU-01) */}
          <View style={styles.ambulanceWrapper}>
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: radarWave.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 2.8],
                      }),
                    },
                  ],
                  opacity: radarWave.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 0.3, 0],
                  }),
                },
              ]}
            />
            <View style={styles.ambulanceBadge}>
              <Truck size={moderateScale(16)} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.ambulanceCallout}>
              <Text style={styles.ambulanceCalloutText}>ICU-01 (Bạn)</Text>
            </View>
          </View>

          {/* Markers */}
          {filteredItems.map((item) => {
            const isSelected = activeItem.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.markerTouchArea,
                  { top: item.top as any, left: item.left as any },
                ]}
                onPress={() => setActiveItem(item)}
              >
                {item.type === 'incident' && (
                  <View style={styles.markerIncidentGroup}>
                    {isSelected && (
                      <Animated.View
                        style={[
                          styles.beaconPulseRing,
                          { transform: [{ scale: beaconPulse }] },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.incidentMarker,
                        item.severity === 'critical'
                          ? styles.incidentCritical
                          : styles.incidentModerate,
                        isSelected && styles.markerSelectedRing,
                      ]}
                    >
                      <Flame size={moderateScale(16)} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerLabelPill}>
                      <Text style={styles.markerLabelText}>{item.code}</Text>
                    </View>
                  </View>
                )}

                {item.type === 'hospital' && (
                  <View style={styles.markerHospitalGroup}>
                    <View
                      style={[
                        styles.hospitalMarker,
                        isSelected && styles.markerSelectedRing,
                      ]}
                    >
                      <Building2 size={moderateScale(16)} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerLabelPill}>
                      <Text style={styles.markerLabelTextHospital}>{item.code}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Floating Top Banner when in Fullscreen */}
          {isFullscreen && (
            <View style={styles.fullscreenTopBanner}>
              <View style={styles.fullscreenTitlePill}>
                <View style={styles.liveGreenDot} />
                <Text style={styles.fullscreenTitleText}>
                  Bản Đồ Tác Chiến 115 • Toàn Màn Hình
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.fullscreenExitBtn}
                onPress={() => setIsFullscreen(false)}
              >
                <Minimize2 size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.fullscreenExitBtnText}>Thu Nhỏ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Floating Map Controls */}
          <View style={styles.floatingControls}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.floatingBtn,
                isFullscreen && styles.floatingBtnActiveRed,
              ]}
              onPress={() => setIsFullscreen(!isFullscreen)}
              accessible={true}
              accessibilityLabel={
                isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to toàn màn hình bản đồ'
              }
            >
              {isFullscreen ? (
                <Minimize2 size={moderateScale(16)} color="#DC2626" />
              ) : (
                <Maximize2 size={moderateScale(16)} color="#334155" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.floatingBtn}
              onPress={() => setActiveItem(MOCK_MAP_ITEMS[0])}
            >
              <Crosshair size={moderateScale(16)} color="#DC2626" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.floatingBtn}>
              <Layers size={moderateScale(16)} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Bottom Detail Panel (Hidden in Fullscreen mode) */}
        {!isFullscreen && (
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.cardTypeBadgeRow}>
                <View
                  style={[
                    styles.typePill,
                    activeItem.type === 'incident'
                      ? styles.typePillIncident
                      : styles.typePillHospital,
                  ]}
                >
                  {activeItem.type === 'incident' ? (
                    <Flame size={moderateScale(12)} color="#DC2626" />
                  ) : (
                    <Building2 size={moderateScale(12)} color="#059669" />
                  )}
                  <Text
                    style={[
                      styles.typePillText,
                      activeItem.type === 'incident'
                        ? styles.typePillTextIncident
                        : styles.typePillTextHospital,
                    ]}
                  >
                    {activeItem.type === 'incident'
                      ? 'SỰ CỐ KHẨN CẤP'
                      : 'BỆNH VIỆN TIẾP NHẬN'}
                  </Text>
                </View>
                <Text style={styles.cardCodeText}>{activeItem.code}</Text>
              </View>
              <Text style={styles.cardDistanceText}>{activeItem.distance}</Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {activeItem.title}
            </Text>

            <View style={styles.addressRow}>
              <MapPin size={moderateScale(14)} color="#64748B" />
              <Text style={styles.addressText} numberOfLines={1}>
                {activeItem.address}
              </Text>
            </View>

            {/* Quick Action Button */}
            {activeItem.type === 'incident' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionMissionBtn}
                onPress={handleNavigateToActiveMission}
              >
                <Text style={styles.actionMissionBtnText}>
                  Vào Ca Cứu Hộ Này
                </Text>
                <ArrowRight size={moderateScale(16)} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionHospitalBtn}
              >
                <Shield size={moderateScale(16)} color="#059669" />
                <Text style={styles.actionHospitalBtnText}>
                  Xem Tuyến Đường Đến Bệnh Viện
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: scale(5),
  },
  liveGreenDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#16A34A',
  },
  telemetryText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  filterRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mapCanvas: {
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
    top: '32%',
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
  roadMainH2: {
    position: 'absolute',
    top: '64%',
    left: 0,
    right: 0,
    height: verticalScale(22),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    paddingLeft: scale(12),
  },
  roadSecondaryH1: {
    position: 'absolute',
    top: '16%',
    left: 0,
    right: 0,
    height: verticalScale(8),
    backgroundColor: '#E2E8F0',
  },
  roadSecondaryH2: {
    position: 'absolute',
    top: '84%',
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
    width: scale(22),
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadMainV2: {
    position: 'absolute',
    left: '72%',
    top: 0,
    bottom: 0,
    width: scale(24),
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadSecondaryV1: {
    position: 'absolute',
    left: '10%',
    top: 0,
    bottom: 0,
    width: scale(8),
    backgroundColor: '#E2E8F0',
  },
  roadSecondaryV2: {
    position: 'absolute',
    left: '50%',
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
  ambulanceWrapper: {
    position: 'absolute',
    top: '28%',
    left: '20%',
    alignItems: 'center',
    zIndex: 20,
  },
  radarWave: {
    position: 'absolute',
    top: moderateScale(-8),
    left: moderateScale(-8),
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  ambulanceBadge: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  ambulanceCallout: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(3),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  ambulanceCalloutText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#DC2626',
  },
  markerTouchArea: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 25,
  },
  markerIncidentGroup: {
    alignItems: 'center',
    position: 'relative',
  },
  beaconPulseRing: {
    position: 'absolute',
    top: moderateScale(-8),
    left: moderateScale(-8),
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  incidentMarker: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  incidentCritical: {
    backgroundColor: '#DC2626',
  },
  incidentModerate: {
    backgroundColor: '#F59E0B',
  },
  markerHospitalGroup: {
    alignItems: 'center',
  },
  hospitalMarker: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  markerSelectedRing: {
    borderWidth: 2.5,
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
  },
  markerLabelPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(3),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  markerLabelTextHospital: {
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    color: '#059669',
  },
  floatingControls: {
    position: 'absolute',
    right: scale(12),
    top: verticalScale(14),
    gap: verticalScale(8),
    zIndex: 30,
  },
  floatingBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(14),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  cardTypeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(6),
  },
  typePillIncident: {
    backgroundColor: '#FEF2F2',
  },
  typePillHospital: {
    backgroundColor: '#ECFDF5',
  },
  typePillText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
  },
  typePillTextIncident: {
    color: '#DC2626',
  },
  typePillTextHospital: {
    color: '#059669',
  },
  cardCodeText: {
    fontSize: moderateScale(11),
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
  },
  cardDistanceText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: verticalScale(4),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginBottom: verticalScale(10),
  },
  addressText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    flex: 1,
  },
  actionMissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  actionMissionBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  actionHospitalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
  },
  actionHospitalBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#059669',
  },
  floatingBtnActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  fullscreenTopBanner: {
    position: 'absolute',
    top: verticalScale(10),
    left: scale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  fullscreenTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(6),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenTitleText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#0F172A',
  },
  fullscreenExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullscreenExitBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
});
