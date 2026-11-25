import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Mic, Pause, Play, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mediaService } from '../../services/media.service';

export interface AudioAttachmentCardProps {
  localUri?: string | null;
  uploadToken?: string | null;
  resolvePlaybackUrl?: () => Promise<{ url: string; expiresAt: string }>;
  durationSeconds?: number | null;
  transcript?: string | null;
  transcriptionStatus?: string | null;
  title?: string;
  compact?: boolean;
  onRemove?: () => void;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const AudioAttachmentCard: React.FC<AudioAttachmentCardProps> = ({
  localUri,
  uploadToken,
  resolvePlaybackUrl,
  durationSeconds,
  transcript,
  transcriptionStatus,
  title,
  compact = false,
  onRemove,
}) => {
  const { i18n } = useTranslation();
  const isEn = !i18n.language?.startsWith('vi');
  const displayTitle = title || (isEn ? 'SOS Scene Audio' : 'Ghi âm hiện trường SOS');
  const player = useAudioPlayer(localUri ? { uri: localUri } : null);
  const status = useAudioPlayerStatus(player);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resolvedRef = useRef<{ url: string; expiresAtMs: number } | null>(null);

  useEffect(() => {
    resolvedRef.current = null;
    if (localUri) {
      player.replace({ uri: localUri });
    }
  }, [localUri, player]);

  const handleTogglePlay = async () => {
    setErrorMsg(null);
    try {
      if (status.playing) {
        player.pause();
        return;
      }

      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

      if (localUri) {
        if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.1)) {
          await player.seekTo(0);
        }
        player.play();
        return;
      }

      const now = Date.now();
      let signed = resolvedRef.current;
      if (!signed || now >= signed.expiresAtMs - 10_000) {
        setIsLoadingUrl(true);
        const res = resolvePlaybackUrl
          ? await resolvePlaybackUrl()
          : uploadToken
          ? await mediaService.getAudioPreviewUrl(uploadToken)
          : null;
        if (!res?.url) {
          throw new Error(isEn ? 'No audio playback source available.' : 'Không có nguồn phát âm thanh.');
        }
        const parsedExp = Date.parse(res.expiresAt);
        signed = {
          url: res.url,
          expiresAtMs: Number.isFinite(parsedExp) ? parsedExp : now + 4 * 60_000,
        };
        resolvedRef.current = signed;
        player.replace({ uri: signed.url });
      } else if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.1)) {
        await player.seekTo(0);
      }

      player.play();
    } catch (err: any) {
      resolvedRef.current = null;
      setErrorMsg(err?.message || (isEn ? 'Unable to play audio file.' : 'Không phát được tệp âm thanh.'));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const displayDuration = status.duration > 0 ? status.duration : durationSeconds || 0;
  const trimmedTranscript = transcript?.trim();

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handleTogglePlay}
          disabled={isLoadingUrl}
          activeOpacity={0.8}
          accessibilityLabel={
            status.playing
              ? (isEn ? 'Pause recording' : 'Tạm dừng ghi âm')
              : (isEn ? 'Play recording' : 'Nghe lại ghi âm')
          }
        >
          {isLoadingUrl ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : status.playing ? (
            <Pause size={16} color="#FFFFFF" />
          ) : (
            <Play size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.metaCol}>
          <View style={styles.titleRow}>
            <Mic size={13} color="#0284C7" />
            <Text style={styles.titleText} numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>
          <Text style={styles.durationText}>
            {status.playing || status.currentTime > 0
              ? `${formatDuration(status.currentTime)} / ${formatDuration(displayDuration)}`
              : `${isEn ? 'Duration' : 'Thời lượng'} ${formatDuration(displayDuration)}`}
          </Text>
        </View>

        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => {
              try {
                player.pause();
              } catch {
                // ignore
              }
              onRemove();
            }}
            accessibilityLabel={isEn ? 'Delete recording' : 'Xóa ghi âm'}
          >
            <Trash2 size={15} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {trimmedTranscript ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>{isEn ? 'Voice Transcript' : 'Nội dung giọng nói (Transcript)'}</Text>
          <Text style={styles.transcriptText}>{trimmedTranscript}</Text>
        </View>
      ) : transcriptionStatus ? (
        <Text style={styles.statusHint}>{isEn ? 'Transcript status' : 'Trạng thái transcript'}: {transcriptionStatus}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  cardCompact: {
    padding: 8,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  durationText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  transcriptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    gap: 2,
  },
  transcriptLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  transcriptText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 17,
  },
  statusHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
