import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react-native';

interface ReportHistoryItem {
  id: string;
  code: string;
  type: string;
  location: string;
  time: string;
  status: 'resolved' | 'dispatched' | 'pending';
}

const MOCK_REPORTS: ReportHistoryItem[] = [
  {
    id: '1',
    code: '#SOS-89412',
    type: 'Báo động SOS Khẩn cấp',
    location: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    time: 'Hôm nay, 10:24',
    status: 'dispatched',
  },
  {
    id: '2',
    code: '#Fire-1029',
    type: 'Báo cáo Hỏa hoạn',
    location: '45 Lê Lợi, Quận 1, TP.HCM',
    time: '2 ngày trước',
    status: 'resolved',
  },
];

export const MyReportsScreen: React.FC = () => {
  const getStatusBadge = (status: ReportHistoryItem['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <View style={[styles.statusBadge, styles.statusResolved]}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>Đã hoàn thành</Text>
          </View>
        );
      case 'dispatched':
        return (
          <View style={[styles.statusBadge, styles.statusDispatched]}>
            <AlertTriangle size={14} color="#F59E0B" />
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>Đội cứu hộ đang đến</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock size={14} color="#94A3B8" />
            <Text style={[styles.statusText, { color: '#94A3B8' }]}>Đang xử lý</Text>
          </View>
        );
    }
  };

  return (
    <ScreenContainer backgroundColor="#0F172A" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch Sử Báo Cáo Cứu Hộ</Text>
        <Text style={styles.subtitle}>Danh sách các sự cố bạn đã gửi tín hiệu</Text>
      </View>

      <FlatList
        data={MOCK_REPORTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemCode}>{item.code}</Text>
              {getStatusBadge(item.status)}
            </View>
            <Text style={styles.itemType}>{item.type}</Text>
            <Text style={styles.itemLocation}>📍 {item.location}</Text>
            <Text style={styles.itemTime}>⏱️ {item.time}</Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  listContent: {
    gap: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusDispatched: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  itemLocation: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  itemTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
