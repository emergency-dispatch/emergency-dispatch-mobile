import { storage } from './storage';
import {
  WorkShift,
  ShiftDefinition,
  StationOption,
  RegisterShiftPayload,
  BatchRegisterShiftsPayload,
  BatchRegisterResult,
  ShiftSwapPayload,
  WeeklyScheduleSummary,
  ShiftType,
  ShiftRole,
} from '../types/schedule';

const SCHEDULE_STORAGE_KEY = '@emergency_staff_schedule';

export const SHIFT_DEFINITIONS: ShiftDefinition[] = [
  {
    type: 'morning',
    nameVi: 'Ca Sáng (06:00 - 14:00)',
    nameEn: 'Morning Shift (06:00 - 14:00)',
    startTime: '06:00',
    endTime: '14:00',
    hours: 8,
    descriptionVi: 'Ca sản xuất 1 - Tuần tra an toàn nhiệt, hóa chất & an toàn lao động nhà xưởng KCN',
    descriptionEn: 'Shift 1 production - Industrial safety, hazmat & workshop heat inspection',
    iconName: 'sun',
  },
  {
    type: 'afternoon',
    nameVi: 'Ca Chiều (14:00 - 22:00)',
    nameEn: 'Afternoon Shift (14:00 - 22:00)',
    startTime: '14:00',
    endTime: '22:00',
    hours: 8,
    descriptionVi: 'Ca sản xuất 2 - Giờ tan ca công nhân, rà soát an toàn kho bãi & vận hành KCN',
    descriptionEn: 'Shift 2 production - Workers rush hour, industrial warehouse & logistic safety',
    iconName: 'sunset',
  },
  {
    type: 'night',
    nameVi: 'Ca Đêm (22:00 - 06:00)',
    nameEn: 'Night Shift (22:00 - 06:00)',
    startTime: '22:00',
    endTime: '06:00',
    hours: 8,
    descriptionVi: 'Trực đêm KCN - Ứng trực chống cháy nổ xưởng, lò hơi & sự cố hóa chất đêm',
    descriptionEn: 'Nighttime industrial standby - Boiler, flammable storage & hazardous chemical monitoring',
    stipendBonusVi: '+30% Phụ cấp độc hại & trực đêm KCN',
    stipendBonusEn: '+30% IP Night & Hazard stipend',
    iconName: 'moon',
  },
  {
    type: 'full24',
    nameVi: 'Ca 24h Tăng Cường (07:00 - 07:00)',
    nameEn: '24-Hour Industrial Standby (07:00 - 07:00)',
    startTime: '07:00',
    endTime: '07:00',
    hours: 24,
    descriptionVi: 'Trực chiến 24h KCN - Cơ động xử lý thảm họa, tràn đổ hóa chất & cháy nổ liên xưởng',
    descriptionEn: '24h full standby - Large-scale factory fire, chemical hazmat & catastrophic containment',
    stipendBonusVi: '+50% Phụ cấp trực chiến KCN',
    stipendBonusEn: '+50% 24h tactical IP stipend',
    iconName: 'zap',
  },
];

export const RESCUE_STATIONS: StationOption[] = [
  {
    id: 'station_tanbinh',
    nameVi: 'Trạm Cứu Hộ & PCCC KCN Tân Bình',
    nameEn: 'Tan Binh IP Rescue & Fire Base',
    addressVi: 'Đường CN13 & CN1, KCN Tân Bình, P. Tây Thạnh, Tân Phú',
    addressEn: 'CN13 & CN1 Rd, Tan Binh IP, Tan Phu, HCMC',
    code: 'ST-KTB',
  },
  {
    id: 'station_hiepphuoc',
    nameVi: 'Trạm Ứng Phó Sự Cố KCN Hiệp Phước',
    nameEn: 'Hiep Phuoc IP Emergency Response Base',
    addressVi: 'Khu B, Đường số 1, KCN Hiệp Phước, Huyện Nhà Bè, TP.HCM',
    addressEn: 'Zone B, Rd 1, Hiep Phuoc IP, Nha Be, HCMC',
    code: 'ST-KHP',
  },
  {
    id: 'station_vinhloc',
    nameVi: 'Trạm Cứu Hộ & CNCH KCN Vĩnh Lộc',
    nameEn: 'Vinh Loc IP Rescue & Emergency Base',
    addressVi: 'Đường số 7, KCN Vĩnh Lộc, P. Bình Hưng Hòa B, Bình Tân',
    addressEn: 'Rd 7, Vinh Loc IP, Binh Tan, HCMC',
    code: 'ST-KVL',
  },
  {
    id: 'station_leminhxuan',
    nameVi: 'Trạm Xử Lý Sự Cố KCN Lê Minh Xuân',
    nameEn: 'Le Minh Xuan IP Hazmat & Rescue Station',
    addressVi: 'Đường Trần Đại Nghĩa, KCN Lê Minh Xuân, Bình Chánh',
    addressEn: 'Tran Dai Nghia Rd, Le Minh Xuan IP, Binh Chanh',
    code: 'ST-LMX',
  },
  {
    id: 'station_tantao',
    nameVi: 'Trạm Phản Ứng Nhanh KCN Tân Tạo',
    nameEn: 'Tan Tao IP Rapid Emergency Station',
    addressVi: 'Đường số 2, KCN Tân Tạo, P. Tân Tạo A, Bình Tân',
    addressEn: 'Rd 2, Tan Tao IP, Binh Tan, HCMC',
    code: 'ST-KTT',
  },
];

