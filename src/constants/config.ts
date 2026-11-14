import { Platform } from 'react-native';

export const REMOTE_API_BASE_URL = 'https://emergency-dispatch-backend.onrender.com/api';

const getInitialBaseUrl = (): string => {
  let envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    envUrl = envUrl.trim().replace(/\/+$/, '');
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return REMOTE_API_BASE_URL;
};

export const AppConfig = {
  APP_NAME: 'Emergency Dispatch',
  API_BASE_URL: getInitialBaseUrl(),
  GOOGLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '905860478642-qn2i8h65ouunbv3tqm40gs1muprtbide.apps.googleusercontent.com',
  TIMEOUT: 60000,
  STORAGE_KEYS: {
    AUTH_TOKEN: '@auth_token',
    REFRESH_TOKEN: '@refresh_token',
    USER_INFO: '@user_info',
    APP_THEME: '@app_theme',
  },
};
