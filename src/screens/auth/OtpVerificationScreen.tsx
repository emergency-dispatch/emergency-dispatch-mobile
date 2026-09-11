import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { OtpInput } from '../../components/auth/OtpInput';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';

type OtpNavProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type OtpRouteProp = RouteProp<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OtpNavProp>();
  const route = useRoute<OtpRouteProp>();
  const { setAuth } = useAppStore();

  const { emailOrPhone = '0987654321', flow = 'phone_auth' } = route.params || {};

  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleVerify = async (submittedOtp?: string) => {
    const code = submittedOtp || otpValue;
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (flow === 'phone_auth') {
        const mockUser = {
          id: 'user-' + Date.now(),
          email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@emergency.vn`,
          name: `Công dân ${emailOrPhone.slice(-4)}`,
          role: 'citizen' as const,
          createdAt: new Date().toISOString(),
        };

        setAuth(mockUser, 'mock-jwt-token-' + Date.now());

        Alert.alert('Đăng nhập thành công', 'Chào mừng bạn đến với Hệ thống Điều phối Cứu hộ!', [
          {
            text: 'Tiếp tục',
            onPress: () => {
              (navigation as any).navigate('Main', { screen: 'HomeTab' });
            },
          },
        ]);
      } else if (flow === 'forgot_password') {
        navigation.navigate('ForgotPassword', { emailOrPhone });
      } else {
        Alert.alert('Xác thực thành công', 'Tài khoản của bạn đã được xác minh.', [
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    } catch (e) {
      setError('Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#F8FAFC" safeArea style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <AuthHeader
            title="Xác Thực Mã OTP"
            subtitle={`Hệ thống đã gửi mã bảo mật 6 số tới ${emailOrPhone}`}
            showBack
            onBack={() => navigation.goBack()}
            badgeText="XÁC THỰC BẢO MẬT 2 LỚP"
          />

          {/* OTP Card */}
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Smartphone size={32} color="#DC2626" />
              </View>
            </View>

            <Text style={styles.promptText}>
              Nhập mã OTP gồm 6 chữ số để xác minh quyền sở hữu tài khoản
            </Text>

            <OtpInput
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val);
                if (error) setError(undefined);
              }}
              onComplete={(completedOtp) => {
                handleVerify(completedOtp);
              }}
              onResend={() => {
                Alert.alert('Đã gửi lại OTP', 'Mã xác thực mới đã được gửi qua SMS.');
              }}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="Xác Thực & Tiếp Tục"
              onPress={() => handleVerify()}
              loading={isLoading}
              style={styles.submitBtn}
              textStyle={styles.submitBtnText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
