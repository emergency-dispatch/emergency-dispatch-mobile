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
  callerRole: 'Người đi đường / Nhân chứng báo nạn khẩn cấp',
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
