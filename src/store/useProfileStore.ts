import { create } from 'zustand';
import {
  UserEmergencyProfile,
  MedicalProfile,
  IceSettings,
  SpecialSpecificInfo,
  IceContact,
} from '../types/profile';
import {
  mapBackendUserToProfile,
  mapProfileToUpdateDto,
} from '../types/user';
import { storage } from '../services/storage';
import { AppConfig } from '../constants/config';
import { userService } from '../services/user.service';

const STORAGE_KEY = '@emergency_user_profile';

export const INITIAL_PROFILE: UserEmergencyProfile = {
  id: '',
  fullName: '',
  phoneNumber: '',
  email: '',
  avatarUrl: undefined,
  idCardNumber: '',
  address: '',
  dateOfBirth: '',
  gender: undefined,
  isVerified: false,
  updatedAt: new Date().toISOString(),

  medicalId: {
    bloodType: 'Chưa rõ',
    chronicConditions: [],
    allergies: [],
    currentMedications: [],
    mobilityLimitations: [],
    additionalNotes: '',
  },

  ice: {
    autoSendSmsOnSos: true,
    contacts: [],
    smsTemplate: 'KHẨN CẤP: Tôi đang kích hoạt tín hiệu SOS tại toạ độ {GPS_COORDS}. Hãy liên hệ lực lượng cứu hộ 114/115 hỗ trợ tôi ngay!',
  },

  specialInfo: {
    preferredLanguage: 'Tiếng Việt',
    dependentsNote: '',
    householdMembersCount: undefined,
  },
};

interface ProfileState {
  profile: UserEmergencyProfile;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserEmergencyProfile>) => Promise<void>;
  updateIdentity: (identityData: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    avatarUrl?: string;
    idCardNumber?: string;
    address: string;
    dateOfBirth?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
  }) => Promise<void>;
  updateMedicalProfile: (medicalData: Partial<MedicalProfile>) => Promise<void>;
  updateIceSettings: (iceData: Partial<IceSettings>) => Promise<void>;
  addIceContact: (contact: Omit<IceContact, 'id'>) => Promise<void>;
  removeIceContact: (contactId: string) => Promise<void>;
  toggleAutoSendSms: (enabled: boolean) => Promise<void>;
  updateSpecialInfo: (specialData: Partial<SpecialSpecificInfo>) => Promise<void>;
  registerFcmToken: (fcmToken: string) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: INITIAL_PROFILE,
  isLoading: false,

  loadProfile: async () => {
    try {
      set({ isLoading: true });
      let saved = await storage.getItem<UserEmergencyProfile>(STORAGE_KEY);

      // Clean up legacy hardcoded dummy profile if present in cache
      if (saved && saved.id === 'usr_rescue_9981') {
        saved = null;
        await storage.removeItem(STORAGE_KEY);
      }

      if (saved) {
        set({ profile: saved });
      }

      // Check if user is authenticated and sync with backend
      const token = await storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN);
      if (token && !token.startsWith('demo-token-')) {
        try {
          const remoteDto = await userService.getProfile();
          const synced = mapBackendUserToProfile(remoteDto, saved || INITIAL_PROFILE);
          set({ profile: synced, isLoading: false });
          await storage.setItem(STORAGE_KEY, synced);
          return;
        } catch (apiErr) {
          console.warn('Cannot sync remote profile, using local cache:', apiErr);
        }
      }

      if (!saved) {
        await storage.setItem(STORAGE_KEY, INITIAL_PROFILE);
        set({ profile: INITIAL_PROFILE });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to load profile from storage', error);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const updated: UserEmergencyProfile = {
      ...get().profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);

    // Sync to backend if authenticated
    try {
      const token = await storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN);
      if (token && !token.startsWith('demo-token-')) {
        const dto = mapProfileToUpdateDto(updated);
        const remoteUser = await userService.updateProfile(dto);
        const merged = mapBackendUserToProfile(remoteUser, updated);
        set({ profile: merged });
        await storage.setItem(STORAGE_KEY, merged);
      }
    } catch (err) {
      console.warn('Backend profile update failed, kept local state:', err);
    }
  },

  updateIdentity: async (identityData) => {
    await get().updateProfile(identityData);
  },

  updateMedicalProfile: async (medicalData) => {
    const current = get().profile;
    await get().updateProfile({
      medicalId: {
        ...current.medicalId,
        ...medicalData,
      },
    });
  },

  updateIceSettings: async (iceData) => {
    const current = get().profile;
    await get().updateProfile({
      ice: {
        ...current.ice,
        ...iceData,
      },
    });
  },

  addIceContact: async (contactData) => {
    const current = get().profile;
    const newContact: IceContact = {
      ...contactData,
      id: `ice_${Date.now()}`,
    };
    await get().updateProfile({
      ice: {
        ...current.ice,
        contacts: [...current.ice.contacts, newContact],
      },
    });
  },

  removeIceContact: async (contactId) => {
    const current = get().profile;
    await get().updateProfile({
      ice: {
        ...current.ice,
        contacts: current.ice.contacts.filter((c) => c.id !== contactId),
      },
    });
  },

  toggleAutoSendSms: async (enabled) => {
    const current = get().profile;
    await get().updateProfile({
      ice: {
        ...current.ice,
        autoSendSmsOnSos: enabled,
      },
    });
  },

  updateSpecialInfo: async (specialData) => {
    const current = get().profile;
    await get().updateProfile({
      specialInfo: {
        ...current.specialInfo,
        ...specialData,
      },
    });
  },

  registerFcmToken: async (fcmToken: string): Promise<boolean> => {
    try {
      const token = await storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN);
      if (token && !token.startsWith('demo-token-')) {
        return await userService.updateFcmToken(fcmToken);
      }
      return false;
    } catch (err) {
      console.warn('Failed to register FCM token:', err);
      return false;
    }
  },

  resetToDefault: async () => {
    set({ profile: INITIAL_PROFILE });
    await storage.setItem(STORAGE_KEY, INITIAL_PROFILE);
  },
}));
