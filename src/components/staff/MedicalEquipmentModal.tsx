import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Activity,
  Pill,
  ShieldCheck,
  BatteryCharging,
  Gauge,
  Sparkles,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { EquipmentCategory } from '../../types/staff';

interface MedicalEquipmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveChecklist?: (updatedCount: number) => void;
}

const INITIAL_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'respiratory',
    title: 'Hệ Thống Hô Hấp & Oxy',
    items: [
      {
        id: 'o2_main',
        name: 'Bình Oxy Cố Định Chính',
        specification: 'Áp suất 150 Bar • Bình 10L',
        status: 'checked',
        quantity: '01 bình',
      },
      {
        id: 'o2_portable',
        name: 'Bình Oxy Di Động Hiện Trường',
        specification: 'Áp suất 120 Bar • Đầy van thở',
        status: 'checked',
        quantity: '02 bình',
      },
      {
        id: 'suction_pump',
        name: 'Máy Hút Đờm Nhớt Áp Lực',
        specification: 'Pin sạc 100% • Ống hút vô trùng',
        status: 'checked',
        quantity: '01 máy',
      },
    ],
  },
  {
    id: 'resuscitation',
    title: 'Hồi Sức Cấp Cứu & Tim Mạch',
    items: [
      {
        id: 'aed_defibrillator',
        name: 'Máy Sốc Tim Tự Động (AED)',
        specification: 'Điện áp đạt chuẩn • Miếng dán người lớn & trẻ em',
        status: 'checked',
        quantity: '01 bộ',
        expiryDate: 'HSD Pad: 12/2027',
      },
      {
        id: 'vital_monitor',
        name: 'Monitor Theo Dõi Sinh Hiệu (5 thông số)',
        specification: 'SpO2, ECG, NIBP, Nhiệt độ, Nhịp thở',
        status: 'checked',
        quantity: '01 máy',
      },
      {
        id: 'ambu_bag',
        name: 'Bóng Bóp Kèm Mask Thở Ambu',
        specification: 'Cỡ người lớn + Trẻ sơ sinh',
        status: 'checked',
        quantity: '02 bộ',
      },
    ],
  },
  {
    id: 'medication',
    title: 'Hộp Thuốc Cấp Cứu & Dịch Truyền',
    items: [
      {
        id: 'emergency_med_box',
        name: 'Hộp Thuốc Cấp Cứu A (Chống sốc)',
        specification: 'Adrenaline 1mg, Atropine, Seduxen, Morphin',
        status: 'checked',
        quantity: '01 hộp',
        expiryDate: 'Kiểm kê: 01/09/2026',
      },
      {
        id: 'iv_fluids',
        name: 'Dịch Truyền NaCl 0.9% & Ringer Lactate',
        specification: 'Chai 500ml nguyên seal kèm dây truyền',
        status: 'checked',
        quantity: '06 chai',
      },
    ],
  },
  {
    id: 'trauma_splint',
    title: 'Nẹp Cố Định & Cáng Cứu Thương',
    items: [
      {
        id: 'cervical_collar',
        name: 'Nẹp Cổ Cứng Chấn Thương (Cervical Collar)',
        specification: 'Đủ 4 kích cỡ (S, M, L, Trẻ em)',
        status: 'checked',
        quantity: '04 cái',
      },
      {
        id: 'vacuum_splint',
        name: 'Bộ Nẹp Chân Tay Hút Chân Không',
        specification: 'Kèm bơm hút áp lực âm',
        status: 'checked',
        quantity: '01 bộ',
      },
      {
        id: 'stretcher_main',
        name: 'Cáng Cứu Thương Chính (Tự Động Trượt)',
        specification: 'Khóa an toàn ray trượt xe hoạt động trơn tru',
        status: 'checked',
        quantity: '01 cái',
      },
    ],
  },
];

