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
      address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    };

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return defaultLocation;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

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
