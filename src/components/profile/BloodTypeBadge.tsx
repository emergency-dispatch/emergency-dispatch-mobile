import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { BloodType } from '../../types/profile';

interface BloodTypeBadgeProps {
  bloodType: BloodType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const BloodTypeBadge: React.FC<BloodTypeBadgeProps> = ({
  bloodType,
  size = 'medium',
  showLabel = true,
}) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        isLarge && styles.containerLarge,
        isSmall && styles.containerSmall,
      ]}
    >
      <View style={[styles.iconWrapper, isLarge && styles.iconWrapperLarge]}>
        <Droplet
          size={isLarge ? 22 : isSmall ? 14 : 18}
          color="#EF4444"
          fill="#EF4444"
        />
      </View>
      <View style={styles.textColumn}>
        {showLabel && (
          <Text style={[styles.label, isLarge && styles.labelLarge]}>
            NHÓM MÁU
          </Text>
        )}
        <Text
          style={[
            styles.value,
            isLarge && styles.valueLarge,
            isSmall && styles.valueSmall,
          ]}
        >
          {bloodType || 'Chưa rõ'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  containerLarge: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    gap: 14,
  },
  containerSmall: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  textColumn: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.8,
  },
  labelLarge: {
    fontSize: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  valueLarge: {
    fontSize: 26,
  },
  valueSmall: {
    fontSize: 14,
  },
});
