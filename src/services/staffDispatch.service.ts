import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import {
  DispatchAssignmentResponseDto,
  RejectAssignmentPayload,
  ResolveAssignmentPayload,
  MyTeamDto,
  AppNotificationDto,
  BackendDispatchStatus,
  RevealPhoneDto,
  RescueUnitStatus,
  RescueUnitDetailDto,
  StationStaffMemberDto,
  StationDetailDto,
} from '../types/dispatch';
import { CitizenTracking, IncidentResponseDto } from '../types/incident';

export const staffDispatchService = {
  /**
   * GET /api/dispatch/my-assignments
   * Lấy toàn bộ nhiệm vụ của các xe thuộc trạm của nhân viên (mới nhất trước)
   */
  async getMyAssignments(): Promise<DispatchAssignmentResponseDto[]> {
    const response = await apiService.get<BackendApiResponse<DispatchAssignmentResponseDto[]>>(
      Endpoints.DISPATCH.MY_ASSIGNMENTS
    );
    if (!response.success || !response.data) {
      return [];
    }
    return response.data;
  },

  /**
   * GET /api/dispatch/assignments/{id}
   * Xem chi tiết một lượt phân công
   */
  async getAssignmentById(id: string): Promise<DispatchAssignmentResponseDto> {
    const response = await apiService.get<BackendApiResponse<DispatchAssignmentResponseDto>>(
      Endpoints.DISPATCH.ASSIGNMENT_BY_ID(id)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin phân công.');
    }
    return response.data;
  },

  /**
   * PUT /api/dispatch/assignments/{id}/status
   * Cập nhật trạng thái nhiệm vụ: Accepted -> EnRoute -> OnScene
   */
  async updateStatus(
    id: string,
    status: 'Accepted' | 'EnRoute' | 'OnScene',
    notes?: string
  ): Promise<DispatchAssignmentResponseDto> {
    const response = await apiService.put<BackendApiResponse<DispatchAssignmentResponseDto>>(
      Endpoints.DISPATCH.ASSIGNMENT_STATUS(id),
      { status, notes }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể cập nhật trạng thái nhiệm vụ.');
    }
    return response.data;
  },

  /**
   * POST /api/dispatch/assignments/{id}/reject
   * Từ chối lệnh điều động (kèm reason enum & notes)
   */
  async rejectAssignment(
    id: string,
    payload: RejectAssignmentPayload
  ): Promise<DispatchAssignmentResponseDto> {
    const response = await apiService.post<BackendApiResponse<DispatchAssignmentResponseDto>>(
      Endpoints.DISPATCH.ASSIGNMENT_REJECT(id),
      payload
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể từ chối nhiệm vụ.');
    }
    return response.data;
  },

  /**
   * POST /api/dispatch/assignments/{id}/resolve
   * Nghiệm thu & đóng ca: bắt buộc có ảnh hiện trường và số nạn nhân
   */
  async resolveAssignment(
    id: string,
    payload: ResolveAssignmentPayload
  ): Promise<DispatchAssignmentResponseDto> {
    const response = await apiService.post<BackendApiResponse<DispatchAssignmentResponseDto>>(
      Endpoints.DISPATCH.ASSIGNMENT_RESOLVE(id),
      payload
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể nghiệm thu đóng nhiệm vụ.');
    }
    return response.data;
  },

  /**
   * GET /api/users/my-team
   * Lấy thông tin tổ trực, xe phân công, kíp trực và trạm
   */
  async getMyTeam(): Promise<MyTeamDto | null> {
    try {
      const response = await apiService.get<BackendApiResponse<MyTeamDto>>(
        Endpoints.USER.MY_TEAM
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * PUT /api/rescue-units/{id}/location
   * Gửi tọa độ GPS xe cứu hộ lên máy chủ
   */
  async updateVehicleLocation(
    rescueUnitId: string,
    latitude: number,
    longitude: number,
    headingDegrees?: number,
    speedKmh?: number
  ): Promise<void> {
    try {
      await apiService.put(Endpoints.RESCUE_UNITS.UPDATE_LOCATION(rescueUnitId), {
        latitude,
        longitude,
        headingDegrees: headingDegrees ?? 0,
        speedKmh: speedKmh ?? 0,
      });
    } catch {
      // ignore telemetry failure
    }
  },

  /**
   * GET /api/notifications
   * Lấy danh sách thông báo điều phối của nhân viên
   */
  async getNotifications(
    unreadOnly = false,
    pageIndex = 1,
    pageSize = 20
  ): Promise<AppNotificationDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<AppNotificationDto[]>>(
        Endpoints.NOTIFICATIONS.BASE,
        {
          params: { unreadOnly, pageIndex, pageSize },
        }
      );
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<BackendApiResponse<number>>(
        Endpoints.NOTIFICATIONS.UNREAD_COUNT
      );
      return response.data ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * PUT /api/notifications/{id}/read
   */
  async markNotificationRead(id: string): Promise<void> {
    try {
      await apiService.put(Endpoints.NOTIFICATIONS.READ(id), {});
    } catch {
      // ignore
    }
  },

  /**
   * PUT /api/notifications/read-all
   */
  async markAllNotificationsRead(): Promise<void> {
    try {
      await apiService.put(Endpoints.NOTIFICATIONS.READ_ALL, {});
    } catch {
      // ignore
    }
  },

  /**
   * POST /api/incidents/{id}/reveal-phone
   * Mở khóa số điện thoại người báo tin (Ghi nhận Audit Trail)
   */
  async revealReporterPhone(incidentId: string): Promise<string> {
    const response = await apiService.post<BackendApiResponse<RevealPhoneDto>>(
      Endpoints.INCIDENTS.REVEAL_PHONE(incidentId),
      {}
    );
    if (!response.success || !response.data?.phoneNumber) {
      throw new Error(response.message || 'Không thể giải mã số điện thoại người báo tin.');
    }
    return response.data.phoneNumber;
  },

  /**
   * GET /api/dispatch/tracking/incident/{incidentId}
   * Lộ trình OSRM đường bộ, ETA và vị trí xe thực tế cho kíp tác chiến
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
   * GET /api/dispatch/assignments/incident/{incidentId}
   * Danh sách các xe / kíp cứu hộ khác cùng phối hợp tại hiện trường
   */
  async getAssignmentsByIncident(incidentId: string): Promise<DispatchAssignmentResponseDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<DispatchAssignmentResponseDto[]>>(
        Endpoints.DISPATCH.ASSIGNMENTS_BY_INCIDENT(incidentId)
      );
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/incidents/{id}
   * Lấy chi tiết hồ sơ sự cố: ảnh hiện trường (mediaUrls), ghi chú Operator, AI severity
   */
  async getIncidentDetails(incidentId: string): Promise<IncidentResponseDto> {
    const response = await apiService.get<BackendApiResponse<IncidentResponseDto>>(
      Endpoints.INCIDENTS.BY_ID(incidentId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin chi tiết sự cố.');
    }
    return response.data;
  },

  /**
   * PUT /api/rescue-units/{id}/status
   * Cập nhật trạng thái phương tiện kíp trực (Available, Maintenance, CoolDown, OutOfService)
   */
  async updateRescueUnitStatus(
    rescueUnitId: string,
    status: RescueUnitStatus
  ): Promise<RescueUnitDetailDto> {
    const response = await apiService.put<BackendApiResponse<RescueUnitDetailDto>>(
      Endpoints.RESCUE_UNITS.UPDATE_STATUS(rescueUnitId),
      { status }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể cập nhật trạng thái phương tiện.');
    }
    return response.data;
  },

  /**
   * GET /api/rescue-units/{id}
   * Lấy thông tin chi tiết phương tiện cứu hộ
   */
  async getRescueUnitById(rescueUnitId: string): Promise<RescueUnitDetailDto | null> {
    try {
      const response = await apiService.get<BackendApiResponse<RescueUnitDetailDto>>(
        Endpoints.RESCUE_UNITS.BY_ID(rescueUnitId)
      );
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * GET /api/stations/{id}
   * Lấy thông tin trạm cứu hộ (địa chỉ, Operator phụ trách, SĐT)
   */
  async getStationById(stationId: string): Promise<StationDetailDto | null> {
    try {
      const response = await apiService.get<BackendApiResponse<StationDetailDto>>(
        Endpoints.STATIONS.BY_ID(stationId)
      );
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * GET /api/stations/{id}/staff
   * Lấy danh sách thành viên nhân sự cùng trạm cứu hộ
   */
  async getStationStaff(stationId: string): Promise<StationStaffMemberDto[]> {
    try {
      const response = await apiService.get<BackendApiResponse<StationStaffMemberDto[]>>(
        Endpoints.STATIONS.STAFF(stationId)
      );
      return response.data || [];
    } catch {
      return [];
    }
  },
};
