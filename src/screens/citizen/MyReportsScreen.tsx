import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Calendar,
  XCircle,
  Navigation,
  Truck,
  PhoneCall,
  X,
} from 'lucide-react-native';
import { incidentService } from '../../services/incident.service';
import { CitizenTracking, IncidentResponseDto, IncidentStatus, SeverityLevel } from '../../types/incident';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { storage } from '../../services/storage';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export const MyReportsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAppStore();
  const { profile } = useProfileStore();

  const [incidents, setIncidents] = useState<IncidentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      let items: IncidentResponseDto[] = [];
      const localCachedIncidents = (await storage.getItem<IncidentResponseDto[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];

      // 1. Nếu đã đăng nhập: Gọi API chuyên biệt theo quyền hạn
      if (isAuthenticated) {
        if (user?.role === 'staff') {
          // Staff / Operator
          try {
            const result = await incidentService.getIncidents({ pageSize: 50 });
            items = result.items || [];
          } catch {
            // fallback
          }
        } else {
          // Citizen: Gọi endpoint GET /api/incidents/my-reports dành riêng cho công dân (tránh 403 Forbidden)
          try {
            const result = await incidentService.getMyReports({ pageSize: 50 });
            items = (result.items || []).map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              locationAddress: item.locationAddress,
              latitude: item.latitude || 0,
              longitude: item.longitude || 0,
              status: item.status,
              severity: item.severity,
              createdAt: item.reportedAt,
              updatedAt: item.reportedAt,
              verifiedAt: item.verifiedAt,
              mediaItems: (item.mediaUrls || []).map((url, idx) => ({
                id: `${item.id}-media-${idx}`,
                mediaUrl: url,
                mediaType: url.toLowerCase().endsWith('.mp4') ? 'Video' : 'Image',
              })),
            } as IncidentResponseDto));
          } catch (err) {
            console.warn('Lỗi tải my-reports:', err);
          }
        }
      }

      // 2. Bổ sung các sự cố lưu tạm từ thiết bị này (kể cả khi báo SOS ẩn danh / chưa đăng nhập)
      const existingIdSet = new Set(items.map((i) => i.id));
      for (const cached of localCachedIncidents) {
        if (!existingIdSet.has(cached.id)) {
          items.push(cached);
          existingIdSet.add(cached.id);
        }
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setIncidents(items);
    } catch (err) {
      console.warn('Không thể tải lịch sử sự cố:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIncidents();
  };

  const handleCancelReport = (incidentId: string) => {
    Alert.alert(
      t('reports.cancel_title', 'Hủy Báo Cáo Sự Cố'),
      t('reports.cancel_confirm_message', 'Bạn có chắc chắn muốn hủy yêu cầu cứu hộ cho sự cố này không?'),
      [
        { text: t('common.cancel', 'Quay lại'), style: 'cancel' },
        {
          text: t('reports.cancel_confirm_btn', 'Xác nhận hủy'),
          style: 'destructive',
          onPress: async () => {
            try {
              await incidentService.cancelIncident(incidentId, 'Người dân tự hủy báo cáo');
              Alert.alert(t('common.success', 'Thành công'), t('reports.cancel_success', 'Đã hủy báo cáo sự cố thành công.'));
              fetchIncidents();
            } catch (err: any) {
              Alert.alert(t('common.error', 'Lỗi'), err.message || t('reports.cancel_failed', 'Không thể hủy sự cố này.'));
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.Cancelled:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
            <XCircle size={13} color="#64748B" />
            <Text style={[styles.statusText, { color: '#64748B' }]}>{t('reports.status_cancelled', 'Đã hủy')}</Text>
          </View>
        );
      case IncidentStatus.Completed:
        return (
          <View style={[styles.statusBadge, styles.statusResolved]}>
            <ShieldCheck size={13} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>{t('reports.status_completed')}</Text>
          </View>
        );
      case IncidentStatus.Dispatched:
      case IncidentStatus.InProgress:
        return (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(220, 38, 38, 0.12)' }]}>
            <AlertTriangle size={13} color="#DC2626" />
            <Text style={[styles.statusText, { color: '#DC2626' }]}>{t('reports.status_dispatched', 'Đang xử lý')}</Text>
          </View>
        );
      case IncidentStatus.Verified:
        return (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
            <CheckCircle2 size={13} color="#0284C7" />
            <Text style={[styles.statusText, { color: '#0284C7' }]}>{t('reports.status_verified')}</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock size={13} color="#64748B" />
            <Text style={[styles.statusText, { color: '#64748B' }]}>{t('reports.status_pending')}</Text>
          </View>
        );
    }
  };


  const getLocalizedTitle = (title?: string) => {
    if (!title) return t('reports.default_title', 'Sự Cố Khẩn Cấp');
    const lower = title.toLowerCase();
    if (lower.includes('báo động sos') || lower.includes('sos')) {
      return t('reports.sos_alarm', 'Báo động SOS Khẩn cấp');
    }
    if (lower.includes('hỏa hoạn') || lower.includes('cháy') || lower.includes('fire')) {
      return t('reports.fire_hazard', 'Sự Cố Hỏa Hoạn');
    }
    if (lower.includes('tai nạn') || lower.includes('accident')) {
      return t('reports.accident_hazard', 'Tai Nạn Khẩn Cấp');
    }
    if (lower.includes('y tế') || lower.includes('cấp cứu') || lower.includes('medical')) {
      return t('reports.medical_hazard', 'Cấp Cứu Y Tế');
    }
    if (lower.includes('sự cố khẩn cấp') || lower.includes('khẩn cấp')) {
      return t('reports.emergency_hazard', 'Sự Cố Khẩn Cấp');
    }
    return title;
  };

  const getLocalizedDescription = (desc?: string) => {
    if (!desc) return '';
    const lower = desc.toLowerCase();
    if (lower.includes('không kèm ảnh') || lower.includes('tức thời')) {
      return t('sos.default_description_no_media', 'Người dân kích hoạt báo động SOS tức thời.');
    }
    if (lower.includes('đè nút sos') || lower.includes('kích hoạt báo động khẩn cấp')) {
      return t('sos.default_description', 'Người dân kích hoạt báo động khẩn cấp.');
    }
    return desc;
  };

  const getLocalizedUnitType = (unitType?: string) => {
    if (!unitType) return t('reports.default_unit_type', 'Xe Cứu Hộ');
    const lower = unitType.toLowerCase();
    if (lower.includes('ambulance') || lower.includes('thương')) return t('reports.unit_ambulance', 'Xe Cứu Thương');
    if (lower.includes('ladder') || lower.includes('thang')) return t('reports.unit_ladder', 'Xe Thang PCCC');
    if (lower.includes('fire') || lower.includes('hỏa')) return t('reports.unit_fire', 'Xe Cứu Hỏa');
    if (lower.includes('police') || lower.includes('sát')) return t('reports.unit_police', 'Xe Cảnh Sát');
    if (lower.includes('boat') || lower.includes('xuồng') || lower.includes('thuyền')) return t('reports.unit_boat', 'Xuồng Cứu Nạn');
    if (lower.includes('heavy') || lower.includes('nặng')) return t('reports.unit_heavy', 'Xe Cứu Hộ Hạng Nặng');
    return unitType;
  };

  const getLocalizedDispatchStatus = (status?: string) => {
    switch (status) {
      case 'EnRoute':
        return t('reports.dispatch_en_route', 'ĐANG DI CHUYỂN ĐẾN');
      case 'OnScene':
        return t('reports.dispatch_on_scene', 'ĐÃ ĐẾN HIỆN TRƯỜNG');
      case 'Dispatched':
        return t('reports.dispatch_dispatched', 'ĐÃ ĐIỀU PHỐI');
      case 'Accepted':
        return t('reports.dispatch_accepted', 'ĐÃ TIẾP NHẬN');
      case 'Completed':
        return t('reports.dispatch_completed', 'ĐÃ HOÀN THÀNH');
      default:
        return status || '';
    }
  };

  const handleOpenTracking = (incident: IncidentResponseDto) => {
    navigation.navigate('SafetyMapTab', { trackingIncidentId: incident.id });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('reports.title')}</Text>
        <Text style={styles.subtitle}>{t('reports.subtitle')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>{t('reports.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#DC2626']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t('reports.empty_title')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('reports.empty_sub')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemCode}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <View style={styles.headerBadges}>
                  {getStatusBadge(item.status)}
                </View>
              </View>

              <Text style={styles.itemType}>{getLocalizedTitle(item.title)}</Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {getLocalizedDescription(item.description)}
                </Text>
              ) : null}

              {/* AI Insight Box */}
              {item.aiClassification?.summary && (
                <View style={styles.aiBox}>
                  <View style={styles.aiHeader}>
                    <Sparkles size={13} color="#0284C7" />
                    <Text style={styles.aiTitle}>{t('reports.ai_insight')}</Text>
                  </View>
                  <Text style={styles.aiSummary}>{item.aiClassification.summary}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.footerRow}>
                  <MapPin size={13} color="#64748B" />
                  <Text style={styles.footerText} numberOfLines={1}>
                    {item.locationAddress}
                  </Text>
                </View>

                <View style={styles.footerMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={12} color="#94A3B8" />
                    <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                  </View>
                  {item.mediaItems && item.mediaItems.length > 0 && (
                    <View style={styles.metaItem}>
                      <ImageIcon size={12} color="#0284C7" />
                      <Text style={[styles.metaText, { color: '#0284C7', fontWeight: '700' }]}>
                        {t('reports.images_count', { count: item.mediaItems.length })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions row: Tracking & Cancel */}
                <View style={styles.actionRowContainer}>
                  {(item.status === IncidentStatus.Dispatched || item.status === IncidentStatus.InProgress) && (
                    <TouchableOpacity
                      style={styles.trackingBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenTracking(item)}
                    >
                      <Navigation size={13} color="#FFFFFF" />
                      <Text style={styles.trackingBtnText}>{t('reports.track_unit_btn', 'Theo dõi xe cứu hộ')}</Text>
                    </TouchableOpacity>
                  )}

                  {item.status !== IncidentStatus.Completed && item.status !== IncidentStatus.Cancelled && (
                    <TouchableOpacity
                      style={styles.cancelIncidentBtn}
                      activeOpacity={0.7}
                      onPress={() => handleCancelReport(item.id)}
                    >
                      <XCircle size={13} color="#DC2626" />
                      <Text style={styles.cancelIncidentBtnText}>{t('reports.cancel_report_btn', 'Hủy báo cáo này')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusDispatched: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  aiBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  aiSummary: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionRowContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  trackingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
    alignItems: 'flex-end',
  },
  cancelIncidentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelIncidentBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  truckIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  modalLoadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  modalLoadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalErrorWrap: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
  },
  modalErrorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalErrorText: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  trackingContent: {
    marginVertical: 14,
    gap: 12,
  },
  heroStatusBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  heroStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatusLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  heroStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FBBF24',
    marginTop: 2,
  },
  vehicleInfoBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  callStationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
  },
  callStationBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  closeDoneBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  closeDoneBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
});