export const ROLE_LABELS: Record<ShiftRole, { vi: string; en: string }> = {
  driver: {
    vi: 'Lái Xe Cứu Hộ / PCCC KCN',
    en: 'Industrial Rescue & Fire Driver',
  },
  paramedic: {
    vi: 'Y Tế Lao Động & Cấp Cứu KCN',
    en: 'Occupational First Responder / EMT',
  },
  dispatcher: {
    vi: 'Trực Ban Điều Hành KCN',
    en: 'Industrial Park Dispatcher',
  },
  rescuer: {
    vi: 'Cứu Hộ Viên Hazmat & PCCC Nhà Xưởng',
    en: 'Hazmat & Factory Rescue Specialist',
  },
};

// Helper: Format Date to YYYY-MM-DD
export const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate initial mock shifts around today
const getInitialMockShifts = (): WorkShift[] => {
  const today = new Date();
  
  // Calculate Monday of current week
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const formatDayOffset = (offset: number) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return formatDateKey(d);
  };

  return [
    {
      id: 'shift-mock-1',
      date: formatDayOffset(0), // Monday
      shiftType: 'morning',
      title: 'Ca Sáng Tuần Tra An Toàn KCN Tân Bình',
      startTime: '06:00',
      endTime: '14:00',
      hours: 8,
      role: 'driver',
      stationId: 'station_tanbinh',
      stationName: 'Trạm Cứu Hộ & PCCC KCN Tân Bình',
      vehiclePlate: '51A-999.99',
      status: 'completed',
      registeredAt: '2026-10-10 09:30',
      availableSlots: 0,
      maxSlots: 3,
    },
    {
      id: 'shift-mock-2',
      date: formatDayOffset(1), // Tuesday
      shiftType: 'afternoon',
      title: 'Ca Chiều Ứng Trực KCN Hiệp Phước',
      startTime: '14:00',
      endTime: '22:00',
      hours: 8,
      role: 'rescuer',
      stationId: 'station_hiepphuoc',
      stationName: 'Trạm Ứng Phó Sự Cố KCN Hiệp Phước',
      vehiclePlate: '51B-888.12',
      status: 'completed',
      registeredAt: '2026-10-10 09:30',
      availableSlots: 1,
      maxSlots: 3,
    },
    {
      id: 'shift-mock-3',
      date: formatDayOffset(2), // Wednesday
      shiftType: 'night',
      title: 'Ca Đêm Trực Chiến Hóa Chất KCN Vĩnh Lộc',
      startTime: '22:00',
      endTime: '06:00',
      hours: 8,
      role: 'driver',
      stationId: 'station_vinhloc',
      stationName: 'Trạm Cứu Hộ & CNCH KCN Vĩnh Lộc',
      vehiclePlate: '51A-777.34',
      status: 'approved',
      registeredAt: '2026-10-12 14:15',
      availableSlots: 1,
      maxSlots: 3,
      stipendBonus: '+30% Phụ cấp độc hại & trực đêm KCN',
    },
    {
      id: 'shift-mock-4',
      date: formatDayOffset(3), // Thursday
      shiftType: 'morning',
      title: 'Ca Sáng Kíp Xe Cứu Hộ KCN Tân Bình',
      startTime: '06:00',
      endTime: '14:00',
      hours: 8,
      role: 'driver',
      stationId: 'station_tanbinh',
      stationName: 'Trạm Cứu Hộ & PCCC KCN Tân Bình',
      vehiclePlate: '51A-999.99',
      status: 'approved',
      registeredAt: '2026-10-12 14:15',
      availableSlots: 2,
      maxSlots: 3,
    },
    {
      id: 'shift-mock-5',
      date: formatDayOffset(4), // Friday
      shiftType: 'afternoon',
      title: 'Ca Chiều Trực Vận Hành Kho Bãi KCN Tân Tạo',
      startTime: '14:00',
      endTime: '22:00',
      hours: 8,
      role: 'paramedic',
      stationId: 'station_tantao',
      stationName: 'Trạm Phản Ứng Nhanh KCN Tân Tạo',
      vehiclePlate: '51C-555.88',
      status: 'approved',
      registeredAt: '2026-10-13 10:00',
      availableSlots: 0,
      maxSlots: 3,
    },
    {
      id: 'shift-mock-6',
      date: formatDayOffset(5), // Saturday
      shiftType: 'night',
      title: 'Ca Đêm Chi Viện Phân Xưởng KCN Lê Minh Xuân',
      startTime: '22:00',
      endTime: '06:00',
      hours: 8,
      role: 'driver',
      stationId: 'station_leminhxuan',
      stationName: 'Trạm Xử Lý Sự Cố KCN Lê Minh Xuân',
      vehiclePlate: '51B-666.22',
      status: 'pending',
      notes: 'Đăng ký kíp trực tăng cường xử lý rò rỉ hóa chất cuối tuần',
      registeredAt: '2026-10-14 16:40',
      availableSlots: 2,
      maxSlots: 4,
      stipendBonus: '+30% Phụ cấp độc hại & trực đêm KCN',
    },
  ];
};

