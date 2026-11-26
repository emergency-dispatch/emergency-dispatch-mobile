import { apiService } from '../api/client';
import { getCurrentLanguage } from '../i18n';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import {
  AudioAttachmentInputDto,
  CitizenIncidentAlertDto,
  CitizenMapIncidentDto,
  CitizenTracking,
  CreateIncidentDto,
  IncidentResponseDto,
  IncidentSupplementDto,
  MyReportDto,
  PaginatedResultDto,
  RescueUnitDto,
  StationDto,
} from '../types/incident';

export interface ServiceAreaDto {
  enabled: boolean;
  rejectOutside?: boolean;
  name: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  boundaryGeoJson?: string | null;
}

type RingCoords = Array<[number, number]>;
type PolygonRings = RingCoords[];

function parseBoundaryPolygons(json?: string | null): PolygonRings[] {
  if (!json?.trim()) return [];
  try {
    const geo = JSON.parse(json) as { type?: string; coordinates?: unknown };
    const isRing = (r: unknown): r is RingCoords =>
      Array.isArray(r) && r.every((p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number');
    const isPoly = (p: unknown): p is PolygonRings => Array.isArray(p) && p.length > 0 && p.every(isRing);
    if (geo?.type === 'Polygon' && isPoly(geo.coordinates)) return [geo.coordinates];
    if (geo?.type === 'MultiPolygon' && Array.isArray(geo.coordinates) && geo.coordinates.every(isPoly)) {
      return geo.coordinates as PolygonRings[];
    }
  } catch {
    // ignore malformed GeoJSON
  }
  return [];
}

function pointInRing(lng: number, lat: number, ring: RingCoords): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygons(lat: number, lng: number, polygons: PolygonRings[]): boolean {
  return polygons.some(([outer, ...holes]) => !!outer && pointInRing(lng, lat, outer) && !holes.some((h) => pointInRing(lng, lat, h)));
}

function distanceToPolygonsKm(lat: number, lng: number, polygons: PolygonRings[]): number {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ky = 110.574;
  let best = Infinity;
  for (const ring of polygons.flat()) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = [(ring[i - 1][0] - lng) * kx, (ring[i - 1][1] - lat) * ky];
      const [bx, by] = [(ring[i][0] - lng) * kx, (ring[i][1] - lat) * ky];
      const [dx, dy] = [bx - ax, by - ay];
      const lenSq = dx * dx + dy * dy;
      const t = lenSq > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq)) : 0;
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }
  return best;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371.0;
  const rad = (deg: number) => (deg * Math.PI) / 180.0;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Bán kính hoạt động thực tế của nền tảng tại Khu Công nghệ cao (SHTP)
const KCN_RADIUS_KM = 4.5;

const DEFAULT_SERVICE_AREA: ServiceAreaDto = {
  enabled: true,
  name: 'Khu Công nghệ cao, TP. Thủ Đức (SHTP)',
  centerLat: 10.8441,
  centerLng: 106.8089,
  radiusKm: KCN_RADIUS_KM,
};

const isEnLang = () => getCurrentLanguage() === 'en';

// Cache service area 60s để tránh gọi lặp khi vừa mở SOS vừa bấm gửi SOS
const SERVICE_AREA_CACHE_TTL_MS = 60_000;
const DEFAULT_REPORT_COOLDOWN_MS = 3 * 60_000;
let cachedServiceArea: ServiceAreaDto | null | undefined;
let cachedServiceAreaAt = 0;
let inFlightServiceArea: Promise<ServiceAreaDto | null> | null = null;
let cachedReportCooldownMs = DEFAULT_REPORT_COOLDOWN_MS;
let cachedReportCooldownAt = 0;
let inFlightReportCooldown: Promise<number> | null = null;

