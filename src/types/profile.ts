export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'Chưa rõ';

export interface IceContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary?: boolean;
}

export interface MedicalProfile {
  bloodType: BloodType;
  chronicConditions: string[]; // Tim mạch, Hen suyễn, Tiểu đường, Động kinh, Huyết áp cao...
  allergies: string[]; // Thuốc (Penicillin, Aspirin), Phấn hoa, Đậu phộng, Hải sản...
  currentMedications: string[]; // Thuốc đang điều trị thường xuyên (Insulin, Trợ tim, Kháng sinh...)
  mobilityLimitations: string[]; // Khiếm thính, Khiếm thị, Liệt chi, Sử dụng xe lăn, Khó vận động...
  additionalNotes?: string; // Ghi chú y khoa thêm
}

export interface IceSettings {
  contacts: IceContact[];
  autoSendSmsOnSos: boolean; // "Tự động gửi SMS toạ độ cho người thân khi bấm SOS"
  smsTemplate?: string;
}

export interface SpecialSpecificInfo {
  preferredLanguage: string; // "Tiếng Việt", "Tiếng Anh", v.v.
  dependentsNote: string; // "Có trẻ sơ sinh 6 tháng và người già 80 tuổi sống cùng"
  householdMembersCount?: number;
}

export interface UserEmergencyProfile {
  // 1. Thông tin định danh & Liên lạc
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  idCardNumber?: string; // CCCD / CMND
  address: string; // Địa chỉ thường trú / Nơi ở cố định
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';

  // 2. Thông tin y tế khẩn cấp (Medical ID)
  medicalId: MedicalProfile;

  // 3. Liên hệ khẩn cấp (ICE - In Case of Emergency)
  ice: IceSettings;

  // 4. Thông tin bổ sung đặc thù
  specialInfo: SpecialSpecificInfo;

  isVerified?: boolean;
  updatedAt: string;
}
