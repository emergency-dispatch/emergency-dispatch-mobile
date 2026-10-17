import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AppConfig } from '../constants/config';
import { storage } from '../services/storage';
import i18n from '../i18n';

export const apiClient: AxiosInstance = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  timeout: AppConfig.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token and Accept-Language if exists
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Automatically attach user display language preference to backend
      const lang = i18n.language || 'vi';
      const acceptLanguage = lang.startsWith('vi')
        ? 'vi-VN,vi;q=0.9,en;q=0.8'
        : 'en-US,en;q=0.9,vi;q=0.8';
      if (config.headers) {
        config.headers['Accept-Language'] = acceptLanguage;
      }
    } catch {
      // Ignore token read errors during request
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const DEV_FALLBACK_URLS = [
  'http://localhost:5000/api',
  'http://10.0.2.2:5000/api',
  'http://127.0.0.1:5000/api',
];

// Response Interceptor: Global error & Refresh token handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // In development mode, auto-switch between LAN IP, localhost, and 10.0.2.2 if connection refused
    if (__DEV__ && originalRequest && (!error.response || error.message === 'Network Error')) {
      const triedIndex = originalRequest._devFallbackIndex ?? -1;
      const nextIndex = triedIndex + 1;

      if (nextIndex < DEV_FALLBACK_URLS.length) {
        const nextBase = DEV_FALLBACK_URLS[nextIndex];
        originalRequest._devFallbackIndex = nextIndex;
        originalRequest.baseURL = nextBase;
        apiClient.defaults.baseURL = nextBase;
        AppConfig.API_BASE_URL = nextBase;

        try {
          return await apiClient(originalRequest);
        } catch (retryErr: any) {
          // let interceptor handle next fallback or reject
          return Promise.reject(retryErr);
        }
      }

      // If all fallbacks failed, craft a helpful developer message
      error.message =
        'Không thể kết nối đến máy chủ Backend (.NET API).\n' +
        'Vui lòng kiểm tra:\n' +
        '1. Backend đang chạy tại cổng 5000.\n' +
        '2. Nếu dùng điện thoại thật qua Wi-Fi, hãy chạy lệnh:\n' +
        '   dotnet run --urls "http://0.0.0.0:5000"';
    }

    // Handle 401 & attempt token refresh if not already retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem<string>(AppConfig.STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const refreshRes = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
            `${AppConfig.API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            const newAccess = refreshRes.data.data.accessToken;
            const newRefresh = refreshRes.data.data.refreshToken;
            await storage.setItem(AppConfig.STORAGE_KEYS.AUTH_TOKEN, newAccess);
            if (newRefresh) {
              await storage.setItem(AppConfig.STORAGE_KEYS.REFRESH_TOKEN, newRefresh);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return apiClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        // Refresh failed, clear tokens
        await storage.removeItem(AppConfig.STORAGE_KEYS.AUTH_TOKEN);
        await storage.removeItem(AppConfig.STORAGE_KEYS.REFRESH_TOKEN);
      }
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};
