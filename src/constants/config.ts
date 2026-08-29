export const AppConfig = {
  APP_NAME: 'Emergency Dispatch',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/api/v1',
  TIMEOUT: 15000,
  STORAGE_KEYS: {
    AUTH_TOKEN: '@auth_token',
    REFRESH_TOKEN: '@refresh_token',
    USER_INFO: '@user_info',
    APP_THEME: '@app_theme',
  },
};
