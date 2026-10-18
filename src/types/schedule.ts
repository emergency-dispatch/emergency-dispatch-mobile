export type ShiftType = 'morning' | 'afternoon' | 'night' | 'full24';

export type ShiftRole = 'driver' | 'paramedic' | 'dispatcher' | 'rescuer';

export type ShiftStatus = 'approved' | 'pending' | 'completed' | 'cancelled';

export interface ShiftDefinition {
  type: ShiftType;
  nameVi: string;
  nameEn: string;
  startTime: string;
  endTime: string;
  hours: number;
  descriptionVi: string;
  descriptionEn: string;
  stipendBonusVi?: string;
  stipendBonusEn?: string;
  iconName: 'sun' | 'sunset' | 'moon' | 'zap';
}

export interface StationOption {
  id: string;
  nameVi: string;
  nameEn: string;
  addressVi: string;
  addressEn: string;
  code: string;
}

export interface WorkShift {
  id: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  title: string;
  startTime: string;
  endTime: string;
  hours: number;
  role: ShiftRole;
  stationId: string;
  stationName: string;
  vehiclePlate?: string;
  status: ShiftStatus;
  notes?: string;
  registeredAt: string;
  availableSlots: number;
  maxSlots: number;
  isOvertime?: boolean;
  stipendBonus?: string;
}

export interface RegisterShiftPayload {
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  role: ShiftRole;
  stationId: string;
  notes?: string;
  isOnCallStandby?: boolean;
}

export interface BatchRegisterShiftsPayload {
  dates: string[]; // List of YYYY-MM-DD
  shiftTypes: ShiftType[]; // List of selected shifts
  role: ShiftRole;
  stationId: string;
  notes?: string;
  isOnCallStandby?: boolean;
}

export interface BatchRegisterResult {
  success: boolean;
  registeredCount: number;
  skippedCount: number;
  createdShifts: WorkShift[];
  message: string;
}

export interface ShiftSwapPayload {
  shiftId: string;
  targetColleagueName: string;
  reason: string;
}

export interface WeeklyScheduleSummary {
  weekRange: string;
  totalRegisteredHours: number;
  targetWeeklyHours: number;
  approvedShiftsCount: number;
  pendingShiftsCount: number;
  nightShiftsCount: number;
}
