import * as Location from 'expo-location';
import { mapboxService } from './mapbox.service';

export interface UserCurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address: string;
}

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
    const defaultLocation: UserCurrentLocation = {
      latitude: 10.776889,
      longitude: 106.700806,
      accuracy: 5,
      address: 'Đang định vị GPS...',
    };

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return defaultLocation;
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
        return defaultLocation;
      }

      const { latitude, longitude, accuracy } = position.coords;
      const address = await mapboxService.reverseGeocode(latitude, longitude);

      return {
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
        address,
      };
    } catch {
      return defaultLocation;
    }
  }
}

export const locationService = new LocationService();
