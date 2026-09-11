import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  CheckCircle2,
  Navigation,
  Clock,
  Zap,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface ShiftMetricsGridProps {
  completedMissions: number;
  totalDistanceKm: number;
  avgEtaMinutes: number;
  shiftHoursElapsed?: number;
  totalShiftHours?: number;
  onTimeRate?: number;
}

export const ShiftMetricsGrid: React.FC<ShiftMetricsGridProps> = ({
  completedMissions = 3,
  totalDistanceKm = 42,
  avgEtaMinutes = 8.5,
  shiftHoursElapsed = 6.5,
  totalShiftHours = 12,
  onTimeRate = 100,
}) => {
  const shiftProgressPercent = Math.min(
    Math.round((shiftHoursElapsed / totalShiftHours) * 100),
    100
  );

  return (
    <View style={styles.container}>
      {/* Shift Title & Progress */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <TrendingUp size={moderateScale(15)} color="#DC2626" />
          <Text
            style={styles.sectionTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            THỐNG KÊ CA TRỰC HÔM NAY
          </Text>
        </View>
        <Text
          style={styles.shiftTimeText}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
        >
          {shiftHoursElapsed}h / {totalShiftHours}h ({shiftProgressPercent}%)
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${shiftProgressPercent}%` },
          ]}
        />
      </View>

      {/* 3-Column Metrics Grid */}
      <View style={styles.gridRow}>
        {/* Metric 1: Completed Missions */}
        <View style={styles.metricCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CheckCircle2 size={moderateScale(18)} color="#10B981" />
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {completedMissions}
            </Text>
            <Text style={styles.metricUnit} numberOfLines={1}>
              ca
            </Text>
          </View>
          <Text
            style={styles.metricLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Số ca hoàn tất
          </Text>
          <View style={styles.subBadge}>
            <Text
              style={[styles.subBadgeText, { color: '#34D399' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              {onTimeRate}% đúng hạn
            </Text>
          </View>
        </View>

        {/* Metric 2: Total Distance */}
        <View style={styles.metricCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <Navigation size={moderateScale(18)} color="#06B6D4" />
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {totalDistanceKm}
            </Text>
            <Text style={styles.metricUnit} numberOfLines={1}>
              km
            </Text>
          </View>
          <Text
            style={styles.metricLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            Quãng đường
          </Text>
          <View style={styles.subBadge}>
            <Text
              style={[styles.subBadgeText, { color: '#38BDF8' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              Nhiên liệu 85%
            </Text>
          </View>
        </View>

        {/* Metric 3: Avg ETA */}
        <View style={styles.metricCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Clock size={moderateScale(18)} color="#F59E0B" />
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {avgEtaMinutes}
            </Text>
            <Text style={styles.metricUnit} numberOfLines={1}>
              phút
            </Text>
          </View>
          <Text
            style={styles.metricLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
          >
            ETA Trung bình
          </Text>
          <View style={styles.subBadge}>
            <Text
              style={[styles.subBadgeText, { color: '#FBBF24' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              Nhanh hơn 1.2m
            </Text>
          </View>
        </View>
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
    marginBottom: verticalScale(6),
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
  shiftTimeText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#DC2626',
  },
  progressBarBg: {
    height: verticalScale(4),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
    marginBottom: verticalScale(12),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(2),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(6),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(2),
  },
  metricValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
  },
  metricLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginTop: verticalScale(2),
    textAlign: 'center',
  },
  subBadge: {
    marginTop: verticalScale(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(5),
    borderRadius: moderateScale(4),
  },
  subBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
});
