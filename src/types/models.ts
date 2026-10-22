export * from './profile';

export type UserRole = 'citizen' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  staffId?: string;
  vehiclePlate?: string;
  teamName?: string;
  stationId?: string;
  stationName?: string;
  crewRole?: string;
  rescueUnitId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEMO_CITIZEN_USER: User = {
  id: 'user-citizen-01',
  email: 'nguoidan@gmail.com',
  name: 'Nguyễn Văn An',
  role: 'citizen',
  phone: '0909123456',
  createdAt: new Date().toISOString(),
};

export const DEMO_STAFF_USER: User = {
  id: 'user-staff-01',
  email: 'cuuho.kcn@emergency.vn',
  name: 'Lê Quốc Huy',
  role: 'staff',
  phone: '0912345678',
  staffId: 'ST-8821',
  vehiclePlate: '51A-999.99',
  teamName: 'Đội Cứu Hộ & PCCC KCN Tân Bình',
  createdAt: new Date().toISOString(),
};