export const incidentService = {
  /**
   * POST /api/incidents — Gửi báo cáo sự cố khẩn cấp SOS
   * Hỗ trợ cả Citizen đã đăng nhập lẫn khách vãng lai.
   * Tự kích hoạt mô hình AI Vision-Language chấm điểm Severity.
   */
  async createIncident(dto: CreateIncidentDto): Promise<IncidentResponseDto> {
    const response = await apiService.post<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.BASE,
      dto
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to submit incident report.' : 'Không thể gửi báo cáo sự cố.'));
    }

    return response.data;
  },

  /**
   * GET /api/incidents/{id} — Xem thông tin chi tiết sự cố theo ID
   */
  async getIncidentById(id: string): Promise<IncidentResponseDto> {
    const response = await apiService.get<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.BY_ID(id)
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to load incident details.' : 'Không thể lấy thông tin sự cố.'));
    }

    return response.data;
  },

  /**
   * GET /api/incidents — Lấy danh sách sự cố có phân trang & bộ lọc
   */
  async getIncidents(params?: {
    pageIndex?: number;
    pageSize?: number;
    status?: string;
    severity?: string;
    searchTerm?: string;
  }): Promise<PaginatedResultDto<IncidentResponseDto>> {
    const response = await apiService.get<BackendApiResponse<PaginatedResultDto<IncidentResponseDto>>>(
      Endpoints.INCIDENTS.BASE,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to load incident list.' : 'Không thể lấy danh sách sự cố.'));
    }

    return response.data;
  },

  /**
   * GET /api/incidents/my-reports — Lịch sử báo cáo sự cố dành riêng cho Citizen (FR-CIT-05)
   */
  async getMyReports(params?: {
    status?: number;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<PaginatedResultDto<MyReportDto>> {
    const response = await apiService.get<BackendApiResponse<PaginatedResultDto<MyReportDto>>>(
      Endpoints.INCIDENTS.MY_REPORTS,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to load report history.' : 'Không thể lấy lịch sử báo cáo.'));
    }

    return response.data;
  },

  /**
   * PUT /api/incidents/{id}/cancel — Hủy sự cố (bấm nhầm / báo sai)
   * Phù hợp với BE hiện hành: [HttpPut("{id}/cancel")] nhận [FromBody] string reason
   */
  async cancelIncident(id: string, reason?: string, guestCancellationToken?: string): Promise<IncidentResponseDto> {
    const reasonText = reason || (isEnLang() ? 'Citizen accidentally pressed SOS button' : 'Người dân bấm nhầm nút SOS');
    const response = await apiService.put<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.CANCEL(id),
      { reason: reasonText, guestCancellationToken: guestCancellationToken || undefined }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to cancel incident.' : 'Không thể hủy sự cố.'));
    }

    return response.data;
  },

  /**
   * PUT /api/incidents/{id}/unlink — Tách báo cáo khỏi sự cố gốc (xác nhận sự cố khác)
   */
  async unlinkIncident(id: string, reason?: string, guestCancellationToken?: string): Promise<IncidentResponseDto> {
    const response = await apiService.put<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.UNLINK(id),
      {
        reason: reason || undefined,
        guestCancellationToken: guestCancellationToken || undefined,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to unlink report.' : 'Không thể tách báo cáo.'));
    }

    return response.data;
  },

  /**
   * POST /api/incidents/{id}/supplements — Bổ sung thông tin (ghi chú / ảnh / audio)
   */
  async addSupplement(
    id: string,
    dto: {
      note?: string;
      mediaUrls?: string[];
      audioAttachments?: AudioAttachmentInputDto[];
      guestCancellationToken?: string;
    }
  ): Promise<IncidentSupplementDto> {
    const response = await apiService.post<BackendApiResponse<IncidentSupplementDto>>(
      Endpoints.INCIDENTS.SUPPLEMENTS(id),
      dto
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'Unable to submit additional details.' : 'Không thể gửi thông tin bổ sung.'));
    }

    return response.data;
  },

  async getAudioPlaybackUrl(incidentId: string, mediaId: string): Promise<{ url: string; expiresAt: string }> {
    const response = await apiService.get<BackendApiResponse<{ url: string; expiresAt: string }>>(
      Endpoints.INCIDENTS.AUDIO_PLAYBACK(incidentId, mediaId)
    );
    if (!response.success || !response.data?.url) {
      throw new Error(response.message || (isEnLang() ? 'Unable to load audio playback URL.' : 'Không thể tải liên kết nghe ghi âm.'));
    }
    return response.data;
  },

  async getSupplementAudioPlaybackUrl(
    incidentId: string,
    supplementId: string,
    mediaId: string
  ): Promise<{ url: string; expiresAt: string }> {
    const response = await apiService.get<BackendApiResponse<{ url: string; expiresAt: string }>>(
      Endpoints.INCIDENTS.SUPPLEMENT_AUDIO_PLAYBACK(incidentId, supplementId, mediaId)
    );
    if (!response.success || !response.data?.url) {
      throw new Error(response.message || (isEnLang() ? 'Unable to load audio playback URL.' : 'Không thể tải liên kết nghe ghi âm.'));
    }
    return response.data;
  },

  /**
   * GET /api/incidents/{id}/supplements — Lấy danh sách thông tin bổ sung (yêu cầu đăng nhập)
   */
  async getSupplements(id: string): Promise<IncidentSupplementDto[]> {
    const response = await apiService.get<BackendApiResponse<IncidentSupplementDto[]>>(
      Endpoints.INCIDENTS.SUPPLEMENTS(id)
    );

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  },

  /**
   * GET /api/dispatch/tracking/incident/{incidentId}
   * Xem lộ trình, khoảng cách & thời gian dự kiến (ETA) của xe cứu hộ đang di chuyển
   */
  async getTracking(incidentId: string): Promise<CitizenTracking> {
    const response = await apiService.get<BackendApiResponse<CitizenTracking>>(
      Endpoints.DISPATCH.TRACKING(incidentId)
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || (isEnLang() ? 'No rescue vehicle dispatch info available for this incident yet.' : 'Chưa có thông tin điều phối xe cho sự cố này.'));
    }

    return response.data;
  },

  /**
   * GET /api/rescue-units — Lấy danh sách toàn bộ xe & phương tiện cứu hộ
   */
  async getRescueUnits(): Promise<RescueUnitDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<RescueUnitDto[]>>(
        Endpoints.RESCUE_UNITS.BASE
      );
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/stations — Lấy danh sách toàn bộ trạm cứu hộ
   */
  async getStations(): Promise<StationDto[]> {
    try {
      const response = await apiService.get<any>(
        Endpoints.STATIONS.BASE
      );
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/settings/service-area — Lấy cấu hình bán kính hoạt động nền tảng (cache 60s + gộp request trùng)
   */
  async getServiceArea(forceRefresh = false): Promise<ServiceAreaDto | null> {
    if (!forceRefresh && cachedServiceArea !== undefined && Date.now() - cachedServiceAreaAt < SERVICE_AREA_CACHE_TTL_MS) {
      return cachedServiceArea;
    }
    if (!forceRefresh && inFlightServiceArea) {
      return inFlightServiceArea;
    }

    inFlightServiceArea = (async () => {
      try {
        const response = await apiService.get<BackendApiResponse<ServiceAreaDto | { values: ServiceAreaDto }>>(
          Endpoints.SETTINGS.SERVICE_AREA
        );
        if (!response.data) return cachedServiceArea ?? null;
        const data = response.data as any;
        const resolved = (data && data.values) ? data.values : data;
        cachedServiceArea = resolved;
        cachedServiceAreaAt = Date.now();
        return resolved;
      } catch {
        return cachedServiceArea ?? null;
      } finally {
        inFlightServiceArea = null;
      }
    })();

    return inFlightServiceArea;
  },

  getCachedReportCooldownMs(): number {
    return cachedReportCooldownMs;
  },

  async getReportCooldownMs(forceRefresh = false): Promise<number> {
    if (!forceRefresh && cachedReportCooldownAt > 0 && Date.now() - cachedReportCooldownAt < SERVICE_AREA_CACHE_TTL_MS) {
      return cachedReportCooldownMs;
    }
    if (!forceRefresh && inFlightReportCooldown) {
      return inFlightReportCooldown;
    }

    inFlightReportCooldown = (async () => {
      try {
        const response = await apiService.get<
          BackendApiResponse<{ values?: { reportCooldownMinutes?: number }; reportCooldownMinutes?: number }>
        >(Endpoints.SETTINGS.CITIZEN_INCIDENT_ALERTS);
        const data = response.data;
        const rawMinutes = data?.values?.reportCooldownMinutes ?? data?.reportCooldownMinutes;
        if (typeof rawMinutes === 'number' && Number.isFinite(rawMinutes)) {
          const clamped = Math.min(60, Math.max(0, Math.round(rawMinutes)));
          cachedReportCooldownMs = clamped * 60_000;
        }
        cachedReportCooldownAt = Date.now();
        return cachedReportCooldownMs;
      } catch {
        return cachedReportCooldownMs;
      } finally {
        inFlightReportCooldown = null;
      }
    })();

    return inFlightReportCooldown;
  },

  /**
   * Kiểm tra toạ độ có nằm ngoài bán kính hoạt động của nền tảng hay không.
   */
  async checkOutsideServiceArea(lat: number, lng: number): Promise<{
    isOutside: boolean;
    distanceOutsideKm: number;
    area: ServiceAreaDto | null;
  }> {
    try {
      const area = await this.getServiceArea();
      const rawLat = area?.centerLat ?? (area as any)?.CenterLat;
      const rawLng = area?.centerLng ?? (area as any)?.CenterLng;
      const rawRad = area?.radiusKm ?? (area as any)?.RadiusKm;
      const rawEnabled = area?.enabled ?? (area as any)?.Enabled ?? true;
      const rawRejectOutside = area?.rejectOutside ?? (area as any)?.RejectOutside ?? true;
      const rawBoundaryGeoJson = area?.boundaryGeoJson ?? (area as any)?.BoundaryGeoJson ?? null;

      const centerLat = typeof rawLat === 'number' && rawLat !== 0 ? rawLat : DEFAULT_SERVICE_AREA.centerLat;
      const centerLng = typeof rawLng === 'number' && rawLng !== 0 ? rawLng : DEFAULT_SERVICE_AREA.centerLng;
      const radiusKm = typeof rawRad === 'number' && rawRad > 0 ? rawRad : DEFAULT_SERVICE_AREA.radiusKm;
      const areaName = area?.name || DEFAULT_SERVICE_AREA.name;

      const effectiveArea: ServiceAreaDto = {
        enabled: rawEnabled,
        rejectOutside: rawRejectOutside,
        name: areaName,
        centerLat,
        centerLng,
        radiusKm,
        boundaryGeoJson: rawBoundaryGeoJson,
      };

      if (!rawEnabled || !rawRejectOutside) {
        return { isOutside: false, distanceOutsideKm: 0, area: effectiveArea };
      }

      const polygons = parseBoundaryPolygons(rawBoundaryGeoJson);
      const outside =
        polygons.length > 0
          ? pointInPolygons(lat, lng, polygons)
            ? 0
            : distanceToPolygonsKm(lat, lng, polygons)
          : haversineDistanceKm(lat, lng, centerLat, centerLng) - radiusKm;
      if (outside > 0) {
        return {
          isOutside: true,
          distanceOutsideKm: Math.max(0.1, Math.round(outside * 10) / 10),
          area: effectiveArea,
        };
      }
      return { isOutside: false, distanceOutsideKm: 0, area: effectiveArea };
    } catch {
      const dist = haversineDistanceKm(lat, lng, DEFAULT_SERVICE_AREA.centerLat, DEFAULT_SERVICE_AREA.centerLng);
      const outside = dist - DEFAULT_SERVICE_AREA.radiusKm;
      return {
        isOutside: outside > 0,
        distanceOutsideKm: outside > 0 ? Math.round(outside * 10) / 10 : 0,
        area: DEFAULT_SERVICE_AREA,
      };
    }
  },

  async getCitizenMapIncidents(pageIndex = 1, pageSize = 200): Promise<CitizenMapIncidentDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<PaginatedResultDto<CitizenMapIncidentDto>>>(
        Endpoints.CITIZEN_MAP.INCIDENTS,
        { params: { pageIndex, pageSize } }
      );
      return response.success && response.data?.items ? response.data.items : [];
    } catch {
      return [];
    }
  },

  async getCitizenMapIncidentByAlert(publicAlertId: string): Promise<CitizenMapIncidentDto | null> {
    try {
      const response = await apiService.get<BackendApiResponse<CitizenMapIncidentDto>>(
        Endpoints.CITIZEN_MAP.BY_ALERT(publicAlertId)
      );
      return response.success && response.data ? response.data : null;
    } catch {
      return null;
    }
  },

  async getCitizenIncidentAlerts(pageIndex = 1, pageSize = 10): Promise<CitizenIncidentAlertDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<PaginatedResultDto<CitizenIncidentAlertDto>>>(
        Endpoints.CITIZEN_INCIDENT_ALERTS.BASE,
        { params: { pageIndex, pageSize } }
      );
      return response.success && response.data?.items ? response.data.items : [];
    } catch {
      return [];
    }
  },
};

