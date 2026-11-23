import { Alert } from 'react-native';
import type { TFunction } from 'i18next';

/**
 * Bắt buộc đăng nhập trước khi gửi báo cáo SOS trên Mobile (đồng bộ với Web).
 * Trả về true nếu đã đăng nhập; nếu chưa thì hiện thông báo và điều hướng sang màn Đăng nhập.
 */
export function requireSosAuth(
  isAuthenticated: boolean,
  navigation: { navigate: (route: any, params?: any) => void },
  t: TFunction
): boolean {
  if (isAuthenticated) return true;
  Alert.alert(
    t('profile.unauth_title', 'Yêu Cầu Đăng Nhập'),
    t('sos.auth_required_prompt', 'Vui lòng đăng nhập tài khoản Người dân trước khi gửi báo cáo SOS khẩn cấp.'),
    [
      { text: t('common.cancel', 'Hủy'), style: 'cancel' },
      {
        text: t('profile.unauth_login_btn', 'Đăng Nhập Ngay'),
        onPress: () => navigation.navigate('Auth', { screen: 'Login' }),
      },
    ]
  );
  return false;
}
