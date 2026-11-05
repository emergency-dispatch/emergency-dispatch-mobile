import React from 'react';
import './src/i18n';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { AppNotificationModal } from './src/components/common';
import { notify, useAppStore } from './src/store';

// Keep native Alert.alert to ensure reliable modal-over-modal display on iOS and Android
const originalAlert = Alert.alert;
Alert.alert = (title, message, buttons, options) => {
  return originalAlert(title, message, buttons, options);
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
  const initAuth = useAppStore((state) => state.initAuth);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

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
