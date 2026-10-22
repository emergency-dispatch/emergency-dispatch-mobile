/**
 * Incident Enums & DTOs matching EmergencyDispatch.API
 */

export enum IncidentStatus {
  Pending = 'Pending',
  AiProcessing = 'AiProcessing',
  AiProcessed = 'AiProcessed',
  Verified = 'Verified',
  Dispatched = 'Dispatched',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Escalated = 'Escalated',
}

export enum SeverityLevel {
  Unclassified = 'Unclassified',
  Level1 = 'Level1',
  Level2 = 'Level2',
  Level3 = 'Level3',
}

export interface IncidentMediaDto {
  id: string;
  mediaUrl: string;
  mediaType: string;
}

export interface AiClassificationResultDto {
  hazardTags: string[];
  severityScore: number;
  summary: string;
  confidenceScore: number;
  modelName: string;
  isSuccess: boolean;
  processingDurationMs: number;
}

export interface CreateIncidentDto {
  title?: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  reporterName?: string;
  reporterPhone?: string;
  mediaUrls?: string[];
}

export interface IncidentResponseDto {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  status: IncidentStatus;
  severity: SeverityLevel;
  reportedByUserId?: string | null;
  reporterName?: string | null;
  reporterPhone?: string | null;
  verifiedByUserId?: string | null;
  verifiedByUserName?: string | null;
  verifiedAt?: string | null;
  operatorNotes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  mediaItems: IncidentMediaDto[];
  aiClassification?: AiClassificationResultDto | null;
}

export interface PaginatedResultDto<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface MyReportUnitDto {
  plateNumber: string;
  unitType: string;
  stationName?: string;
  status: string;
}

export interface MyReportDto {
  id: string;
  title: string;
  description: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  status: IncidentStatus;
  severity: SeverityLevel;
  resolutionSummary?: string | null;
  cancellationReason?: string | null;
  mediaUrls: string[];
  reportedAt: string;
  verifiedAt?: string | null;
  dispatchedAt?: string | null;
  onSceneAt?: string | null;
  completedAt?: string | null;
  dispatchedUnits?: MyReportUnitDto[];
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface CitizenTracking {
  incidentId: string;
  incidentTitle: string;
  incidentAddress: string;
  incidentLat: number;
  incidentLng: number;
  incidentStatus: string;
  incidentSeverity: 'Unclassified' | 'Level1' | 'Level2' | 'Level3';
  rescueUnitId?: string;
  plateNumber?: string;
  unitTypeName?: string;
  stationName?: string;
  stationPhoneNumber?: string;
  vehicleLat?: number;
  vehicleLng?: number;
  lastLocationUpdateAt?: string;
  routeTrajectory: RoutePoint[];
  distanceKm: number;
  estimatedArrivalMinutes: number;
  dispatchStatus: 'PendingDispatch' | 'Dispatched' | 'Accepted' | 'EnRoute' | 'OnScene' | 'Completed' | 'Cancelled';
  dispatchedAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface RescueUnitDto {
  id: string;
  plateNumber: string;
  unitType: string;
  unitTypeName?: string;
  status: 'Available' | 'Dispatched' | 'OnScene' | 'Returning' | 'CoolDown' | 'Maintenance' | 'OutOfService' | string;
  statusName?: string;
  currentLat: number;
  currentLng: number;
  lastLocationUpdateAt?: string;
  stationId: string;
  stationName: string;
}

export interface StationDto {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  isActive: boolean;
  coverageRadiusKm?: number;
  activeUnitsCount?: number;
  totalUnitsCount?: number;
  staffCount?: number;
}
