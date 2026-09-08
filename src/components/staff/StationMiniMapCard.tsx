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
  Building2,
  Navigation,
  Compass,
  MapPin,
  Truck,
  ExternalLink,
  Crosshair,
  ShieldAlert,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface StationMiniMapCardProps {
  stationName?: string;
  stationAddress?: string;
  vehicleModel?: string;
  vehicleStatus?: string;
  latitude?: number;
  longitude?: number;
  onPressNavigateStation?: () => void;
  onPressOpenFullMap?: () => void;
}

export const StationMiniMapCard: React.FC<StationMiniMapCardProps> = ({
  stationName = 'Trạm Cứu hộ Quận 10 - BV Trưng Vương',
  stationAddress = '201 Lý Thường Kiệt, Phường 7, Quận 10, TP.HCM',
  vehicleModel = 'Xe Cứu Thương ICU Chuyên Dụng #AMB-04',
  vehicleStatus = 'Đang đậu tại bãi đỗ trạm • Sẵn sàng',
  latitude = 10.7712,
  longitude = 106.6578,
  onPressNavigateStation,
  onPressOpenFullMap,
}) => {
  // Radar wave animations
  const radarWave1 = useRef(new Animated.Value(0)).current;
  const radarWave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createWaveAnimation(radarWave1, 0);
    const anim2 = createWaveAnimation(radarWave2, 1200);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Station Details Header */}
      <View style={styles.header}>
        <View style={styles.stationIconContainer}>
          <Building2 size={moderateScale(18)} color="#38BDF8" />
        </View>
        <View style={styles.stationTextGroup}>
          <Text
            style={styles.stationTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {stationName}
          </Text>
          <View style={styles.addressRow}>
            <MapPin size={moderateScale(11)} color="#64748B" />
            <Text
              style={styles.stationAddress}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.15}
            >
              {stationAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Stylized Tactical Mini-Map Box */}
      <View style={styles.mapContainer}>
        {/* Coordinate Grid Overlay */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridLineHorizontal1} />
          <View style={styles.gridLineHorizontal2} />
          <View style={styles.gridLineVertical1} />
          <View style={styles.gridLineVertical2} />
        </View>

        {/* Tactical Radar Wave Circles */}
        <Animated.View
          style={[
            styles.radarWave,
            {
              transform: [
                {
                  scale: radarWave1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 2.6],
                  }),
                },
              ],
              opacity: radarWave1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 0.4, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarWave,
            {
              transform: [
                {
                  scale: radarWave2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 2.6],
                  }),
                },
              ],
              opacity: radarWave2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 0.4, 0],
              }),
            },
          ]}
        />

        {/* Concentric Reference Rings */}
        <View style={styles.staticRingInner} />
        <View style={styles.staticRingOuter} />

        {/* Center Ambulance Marker */}
        <View style={styles.centerMarker}>
          <View style={styles.pulseBeaconRing}>
            <View style={styles.vehicleMarkerBadge}>
              <Truck size={moderateScale(16)} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Map Top Badge: Live Coordinates */}
        <View style={styles.coordsBadge}>
          <Crosshair size={moderateScale(11)} color="#06B6D4" />
          <Text style={styles.coordsText} numberOfLines={1}>
            {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </Text>
        </View>

        {/* Map Bottom Badge: Live Status & Open Map Action */}
        <View style={styles.mapBottomBar}>
          <View style={styles.statusPill}>
            <View style={styles.liveGreenDot} />
            <Text
              style={styles.statusPillText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              Đang định vị trực tiếp
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.expandMapButton}
            onPress={onPressOpenFullMap}
          >
            <Text
              style={styles.expandMapText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}
            >
              Bản Đồ
            </Text>
            <ExternalLink size={moderateScale(12)} color="#38BDF8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle Info & Quick Navigate Button */}
      <View style={styles.footerRow}>
        <View style={styles.vehicleInfoGroup}>
          <Text
            style={styles.vehicleModelText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {vehicleModel}
          </Text>
          <Text
            style={styles.vehicleStatusText}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.15}
          >
            {vehicleStatus}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.navigateButton}
          onPress={onPressNavigateStation}
        >
          <Navigation size={moderateScale(13)} color="#FFFFFF" />
          <Text
            style={styles.navigateButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Về Trạm
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: verticalScale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  stationIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  stationTextGroup: {
    flex: 1,
  },
  stationTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: '#F8FAFC',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
    gap: scale(4),
  },
  stationAddress: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    flex: 1,
  },
  mapContainer: {
    height: verticalScale(140),
    backgroundColor: '#090D16',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLineVertical1: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLineVertical2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  radarWave: {
    position: 'absolute',
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  staticRingInner: {
    position: 'absolute',
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderStyle: 'dashed',
  },
  staticRingOuter: {
    position: 'absolute',
    width: moderateScale(125),
    height: moderateScale(125),
    borderRadius: moderateScale(62.5),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  centerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pulseBeaconRing: {
    padding: moderateScale(4),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  vehicleMarkerBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  coordsBadge: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    gap: scale(4),
  },
  coordsText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#06B6D4',
    fontFamily: 'monospace',
  },
  mapBottomBar: {
    position: 'absolute',
    bottom: scale(8),
    left: scale(8),
    right: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    gap: scale(5),
  },
  liveGreenDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    color: '#E2E8F0',
  },
  expandMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#38BDF8',
    gap: scale(4),
  },
  expandMapText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#38BDF8',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: scale(10),
  },
  vehicleInfoGroup: {
    flex: 1,
  },
  vehicleModelText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#F1F5F9',
  },
  vehicleStatusText: {
    fontSize: moderateScale(10.5),
    color: '#10B981',
    marginTop: verticalScale(1),
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(8),
    gap: scale(5),
  },
  navigateButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
