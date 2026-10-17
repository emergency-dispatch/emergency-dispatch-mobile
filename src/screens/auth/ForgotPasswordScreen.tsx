import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { OtpInput } from '../../components/auth/OtpInput';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth.service';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';
import { useTranslation } from 'react-i18next';

type ForgotPasswordNavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'REQUEST' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const route = useRoute<ForgotPasswordRouteProp>();

  const [currentStep, setCurrentStep] = useState<Step>('REQUEST');
  const [account, setAccount] = useState(route.params?.emailOrPhone || '');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Sync route params if passed
  useEffect(() => {
    if (route.params?.emailOrPhone && !account) {
      setAccount(route.params.emailOrPhone);
    }
  }, [route.params?.emailOrPhone]);

  // Step 1: Submit Request for OTP
  const handleRequestOtp = async () => {
    const newErrors: Record<string, string> = {};
    if (!account.trim()) {
      newErrors.account = 'Vui lòng nhập Email hoặc Số điện thoại';
    } else if (!isValidEmail(account.trim()) && !isValidPhoneNumber(account.trim())) {
      newErrors.account = 'Email hoặc Số điện thoại không đúng định dạng';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: account.trim() });
      setErrors({});
      setCurrentStep('VERIFY_OTP');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) {
      setErrors({ otp: 'Vui lòng nhập đủ 6 chữ số mã OTP' });
      return;
    }

    setErrors({});
    setCurrentStep('RESET_PASSWORD');
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!newPassword) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: account.trim(),
        token: otpValue.trim(),
        newPassword,
        confirmPassword,
      });
      setErrors({});
      setCurrentStep('SUCCESS');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      Alert.alert('Lỗi đặt lại mật khẩu', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Indicators
  const stepIndex =
    currentStep === 'REQUEST'
      ? 1
      : currentStep === 'VERIFY_OTP'
      ? 2
      : currentStep === 'RESET_PASSWORD'
      ? 3
      : 4;

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      safeArea={true}
      statusBarStyle="dark-content"
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom + verticalScale(16), verticalScale(28)),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            {/* Header */}
            <AuthHeader
              title={
                currentStep === 'REQUEST'
                  ? t('auth.forgot_password_title')
                  : currentStep === 'VERIFY_OTP'
                  ? t('auth.verify_otp_title')
                  : currentStep === 'RESET_PASSWORD'
                  ? t('auth.new_password_label')
                  : t('common.success')
              }
              subtitle={
                currentStep === 'REQUEST'
                  ? t('auth.forgot_password_sub')
                  : currentStep === 'VERIFY_OTP'
                  ? t('auth.verify_otp_sub', { target: account })
                  : currentStep === 'RESET_PASSWORD'
                  ? t('auth.register_subtitle')
                  : t('common.success')
              }
              showBack={currentStep !== 'SUCCESS'}
              onBack={() => {
                if (currentStep === 'VERIFY_OTP') setCurrentStep('REQUEST');
                else if (currentStep === 'RESET_PASSWORD') setCurrentStep('VERIFY_OTP');
                else navigation.goBack();
              }}
              badgeText="BẢO MẬT & KHÔI PHỤC TÀI KHOẢN"
            />

            {/* Wizard Step Progress Bar */}
            {currentStep !== 'SUCCESS' && (
              <View style={styles.stepsBar}>
                {[1, 2, 3].map((stepNum) => (
                  <React.Fragment key={stepNum}>
                    <View
                      style={[
                        styles.stepDot,
                        stepIndex >= stepNum && styles.stepDotActive,
                        stepIndex === stepNum && styles.stepDotCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepDotText,
                          stepIndex >= stepNum && styles.stepDotTextActive,
                          stepIndex === stepNum && styles.stepDotTextCurrent,
                        ]}
                        allowFontScaling={false}
                        maxFontSizeMultiplier={1.2}
                      >
                        {stepNum}
                      </Text>
                    </View>
                    {stepNum < 3 && (
                      <View
                        style={[
                          styles.stepLine,
                          stepIndex > stepNum && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Wizard Content Card */}
            <View style={styles.card}>
              {/* STEP 1: REQUEST OTP */}
              {currentStep === 'REQUEST' && (
                <View style={styles.cardBody}>
                  <View style={styles.iconCenterWrap}>
                    <View style={styles.stepIconBox}>
                      <KeyRound size={moderateScale(26)} color="#DC2626" />
                    </View>
                  </View>

                  <Input
                    label="Email hoặc Số điện thoại đã đăng ký"
                    placeholder="Nhập email hoặc số điện thoại"
                    value={account}
                    onChangeText={(val) => {
                      setAccount(val);
                      if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }));
                    }}
                    variant="light"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.account}
                    leftIcon={
                      account.includes('@') ? (
                        <Mail size={moderateScale(18)} color="#64748B" />
                      ) : (
                        <Phone size={moderateScale(18)} color="#64748B" />
                      )
                    }
                  />

                  <Button
                    title={t('auth.request_otp_btn')}
                    onPress={handleRequestOtp}
                    loading={isLoading}
                    style={styles.primaryBtn}
                    textStyle={styles.btnText}
                  />
                </View>
              )}

              {/* STEP 2: VERIFY OTP */}
              {currentStep === 'VERIFY_OTP' && (
                <View style={styles.cardBody}>
                  <View style={styles.iconCenterWrap}>
                    <View style={styles.stepIconBox}>
                      <ShieldCheck size={moderateScale(26)} color="#DC2626" />
                    </View>
                  </View>

                  <Text
                    style={styles.instructionText}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}
                  >
                    Vui lòng nhập mã số gồm 6 chữ số được gửi đến{' '}
                    <Text style={styles.highlightText}>{account}</Text>
                  </Text>

                  <OtpInput
                    value={otpValue}
                    onChange={(val) => {
                      setOtpValue(val);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
                    }}
                    onComplete={() => {
                      // Auto submit when 6 digits are complete
                    }}
                    onResend={async () => {
                      try {
                        await authService.forgotPassword({ email: account.trim() });
                        Alert.alert('Đã gửi lại OTP', `Mã xác thực mới đã được gửi tới ${account.trim()}`);
                      } catch (err: any) {
                        Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP.');
                      }
                    }}
                  />
                  {errors.otp && (
                    <Text
                      style={styles.errorTextCenter}
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1.2}
                    >
                      {errors.otp}
                    </Text>
                  )}

                  <Button
                    title={t('auth.verify_otp_btn')}
                    onPress={handleVerifyOtp}
                    loading={isLoading}
                    style={styles.primaryBtn}
                    textStyle={styles.btnText}
                  />

                  <TouchableOpacity
                    style={styles.changeAccountBtn}
                    onPress={() => setCurrentStep('REQUEST')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={styles.changeAccountText}
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1.2}
                    >
                      Đổi Email / Số điện thoại khác
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: RESET PASSWORD */}
              {currentStep === 'RESET_PASSWORD' && (
                <View style={styles.cardBody}>
                  <View style={styles.iconCenterWrap}>
                    <View style={styles.stepIconBox}>
                      <Lock size={moderateScale(26)} color="#DC2626" />
                    </View>
                  </View>

                  <Input
                    label="Mật khẩu mới *"
                    placeholder="Tối thiểu 8 ký tự"
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    variant="light"
                    secureTextEntry={!showPassword}
                    error={errors.password}
                    leftIcon={<Lock size={moderateScale(18)} color="#64748B" />}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword ? (
                          <EyeOff size={moderateScale(18)} color="#64748B" />
                        ) : (
                          <Eye size={moderateScale(18)} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    }
                  />

                  <PasswordStrengthIndicator password={newPassword} />

                  <Input
                    label="Xác nhận mật khẩu mới *"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    variant="light"
                    secureTextEntry={!showConfirmPassword}
                    error={errors.confirmPassword}
                    leftIcon={<Lock size={moderateScale(18)} color="#64748B" />}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={moderateScale(18)} color="#64748B" />
                        ) : (
                          <Eye size={moderateScale(18)} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    }
                  />

                  <Button
                    title={t('auth.reset_password_btn')}
                    onPress={handleResetPassword}
                    loading={isLoading}
                    style={styles.primaryBtn}
                    textStyle={styles.btnText}
                  />
                </View>
              )}

              {/* STEP 4: SUCCESS STATE */}
              {currentStep === 'SUCCESS' && (
                <View style={styles.successContainer}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={moderateScale(44)} color="#10B981" strokeWidth={2.4} />
                  </View>

                  <Text
                    style={styles.successTitle}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}
                  >
                    Đổi Mật Khẩu Thành Công!
                  </Text>
                  <Text
                    style={styles.successSubtitle}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}
                  >
                    Mật khẩu tài khoản cứu hộ của bạn đã được cập nhật an toàn. Bạn có thể đăng nhập ngay
                    bây giờ.
                  </Text>

                  <Button
                    title="Đăng Nhập Ngay"
                    onPress={() => navigation.navigate('Login')}
                    style={styles.successBtn}
                    textStyle={styles.btnText}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Footer Back to Login */}
          {currentStep !== 'SUCCESS' && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backLoginBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={moderateScale(16)} color="#DC2626" />
                <Text
                  style={styles.backLoginText}
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1.2}
                >
                  Quay lại màn hình Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(8),
  },
  topSection: {
    width: '100%',
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
    paddingHorizontal: moderateScale(16),
    width: '100%',
  },
  stepDot: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  stepDotCurrent: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepDotText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#DC2626',
  },
  stepDotTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: moderateScale(6),
  },
  stepLineActive: {
    backgroundColor: '#DC2626',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardBody: {
    width: '100%',
  },
  iconCenterWrap: {
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  stepIconBox: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: moderateScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: verticalScale(6),
    lineHeight: verticalScale(18),
  },
  highlightText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  errorTextCenter: {
    color: '#DC2626',
    fontSize: moderateScale(11.5),
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  primaryBtn: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    marginTop: verticalScale(12),
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14.5),
    fontWeight: '800',
  },
  changeAccountBtn: {
    alignItems: 'center',
    marginTop: verticalScale(14),
    paddingVertical: verticalScale(4),
  },
  changeAccountText: {
    color: '#64748B',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    width: '100%',
  },
  successIconCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(14),
  },
  successTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  successSubtitle: {
    fontSize: moderateScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: verticalScale(18),
    marginBottom: verticalScale(20),
    paddingHorizontal: moderateScale(8),
  },
  successBtn: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    width: '100%',
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(8),
  },
  backLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  backLoginText: {
    color: '#DC2626',
    fontSize: moderateScale(12.5),
    fontWeight: '800',
  },
});