class ScheduleService {
  private inMemoryCache: WorkShift[] | null = null;

  /**
   * Get all registered shifts from storage or seed defaults
   */
  async getAllShifts(): Promise<WorkShift[]> {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      const stored = await storage.getItem<WorkShift[]>(SCHEDULE_STORAGE_KEY);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        this.inMemoryCache = stored;
        return stored;
      }
    } catch {
      // ignore storage error
    }

    // Seed defaults
    const initialShifts = getInitialMockShifts();
    this.inMemoryCache = initialShifts;
    await storage.setItem(SCHEDULE_STORAGE_KEY, initialShifts);
    return initialShifts;
  }

  /**
   * Get shifts for a specific date (YYYY-MM-DD)
   */
  async getShiftsByDate(dateStr: string): Promise<WorkShift[]> {
    const all = await this.getAllShifts();
    return all.filter((s) => s.date === dateStr && s.status !== 'cancelled');
  }

  /**
   * Register a new shift
   */
  async registerShift(payload: RegisterShiftPayload): Promise<{ success: boolean; shift?: WorkShift; message?: string }> {
    const all = await this.getAllShifts();

    // Check if user already registered for this shift type on the same date
    const existingSameShift = all.find(
      (s) => s.date === payload.date && s.shiftType === payload.shiftType && s.status !== 'cancelled'
    );

    if (existingSameShift) {
      return {
        success: false,
        message: 'Bạn đã đăng ký ca này trong ngày rồi. Vui lòng chọn ca hoặc ngày khác.',
      };
    }

    const shiftDef = SHIFT_DEFINITIONS.find((d) => d.type === payload.shiftType) || SHIFT_DEFINITIONS[0];
    const station = RESCUE_STATIONS.find((st) => st.id === payload.stationId) || RESCUE_STATIONS[0];

    const newShift: WorkShift = {
      id: `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: payload.date,
      shiftType: payload.shiftType,
      title: shiftDef.nameVi,
      startTime: shiftDef.startTime,
      endTime: shiftDef.endTime,
      hours: shiftDef.hours,
      role: payload.role,
      stationId: station.id,
      stationName: station.nameVi,
      vehiclePlate: '51A-999.99',
      status: 'pending', // Awaiting dispatch approval
      notes: payload.notes?.trim() || undefined,
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      availableSlots: 2,
      maxSlots: 3,
      stipendBonus: shiftDef.stipendBonusVi,
      isOvertime: payload.isOnCallStandby || payload.shiftType === 'night' || payload.shiftType === 'full24',
    };

    const updated = [newShift, ...all];
    this.inMemoryCache = updated;
    await storage.setItem(SCHEDULE_STORAGE_KEY, updated);

    return {
      success: true,
      shift: newShift,
    };
  }

  /**
   * Batch register multiple shifts across multiple dates in KCN
   */
  async batchRegisterShifts(payload: BatchRegisterShiftsPayload): Promise<BatchRegisterResult> {
    const all = await this.getAllShifts();
    const station = RESCUE_STATIONS.find((st) => st.id === payload.stationId) || RESCUE_STATIONS[0];
    const newShifts: WorkShift[] = [];
    let skippedCount = 0;

    for (const date of payload.dates) {
      for (const shiftType of payload.shiftTypes) {
        // Check if already registered on this date & shiftType
        const alreadyExists = all.some(
          (s) => s.date === date && s.shiftType === shiftType && s.status !== 'cancelled'
        );

        if (alreadyExists) {
          skippedCount += 1;
          continue;
        }

        const shiftDef = SHIFT_DEFINITIONS.find((d) => d.type === shiftType) || SHIFT_DEFINITIONS[0];

        const newShift: WorkShift = {
          id: `shift-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          date,
          shiftType,
          title: shiftDef.nameVi,
          startTime: shiftDef.startTime,
          endTime: shiftDef.endTime,
          hours: shiftDef.hours,
          role: payload.role,
          stationId: station.id,
          stationName: station.nameVi,
          vehiclePlate: '51A-999.99',
          status: 'pending',
          notes: payload.notes?.trim() || undefined,
          registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          availableSlots: 2,
          maxSlots: 3,
          stipendBonus: shiftDef.stipendBonusVi,
          isOvertime: payload.isOnCallStandby || shiftType === 'night' || shiftType === 'full24',
        };

        newShifts.push(newShift);
      }
    }

    if (newShifts.length > 0) {
      const updated = [...newShifts, ...all];
      this.inMemoryCache = updated;
      await storage.setItem(SCHEDULE_STORAGE_KEY, updated);
    }

    return {
      success: newShifts.length > 0,
      registeredCount: newShifts.length,
      skippedCount,
      createdShifts: newShifts,
      message:
        newShifts.length > 0
          ? `Đã đăng ký thành công ${newShifts.length} lượt ca trực KCN${
              skippedCount > 0 ? ` (Bỏ qua ${skippedCount} ca đã có sẵn)` : ''
            }.`
          : `Không thể đăng ký vì tất cả ${skippedCount} ca đã được đăng ký trước đó.`,
    };
  }

  /**
   * Cancel an existing registered shift
   */
  async cancelShift(shiftId: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    const all = await this.getAllShifts();
    const target = all.find((s) => s.id === shiftId);

    if (!target) {
      return { success: false, message: 'Không tìm thấy ca trực cần hủy.' };
    }

    if (target.status === 'completed') {
      return { success: false, message: 'Ca trực đã hoàn tất, không thể hủy.' };
    }

    const updated = all.map((s) => {
      if (s.id === shiftId) {
        return {
          ...s,
          status: 'cancelled' as const,
          notes: reason ? `${s.notes || ''} [Lý do hủy: ${reason}]`.trim() : s.notes,
        };
      }
      return s;
    });

    this.inMemoryCache = updated;
    await storage.setItem(SCHEDULE_STORAGE_KEY, updated);

    return { success: true };
  }

  /**
   * Request a shift swap with a colleague
   */
  async requestShiftSwap(payload: ShiftSwapPayload): Promise<{ success: boolean; message?: string }> {
    const all = await this.getAllShifts();
    const target = all.find((s) => s.id === payload.shiftId);

    if (!target) {
      return { success: false, message: 'Không tìm thấy ca trực.' };
    }

    const updated = all.map((s) => {
      if (s.id === payload.shiftId) {
        return {
          ...s,
          notes: `${s.notes || ''} [Yêu cầu đổi ca với: ${payload.targetColleagueName} - Lý do: ${payload.reason}]`.trim(),
        };
      }
      return s;
    });

    this.inMemoryCache = updated;
    await storage.setItem(SCHEDULE_STORAGE_KEY, updated);

    return { success: true };
  }

  /**
   * Calculate summary for a given set of days
   */
  calculateWeeklySummary(shifts: WorkShift[], weekDates: string[]): WeeklyScheduleSummary {
    const weekShifts = shifts.filter((s) => weekDates.includes(s.date) && s.status !== 'cancelled');

    let totalHours = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let nightCount = 0;

    weekShifts.forEach((s) => {
      totalHours += s.hours;
      if (s.status === 'approved' || s.status === 'completed') {
        approvedCount += 1;
      } else if (s.status === 'pending') {
        pendingCount += 1;
      }
      if (s.shiftType === 'night' || s.shiftType === 'full24') {
        nightCount += 1;
      }
    });

    const startLabel = weekDates[0] ? weekDates[0].split('-').slice(1).reverse().join('/') : '';
    const endLabel = weekDates[weekDates.length - 1]
      ? weekDates[weekDates.length - 1].split('-').slice(1).reverse().join('/')
      : '';

    return {
      weekRange: `${startLabel} - ${endLabel}`,
      totalRegisteredHours: totalHours,
      targetWeeklyHours: 48,
      approvedShiftsCount: approvedCount,
      pendingShiftsCount: pendingCount,
      nightShiftsCount: nightCount,
    };
  }
}

export const scheduleService = new ScheduleService();
