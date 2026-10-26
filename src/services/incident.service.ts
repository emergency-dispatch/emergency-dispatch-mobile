import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import {
  CitizenTracking,
  CreateIncidentDto,
  IncidentResponseDto,
  MyReportDto,
  PaginatedResultDto,
  RescueUnitDto,
  StationDto,
} from '../types/incident';

export interface ServiceAreaDto {
  enabled: boolean;
  name: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
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
      throw new Error(response.message || 'Không thể gửi báo cáo sự cố.');
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
      throw new Error(response.message || 'Không thể lấy thông tin sự cố.');
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
      throw new Error(response.message || 'Không thể lấy danh sách sự cố.');
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
      throw new Error(response.message || 'Không thể lấy lịch sử báo cáo.');
    }

    return response.data;
  },

  /**
   * PUT /api/incidents/{id}/cancel — Hủy sự cố (bấm nhầm / báo sai)
   * Phù hợp với BE hiện hành: [HttpPut("{id}/cancel")] nhận [FromBody] string reason
   */
  async cancelIncident(id: string, reason?: string): Promise<IncidentResponseDto> {
    const reasonText = reason || 'Người dân bấm nhầm nút SOS';
    const response = await apiService.put<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.CANCEL(id),
      { reason: reasonText }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể hủy sự cố.');
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
      throw new Error(response.message || 'Chưa có thông tin điều phối xe cho sự cố này.');
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
   * GET /api/settings/service-area — Lấy cấu hình bán kính hoạt động nền tảng
   */
  async getServiceArea(): Promise<ServiceAreaDto | null> {
    try {
      const response = await apiService.get<BackendApiResponse<ServiceAreaDto | { values: ServiceAreaDto }>>(
        Endpoints.SETTINGS.SERVICE_AREA
      );
      if (!response.data) return null;
      const data = response.data as any;
      return (data && data.values) ? data.values : data;
    } catch {
      return null;
    }
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

      const centerLat = typeof rawLat === 'number' && rawLat !== 0 ? rawLat : DEFAULT_SERVICE_AREA.centerLat;
      const centerLng = typeof rawLng === 'number' && rawLng !== 0 ? rawLng : DEFAULT_SERVICE_AREA.centerLng;
      // Bán kính hoạt động thực tế chỉ trong phạm vi KCN (tối đa 4.5 km)
      const radiusKm = KCN_RADIUS_KM;
      const areaName = area?.name || DEFAULT_SERVICE_AREA.name;

      const effectiveArea: ServiceAreaDto = {
        enabled: true,
        name: areaName,
        centerLat,
        centerLng,
        radiusKm,
      };

      const dist = haversineDistanceKm(lat, lng, centerLat, centerLng);
      const outside = dist - radiusKm;
      if (outside > 0) {
        return {
          isOutside: true,
          distanceOutsideKm: Math.round(outside * 10) / 10,
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
};

