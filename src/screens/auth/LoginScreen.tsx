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
  User,
  Truck,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useAppStore, mapBackendUser } from '../../store/useAppStore';
import { UserRole, DEMO_CITIZEN_USER, DEMO_STAFF_USER } from '../../types/models';
import { authService } from '../../services/auth.service';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';
import { useResponsive } from '../../utils/responsive';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AppConfig } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { setAuth, switchDemoRole } = useAppStore();
  const { isSmallDevice, isShortScreen, moderateScale, fontScale } = useResponsive();

  // Selected Login Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});

  // Google OAuth Hook
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: AppConfig.GOOGLE_CLIENT_ID,
      webClientId: AppConfig.GOOGLE_CLIENT_ID,
      androidClientId: AppConfig.GOOGLE_CLIENT_ID,
      iosClientId: AppConfig.GOOGLE_CLIENT_ID,
    },
    {
      scheme: 'emergencydispatch',
    }
  );

  // Handle Google OAuth response
  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) {
        handleGoogleAuthSuccess(id_token);
      }
    }
  }, [googleResponse]);

  const handleGoogleAuthSuccess = async (idToken: string) => {
    setIsLoading(true);
    try {
      const authData = await authService.googleLogin({ idToken });
      const mappedUser = mapBackendUser(authData.user);
      await setAuth(mappedUser, authData.accessToken, authData.refreshToken);
      (navigation as any).navigate('Main');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Đăng nhập Google thất bại. Vui lòng kiểm tra kết nối.';
      Alert.alert('Đăng nhập Google thất bại', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      if (!googleRequest) {
        Alert.alert('Đăng nhập Google', 'Đang khởi tạo phiên làm việc Google OAuth. Vui lòng thử lại sau giây lát.');
        return;
      }
      await promptGoogleAsync();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể mở trình đăng nhập Google.');
    }
  };

  // Role change handler
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrors({});
    if (role === 'staff' && !account) {
      setAccount('nhanvien115@emergency.vn');
      setPassword('123456');
    } else if (role === 'citizen' && account === 'nhanvien115@emergency.vn') {
      setAccount('');
      setPassword('');
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: { account?: string; password?: string } = {};

    if (!account.trim()) {
      newErrors.account =
        selectedRole === 'staff'
          ? 'Vui lòng nhập Mã nhân viên / Email trực ban'
          : 'Vui lòng nhập Email hoặc Số điện thoại';
    } else if (
      selectedRole === 'citizen' &&
      !isValidEmail(account.trim()) &&
      !isValidPhoneNumber(account.trim())
    ) {
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
      const email = account.trim();
      const authData = await authService.login({
        email,
        password,
      });

      const mappedUser = mapBackendUser(authData.user);
      await setAuth(mappedUser, authData.accessToken, authData.refreshToken);

      (navigation as any).navigate('Main');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Không thể kết nối đến máy chủ điều phối. Vui lòng kiểm tra lại thông tin.';
      Alert.alert('Lỗi đăng nhập', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Fast-Login helper for testing
  const handleFastLogin = async (role: UserRole) => {
    setIsLoading(true);
    const demoEmail =
      role === 'staff'
        ? 'staff@emergencydispatch.com'
        : 'citizen@emergencydispatch.com';
    const demoPassword = role === 'staff' ? 'Staff@123456' : 'Citizen@123456';

    try {
      const authData = await authService.login({
        email: demoEmail,
        password: demoPassword,
      });
      const mappedUser = mapBackendUser(authData.user);
      await setAuth(mappedUser, authData.accessToken, authData.refreshToken);
      (navigation as any).navigate('Main');
    } catch {
      // Fallback to offline demo mode if backend is unreachable
      switchDemoRole(role);
      (navigation as any).navigate('Main');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest SOS Emergency Bypass (no login required for life-threatening events)
  const handleGuestSosBypass = () => {
    switchDemoRole('citizen');
    (navigation as any).navigate('Main');
  };

  return (
    <ScreenContainer backgroundColor="#F8FAFC" safeArea style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: moderateScale(isSmallDevice ? 14 : 20),
              paddingBottom: isShortScreen ? 20 : 36,
            },
          ]}
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
                <Text style={[styles.guestSosTitle, { fontSize: fontScale(12) }]}>
                  Cần trợ giúp khẩn cấp ngay?
                </Text>
                <Text style={[styles.guestSosSub, { fontSize: fontScale(10.5) }]}>
                  Bỏ qua đăng nhập và kích hoạt SOS Khách
                </Text>
              </View>
            </View>
            <ArrowRight color="#F87171" size={18} />
          </TouchableOpacity>

          {/* Header Branding */}
          <AuthHeader
            title={selectedRole === 'staff' ? 'Cổng Điều Phối 115' : 'Đăng Nhập Cứu Hộ'}
            subtitle={
              selectedRole === 'staff'
                ? 'Đăng nhập ca trực 115 để nhận lệnh điều động xe cứu thương, GPS tác chiến & quản lý thiết bị y tế'
                : 'Đăng nhập để liên kết hồ sơ y tế, tọa độ GPS thời gian thực và nhận điều phối 24/7'
            }
            badgeText={
              selectedRole === 'staff'
                ? 'HỆ THỐNG ĐIỀU PHỐI CỨU HỘ 115'
                : 'HỆ THỐNG CỨU HỘ KHẨN CẤP'
            }
          />

          {/* Login Form Card */}
          <View style={[styles.card, { padding: moderateScale(isSmallDevice ? 16 : 20) }]}>
            {/* 1. Role Selection Switcher (Citizen vs Staff) */}
            <View style={styles.roleSwitcherContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.roleTab,
                  selectedRole === 'citizen' && styles.roleTabActiveCitizen,
                ]}
                onPress={() => handleRoleChange('citizen')}
              >
                <User
                  size={moderateScale(16)}
                  color={selectedRole === 'citizen' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'citizen' && styles.roleTabTextActive,
                  ]}
                >
                  Người Dân
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.roleTab,
                  selectedRole === 'staff' && styles.roleTabActiveStaff,
                ]}
                onPress={() => handleRoleChange('staff')}
              >
                <Truck
                  size={moderateScale(16)}
                  color={selectedRole === 'staff' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'staff' && styles.roleTabTextActive,
                  ]}
                >
                  Đội Cứu Hộ 115
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account (Email/Phone/Staff ID) Input */}
            <Input
              label={
                selectedRole === 'staff'
                  ? 'Mã nhân viên / Email trực ban 115'
                  : 'Email hoặc Số điện thoại'
              }
              placeholder={
                selectedRole === 'staff'
                  ? 'VD: ST-8821 hoặc nhanvien115@emergency.vn'
                  : 'VD: 0987654321 hoặc name@gmail.com'
              }
              value={account}
              onChangeText={(val) => {
                setAccount(val);
                if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }));
              }}
              variant="light"
              keyboardType={selectedRole === 'staff' ? 'default' : 'email-address'}
              autoCapitalize="none"
              error={errors.account}
              leftIcon={
                selectedRole === 'staff' ? (
                  <ShieldCheck size={18} color="#0284C7" />
                ) : account.includes('@') ? (
                  <Mail size={18} color="#64748B" />
                ) : (
                  <Phone size={18} color="#64748B" />
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
              variant="light"
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<Lock size={18} color="#64748B" />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
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
                  thumbColor={
                    rememberMe
                      ? selectedRole === 'staff'
                        ? '#38BDF8'
                        : '#3B82F6'
                      : '#64748B'
                  }
                  trackColor={{ false: '#334155', true: 'rgba(56, 189, 248, 0.4)' }}
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
              title={
                selectedRole === 'staff'
                  ? 'Đăng Nhập Kíp Trực 115'
                  : 'Đăng Nhập Cứu Hộ'
              }
              onPress={handleLogin}
              loading={isLoading}
              style={[
                styles.loginBtn,
                selectedRole === 'staff' && styles.loginBtnStaff,
              ]}
              textStyle={styles.loginBtnText}
            />

            {/* 2. Fast Demo Role Switcher Quick Access (For direct reviewer & developer testing) */}
            <View style={styles.demoBox}>
              <View style={styles.demoHeader}>
                <Zap size={moderateScale(13)} color="#F59E0B" />
                <Text style={styles.demoHeaderText}>ĐĂNG NHẬP NHANH BẰNG TÀI KHOẢN MẪU</Text>
              </View>

              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.demoBtnCitizen}
                  onPress={() => handleFastLogin('citizen')}
                >
                  <User size={moderateScale(14)} color="#EF4444" />
                  <Text style={styles.demoBtnCitizenText}>Vào vai Người Dân</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.demoBtnStaff}
                  onPress={() => handleFastLogin('staff')}
                >
                  <Truck size={moderateScale(14)} color="#38BDF8" />
                  <Text style={styles.demoBtnStaffText}>Vào vai Đội Cứu Hộ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Social Logins */}
            {selectedRole === 'citizen' && (
              <SocialAuthButtons
                dividerText="HOẶC ĐĂNG NHẬP VỚI"
                onGooglePress={handleGooglePress}
              />
            )}
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
  roleSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  roleTabActiveCitizen: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabActiveStaff: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    color: '#64748B',
    fontSize: 12.5,
  },
  forgotPasswordText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loginBtnStaff: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  demoHeaderText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtnCitizen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  demoBtnCitizenText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  demoBtnStaff: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  demoBtnStaffText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13.5,
  },
  registerLink: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
