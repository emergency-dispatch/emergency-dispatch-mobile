import { useCallback, useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModuleType } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useTranslation } from 'react-i18next';

export interface PendingAudioDraft {
  uri: string;
  durationSeconds: number;
  mimeType?: string;
  transcript?: string;
}

export function applyTranscriptToNote(currentNote: string, prevSynced: string, nextSynced: string): string {
  const next = nextSynced.trim();
  if (!next || next === prevSynced) return currentNote;
  if (!currentNote.trim() || currentNote.trim() === prevSynced) return next;
  if (prevSynced && currentNote.endsWith(prevSynced)) {
    return `${currentNote.slice(0, currentNote.length - prevSynced.length)}${next}`;
  }
  return `${currentNote.trimEnd()} ${next}`;
}

const MAX_RECORD_MS = 29_500;

function getSpeechModule(): ExpoSpeechRecognitionModuleType | null {
  try {
    return requireOptionalNativeModule<ExpoSpeechRecognitionModuleType>('ExpoSpeechRecognition');
  } catch {
    return null;
  }
}

export function useMobileAudioRecorder(onAutoStopped?: (draft: PendingAudioDraft) => void) {
  const { i18n } = useTranslation();
  const speechMod = getSpeechModule();
  const canUseSpeechRecording = Boolean(
    speechMod &&
      typeof speechMod.start === 'function' &&
      speechMod.isRecognitionAvailable?.() &&
      speechMod.supportsRecording?.()
  );

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const [speechDurationMs, setSpeechDurationMs] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  const modeRef = useRef<'none' | 'speech' | 'expo-audio'>('none');
  const isRecordingActiveRef = useRef(false);
  const speechStartedAtRef = useRef(0);
  const speechTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const committedTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const persistedSpeechUriRef = useRef<string | null>(null);
  const pendingStopResolveRef = useRef<((uri: string | null) => void) | null>(null);

  const onAutoStoppedRef = useRef(onAutoStopped);
  onAutoStoppedRef.current = onAutoStopped;

  const stopSpeechTimer = () => {
    if (speechTimerRef.current) {
      clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!speechMod) return;

    const subResult = speechMod.addListener('result', (event) => {
      const piece = event.results?.[0]?.transcript?.trim() || '';
      if (!piece) return;
      if (event.isFinal) {
        committedTranscriptRef.current = committedTranscriptRef.current
          ? `${committedTranscriptRef.current} ${piece}`
          : piece;
        latestTranscriptRef.current = committedTranscriptRef.current;
        setTranscript(committedTranscriptRef.current.slice(0, 4000));
      } else {
        const combined = committedTranscriptRef.current
          ? `${committedTranscriptRef.current} ${piece}`
          : piece;
        latestTranscriptRef.current = combined;
        setTranscript(combined.slice(0, 4000));
      }
    });

    const subAudioEnd = speechMod.addListener('audioend', (event) => {
      if (event?.uri) {
        persistedSpeechUriRef.current = event.uri;
      }
      if (pendingStopResolveRef.current) {
        const resolve = pendingStopResolveRef.current;
        pendingStopResolveRef.current = null;
        resolve(event?.uri || persistedSpeechUriRef.current);
      }
    });

    const subEnd = speechMod.addListener('end', () => {
      stopSpeechTimer();
      setIsSpeechRecording(false);
      if (pendingStopResolveRef.current) {
        const resolve = pendingStopResolveRef.current;
        pendingStopResolveRef.current = null;
        resolve(persistedSpeechUriRef.current);
      }
    });

    const isEn = !i18n.language?.startsWith('vi');
    const subError = speechMod.addListener('error', (event) => {
      if (event.error === 'not-allowed') {
        setPermissionWarning(isEn ? 'Microphone or speech recognition permission denied.' : 'Chưa cấp quyền micro hoặc nhận diện giọng nói.');
      } else if (event.error === 'service-not-allowed' || event.error === 'language-not-supported') {
        setPermissionWarning(isEn ? 'Speech recognition is not supported for this language on this device.' : 'Thiết bị chưa hỗ trợ nhận diện giọng nói cho ngôn ngữ này.');
      } else if (event.error === 'network') {
        setPermissionWarning(isEn ? 'Internet connection is required for speech recognition.' : 'Cần kết nối mạng để nhận diện giọng nói.');
      } else if (event.error && event.error !== 'no-speech' && event.error !== 'speech-timeout' && event.error !== 'aborted') {
        setPermissionWarning(
          isEn
            ? `Speech recognition error (${event.error}); audio recording was still saved.`
            : `Nhận diện giọng nói gặp lỗi (${event.error}); bản ghi âm vẫn được lưu.`
        );
      }
      if (event.error !== 'no-speech' && event.error !== 'speech-timeout') {
        stopSpeechTimer();
        setIsSpeechRecording(false);
        if (pendingStopResolveRef.current) {
          const resolve = pendingStopResolveRef.current;
          pendingStopResolveRef.current = null;
          resolve(persistedSpeechUriRef.current);
        }
      }
    });

    return () => {
      subResult.remove();
      subAudioEnd.remove();
      subEnd.remove();
      subError.remove();
    };
  }, [speechMod]);

  const stopRecording = useCallback(async (): Promise<PendingAudioDraft | null> => {
    if (!isRecordingActiveRef.current) return null;
    isRecordingActiveRef.current = false;
    const activeMode = modeRef.current;
    modeRef.current = 'none';

    if (activeMode === 'speech' && speechMod) {
      stopSpeechTimer();
      setIsSpeechRecording(false);
      const elapsedSec = Math.max(
        1,
        Math.min(30, Math.round((Date.now() - speechStartedAtRef.current) / 1000))
      );

      const finalUri = await new Promise<string | null>((resolve) => {
        let settled = false;
        const finish = (uri: string | null) => {
          if (settled) return;
          settled = true;
          pendingStopResolveRef.current = null;
          resolve(uri);
        };
        pendingStopResolveRef.current = finish;
        try {
          speechMod.stop();
        } catch {
          finish(persistedSpeechUriRef.current);
          return;
        }
        setTimeout(() => finish(persistedSpeechUriRef.current), 1200);
      });

      const finalText = latestTranscriptRef.current.trim().slice(0, 4000);
      if (!finalUri) return null;
      return {
        uri: finalUri,
        durationSeconds: elapsedSec,
        mimeType: 'audio/wav',
        transcript: finalText,
      };
    }

    const elapsedSec = Math.max(
      1,
      Math.min(30, Math.round((recorder.currentTime || recorderState.durationMillis / 1000) || 1))
    );
    try {
      await recorder.stop();
    } catch {
      // ignore if already stopped
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    if (!recorder.uri) return null;
    return {
      uri: recorder.uri,
      durationSeconds: elapsedSec,
      mimeType: 'audio/mp4',
      transcript: latestTranscriptRef.current.trim().slice(0, 4000),
    };
  }, [recorder, recorderState.durationMillis, speechMod]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setPermissionWarning(null);
    if (isRecordingActiveRef.current) return true;

    committedTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    persistedSpeechUriRef.current = null;
    setTranscript('');
    setSpeechDurationMs(0);

    const isEn = !i18n.language?.startsWith('vi');
    if (canUseSpeechRecording && speechMod) {
      try {
        const perm = await speechMod.requestPermissionsAsync();
        if (!perm.granted) {
          setPermissionWarning(isEn ? 'Microphone / speech permission not granted.' : 'Chưa cấp quyền micro/nhận diện giọng nói.');
          return false;
        }
        speechStartedAtRef.current = Date.now();
        isRecordingActiveRef.current = true;
        modeRef.current = 'speech';
        setIsSpeechRecording(true);
        stopSpeechTimer();
        speechTimerRef.current = setInterval(() => {
          setSpeechDurationMs(Date.now() - speechStartedAtRef.current);
        }, 250);

        speechMod.start({
          lang: i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN',
          interimResults: true,
          continuous: true,
          addsPunctuation: true,
          recordingOptions: { persist: true },
        });
        return true;
      } catch {
        stopSpeechTimer();
        setIsSpeechRecording(false);
        isRecordingActiveRef.current = false;
        modeRef.current = 'none';
        // Fall back seamlessly to expo-audio below
      }
    }

    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setPermissionWarning(isEn ? 'Microphone permission required for recording.' : 'Chưa cấp quyền micro để ghi âm.');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingActiveRef.current = true;
      modeRef.current = 'expo-audio';
      return true;
    } catch {
      setPermissionWarning(isEn ? 'Unable to start microphone on this device.' : 'Không thể khởi động micro trên thiết bị này.');
      return false;
    }
  }, [canUseSpeechRecording, i18n.language, recorder, speechMod]);

  const cancelRecording = useCallback(async () => {
    if (!isRecordingActiveRef.current) return;
    isRecordingActiveRef.current = false;
    const activeMode = modeRef.current;
    modeRef.current = 'none';
    stopSpeechTimer();
    setIsSpeechRecording(false);

    if (activeMode === 'speech' && speechMod) {
      pendingStopResolveRef.current = null;
      try {
        speechMod.abort();
      } catch {
        // ignore
      }
      return;
    }
    await recorder.stop().catch(() => {});
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, [recorder, speechMod]);

  const activeDurationMs = modeRef.current === 'speech' ? speechDurationMs : recorderState.durationMillis;

  useEffect(() => {
    if (!isRecordingActiveRef.current) return;
    if (activeDurationMs >= MAX_RECORD_MS) {
      stopRecording().then((draft) => {
        if (draft) onAutoStoppedRef.current?.(draft);
      });
    }
  }, [activeDurationMs, stopRecording]);

  useEffect(() => {
    return () => {
      stopSpeechTimer();
      if (isRecordingActiveRef.current) {
        isRecordingActiveRef.current = false;
        if (modeRef.current === 'speech' && speechMod) {
          try {
            speechMod.abort();
          } catch {
            // ignore
          }
        } else {
          recorder.stop().catch(() => {});
          setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
        }
      }
    };
  }, [recorder, speechMod]);

  return {
    isRecording: isSpeechRecording || recorderState.isRecording || isRecordingActiveRef.current,
    durationMs: activeDurationMs,
    transcript,
    sttSupported: canUseSpeechRecording,
    permissionWarning,
    setPermissionWarning,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
