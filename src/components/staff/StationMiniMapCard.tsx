import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Building2,
  Navigation,
  MapPin,
  ExternalLink,
  Crosshair,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import { MapboxView } from '../map/MapboxView';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';

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
  vehicleStatus,
  latitude = 10.8415,
  longitude = 106.8098,
  onPressNavigateStation,
  onPressOpenFullMap,
}) => {
  const { t } = useTranslation();
  const displayStatus = vehicleStatus || t('staff.default_vehicle_status');

  const validLat = latitude && latitude > 8.0 && latitude < 24.0 ? latitude : 10.8415;
  const validLng = longitude && longitude > 102.0 && longitude < 110.0 ? longitude : 106.8098;

  const markers = useMemo<MapMarkerItem[]>(
    () => [
      {
        id: 'station-main-pin',
        title: stationName,
        description: stationAddress,
        latitude: validLat,
        longitude: validLng,
        type: 'station',
        isMine: true,
        status: 'active',
        plateNumber: vehicleModel,
      },
      {
        id: 'ambulance-main-pin',
        title: vehicleModel,
        description: displayStatus,
        latitude: validLat,
        longitude: validLng,
        type: 'ambulance',
        status: 'active',
        plateNumber: vehicleModel,
      },
    ],
    [stationName, stationAddress, validLat, validLng, vehicleModel, displayStatus]
  );

  const staticMapUrl = useMemo(() => {
    return mapboxService.getStaticMapUrl({
      latitude: validLat,
      longitude: validLng,
      zoom: 15,
      width: 600,
      height: 350,
      pinColor: 'dc2626',
    });
  }, [validLat, validLng]);

  return (
    <View style={styles.container}>
      {/* Station Details Header */}
      <View style={styles.header}>
        <View style={styles.stationIconContainer}>
          <Building2 size={moderateScale(18)} color="#DC2626" />
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

      {/* Real Live Mapbox Map Box */}
      <View style={styles.mapContainer}>
        {/* 1. Fast loading Static Map fallback */}
        <Image
          source={{ uri: staticMapUrl }}
          style={styles.staticMapImage}
          resizeMode="cover"
        />

        {/* 2. Interactive Mapbox Vector Map overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <MapboxView
            userLatitude={validLat}
            userLongitude={validLng}
            markers={markers}
            interactive={false}
            mapStyle="streets"
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* 3. Floating Map Top Badge: Live Coordinates */}
        <View style={styles.coordsBadge}>
          <Crosshair size={moderateScale(11)} color="#DC2626" />
          <Text style={styles.coordsText} numberOfLines={1}>
            {validLat.toFixed(4)}° N, {validLng.toFixed(4)}° E
          </Text>
        </View>

        {/* 4. Floating Map Bottom Badge: Live Status & Open Map Action */}
        <View style={styles.mapBottomBar}>
          <View style={styles.statusPill}>
            <View style={styles.liveGreenDot} />
            <Text
              style={styles.statusPillText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              {t('staff.live_tracking', 'Đang định vị trực tiếp')}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.expandMapButton}
            onPress={onPressOpenFullMap}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={styles.expandMapText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}
            >
              {t('staff.open_map', 'Mở Bản Đồ')}
            </Text>
            <ExternalLink size={moderateScale(12)} color="#DC2626" />
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
            {displayStatus}
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
            {t('staff.return_station')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#FEF2F2',
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
    color: '#0F172A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
    gap: scale(4),
  },
  stationAddress: {
    fontSize: moderateScale(11),
    color: '#64748B',
    flex: 1,
  },
  mapContainer: {
    height: verticalScale(145),
    backgroundColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staticMapImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  coordsBadge: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(4),
    zIndex: 20,
    elevation: 4,
  },
  coordsText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#DC2626',
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
    zIndex: 20,
    elevation: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(5),
  },
  liveGreenDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#0F172A',
  },
  expandMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(4),
  },
  expandMapText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#DC2626',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: scale(10),
  },
  vehicleInfoGroup: {
    flex: 1,
  },
  vehicleModelText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleStatusText: {
    fontSize: moderateScale(10.5),
    color: '#059669',
    marginTop: verticalScale(1),
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
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
