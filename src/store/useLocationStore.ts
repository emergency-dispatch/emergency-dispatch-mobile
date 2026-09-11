import { create } from 'zustand';
import { locationService, UserCurrentLocation } from '../services/location.service';

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
  };
  address: string;
  isFetchingLocation: boolean;
  hasLoadedInitialLocation: boolean;
  refreshLocation: (force?: boolean) => Promise<UserCurrentLocation>;
}

let inFlightLocationPromise: Promise<UserCurrentLocation> | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: {
    latitude: 10.776889,
    longitude: 106.700806,
  },
  address: 'Đang xác định vị trí...',
  isFetchingLocation: false,
  hasLoadedInitialLocation: false,

  refreshLocation: async (force = false) => {
    const state = get();
    // Return cached location if already loaded and not forced
    if (!force && state.hasLoadedInitialLocation && !state.isFetchingLocation) {
      return {
        latitude: state.coords.latitude,
        longitude: state.coords.longitude,
        address: state.address,
      };
    }

    // If already fetching, await the active promise so we don't return stale coords
    if (inFlightLocationPromise) {
      return inFlightLocationPromise;
    }

    set({ isFetchingLocation: true });

    inFlightLocationPromise = (async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        set({
          coords: { latitude: loc.latitude, longitude: loc.longitude },
          address: loc.address,
          hasLoadedInitialLocation: true,
          isFetchingLocation: false,
        });
        return loc;
      } catch {
        set({ isFetchingLocation: false });
        return {
          latitude: get().coords.latitude,
          longitude: get().coords.longitude,
          address: get().address,
        };
      } finally {
        inFlightLocationPromise = null;
      }
    })();

    return inFlightLocationPromise;
  },
}));
