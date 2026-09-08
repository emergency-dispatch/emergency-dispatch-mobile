export interface MissionItem {
  id: string;
  code: string;
  type: 'traffic_accident' | 'cardiac_arrest' | 'fire_rescue' | 'stroke' | 'respiratory' | 'other';
  title: string;
  severity: 'critical' | 'urgent' | 'moderate';
  address: string;
  completedAt: string;
  durationMinutes: number;
  distanceKm: number;
  etaMinutes: number;
  status: 'completed' | 'in_progress' | 'cancelled';
  patientCount?: number;
  destinationHospital?: string;
  notes?: string;
}

export interface EquipmentCategory {
  id: string;
  title: string;
  items: EquipmentItem[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  specification: string;
  status: 'checked' | 'warning' | 'missing';
  quantity: string;
  expiryDate?: string;
}

export interface DispatchNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'weather' | 'traffic';
  timestamp: string;
  isRead: boolean;
}
