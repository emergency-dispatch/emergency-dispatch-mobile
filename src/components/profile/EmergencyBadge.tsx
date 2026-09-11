import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  AlertTriangle,
  HeartPulse,
  Pill,
  Accessibility,
  Info,
  X,
} from 'lucide-react-native';

export type EmergencyBadgeVariant =
  | 'allergy'
  | 'condition'
  | 'medication'
  | 'mobility'
  | 'special';

interface EmergencyBadgeProps {
  label: string;
  variant: EmergencyBadgeVariant;
  onRemove?: () => void;
  isRemovable?: boolean;
}

export const EmergencyBadge: React.FC<EmergencyBadgeProps> = ({
  label,
  variant,
  onRemove,
  isRemovable = false,
}) => {
  const getTheme = () => {
    switch (variant) {
      case 'allergy':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          text: '#B91C1C',
          iconColor: '#DC2626',
          Icon: AlertTriangle,
        };
      case 'condition':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          iconColor: '#D97706',
          Icon: HeartPulse,
        };
      case 'medication':
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: '#0369A1',
          iconColor: '#0284C7',
          Icon: Pill,
        };
      case 'mobility':
        return {
          bg: '#F3E8FF',
          border: '#E9D5FF',
          text: '#6D28D9',
          iconColor: '#7C3AED',
          Icon: Accessibility,
        };
      case 'special':
      default:
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#334155',
          iconColor: '#475569',
          Icon: Info,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      <IconComponent size={14} color={theme.iconColor} />
      <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
        {label}
      </Text>
      {isRemovable && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeBtn}
        >
          <X size={12} color={theme.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeBtn: {
    marginLeft: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 2,
  },
});
