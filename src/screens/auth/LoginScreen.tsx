import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
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
  ShieldCheck,
  Languages,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';
import { AuthStackParamList } from '../../navigation/types';
import { useAppStore, mapBackendUser } from '../../store/useAppStore';
import { authService } from '../../services/auth.service';
import { storage } from '../../services/storage';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';
import { useResponsive } from '../../utils/responsive';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AppConfig } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<LoginNavProp>();
  const { setAuth } = useAppStore();
  const { isSmallDevice, isShortScreen, moderateScale, fontScale } = useResponsive();


  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});

  useEffect(() => {
    let active = true;
    Promise.all([
      storage.getItem<string>(AppConfig.STORAGE_KEYS.REMEMBER_ME),
      storage.getItem<string>(AppConfig.STORAGE_KEYS.REMEMBERED_ACCOUNT),
    ])
      .then(([rememberFlag, savedAccount]) => {
        if (!active) return;
        const shouldRemember = rememberFlag !== '0';
        setRememberMe(shouldRemember);
        if (shouldRemember && savedAccount) {
          setAccount((cur) => cur || savedAccount);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // SOS Logo & SOS Badge Gentle Pulse / Blink (nhấp nháy êm dịu, không phóng to/thu nhỏ)
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const strobeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Nhấp nháy nhẹ nhàng, êm dịu đồng bộ cho Logo và chữ SOS (chu kỳ 1800ms)
    const blinkAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0.4,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(strobeOpacity, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(strobeOpacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    blinkAnim.start();
    return () => blinkAnim.stop();
  }, [logoOpacity, strobeOpacity]);
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
      await setAuth(mappedUser, authData.accessToken, authData.refreshToken, rememberMe);
      if (rememberMe && mappedUser.email) {
        await storage.setItem(AppConfig.STORAGE_KEYS.REMEMBERED_ACCOUNT, mappedUser.email);
      }
      (navigation as any).navigate('Main');
    } catch (error: any) {
      const isEn = !i18n.language?.startsWith('vi');
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        (isEn ? 'Google sign-in failed. Please check your connection.' : 'Đăng nhập Google thất bại. Vui lòng kiểm tra kết nối.');
      Alert.alert(isEn ? 'Google Sign-In Failed' : 'Đăng nhập Google thất bại', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = async () => {
    const isEn = !i18n.language?.startsWith('vi');
    try {
      if (!googleRequest) {
        Alert.alert(
          isEn ? 'Google Sign-In' : 'Đăng nhập Google',
          isEn ? 'Initializing Google OAuth session. Please try again shortly.' : 'Đang khởi tạo phiên làm việc Google OAuth. Vui lòng thử lại sau giây lát.'
        );
        return;
      }
      await promptGoogleAsync();
    } catch (err: any) {
      Alert.alert(
        isEn ? 'Error' : 'Lỗi',
        err.message || (isEn ? 'Unable to open Google sign-in.' : 'Không thể mở trình đăng nhập Google.')
      );
    }
  };

  // Validation
  const validateForm = () => {
    const isEn = !i18n.language?.startsWith('vi');
    const newErrors: { account?: string; password?: string } = {};

    if (!account.trim()) {
      newErrors.account = isEn ? 'Please enter Email or Phone Number' : 'Vui lòng nhập Email hoặc Số điện thoại';
    } else if (
      !isValidEmail(account.trim()) &&
      !isValidPhoneNumber(account.trim())
    ) {
      newErrors.account = isEn ? 'Please enter a valid Email or Phone Number' : 'Vui lòng nhập đúng định dạng Email hoặc Số điện thoại';
    }

    if (!password) {
      newErrors.password = isEn ? 'Please enter your password' : 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = isEn ? 'Password must be at least 6 characters' : 'Mật khẩu phải có ít nhất 6 ký tự';
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
      await setAuth(mappedUser, authData.accessToken, authData.refreshToken, rememberMe);
      if (rememberMe) {
        await storage.setItem(AppConfig.STORAGE_KEYS.REMEMBERED_ACCOUNT, email);
      }

      (navigation as any).navigate('Main');
    } catch (error: any) {
      const isEn = !i18n.language?.startsWith('vi');
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        (isEn
          ? 'Unable to connect to dispatch server. Please check your credentials or internet connection.'
          : 'Không thể kết nối đến máy chủ điều phối. Vui lòng kiểm tra lại thông tin hoặc kết nối mạng.');
      Alert.alert(isEn ? 'Sign In Failed' : 'Đăng nhập thất bại', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Guest SOS Emergency Bypass (no login required for life-threatening events)
  const handleGuestSosBypass = () => {
    (navigation as any).navigate('Main');
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
          {/* Top Utility Row with Live Status & Quick Language Switcher */}
          <View style={styles.topUtilityRow}>
            <View style={styles.systemStatusWrap}>
              <View style={styles.systemPulseDot} />
              <Text style={styles.systemStatusText} numberOfLines={1}>
                {t('common.online_status')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.langPillBtn}
              onPress={() => setIsLanguageModalVisible(true)}
              activeOpacity={0.8}
            >
              <Languages size={13} color="#DC2626" />
              <Text style={styles.langPillText}>
                {i18n.language?.startsWith('vi') ? '🇻🇳 VI' : '🇬🇧 EN'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Header Branding */}
          <AuthHeader
            title={t('auth.login_title_citizen')}
            subtitle={t('auth.login_subtitle_citizen')}
          />

          {/* Login Form Card */}
          <View style={[styles.card, { padding: moderateScale(isSmallDevice ? 16 : 20) }]}>
            {/* Account (Email/Phone) Input */}
            <Input
              label={t('auth.account_label_citizen')}
              placeholder={t('auth.account_placeholder_citizen')}
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
                  <Mail size={18} color="#64748B" />
                ) : (
                  <Phone size={18} color="#64748B" />
                )
              }
            />

            {/* Password Input */}
            <Input
              label={t('auth.password_label')}
              placeholder={t('auth.password_placeholder')}
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
                onPress={() => {
                  const next = !rememberMe;
                  setRememberMe(next);
                  void storage.setItem(AppConfig.STORAGE_KEYS.REMEMBER_ME, next ? '1' : '0');
                  if (!next) void storage.removeItem(AppConfig.STORAGE_KEYS.REMEMBERED_ACCOUNT);
                }}
              >
                <Switch
                  value={rememberMe}
                  onValueChange={(next) => {
                    setRememberMe(next);
                    void storage.setItem(AppConfig.STORAGE_KEYS.REMEMBER_ME, next ? '1' : '0');
                    if (!next) void storage.removeItem(AppConfig.STORAGE_KEYS.REMEMBERED_ACCOUNT);
                  }}
                  thumbColor={rememberMe ? '#DC2626' : '#94A3B8'}
                  trackColor={{ false: '#E2E8F0', true: '#FECACA' }}
                  style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : {}}
                />
                <Text style={styles.rememberMeText}>{t('auth.remember_me')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword', { emailOrPhone: account })}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Button
              title={t('auth.login_btn')}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginBtn}
              textStyle={styles.loginBtnText}
            />

            {/* Social Logins */}
            <SocialAuthButtons
              dividerText={t('auth.social_divider')}
              onGooglePress={handleGooglePress}
            />
          </View>

          {/* Register Link Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.no_account')} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>{t('auth.register_now')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
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
    paddingTop: 8,
    paddingBottom: 36,
  },
  topUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  systemStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  systemPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  systemStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    elevation: 1,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  sosBannerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  guestSosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 11,
    paddingHorizontal: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  guestSosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  sosIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 2,
  },
  guestSosTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  guestSosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  guestSosTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  sosUrgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    flexShrink: 0,
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  sosUrgentTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  guestSosSub: {
    color: '#FEE2E2',
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '600',
  },
  sosArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
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
    fontWeight: '600',
  },
  forgotPasswordText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
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
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
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
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '500',
  },
  registerLink: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
