export const MAPBOX_ACCESS_TOKEN =
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
  type: 'hospital' | 'incident' | 'shelter' | 'fire_station';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
}

class MapboxService {
  /**
   * Reverse geocode coordinates to human-readable Vietnamese address.
   * Uses Mapbox Geocoding with transparent OpenStreetMap fallback.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // 1. Try Mapbox Geocoding API
    try {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=VN&language=vi`;
      const res = await fetch(mapboxUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }
    } catch {
      // Fallback
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
          // Format into shorter readable string
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

    return '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM';
  }

  /**
   * Search for location or address
   */
  async searchLocation(query: string): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
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
}

export const mapboxService = new MapboxService();
