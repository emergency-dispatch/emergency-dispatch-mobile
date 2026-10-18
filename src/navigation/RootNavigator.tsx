import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { IncidentOverviewScreen } from '../screens/staff/IncidentOverviewScreen';
import { StaffScheduleScreen } from '../screens/staff/StaffScheduleScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen
          name="IncidentOverview"
          component={IncidentOverviewScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="StaffSchedule"
          component={StaffScheduleScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

