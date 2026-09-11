import { BloodType, IceContact, UserEmergencyProfile } from './profile';

/**
 * User DTOs matching EmergencyDispatch.Application.DTOs.User
 */
export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: 'Citizen' | 'Operator' | 'RescueStaff' | 'Admin' | string;
  status: 'Active' | 'Inactive' | 'Suspended' | string;
  dateOfBirth?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | string | null;
  citizenIdNumber?: string | null;
  address?: string | null;
  bloodType?: string | null;
  medicalNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  isEmailVerified: boolean;
  fcmToken?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateProfileDto {
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  citizenIdNumber?: string | null;
  address?: string | null;
  bloodType?: string | null;
  medicalNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
}

export interface UpdateFcmTokenDto {
  fcmToken: string;
}

/**
 * BloodType Mappers
 */
export const mapBloodTypeToBackend = (bt?: BloodType | string | null): string | null => {
  switch (bt) {
    case 'A+': return 'A_Positive';
    case 'A-': return 'A_Negative';
    case 'B+': return 'B_Positive';
    case 'B-': return 'B_Negative';
    case 'AB+': return 'AB_Positive';
    case 'AB-': return 'AB_Negative';
    case 'O+': return 'O_Positive';
    case 'O-': return 'O_Negative';
    case 'Chưa rõ': return 'Unknown';
    default: return null;
  }
};

export const mapBloodTypeFromBackend = (bt?: string | number | null): BloodType => {
  if (bt === null || bt === undefined) return 'Chưa rõ';
  const str = String(bt).toLowerCase();
  if (str.includes('a_pos') || str === '1' || str === 'a+') return 'A+';
  if (str.includes('a_neg') || str === '2' || str === 'a-') return 'A-';
  if (str.includes('b_pos') || str === '3' || str === 'b+') return 'B+';
  if (str.includes('b_neg') || str === '4' || str === 'b-') return 'B-';
  if (str.includes('ab_pos') || str === '5' || str === 'ab+') return 'AB+';
  if (str.includes('ab_neg') || str === '6' || str === 'ab-') return 'AB-';
  if (str.includes('o_pos') || str === '7' || str === 'o+') return 'O+';
  if (str.includes('o_neg') || str === '8' || str === 'o-') return 'O-';
  return 'Chưa rõ';
};

/**
 * Gender Mappers
 */
export const mapGenderToBackend = (g?: 'Nam' | 'Nữ' | 'Khác' | string | null): string | null => {
  if (!g) return null;
  if (g === 'Nam' || g === 'Male') return 'Male';
  if (g === 'Nữ' || g === 'Female') return 'Female';
  return 'Other';
};

export const mapGenderFromBackend = (g?: string | number | null): 'Nam' | 'Nữ' | 'Khác' | undefined => {
  if (g === null || g === undefined) return undefined;
  const str = String(g).toLowerCase();
  if (str === 'male' || str === '0' || str === 'nam') return 'Nam';
  if (str === 'female' || str === '1' || str === 'nữ' || str === 'nu') return 'Nữ';
  if (str === 'other' || str === '2' || str === 'khác' || str === 'khac') return 'Khác';
  return undefined;
};

/**
 * DateOfBirth Mappers
 */
export const mapDateOfBirthToBackend = (dob?: string | null): string | null => {
  if (!dob || !dob.trim()) return null;
  const trimmed = dob.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export const mapDateOfBirthFromBackend = (dob?: string | null): string => {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calculates exact age in full completed years from DD/MM/YYYY parts
 */
export const calculateAgeFromParts = (day: number, month: number, year: number): number => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
};

/**
 * Validates Date of Birth string (DD/MM/YYYY) and ensures age >= 18
 */
export const validateDobAge18 = (
  dobStr?: string | null
): { isValid: boolean; error?: string; age?: number } => {
  if (!dobStr || !dobStr.trim()) {
    return { isValid: false, error: 'Vui lòng chọn ngày sinh (từ đủ 18 tuổi trở lên)' };
  }
  const parts = dobStr.trim().split('/');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Định dạng ngày sinh phải là DD/MM/YYYY' };
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return { isValid: false, error: 'Ngày sinh không hợp lệ' };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return {
      isValid: false,
      error: `Tháng ${month}/${year} chỉ có tối đa ${daysInMonth} ngày`,
    };
  }

  const age = calculateAgeFromParts(day, month, year);
  if (age < 0) {
    return { isValid: false, error: 'Ngày sinh không thể ở tương lai' };
  }
  if (age < 18) {
    return {
      isValid: false,
      error: `Chưa đủ 18 tuổi (${age} tuổi). Ứng dụng yêu cầu người dùng từ đủ 18 tuổi trở lên.`,
      age,
    };
  }
  if (age > 120) {
    return { isValid: false, error: 'Năm sinh không hợp lệ (>120 tuổi)', age };
  }

  return { isValid: true, age };
};

