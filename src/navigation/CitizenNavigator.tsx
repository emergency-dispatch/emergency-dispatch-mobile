import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldAlert, Map, FileText, UserCheck } from 'lucide-react-native';
import { CitizenTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SafetyMapScreen } from '../screens/map/SafetyMapScreen';
import { MyReportsScreen } from '../screens/reports/MyReportsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useResponsive } from '../utils/responsive';

const Tab = createBottomTabNavigator<CitizenTabParamList>();

export const CitizenNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isSmallDevice, fontScale, moderateScale } = useResponsive();
  const bottomInset = insets.bottom;

  const paddingBottom = bottomInset > 0 ? bottomInset + (Platform.OS === 'android' ? 4 : 2) : 10;
  const baseHeight = isSmallDevice ? 52 : Platform.OS === 'ios' ? 56 : 60;
  const tabHeight = baseHeight + bottomInset;
  const iconSize = moderateScale(isSmallDevice ? 19 : 22);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
          elevation: 4,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: fontScale(isSmallDevice ? 9.5 : 10.5),
          fontWeight: '700',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'SOS Cấp Cứu',
          tabBarIcon: ({ color }) => (
            <ShieldAlert color={color} size={iconSize} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="SafetyMapTab"
        component={SafetyMapScreen}
        options={{
          tabBarLabel: 'Bản Đồ An Toàn',
          tabBarIcon: ({ color }) => <Map color={color} size={iconSize} />,
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'Báo Cáo Cứu Trợ',
          tabBarIcon: ({ color }) => <FileText color={color} size={iconSize} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ Sơ Y Tế & ICE',
          tabBarIcon: ({ color }) => <UserCheck color={color} size={iconSize} />,
        }}
      />
    </Tab.Navigator>
  );
};
