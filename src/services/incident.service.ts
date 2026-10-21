import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import {
  CitizenTracking,
  CreateIncidentDto,
  IncidentResponseDto,
  PaginatedResultDto,
} from '../types/incident';

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
};
