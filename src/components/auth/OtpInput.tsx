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
            <RotateCw size={14} color="#3B82F6" />
            <Text style={styles.resendTextActive}>Gửi lại mã xác thực</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.countdownText}>
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
    marginVertical: 16,
    alignItems: 'center',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
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
    fontSize: 22,
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
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  resendTextActive: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  countdownHighlight: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});
