import { create } from 'zustand';
import { User, UserRole, DEMO_CITIZEN_USER, DEMO_STAFF_USER } from '../types/models';
import { UserDto } from '../types/auth';
import { storage } from '../services/storage';
import { AppConfig } from '../constants/config';
import { authService } from '../services/auth.service';

export const mapBackendUser = (dto: UserDto): User => {
  const isStaff =
    dto.role === 'RescueStaff' ||
    dto.role === 'Operator' ||
    dto.role === 'Admin';

  return {
    id: dto.id,
    email: dto.email,
    name: dto.fullName,
    role: isStaff ? 'staff' : 'citizen',
    phone: dto.phoneNumber || undefined,
    avatarUrl: dto.avatarUrl || undefined,
    staffId: isStaff ? (dto.stationName ? `ST-${dto.role}` : 'ST-115') : undefined,
    teamName: isStaff ? dto.stationName || 'Đội Cứu Hộ Cơ Động 115' : undefined,
  };
};

interface AppState {
  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Auth & Role state
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  initAuth: () => Promise<void>;
  setAuth: (user: User, token: string, refreshToken?: string) => Promise<void>;
  setUserRole: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoadingAuth: true,

  initAuth: async () => {
    try {
      const [token, refreshToken, user] = await Promise.all([
        storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN),
        storage.getItem<string>(AppConfig.STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItem<User>(AppConfig.STORAGE_KEYS.USER_INFO),
      ]);

      if (token && user) {
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoadingAuth: false,
        });
        return;
      }
    } catch {
      // Ignore token read error on bootstrap
    }
    set({ isLoadingAuth: false });
  },

  setAuth: async (user, token, refreshToken) => {
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
    try {
      await Promise.all([
        storage.setItem(AppConfig.STORAGE_KEYS.AUTH_TOKEN, token),
        storage.setItem(AppConfig.STORAGE_KEYS.USER_INFO, user),
        refreshToken ? storage.setItem(AppConfig.STORAGE_KEYS.REFRESH_TOKEN, refreshToken) : Promise.resolve(),
      ]);
    } catch {
      // Ignore storage persistence failure
    }
  },

  setUserRole: (role) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, role }
        : role === 'staff'
        ? DEMO_STAFF_USER
        : DEMO_CITIZEN_USER,
    })),

  switchDemoRole: (role) =>
    set({
      user: role === 'staff' ? DEMO_STAFF_USER : DEMO_CITIZEN_USER,
      token: 'demo-token-' + role,
      refreshToken: null,
      isAuthenticated: true,
    }),

  logout: async () => {
    const currentRefresh = get().refreshToken;
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    try {
      await Promise.all([
        storage.removeItem(AppConfig.STORAGE_KEYS.AUTH_TOKEN),
        storage.removeItem(AppConfig.STORAGE_KEYS.REFRESH_TOKEN),
        storage.removeItem(AppConfig.STORAGE_KEYS.USER_INFO),
        storage.removeItem('@emergency_user_profile'),
        currentRefresh ? authService.logout(currentRefresh) : Promise.resolve(),
      ]);
    } catch {
      // Ignore error during cleanup
    }
  },
}));
