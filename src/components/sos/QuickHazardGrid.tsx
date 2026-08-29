import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Car, Droplet, HeartPulse } from 'lucide-react-native';

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
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
];

interface QuickHazardGridProps {
  onSelectHazard: (hazard: HazardItem) => void;
}

export const QuickHazardGrid: React.FC<QuickHazardGridProps> = ({
  onSelectHazard,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>BÁO CÁO NHANH SỰ CỐ</Text>
        <Text style={styles.sectionBadge}>Chạm 1 chạm</Text>
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
                    { backgroundColor: item.color + '22' },
                  ]}
                >
                  <IconComponent size={22} color={item.color} strokeWidth={2.4} />
                </View>
                <Text style={[styles.codeTag, { color: item.color }]}>
                  {item.code}
                </Text>
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
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
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
