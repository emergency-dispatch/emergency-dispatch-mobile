import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  XCircle,
  Sparkles,
  X,
  Link2,
  Split,
  PlusCircle,
  Navigation,
} from 'lucide-react-native';
import { IncidentResponseDto } from '../../types/incident';
import { useTranslation } from 'react-i18next';
import { incidentService } from '../../services/incident.service';
import { storage } from '../../services/storage';
import { SupplementModal } from './SupplementModal';

interface SosSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelIncident?: (incidentId: string) => Promise<void> | void;
  onUnlink?: (incidentId: string) => Promise<void> | void;
  onTrackOriginal?: (linkedIncidentId: string) => void;
  address: string;
  incident?: IncidentResponseDto | null;
}

export const SosSuccessModal: React.FC<SosSuccessModalProps> = ({
  visible,
  onClose,
  onCancelIncident,
  onUnlink,
  onTrackOriginal,
  address,
  incident,
}) => {
  const { t } = useTranslation();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSupplementOpen, setIsSupplementOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible) {
      setSecondsElapsed(0);
      setIsCancelling(false);
      setShowCancelConfirm(false);
      setIsUnlinking(false);
      Vibration.vibrate([0, 250, 100, 250]);
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const handleConfirmCancel = async () => {
    if (incident?.id && onCancelIncident) {
      setIsCancelling(true);
      try {
        await onCancelIncident(incident.id);
      } catch (err: any) {
        console.warn('Cancel incident error:', err);
      } finally {
        setIsCancelling(false);
        setShowCancelConfirm(false);
      }
    } else {
      onClose();
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      t('sos_modal.unlink_confirm_title', 'Tách thành sự cố riêng?'),
      t(
        'sos_modal.unlink_confirm_desc',
        'Nếu đây là sự cố khác độc lập, hệ thống sẽ đưa báo cáo của bạn vào hàng đợi tiếp nhận mới.'
      ),
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận tách',
          style: 'destructive',
          onPress: async () => {
            if (!incident?.id) return;
            try {
              setIsUnlinking(true);
              let guestToken = incident.guestCancellationToken;
              if (!guestToken) {
                guestToken = await storage.getItem<string>('GUEST_CANCEL_TOKEN_' + incident.id);
              }
              await incidentService.unlinkIncident(incident.id, undefined, guestToken || undefined);
              Alert.alert('Thành công', t('sos_modal.unlink_success', 'Đã tách sự cố thành công.'));
              onUnlink?.(incident.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể tách báo cáo.');
            } finally {
              setIsUnlinking(false);
            }
          },
        },
      ]
    );
  };

  const handleTrackOriginal = () => {
    if (incident?.linkedTo?.incidentId && onTrackOriginal) {
      onTrackOriginal(incident.linkedTo.incidentId);
    }
    onClose();
  };

  const isLinked = Boolean(incident?.linkedTo);
  const incidentCode = incident
    ? `#${incident.id.slice(0, 8).toUpperCase()}`
    : `#SOS-${(Date.now() % 100000).toString()}`;

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Top-Right Close Button (X) */}
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible={true}
              accessibilityLabel="Đóng thông báo SOS"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>

            {/* Top Status Icon */}
            <View style={[styles.iconCircle, isLinked && styles.iconCircleLinked]}>
              {isLinked ? (
                <Link2 size={40} color="#4F46E5" strokeWidth={2.4} />
              ) : (
                <ShieldAlert size={44} color="#DC2626" strokeWidth={2.5} />
              )}
            </View>

            <Text style={[styles.alertHeader, isLinked && { color: '#4F46E5' }]}>
              {isLinked
                ? t('sos_modal.linked_alert_title', 'SỰ CỐ NÀY ĐÃ ĐƯỢC BÁO')
                : t('sos_modal.sos_success_title')}
            </Text>
            <Text style={styles.alertCode}>{incidentCode}</Text>

            {isLinked && incident?.linkedTo ? (
              /* Linked Incident Details Card */
              <View style={styles.linkedInfoBox}>
                <Text style={styles.linkedSubText}>
                  {t('sos_modal.linked_alert_sub', 'Hệ thống phát hiện một sự cố tương tự đang được xử lý gần bạn:')}
                </Text>
                <View style={styles.linkedDetailRow}>
                  <Text style={styles.linkedDetailTitle}>{incident.linkedTo.title}</Text>
                </View>
                <Text style={styles.linkedDetailAddress} numberOfLines={2}>
                  {incident.linkedTo.locationAddress}
                </Text>
                <View style={styles.linkedMetaRow}>
                  <Text style={styles.linkedMetaText}>
                    📍 {t('sos_modal.linked_distance', { distance: incident.linkedTo.distanceMeters })}
                  </Text>
                </View>
                <View style={styles.linkedUnitsBadge}>
                  <Text style={styles.linkedUnitsText}>
                    🚒 {incident.linkedTo.assignedUnitPlates && incident.linkedTo.assignedUnitPlates.length > 0
                      ? t('sos_modal.linked_assigned_units', {
                          units: incident.linkedTo.assignedUnitPlates.join(', '),
                        })
                      : t('sos_modal.linked_no_units', 'Chưa có xe xuất phát')}
                  </Text>
                </View>
              </View>
            ) : (
              /* Standard Status checklist */
              <View style={styles.statusBox}>
                <View style={styles.statusRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.statusText}>{t('sos_modal.gps_sent_success')}</Text>
                </View>
                <View style={styles.statusRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.statusText}>{t('sos_modal.connected_rescue')}</Text>
                </View>
                {incident?.aiClassification?.isSuccess === true &&
                  incident.aiClassification.eventType !== 'None' &&
                  Boolean(incident.aiClassification.summary) &&
                  !/không thể phân loại|cần operator|đánh giá thủ công|unclassified|needshumanreview/i.test(
                    incident.aiClassification.summary || ''
                  ) && (
                    <View style={[styles.statusRow, { alignItems: 'flex-start' }]}>
                      <Sparkles size={16} color="#0284C7" style={{ marginTop: 2 }} />
                      <Text style={[styles.statusText, { color: '#0284C7', flex: 1 }]}>
                        Thông tin hiện trường: {incident.aiClassification.summary.replace(/^\[.*?\]\s*/, '')}
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Location box */}
            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>{t('sos_modal.scene_location')}</Text>
              <Text style={styles.locationAddress}>{address}</Text>
              <Text style={styles.timerText}>{t('sos_modal.signal_time', { time: secondsElapsed })}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {isLinked ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.trackOriginalBtn}
                    onPress={handleTrackOriginal}
                  >
                    <Navigation size={17} color="#FFFFFF" />
                    <Text style={styles.trackOriginalBtnText}>
                      {t('sos_modal.btn_track_original', 'Theo dõi sự cố gốc')}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.linkedActionGrid}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.supplementBtnSecondary}
                      onPress={() => setIsSupplementOpen(true)}
                    >
                      <PlusCircle size={16} color="#0284C7" />
                      <Text style={styles.supplementBtnSecondaryText}>
                        {t('sos_modal.btn_supplement', 'Bổ sung thông tin')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.unlinkBtn}
                      onPress={handleUnlink}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <>
                          <Split size={16} color="#DC2626" />
                          <Text style={styles.unlinkBtnText}>
                            {t('sos_modal.btn_unlink', 'Đây là sự cố khác')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.callButton}
                    onPress={onClose}
                  >
                    <PhoneCall size={18} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>{t('sos_modal.call_hotline_btn')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.supplementBtnPrimary}
                    onPress={() => setIsSupplementOpen(true)}
                  >
                    <PlusCircle size={16} color="#0284C7" />
                    <Text style={styles.supplementBtnPrimaryText}>
                      {t('sos_modal.btn_supplement', 'Bổ sung thông tin')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.dismissButton}
                    onPress={onClose}
                  >
                    <Text style={styles.dismissButtonText}>{t('sos_modal.dismiss_follow_btn')}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Cancel Alarm Button & Confirm Box */}
              {!isLinked && (
                showCancelConfirm ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>
                      {t('sos_modal.confirm_cancel_title', { defaultValue: 'Hủy Báo Động SOS?' })}
                    </Text>
                    <Text style={styles.confirmDesc}>
                      {t('sos_modal.confirm_cancel_desc', { defaultValue: 'Bạn có chắc muốn hủy tín hiệu vì bấm nhầm?' })}
                    </Text>
                    <View style={styles.confirmButtonsRow}>
                      <TouchableOpacity
                        style={styles.keepButton}
                        onPress={() => setShowCancelConfirm(false)}
                      >
                        <Text style={styles.keepButtonText}>
                          {t('sos_modal.keep_signal', { defaultValue: 'Không, giữ lại' })}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmCancelButton}
                        onPress={handleConfirmCancel}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.confirmCancelButtonText}>
                            {t('sos_modal.confirm_cancel_btn', { defaultValue: 'Xác nhận hủy' })}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cancelButton}
                    onPress={() => setShowCancelConfirm(true)}
                    disabled={isCancelling}
                  >
                    <XCircle size={16} color="#DC2626" />
                    <Text style={styles.cancelButtonText}>{t('sos_modal.cancel_accident')}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Supplement Modal */}
      {incident?.id && (
        <SupplementModal
          visible={isSupplementOpen}
          onClose={() => setIsSupplementOpen(false)}
          incidentId={incident.id}
          guestCancellationToken={incident.guestCancellationToken}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  alertHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  alertCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '600',
  },
  locationBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  dismissButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  closeIconButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  confirmBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  confirmDesc: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  keepButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconCircleLinked: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  linkedInfoBox: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  linkedSubText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  linkedDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedDetailTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  linkedDetailAddress: {
    fontSize: 12,
    color: '#475569',
  },
  linkedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedMetaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3730A3',
  },
  linkedUnitsBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  linkedUnitsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  trackOriginalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  trackOriginalBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  linkedActionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  supplementBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  supplementBtnSecondaryText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  unlinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  unlinkBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  supplementBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  supplementBtnPrimaryText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
});
