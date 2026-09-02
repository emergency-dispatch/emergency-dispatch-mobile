import { create } from 'zustand';
import {
  UserEmergencyProfile,
  MedicalProfile,
  IceSettings,
  SpecialSpecificInfo,
  IceContact,
} from '../types/profile';
import { storage } from '../services/storage';

const STORAGE_KEY = '@emergency_user_profile';

export const INITIAL_PROFILE: UserEmergencyProfile = {
  id: 'usr_rescue_9981',
  fullName: 'Nguyễn Văn An',
  phoneNumber: '0912 345 678',
  email: 'nguyenvanan.emergency@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  idCardNumber: '079095012345',
  address: 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  dateOfBirth: '15/08/1995',
  gender: 'Nam',
  isVerified: true,
  updatedAt: new Date().toISOString(),

  // 2. Y tế khẩn cấp (Medical ID)
  medicalId: {
    bloodType: 'O+',
    chronicConditions: ['Hen suyễn (Mãn tính)', 'Tăng huyết áp nhẹ'],
    allergies: ['Dị ứng Penicillin (Sốc phản vệ)', 'Dị ứng hải sản có vỏ'],
    currentMedications: ['Ventolin Inhaler 100mcg (Cắt cơn)', 'Amlodipine 5mg (Mỗi sáng)'],
    mobilityLimitations: ['Khó thở khi gắng sức mạnh'],
    additionalNotes: 'Cần bình xịt thở khẩn cấp trong trường hợp ngạt khói hoặc hoảng loạn.',
  },

  // 3. Người thân khẩn cấp (ICE)
  ice: {
    autoSendSmsOnSos: true,
    contacts: [
      {
        id: 'ice_1',
        name: 'Nguyễn Thị Mai',
        relationship: 'Vợ',
        phoneNumber: '0987 654 321',
        isPrimary: true,
      },
      {
        id: 'ice_2',
        name: 'Nguyễn Văn Hùng',
        relationship: 'Bố ruột',
        phoneNumber: '0903 112 233',
        isPrimary: false,
      },
    ],
    smsTemplate: 'KHẨN CẤP: Tôi đang kích hoạt tín hiệu SOS tại toạ độ {GPS_COORDS}. Hãy liên hệ lực lượng cứu hộ 114/115 hỗ trợ tôi ngay!',
  },

  // 4. Thông tin bổ sung đặc thù
  specialInfo: {
    preferredLanguage: 'Tiếng Việt',
    dependentsNote: 'Căn hộ có 01 trẻ em 8 tháng tuổi và 01 cụ già 82 tuổi (khả năng di chuyển chậm, cần hỗ trợ khi sơ tán cầu thang bộ).',
    householdMembersCount: 4,
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
  resetToDefault: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: INITIAL_PROFILE,
  isLoading: false,

  loadProfile: async () => {
    try {
      set({ isLoading: true });
      const saved = await storage.getItem<UserEmergencyProfile>(STORAGE_KEY);
      if (saved) {
        set({ profile: saved, isLoading: false });
      } else {
        await storage.setItem(STORAGE_KEY, INITIAL_PROFILE);
        set({ profile: INITIAL_PROFILE, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load profile from storage', error);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const updated = {
      ...get().profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  updateIdentity: async (identityData) => {
    const updated: UserEmergencyProfile = {
      ...get().profile,
      ...identityData,
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  updateMedicalProfile: async (medicalData) => {
    const current = get().profile;
    const updated: UserEmergencyProfile = {
      ...current,
      medicalId: {
        ...current.medicalId,
        ...medicalData,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  updateIceSettings: async (iceData) => {
    const current = get().profile;
    const updated: UserEmergencyProfile = {
      ...current,
      ice: {
        ...current.ice,
        ...iceData,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  addIceContact: async (contactData) => {
    const current = get().profile;
    const newContact: IceContact = {
      ...contactData,
      id: `ice_${Date.now()}`,
    };
    const updatedContacts = [...current.ice.contacts, newContact];
    const updated: UserEmergencyProfile = {
      ...current,
      ice: {
        ...current.ice,
        contacts: updatedContacts,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  removeIceContact: async (contactId) => {
    const current = get().profile;
    const updatedContacts = current.ice.contacts.filter((c) => c.id !== contactId);
    const updated: UserEmergencyProfile = {
      ...current,
      ice: {
        ...current.ice,
        contacts: updatedContacts,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  toggleAutoSendSms: async (enabled) => {
    const current = get().profile;
    const updated: UserEmergencyProfile = {
      ...current,
      ice: {
        ...current.ice,
        autoSendSmsOnSos: enabled,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  updateSpecialInfo: async (specialData) => {
    const current = get().profile;
    const updated: UserEmergencyProfile = {
      ...current,
      specialInfo: {
        ...current.specialInfo,
        ...specialData,
      },
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    await storage.setItem(STORAGE_KEY, updated);
  },

  resetToDefault: async () => {
    set({ profile: INITIAL_PROFILE });
    await storage.setItem(STORAGE_KEY, INITIAL_PROFILE);
  },
}));
