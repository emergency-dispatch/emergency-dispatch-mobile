import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Images,
  X,
  Send,
  Clock,
  Trash2,
  FileText,
  AlertTriangle,
  Mic,
  Square,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { incidentService } from '../../services/incident.service';
import { useTranslation } from 'react-i18next';
import { mediaService } from '../../services/media.service';
import { useAppStore } from '../../store/useAppStore';
import { storage } from '../../services/storage';
import { IncidentSupplementDto } from '../../types/incident';
import { AudioAttachmentCard } from './AudioAttachmentCard';
import {
  applyTranscriptToNote,
  PendingAudioDraft,
  useMobileAudioRecorder,
} from '../../hooks/useMobileAudioRecorder';

interface SupplementModalProps {
  visible: boolean;
  onClose: () => void;
  incidentId: string;
  incidentCode?: string | null;
  guestCancellationToken?: string | null;
  onSuccess?: () => void;
}

export const SupplementModal: React.FC<SupplementModalProps> = ({
  visible,
  onClose,
  incidentId,
  incidentCode,
  guestCancellationToken,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isEn = !i18n.language?.startsWith('vi');
  const { isAuthenticated } = useAppStore();

  const [note, setNote] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [audioDraft, setAudioDraft] = useState<PendingAudioDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState('');
  const lastSyncedTranscriptRef = useRef('');
  const audioRecorder = useMobileAudioRecorder((draft) => setAudioDraft(draft));

  useEffect(() => {
    const next = audioRecorder.transcript.trim();
    const prev = lastSyncedTranscriptRef.current;
    if (next === prev) return;
    lastSyncedTranscriptRef.current = next;
    if (!next) return;
    setNote((cur) => applyTranscriptToNote(cur, prev, next));
  }, [audioRecorder.transcript]);

  const maxVisualFiles = audioDraft ? 4 : 5;

  // Past supplements (authenticated only)
  const [pastSupplements, setPastSupplements] = useState<IncidentSupplementDto[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);

  const loadPastSupplements = useCallback(async () => {
    if (!incidentId || !isAuthenticated) return;
    try {
      setIsLoadingPast(true);
      const data = await incidentService.getSupplements(incidentId);
      setPastSupplements(data || []);
    } catch {
      // Non-blocking if fails or unauthorized
      setPastSupplements([]);
    } finally {
      setIsLoadingPast(false);
    }
  }, [incidentId, isAuthenticated]);

  useEffect(() => {
    if (visible && incidentId) {
      setNote('');
      setSelectedAssets([]);
      setAudioDraft(null);
      setIsSubmitting(false);
      setSubmittingStatus('');
      loadPastSupplements();
    } else if (!visible) {
      audioRecorder.cancelRecording();
    }
  }, [visible, incidentId, loadPastSupplements]);

  const handleToggleAudioRecord = async () => {
    if (audioRecorder.isRecording) {
      const draft = await audioRecorder.stopRecording();
      if (draft) {
        setAudioDraft(draft);
        setSelectedAssets((prev) => prev.slice(0, 4));
      }
      return;
    }
    if (selectedAssets.length >= 5) {
      Alert.alert(
        isEn ? 'Limit Reached' : 'Giới hạn',
        isEn ? 'Maximum 5 files allowed (up to 1 audio recording and 4 photos/videos).' : 'Tổng tối đa 5 tệp (gồm tối đa 1 ghi âm và 4 ảnh/video).'
      );
      return;
    }
    await audioRecorder.startRecording();
  };

  const handlePickCamera = async () => {
    if (selectedAssets.length >= maxVisualFiles) {
      Alert.alert(
        isEn ? 'Limit Reached' : 'Giới hạn',
        isEn ? `Maximum ${maxVisualFiles} photos or videos allowed.` : `Chỉ được chọn tối đa ${maxVisualFiles} ảnh hoặc video.`
      );
      return;
    }
    const asset = await mediaService.pickFromCamera();
    if (asset) {
      setSelectedAssets((prev) => [...prev, asset].slice(0, maxVisualFiles));
    }
  };

  const handlePickLibrary = async () => {
    if (selectedAssets.length >= maxVisualFiles) {
      Alert.alert(
        isEn ? 'Limit Reached' : 'Giới hạn',
        isEn ? `Maximum ${maxVisualFiles} photos or videos allowed.` : `Chỉ được chọn tối đa ${maxVisualFiles} ảnh hoặc video.`
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isEn ? 'Library Permission' : 'Quyền thư viện',
          isEn ? 'Please allow photo/video library access in device settings.' : 'Vui lòng cấp quyền truy cập ảnh/video trong cài đặt thiết bị.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: maxVisualFiles - selectedAssets.length,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAssets((prev) => [...prev, ...result.assets].slice(0, maxVisualFiles));
      }
    } catch (err: any) {
      Alert.alert(
        isEn ? 'File Picker Error' : 'Lỗi chọn tệp',
        err.message || (isEn ? 'Unable to open media library.' : 'Không thể mở thư viện.')
      );
    }
  };

  const handleRemoveAsset = (index: number) => {
    setSelectedAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (audioRecorder.isRecording) {
      Alert.alert(
        isEn ? 'Recording Active' : 'Đang ghi âm',
        isEn ? 'Please stop recording before sending additional information.' : 'Vui lòng dừng ghi âm trước khi gửi thông tin bổ sung.'
      );
      return;
    }
    const trimmedNote = note.trim();
    if (!trimmedNote && selectedAssets.length === 0 && !audioDraft) {
      Alert.alert(
        isEn ? 'Missing Details' : 'Thiếu thông tin',
        isEn ? 'Please enter a note or attach at least 1 photo/video/audio file.' : 'Vui lòng nhập ghi chú hoặc đính kèm ít nhất 1 ảnh/video/ghi âm.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmittingStatus(isEn ? 'Preparing update...' : 'Đang chuẩn bị gửi thông tin...');

      // 1. Upload files first via POST /api/media/upload
      const uploadedUrls: string[] = [];
      for (let i = 0; i < selectedAssets.length; i++) {
        setSubmittingStatus(
          isEn ? `Uploading file ${i + 1}/${selectedAssets.length}...` : `Đang tải lên tệp ${i + 1}/${selectedAssets.length}...`
        );
        const url = await mediaService.uploadMedia(selectedAssets[i]);
        if (url) uploadedUrls.push(url);
      }

      const audioAttachments = [];
      if (audioDraft?.uri) {
        setSubmittingStatus(isEn ? 'Uploading audio recording...' : 'Đang tải lên đoạn ghi âm...');
        audioAttachments.push(await mediaService.uploadAudioAttachment(audioDraft));
      }

      setSubmittingStatus(isEn ? 'Saving update...' : 'Đang lưu thông tin bổ sung...');

      // 2. Resolve guest token if not passed in props
      let resolvedToken = guestCancellationToken;
      if (!resolvedToken) {
        resolvedToken = (await storage.getItem<string>('GUEST_CANCEL_TOKEN_' + incidentId)) || undefined;
      }

      // 3. Call POST /api/incidents/{id}/supplements
      await incidentService.addSupplement(incidentId, {
        note: trimmedNote || undefined,
        mediaUrls: uploadedUrls,
        audioAttachments: audioAttachments.length > 0 ? audioAttachments : undefined,
        guestCancellationToken: resolvedToken || undefined,
      });

      Alert.alert(
        isEn ? 'Success' : 'Thành công',
        isEn ? 'Your additional details have been forwarded to the dispatch center.' : 'Thông tin bổ sung của bạn đã được chuyển tới trung tâm điều phối.'
      );
      setNote('');
      setSelectedAssets([]);
      setAudioDraft(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (isEn ? 'Unable to send additional details.' : 'Không thể bổ sung thông tin.');
      Alert.alert(isEn ? 'Notice' : 'Thông báo', msg);
    } finally {
      setIsSubmitting(false);
      setSubmittingStatus('');
    }
  };

  const formatSupplementTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
      return iso;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 18) }]}>
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{isEn ? 'ADD SCENE DETAILS' : 'BỔ SUNG THÔNG TIN HIỆN TRƯỜNG'}</Text>
                <Text style={styles.subtitle}>
                  {isEn ? 'Incident' : 'Sự cố'} {incidentCode || (incidentId ? `#${incidentId.slice(0, 8).toUpperCase()}` : '')}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Unified Note + Audio Recorder Section */}
              <View style={styles.section}>
                <View style={styles.mediaLabelRow}>
                  <Text style={styles.sectionLabel}>
                    {isEn ? 'Additional Notes & Audio (≤30s)' : 'Ghi chú & Ghi âm bổ sung (≤30s)'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pickBtn,
                      { flex: 0, paddingHorizontal: 12, paddingVertical: 6 },
                      audioRecorder.isRecording && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                    ]}
                    onPress={handleToggleAudioRecord}
                    activeOpacity={0.75}
                  >
                    {audioRecorder.isRecording ? (
                      <>
                        <Square size={13} color="#DC2626" />
                        <Text style={[styles.pickBtnText, { color: '#DC2626', fontSize: 12 }]}>
                          {isEn ? 'Stop' : 'Dừng'} ({Math.min(30, Math.floor(audioRecorder.durationMs / 1000))}s)
                        </Text>
                      </>
                    ) : (
                      <>
                        <Mic size={13} color="#0284C7" />
                        <Text style={[styles.pickBtnText, { fontSize: 12 }]}>
                          {audioDraft ? (isEn ? 'Re-record' : 'Ghi lại') : (isEn ? 'Record' : 'Ghi âm')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {audioRecorder.permissionWarning ? (
                  <Text style={{ fontSize: 11.5, color: '#B45309' }}>
                    {audioRecorder.permissionWarning}
                  </Text>
                ) : null}

                {audioDraft && (
                  <View style={{ marginBottom: 8 }}>
                    <AudioAttachmentCard
                      compact
                      localUri={audioDraft.uri}
                      durationSeconds={audioDraft.durationSeconds}
                      title={isEn ? 'Additional audio clip' : 'Bản ghi âm bổ sung'}
                      onRemove={() => setAudioDraft(null)}
                    />
                  </View>
                )}

                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={isEn ? 'Describe the scene or tap keyboard mic to dictate...' : 'Mô tả tình hình hoặc bấm nút micro trên bàn phím để nói thành chữ...'}
                  placeholderTextColor="#94A3B8"
                  style={styles.noteInput}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={4000}
                />
                <Text style={styles.charCount}>{note.length}/4000</Text>
              </View>

              {/* Media picker */}
              <View style={styles.section}>
                <View style={styles.mediaLabelRow}>
                  <Text style={styles.sectionLabel}>{isEn ? 'Scene Photos / Videos' : 'Ảnh / Video hiện trường'}</Text>
                  <Text style={styles.mediaCount}>
                    {selectedAssets.length + (audioDraft ? 1 : 0)}/5 {isEn ? 'files' : 'tệp'}
                  </Text>
                </View>

                {/* Media thumbnail grid */}
                {selectedAssets.length > 0 && (
                  <View style={styles.thumbnailsGrid}>
                    {selectedAssets.map((asset, idx) => (
                      <View key={idx} style={styles.thumbnailWrapper}>
                        <Image source={{ uri: asset.uri }} style={styles.thumbnailImage} />
                        <TouchableOpacity
                          style={styles.removeThumbnailBtn}
                          onPress={() => handleRemoveAsset(idx)}
                          activeOpacity={0.8}
                        >
                          <X size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Pick buttons */}
                {selectedAssets.length < maxVisualFiles && (
                  <View style={styles.pickButtonsRow}>
                    <TouchableOpacity
                      style={styles.pickBtn}
                      onPress={handlePickCamera}
                      activeOpacity={0.7}
                    >
                      <Camera size={16} color="#0284C7" />
                      <Text style={styles.pickBtnText}>{isEn ? 'Take Photo' : 'Chụp ảnh'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickBtn}
                      onPress={handlePickLibrary}
                      activeOpacity={0.7}
                    >
                      <Images size={16} color="#059669" />
                      <Text style={[styles.pickBtnText, { color: '#059669' }]}>
                        {isEn ? 'Choose from Library' : 'Chọn từ thư viện'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Past supplements history (authenticated only) */}
              {isAuthenticated && (
                <View style={styles.pastSection}>
                  <Text style={styles.pastSectionTitle}>
                    {isEn ? 'Previously Sent Updates' : 'Lịch sử các lần bổ sung đã gửi'}
                  </Text>
                  {isLoadingPast ? (
                    <ActivityIndicator size="small" color="#64748B" style={{ marginVertical: 10 }} />
                  ) : pastSupplements.length === 0 ? (
                    <Text style={styles.emptyPastText}>
                      {isEn ? 'No prior updates submitted yet.' : 'Chưa có thông tin bổ sung nào trước đó.'}
                    </Text>
                  ) : (
                    <View style={styles.pastList}>
                      {pastSupplements.map((item, idx) => (
                        <View key={item.id || idx} style={styles.pastCard}>
                          <View style={styles.pastCardHeader}>
                            <Clock size={12} color="#64748B" />
                            <Text style={styles.pastCardTime}>{formatSupplementTime(item.createdAt)}</Text>
                            {item.reporterName && (
                              <Text style={styles.pastCardAuthor}>• {item.reporterName}</Text>
                            )}
                          </View>
                          {item.note ? (
                            <Text style={styles.pastCardNote}>{item.note}</Text>
                          ) : null}
                          {item.mediaUrls && item.mediaUrls.length > 0 && (
                            <View style={styles.pastMediaRow}>
                              {item.mediaUrls.map((mUrl, mIdx) => (
                                <Image
                                  key={mIdx}
                                  source={{ uri: mUrl }}
                                  style={styles.pastMediaThumb}
                                />
                              ))}
                            </View>
                          )}
                          {item.audioAttachments && item.audioAttachments.length > 0 && (
                            <View style={{ marginTop: 6, gap: 6 }}>
                              {item.audioAttachments.map((aud) => (
                                <AudioAttachmentCard
                                  key={aud.id}
                                  compact
                                  durationSeconds={aud.durationSeconds}
                                  transcript={aud.transcript}
                                  transcriptionStatus={aud.transcriptionStatus}
                                  resolvePlaybackUrl={() =>
                                    incidentService.getSupplementAudioPlaybackUrl(incidentId, item.id, aud.id)
                                  }
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>{submittingStatus || (isEn ? 'Sending...' : 'Đang gửi...')}</Text>
                  </View>
                ) : (
                  <View style={styles.submittingRow}>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>{isEn ? 'SUBMIT ADDITIONAL DETAILS' : 'GỬI THÔNG TIN BỔ SUNG'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 14,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 85,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'right',
  },
  mediaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  thumbnailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeThumbnailBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  pastSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  pastSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  emptyPastText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  pastList: {
    gap: 8,
  },
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  pastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pastCardTime: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  pastCardAuthor: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  pastCardNote: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
  },
  pastMediaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  pastMediaThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
