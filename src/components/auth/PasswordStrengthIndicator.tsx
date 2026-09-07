import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  if (!password) {
    return null;
  }

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: 'Tối thiểu 8 ký tự', met: hasMinLength },
    { label: 'Có chữ hoa & chữ thường', met: hasUpperCase && hasLowerCase },
    { label: 'Có ít nhất 1 chữ số', met: hasNumber },
    { label: 'Có ký tự đặc biệt (@, #, $...)', met: hasSpecialChar },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let strengthLabel = 'Yếu';
  let strengthColor = '#EF4444'; // Red
  if (metCount === 2) {
    strengthLabel = 'Trung bình';
    strengthColor = '#F59E0B'; // Amber
  } else if (metCount === 3) {
    strengthLabel = 'Khá';
    strengthColor = '#3B82F6'; // Blue
  } else if (metCount === 4) {
    strengthLabel = 'Mạnh & An toàn';
    strengthColor = '#10B981'; // Green
  }

  return (
    <View style={styles.container}>
      {/* Strength Bar and Label Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Độ mạnh mật khẩu:</Text>
        <Text style={[styles.strengthLabel, { color: strengthColor }]}>
          {strengthLabel}
        </Text>
      </View>

      {/* Progress Bars */}
      <View style={styles.barContainer}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < metCount;
          return (
            <View
              key={index}
              style={[
                styles.barSegment,
                {
                  backgroundColor: isFilled ? strengthColor : '#1E293B',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Criteria Checklist */}
      <View style={styles.checklist}>
        {criteria.map((item, index) => (
          <View key={index} style={styles.checkItem}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: item.met
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            >
              {item.met ? (
                <Check size={11} color="#10B981" strokeWidth={3} />
              ) : (
                <X size={11} color="#EF4444" strokeWidth={3} />
              )}
            </View>
            <Text
              style={[
                styles.checkText,
                { color: item.met ? '#E2E8F0' : '#64748B' },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  barContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 6,
    marginBottom: 10,
  },
  barSegment: {
    flex: 1,
    borderRadius: 2,
  },
  checklist: {
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
