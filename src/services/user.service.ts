import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import { UserResponseDto, UpdateProfileDto, UpdateFcmTokenDto } from '../types/user';

/**
 * User Service - Interacts with EmergencyDispatch.API UsersController (/api/users)
 */
export const userService = {
  /**
   * GET /api/users/me — Lấy thông tin cá nhân và hồ sơ y tế khẩn cấp
   */
  async getProfile(): Promise<UserResponseDto> {
    const response = await apiService.get<BackendApiResponse<UserResponseDto>>(
      Endpoints.USER.PROFILE
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể lấy thông tin cá nhân.');
    }
    return response.data;
  },

  /**
   * PUT /api/users/me — Cập nhật hồ sơ y tế khẩn cấp, CCCD, địa chỉ, người liên hệ khẩn cấp
   */
  async updateProfile(dto: UpdateProfileDto): Promise<UserResponseDto> {
    const response = await apiService.put<BackendApiResponse<UserResponseDto>>(
      Endpoints.USER.UPDATE_PROFILE,
      dto
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Cập nhật thông tin cá nhân thất bại.');
    }
    return response.data;
  },

  /**
   * PUT /api/users/fcm-token — Đăng ký FCM Device Token để nhận Push Notification âm thanh còi hú báo động
   */
  async updateFcmToken(fcmToken: string): Promise<boolean> {
    const response = await apiService.put<BackendApiResponse<object>>(
      Endpoints.USER.FCM_TOKEN,
      { fcmToken: fcmToken.trim() } as UpdateFcmTokenDto
    );
    if (!response.success) {
      throw new Error(response.message || 'Cập nhật FCM Token không thành công.');
    }
    return true;
  },
};
