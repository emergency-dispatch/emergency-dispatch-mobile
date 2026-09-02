import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, User, Shield, Trash2, Edit2 } from 'lucide-react-native';
import { IceContact } from '../../types/profile';

interface IceContactCardProps {
  contact: IceContact;
  onEdit?: (contact: IceContact) => void;
  onDelete?: (contactId: string) => void;
  showActions?: boolean;
}

export const IceContactCard: React.FC<IceContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const handleCall = () => {
    const cleanPhone = contact.phoneNumber.replace(/[^0-9+]/g, '');
    if (!cleanPhone) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Không thể thực hiện cuộc gọi', `Số: ${contact.phoneNumber}`);
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xoá',
      `Bạn có chắc chắn muốn xoá người liên hệ khẩn cấp "${contact.name}" không?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => onDelete?.(contact.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.avatarWrapper}>
          <User size={20} color="#38BDF8" />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{contact.name}</Text>
            {contact.isPrimary && (
              <View style={styles.primaryBadge}>
                <Shield size={10} color="#10B981" />
                <Text style={styles.primaryText}>Ưu tiên 1</Text>
              </View>
            )}
          </View>
          <Text style={styles.relation}>Mối quan hệ: {contact.relationship}</Text>
          <Text style={styles.phone}>{contact.phoneNumber}</Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`Gọi khẩn cấp cho ${contact.name}`}
        >
          <Phone size={18} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>

        {showActions && onDelete && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  relation: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
