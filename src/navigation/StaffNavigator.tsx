import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, Navigation, Flame, ShieldCheck } from 'lucide-react-native';
import { StaffTabParamList } from './types';
import { StaffDashboardScreen } from '../screens/staff/StaffDashboardScreen';
import { SafetyMapScreen } from '../screens/map/SafetyMapScreen';
import { IncidentOverviewScreen } from '../screens/staff/IncidentOverviewScreen';
import { StaffProfileScreen } from '../screens/staff/StaffProfileScreen';
import { useResponsive } from '../utils/responsive';


const Tab = createBottomTabNavigator<StaffTabParamList>();

export const StaffNavigator: React.FC = () => {
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
          elevation: 8,
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
        name="StaffDashboardTab"
        component={StaffDashboardScreen}
        options={{
          tabBarLabel: 'Kíp Trực 115',
          tabBarIcon: ({ color }) => (
            <Truck color={color} size={iconSize} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="TacticalMapTab"
        component={SafetyMapScreen}
        options={{
          tabBarLabel: 'Bản Đồ Tác Chiến',
          tabBarIcon: ({ color }) => (
            <Navigation color={color} size={iconSize} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="ActiveMissionTab"
        component={IncidentOverviewScreen}
        options={{
          tabBarLabel: 'Ca Cứu Hộ',
          tabBarIcon: ({ color }) => (
            <Flame color={color} size={iconSize} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="StaffProfileTab"
        component={StaffProfileScreen}
        options={{
          tabBarLabel: 'Hồ Sơ Kíp Trực',
          tabBarIcon: ({ color }) => (
            <ShieldCheck color={color} size={iconSize} strokeWidth={2.2} />
          ),
        }}
      />

    </Tab.Navigator>
  );
};