/**
 * Returns formatted string like "14/01/2004 (22 tuổi)" or empty if not set
 */
export const formatDobWithAge = (dob?: string | null): string => {
  if (!dob || !dob.trim() || !dob.includes('/')) return '';
  const parts = dob.trim().split('/');
  if (parts.length !== 3) return dob;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return dob;
  const age = calculateAgeFromParts(d, m, y);
  if (age >= 0 && age <= 120) {
    return `${dob} (${age} tuổi)`;
  }
  return dob;
};

/**
 * Converts backend UserResponseDto into mobile UserEmergencyProfile
 */
export const mapBackendUserToProfile = (
  dto: UserResponseDto,
  currentProfile?: UserEmergencyProfile
): UserEmergencyProfile => {
  const primaryContact: IceContact[] =
    dto.emergencyContactPhone || dto.emergencyContactName
      ? [
          {
            id: 'ice_primary',
            name: dto.emergencyContactName || '',
            phoneNumber: dto.emergencyContactPhone || '',
            relationship: dto.emergencyContactRelationship || 'Người thân',
            isPrimary: true,
          },
        ]
      : [];

  return {
    id: dto.id,
    fullName: dto.fullName || '',
    phoneNumber: dto.phoneNumber || '',
    email: dto.email || '',
    avatarUrl: dto.avatarUrl || undefined,
    idCardNumber: dto.citizenIdNumber || '',
    address: dto.address || '',
    dateOfBirth: mapDateOfBirthFromBackend(dto.dateOfBirth),
    gender: mapGenderFromBackend(dto.gender),
    isVerified: dto.isEmailVerified,
    updatedAt: dto.updatedAt || dto.createdAt || new Date().toISOString(),

    medicalId: {
      bloodType: mapBloodTypeFromBackend(dto.bloodType),
      chronicConditions: currentProfile?.medicalId?.chronicConditions || [],
      allergies: currentProfile?.medicalId?.allergies || [],
      currentMedications: currentProfile?.medicalId?.currentMedications || [],
      mobilityLimitations: currentProfile?.medicalId?.mobilityLimitations || [],
      additionalNotes: dto.medicalNotes || '',
    },

    ice: {
      autoSendSmsOnSos: currentProfile?.ice?.autoSendSmsOnSos ?? true,
      contacts: primaryContact.length > 0 ? primaryContact : currentProfile?.ice?.contacts || [],
      smsTemplate: currentProfile?.ice?.smsTemplate || '',
    },

    specialInfo: {
      preferredLanguage: currentProfile?.specialInfo?.preferredLanguage || 'Tiếng Việt',
      dependentsNote: currentProfile?.specialInfo?.dependentsNote || '',
      householdMembersCount: currentProfile?.specialInfo?.householdMembersCount,
    },
  };
};

/**
 * Converts mobile UserEmergencyProfile into backend UpdateProfileDto
 */
export const mapProfileToUpdateDto = (profile: UserEmergencyProfile): UpdateProfileDto => {
  const primaryContact = profile.ice?.contacts?.find((c) => c.isPrimary) || profile.ice?.contacts?.[0];

  return {
    fullName: profile.fullName || '',
    phoneNumber: profile.phoneNumber || null,
    avatarUrl: profile.avatarUrl || null,
    dateOfBirth: mapDateOfBirthToBackend(profile.dateOfBirth),
    gender: mapGenderToBackend(profile.gender),
    citizenIdNumber: profile.idCardNumber || null,
    address: profile.address || null,
    bloodType: mapBloodTypeToBackend(profile.medicalId?.bloodType),
    medicalNotes: profile.medicalId?.additionalNotes || null,
    emergencyContactName: primaryContact?.name || null,
    emergencyContactPhone: primaryContact?.phoneNumber || null,
    emergencyContactRelationship: primaryContact?.relationship || null,
  };
};
