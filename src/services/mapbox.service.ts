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
  type: 'hospital' | 'incident' | 'shelter' | 'fire_station' | 'ambulance' | 'rescue_unit' | 'station';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical' | 0 | 1 | 2 | 3 | 'Unclassified' | 'Level1' | 'Level2' | 'Level3' | string;
  category?: 'fire' | 'accident' | 'medical' | 'hazard' | string;
  unitType?: string;
  status?: string;
  plateNumber?: string;
  phoneNumber?: string;
  etaMinutes?: number;
  distanceKm?: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

class MapboxService {
  /**
   * Reverse geocode coordinates to human-readable Vietnamese address.
   * Uses Mapbox Geocoding with transparent OpenStreetMap fallback.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // 1. Try Mapbox Geocoding API
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy')) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=VN&language=vi`;
        const res = await fetch(mapboxUrl);
        if (res.ok) {
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

    return `Tọa độ GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
  }

  /**
   * Search for location or address using Mapbox Places forward geocoding
   */
  async searchLocation(query: string): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
    // 1. Try Mapbox Forward Geocoding API
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy')) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=VN&language=vi&limit=5`;
        const res = await fetch(mapboxUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            return data.features.map((feat: any) => ({
              name: feat.place_name,
              latitude: feat.center[1],
              longitude: feat.center[0],
            }));
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Fallback via Nominatim
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=5&accept-language=vi`;
      const res = await fetch(osmUrl, {
        headers: { 'User-Agent': 'EmergencyDispatchApp/1.0' },
      });
      if (res.ok) {
        const list = await res.json();
        return list.map((item: any) => ({
          name: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
      }
    } catch {
      // ignore
    }
    return [];
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
    // 1. Try Mapbox Directions API
    if (MAPBOX_ACCESS_TOKEN && !MAPBOX_ACCESS_TOKEN.includes('dummy')) {
      try {
        const mapboxDirUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(mapboxDirUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            return coords.map(([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }));
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Fallback via OSRM
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates;
          return coords.map(([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
        }
      }
    } catch {
      // Fallback below
    }
    return [origin, destination];
  }
}

export const mapboxService = new MapboxService();
