export type EmergencySeverity = 'code_red' | 'code_orange' | 'code_yellow';

export type MissionStage = 'accepted' | 'en_route' | 'on_scene' | 'completed';

export interface EmergencyIncident {
  id: string;
  code: string;
  severity: EmergencySeverity;
  severityLabel: string;
  title: string;
  category: string;
  address: string;
  distanceKm: number;
  etaMinutes: number;
  assignedUnit: string;
  vehiclePlate: string;
  patientCount: number;
  patientSummary: string;
  triageLevel: 'T1' | 'T2' | 'T3' | 'T4';
  callerName: string;
  callerRole: string;
  callerPhone: string;
  emergencyNotes: string;
  requiredEquipment: string[];
  recommendedHospital: string;
  hospitalDistance: string;
  timeoutSeconds: number;
  mediaUrls?: string[];
  operatorNotes?: string;
  isPhoneRevealed?: boolean;
  assignmentId?: string;
  backendStatus?: BackendDispatchStatus;
  cooperatingUnits?: DispatchAssignmentResponseDto[];
  originCoords: {
    latitude: number;
    longitude: number;
    label: string;
  };
  targetCoords: {
    latitude: number;
    longitude: number;
    label: string;
  };
  createdAt: string;
}

export interface MissionStepInfo {
  key: MissionStage;
  label: string;
  sublabel: string;
  description: string;
}

export const MISSION_STEPS: MissionStepInfo[] = [
  {
    key: 'accepted',
    label: 'Accepted',
    sublabel: 'Đã nhận lệnh',
    description: 'Kíp trực đã nhận lệnh và chuẩn bị xe',
  },
  {
    key: 'en_route',
    label: 'En route',
    sublabel: 'Đang di chuyển',
    description: 'Xe cứu thương đang trên đường tới hiện trường',
  },
  {
    key: 'on_scene',
    label: 'On scene',
    sublabel: 'Tại hiện trường',
    description: 'Đã tiếp cận hiện trường và cấp cứu nạn nhân',
  },
  {
    key: 'completed',
    label: 'Completed',
    sublabel: 'Hoàn thành',
    description: 'Đã bàn giao bệnh nhân cho bệnh viện an toàn',
  },
];

export const MOCK_EMERGENCY_INCIDENT: EmergencyIncident = {
  id: 'inc-240908',
  code: '#EM-240908',
  severity: 'code_red',
  severityLabel: 'MỨC ĐỘ: CODE RED - KHẨN CẤP',
  title: 'TAI NẠN GIAO THÔNG LIÊN HOÀN (3 NẠN NHÂN)',
  category: 'Va chạm xe tải & 2 xe máy • Chấn thương nặng',
  address: '120 Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
  distanceKm: 2.4,
  etaMinutes: 6,
  assignedUnit: 'Xe Cứu Thương ICU 01',
  vehiclePlate: '51A-999.99',
  patientCount: 3,
  patientSummary: '3 Nạn nhân • 1 Hôn mê • 2 Đa chấn thương gãy cẳng chân',
  triageLevel: 'T1',
  callerName: 'Anh Hoàng Nam',
  callerRole: 'Người đi đường / Người báo nạn khẩn cấp',
  callerPhone: '0903123456',
  emergencyNotes:
    'Có 2 người bị kẹt cabin, yêu cầu mang kìm cắt thủy lực và bình oxy dự phòng. Chú ý nguy cơ rò rỉ nhiên liệu từ xe tải.',
  requiredEquipment: [
    'Kìm cắt thủy lực',
    '2 Bình Oxy 10L',
    'Cáng cứu thương cứng',
    'Bộ nẹp cổ & nẹp chi cố định',
    'Máy sốc tim AED & Monitor ICU',
  ],
  recommendedHospital: 'Bệnh viện Cấp Cứu Trưng Vương',
  hospitalDistance: '1.8 km (khoảng 4 phút di chuyển)',
  timeoutSeconds: 30,
  originCoords: {
    latitude: 10.7712,
    longitude: 106.6578,
    label: 'Trạm Cứu Hộ Q.10 (BV Trưng Vương)',
  },
  targetCoords: {
    latitude: 10.7785,
    longitude: 106.6892,
    label: '120 Võ Văn Tần, P.6, Q.3',
  },
  createdAt: '11:42:15',
};

