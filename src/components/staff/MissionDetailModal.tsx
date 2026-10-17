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
import { MissionItem } from '../../types/staff';

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
  if (!mission) return null;

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
                <Text style={styles.modalTitle}>Chi Tiết Biên Bản Ca Trực</Text>
                <Text style={styles.modalSubtitle}>Mã Ca: {mission.code}</Text>
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
                      ? 'CẤP CỨU MỨC 1 - NGUY KỊCH'
                      : mission.severity === 'urgent'
                      ? 'CẤP CỨU MỨC 2 - KHẨN CẤP'
                      : 'TIÊU CHUẨN'}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <CheckCircle2 size={moderateScale(12)} color="#10B981" />
                  <Text style={styles.statusPillText}>ĐÃ HOÀN TẤT</Text>
                </View>
              </View>
              <Text style={styles.incidentTitle}>{mission.title}</Text>
              <View style={styles.heroAddressRow}>
                <MapPin size={moderateScale(13)} color="#94A3B8" />
                <Text style={styles.heroAddressText}>{mission.address}</Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Khoảng cách</Text>
                <Text style={styles.metricVal}>{mission.distanceKm} km</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Thời gian phản ứng</Text>
                <Text style={styles.metricVal}>{mission.etaMinutes} phút</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Tổng thời lượng</Text>
                <Text style={styles.metricVal}>{mission.durationMinutes} phút</Text>
              </View>
            </View>

            {/* Response Timeline */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>DÒNG THỜI GIAN ĐIỀU PHỐI (TIMELINE)</Text>
              <View style={styles.timeline}>
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>Tiếp nhận lệnh điều phối</Text>
                    <Text style={styles.timelineTime}>Trung tâm điều phối phát lệnh báo động</Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>Xuất phát khỏi trạm đỗ</Text>
                    <Text style={styles.timelineTime}>Bật còi ưu tiên, kích hoạt GPS lộ trình</Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>Tiếp cận hiện trường</Text>
                    <Text style={styles.timelineTime}>Sơ cấp cứu, cố định nẹp & kiểm soát sinh hiệu</Text>
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineStep}>
                  <View style={[styles.timelineDot, styles.dotCompleted]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineStepTitle}>Bàn giao bệnh viện</Text>
                    <Text style={styles.timelineTime}>
                      {mission.destinationHospital || 'Bệnh viện Trưng Vương TP.HCM'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Personnel & Vehicle Information */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>KÍP TRỰC & PHƯƠNG TIỆN</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kíp cứu hộ:</Text>
                <Text style={styles.infoValue}>Lê Quốc Huy (Lái xe) • BS. Trần Văn Minh</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Xe cấp cứu:</Text>
                <Text style={styles.infoValue}>51A-999.99 (Đội ICU 01)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bệnh viện tiếp nhận:</Text>
                <Text style={[styles.infoValue, { color: '#38BDF8' }]}>
                  {mission.destinationHospital || 'Bệnh viện Cấp Cứu Trưng Vương'}
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
              <Text style={styles.doneButtonText}>Đóng Biên Bản</Text>
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
