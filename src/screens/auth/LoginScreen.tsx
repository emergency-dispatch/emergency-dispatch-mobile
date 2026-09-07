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
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { setAuth } = useAppStore();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});

  // Validation
  const validateForm = () => {
    const newErrors: { account?: string; password?: string } = {};

    if (!account.trim()) {
      newErrors.account = 'Vui lòng nhập Email hoặc Số điện thoại';
    } else if (!isValidEmail(account.trim()) && !isValidPhoneNumber(account.trim())) {
      newErrors.account = 'Email hoặc Số điện thoại không hợp lệ (VD: 0912345678 hoặc user@gmail.com)';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sign In Handler
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call authentication
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockUser = {
        id: 'user-' + Date.now(),
        email: account.includes('@') ? account : `${account}@emergency.vn`,
        name: account.includes('@') ? account.split('@')[0] : `User ${account.slice(-4)}`,
        role: 'citizen',
        createdAt: new Date().toISOString(),
      };

      setAuth(mockUser, 'mock-jwt-token-' + Date.now());

      // Navigate to Main Tab flow
      (navigation as any).navigate('Main', { screen: 'HomeTab' });
    } catch (error) {
      Alert.alert('Lỗi đăng nhập', 'Không thể kết nối đến máy chủ điều phối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest SOS Emergency Bypass (no login required for life-threatening events)
  const handleGuestSosBypass = () => {
    (navigation as any).navigate('Main', { screen: 'HomeTab' });
  };

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
          {/* Guest Emergency SOS Quick Banner */}
          <TouchableOpacity
            style={styles.guestSosBanner}
            activeOpacity={0.85}
            onPress={handleGuestSosBypass}
          >
            <View style={styles.guestSosLeft}>
              <View style={styles.sosIconCircle}>
                <ShieldAlert color="#EF4444" size={18} strokeWidth={2.6} />
              </View>
              <View style={styles.guestSosTextGroup}>
                <Text style={styles.guestSosTitle}>Cần trợ giúp khẩn cấp ngay?</Text>
                <Text style={styles.guestSosSub}>Bỏ qua đăng nhập và kích hoạt SOS Khách</Text>
              </View>
            </View>
            <ArrowRight color="#F87171" size={18} />
          </TouchableOpacity>

          {/* Header Branding */}
          <AuthHeader
            title="Đăng Nhập Cứu Hộ"
            subtitle="Đăng nhập để liên kết hồ sơ y tế, tọa độ GPS thời gian thực và nhận điều phối 24/7"
            badgeText="HỆ THỐNG CỨU HỘ KHẨN CẤP"
          />

          {/* Login Form Card */}
          <View style={styles.card}>
            {/* Account (Email/Phone) Input */}
            <Input
              label="Email hoặc Số điện thoại"
              placeholder="VD: 0987654321 hoặc name@gmail.com"
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

            {/* Password Input */}
            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
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

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeGroup}
                activeOpacity={0.7}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  thumbColor={rememberMe ? '#3B82F6' : '#64748B'}
                  trackColor={{ false: '#334155', true: 'rgba(59, 130, 246, 0.4)' }}
                  style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : {}}
                />
                <Text style={styles.rememberMeText}>Ghi nhớ tôi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword', { emailOrPhone: account })}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Button
              title="Đăng Nhập Cứu Hộ"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginBtn}
              textStyle={styles.loginBtnText}
            />

            {/* Social Logins */}
            <SocialAuthButtons
              dividerText="HOẶC ĐĂNG NHẬP VỚI"
              onGooglePress={() => {
                Alert.alert('Đăng nhập Google', 'Tính năng kết nối tài khoản Google đang được kích hoạt.');
              }}
              onApplePress={() => {
                Alert.alert('Đăng nhập Apple', 'Tính năng kết nối tài khoản Apple ID đang được kích hoạt.');
              }}
              onPhoneOtpPress={() => {
                navigation.navigate('OtpVerification', {
                  emailOrPhone: account || '0987654321',
                  flow: 'phone_auth',
                });
              }}
            />
          </View>

          {/* Register Link Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản cứu hộ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
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
  guestSosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  guestSosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sosIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSosTextGroup: {
    flex: 1,
  },
  guestSosTitle: {
    color: '#F87171',
    fontSize: 12.5,
    fontWeight: '700',
  },
  guestSosSub: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 1,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  rememberMeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    color: '#94A3B8',
    fontSize: 12.5,
  },
  forgotPasswordText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13.5,
  },
  registerLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
