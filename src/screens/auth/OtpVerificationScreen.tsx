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
import { authService } from '../../services/auth.service';
import { useTranslation } from 'react-i18next';

type OtpNavProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type OtpRouteProp = RouteProp<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = !i18n.language?.startsWith('vi');
  const navigation = useNavigation<OtpNavProp>();
  const route = useRoute<OtpRouteProp>();
  const { setAuth } = useAppStore();

  const { emailOrPhone = 'citizen@emergencydispatch.com', flow = 'register' } = route.params || {};

  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleVerify = async (submittedOtp?: string) => {
    const code = submittedOtp || otpValue;
    if (code.length < 6) {
      setError(isEn ? 'Please enter all 6 verification digits' : 'Vui lòng nhập đủ 6 chữ số mã xác thực');
      return;
    }

    setIsLoading(true);
    try {
      if (flow === 'register') {
        await authService.verifyEmail({
          email: emailOrPhone,
          token: code,
        });

        Alert.alert(
          isEn ? 'Verification Successful 🎉' : 'Xác thực thành công 🎉',
          isEn ? 'Your account is now activated. Please sign in to get started.' : 'Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để bắt đầu sử dụng dịch vụ.',
          [
            {
              text: isEn ? 'Sign In Now' : 'Đăng Nhập Ngay',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else if (flow === 'forgot_password') {
        navigation.navigate('ForgotPassword', { emailOrPhone });
      } else {
        Alert.alert(
          isEn ? 'Verification Successful' : 'Xác thực thành công',
          isEn ? 'Your OTP code has been verified.' : 'Mã OTP của bạn đã được xác minh hợp lệ.',
          [
            {
              text: isEn ? 'Sign In' : 'Đăng Nhập',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (e: any) {
      const errorMsg =
        e.response?.data?.message ||
        e.message ||
        (isEn ? 'OTP code is incorrect or expired.' : 'Mã OTP không chính xác hoặc đã hết hạn.');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerification({ email: emailOrPhone });
      Alert.alert(
        isEn ? 'Code Resent' : 'Đã gửi lại mã',
        isEn ? `A new OTP verification code has been sent to ${emailOrPhone}` : `Mã xác thực OTP mới đã được gửi tới ${emailOrPhone}`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (isEn ? 'Unable to resend verification code.' : 'Không thể gửi lại mã xác thực.');
      Alert.alert(isEn ? 'Failed to Resend' : 'Lỗi gửi mã', msg);
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      safeArea
      statusBarStyle="dark-content"
      style={styles.container}
    >
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
            title={t('auth.verify_otp_title')}
            subtitle={t('auth.verify_otp_sub', { target: emailOrPhone })}
            showBack
            onBack={() => navigation.goBack()}
            badgeText={isEn ? '2-FACTOR SECURITY VERIFICATION' : 'XÁC THỰC BẢO MẬT 2 LỚP'}
          />

          {/* OTP Card */}
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Smartphone size={32} color="#DC2626" />
              </View>
            </View>

            <Text style={styles.promptText}>
              {isEn
                ? 'Enter the 6-digit OTP code to verify account ownership'
                : 'Nhập mã OTP gồm 6 chữ số để xác minh quyền sở hữu tài khoản'}
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
              onResend={handleResend}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={t('auth.verify_otp_btn')}
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
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
