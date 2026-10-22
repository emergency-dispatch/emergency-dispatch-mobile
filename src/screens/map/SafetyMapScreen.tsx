import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Navigation,
  RefreshCw,
  Crosshair,
  Plus,
  Minus,
} from 'lucide-react-native';
import { MapboxView, MapboxViewRef } from '../../components/map/MapboxView';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';
import { incidentService } from '../../services/incident.service';
import { locationService } from '../../services/location.service';
import { useLocationStore } from '../../store/useLocationStore';
import { useAppStore } from '../../store/useAppStore';

const DEFAULT_POIS: MapMarkerItem[] = [
  {
    id: 'hosp-1',
    title: 'Bệnh Viện Đa Khoa Sài Gòn',
    description: '125 Lê Lợi, P. Bến Thành, Q.1 - Trực cấp cứu 24/7 (Hotline Cứu Hộ 24/7)',
    latitude: 10.7719,
    longitude: 106.6993,
    type: 'hospital',
  },
  {
    id: 'hosp-2',
    title: 'Trạm Cứu Hộ & Y Tế Bến Nghé',
    description: '45 Nguyễn Du, P. Bến Nghé, Q.1 - Điểm sơ cấp cứu ban đầu',
    latitude: 10.7795,
    longitude: 106.7025,
    type: 'hospital',
  },
  {
    id: 'fire-1',
    title: 'Đội Cảnh Sát PCCC & CNCH Quận 1',
    description: '258 Trần Hưng Đạo, Q.1 - Đội ứng trực xe thang & bơm cao áp',
    latitude: 10.7612,
    longitude: 106.6924,
    type: 'fire_station',
  },
  {
    id: 'shelter-1',
    title: 'Điểm Trú Ẩn Khẩn Cấp - Cung Văn Hóa Lao Động',
    description: '55B Nguyễn Thị Minh Khai, Bến Thành, Q.1 - Sức chứa 1.500 người',
    latitude: 10.7745,
    longitude: 106.6938,
    type: 'shelter',
  },
];

