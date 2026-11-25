import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Mic, MicOff, RefreshCw, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useMobileAudioRecorder } from '../../hooks/useMobileAudioRecorder';

export interface SosCameraCaptureResult {
  photoAsset: { uri: string; fileName: string; mimeType: string } | null;
  audioUri: string | null;
  audioDurationSeconds: number;
  audioMimeType: string;
  transcript?: string;
}

interface SosCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCaptured: (result: SosCameraCaptureResult) => void;
}

function formatTimer(ms: number): string {
  const secs = Math.min(30, Math.floor(Math.max(0, ms) / 1000));
  return `00:${secs.toString().padStart(2, '0')}`;
}

export const SosCameraModal: React.FC<SosCameraModalProps> = ({
  visible,
  onClose,
  onCaptured,
}) => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const completedAudioRef = useRef<{
    uri: string | null;
    durationSec: number;
    mimeType: string;
    transcript?: string;
  }>({ uri: null, durationSec: 0, mimeType: 'audio/mp4' });

  const audioRecorder = useMobileAudioRecorder((draft) => {
    completedAudioRef.current = {
      uri: draft.uri,
      durationSec: draft.durationSeconds,
      mimeType: draft.mimeType || 'audio/mp4',
      transcript: draft.transcript,
    };
  });

  const stopRecordingSafely = useCallback(async () => {
    const draft = await audioRecorder.stopRecording();
    if (draft) {
      completedAudioRef.current = {
        uri: draft.uri,
        durationSec: draft.durationSeconds,
        mimeType: draft.mimeType || 'audio/mp4',
        transcript: draft.transcript,
      };
    }
    return completedAudioRef.current;
  }, [audioRecorder]);

  useEffect(() => {
    if (!visible) {
      setIsCameraReady(false);
      setIsCapturing(false);
      audioRecorder.cancelRecording();
      completedAudioRef.current = { uri: null, durationSec: 0, mimeType: 'audio/mp4' };
      return;
    }

    let cancelled = false;
    completedAudioRef.current = { uri: null, durationSec: 0, mimeType: 'audio/mp4' };

    const initSession = async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission().catch(() => {});
      }
      if (!cancelled) {
        await audioRecorder.startRecording();
      }
    };

    initSession();

    return () => {
      cancelled = true;
      audioRecorder.cancelRecording();
    };
  }, [visible]);

  const finishCapture = async (takePhoto: boolean) => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      let photoAsset: SosCameraCaptureResult['photoAsset'] = null;
      if (takePhoto && cameraRef.current && isCameraReady) {
        const pic = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        if (pic?.uri) {
          photoAsset = {
            uri: pic.uri,
            fileName: `sos_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          };
        }
      }
      const audio = await stopRecordingSafely();
      onCaptured({
        photoAsset,
        audioUri: audio.uri,
        audioDurationSeconds: audio.durationSec,
        audioMimeType: audio.mimeType,
        transcript: audio.transcript,
      });
    } catch {
      const audio = await stopRecordingSafely();
      onCaptured({
        photoAsset: null,
        audioUri: audio.uri,
        audioDurationSeconds: audio.durationSec,
        audioMimeType: audio.mimeType,
        transcript: audio.transcript,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = async () => {
    await audioRecorder.cancelRecording();
    onClose();
  };

  const isRecordingLive = audioRecorder.isRecording;
  const { i18n } = useTranslation();
  const isEn = !i18n.language?.startsWith('vi');
  const elapsedMs = isRecordingLive
    ? audioRecorder.durationMs
    : completedAudioRef.current.durationSec * 1000;
  const micWarning = audioRecorder.permissionWarning;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.container}>
        {cameraPermission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={() => setIsCameraReady(false)}
          />
        ) : (
          <View style={styles.permissionBox}>
            <Camera size={40} color="#F8FAFC" />
            <Text style={styles.permissionTitle}>
              {isEn ? 'Camera permission is required to capture SOS scene' : 'Cần quyền máy ảnh để chụp hiện trường SOS'}
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={() => requestCameraPermission()}>
              <Text style={styles.permissionBtnText}>{isEn ? 'Grant Camera Permission' : 'Cấp quyền Camera'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top overlay bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
          <View
            style={[
              styles.recBadge,
              isRecordingLive
                ? styles.recBadgeLive
                : completedAudioRef.current.uri
                ? styles.recBadgeDone
                : styles.recBadgeMuted,
            ]}
          >
            {micWarning ? (
              <MicOff size={14} color="#FFFFFF" />
            ) : (
              <View style={[styles.recDot, isRecordingLive && styles.recDotPulse]} />
            )}
            <Text style={styles.recText}>
              {micWarning
                ? (isEn ? 'MIC MUTED' : 'MIC TẮT')
                : isRecordingLive
                ? `${isEn ? 'RECORDING' : 'ĐANG GHI ÂM'} ${formatTimer(elapsedMs)} / 00:30`
                : completedAudioRef.current.uri
                ? `${isEn ? 'RECORDED' : 'ĐÃ GHI'} ${formatTimer(elapsedMs)}`
                : (isEn ? 'ENABLING MIC...' : 'ĐANG BẬT MIC...')}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {micWarning ? (
          <View style={styles.warnBanner}>
            <Mic size={13} color="#FEF08A" />
            <Text style={styles.warnText}>{micWarning}</Text>
          </View>
        ) : null}

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          {audioRecorder.transcript ? (
            <View style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: '#F8FAFC', fontSize: 12.5, lineHeight: 17 }} numberOfLines={3}>
                {audioRecorder.transcript}
              </Text>
            </View>
          ) : null}

          <Text style={styles.helperText}>
            {isEn
              ? 'Recording your voice automatically. Tap capture to finish with photo & audio.'
              : 'Đang tự động ghi âm giọng nói của bạn. Nhấn chụp ảnh để hoàn tất cả ảnh và ghi âm.'}
          </Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => finishCapture(false)}
              disabled={isCapturing}
            >
              <Text style={styles.secondaryBtnText}>{isEn ? 'Skip Photo' : 'Bỏ qua ảnh'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.shutterOuter,
                (!cameraPermission?.granted || !isCameraReady || isCapturing) && styles.shutterDisabled,
              ]}
              onPress={() => finishCapture(true)}
              disabled={!cameraPermission?.granted || !isCameraReady || isCapturing}
              activeOpacity={0.8}
            >
              {isCapturing ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
              disabled={!cameraPermission?.granted || isCapturing}
            >
              <RefreshCw size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  permissionBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  permissionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  recBadgeLive: {
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
  },
  recBadgeDone: {
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
  },
  recBadgeMuted: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recDotPulse: {
    backgroundColor: '#FECACA',
  },
  recText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBanner: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  warnText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  helperText: {
    color: '#E2E8F0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    minWidth: 88,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  shutterDisabled: {
    opacity: 0.45,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC2626',
  },
  flipBtn: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
