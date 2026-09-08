import { NavigatorScreenParams } from '@react-navigation/native';

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

export type MainTabParamList = {
  HomeTab: undefined;
  SafetyMapTab: undefined;
  ReportsTab: undefined;
  StaffTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  NotFound?: undefined;
};
