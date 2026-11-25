import { getCurrentLanguage } from '../i18n';

export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1IjoiaG9taW5obmdoaWEiLCJhIjoiY210d2ZicjlvMDlhdDJ4cXk0Nmt4aGRqaiJ9.fNSi9B1nMWHMmIL7fsjypA';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MapMarkerItem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'hospital' | 'incident' | 'public_incident' | 'shelter' | 'fire_station' | 'ambulance' | 'rescue_unit' | 'station';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical' | 0 | 1 | 2 | 3 | 'Unclassified' | 'Level1' | 'Level2' | 'Level3' | string;
  category?: 'fire' | 'accident' | 'medical' | 'hazard' | string;
  unitType?: string;
  status?: string;
  code?: string;
  imageUrl?: string;
  statusLabel?: string;
  plateNumber?: string;
  phoneNumber?: string;
  etaMinutes?: number;
  distanceKm?: number;
  heading?: number;
  isMine?: boolean;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

const routeCache = new Map<string, { result: RouteDetailResult; timestamp: number }>();
const ROUTE_CACHE_TTL_MS = 60000; // 60s in-memory route cache

// Mặc định ưu tiên Khu Công nghệ cao (SHTP) & TP.HCM khi tìm địa chỉ
const SHTP_ANCHOR = { latitude: 10.8441, longitude: 106.8089 };
// Khung TP.HCM + TP. Thủ Đức + Khu CNC + vùng giáp ranh: minLng, minLat, maxLng, maxLat
const HCM_BBOX = '106.35,10.35,107.03,11.16';
// Nominatim viewbox theo chuẩn minLng,maxLat,maxLng,minLat
const HCM_NOMINATIM_VIEWBOX = '106.35,11.16,107.03,10.35';
const SEARCH_CACHE_TTL_MS = 120000;
const searchCache = new Map<string, { items: Array<{ name: string; latitude: number; longitude: number }>; ts: number }>();

const sqDistToAnchor = (lat: number, lng: number, anchor: { latitude: number; longitude: number }) =>
  (lat - anchor.latitude) ** 2 + (lng - anchor.longitude) ** 2;

class MapboxService {
  private mapboxGeocodeDisabled = false;

  /**
   * Reverse geocode coordinates to human-readable Vietnamese address.
   * Uses Mapbox Geocoding with transparent OpenStreetMap fallback.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // 1. Try Mapbox Geocoding API
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy') && !this.mapboxGeocodeDisabled) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=VN&language=vi`;
        const res = await fetch(mapboxUrl);
        if (res.status === 401 || res.status === 403) {
          this.mapboxGeocodeDisabled = true;
        } else if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
          }
        }
      } catch (err) {
        console.warn('Mapbox reverseGeocode failed, switching to OSM Nominatim:', err);
      }
    }

    // 2. Robust fallback via OpenStreetMap Nominatim
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`;
      const res = await fetch(osmUrl, {
        headers: { 'User-Agent': 'EmergencyDispatchApp/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(', ');
          if (parts.length > 4) {
            return parts.slice(0, 4).join(', ');
          }
          return data.display_name;
        }
      }
    } catch {
      // Fallback to default
    }

    const isEn = getCurrentLanguage() === 'en';
    return isEn
      ? `GPS Coordinates (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
      : `Tọa độ GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
  }

  /**
   * Tìm kiếm địa điểm ưu tiên TP.HCM & Khu Công nghệ cao (SHTP) để kết quả nhanh và không nhảy sang tỉnh khác.
   */
  async searchLocation(
    query: string,
    options?: {
      allowNominatim?: boolean;
      proximity?: { latitude: number; longitude: number };
      boundedToHcm?: boolean;
    }
  ): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const allowNominatim = options?.allowNominatim ?? true;
    const boundedToHcm = options?.boundedToHcm ?? true;
    const anchor =
      options?.proximity && !isNaN(options.proximity.latitude) && !isNaN(options.proximity.longitude) && options.proximity.latitude !== 0
        ? options.proximity
        : SHTP_ANCHOR;

