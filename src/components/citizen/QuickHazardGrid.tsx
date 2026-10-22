import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Car, HeartPulse, AlertTriangle } from 'lucide-react-native';
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
    code: '(#Fire)',
    title: 'Hỏa hoạn & Khói',
    subtitle: 'Cháy nổ & khói độc',
    icon: Flame,
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  {
    id: 'accident',
    code: '(#Accident)',
    title: 'Tai nạn & Va chạm',
    subtitle: 'Va chạm & tai nạn giao thông',
    icon: Car,
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  {
    id: 'medical',
    code: '',
    title: 'Cấp cứu y tế lao động',
    subtitle: 'Chấn thương & sơ cấp cứu',
    icon: HeartPulse,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  {
    id: 'traffic_jam',
    code: '(#Traffic_Jam)',
    title: 'Ùn tắc cổng KCN',
    subtitle: 'Kẹt xe & ùn ứ cục bộ',
    icon: AlertTriangle,
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
];

interface QuickHazardGridProps {
  onSelectHazard: (item: HazardItem) => void;
  selectedHazardId?: string | null;
}

export const QuickHazardGrid: React.FC<QuickHazardGridProps> = ({
  onSelectHazard,
  selectedHazardId,
}) => {
  const { t } = useTranslation();
  const { isSmallDevice, moderateScale, fontScale } = useResponsive();
  const [selectedId, setSelectedId] = React.useState<string | null>(selectedHazardId || 'accident');

  React.useEffect(() => {
    if (selectedHazardId !== undefined && selectedHazardId !== null) {
      setSelectedId(selectedHazardId);
    }
  }, [selectedHazardId]);

  const cardPadding = moderateScale(isSmallDevice ? 10 : 12);
  const cardMinHeight = moderateScale(isSmallDevice ? 85 : 98);

  const handlePress = (item: HazardItem) => {
    setSelectedId(item.id);
    onSelectHazard(item);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { fontSize: fontScale(10.5) }]}>
          CHỌN LOẠI TÌNH HUỐNG KHẨN CẤP:
        </Text>
      </View>

      <View style={styles.grid}>
        {HAZARD_DATA.map((item) => {
          const IconComponent = item.icon;
          const translatedTitle = t(`hazards.${item.id}`, { defaultValue: item.title });
          const isSelected = selectedId === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => handlePress(item)}
              style={[
                styles.card,
                {
                  padding: cardPadding,
                  minHeight: cardMinHeight,
                  borderColor: isSelected ? '#DC2626' : '#E2E8F0',
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                },
              ]}
              accessible={true}
              accessibilityLabel={`Báo cáo ${translatedTitle}`}
              accessibilityRole="button"
            >
              <View style={styles.iconCenterWrap}>
                <IconComponent
                  size={moderateScale(isSmallDevice ? 22 : 26)}
                  color={isSelected ? '#DC2626' : '#475569'}
                  strokeWidth={2.2}
                />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    fontSize: fontScale(isSmallDevice ? 11.5 : 12.5),
                    color: isSelected ? '#DC2626' : '#1E293B',
                  },
                ]}
                numberOfLines={2}
              >
                {translatedTitle}
              </Text>

              {item.code ? (
                <Text
                  style={[
                    styles.codeTag,
                    {
                      fontSize: fontScale(isSmallDevice ? 10.5 : 11.5),
                      color: isSelected ? '#DC2626' : '#64748B',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.code}
                </Text>
              ) : null}
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
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1.0,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCenterWrap: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 2,
  },
  codeTag: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