export const MedicalEquipmentModal: React.FC<MedicalEquipmentModalProps> = ({
  visible,
  onClose,
  onSaveChecklist,
}) => {
  const [categories, setCategories] = useState<EquipmentCategory[]>(INITIAL_CATEGORIES);

  // Toggle item check status
  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextStatus =
              item.status === 'checked'
                ? 'warning'
                : item.status === 'warning'
                ? 'missing'
                : 'checked';
            return { ...item, status: nextStatus };
          }),
        };
      })
    );
  };

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = categories.reduce(
    (sum, cat) =>
      sum + cat.items.filter((item) => item.status === 'checked').length,
    0
  );

  const handleSave = () => {
    Alert.alert(
      'Xác Nhận Biên Bản Kiểm Tra',
      `Đã kiểm tra thành công ${checkedItems}/${totalItems} hạng mục thiết bị trên xe cấp cứu 51A-999.99. Dữ liệu đã đồng bộ về máy chủ 115.`,
      [
        {
          text: 'Hoàn Tất',
          onPress: () => {
            onSaveChecklist?.(checkedItems);
            onClose();
          },
        },
      ]
    );
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
              <View style={styles.titleIconBg}>
                <PackageCheck size={moderateScale(20)} color="#06B6D4" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Kiểm Tra Vật Tư & Trang Thiết Bị</Text>
                <Text style={styles.modalSubtitle}>
                  Biên bản kiểm tra đầu ca trực • Xe 51A-999.99
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

          {/* Inspection Summary Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>Tiến Độ Kiểm Định</Text>
              <Text style={styles.summaryCount}>
                {checkedItems}/{totalItems} Hạng mục đạt chuẩn
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <ShieldCheck size={moderateScale(14)} color="#10B981" />
              <Text style={styles.summaryBadgeText}>SẴN SÀNG CA</Text>
            </View>
          </View>

          {/* Checklist Scroll */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category) => (
              <View key={category.id} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.title}</Text>

                <View style={styles.categoryCard}>
                  {category.items.map((item, idx) => {
                    const isLast = idx === category.items.length - 1;
                    const isChecked = item.status === 'checked';
                    const isWarning = item.status === 'warning';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[styles.itemRow, !isLast && styles.itemBorderBottom]}
                        onPress={() => toggleItem(category.id, item.id)}
                      >
                        {/* Checkbox Icon */}
                        <View
                          style={[
                            styles.checkbox,
                            isChecked && styles.checkboxChecked,
                            isWarning && styles.checkboxWarning,
                          ]}
                        >
                          {isChecked && (
                            <CheckCircle2 size={moderateScale(16)} color="#10B981" />
                          )}
                          {isWarning && (
                            <AlertTriangle size={moderateScale(16)} color="#F59E0B" />
                          )}
                          {!isChecked && !isWarning && (
                            <View style={styles.checkboxEmpty} />
                          )}
                        </View>

                        {/* Item Details */}
                        <View style={styles.itemInfo}>
                          <View style={styles.itemNameRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>{item.quantity}</Text>
                          </View>
                          <Text style={styles.itemSpec}>{item.specification}</Text>
                          {item.expiryDate && (
                            <Text style={styles.itemExpiry}>{item.expiryDate}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.saveButton}
              onPress={handleSave}
            >
              <CheckCircle2 size={moderateScale(18)} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Lưu & Xác Nhận Vật Tư</Text>
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
  titleIconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
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
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    marginHorizontal: scale(16),
    marginTop: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    fontWeight: '600',
  },
  summaryCount: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: verticalScale(2),
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
    gap: scale(4),
  },
  summaryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#10B981',
  },
  scrollList: {
    marginTop: verticalScale(8),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(20),
  },
  categorySection: {
    marginTop: verticalScale(14),
  },
  categoryTitle: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
    marginBottom: verticalScale(8),
  },
  categoryCard: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
  },
  itemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  checkbox: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  checkboxChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkboxWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  checkboxEmpty: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#64748B',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
    marginRight: scale(8),
  },
  itemQuantity: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#38BDF8',
  },
  itemSpec: {
    fontSize: moderateScale(10.5),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  itemExpiry: {
    fontSize: moderateScale(10),
    color: '#F59E0B',
    marginTop: verticalScale(1),
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    gap: scale(8),
  },
  saveButtonText: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
