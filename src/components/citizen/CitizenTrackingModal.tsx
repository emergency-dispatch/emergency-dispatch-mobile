import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Truck,
  Shield,
  X,
  Clock,
  Navigation,
  MapPin,
  Phone,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { incidentService } from '../../services/incident.service';
import type { CitizenTracking } from '../../types/incident';

export interface CitizenTrackingModalProps {
  visible: boolean;
  incidentId: string | null;
  onClose: () => void;
  onOpenSupplement?: (incidentId: string) => void;
  onOpenMap?: (incidentId: string) => void;
}

export const CitizenTrackingModal: React.FC<CitizenTrackingModalProps> = ({
  visible,
  incidentId,
  onClose,
  onOpenSupplement,
  onOpenMap,
}) => {
  const { t } = useTranslation();

  const [tracking, setTracking] = useState<CitizenTracking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const stopPollingRef = useRef<boolean>(false);

  const fetchTracking = useCallback(
    async (isSilent = false) => {
      if (!incidentId || (stopPollingRef.current && isSilent)) return;

      try {
        if (!isSilent) setIsLoading(true);
        const data = await incidentService.getTracking(incidentId);
        if (data) {
          setTracking(data);
          setErrorMsg(null);
          setIsForbidden(false);
        }
      } catch (err: any) {
        const status = err?.response?.status || err?.status;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Chưa thể lấy thông tin điều phối xe cứu hộ.';

        if (status === 403 || msg.includes('403') || msg.toLowerCase().includes('không có quyền')) {
          stopPollingRef.current = true;
          setIsForbidden(true);
          setErrorMsg(
            'Máy chủ đang giới hạn quyền theo dõi trực tiếp sự cố gốc này (Backend chưa phân quyền cho tài khoản báo trùng).'
          );
        } else if (!isSilent) {
          setErrorMsg(msg);
        }
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    },
    [incidentId]
  );

  useEffect(() => {
    if (visible && incidentId) {
      stopPollingRef.current = false;
      setIsForbidden(false);
      setErrorMsg(null);
      fetchTracking(false);

      const interval = setInterval(() => {
        if (!stopPollingRef.current) {
          fetchTracking(true);
        }
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setTracking(null);
      setIsLoading(true);
      setErrorMsg(null);
      setIsForbidden(false);
      stopPollingRef.current = false;
    }
  }, [visible, incidentId, fetchTracking]);

  if (!visible || !incidentId) return null;

  const incidentCode = `#INC-${incidentId.slice(0, 8).toUpperCase()}`;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OnScene':
        return { label: 'Đã đến hiện trường', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'EnRoute':
        return { label: 'Đang di chuyển tới', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'Accepted':
        return { label: 'Đã nhận nhiệm vụ', bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      case 'Dispatched':
        return { label: 'Đang điều động xe', bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'Completed':
        return { label: 'Đã hoàn thành', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'Cancelled':
        return { label: 'Đã hủy', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      default:
        return { label: 'Đang xử lý', bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' };
    }
  };

  const statusBadge = getStatusBadge(tracking?.dispatchStatus || tracking?.incidentStatus);

  const handleCallHotline = () => {
    const phone = tracking?.stationPhoneNumber || '114';
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleGroup}>
              <View style={styles.truckIconBadge}>
                <Truck size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {t('reports.tracking_modal_title', 'Thông Tin Sự Cố & Điều Phối')}
                </Text>
                <Text style={styles.modalSubtitle}>{incidentCode}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && !tracking ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={styles.loadingText}>
                  {t('reports.loading_tracking', 'Đang tải thông tin xe cứu hộ...')}
                </Text>
              </View>
            ) : errorMsg && !tracking ? (
              <View style={styles.errorWrap}>
                <AlertTriangle size={24} color={isForbidden ? '#D97706' : '#DC2626'} />
                <Text style={[styles.errorTitle, isForbidden && { color: '#B45309' }]}>
                  {isForbidden
                    ? 'Giới hạn quyền theo dõi'
                    : 'Không thể tải thông tin điều phối'}
                </Text>
                <Text style={[styles.errorText, isForbidden && { color: '#92400E' }]}>
                  {errorMsg}
                </Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => fetchTracking(false)}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={13} color="#475569" />
                    <Text style={styles.retryBtnText}>Thử lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callStationSmallBtn}
                    onPress={handleCallHotline}
                    activeOpacity={0.8}
                  >
                    <Phone size={13} color="#FFFFFF" />
                    <Text style={styles.callStationSmallBtnText}>Gọi 114</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.trackingContent}>
                {/* Warning banner if forbidden warning present on loaded data */}
                {errorMsg && (
                  <View style={styles.warningBanner}>
                    <AlertTriangle size={14} color="#D97706" />
                    <Text style={styles.warningBannerText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Hero Telemetry Status Box */}
                <View style={styles.heroStatusBox}>
                  <View style={styles.heroStatusRow}>
                    <Text style={styles.heroStatusLabel}>TIẾN ĐỘ ỨNG CỨU</Text>
                    <View
                      style={[
                        styles.heroStatusBadge,
                        { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                      ]}
                    >
                      <Text style={[styles.heroStatusBadgeText, { color: statusBadge.text }]}>
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroStatsGrid}>
                    <View style={styles.heroStatItem}>
                      <View style={styles.heroStatLabelWrap}>
                        <Clock size={12} color="#D97706" />
                        <Text style={styles.heroStatLabel}>DỰ KIẾN (ETA)</Text>
                      </View>
                      <Text style={styles.heroStatValue}>
                        ~{tracking?.estimatedArrivalMinutes || 1}{' '}
                        <Text style={styles.heroStatUnit}>phút</Text>
                      </Text>
                    </View>

                    <View style={styles.heroStatItem}>
                      <View style={styles.heroStatLabelWrap}>
                        <Navigation size={12} color="#0284C7" />
                        <Text style={styles.heroStatLabel}>KHOẢNG CÁCH</Text>
                      </View>
                      <Text style={[styles.heroStatValue, { color: '#0284C7' }]}>
                        {tracking?.distanceKm ? tracking.distanceKm.toFixed(1) : '0.0'}{' '}
                        <Text style={styles.heroStatUnit}>km</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Rescue Vehicle Info Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Shield size={14} color="#2563EB" />
                    <Text style={styles.infoCardTitle}>PHƯƠNG TIỆN ỨNG CỨU</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Biển số xe</Text>
                    <Text style={styles.plateBadge}>
                      {tracking?.plateNumber || '51C-001.12'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Chủng loại</Text>
                    <Text style={styles.infoValue}>
                      {tracking?.unitTypeName || 'Xe cứu hộ / Chữa cháy'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Đơn vị phụ trách</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {tracking?.stationName || 'Trung tâm Chỉ huy CAD'}
                    </Text>
                  </View>
                </View>

                {/* Incident Location Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <MapPin size={14} color="#DC2626" />
                    <Text style={styles.infoCardTitle}>ĐỊA ĐIỂM SỰ CỐ</Text>
                  </View>
                  <Text style={styles.addressText} numberOfLines={3}>
                    {tracking?.incidentAddress || 'Đang cập nhật địa chỉ...'}
                  </Text>
                  {tracking?.incidentTitle ? (
                    <Text style={styles.notesText} numberOfLines={2}>
                      {tracking.incidentTitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.actionFooter}>
            <View style={styles.footerRow}>
              {onOpenSupplement && (
                <TouchableOpacity
                  style={styles.supplementBtn}
                  onPress={() => onOpenSupplement(incidentId)}
                  activeOpacity={0.8}
                >
                  <PlusCircle size={15} color="#0284C7" />
                  <Text style={styles.supplementBtnText}>Bổ sung thông tin</Text>
                </TouchableOpacity>
              )}

              {onOpenMap && (
                <TouchableOpacity
                  style={styles.openMapBtn}
                  onPress={() => onOpenMap(incidentId)}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={15} color="#4F46E5" />
                  <Text style={styles.openMapBtnText}>Xem bản đồ lớn</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.callStationBtn}
              onPress={handleCallHotline}
              activeOpacity={0.8}
            >
              <Phone size={15} color="#FFFFFF" />
              <Text style={styles.callStationBtnText}>
                Gọi Tổng Đài Trạm ({tracking?.stationPhoneNumber || '114'})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeDoneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeDoneBtnText}>Đóng cửa sổ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  truckIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollContent: {
    padding: 18,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  errorWrap: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  callStationSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  callStationSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 16,
  },
  trackingContent: {
    gap: 12,
  },
  heroStatusBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 15,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatusLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroStatusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  heroStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
    marginTop: 2,
  },
  heroStatUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    gap: 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '65%',
  },
  plateBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'monospace',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  addressText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  notesText: {
    fontSize: 11.5,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  supplementBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
  },
  supplementBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  openMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 10,
  },
  openMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  callStationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 11,
  },
  callStationBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  closeDoneBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeDoneBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },
});

