import * as Location from 'expo-location';
import { mapboxService } from './mapbox.service';

export interface UserCurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address: string;
}

/**
  * Kiểm tra tọa độ có nằm trong lãnh thổ Việt Nam hay không
  * Giúp phát hiện vị trí mặc định từ Android Emulator (Mountain View USA: 37.42, -122.08)
  */
export const isCoordinatesInVietnam = (lat?: number, lng?: number): boolean => {
  if (lat == null || lng == null) return false;
  return lat >= 8.0 && lat <= 24.5 && lng >= 102.0 && lng <= 111.0;
};

export const DEFAULT_VN_LOCATION: UserCurrentLocation = {
  latitude: 10.8415,
  longitude: 106.8098,
  accuracy: 5,
  address: 'FPT Station, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
};

class LocationService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentLocation(): Promise<UserCurrentLocation> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return DEFAULT_VN_LOCATION;
      }

      // Try quick cached GPS position first
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);

      // Try accurate fix with timeout
      let position = lastKnown;
      try {
        const freshPosPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
        const fresh = await Promise.race([freshPosPromise, timeoutPromise]);
        if (fresh) {
          position = fresh;
        }
      } catch {
        // use lastKnown if fresh fails
      }

      if (!position) {
        return DEFAULT_VN_LOCATION;
      }

      let { latitude, longitude, accuracy } = position.coords;

      // Bảo vệ: Nếu vị trí GPS nằm ngoài Việt Nam (ví dụ Android Emulator đang ở Mountain View, Mỹ)
      // thì fallback về trạm FPT Station ở TP.HCM để tránh OSRM vẽ đường 14.500km xuyên lục địa
      if (!isCoordinatesInVietnam(latitude, longitude)) {
        latitude = DEFAULT_VN_LOCATION.latitude;
        longitude = DEFAULT_VN_LOCATION.longitude;
      }

      const address = await mapboxService.reverseGeocode(latitude, longitude);

      return {
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
        address,
      };
    } catch {
      return DEFAULT_VN_LOCATION;
    }
  }
}

export const locationService = new LocationService();

