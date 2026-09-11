import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
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
  let strengthColor = '#DC2626'; // Emergency Red
  if (metCount === 2) {
    strengthLabel = 'Trung bình';
    strengthColor = '#D97706'; // Amber
  } else if (metCount === 3) {
    strengthLabel = 'Khá';
    strengthColor = '#2563EB'; // Electric Blue
  } else if (metCount === 4) {
    strengthLabel = 'Mạnh & An toàn';
    strengthColor = '#059669'; // Emerald
  }

  return (
    <View style={styles.container}>
      {/* Strength Bar and Label Header */}
      <View style={styles.header}>
        <Text
          style={styles.headerTitle}
          allowFontScaling={false}
          maxFontSizeMultiplier={1.2}
        >
          Độ mạnh mật khẩu:
        </Text>
        <Text
          style={[styles.strengthLabel, { color: strengthColor }]}
          allowFontScaling={false}
          maxFontSizeMultiplier={1.2}
        >
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
                  backgroundColor: isFilled ? strengthColor : '#E2E8F0',
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
                    : '#FEE2E2',
                },
              ]}
            >
              {item.met ? (
                <Check size={moderateScale(10)} color="#059669" strokeWidth={2.8} />
              ) : (
                <X size={moderateScale(10)} color="#DC2626" strokeWidth={3} />
              )}
            </View>
            <Text
              style={[
                styles.checkText,
                { color: item.met ? '#0F172A' : '#64748B', fontWeight: item.met ? '600' : '400' },
              ]}
              allowFontScaling={false}
              maxFontSizeMultiplier={1.2}
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
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(4),
    marginBottom: verticalScale(10),
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  headerTitle: {
    fontSize: moderateScale(11.5),
    color: '#64748B',
    fontWeight: '600',
  },
  strengthLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  barContainer: {
    flexDirection: 'row',
    height: verticalScale(4),
    gap: moderateScale(5),
    marginBottom: verticalScale(10),
  },
  barSegment: {
    flex: 1,
    borderRadius: moderateScale(2),
  },
  checklist: {
    gap: verticalScale(5),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: moderateScale(11.5),
  },
});