    const cacheKey = `${trimmed.toLowerCase()}|${boundedToHcm ? 1 : 0}|${anchor.latitude.toFixed(2)},${anchor.longitude.toFixed(2)}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL_MS) {
      return cached.items;
    }

    const firstPart = trimmed.split(',')[0].trim().toLowerCase();
    const isFullCopiedAddress = trimmed.includes(',') && firstPart.length >= 3;
    const hasRelevantHit = (items: Array<{ name: string }>) =>
      firstPart.length >= 3 && items.some((m) => m.name.toLowerCase().includes(firstPart));

    const sortByAnchor = (items: Array<{ name: string; latitude: number; longitude: number }>) =>
      [...items].sort((a, b) => sqDistToAnchor(a.latitude, a.longitude, anchor) - sqDistToAnchor(b.latitude, b.longitude, anchor));

    // 1. Try Mapbox Search Box API (có cả địa điểm POI lẫn tên đường/số nhà; bỏ qua ngay nếu token 401/403)
    let mapboxItems: Array<{ name: string; latitude: number; longitude: number }> = [];
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy') && !this.mapboxGeocodeDisabled) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        let mapboxUrl =
          `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(trimmed)}` +
          `&access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&language=vi&limit=5&proximity=${anchor.longitude},${anchor.latitude}`;
        if (boundedToHcm) mapboxUrl += `&bbox=${HCM_BBOX}`;
        const res = await fetch(mapboxUrl, { signal: controller.signal });
        if (res.status === 401 || res.status === 403) {
          this.mapboxGeocodeDisabled = true;
        } else if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            mapboxItems = sortByAnchor(
              data.features
                .map((feat: any) => {
                  const p = feat?.properties || {};
                  const coords = feat?.geometry?.coordinates;
                  if (!Array.isArray(coords) || coords.length < 2) return null;
                  const addr = p.full_address || p.place_formatted || '';
                  const label = p.feature_type === 'poi' && p.name ? [p.name, addr].filter(Boolean).join(', ') : addr || p.name || '';
                  return label ? { name: label, latitude: coords[1], longitude: coords[0] } : null;
                })
                .filter(Boolean) as Array<{ name: string; latitude: number; longitude: number }>
            );
            if (mapboxItems.length > 0 && (!isFullCopiedAddress || hasRelevantHit(mapboxItems))) {
              searchCache.set(cacheKey, { items: mapboxItems, ts: Date.now() });
              return mapboxItems;
            }
          }
        }
      } catch {
        // Fallback below
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 2. Photon OSM (nhạy với cả tên đường, tòa nhà, trường học, bệnh viện tại Việt Nam)
    let photonItems: Array<{ name: string; latitude: number; longitude: number }> = [];
    {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const photonUrl =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}` +
          `&lat=${anchor.latitude}&lon=${anchor.longitude}&limit=6`;
        const res = await fetch(photonUrl, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          photonItems = sortByAnchor(
            (data?.features || [])
              .filter((f: any) => !f?.properties?.countrycode || String(f.properties.countrycode).toUpperCase() === 'VN')
              .map((f: any) => {
                const p = f?.properties || {};
                const coords = f?.geometry?.coordinates;
                if (!Array.isArray(coords) || coords.length < 2) return null;
                const streetPart = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street;
                const parts = [p.name, streetPart !== p.name ? streetPart : '', p.district || p.county, p.city || p.state].filter(Boolean);
                const label = Array.from(new Set(parts)).join(', ');
                return label ? { name: label, latitude: coords[1], longitude: coords[0] } : null;
              })
              .filter(Boolean) as Array<{ name: string; latitude: number; longitude: number }>
          );
          if (photonItems.length > 0 && (!isFullCopiedAddress || hasRelevantHit(photonItems))) {
            searchCache.set(cacheKey, { items: photonItems, ts: Date.now() });
            return photonItems;
          }
        }
      } catch {
        // Fallback to Nominatim below
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 3. Fallback via Nominatim giới hạn viewbox TP.HCM & Khu Công nghệ cao (cũng chạy khi dán địa chỉ dài mà Mapbox/Photon chỉ trả địa danh chung)
    const fallbackItems = mapboxItems.length > 0 ? mapboxItems : photonItems;
    if (allowNominatim || (isFullCopiedAddress && !hasRelevantHit(fallbackItems))) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const osmUrl =
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}` +
          `&format=json&countrycodes=vn&limit=5&accept-language=vi&viewbox=${HCM_NOMINATIM_VIEWBOX}` +
          (boundedToHcm ? '&bounded=1' : '');
        const res = await fetch(osmUrl, {
          headers: { 'User-Agent': 'EmergencyDispatchApp/1.0' },
          signal: controller.signal,
        });
        if (res.ok) {
          const list = await res.json();
          const mapped = sortByAnchor(
            list.map((item: any) => ({
              name: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            }))
          );
          if (mapped.length > 0) {
            searchCache.set(cacheKey, { items: mapped, ts: Date.now() });
            return mapped;
          }
        }
      } catch {
        // ignore
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (fallbackItems.length > 0) {
      searchCache.set(cacheKey, { items: fallbackItems, ts: Date.now() });
      return fallbackItems;
    }

    return [];
  }

  /**
   * Tìm kiếm khi người dân bấm nút tìm (explicit submit).
   * Thử TP.HCM + Khu CNC trước; nếu không có kết quả mới mở rộng tìm toàn Việt Nam.
   */
  async searchLocationExplicit(
    query: string,
    options?: { proximity?: { latitude: number; longitude: number } }
  ): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
    const hcmResults = await this.searchLocation(query, {
      allowNominatim: true,
      boundedToHcm: true,
      proximity: options?.proximity,
    });
    if (hcmResults.length > 0) return hcmResults;
    return this.searchLocation(query, {
      allowNominatim: true,
      boundedToHcm: false,
      proximity: options?.proximity,
    });
  }

  /**
   * Get high-res static map snapshot image URL from Mapbox
   */
  getStaticMapUrl(params: {
    latitude: number;
    longitude: number;
    zoom?: number;
    width?: number;
    height?: number;
    pinColor?: string;
  }): string {
    const {
      latitude,
      longitude,
      zoom = 15,
      width = 600,
      height = 400,
      pinColor = 'dc2626',
    } = params;

    const pin = `pin-s+${pinColor}(${longitude},${latitude})`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin}/${longitude},${latitude},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;
  }

  /**
   * Get realistic driving route waypoints between two coordinates.
   * Queries Mapbox Directions with seamless OSRM fallback.
   */
  async getRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RoutePoint[]> {
    const details = await this.getRouteWithDetails(origin, destination);
    return details.points;
  }

  /**
   * Get driving route with realistic points, distance (km) and ETA (minutes)
   */
  async getRouteWithDetails(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteDetailResult> {
    const cacheKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}->${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ROUTE_CACHE_TTL_MS) {
      return cached.result;
    }

    // 1. Try Mapbox Directions API (with 2.5s timeout)
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const mapboxDirUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(mapboxDirUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates;
            const result: RouteDetailResult = {
              points: coords.map(([lng, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
              })),
              distanceKm: Math.round((route.distance / 1000) * 10) / 10,
              durationMinutes: Math.max(1, Math.round(route.duration / 60)),
            };
            routeCache.set(cacheKey, { result, timestamp: Date.now() });
            return result;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Fallback via OSRM (with 2.5s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates;
          const result: RouteDetailResult = {
            points: coords.map(([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            })),
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMinutes: Math.max(1, Math.round(route.duration / 60)),
          };
          routeCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }
    } catch {
      // Fallback below
    }

    // Straight-line haversine fallback
    const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const straightKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    const result: RouteDetailResult = {
      points: [origin, destination],
      distanceKm: straightKm || 2.4,
      durationMinutes: Math.max(1, Math.round((straightKm / 35) * 60)) || 5,
      isApproximate: true,
    };
    return result;
  }
}

export interface RouteDetailResult {
  points: RoutePoint[];
  distanceKm: number;
  durationMinutes: number;
  isApproximate?: boolean;
}

export const isValidVietnamRoute = (points?: RoutePoint[]): boolean => {
  if (!points || points.length === 0) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const inVn = (p: RoutePoint) =>
    p.latitude >= 8.0 && p.latitude <= 24.5 && p.longitude >= 102.0 && p.longitude <= 111.0;
  return inVn(first) && inVn(last);
};

export const mapboxService = new MapboxService();

