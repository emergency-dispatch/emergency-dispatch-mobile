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
    MY_TEAM: '/users/my-team',
    ICE_CONTACTS: '/users/ice-contacts',
    ICE_CONTACT_BY_ID: (id: string) => `/users/ice-contacts/${id}`,
  },
  DISPATCH: {
    MY_ASSIGNMENTS: '/dispatch/my-assignments',
    ASSIGNMENT_BY_ID: (id: string) => `/dispatch/assignments/${id}`,
    ASSIGNMENT_STATUS: (id: string) => `/dispatch/assignments/${id}/status`,
    ASSIGNMENT_REJECT: (id: string) => `/dispatch/assignments/${id}/reject`,
    ASSIGNMENT_RESOLVE: (id: string) => `/dispatch/assignments/${id}/resolve`,
    TRACKING: (incidentId: string) => `/dispatch/tracking/incident/${incidentId}`,
    ASSIGNMENTS_BY_INCIDENT: (incidentId: string) => `/dispatch/assignments/incident/${incidentId}`,
  },
  RESCUE_UNITS: {
    BASE: '/rescue-units',
    BY_ID: (id: string) => `/rescue-units/${id}`,
    BY_STATION: (stationId: string) => `/rescue-units/station/${stationId}`,
    UPDATE_LOCATION: (id: string) => `/rescue-units/${id}/location`,
    UPDATE_STATUS: (id: string) => `/rescue-units/${id}/status`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  TRAFFIC: {
    REPORT: '/traffic/report',
    ACTIVE: '/traffic/active',
    RESOLVE: (id: string) => `/traffic/${id}/resolve`,
  },
  INCIDENTS: {
    BASE: '/incidents',
    BY_ID: (id: string) => `/incidents/${id}`,
    QUEUE: '/incidents/queue',
    VERIFY: (id: string) => `/incidents/${id}/verify`,
    CANCEL: (id: string) => `/incidents/${id}/cancel`,
    MY_REPORTS: '/incidents/my-reports',
    REVEAL_PHONE: (id: string) => `/incidents/${id}/reveal-phone`,
  },
  MEDIA: {
    UPLOAD: '/media/upload',
  },
  STATIONS: {
    BASE: '/stations',
    BY_ID: (id: string) => `/stations/${id}`,
    STAFF: (id: string) => `/stations/${id}/staff`,
    TEAMS: (id: string) => `/stations/${id}/teams`,
  },
  AI: {
    ANALYZE: '/ai/analyze',
  },
  SETTINGS: {
    SERVICE_AREA: '/settings/service-area',
  },
} as const;
