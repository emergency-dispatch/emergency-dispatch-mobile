import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Navigation,
  Crosshair,
  Volume2,
  VolumeX,
  Layers,
  CornerUpRight,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { MissionStage, MOCK_EMERGENCY_INCIDENT } from '../../types/dispatch';
import { MapboxView, MapboxViewRef } from '../map/MapboxView';
import { mapboxService, MapMarkerItem, RoutePoint } from '../../services/mapbox.service';

interface IncidentTacticalMapProps {
  currentStage: MissionStage;
  incidentAddress?: string;
  distanceKm?: number;
  etaMinutes?: number;
  originCoords?: { latitude: number; longitude: number; label?: string };
  targetCoords?: { latitude: number; longitude: number; label?: string };
  assignedUnit?: string;
  incidentTitle?: string;
  onRecenter?: () => void;
  isMapExpanded?: boolean;
  onToggleMapExpand?: () => void;
}

export const IncidentTacticalMap: React.FC<IncidentTacticalMapProps> = ({
  currentStage,
  incidentAddress = '120 Võ Văn Tần, P.6, Q.3, TP.HCM',
  distanceKm = 2.4,
  etaMinutes = 6,
  originCoords = MOCK_EMERGENCY_INCIDENT.originCoords,
  targetCoords = MOCK_EMERGENCY_INCIDENT.targetCoords,
  assignedUnit = 'Xe Cứu Thương ICU 01',
  incidentTitle = 'Hiện Trường Tai Nạn',
  onRecenter,
  isMapExpanded = false,
  onToggleMapExpand,
}) => {
  const mapRef = useRef<MapboxViewRef>(null);
  const [sirenActive, setSirenActive] = useState<boolean>(true);
  const [trafficActive, setTrafficActive] = useState<boolean>(true);
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);

  // Compute map markers (Ambulance + Incident location)
  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    return [
      {
        id: 'ambulance-unit',
        title: assignedUnit || 'Xe Cứu Thương',
        description: originCoords.label || 'Vị trí hiện tại',
        latitude: originCoords.latitude,
        longitude: originCoords.longitude,
        type: 'ambulance',
      },
      {
        id: 'incident-site',
        title: incidentTitle || 'Điểm Sự Cố Tai Nạn',
        description: incidentAddress,
        latitude: targetCoords.latitude,
        longitude: targetCoords.longitude,
        type: 'incident',
        severity: 'Critical',
      },
    ];
  }, [assignedUnit, originCoords, incidentTitle, incidentAddress, targetCoords]);

  // Fetch real road route coordinates from OSRM
  useEffect(() => {
    let isMounted = true;
    mapboxService
      .getRoute(originCoords, targetCoords)
      .then((coords) => {
        if (isMounted) {
          setRouteCoordinates(coords);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteCoordinates([originCoords, targetCoords]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [originCoords, targetCoords]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.fitBounds();
    }
    if (onRecenter) {
      onRecenter();
    }
  };

  return (
    <View style={styles.mapRoot}>
      {/* Real Mapbox View */}
      <MapboxView
        ref={mapRef}
        userLatitude={originCoords.latitude}
        userLongitude={originCoords.longitude}
        markers={mapMarkers}
        routeCoordinates={routeCoordinates}
        fitBounds={true}
        interactive={true}
        style={styles.mapboxMap}
      />

      {/* Top Map HUD: Navigation Turn-by-Turn Instruction Banner */}
      <View
        style={[
          styles.topNavHudBanner,
          isMapExpanded && { top: verticalScale(54) },
        ]}
      >
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
      <View
        style={[
          styles.floatingControlsGroup,
          isMapExpanded && { top: verticalScale(118) },
        ]}
      >
        {/* Toggle Full Map View (Phóng to / Thu nhỏ bản đồ) */}
        {onToggleMapExpand && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.controlButton,
              isMapExpanded && styles.controlButtonActiveRed,
            ]}
            onPress={onToggleMapExpand}
            accessible={true}
            accessibilityLabel={
              isMapExpanded ? 'Thu nhỏ bản đồ' : 'Phóng to chỉ xem bản đồ'
            }
          >
            {isMapExpanded ? (
              <Minimize2 size={moderateScale(16)} color="#DC2626" />
            ) : (
              <Maximize2 size={moderateScale(16)} color="#334155" />
            )}
          </TouchableOpacity>
        )}

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
          onPress={handleRecenter}
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
  mapboxMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
