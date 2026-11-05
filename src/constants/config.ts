import { Platform } from 'react-native';

const getInitialBaseUrl = (): string => {
  let envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    envUrl = envUrl.trim().replace(/\/+$/, '');
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
};

export const AppConfig = {
  APP_NAME: 'Emergency Dispatch',
  API_BASE_URL: getInitialBaseUrl(),
  GOOGLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '905860478642-qn2i8h65ouunbv3tqm40gs1muprtbide.apps.googleusercontent.com',
  TIMEOUT: 15000,
  STORAGE_KEYS: {
    AUTH_TOKEN: '@auth_token',
    REFRESH_TOKEN: '@refresh_token',
    USER_INFO: '@user_info',
    APP_THEME: '@app_theme',
  },
};
