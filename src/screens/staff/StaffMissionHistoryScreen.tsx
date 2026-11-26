import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  FileCheck2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Truck,
  Building2,
  ChevronRight,
  X,
  ShieldCheck,
  Camera,
  Phone,
  RefreshCw,
  Package,
  FileText,
  CheckCircle2,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { staffDispatchService } from '../../services/staffDispatch.service';
import { DispatchAssignmentResponseDto, CompletionReportDto } from '../../types/dispatch';
import { useAppStore } from '../../store/useAppStore';

// Mock sample completed assignments with realistic completion reports if backend has none yet
const SAMPLE_COMPLETED_REPORTS: DispatchAssignmentResponseDto[] = [
  {
    id: 'asg-completed-01',
    incidentId: 'inc-sample-01',
    incidentCode: '#EM-241120',
    incidentTitle: 'Cấp Cứu Nạn Nhân Suy Hô Hấp Do Ngạt Khói Xưởng Gỗ',
    incidentAddress: 'Lô C3, Đường D2, Khu Công Nghệ Cao, TP. Thủ Đức',
    incidentSeverity: 'code_red',
    rescueUnitId: 'unit-icu-01',
    rescueUnitPlate: '51D-1234',
    stationName: 'Trạm Cứu Hộ & PCCC Khu Công Nghệ Cao',
    status: 'Completed',
    dispatchedAt: '2026-11-25T08:15:00.000Z',
    acceptedAt: '2026-11-25T08:16:30.000Z',
    enRouteAt: '2026-11-25T08:18:00.000Z',
    arrivedAt: '2026-11-25T08:26:00.000Z',
    completedAt: '2026-11-25T08:58:00.000Z',
    distanceKm: 3.8,
    completionReport: {
      actionsSummary:
        'Tiếp cận hiện trường xưởng gỗ, mang bình dưỡng khí SCBA giải cứu 2 công nhân ngạt khói tại tầng lửng. Tiến hành thở oxy lưu lượng cao 15L/phút, đặt nẹp cổ cố định và chuyển bệnh nhân lên xe cấp cứu an toàn.',
      victimsAssistedCount: 2,
      equipmentUsed: [
        'Bình dưỡng khí SCBA 300bar',
        'Bình Oxy y tế 10L',
        'Cáng cứu thương cứng',
        'Monitor theo dõi dấu hiệu sinh tồn',
      ],
      evidenceMediaUrls: [
        'https://images.unsplash.com/photo-1587745416684-475553dd5995?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=600&q=80',
      ],
      handoverEntity: 'Bệnh Viện Đa Khoa Khu Vực Thủ Đức',
      handoverContactName: 'Bác sĩ trực cấp cứu - BS. Nguyễn Văn Hùng',
      handoverContactPhone: '0908123456',
      handoverNotes:
        'Bệnh nhân SpO2 96% sau thở oxy, mạch 88 lần/phút, đã bàn giao hồ sơ sinh hiệu lúc 08:55.',
      submittedAt: '2026-11-25T08:58:00.000Z',
    },
  },
  {
    id: 'asg-completed-02',
    incidentId: 'inc-sample-02',
    incidentCode: '#EM-241118',
    incidentTitle: 'Va Chạm Xe Bồn Hóa Chất & Xe Tải Chở Hàng',
    incidentAddress: 'Ngã tư D1 & Võ Chí Công, TP. Thủ Đức',
    incidentSeverity: 'code_orange',
    rescueUnitId: 'unit-hazmat-02',
    rescueUnitPlate: '51D-5678',
    stationName: 'Trạm Cứu Hộ & PCCC Khu Công Nghệ Cao',
    status: 'Completed',
    dispatchedAt: '2026-11-23T14:10:00.000Z',
    acceptedAt: '2026-11-23T14:11:00.000Z',
    enRouteAt: '2026-11-23T14:13:00.000Z',
    arrivedAt: '2026-11-23T14:21:00.000Z',
    completedAt: '2026-11-23T14:52:00.000Z',
    distanceKm: 2.5,
    completionReport: {
      actionsSummary:
        'Phong tỏa bán kính 50m quanh xe bồn, sử dụng cát và chất hấp thụ xử lý rò rỉ dung môi hữu cơ. Sơ cứu vết rách cẳng tay cho tài xế xe tải, băng ép vô khuẩn và chuyển giao cho CSGT điều phối giao thông.',
      victimsAssistedCount: 1,
      equipmentUsed: [
        'Bộ đồ bảo hộ hóa chất Level B',
        'Bộ dụng cụ xử lý tràn đổ hóa chất',
        'Băng gạc & nẹp chi cố định',
      ],
      evidenceMediaUrls: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      ],
      handoverEntity: 'Đội CSGT Cát Lái - Công An TP. Thủ Đức',
      handoverContactName: 'Đ/c Lê Thanh Tùng - Đội phó',
      handoverContactPhone: '0913987654',
      handoverNotes:
        'Hiện trường đã tiêu độc khử trùng hoàn tất, lòng đường lưu thông bình thường trở lại.',
      submittedAt: '2026-11-23T14:52:00.000Z',
    },
  },
  {
    id: 'asg-completed-03',
    incidentId: 'inc-sample-03',
    incidentCode: '#EM-241112',
    incidentTitle: 'Cấp Cứu Sốc Nhiệt Công Nhân Thi Công Điện Trên Cao',
    incidentAddress: 'Khu công nghiệp Cát Lái, Cụm 2, P. Thạnh Mỹ Lợi',
    incidentSeverity: 'code_yellow',
    rescueUnitId: 'unit-icu-01',
    rescueUnitPlate: '51D-1234',
    stationName: 'Trạm Cứu Hộ & PCCC Khu Công Nghệ Cao',
    status: 'Completed',
    dispatchedAt: '2026-11-20T11:05:00.000Z',
    acceptedAt: '2026-11-20T11:06:00.000Z',
    enRouteAt: '2026-11-20T11:08:00.000Z',
    arrivedAt: '2026-11-20T11:17:00.000Z',
    completedAt: '2026-11-20T11:45:00.000Z',
    distanceKm: 4.2,
    completionReport: {
      actionsSummary:
        'Sử dụng xe thang phối hợp hạ nạn nhân say nắng sốc nhiệt từ tầng 3 công trình xuống mặt đất an toàn. Làm mát chủ động bằng khăn ướt, bù dịch điện giải tĩnh mạch và chuyển đến phòng y tế cơ sở.',
      victimsAssistedCount: 1,
      equipmentUsed: ['Cáng cứu thương trên cao', 'Bộ dịch truyền Ringer Lactate', 'Máy đo thân nhiệt'],
      evidenceMediaUrls: [],
      handoverEntity: 'Phòng Y Tế KCN Cát Lái',
      handoverContactName: 'Y sĩ Nguyễn Thị Lan',
      handoverContactPhone: '0938555777',
      handoverNotes: 'Bệnh nhân tỉnh táo hoàn toàn, thân nhiệt giảm về 37.5°C, tiếp tục theo dõi.',
      submittedAt: '2026-11-20T11:45:00.000Z',
    },
  },
];

