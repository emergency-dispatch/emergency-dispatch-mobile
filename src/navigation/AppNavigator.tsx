import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SafetyMapScreen } from '../screens/map/SafetyMapScreen';
import { MyReportsScreen } from '../screens/reports/MyReportsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ShieldAlert, Map, FileText, UserCheck } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'SOS Home',
          tabBarIcon: ({ color, size }) => (
            <ShieldAlert color={color} size={size || 22} strokeWidth={2.4} />
          ),
        }}
      />
      <Tab.Screen
        name="SafetyMapTab"
        component={SafetyMapScreen}
        options={{
          tabBarLabel: 'Bản Đồ An Toàn',
          tabBarIcon: ({ color, size }) => (
            <Map color={color} size={size || 22} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'Báo Cáo Sự Cố',
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size || 22} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ Sơ Cứu Hộ',
          tabBarIcon: ({ color, size }) => (
            <UserCheck color={color} size={size || 22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
