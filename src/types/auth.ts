/**
 * Authentication Types & DTOs
 * Synchronized with EmergencyDispatch.Application.DTOs.Auth
 */

export interface RegisterRequestDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface VerifyEmailDto {
  email: string;
  token: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface GoogleLoginDto {
  idToken: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: 'Citizen' | 'Operator' | 'RescueStaff' | 'Admin' | string;
  status: 'Active' | 'Inactive' | 'Suspended' | string;
  stationId?: string | null;
  stationName?: string | null;
  isEmailVerified: boolean;
  bloodType?: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[] | null;
}