// ==========================================
// BACKEND CONTRACT DTOS & ENUMS (21/10/2026)
// ==========================================

export type BackendDispatchStatus =
  | 'Dispatched'
  | 'Accepted'
  | 'EnRoute'
  | 'OnScene'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type RejectionReason =
  | 'VehicleBreakdown'
  | 'AlreadyOnMission'
  | 'TooFar'
  | 'MedicalLeave'
  | 'NoResponse'
  | 'Other';

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  VehicleBreakdown: 'Xe hỏng kỹ thuật / bảo trì',
  AlreadyOnMission: 'Đang bận thực hiện nhiệm vụ khác',
  TooFar: 'Khoảng cách quá xa so với hiện trường',
  MedicalLeave: 'Vấn đề sức khỏe kíp trực',
  NoResponse: 'Không phản hồi / Mất liên lạc',
  Other: 'Lý do khác (cần ghi chú chi tiết)',
};

export interface RejectAssignmentPayload {
  reason: RejectionReason;
  notes?: string;
}

export interface ResolveAssignmentPayload {
  resolutionSummary: string; // bắt buộc >= 10 ký tự
  evidenceMediaUrls: string[]; // bắt buộc >= 1 ảnh
  victimsAssistedCount: number; // bắt buộc >= 0
  equipmentUsed?: string[];
  handoverEntity?: string;
  handoverContactName?: string;
  handoverContactPhone?: string;
  handoverNotes?: string;
  signatureSvg?: string;
}

export interface CompletionReportDto {
  actionsSummary?: string;
  victimsAssistedCount: number;
  equipmentUsed: string[];
  evidenceMediaUrls: string[];
  handoverEntity?: string;
  handoverContactName?: string;
  handoverContactPhone?: string;
  handoverNotes?: string;
  signatureSvg?: string;
  submittedAt?: string;
}

export interface DispatchAssignmentResponseDto {
  id: string;
  incidentId: string;
  rescueUnitId: string;
  status: BackendDispatchStatus;
  dispatchedAt: string;
  acceptedAt?: string | null;
  enRouteAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  rejectionNotes?: string | null;
  distanceKm?: number;
  estimatedArrivalMinutes?: number;
  completionReport?: CompletionReportDto | null;
  incidentTitle?: string;
  incidentAddress?: string;
  incidentLat?: number;
  incidentLng?: number;
  incidentLatitude?: number;
  incidentLongitude?: number;
  incidentSeverity?: string;
  rescueUnitPlate?: string;
  rescueUnitType?: string;
  stationName?: string;
  rescueUnit?: {
    id: string;
    plateNumber?: string;
    unitType?: string;
    status?: string;
    currentLat?: number;
    currentLng?: number;
    stationId?: string;
    stationName?: string;
  };
}

export const mapBackendStatusToStage = (status?: string): MissionStage => {
  switch (status) {
    case 'EnRoute':
      return 'en_route';
    case 'OnScene':
      return 'on_scene';
    case 'Completed':
      return 'completed';
    case 'Accepted':
    case 'Dispatched':
    default:
      return 'accepted';
  }
};

export const mapStageToBackendStatus = (
  stage: MissionStage
): 'Accepted' | 'EnRoute' | 'OnScene' => {
  switch (stage) {
    case 'en_route':
      return 'EnRoute';
    case 'on_scene':
      return 'OnScene';
    case 'accepted':
    default:
      return 'Accepted';
  }
};

const isCoordInVn = (lat?: number, lng?: number): boolean => {
  if (lat == null || lng == null) return false;
  return lat >= 8.0 && lat <= 24.5 && lng >= 102.0 && lng <= 111.0;
};

