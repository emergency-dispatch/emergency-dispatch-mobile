import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import {
  MapPin,
  Navigation,
  Shield,
  Flame,
  Hospital,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  Crosshair,
} from 'lucide-react-native';
import { MapboxView, MapboxViewRef } from '../../components/map/MapboxView';
import { mapboxService, MapMarkerItem } from '../../services/mapbox.service';
import { incidentService } from '../../services/incident.service';
import { locationService } from '../../services/location.service';
import { useLocationStore } from '../../store/useLocationStore';

const DEFAULT_POIS: MapMarkerItem[] = [
  {
    id: 'hosp-1',
    title: 'Bệnh Viện Đa Khoa Sài Gòn',
    description: '125 Lê Lợi, P. Bến Thành, Q.1 - Trực cấp cứu 24/7 (Hotline: 115)',
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
  const mapRef = useRef<MapboxViewRef>(null);

  const {
    coords: userCoords,
    address: currentAddress,
    refreshLocation,
  } = useLocationStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'hospital' | 'incident' | 'shelter'>('all');
  const [markers, setMarkers] = useState<MapMarkerItem[]>(DEFAULT_POIS);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real user GPS (cached from Home or freshly fetched) & incidents from backend
  const loadMapData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Shared GPS location
      await refreshLocation();

      // 2. Load incidents from backend
      const result = await incidentService.getIncidents();
      const incidentList = result?.items || [];
      const incidentMarkers: MapMarkerItem[] = incidentList
        .filter((inc) => inc.latitude && inc.longitude)
        .map((inc) => ({
          id: inc.id,
          title: inc.title || 'Sự Cố Khẩn Cấp',
          description: `${inc.locationAddress || 'Hiện trường'} • Mức độ: ${inc.severity}`,
          latitude: inc.latitude,
          longitude: inc.longitude,
          type: 'incident',
          severity: inc.severity as any,
        }));

      setMarkers([...DEFAULT_POIS, ...incidentMarkers]);
    } catch {
      // Keep defaults
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'incident') return m.type === 'incident';
    if (activeFilter === 'hospital') return m.type === 'hospital' || m.type === 'fire_station';
    if (activeFilter === 'shelter') return m.type === 'shelter';
    return true;
  });

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
      style={styles.container}
    >
      {/* 1. Header with Geocoded Location & Live Status */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Bản Đồ An Toàn</Text>
            <Text style={styles.subtitle}>Mạng lưới cứu hộ, bệnh viện & cảnh báo sự cố 24/7</Text>
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

        {/* Filter Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Layers size={13} color={activeFilter === 'all' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              Tất Cả ({markers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'hospital' && styles.filterChipActive]}
            onPress={() => setActiveFilter('hospital')}
          >
            <Hospital size={13} color={activeFilter === 'hospital' ? '#FFFFFF' : '#10B981'} />
            <Text style={[styles.filterChipText, activeFilter === 'hospital' && styles.filterChipTextActive]}>
              Bệnh Viện & PCCC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'incident' && styles.filterChipActive]}
            onPress={() => setActiveFilter('incident')}
          >
            <Flame size={13} color={activeFilter === 'incident' ? '#FFFFFF' : '#DC2626'} />
            <Text style={[styles.filterChipText, activeFilter === 'incident' && styles.filterChipTextActive]}>
              Sự Cố Hiện Trường
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'shelter' && styles.filterChipActive]}
            onPress={() => setActiveFilter('shelter')}
          >
            <Shield size={13} color={activeFilter === 'shelter' ? '#FFFFFF' : '#2563EB'} />
            <Text style={[styles.filterChipText, activeFilter === 'shelter' && styles.filterChipTextActive]}>
              Trú Ẩn An Toàn
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 2. Interactive Mapbox View */}
      <View style={styles.mapContainer}>
        <MapboxView
          ref={mapRef}
          userLatitude={userCoords.latitude}
          userLongitude={userCoords.longitude}
          markers={filteredMarkers}
          onMarkerPress={handleMarkerSelect}
          style={styles.mapboxView}
        />

        {/* Floating Recenter Button */}
        <TouchableOpacity
          style={styles.floatingRecenter}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Crosshair size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* 3. Selected Point of Interest Card or Bottom Legend */}
      {selectedMarker ? (
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
                    ? 'Y TẾ KHẨN CẤP'
                    : selectedMarker.type === 'incident'
                      ? 'SỰ CỐ NGUY CƠ'
                      : 'ĐIỂM TRÚ ẨN'}
                </Text>
              </View>
              {selectedMarker.severity && (
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>Mức {selectedMarker.severity}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedMarker(null)}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.detailTitle}>{selectedMarker.title}</Text>
          <Text style={styles.detailDesc}>{selectedMarker.description}</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Alert.alert(
                'Chỉ Dẫn Cứu Hộ',
                `Đã kích hoạt tuyến đường an toàn tới: ${selectedMarker.title}`,
                [{ text: 'Đồng ý' }]
              );
            }}
          >
            <Navigation size={15} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>DẪN ĐƯỜNG AN TOÀN TỚI ĐÂY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.recenterButton}
          onPress={handleRecenter}
        >
          <Navigation size={18} color="#FFFFFF" />
          <Text style={styles.recenterText}> VỊ TRÍ CỦA TÔI</Text>
        </TouchableOpacity>
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  floatingRecenter: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  recenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  recenterText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
