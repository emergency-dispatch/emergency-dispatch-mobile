import { create } from 'zustand';

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
export const notify = {
  show: (options: NotificationOptions) => useNotificationStore.getState().show(options),
  success: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'success',
      title,
      message,
      confirmText: 'Đã Hiểu',
      singleButton: true,
      onConfirm,
    }),
  error: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'error',
      title,
      message,
      confirmText: 'Đóng',
      singleButton: true,
      onConfirm,
    }),
  warning: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'warning',
      title,
      message,
      confirmText: 'Đã Hiểu',
      singleButton: true,
      onConfirm,
    }),
  info: (title: string, message?: string, onConfirm?: () => void) =>
    useNotificationStore.getState().show({
      type: 'info',
      title,
      message,
      confirmText: 'Đóng',
      singleButton: true,
      onConfirm,
    }),
  confirm: ({
    title,
    message,
    confirmText = 'Xác Nhận',
    cancelText = 'Hủy Bỏ',
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
      confirmText,
      cancelText,
      singleButton: false,
      onConfirm,
      onCancel,
    }),
  hide: () => useNotificationStore.getState().hide(),
};
