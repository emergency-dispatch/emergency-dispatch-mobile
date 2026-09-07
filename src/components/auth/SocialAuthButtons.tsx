import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Smartphone, Globe } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface SocialAuthButtonsProps {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onPhoneOtpPress?: () => void;
  dividerText?: string;
  style?: StyleProp<ViewStyle>;
}

// Google "G" Icon in SVG
const GoogleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

// Apple Logo in SVG
const AppleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.83.94-2.89-.92.04-2.02.61-2.67 1.37-.58.67-1.09 1.74-.95 2.78 1.02.08 2.05-.51 2.68-1.26z" />
  </Svg>
);

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onGooglePress,
  onApplePress,
  onPhoneOtpPress,
  dividerText = 'HOẶC ĐĂNG NHẬP VỚI',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{dividerText}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Buttons Row */}
      <View style={styles.buttonsRow}>
        {/* Google Button */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={onGooglePress}
          activeOpacity={0.7}
        >
          <GoogleIcon />
          <Text style={styles.socialBtnText}>Google</Text>
        </TouchableOpacity>

        {/* Apple Button */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={onApplePress}
          activeOpacity={0.7}
        >
          <AppleIcon />
          <Text style={styles.socialBtnText}>Apple</Text>
        </TouchableOpacity>

        {/* SMS OTP Button */}
        {onPhoneOtpPress && (
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={onPhoneOtpPress}
            activeOpacity={0.7}
          >
            <Smartphone color="#38BDF8" size={18} />
            <Text style={styles.socialBtnText}>OTP SMS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
  },
  socialBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
});
