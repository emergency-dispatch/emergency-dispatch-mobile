import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import {
  LoginRequestDto,
  RegisterRequestDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  GoogleLoginDto,
  RefreshTokenRequestDto,
  AuthResponseDto,
  BackendApiResponse,
} from '../types/auth';

/**
 * Auth Service - Communicates with EmergencyDispatch.API AuthController
 */
export const authService = {
  /**
   * Đăng nhập bằng Email & Mật khẩu
   */
  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const response = await apiService.post<BackendApiResponse<AuthResponseDto>>(
      Endpoints.AUTH.LOGIN,
      dto
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Đăng nhập không thành công');
    }
    return response.data;
  },

  /**
   * Đăng ký tài khoản Citizen (nhận mã OTP kích hoạt qua email)
   */
  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const response = await apiService.post<BackendApiResponse<AuthResponseDto>>(
      Endpoints.AUTH.REGISTER,
      dto
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Đăng ký tài khoản không thành công');
    }
    return response.data;
  },

  /**
   * Kích hoạt tài khoản bằng mã OTP 6 số
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<boolean> {
    const response = await apiService.post<BackendApiResponse<boolean>>(
      Endpoints.AUTH.VERIFY_EMAIL,
      dto
    );
    if (!response.success) {
      throw new Error(response.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    }
    return response.data ?? true;
  },

  /**
   * Gửi lại mã OTP kích hoạt tài khoản
   */
  async resendVerification(dto: ResendVerificationDto): Promise<boolean> {
    const response = await apiService.post<BackendApiResponse<boolean>>(
      Endpoints.AUTH.RESEND_VERIFICATION,
      dto
    );
    if (!response.success) {
      throw new Error(response.message || 'Không thể gửi lại mã xác thực');
    }
    return response.data ?? true;
  },

  /**
   * Yêu cầu mã OTP đặt lại mật khẩu (Quên mật khẩu)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<boolean> {
    const response = await apiService.post<BackendApiResponse<boolean>>(
      Endpoints.AUTH.FORGOT_PASSWORD,
      dto
    );
    if (!response.success) {
      throw new Error(response.message || 'Không thể yêu cầu đặt lại mật khẩu');
    }
    return response.data ?? true;
  },

  /**
   * Đặt lại mật khẩu mới bằng mã OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<boolean> {
    const response = await apiService.post<BackendApiResponse<boolean>>(
      Endpoints.AUTH.RESET_PASSWORD,
      dto
    );
    if (!response.success) {
      throw new Error(response.message || 'Đặt lại mật khẩu thất bại');
    }
    return response.data ?? true;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(dto: ChangePasswordDto): Promise<boolean> {
    const response = await apiService.post<BackendApiResponse<object>>(
      Endpoints.AUTH.CHANGE_PASSWORD,
      dto
    );
    if (!response.success) {
      throw new Error(response.message || 'Đổi mật khẩu thất bại');
    }
    return true;
  },

  /**
   * Đăng xuất và vô hiệu hóa Refresh Token trên server
   */
  async logout(refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        await apiService.post<BackendApiResponse<object>>(Endpoints.AUTH.LOGOUT, {
          refreshToken,
        } as RefreshTokenRequestDto);
      }
    } catch {
      // Ignore server logout errors to ensure client always logs out cleanly
    }
  },

  /**
   * Đăng nhập nhanh bằng Google OAuth Token
   */
  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    const response = await apiService.post<BackendApiResponse<AuthResponseDto>>(
      Endpoints.AUTH.GOOGLE,
      dto
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Đăng nhập Google thất bại');
    }
    return response.data;
  },
};
