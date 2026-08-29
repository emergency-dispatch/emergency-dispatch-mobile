import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SafetyMapScreen } from '../screens/map/SafetyMapScreen';
import { MyReportsScreen } from '../screens/reports/MyReportsScreen';
import { ShieldAlert, Map, FileText } from 'lucide-react-native';

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
          fontSize: 11,
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
          tabBarLabel: 'Báo Cáo Của Tôi',
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size || 22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
