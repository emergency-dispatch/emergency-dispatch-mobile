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
  Level4 = 'Level4',
  Level5 = 'Level5',
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