export const mapAssignmentToIncident = (dto: DispatchAssignmentResponseDto): EmergencyIncident => {
  const stationLat = 10.8415;
  const stationLng = 106.8098;
  const vehicleLat =
    dto.rescueUnit?.currentLat && isCoordInVn(dto.rescueUnit.currentLat, dto.rescueUnit.currentLng)
      ? dto.rescueUnit.currentLat
      : stationLat;
  const vehicleLng =
    dto.rescueUnit?.currentLng && isCoordInVn(dto.rescueUnit.currentLat, dto.rescueUnit.currentLng)
      ? dto.rescueUnit.currentLng
      : stationLng;

  const targetLat = dto.incidentLat ?? dto.incidentLatitude ?? 10.8450;
  const targetLng = dto.incidentLng ?? dto.incidentLongitude ?? 106.8140;

  return {
    id: dto.incidentId || dto.id,
    assignmentId: dto.id,
    backendStatus: dto.status,
    code: `#${(dto.incidentId || dto.id).slice(0, 8).toUpperCase()}`,
    severity:
      dto.incidentSeverity === 'Level3'
        ? 'code_red'
        : dto.incidentSeverity === 'Level2'
        ? 'code_orange'
        : 'code_yellow',
    severityLabel: `MỨC ĐỘ: ${dto.incidentSeverity || 'Level3'}`,
    title: dto.incidentTitle || 'SỰ CỐ KHẨN CẤP ĐƯỢC ĐIỀU PHỐI',
    category: dto.rescueUnitType || 'Cứu hộ khẩn cấp',
    address: dto.incidentAddress || 'Hiện trường sự cố',
    distanceKm: dto.distanceKm ?? 0,
    etaMinutes: dto.estimatedArrivalMinutes ?? 0,
    assignedUnit: dto.rescueUnitPlate || 'Đội Xe Cứu Hộ',
    vehiclePlate: dto.rescueUnitPlate || '',
    patientCount: 1,
    patientSummary: dto.notes || 'Tiếp nhận thông tin từ trung tâm điều phối',
    triageLevel: dto.incidentSeverity === 'Level3' ? 'T1' : 'T2',
    callerName: 'Tổng Đài Điều Phối',
    callerRole: 'Trung tâm chỉ huy CAD',
    callerPhone: '',
    emergencyNotes: dto.notes || '',
    requiredEquipment: [],
    recommendedHospital: '',
    hospitalDistance: '',
    timeoutSeconds: 30,
    originCoords: {
      latitude: vehicleLat,
      longitude: vehicleLng,
      label: dto.rescueUnit?.stationName || dto.stationName || 'FPT Station',
    },
    targetCoords: {
      latitude: targetLat,
      longitude: targetLng,
      label: dto.incidentAddress || 'Hiện trường',
    },
    createdAt: dto.dispatchedAt || new Date().toISOString(),
  };
};

export interface StationTeamMemberDto {
  staffId: string;
  fullName: string;
  phoneNumber: string;
  crewRole: 'Commander' | 'Driver' | 'Firefighter' | 'Rescuer' | 'Medic' | string;
}

export interface MyTeamDto {
  stationId: string;
  stationName: string;
  myTeamId?: string | null;
  myTeamName?: string | null;
  myCrewRole?: string | null;
  myTeamRescueUnitId?: string | null;
  myTeamRescueUnitPlate?: string | null;
  myTeamMembers: StationTeamMemberDto[];
  stationVehicles?: Array<{ id: string; plateNumber: string; unitType: string; status: string }>;
  teamMembers?: StationTeamMemberDto[];
  stationOperator?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
}

export interface RevealPhoneDto {
  incidentId: string;
  phoneNumber: string;
}

export type RescueUnitStatus =
  | 'Available'
  | 'Dispatched'
  | 'OnScene'
  | 'Maintenance'
  | 'CoolDown'
  | 'OutOfService'
  | string;

export interface RescueUnitDetailDto {
  id: string;
  plateNumber: string;
  unitType: string;
  status: RescueUnitStatus;
  stationId: string;
  stationName?: string;
  currentLat?: number;
  currentLng?: number;
  fuelPercentage?: number;
  equipmentReady?: boolean;
}

export interface StationStaffMemberDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  crewRole?: string | null;
  teamName?: string | null;
}

export interface StationDetailDto {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string | null;
  latitude: number;
  longitude: number;
  headOperatorId?: string | null;
  headOperatorName?: string | null;
  headOperatorPhone?: string | null;
  activeUnitsCount?: number;
  staffCount?: number;
}

export interface AppNotificationDto {
  id: string;
  type: 'NewIncident' | 'JobAssigned' | 'StatusUpdate' | 'Escalation' | 'System' | string;
  title: string;
  message: string;
  incidentId?: string | null;
  dataJson?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}
