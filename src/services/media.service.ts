import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { getCurrentLanguage } from '../i18n';
import { apiService } from '../api/client';

const isEn = () => getCurrentLanguage() === 'en';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';
import { AudioAttachmentInputDto } from '../types/incident';

export interface MediaUploadResult {
  url: string;
  publicId?: string;
  mediaType?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
  uploadToken?: string;
  transcript?: string | null;
  transcriptionStatus?: string | null;
  isSuccess?: boolean;
  errorMessage?: string;
}

export interface AudioPlaybackUrlDto {
  url: string;
  expiresAt: string;
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
          isEn() ? 'Camera Permission' : 'Quyền máy ảnh',
          isEn()
            ? 'Camera access is required to take a photo. Please allow permission in device settings.'
            : 'Ứng dụng cần quyền sử dụng máy ảnh để chụp ảnh đại diện. Vui lòng cấp quyền trong cài đặt thiết bị.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert(
        isEn() ? 'Camera Error' : 'Lỗi chụp ảnh',
        err.message || (isEn() ? 'Unable to open camera.' : 'Không thể mở máy ảnh.')
      );
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
          isEn() ? 'Photo Library Permission' : 'Quyền thư viện ảnh',
          isEn()
            ? 'Photo library access is required to choose an image. Please allow permission in device settings.'
            : 'Ứng dụng cần quyền truy cập thư viện để chọn ảnh đại diện. Vui lòng cấp quyền trong cài đặt thiết bị.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (err: any) {
      console.warn('Library picker error:', err);
      Alert.alert(
        isEn() ? 'Image Picker Error' : 'Lỗi chọn ảnh',
        err.message || (isEn() ? 'Unable to open photo library.' : 'Không thể mở thư viện ảnh.')
      );
      return null;
    }
  },

  /**
   * Đẩy tệp tin lên máy chủ backend qua POST /api/media/upload (lưu trữ Cloudinary)
   * @param asset Thông tin tệp ảnh thu được từ ImagePicker
   * @returns URL ảnh bảo mật từ Cloudinary
   */
  async uploadMediaAsset(asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }): Promise<MediaUploadResult> {
    const rawName = asset.fileName || asset.uri.split('/').pop() || 'upload.jpg';
    const lowerName = rawName.toLowerCase();
    const inferredMime =
      asset.mimeType ||
      (lowerName.endsWith('.png')
        ? 'image/png'
        : lowerName.endsWith('.m4a') || lowerName.endsWith('.mp4')
        ? 'audio/mp4'
        : lowerName.endsWith('.mp3')
        ? 'audio/mpeg'
        : lowerName.endsWith('.aac')
        ? 'audio/aac'
        : lowerName.endsWith('.wav')
        ? 'audio/wav'
        : lowerName.endsWith('.ogg')
        ? 'audio/ogg'
        : lowerName.endsWith('.webm')
        ? 'audio/webm'
        : 'image/jpeg');
    const cleanFileName = rawName.includes('.')
      ? rawName
      : `${rawName}.${inferredMime.startsWith('audio/') ? 'm4a' : 'jpg'}`;

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: cleanFileName,
      type: inferredMime,
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
      throw new Error(response.message || (isEn() ? 'Failed to upload file to server.' : 'Tải tệp lên máy chủ thất bại.'));
    }

    return response.data;
  },

  /**
   * POST /api/media/upload — Tải ảnh/media từ máy lên Cloudinary qua BE
   */
  async uploadMedia(asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }): Promise<string> {
    const uploaded = await mediaService.uploadMediaAsset(asset);
    let finalUrl = uploaded.url;
    // Backend Cloudinary MediaUrlPolicy yêu cầu domain res.cloudinary.com.
    // Nếu BE chạy chế độ mock trả về URL Unsplash, chuyển sang mẫu Cloudinary để không bị chặn 400.
    if (
      uploaded.mediaType !== 2 &&
      (finalUrl.includes('images.unsplash.com') || !finalUrl.includes('res.cloudinary.com'))
    ) {
      const pubId = uploaded.publicId || 'mock_incident_photo';
      finalUrl = `https://res.cloudinary.com/dignpno2i/image/upload/${pubId}.jpg`;
    }

    return finalUrl;
  },

  /**
   * POST /api/media/upload-signature — Tải nét vẽ chữ ký SVG/base64 lên Cloudinary dưới dạng PNG thật
   */
  async uploadSignature(svgData: string): Promise<string> {
    const response = await apiService.post<BackendApiResponse<MediaUploadResult>>(
      Endpoints.MEDIA.UPLOAD_SIGNATURE,
      { svgData }
    );
    if (!response.success || !response.data?.url) {
      throw new Error(response.message || 'Không thể tải chữ ký số lên máy chủ.');
    }
    return response.data.url;
  },

  /**
   * POST /api/media/audio/preview-url — Xin link nghe lại audio (hết hạn sau 5 phút) bằng uploadToken
   */
  async getAudioPreviewUrl(uploadToken: string): Promise<AudioPlaybackUrlDto> {
    const response = await apiService.post<BackendApiResponse<AudioPlaybackUrlDto>>(
      Endpoints.MEDIA.AUDIO_PREVIEW,
      { uploadToken }
    );
    if (!response.success || !response.data?.url) {
      throw new Error(response.message || (isEn() ? 'Unable to load audio playback URL.' : 'Không lấy được link phát âm thanh.'));
    }
    return response.data;
  },

  async uploadAudioAttachment(draft: {
    uri: string;
    mimeType?: string | null;
  }): Promise<AudioAttachmentInputDto> {
    const isWav =
      (draft.mimeType || '').toLowerCase().includes('wav') ||
      draft.uri.toLowerCase().endsWith('.wav');
    const ext = isWav ? 'wav' : 'm4a';
    const uploaded = await mediaService.uploadMediaAsset({
      uri: draft.uri,
      fileName: `sos_audio_${Date.now()}.${ext}`,
      mimeType: draft.mimeType || (isWav ? 'audio/wav' : 'audio/mp4'),
    });
    if (!uploaded.uploadToken) {
      throw new Error(isEn() ? 'Server did not issue an audio upload token.' : 'Máy chủ không cấp được mã xác nhận tệp ghi âm.');
    }
    return {
      uploadToken: uploaded.uploadToken,
    };
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