export const SafetyMapScreen: React.FC = () => {
  const { t } = useTranslation();
  const mapRef = useRef<MapboxViewRef>(null);

  const {
    coords: userCoords,
    address: currentAddress,
    refreshLocation,
  } = useLocationStore();

  const { isAuthenticated, user } = useAppStore();
  const [markers, setMarkers] = useState<MapMarkerItem[]>(DEFAULT_POIS);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real user GPS & real incidents, rescue units, stations from backend
  const loadMapData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Shared GPS location
      await refreshLocation();

      // 2. Load incidents according to role/auth to avoid 401/403
      let incidentList: Array<{
        id: string;
        title?: string;
        description?: string;
        locationAddress?: string;
        latitude?: number;
        longitude?: number;
        severity?: any;
      }> = [];

      if (isAuthenticated) {
        if (user?.role === 'staff') {
          const res = await incidentService.getIncidents({ pageSize: 50 }).catch(() => null);
          if (res?.items) incidentList = res.items;
        } else {
          const res = await incidentService.getMyReports({ pageSize: 20 }).catch(() => null);
          if (res?.items) incidentList = res.items;
        }
      }

      // 3. Load public rescue units and stations
      const [rescueUnitsRes, stationsRes] = await Promise.allSettled([
        incidentService.getRescueUnits(),
        incidentService.getStations(),
      ]);

      const incidentMarkers: MapMarkerItem[] = incidentList
        .filter((inc) => inc.latitude && inc.longitude)
        .map((inc) => {
          const isAccident =
            (inc.title && inc.title.toLowerCase().includes('tai nạn')) ||
            (inc.description && inc.description.toLowerCase().includes('tai nạn'));
          return {
            id: inc.id,
            title: inc.title || 'Sự Cố Khẩn Cấp',
            description: `${inc.locationAddress || 'Hiện trường'} • Mức độ: ${inc.severity}`,
            latitude: inc.latitude!,
            longitude: inc.longitude!,
            type: 'incident',
            category: isAccident ? 'accident' : 'fire',
            severity: inc.severity,
          };
        });

      const unitList = rescueUnitsRes.status === 'fulfilled' ? rescueUnitsRes.value || [] : [];
      const unitMarkers: MapMarkerItem[] = unitList
        .filter((u) => u.currentLat && u.currentLng)
        .map((u) => ({
          id: u.id,
          title: `${u.plateNumber || 'Xe cứu hộ'} (${u.unitTypeName || u.unitType})`,
          description: `Thuộc: ${u.stationName || 'Trạm'} • Trạng thái: ${
            u.status === 'Available'
              ? 'Sẵn sàng trực chiến'
              : u.status === 'Dispatched'
              ? 'Đang điều phối'
              : 'Tại hiện trường'
          }`,
          latitude: u.currentLat,
          longitude: u.currentLng,
          type: 'rescue_unit',
          unitType: u.unitType,
          status: u.status,
          plateNumber: u.plateNumber,
        }));

      const stationList = stationsRes.status === 'fulfilled' ? stationsRes.value || [] : [];
      const stationMarkers: MapMarkerItem[] = stationList
        .filter((s) => s.latitude && s.longitude)
        .map((s) => ({
          id: s.id,
          title: s.name,
          description: `${s.address} • ${s.activeUnitsCount || 0}/${s.totalUnitsCount || 0} xe trực chiến`,
          latitude: s.latitude,
          longitude: s.longitude,
          type: 'station',
          phoneNumber: s.phoneNumber,
        }));

      setMarkers([...DEFAULT_POIS, ...stationMarkers, ...unitMarkers, ...incidentMarkers]);
    } catch {
      // Keep defaults
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const handleMarkerSelect = (marker: MapMarkerItem) => {
    setSelectedMarker(marker);
    mapRef.current?.flyTo(marker.latitude, marker.longitude, 16);
  };

  const handleRecenter = async () => {
    setSelectedMarker(null);
    try {
      const loc = await refreshLocation(true);
      mapRef.current?.flyTo(loc.latitude, loc.longitude, 16);
    } catch {
      mapRef.current?.recenter();
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      statusBarStyle="dark-content"
    >
      {/* 1. Header with Geocoded Location & Live Status */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{t('map.title')}</Text>
            <Text style={styles.subtitle}>{t('map.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadMapData}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Real Geocoded GPS Location Badge */}
        <View style={styles.addressPill}>
          <MapPin size={14} color="#DC2626" />
          <Text style={styles.addressText} numberOfLines={1}>
            {currentAddress}
          </Text>
        </View>
      </View>

      {/* 2. Interactive Mapbox View with In-Map Floating Controls */}
      <View style={styles.mapContainer}>
        <MapboxView
          ref={mapRef}
          userLatitude={userCoords.latitude}
          userLongitude={userCoords.longitude}
          markers={markers}
          onMarkerPress={handleMarkerSelect}
          style={styles.mapboxView}
        />

        {/* Floating Zoom & Recenter Controls Stack */}
        <View style={styles.mapControlsWrapper}>
          {/* Zoom In & Out Stack */}
          <View style={styles.zoomControlCard}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomIn()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Phóng to bản đồ"
            >
              <Plus size={18} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.zoomDivider} />

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => mapRef.current?.zoomOut()}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Thu nhỏ bản đồ"
            >
              <Minus size={18} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Small Floating Recenter Icon */}
          <TouchableOpacity
            style={styles.floatingRecenterBtn}
            onPress={handleRecenter}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Về vị trí của tôi"
          >
            <Crosshair size={20} color="#DC2626" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Selected Point of Interest Card */}
      {selectedMarker && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailBadgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  selectedMarker.type === 'hospital'
                    ? styles.badgeGreen
                    : selectedMarker.type === 'incident'
                      ? styles.badgeRed
                      : styles.badgeBlue,
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {selectedMarker.type === 'hospital'
                    ? t('map.badge_medical')
                    : selectedMarker.type === 'incident'
                      ? t('map.badge_hazard')
                      : t('map.badge_shelter')}
                </Text>
              </View>
              {selectedMarker.severity && (
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>Mức {selectedMarker.severity}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedMarker(null)}>
              <Text style={styles.closeText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.detailTitle}>{selectedMarker.title}</Text>
          <Text style={styles.detailDesc}>{selectedMarker.description}</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Alert.alert(
                t('map.navigating_to_incident'),
                t('map.safe_route_active', { destination: selectedMarker.title }),
                [{ text: t('common.understood') }]
              );
            }}
          >
            <Navigation size={15} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>{t('map.navigate_btn')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mapboxView: {
    flex: 1,
  },
  mapControlsWrapper: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  zoomControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  floatingRecenterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  severityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B45309',
  },
  closeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
    marginTop: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

