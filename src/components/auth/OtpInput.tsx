import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RotateCw } from 'lucide-react-native';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => void;
  initialCountdown?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  initialCountdown = 60,
}) => {
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [countdown, setCountdown] = useState(initialCountdown);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(initialCountdown);
    setCanResend(false);
    onResend?.();
  };

  const handleTextChange = (text: string, index: number) => {
    // Sanitize digits only
    const cleanText = text.replace(/[^0-9]/g, '');

    // Handle pasting multi-digit OTP
    if (cleanText.length > 1) {
      const pastedDigits = cleanText.slice(0, length);
      onChange(pastedDigits);
      if (pastedDigits.length === length) {
        onComplete?.(pastedDigits);
        inputsRef.current[length - 1]?.focus();
      } else {
        inputsRef.current[pastedDigits.length]?.focus();
      }
      return;
    }

    const currentArr = value.split('');
    currentArr[index] = cleanText;
    const newOtp = currentArr.join('').slice(0, length);
    onChange(newOtp);

    // Auto-focus next input if digit entered
    if (cleanText && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === length) {
      onComplete?.(newOtp);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const currentArr = value.split('');
        currentArr[index - 1] = '';
        onChange(currentArr.join(''));
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 6 Digit Input Boxes */}
      <View style={styles.boxesContainer}>
        {Array.from({ length }).map((_, index) => {
          const char = value[index] || '';
          const isFocused = value.length === index || (value.length === length && index === length - 1);
          const isFilled = !!char;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                isFilled && styles.boxFilled,
              ]}
            >
              <TextInput
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                style={styles.boxInput}
                keyboardType="number-pad"
                maxLength={length} // Allow full string in case of paste
                value={char}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
                textAlign="center"
                autoFocus={index === 0}
                allowFontScaling={false}
                maxFontSizeMultiplier={1.2}
              />
            </View>
          );
        })}
      </View>

      {/* Resend OTP Timer & Button */}
      <View style={styles.resendContainer}>
        {canResend ? (
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            activeOpacity={0.7}
          >
            <RotateCw size={moderateScale(13)} color="#3B82F6" />
            <Text
              style={styles.resendTextActive}
              allowFontScaling={false}
              maxFontSizeMultiplier={1.2}
            >
              Gửi lại mã xác thực
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={styles.countdownText}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}
          >
            Gửi lại mã OTP sau{' '}
            <Text style={styles.countdownHighlight}>{countdown}s</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(12),
    alignItems: 'center',
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: moderateScale(320),
    gap: moderateScale(6),
    marginBottom: verticalScale(14),
  },
  box: {
    flex: 1,
    height: verticalScale(48),
    minWidth: moderateScale(38),
    maxWidth: moderateScale(46),
    borderRadius: moderateScale(10),
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  boxFilled: {
    borderColor: '#10B981',
    backgroundColor: '#0F172A',
  },
  boxInput: {
    fontSize: moderateScale(19),
    fontWeight: '700',
    color: '#F8FAFC',
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  resendTextActive: {
    color: '#60A5FA',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: moderateScale(12),
  },
  countdownHighlight: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});

