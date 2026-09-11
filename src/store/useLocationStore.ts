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

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: {
    latitude: 10.776889,
    longitude: 106.700806,
  },
  address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
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

    if (state.isFetchingLocation) {
      return {
        latitude: state.coords.latitude,
        longitude: state.coords.longitude,
        address: state.address,
      };
    }

    set({ isFetchingLocation: true });
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
        latitude: state.coords.latitude,
        longitude: state.coords.longitude,
        address: state.address,
      };
    }
  },
}));
