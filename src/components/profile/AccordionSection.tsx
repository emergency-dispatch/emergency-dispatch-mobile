import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronUp, Edit3 } from 'lucide-react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SummaryBadgeItem {
  text: string;
  color?: string;
  bg?: string;
  borderColor?: string;
}

interface AccordionSectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  titleColor?: string;
  isExpanded: boolean;
  onToggle: () => void;
  summaryBadges?: SummaryBadgeItem[];
  onQuickEdit?: () => void;
  children: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  icon,
  iconBgColor,
  titleColor = '#F8FAFC',
  isExpanded,
  onToggle,
  summaryBadges,
  onQuickEdit,
  children,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View
      style={[
        styles.container,
        isExpanded && styles.containerExpanded,
      ]}
    >
      {/* Clickable Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${isExpanded ? 'Đang mở' : 'Đang đóng'}. Chạm để ${isExpanded ? 'thu gọn' : 'mở rộng'}`}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>

        <View style={styles.headerTextCol}>
          <Text
            style={[styles.title, { color: titleColor }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={isExpanded ? 3 : 1}>
            {subtitle}
          </Text>

          {/* Collapsed Summary Badges Preview */}
          {!isExpanded && summaryBadges && summaryBadges.length > 0 && (
            <View style={styles.summaryBadgesRow}>
              {summaryBadges.map((badge, idx) => (
                <View
                  key={`sum_badge_${idx}`}
                  style={[
                    styles.summaryBadge,
                    badge.bg ? { backgroundColor: badge.bg } : undefined,
                    badge.borderColor ? { borderColor: badge.borderColor } : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      badge.color ? { color: badge.color } : undefined,
                    ]}
                  >
                    {badge.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.chevronWrapper}>
          {isExpanded ? (
            <ChevronUp size={18} color="#94A3B8" />
          ) : (
            <ChevronDown size={18} color="#94A3B8" />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedBody}>
          <View style={styles.divider} />
          {children}

          {/* Quick Edit Footer Button */}
          {onQuickEdit && (
            <TouchableOpacity
              style={styles.quickEditBtn}
              onPress={onQuickEdit}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`Chỉnh sửa ${title}`}
            >
              <Edit3 size={14} color="#38BDF8" />
              <Text style={styles.quickEditText}>Chỉnh sửa mục này</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  containerExpanded: {
    borderColor: '#475569',
    backgroundColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  summaryBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  summaryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  chevronWrapper: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 14,
  },
  expandedBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 14,
    gap: 6,
  },
  quickEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
