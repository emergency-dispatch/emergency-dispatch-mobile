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
} from '../types/dispatch';

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
};
