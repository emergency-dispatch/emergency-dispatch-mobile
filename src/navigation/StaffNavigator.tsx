import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, Navigation, Flame, ShieldCheck, CalendarDays } from 'lucide-react-native';
import { StaffTabParamList } from './types';
import { StaffDashboardScreen } from '../screens/staff/StaffDashboardScreen';
import { StaffScheduleScreen } from '../screens/staff/StaffScheduleScreen';
import { SafetyMapScreen } from '../screens/map/SafetyMapScreen';
import { IncidentOverviewScreen } from '../screens/staff/IncidentOverviewScreen';
import { StaffProfileScreen } from '../screens/staff/StaffProfileScreen';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../utils/responsive';


const Tab = createBottomTabNavigator<StaffTabParamList>();

export const StaffNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isSmallDevice, fontScale, moderateScale } = useResponsive();
  const bottomInset = insets.bottom;

  const paddingBottom = bottomInset > 0 ? bottomInset + (Platform.OS === 'android' ? 4 : 2) : 10;
  const baseHeight = isSmallDevice ? 52 : Platform.OS === 'ios' ? 56 : 60;
  const tabHeight = baseHeight + bottomInset;
  const iconSize = moderateScale(isSmallDevice ? 18 : 21);

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
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: fontScale(isSmallDevice ? 9 : 10),
          fontWeight: '700',
        },
        tabBarItemStyle: {
          paddingVertical: 1,
        },
      }}
    >
      <Tab.Screen
        name="StaffDashboardTab"
        component={StaffDashboardScreen}
        options={{
          tabBarLabel: t('staff.tab_dashboard'),
          tabBarIcon: ({ color }) => (
            <Truck color={color} size={iconSize} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="StaffScheduleTab"
        component={StaffScheduleScreen}
        options={{
          tabBarLabel: t('staff.tab_schedule'),
          tabBarIcon: ({ color }) => (
            <CalendarDays color={color} size={iconSize} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="TacticalMapTab"
        component={SafetyMapScreen}
        options={{
          tabBarLabel: t('staff.tab_map'),
          tabBarIcon: ({ color }) => (
            <Navigation color={color} size={iconSize} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="ActiveMissionTab"
        component={IncidentOverviewScreen}
        options={{
          tabBarLabel: t('staff.tab_mission'),
          tabBarIcon: ({ color }) => (
            <Flame color={color} size={iconSize} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="StaffProfileTab"
        component={StaffProfileScreen}
        options={{
          tabBarLabel: t('staff.tab_profile'),
          tabBarIcon: ({ color }) => (
            <ShieldCheck color={color} size={iconSize} strokeWidth={2.2} />
          ),
        }}
      />

    </Tab.Navigator>
  );
};
