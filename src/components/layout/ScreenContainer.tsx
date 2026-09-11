import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean;
  backgroundColor?: string;
  edges?: readonly Edge[];
  statusBarStyle?: 'light-content' | 'dark-content' | 'auto';
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  safeArea = true,
  backgroundColor = Colors.light.background,
  edges,
  statusBarStyle,
}) => {
  const isDark =
    backgroundColor === '#0F172A' ||
    backgroundColor === '#0B0F19' ||
    backgroundColor === '#1E293B' ||
    backgroundColor === '#000000';

  const finalBarStyle =
    statusBarStyle === 'auto' || !statusBarStyle
      ? isDark
        ? 'light-content'
        : 'dark-content'
      : statusBarStyle;

  const expoStatusStyle =
    finalBarStyle === 'light-content' ? 'light' : 'dark';

  if (safeArea) {
    return (
      <SafeAreaView
        edges={edges ?? ['top', 'left', 'right', 'bottom']}
        style={[styles.container, { backgroundColor }, style]}
      >
        <RNStatusBar barStyle={finalBarStyle} backgroundColor={backgroundColor} />
        <ExpoStatusBar style={expoStatusStyle} />
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <RNStatusBar barStyle={finalBarStyle} backgroundColor={backgroundColor} />
      <ExpoStatusBar style={expoStatusStyle} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

