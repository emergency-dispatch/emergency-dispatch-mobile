import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'light' | 'dark';
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'light',
  containerStyle,
  wrapperStyle,
  inputStyle,
  labelStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            isDark && styles.labelDark,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          isDark && styles.inputWrapperDark,
          isFocused && (isDark ? styles.inputFocusedDark : styles.inputFocused),
          error ? styles.inputError : null,
          wrapperStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={isDark ? '#64748B' : Colors.light.textSecondary}
          style={[
            styles.input,
            isDark && styles.inputDark,
            inputStyle,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
    marginBottom: 6,
  },
  labelDark: {
    color: '#E2E8F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
  },
  inputWrapperDark: {
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  inputFocused: {
    borderColor: Colors.light.primary,
  },
  inputFocusedDark: {
    borderColor: '#3B82F6',
    backgroundColor: '#131D31',
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Typography.fontSize.md,
    color: Colors.light.text,
  },
  inputDark: {
    color: '#F8FAFC',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.error,
    marginTop: 4,
  },
});
