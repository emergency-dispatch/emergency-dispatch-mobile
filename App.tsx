import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { AppNotificationModal } from './src/components/common';
import { notify } from './src/store';

// Global interceptor: automatically redirects React Native Alert.alert to our custom White & Red notification modal
const originalAlert = Alert.alert;
Alert.alert = (title, message, buttons) => {
  let confirmText = 'Đã Hiểu';
  let cancelText: string | undefined = undefined;
  let onConfirm: (() => void) | undefined = undefined;
  let onCancel: (() => void) | undefined = undefined;
  let singleButton = true;

  if (buttons && buttons.length > 0) {
    if (buttons.length === 1) {
      confirmText = buttons[0].text || 'Đã Hiểu';
      onConfirm = buttons[0].onPress;
      singleButton = true;
    } else {
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      const confirmBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];
      cancelText = cancelBtn.text || 'Hủy Bỏ';
      onCancel = cancelBtn.onPress;
      confirmText = confirmBtn.text || 'Xác Nhận';
      onConfirm = confirmBtn.onPress;
      singleButton = false;
    }
  }

  let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  const lowerTitle = (title || '').toLowerCase();
  if (
    lowerTitle.includes('thành công') ||
    lowerTitle.includes('success') ||
    lowerTitle.includes('đã lưu') ||
    lowerTitle.includes('hoàn thành')
  ) {
    type = 'success';
  } else if (
    lowerTitle.includes('lỗi') ||
    lowerTitle.includes('thất bại') ||
    lowerTitle.includes('error') ||
    lowerTitle.includes('hỏng') ||
    lowerTitle.includes('thiếu')
  ) {
    type = 'error';
  } else if (
    lowerTitle.includes('cảnh báo') ||
    lowerTitle.includes('xác nhận') ||
    lowerTitle.includes('đăng xuất') ||
    lowerTitle.includes('warning')
  ) {
    type = 'warning';
  }

  notify.show({
    type,
    title: title || 'Thông Báo',
    message: typeof message === 'string' ? message : '',
    confirmText,
    cancelText,
    singleButton,
    onConfirm,
    onCancel,
  });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <AppNotificationModal />
        <StatusBar style="dark" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
