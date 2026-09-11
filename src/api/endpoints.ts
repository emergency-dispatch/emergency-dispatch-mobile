/**
 * API Endpoints mapping (Matching EmergencyDispatch.API controllers)
 */
export const Endpoints = {
  AUTH: {
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USER: {
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    FCM_TOKEN: '/users/fcm-token',
  },
  INCIDENTS: {
    BASE: '/incidents',
    BY_ID: (id: string) => `/incidents/${id}`,
    QUEUE: '/incidents/queue',
    VERIFY: (id: string) => `/incidents/${id}/verify`,
    CANCEL: (id: string) => `/incidents/${id}/cancel`,
  },
  MEDIA: {
    UPLOAD: '/media/upload',
  },
  AI: {
    ANALYZE: '/ai/analyze',
  },
} as const;
