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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { BloodType } from '../../types/profile';
import { isValidEmail, isValidPhoneNumber } from '../../utils/validators';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const BLOOD_TYPES: BloodType[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-', 'Chưa rõ'];

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const { setAuth } = useAppStore();
  const { profile, updateProfile } = useProfileStore();

  // Basic Account Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Optional Emergency Info
  const [showEmergencySection, setShowEmergencySection] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O+');
  const [icePhone, setIcePhone] = useState('');
  const [iceName, setIceName] = useState('');

  // Agreement
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Form Validation
  const validate = () => {
    const newErrors: Record<string, string | undefined> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên đầy đủ';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên quá ngắn';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!isValidPhoneNumber(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 8 ký tự';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (icePhone.trim() && !isValidPhoneNumber(icePhone.trim())) {
      newErrors.icePhone = 'Số điện thoại người thân không hợp lệ';
    }

    if (!agreedTerms) {
      newErrors.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ cứu hộ để tiếp tục';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Register
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const newUser = {
        id: 'user-' + Date.now(),
        email: email.trim(),
        name: fullName.trim(),
        role: 'citizen' as const,
        createdAt: new Date().toISOString(),
      };


      // Save initial profile if emergency info provided
      updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        medicalId: {
          ...profile.medicalId,
          bloodType: selectedBloodType,
        },
        ice: {
          ...profile.ice,
          contacts: icePhone
            ? [
                {
                  id: 'ice_' + Date.now(),
                  name: iceName.trim() || 'Người thân khẩn cấp',
                  phoneNumber: icePhone.trim(),
                  relationship: 'Gia đình',
                  isPrimary: true,
                },
              ]
            : profile.ice.contacts,
        },
      });

      setAuth(newUser, 'mock-jwt-token-' + Date.now());

      Alert.alert(
        'Đăng Ký Thành Công 🎉',
        'Tài khoản cứu hộ của bạn đã được thiết lập. Hãy sẵn sàng nhận trợ giúp và điều phối khi cần thiết.',
        [
          {
            text: 'Bắt Đầu',
            onPress: () => {
              (navigation as any).navigate('Main', { screen: 'HomeTab' });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Đăng ký thất bại', 'Có lỗi xảy ra trong quá trình tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Header */}
          <AuthHeader
            title="Đăng Ký Tài Khoản"
            subtitle="Tạo hồ sơ công dân để phát tín hiệu cứu hộ khẩn cấp chính xác và liên kết mạng lưới cứu nạn"
            showBack
            onBack={() => navigation.goBack()}
            badgeText="ĐĂNG KÝ HỒ SƠ CÔNG DÂN"
          />

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>1. Thông tin cá nhân cơ bản</Text>

            {/* Full Name */}
            <Input
              label="Họ và tên *"
              placeholder="VD: Nguyễn Văn An"
              value={fullName}
              onChangeText={(val) => {
                setFullName(val);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              variant="dark"
              error={errors.fullName}
              leftIcon={<User size={18} color="#94A3B8" />}
            />

            {/* Phone */}
            <Input
              label="Số điện thoại di động *"
              placeholder="VD: 0912345678"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              variant="dark"
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={<Phone size={18} color="#94A3B8" />}
            />

            {/* Email */}
            <Input
              label="Địa chỉ Email *"
              placeholder="VD: nguyenvana@gmail.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              variant="dark"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Mail size={18} color="#94A3B8" />}
            />

            {/* Password */}
            <Input
              label="Mật khẩu *"
              placeholder="Tối thiểu 8 ký tự"
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

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} />

            {/* Confirm Password */}
            <Input
              label="Xác nhận mật khẩu *"
              placeholder="Nhập lại mật khẩu vừa đặt"
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

            {/* Optional Section: Quick Emergency Setup */}
            <TouchableOpacity
              style={styles.accordionToggle}
              activeOpacity={0.8}
              onPress={() => setShowEmergencySection(!showEmergencySection)}
            >
              <View style={styles.accordionLeft}>
                <View style={styles.emergencyIconWrap}>
                  <HeartPulse color="#EF4444" size={16} />
                </View>
                <View>
                  <Text style={styles.accordionTitle}>2. Thiết lập Cứu hộ nhanh (Khuyên dùng)</Text>
                  <Text style={styles.accordionSubtitle}>Nhóm máu & Liên hệ người thân ICE</Text>
                </View>
              </View>
              {showEmergencySection ? (
                <ChevronUp color="#94A3B8" size={20} />
              ) : (
                <ChevronDown color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>

            {showEmergencySection && (
              <View style={styles.emergencyBox}>
                {/* Blood Type Selection */}
                <Text style={styles.fieldLabel}>Nhóm máu của bạn:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodList}>
                  {BLOOD_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      style={[
                        styles.bloodBadge,
                        selectedBloodType === bt && styles.bloodBadgeSelected,
                      ]}
                      onPress={() => setSelectedBloodType(bt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.bloodBadgeText,
                          selectedBloodType === bt && styles.bloodBadgeTextSelected,
                        ]}
                      >
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* ICE Contact Name & Phone */}
                <Input
                  label="Tên người thân liên hệ khẩn cấp"
                  placeholder="VD: Bố / Mẹ / Vợ / Chồng"
                  value={iceName}
                  onChangeText={setIceName}
                  variant="dark"
                  leftIcon={<User size={18} color="#94A3B8" />}
                />
                <Input
                  label="Số điện thoại người thân (ICE)"
                  placeholder="VD: 0988776655"
                  value={icePhone}
                  onChangeText={(val) => {
                    setIcePhone(val);
                    if (errors.icePhone) setErrors((prev) => ({ ...prev, icePhone: undefined }));
                  }}
                  variant="dark"
                  keyboardType="phone-pad"
                  error={errors.icePhone}
                  leftIcon={<PhoneCall size={18} color="#94A3B8" />}
                />
              </View>
            )}

            {/* Terms & Privacy Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.8}
              onPress={() => setAgreedTerms(!agreedTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedTerms && styles.checkboxChecked,
                ]}
              >
                {agreedTerms && <CheckCircle2 color="#FFFFFF" size={14} />}
              </View>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsHighlight}>Điều khoản sử dụng</Text> &{' '}
                <Text style={styles.termsHighlight}>Chính sách cứu nạn khẩn cấp</Text>, cam kết
                thông tin báo nạn là chính xác.
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.termsError}>{errors.terms}</Text>}

            {/* Submit Button */}
            <Button
              title="Đăng Ký Tài Khoản"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.submitBtn}
              textStyle={styles.submitBtnText}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản cứu hộ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    paddingBottom: 40,
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emergencyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  accordionSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 1,
  },
  emergencyBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  bloodList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bloodBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  bloodBadgeSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bloodBadgeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  bloodBadgeTextSelected: {
    color: '#FFFFFF',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termsText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
  },
  termsHighlight: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  termsError: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
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
  loginLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});
