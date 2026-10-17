import { NavigatorScreenParams } from '@react-navigation/native';
import { EmergencyIncident } from '../types/dispatch';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { emailOrPhone?: string } | undefined;
  OtpVerification: {
    emailOrPhone: string;
    flow: 'register' | 'forgot_password' | 'phone_auth';
    targetRoute?: keyof AuthStackParamList;
  };
};

// Citizen (Người dân / Nạn nhân) Bottom Tabs
export type CitizenTabParamList = {
  HomeTab: undefined;
  SafetyMapTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

// Staff (Đội cứu hộ khẩn cấp) Bottom Tabs
export type StaffTabParamList = {
  StaffDashboardTab: undefined;
  TacticalMapTab: undefined;
  ActiveMissionTab: { incident?: EmergencyIncident } | undefined;
  StaffProfileTab: undefined;
};

// Unified / Legacy alias for compatibility
export type MainTabParamList = CitizenTabParamList & {
  StaffTab?: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<any>;
  CitizenMain?: NavigatorScreenParams<CitizenTabParamList>;
  StaffMain?: NavigatorScreenParams<StaffTabParamList>;
  IncidentOverview?: { incident?: EmergencyIncident };
  NotFound?: undefined;
};
