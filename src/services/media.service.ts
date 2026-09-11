import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';

export interface MediaUploadResult {
  url: string;
  publicId?: string;
  mediaType?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  isSuccess?: boolean;
  errorMessage?: string;
}

export const mediaService = {
  /**
   * Mở camera chụp ảnh trực tiếp từ thiết bị
   */
  async pickFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền máy ảnh',
          'Ứng dụng cần quyền sử dụng máy ảnh để chụp ảnh đại diện. Vui lòng cấp quyền trong cài đặt thiết bị.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert('Lỗi chụp ảnh', err.message || 'Không thể mở máy ảnh.');
      return null;
    }
  },

  /**
   * Mở thư viện chọn ảnh từ thiết bị
   */
  async pickFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền thư viện ảnh',
          'Ứng dụng cần quyền truy cập thư viện để chọn ảnh đại diện. Vui lòng cấp quyền trong cài đặt thiết bị.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (err: any) {
      console.warn('Library picker error:', err);
      Alert.alert('Lỗi chọn ảnh', err.message || 'Không thể mở thư viện ảnh.');
      return null;
    }
  },

  /**
   * Đẩy tệp tin lên máy chủ backend qua POST /api/media/upload (lưu trữ Cloudinary)
   * @param asset Thông tin tệp ảnh thu được từ ImagePicker
   * @returns URL ảnh bảo mật từ Cloudinary
   */
  async uploadMedia(asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }): Promise<string> {
    const rawName = asset.fileName || asset.uri.split('/').pop() || 'avatar.jpg';
    const isPng = rawName.toLowerCase().endsWith('.png');
    const mimeType = asset.mimeType || (isPng ? 'image/png' : 'image/jpeg');
    const cleanFileName = rawName.includes('.') ? rawName : `${rawName}.jpg`;

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: cleanFileName,
      type: mimeType,
    } as any);

    const response = await apiService.post<BackendApiResponse<MediaUploadResult>>(
      Endpoints.MEDIA.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      }
    );

    if (!response.success || !response.data?.url) {
      throw new Error(response.message || 'Tải ảnh lên máy chủ thất bại.');
    }

    return response.data.url;
  },

  /**
   * Chọn ảnh (từ camera hoặc thư viện) và tự động upload lên backend
   */
  async pickAndUploadAvatar(source: 'camera' | 'library'): Promise<string | null> {
    const asset =
      source === 'camera'
        ? await mediaService.pickFromCamera()
        : await mediaService.pickFromLibrary();

    if (!asset) return null;

    return await mediaService.uploadMedia(asset);
  },
};
