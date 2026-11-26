import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

interface ShiftMetricsGridProps {
  completedMissions?: number;
  totalDistanceKm?: number;
  avgEtaMinutes?: number | null;
  shiftHoursElapsed?: number;
  totalShiftHours?: number;
  onTimeRate?: number;
  fuelStatus?: string;
  etaComparison?: string;
}

export const ShiftMetricsGrid: React.FC<ShiftMetricsGridProps> = ({
  completedMissions = 0,
  totalDistanceKm = 0,
  avgEtaMinutes = null,
  shiftHoursElapsed = 0,
  totalShiftHours = 12,
  onTimeRate = 100,
  fuelStatus,
  etaComparison,
}) => {
  const { t } = useTranslation();
  const shiftProgressPercent = Math.min(
    Math.round(((shiftHoursElapsed || 0) / totalShiftHours) * 100),
    100
  );

  const displayEta =
    avgEtaMinutes && avgEtaMinutes > 0
      ? `${avgEtaMinutes} ${t('staff.unit_minute_short', 'ph')}`
      : '--';

  const displayEtaSub =
    etaComparison ||
    (completedMissions > 0
      ? t('staff.avg_eta_standard', 'Đạt chuẩn')
      : t('staff.no_data', 'Chưa có dữ liệu'));

  const displayFuelSub =
    fuelStatus ||
    (completedMissions > 0
      ? t('staff.fuel_normal', 'Ổn định')
      : t('staff.station_standby', 'Tại trạm trực'));

  const displayDistance =
    totalDistanceKm > 0 ? `${totalDistanceKm} km` : '0 km';

  return (
    <View style={styles.container}>
      {/* Title & Shift Progress */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>
          {t('staff.metrics_title') || 'Ca trực hôm nay'}
        </Text>
        <Text style={styles.progressText}>
          {shiftHoursElapsed}h / {totalShiftHours}h
        </Text>
      </View>

      {/* Clean Minimalist Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${shiftProgressPercent}%` },
          ]}
        />
      </View>

      {/* 3-Column Minimalist Metric Counter (Flat & Card-Light) */}
      <View style={styles.metricGrid}>
        {/* Column 1: Sự cố */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {t('staff.metric_incident') || 'Sự cố'}
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {completedMissions}
          </Text>
          <Text style={[styles.metricSub, { color: '#059669' }]} numberOfLines={1}>
            {completedMissions > 0
              ? `${onTimeRate}% ${t('staff.on_time') || 'đúng hạn'}`
              : t('staff.ready_dispatch', 'Sẵn sàng')}
          </Text>
        </View>

        <View style={styles.colDivider} />

        {/* Column 2: Quãng đường */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {t('staff.metric_distance') || 'Quãng đường'}
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {displayDistance}
          </Text>
          <Text style={[styles.metricSub, { color: '#0284C7' }]} numberOfLines={1}>
            {displayFuelSub}
          </Text>
        </View>

        <View style={styles.colDivider} />

        {/* Column 3: ETA TB */}
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {t('staff.metric_eta') || 'ETA TB'}
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {displayEta}
          </Text>
          <Text style={[styles.metricSub, { color: '#D97706' }]} numberOfLines={1}>
            {displayEtaSub}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  progressText: {
    fontSize: moderateScale(11.5),
    fontWeight: '600',
    color: '#64748B',
  },
  progressTrack: {
    height: verticalScale(5),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(2.5),
    overflow: 'hidden',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(14),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(2.5),
  },
  metricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(2),
  },
  colDivider: {
    width: 1,
    height: verticalScale(32),
    backgroundColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: verticalScale(2),
  },
  metricValue: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    marginTop: verticalScale(3),
  },
});
