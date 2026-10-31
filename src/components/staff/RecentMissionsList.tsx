import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  History,
  AlertTriangle,
  HeartPulse,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Navigation,
  Activity,
  UserCheck,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import { MissionItem } from '../../types/staff';

interface RecentMissionsListProps {
  missions: MissionItem[];
  onPressMission: (mission: MissionItem) => void;
  onPressViewAll: () => void;
}

export const RecentMissionsList: React.FC<RecentMissionsListProps> = ({
  missions,
  onPressMission,
  onPressViewAll,
}) => {
  const { t } = useTranslation();
  const getMissionTypeIcon = (type: MissionItem['type']) => {
    switch (type) {
      case 'traffic_accident':
        return {
          icon: AlertTriangle,
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
        };
      case 'cardiac_arrest':
        return {
          icon: HeartPulse,
          color: '#EC4899',
          bgColor: 'rgba(236, 72, 153, 0.15)',
        };
      case 'fire_rescue':
        return {
          icon: Flame,
          color: '#F97316',
          bgColor: 'rgba(249, 115, 22, 0.15)',
        };
      case 'respiratory':
        return {
          icon: Activity,
          color: '#06B6D4',
          bgColor: 'rgba(6, 182, 212, 0.15)',
        };
      default:
        return {
          icon: AlertTriangle,
          color: '#38BDF8',
          bgColor: 'rgba(56, 189, 248, 0.15)',
        };
    }
  };

  const getSeverityBadge = (severity: MissionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return { label: t('staff.severity_red'), color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'urgent':
        return { label: t('staff.severity_urgent'), color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: t('staff.severity_standard'), color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Title & View All */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <History size={moderateScale(16)} color="#DC2626" />
          <Text
            style={styles.sectionTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.recent_missions_title')}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.viewAllButton}
          onPress={onPressViewAll}
        >
          <Text
            style={styles.viewAllText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
          >
            {t('staff.view_all')}
          </Text>
          <ChevronRight size={moderateScale(13)} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Missions List */}
      <View style={styles.list}>
        {missions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={moderateScale(24)} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có ca trực nào hoàn tất</Text>
            <Text style={styles.emptySub}>
              Các nhiệm vụ cứu hộ sau khi nghiệm thu sẽ được lưu vào lịch sử tại đây.
            </Text>
          </View>
        ) : (
          missions.map((mission, index) => {
          const typeConfig = getMissionTypeIcon(mission.type);
          const IconComp = typeConfig.icon;
          const severityConfig = getSeverityBadge(mission.severity);

          return (
            <TouchableOpacity
              key={mission.id}
              activeOpacity={0.75}
              style={[
                styles.missionCard,
                index === missions.length - 1 && styles.lastCard,
              ]}
              onPress={() => onPressMission(mission)}
            >
              {/* Mission Header: Code & Status & Urgency */}
              <View style={styles.missionHeader}>
                <View style={styles.codeRow}>
                  <View style={[styles.typeIconBg, { backgroundColor: typeConfig.bgColor }]}>
                    <IconComp size={moderateScale(15)} color={typeConfig.color} />
                  </View>
                  <View style={styles.codeTextGroup}>
                    <Text style={styles.missionCode} numberOfLines={1}>
                      {mission.code}
                    </Text>
                    <Text style={styles.completedTime} numberOfLines={1}>
                      {mission.completedAt}
                    </Text>
                  </View>
                </View>

                <View style={styles.badgeGroup}>
                  <View style={[styles.severityBadge, { backgroundColor: severityConfig.bg }]}>
                    <Text
                      style={[styles.severityText, { color: severityConfig.color }]}
                      numberOfLines={1}
                    >
                      {severityConfig.label}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <CheckCircle2 size={moderateScale(11)} color="#10B981" />
                    <Text style={styles.statusText} numberOfLines={1}>
                      Hoàn tất
                    </Text>
                  </View>
                </View>
              </View>

              {/* Incident Title */}
              <Text
                style={styles.incidentTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                {mission.title}
              </Text>

              {/* Address */}
              <View style={styles.addressRow}>
                <MapPin size={moderateScale(12)} color="#64748B" />
                <Text
                  style={styles.addressText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={1.15}
                >
                  {mission.address}
                </Text>
              </View>

              {/* Bottom Metrics: ETA, Distance, Duration */}
              <View style={styles.metricsFooter}>
                <View style={styles.metricItem}>
                  <Navigation size={moderateScale(11)} color="#94A3B8" />
                  <Text style={styles.metricItemText} numberOfLines={1}>
                    {mission.distanceKm} km
                  </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Clock size={moderateScale(11)} color="#94A3B8" />
                  <Text style={styles.metricItemText} numberOfLines={1}>
                    Phản ứng: {mission.etaMinutes}m
                  </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Text style={styles.metricItemText} numberOfLines={1}>
                    Tổng: {mission.durationMinutes}m
                  </Text>
                </View>

                <ChevronRight size={moderateScale(14)} color="#475569" style={styles.arrowIcon} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: verticalScale(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
  },
  viewAllText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  list: {
    gap: verticalScale(10),
  },
  missionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lastCard: {
    marginBottom: 0,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  codeTextGroup: {
    justifyContent: 'center',
  },
  typeIconBg: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCode: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  completedTime: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  severityBadge: {
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
  },
  severityText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    gap: scale(3),
  },
  statusText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#059669',
  },
  incidentTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: verticalScale(6),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginBottom: verticalScale(8),
  },
  addressText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    flex: 1,
  },
  metricsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  metricItemText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#475569',
  },
  metricDivider: {
    width: 1,
    height: verticalScale(10),
    backgroundColor: '#E2E8F0',
    marginHorizontal: scale(8),
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: verticalScale(4),
  },
  emptySub: {
    fontSize: moderateScale(11),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
});
