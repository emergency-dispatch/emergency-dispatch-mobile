import { create } from 'zustand';
import i18n from '../i18n';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type?: NotificationType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  singleButton?: boolean;
}

interface NotificationState {
  visible: boolean;
  options: NotificationOptions;
  show: (options: NotificationOptions) => void;
  hide: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  visible: false,
  options: {
    title: '',
    type: 'info',
  },
  show: (options) => set({ visible: true, options }),
  hide: () => set({ visible: false }),
}));

/**
 * Universal imperative notification helper for anywhere in the app
 */
const isEnLang = () => !(i18n.language || 'vi').startsWith('vi');

export const notify = {
  show: (options: NotificationOptions) => useNotificationStore.getState().show(options),
  success: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'success',
      title,
      message,
      confirmText: isEnLang() ? 'Got it' : 'Đã Hiểu',
      singleButton: true,
      onConfirm,
    }),
  error: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'error',
      title,
      message,
      confirmText: isEnLang() ? 'Close' : 'Đóng',
      singleButton: true,
      onConfirm,
    }),
  warning: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'warning',
      title,
      message,
      confirmText: isEnLang() ? 'Got it' : 'Đã Hiểu',
      singleButton: true,
      onConfirm,
    }),
  info: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'info',
      title,
      message,
      confirmText: isEnLang() ? 'Close' : 'Đóng',
      singleButton: true,
      onConfirm,
    }),
  confirm: ({
    title,
    message,
    confirmText,
    cancelText,
    type = 'warning',
    onConfirm,
    onCancel,
  }: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: NotificationType;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) =>
    useNotificationStore.getState().show({
      type,
      title,
      message,
      confirmText: confirmText || (isEnLang() ? 'Confirm' : 'Xác Nhận'),
      cancelText: cancelText || (isEnLang() ? 'Cancel' : 'Hủy Bỏ'),
      singleButton: false,
      onConfirm,
      onCancel,
    }),
  hide: () => useNotificationStore.getState().hide(),
};
