import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Car, Droplet, HeartPulse } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';

export interface HazardItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const HAZARD_DATA: HazardItem[] = [
  {
    id: 'fire',
    code: '#Fire',
    title: 'Hỏa Hoạn',
    subtitle: 'Cháy nổ & cứu hỏa',
    icon: Flame,
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  {
    id: 'crash',
    code: '#Vehicle_Rollover',
    title: 'Tai Nạn Giao Thông',
    subtitle: 'Va chạm & lật xe',
    icon: Car,
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.08)',
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  {
    id: 'chemical',
    code: '#Oil_Spill',
    title: 'Tràn Dầu / Hóa Chất',
    subtitle: 'Rò rỉ độc hại',
    icon: Droplet,
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  {
    id: 'medical',
    code: '#Medical',
    title: 'Cấp Cứu Y Tế',
    subtitle: 'Bệnh nặng & chấn thương',
    icon: HeartPulse,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
];

interface QuickHazardGridProps {
  onSelectHazard: (item: HazardItem) => void;
}

export const QuickHazardGrid: React.FC<QuickHazardGridProps> = ({ onSelectHazard }) => {
  const { t } = useTranslation();
  const { isSmallDevice, moderateScale, fontScale } = useResponsive();

  const iconCircleSize = moderateScale(isSmallDevice ? 32 : 36);
  const cardPadding = moderateScale(isSmallDevice ? 10 : 12);
  const cardMinHeight = moderateScale(isSmallDevice ? 85 : 98);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { fontSize: fontScale(10.5) }]}>
          {t('hazards.title')}
        </Text>
        <Text style={[styles.sectionBadge, { fontSize: fontScale(10) }]}>
          1-Tap
        </Text>
      </View>

      <View style={styles.grid}>
        {HAZARD_DATA.map((item) => {
          const IconComponent = item.icon;
          const translatedTitle = t(`hazards.${item.id}`, { defaultValue: item.title });
          const translatedSubtitle = t(`hazards.${item.id}_desc`, { defaultValue: item.subtitle });

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => onSelectHazard(item)}
              style={[
                styles.card,
                {
                  padding: cardPadding,
                  minHeight: cardMinHeight,
                  borderColor: item.borderColor,
                },
              ]}
              accessible={true}
              accessibilityLabel={`${translatedTitle}. ${translatedSubtitle}`}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: item.bgColor,
                      width: iconCircleSize,
                      height: iconCircleSize,
                    },
                  ]}
                >
                  <IconComponent
                    size={moderateScale(isSmallDevice ? 18 : 20)}
                    color={item.color}
                    strokeWidth={2.4}
                  />
                </View>
                <Text
                  style={[
                    styles.codeTag,
                    { color: item.color, fontSize: fontScale(9) },
                  ]}
                >
                  {item.code}
                </Text>
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  { fontSize: fontScale(isSmallDevice ? 12 : 13.5) },
                ]}
                numberOfLines={1}
              >
                {translatedTitle}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { fontSize: fontScale(isSmallDevice ? 9.5 : 10.5) },
                ]}
                numberOfLines={1}
              >
                {translatedSubtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1.2,
  },
  sectionBadge: {
    fontWeight: '700',
    color: '#DC2626',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconCircle: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTag: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  cardSubtitle: {
    color: '#64748B',
    fontWeight: '500',
  },
});
