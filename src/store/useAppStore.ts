import { create } from 'zustand';
import { User, UserRole, DEMO_CITIZEN_USER, DEMO_STAFF_USER } from '../types/models';

interface AppState {
  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Auth & Role state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUserRole: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  // Default initial demo state is unauthenticated or can be set upon login
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

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
      isAuthenticated: true,
    }),

  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
