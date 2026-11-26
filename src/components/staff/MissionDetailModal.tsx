import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  FileText,
  Clock,
  MapPin,
  Building2,
  Users,
  AlertTriangle,
  HeartPulse,
  Flame,
  CheckCircle2,
  Navigation,
  Activity,
  Shield,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import { MissionItem } from '../../types/staff';
import { useAppStore } from '../../store/useAppStore';

interface MissionDetailModalProps {
  visible: boolean;
  mission: MissionItem | null;
  onClose: () => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({
  visible,
  mission,
  onClose,
}) => {
  const user = useAppStore((s) => s.user);
  const { t, i18n } = useTranslation();

  if (!mission) return null;

  const formatIncidentTitle = (title?: string | null) => {
    if (!title) return t('staff.emergency_active_title', 'Nhiệm Vụ Cứu Hộ Đã Hoàn Tất');
    if (i18n.language?.startsWith('en')) {
      const lower = title.toLowerCase();
      if (
        lower.includes('báo động') ||
        lower.includes('tín hiệu cứu nạn') ||
        lower.includes('khẩn cấp sos') ||
        lower.includes('sos') ||
        lower.includes('cứu nạn')
      ) {
        return 'Emergency SOS Distress Signal';
      }
      if (lower.includes('tai nạn') || lower.includes('liên hoàn') || lower.includes('va chạm')) {
        return 'Multi-Vehicle Traffic Collision';
      }
      if (lower.includes('suy hô hấp') || lower.includes('ngạt khói')) {
        return 'Smoke Inhalation & Respiratory Emergency';
      }
      if (lower.includes('hóa chất') || lower.includes('xe bồn')) {
        return 'Chemical Tanker Leak & Hazmat Response';
      }
      if (lower.includes('sốc nhiệt') || lower.includes('say nắng')) {
        return 'High-Angle Construction Heatstroke Emergency';
      }
      if (lower.includes('cháy') || lower.includes('hỏa hoạn')) {
        return 'Fire Suppression & Rescue Alarm';
      }
      if (lower.includes('cấp cứu') || lower.includes('nạn nhân')) {
        return 'Emergency Medical & Rescue Dispatch';
      }
    }
    return title;
  };

  const formatIncidentAddress = (addr?: string | null) => {
    if (!addr) return '';
    if (i18n.language?.startsWith('en')) {
      return addr
        .replace(/Khu Công Nghệ Cao/gi, 'High-Tech Park')
        .replace(/Khu công nghiệp/gi, 'Industrial Park')
        .replace(/Phường/gi, 'Ward')
        .replace(/Quận/gi, 'District')
        .replace(/Khu phố/gi, 'Quarter')
        .replace(/Đường/gi, 'St.')
        .replace(/Hẻm/gi, 'Alley')
        .replace(/Cầu/gi, 'Bridge')
        .replace(/Thành phố/gi, 'City')
        .replace(/TP\.\s*Thủ Đức/gi, 'Thu Duc City')
        .replace(/TP\.\s*HCM/gi, 'HCMC');
    }
    return addr;
  };

  const formatHospitalName = (hosp?: string | null) => {
    if (!hosp) return '';
    if (i18n.language?.startsWith('en')) {
      const lower = hosp.toLowerCase();
      if (lower.includes('công an') || lower.includes('đội bv') || lower.includes('sở tại')) {
        return 'Ward Police & Local Hospital Squad';
      }
      if (lower.includes('bệnh viện') || lower.includes('thủ đức')) {
        return 'Regional General Hospital';
      }
      if (lower.includes('phòng y tế')) {
        return 'Industrial Park Medical Clinic';
      }
    }
    return hosp;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badgeIconBg}>
                <FileText size={moderateScale(20)} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.modalTitle}>{t('staff.modal_mission_detail_title', 'Chi Tiết Biên Bản Ca Trực')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('staff.modal_mission_code', { code: mission.code, defaultValue: `Mã Ca: ${mission.code}` })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={moderateScale(20)} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Mission Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTop}>
                <View style={styles.severityTag}>
                  <Text style={styles.severityTagText}>
                    {mission.severity === 'critical'
                      ? t('staff.sev_critical_label', 'CẤP CỨU MỨC 1 - NGUY KỊCH')
                      : mission.severity === 'urgent'
                        ? t('staff.sev_urgent_label', 'CẤP CỨU MỨC 2 - KHẨN CẤP')
                        : t('staff.sev_standard_label', 'TIÊU CHUẨN')}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <CheckCircle2 size={moderateScale(12)} color="#10B981" />
                  <Text style={styles.statusPillText}>{t('staff.badge_completed', 'ĐÃ HOÀN TẤT')}</Text>
                </View>
              </View>
              <Text style={styles.incidentTitle}>{formatIncidentTitle(mission.title)}</Text>
              <View style={styles.heroAddressRow}>
                <MapPin size={moderateScale(13)} color="#94A3B8" />
                <Text style={styles.heroAddressText}>{formatIncidentAddress(mission.address)}</Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t('staff.metric_distance', 'Khoảng cách')}</Text>
                <Text style={styles.metricVal}>{mission.distanceKm} km</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t('staff.metric_response_time', 'Thời gian phản ứng')}</Text>
                <Text style={styles.metricVal}>
                  {mission.etaMinutes} {t('staff.unit_minute_full', 'phút')}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t('staff.metric_total_duration', 'Tổng thời lượng')}</Text>
                <Text style={styles.metricVal}>
                  {mission.durationMinutes} {t('staff.unit_minute_full', 'phút')}
                </Text>
              </View>
            </View>

            {/* Response Timeline */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>{t('staff.sec_dispatch_timeline', 'DÒNG THỜI GIAN ĐIỀU PHỐI (TIMELINE)')}</Text>
              <View style={styles.timeline}>
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>
                      {t('staff.tl_order_received', 'Tiếp nhận lệnh điều phối')}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {t('staff.tl_order_received_desc', 'Trung tâm điều phối phát lệnh báo động')}
                    </Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>
                      {t('staff.tl_station_departure', 'Xuất phát khỏi trạm đỗ')}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {t('staff.tl_station_departure_desc', 'Bật còi ưu tiên, kích hoạt GPS lộ trình')}
                    </Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>
                      {t('staff.tl_scene_arrival', 'Tiếp cận hiện trường')}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {t('staff.tl_scene_arrival_desc', 'Sơ cấp cứu, cố định nẹp & kiểm soát sinh hiệu')}
                    </Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>
                      {t('staff.tl_hospital_handover', 'Bàn giao bệnh viện')}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatHospitalName(mission.destinationHospital) || t('staff.tl_not_recorded', 'Chưa ghi nhận')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Personnel & Vehicle Information */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>{t('staff.sec_crew_vehicle', 'KÍP TRỰC & PHƯƠNG TIỆN')}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('staff.lbl_rescue_crew', 'Kíp cứu hộ:')}</Text>
                <Text style={styles.infoValue}>
                  {user?.teamName || user?.name || t('staff.crew_prefix', 'Kíp trực cứu hộ')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('staff.lbl_ambulance', 'Xe cấp cứu:')}</Text>
                <Text style={styles.infoValue}>
                  {user?.vehiclePlate || t('staff.default_vehicle_plate', 'Xe cứu hộ CAD')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('staff.lbl_receiving_hospital', 'Bệnh viện tiếp nhận:')}</Text>
                <Text style={[styles.infoValue, { color: '#38BDF8' }]}>
                  {formatHospitalName(mission.destinationHospital) || t('staff.tl_not_recorded', 'Chưa ghi nhận')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Close */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>{t('staff.btn_close_record', 'Đóng Biên Bản')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
    paddingBottom: verticalScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  badgeIconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  closeButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  scrollList: {
    marginTop: verticalScale(8),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(20),
  },
  heroBanner: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: verticalScale(10),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  severityTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
  },
  severityTagText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#EF4444',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    gap: scale(4),
  },
  statusPillText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#10B981',
  },
  incidentTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: verticalScale(6),
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  heroAddressText: {
    fontSize: moderateScale(11.5),
    color: '#CBD5E1',
    flex: 1,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: verticalScale(10),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: moderateScale(9.5),
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: verticalScale(2),
  },
  metricDivider: {
    width: 1,
    height: verticalScale(24),
    backgroundColor: '#334155',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: verticalScale(12),
  },
  sectionHeader: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: verticalScale(12),
  },
  timeline: {
    paddingLeft: scale(6),
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(2),
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  timelineLine: {
    width: 2,
    height: verticalScale(16),
    backgroundColor: '#334155',
    marginLeft: moderateScale(5),
    marginVertical: verticalScale(2),
  },
  timelineInfo: {
    marginLeft: scale(10),
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#F1F5F9',
  },
  timelineTime: {
    fontSize: moderateScale(10.5),
    color: '#94A3B8',
    marginTop: verticalScale(1),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  infoLabel: {
    fontSize: moderateScale(11.5),
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'right',
    flex: 1,
    marginLeft: scale(8),
  },
  modalFooter: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
  },
  doneButtonText: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