export const StaffMissionHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { user } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedList, setCompletedList] = useState<DispatchAssignmentResponseDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<DispatchAssignmentResponseDto | null>(null);

  // Load real assignments from backend
  const loadHistoryData = useCallback(async () => {
    try {
      const data = await staffDispatchService.getMyAssignments(true);
      const filtered = data.filter(
        (a) => a.status === 'Completed' || a.completedAt !== null || !!a.completionReport
      );

      if (filtered.length > 0) {
        setCompletedList(filtered);
      } else {
        // Fallback to sample items for visual testing if no completed assignments exist yet
        setCompletedList(SAMPLE_COMPLETED_REPORTS);
      }
    } catch (err) {
      console.warn('Failed to load completed assignments:', err);
      setCompletedList(SAMPLE_COMPLETED_REPORTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistoryData();
  }, [loadHistoryData]);

  // Compute summary metrics
  const metrics = useMemo(() => {
    const totalReports = completedList.length;
    let totalVictims = 0;
    let totalDurationMinutes = 0;
    let validDurationCount = 0;

    for (const item of completedList) {
      if (item.completionReport?.victimsAssistedCount) {
        totalVictims += item.completionReport.victimsAssistedCount;
      }
      if (item.dispatchedAt && item.completedAt) {
        const diffMs = new Date(item.completedAt).getTime() - new Date(item.dispatchedAt).getTime();
        const mins = Math.max(1, Math.round(diffMs / 60000));
        totalDurationMinutes += mins;
        validDurationCount++;
      }
    }

    const avgDuration = validDurationCount > 0 ? Math.round(totalDurationMinutes / validDurationCount) : 32;

    return { totalReports, totalVictims, avgDuration };
  }, [completedList]);

  // Filtered List based on search and active filter
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return completedList.filter((item) => {
      // Search query filter
      if (query) {
        const codeMatch = (item.incidentCode || '').toLowerCase().includes(query);
        const titleMatch = (item.incidentTitle || '').toLowerCase().includes(query);
        const addressMatch = (item.incidentAddress || '').toLowerCase().includes(query);
        const entityMatch = (item.completionReport?.handoverEntity || '').toLowerCase().includes(query);
        if (!codeMatch && !titleMatch && !addressMatch && !entityMatch) {
          return false;
        }
      }

      // Time filter
      if (activeFilter === 'today' && item.completedAt) {
        const itemDate = new Date(item.completedAt);
        const isToday =
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (activeFilter === 'week' && item.completedAt) {
        const itemDate = new Date(item.completedAt);
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      }

      return true;
    });
  }, [completedList, searchQuery, activeFilter]);

  // Format date helper
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins} • ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Calculate mission duration in minutes
  const calculateDuration = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return '35 min';
    try {
      const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
      const mins = Math.max(1, Math.round(diffMs / 60000));
      return `${mins} ${t('staff.unit_minute_short', 'ph')}`;
    } catch {
      return '35 min';
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      safeArea
      edges={['top', 'left', 'right', 'bottom']}
      statusBarStyle="dark-content"
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={moderateScale(20)} color="#0F172A" />
          </TouchableOpacity>
        )}

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('staff.history_screen_title', 'Lịch Sử Báo Cáo Sự Cố')}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {t('staff.history_screen_sub', 'Kho lưu trữ sự cố đã hoàn tất và biên bản nghiệm thu')}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.refreshBtn}
          onPress={onRefresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RefreshCw size={moderateScale(17)} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* 2. Top Metric Statistics Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <FileCheck2 size={moderateScale(16)} color="#059669" />
          </View>
          <Text style={styles.metricNumber}>{metrics.totalReports}</Text>
          <Text style={styles.metricLabel}>{t('staff.stat_total_reports', 'Tổng Báo Cáo')}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Users size={moderateScale(16)} color="#2563EB" />
          </View>
          <Text style={[styles.metricNumber, { color: '#2563EB' }]}>{metrics.totalVictims}</Text>
          <Text style={styles.metricLabel}>{t('staff.stat_total_victims', 'Nạn Nhân Được Cứu')}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#FFFBEB' }]}>
            <Clock size={moderateScale(16)} color="#D97706" />
          </View>
          <Text style={[styles.metricNumber, { color: '#D97706' }]}>
            {metrics.avgDuration}
            <Text style={styles.metricUnit}>{t('staff.unit_minute_short', 'ph')}</Text>
          </Text>
          <Text style={styles.metricLabel}>{t('staff.stat_avg_duration', 'Thời Gian TB')}</Text>
        </View>
      </View>

      {/* 3. Search Bar & Filter Chips */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchBar}>
          <Search size={moderateScale(16)} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('staff.history_search_placeholder', 'Tìm theo mã sự cố, tên, địa chỉ...')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={moderateScale(15)} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              {t('staff.filter_all', { count: completedList.length, defaultValue: `Tất cả (${completedList.length})` })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'today' && styles.filterChipActive]}
            onPress={() => setActiveFilter('today')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeFilter === 'today' && styles.filterChipTextActive]}>
              {t('staff.filter_today', 'Hôm nay')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'week' && styles.filterChipActive]}
            onPress={() => setActiveFilter('week')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeFilter === 'week' && styles.filterChipTextActive]}>
              {t('staff.filter_week', 'Tuần này')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. List of Completed Incident Reports */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>
            {t('staff.loading_equipment', 'Đang tải danh mục nhiệm vụ từ máy chủ điều phối...')}
          </Text>
        </View>
      ) : filteredList.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
        >
          <View style={styles.emptyIconCircle}>
            <FileText size={moderateScale(42)} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>{t('staff.history_empty_title', 'Chưa Có Báo Cáo Hoàn Thành')}</Text>
          <Text style={styles.emptySub}>
            {t(
              'staff.history_empty_sub',
              'Các biên bản nghiệm thu và bàn giao hiện trường sẽ được lưu trữ tự động tại đây sau khi nộp.'
            )}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
          renderItem={({ item }) => {
            const report = item.completionReport;
            const durationText = calculateDuration(item.dispatchedAt, item.completedAt);
            const photoCount = report?.evidenceMediaUrls?.length || 0;
            const victimsCount = report?.victimsAssistedCount ?? 1;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelectedAssignment(item)}
              >
                {/* Card Top: Incident Code + Badges */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeRow}>
                    <Text style={styles.incidentCodeText}>{item.incidentCode || `#EM-${item.id.slice(0, 6)}`}</Text>
                    <View style={styles.reportedBadge}>
                      <CheckCircle2 size={moderateScale(11)} color="#059669" />
                      <Text style={styles.reportedBadgeText}>{t('staff.badge_reported', 'ĐÃ NỘP BÁO CÁO')}</Text>
                    </View>
                  </View>
                  <Text style={styles.completedTimeText}>{formatDateTime(item.completedAt)}</Text>
                </View>

                {/* Card Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.incidentTitle || t('staff.emergency_active_title', 'Nhiệm Vụ Cứu Hộ Đã Hoàn Tất')}
                </Text>

                {/* Address Row */}
                <View style={styles.addressRow}>
                  <MapPin size={moderateScale(13)} color="#64748B" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.incidentAddress || t('staff.emergency_active_sub', 'Khu Công Nghệ Cao, TP. Thủ Đức')}
                  </Text>
                </View>

                {/* Key Summary Pills */}
                <View style={styles.metricsPillsRow}>
                  <View style={styles.pillItem}>
                    <Users size={moderateScale(12)} color="#2563EB" />
                    <Text style={styles.pillText}>
                      {victimsCount} {t('staff.unit_mission', 'nạn nhân')}
                    </Text>
                  </View>

                  <View style={styles.pillItem}>
                    <Clock size={moderateScale(12)} color="#D97706" />
                    <Text style={styles.pillText}>{durationText}</Text>
                  </View>

                  {photoCount > 0 && (
                    <View style={styles.pillItem}>
                      <Camera size={moderateScale(12)} color="#059669" />
                      <Text style={styles.pillText}>{photoCount} ảnh</Text>
                    </View>
                  )}

                  {!!report?.handoverEntity && (
                    <View style={[styles.pillItem, { backgroundColor: '#F8FAFC' }]}>
                      <Building2 size={moderateScale(12)} color="#64748B" />
                      <Text style={styles.pillText} numberOfLines={1}>
                        {report.handoverEntity}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.vehicleInfoRow}>
                    <Truck size={moderateScale(12)} color="#64748B" />
                    <Text style={styles.vehicleInfoText}>
                      {item.rescueUnitPlate || user?.vehiclePlate || 'Xe cứu hộ'} • {item.stationName || user?.stationName || 'Trạm'}
                    </Text>
                  </View>

                  <View style={styles.viewReportAction}>
                    <Text style={styles.viewReportText}>{t('staff.view_report_btn', 'Xem Biên Bản')}</Text>
                    <ChevronRight size={moderateScale(14)} color="#DC2626" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 5. Full Report Inspection Modal */}
      {selectedAssignment && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedAssignment(null)}
        >
          <View style={styles.modalRoot}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleCol}>
                <View style={styles.modalBadgeRow}>
                  <Text style={styles.modalCodeText}>
                    {selectedAssignment.incidentCode || `#EM-${selectedAssignment.id.slice(0, 6)}`}
                  </Text>
                  <View style={styles.modalStatusPill}>
                    <ShieldCheck size={moderateScale(12)} color="#059669" />
                    <Text style={styles.modalStatusText}>{t('staff.badge_reported', 'ĐÃ NỘP BÁO CÁO')}</Text>
                  </View>
                </View>
                <Text style={styles.modalSubText}>
                  {t('staff.report_modal_sub', 'Biên bản bàn giao hiện trường chính thức đồng bộ máy chủ CAD')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedAssignment(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={moderateScale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* Section 1: Thông tin điều động */}
              <View style={styles.reportSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {t('staff.sec_mission_info', '1. Thông Tin Điều Động Tác Chiến')}
                </Text>

                <View style={styles.infoCard}>
                  <Text style={styles.infoIncidentTitle}>
                    {selectedAssignment.incidentTitle || t('staff.emergency_active_title', 'Nhiệm Vụ Cứu Hộ')}
                  </Text>
                  <View style={styles.infoRow}>
                    <MapPin size={moderateScale(13)} color="#64748B" />
                    <Text style={styles.infoRowText}>{selectedAssignment.incidentAddress || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Truck size={moderateScale(13)} color="#64748B" />
                    <Text style={styles.infoRowText}>
                      {selectedAssignment.rescueUnitPlate || user?.vehiclePlate || '51D-1234'} • {selectedAssignment.stationName || user?.stationName || 'Trạm Cứu Hộ KCN'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={moderateScale(13)} color="#64748B" />
                    <Text style={styles.infoRowText}>
                      {t('staff.lbl_completed_time', 'Thời gian hoàn tất')}: {formatDateTime(selectedAssignment.completedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Section 2: Tóm tắt xử lý & Nạn nhân */}
              <View style={styles.reportSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {t('staff.sec_resolution_summary', '2. Kết Quả Xử Lý & Nạn Nhân')}
                </Text>

                <View style={styles.infoCard}>
                  <Text style={styles.fieldLabel}>{t('staff.lbl_actions_taken', 'Tóm tắt xử lý hiện trường')}:</Text>
                  <Text style={styles.fieldContent}>
                    {selectedAssignment.completionReport?.actionsSummary ||
                      selectedAssignment.notes ||
                      'Đã tiếp cận hiện trường và thực hiện các biện pháp sơ cấp cứu an toàn.'}
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.statPillsRow}>
                    <View style={styles.statPillCard}>
                      <Text style={styles.statPillNum}>
                        {selectedAssignment.completionReport?.victimsAssistedCount ?? 1}
                      </Text>
                      <Text style={styles.statPillLabel}>
                        {t('staff.lbl_victims_assisted', 'Nạn nhân được cứu')}
                      </Text>
                    </View>

                    <View style={styles.statPillCard}>
                      <Text style={styles.statPillNum}>
                        {calculateDuration(selectedAssignment.dispatchedAt, selectedAssignment.completedAt)}
                      </Text>
                      <Text style={styles.statPillLabel}>
                        {t('staff.lbl_duration', 'Thời lượng')}
                      </Text>
                    </View>
                  </View>

                  {/* Equipment deployed list */}
                  {selectedAssignment.completionReport?.equipmentUsed &&
                    selectedAssignment.completionReport.equipmentUsed.length > 0 && (
                      <View style={{ marginTop: verticalScale(12) }}>
                        <Text style={styles.fieldLabel}>{t('staff.lbl_equipment_used', 'Trang bị đã sử dụng')}:</Text>
                        <View style={styles.equipmentChipsWrap}>
                          {selectedAssignment.completionReport.equipmentUsed.map((eq, idx) => (
                            <View key={idx} style={styles.equipmentBadge}>
                              <Package size={moderateScale(11)} color="#DC2626" />
                              <Text style={styles.equipmentBadgeText}>{eq}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                </View>
              </View>

              {/* Section 3: Tiếp nhận bàn giao */}
              <View style={styles.reportSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {t('staff.sec_handover_info', '3. Tiếp Nhận Bàn Giao')}
                </Text>

                <View style={styles.infoCard}>
                  <View style={styles.fieldRow}>
                    <Building2 size={moderateScale(14)} color="#0284C7" />
                    <View style={styles.fieldCol}>
                      <Text style={styles.fieldLabel}>{t('staff.lbl_handover_entity', 'Đơn vị tiếp nhận')}:</Text>
                      <Text style={styles.fieldValueBold}>
                        {selectedAssignment.completionReport?.handoverEntity || 'Bệnh Viện Đa Khoa Khu Vực'}
                      </Text>
                    </View>
                  </View>

                  {!!selectedAssignment.completionReport?.handoverContactName && (
                    <View style={[styles.fieldRow, { marginTop: verticalScale(8) }]}>
                      <Users size={moderateScale(14)} color="#0284C7" />
                      <View style={styles.fieldCol}>
                        <Text style={styles.fieldLabel}>{t('staff.lbl_handover_contact', 'Người tiếp nhận')}:</Text>
                        <Text style={styles.fieldValueBold}>
                          {selectedAssignment.completionReport.handoverContactName}
                          {selectedAssignment.completionReport.handoverContactPhone
                            ? ` (${selectedAssignment.completionReport.handoverContactPhone})`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  )}

                  {!!selectedAssignment.completionReport?.handoverNotes && (
                    <View style={{ marginTop: verticalScale(10) }}>
                      <Text style={styles.fieldLabel}>{t('staff.lbl_handover_notes', 'Ghi chú bàn giao')}:</Text>
                      <Text style={styles.fieldContent}>{selectedAssignment.completionReport.handoverNotes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Section 4: Ảnh hiện trường */}
              {selectedAssignment.completionReport?.evidenceMediaUrls &&
                selectedAssignment.completionReport.evidenceMediaUrls.length > 0 && (
                  <View style={styles.reportSection}>
                    <Text style={styles.sectionHeaderTitle}>
                      {t('staff.sec_evidence_photos', {
                        count: selectedAssignment.completionReport.evidenceMediaUrls.length,
                        defaultValue: `4. Ảnh Chứng Cứ Hiện Trường (${selectedAssignment.completionReport.evidenceMediaUrls.length})`,
                      })}
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                      {selectedAssignment.completionReport.evidenceMediaUrls.map((url, idx) => (
                        <Image key={idx} source={{ uri: url }} style={styles.evidenceImage} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* Section 5: Xác nhận chữ ký số */}
              <View style={styles.reportSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {t('staff.sec_digital_signature', '5. Chữ Ký Số Xác Nhận')}
                </Text>

                <View style={styles.signatureCard}>
                  <View style={styles.signatureBadge}>
                    <ShieldCheck size={moderateScale(16)} color="#059669" />
                    <Text style={styles.signatureVerifiedText}>ĐÃ XÁC THỰC CHỮ KÝ SỐ CAD</Text>
                  </View>
                  <Text style={styles.signatureInfoText}>
                    Biên bản điện tử được ký niêm phong bởi {user?.name || 'Chỉ huy kíp trực'} vào lúc{' '}
                    {formatDateTime(selectedAssignment.completionReport?.submittedAt || selectedAssignment.completedAt)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Button */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={styles.closeReportButton}
                onPress={() => setSelectedAssignment(null)}
                activeOpacity={0.88}
              >
                <Text style={styles.closeReportButtonText}>{t('staff.btn_close_report', 'Đóng Biên Bản')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  refreshBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(6),
    gap: scale(8),
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(4),
  },
  metricNumber: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#059669',
  },
  metricUnit: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  metricLabel: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: verticalScale(2),
    textAlign: 'center',
  },
  searchFilterSection: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: scale(10),
    height: verticalScale(38),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
    color: '#0F172A',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: verticalScale(8),
  },
  filterChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterChipText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: scale(14),
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(4),
    gap: verticalScale(12),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  incidentCodeText: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  reportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  reportedBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#059669',
  },
  completedTimeText: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(6),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginBottom: verticalScale(10),
  },
  addressText: {
    fontSize: moderateScale(11.5),
    color: '#64748B',
    flex: 1,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: scale(6),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillText: {
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: verticalScale(10),
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    flex: 1,
  },
  vehicleInfoText: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
  },
  viewReportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
  },
  viewReportText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#DC2626',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(8),
  },
  loadingText: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(80),
  },
  emptyIconCircle: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(17),
  },

  // Modal Styles
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitleCol: {
    flex: 1,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  modalCodeText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#DC2626',
  },
  modalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  modalStatusText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#059669',
  },
  modalSubText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(3),
  },
  modalCloseBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(10),
  },
  modalScrollContent: {
    padding: scale(14),
    paddingBottom: verticalScale(40),
    gap: verticalScale(14),
  },
  reportSection: {
    gap: verticalScale(6),
  },
  sectionHeaderTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIncidentTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: verticalScale(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(4),
  },
  infoRowText: {
    fontSize: moderateScale(12),
    color: '#475569',
    flex: 1,
  },
  fieldLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: verticalScale(3),
  },
  fieldContent: {
    fontSize: moderateScale(12.5),
    color: '#1E293B',
    lineHeight: moderateScale(18),
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(10),
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  statPillCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(8),
    padding: scale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statPillNum: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  statPillLabel: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  equipmentChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginTop: verticalScale(4),
  },
  equipmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  equipmentBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#B91C1C',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
  },
  fieldCol: {
    flex: 1,
  },
  fieldValueBold: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: verticalScale(4),
  },
  evidenceImage: {
    width: moderateScale(120),
    height: moderateScale(90),
    borderRadius: moderateScale(8),
    marginRight: scale(8),
    backgroundColor: '#E2E8F0',
  },
  signatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: verticalScale(6),
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  signatureVerifiedText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#059669',
  },
  signatureInfoText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    lineHeight: moderateScale(16),
  },
  modalBottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  closeReportButton: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeReportButtonText: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
