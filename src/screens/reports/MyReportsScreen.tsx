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
} from 'lucide-react-native';
import { incidentService } from '../../services/incident.service';
import { IncidentResponseDto, IncidentStatus, SeverityLevel } from '../../types/incident';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { storage } from '../../services/storage';
import { useTranslation } from 'react-i18next';

export const MyReportsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const { profile } = useProfileStore();

  const [incidents, setIncidents] = useState<IncidentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const [result, localIds] = await Promise.all([
        incidentService.getIncidents({ pageSize: 50 }),
        storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS'),
      ]);

      const myIncidentIds = new Set(localIds || []);
      const userPhoneClean = (user?.phone || profile?.phoneNumber || '').replace(/\s+/g, '');
      const userIdClean = user?.id?.toLowerCase();

      const myItems = (result.items || []).filter((item) => {
        // Match by reported userId from JWT
        if (userIdClean && item.reportedByUserId && item.reportedByUserId.toLowerCase() === userIdClean) {
          return true;
        }
        // Match by reporter phone
        if (userPhoneClean && item.reporterPhone) {
          const itemPhoneClean = item.reporterPhone.replace(/\s+/g, '');
          if (itemPhoneClean === userPhoneClean) return true;
        }
        // Match by locally saved incident IDs
        if (myIncidentIds.has(item.id)) {
          return true;
        }
        return false;
      });

      setIncidents(myItems);
    } catch (err) {
      console.warn('Không thể tải lịch sử sự cố:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, user?.phone, profile?.phoneNumber]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIncidents();
  };

  const handleCancelReport = (incidentId: string) => {
    Alert.alert(
      'Hủy Báo Cáo Sự Cố',
      'Bạn có chắc chắn muốn hủy yêu cầu cứu hộ cho sự cố này không?',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await incidentService.cancelIncident(incidentId, 'Người dân tự hủy báo cáo');
              Alert.alert('Thành công', 'Đã hủy báo cáo sự cố thành công.');
              fetchIncidents();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy sự cố này.');
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
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <XCircle size={13} color="#DC2626" />
            <Text style={[styles.statusText, { color: '#DC2626' }]}>Đã hủy</Text>
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
          <View style={[styles.statusBadge, styles.statusDispatched]}>
            <AlertTriangle size={13} color="#F59E0B" />
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>{t('reports.status_dispatched')}</Text>
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

  const getSeverityBadge = (severity: SeverityLevel) => {
    let color = '#64748B';
    let bg = 'rgba(100, 116, 139, 0.1)';
    let label = 'Chưa phân loại';

    switch (severity) {
      case SeverityLevel.Level5:
        color = '#DC2626';
        bg = 'rgba(220, 38, 38, 0.12)';
        label = t('reports.severity_catastrophic');
        break;
      case SeverityLevel.Level4:
        color = '#EA580C';
        bg = 'rgba(234, 88, 12, 0.12)';
        label = t('reports.severity_critical');
        break;
      case SeverityLevel.Level3:
        color = '#D97706';
        bg = 'rgba(217, 119, 6, 0.12)';
        label = t('reports.severity_moderate');
        break;
      case SeverityLevel.Level2:
        color = '#2563EB';
        bg = 'rgba(37, 99, 235, 0.12)';
        label = t('reports.severity_minor');
        break;
      case SeverityLevel.Level1:
        color = '#10B981';
        bg = 'rgba(16, 185, 129, 0.12)';
        label = t('reports.severity_minimal');
        break;
    }

    return (
      <View style={[styles.severityBadge, { backgroundColor: bg }]}>
        <Text style={[styles.severityText, { color }]}>{label}</Text>
      </View>
    );
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
                  {getSeverityBadge(item.severity)}
                  {getStatusBadge(item.status)}
                </View>
              </View>

              <Text style={styles.itemType}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
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

                {item.status !== IncidentStatus.Completed && item.status !== IncidentStatus.Cancelled && (
                  <View style={styles.cancelActionRow}>
                    <TouchableOpacity
                      style={styles.cancelIncidentBtn}
                      activeOpacity={0.7}
                      onPress={() => handleCancelReport(item.id)}
                    >
                      <XCircle size={14} color="#DC2626" />
                      <Text style={styles.cancelIncidentBtnText}>Hủy báo cáo này (Bấm nhầm)</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    gap: 6,
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
});
