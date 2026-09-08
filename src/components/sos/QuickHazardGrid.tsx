import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Car, Droplet, HeartPulse } from 'lucide-react-native';
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
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  {
    id: 'crash',
    code: '#Vehicle_Rollover',
    title: 'Tai Nạn Giao Thông',
    subtitle: 'Va chạm & lật xe',
    icon: Car,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'chemical',
    code: '#Oil_Spill',
    title: 'Tràn Dầu / Hóa Chất',
    subtitle: 'Rò rỉ độc hại',
    icon: Droplet,
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'medical',
    code: '#Medical',
    title: 'Cấp Cứu Y Tế',
    subtitle: 'Bệnh nặng & chấn thương',
    icon: HeartPulse,
    color: '#10B981',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
];

interface QuickHazardGridProps {
  onSelectHazard: (hazard: HazardItem) => void;
}

export const QuickHazardGrid: React.FC<QuickHazardGridProps> = ({
  onSelectHazard,
}) => {
  const { isSmallDevice, moderateScale, fontScale } = useResponsive();
  const iconSize = isSmallDevice ? 18 : 22;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { fontSize: fontScale(11.5) }]}>
          BÁO CÁO NHANH SỰ CỐ
        </Text>
        <Text style={[styles.sectionBadge, { fontSize: fontScale(10.5) }]}>
          Chạm 1 chạm
        </Text>
      </View>

      <View style={styles.grid}>
        {HAZARD_DATA.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onSelectHazard(item)}
              style={[
                styles.card,
                {
                  backgroundColor: item.bgColor,
                  borderColor: item.borderColor,
                  padding: moderateScale(10),
                  minHeight: moderateScale(isSmallDevice ? 86 : 94),
                },
              ]}
              accessible={true}
              accessibilityLabel={`Báo cáo sự cố ${item.title}`}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: item.color + '22',
                      width: moderateScale(isSmallDevice ? 32 : 36),
                      height: moderateScale(isSmallDevice ? 32 : 36),
                    },
                  ]}
                >
                  <IconComponent size={iconSize} color={item.color} strokeWidth={2.4} />
                </View>
                <Text
                  style={[
                    styles.codeTag,
                    { color: item.color, fontSize: fontScale(8.5) },
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
                {item.title}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { fontSize: fontScale(isSmallDevice ? 9.5 : 10.5) },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
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
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionBadge: {
    fontWeight: '600',
    color: '#38BDF8',
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
    borderWidth: 1.2,
    justifyContent: 'space-between',
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
    color: '#F8FAFC',
    marginBottom: 1,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});

