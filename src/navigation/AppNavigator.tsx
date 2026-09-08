import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CitizenNavigator } from './CitizenNavigator';
import { StaffNavigator } from './StaffNavigator';

export const AppNavigator: React.FC = () => {
  const { user } = useAppStore();

  // If user role is staff -> Render Staff App Navigator (4 staff tabs)
  if (user?.role === 'staff') {
    return <StaffNavigator />;
  }

  // Otherwise -> Render Citizen / User App Navigator (4 citizen tabs)
  return <CitizenNavigator />;
};
