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
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';

type ForgotPasswordNavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'REQUEST' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordScreen: React.FC = () => {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setErrors({});
      setCurrentStep('VERIFY_OTP');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi mã xác thực. Vui lòng thử lại.');
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

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setErrors({});
      setCurrentStep('RESET_PASSWORD');
    } catch (e) {
      Alert.alert('Lỗi', 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!newPassword) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
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
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setErrors({});
      setCurrentStep('SUCCESS');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
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
    <ScreenContainer backgroundColor="#0B0F19" safeArea style={styles.container}>
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
            title={
              currentStep === 'REQUEST'
                ? 'Quên Mật Khẩu'
                : currentStep === 'VERIFY_OTP'
                ? 'Xác Thực OTP'
                : currentStep === 'RESET_PASSWORD'
                ? 'Mật Khẩu Mới'
                : 'Thành Công'
            }
            subtitle={
              currentStep === 'REQUEST'
                ? 'Nhập Email hoặc Số điện thoại để nhận mã OTP khôi phục quyền truy cập'
                : currentStep === 'VERIFY_OTP'
                ? `Mã xác thực 6 số đã được gửi đến ${account}`
                : currentStep === 'RESET_PASSWORD'
                ? 'Tạo mật khẩu an toàn mới cho tài khoản cứu hộ của bạn'
                : 'Mật khẩu của bạn đã được cập nhật thành công!'
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
                      ]}
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
              <View>
                <View style={styles.iconCenterWrap}>
                  <View style={styles.stepIconBox}>
                    <KeyRound size={28} color="#38BDF8" />
                  </View>
                </View>

                <Input
                  label="Email hoặc Số điện thoại đã đăng ký"
                  placeholder="VD: 0912345678 hoặc name@gmail.com"
                  value={account}
                  onChangeText={(val) => {
                    setAccount(val);
                    if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }));
                  }}
                  variant="dark"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.account}
                  leftIcon={
                    account.includes('@') ? (
                      <Mail size={18} color="#94A3B8" />
                    ) : (
                      <Phone size={18} color="#94A3B8" />
                    )
                  }
                />

                <Button
                  title="Gửi Mã Xác Thực OTP"
                  onPress={handleRequestOtp}
                  loading={isLoading}
                  style={styles.primaryBtn}
                  textStyle={styles.btnText}
                />
              </View>
            )}

            {/* STEP 2: VERIFY OTP */}
            {currentStep === 'VERIFY_OTP' && (
              <View>
                <View style={styles.iconCenterWrap}>
                  <View style={styles.stepIconBox}>
                    <ShieldCheck size={28} color="#10B981" />
                  </View>
                </View>

                <Text style={styles.instructionText}>
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
                  onResend={() => {
                    Alert.alert('Đã gửi lại OTP', 'Mã xác thực mới đã được gửi lại.');
                  }}
                />
                {errors.otp && <Text style={styles.errorTextCenter}>{errors.otp}</Text>}

                <Button
                  title="Xác Thực Mã OTP"
                  onPress={handleVerifyOtp}
                  loading={isLoading}
                  style={styles.primaryBtn}
                  textStyle={styles.btnText}
                />

                <TouchableOpacity
                  style={styles.changeAccountBtn}
                  onPress={() => setCurrentStep('REQUEST')}
                >
                  <Text style={styles.changeAccountText}>Đổi Email / Số điện thoại khác</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {currentStep === 'RESET_PASSWORD' && (
              <View>
                <View style={styles.iconCenterWrap}>
                  <View style={styles.stepIconBox}>
                    <Lock size={28} color="#F59E0B" />
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
                  variant="dark"
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  leftIcon={<Lock size={18} color="#94A3B8" />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#94A3B8" />
                      ) : (
                        <Eye size={18} color="#94A3B8" />
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
                  variant="dark"
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                  leftIcon={<Lock size={18} color="#94A3B8" />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color="#94A3B8" />
                      ) : (
                        <Eye size={18} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  }
                />

                <Button
                  title="Cập Nhật Mật Khẩu"
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
                  <CheckCircle2 size={48} color="#10B981" strokeWidth={2.4} />
                </View>

                <Text style={styles.successTitle}>Đổi Mật Khẩu Thành Công!</Text>
                <Text style={styles.successSubtitle}>
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

          {/* Footer Back to Login */}
          {currentStep !== 'SUCCESS' && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backLoginBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#94A3B8" />
                <Text style={styles.backLoginText}>Quay lại màn hình Đăng nhập</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  stepDotCurrent: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
    elevation: 3,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#F8FAFC',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#1E293B',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  iconCenterWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  highlightText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  errorTextCenter: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 14,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  changeAccountBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  changeAccountText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  successBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backLoginText: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
