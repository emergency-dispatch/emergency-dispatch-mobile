import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register?: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SafetyMapTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  NotFound?: undefined;
};
