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
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.4)',
          text: '#FCA5A5',
          iconColor: '#EF4444',
          Icon: AlertTriangle,
        };
      case 'condition':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#FCD34D',
          iconColor: '#F59E0B',
          Icon: HeartPulse,
        };
      case 'medication':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          border: 'rgba(56, 189, 248, 0.4)',
          text: '#7DD3FC',
          iconColor: '#38BDF8',
          Icon: Pill,
        };
      case 'mobility':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.4)',
          text: '#D8B4FE',
          iconColor: '#A855F7',
          Icon: Accessibility,
        };
      case 'special':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#6EE7B7',
          iconColor: '#10B981',
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
