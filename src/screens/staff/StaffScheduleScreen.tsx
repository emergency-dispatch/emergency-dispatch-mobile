import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Clock,
  Sun,
  Sunset,
  Moon,
  Zap,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Info,
  CalendarCheck,
  Check,
  X,
  FileText,
  BadgeAlert,
  Layers,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';
import {
  WorkShift,
  ShiftType,
  ShiftRole,
  ShiftStatus,
  ShiftSwapPayload,
  BatchRegisterShiftsPayload,
} from '../../types/schedule';
import {
  scheduleService,
  SHIFT_DEFINITIONS,
  RESCUE_STATIONS,
  ROLE_LABELS,
  formatDateKey,
} from '../../services/schedule.service';

type ActiveTab = 'register' | 'my_shifts' | 'summary';

interface DayItem {
  date: Date;
  dateKey: string;
  dayNameVi: string;
  dayNameEn: string;
  dayNum: number;
  monthNum: number;
  isToday: boolean;
}

export const StaffScheduleScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const isEnglish = !i18n.language?.startsWith('vi');

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('register');
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Week offset state (0 = current week, 1 = next week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // MULTI-DAY SELECTION: List of selected date keys (YYYY-MM-DD)
  const [selectedDateKeys, setSelectedDateKeys] = useState<string[]>(() => [formatDateKey(new Date())]);

  // MULTI-SHIFT SELECTION: List of selected shift types
  const [selectedShiftTypes, setSelectedShiftTypes] = useState<ShiftType[]>(['morning']);

  // Role and Station State
  const [selectedRole, setSelectedRole] = useState<ShiftRole>('driver');
  const [selectedStationId, setSelectedStationId] = useState<string>('station_tanbinh');
  const [isOnCallStandby, setIsOnCallStandby] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Filter state for "My Shifts" tab
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'completed'>('all');

  // Modals state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [shiftToCancel, setShiftToCancel] = useState<WorkShift | null>(null);

  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [shiftToSwap, setShiftToSwap] = useState<WorkShift | null>(null);
  const [swapColleague, setSwapColleague] = useState('');
  const [swapReason, setSwapReason] = useState('');

  // Load shifts from service
  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getAllShifts();
      setShifts(data);
    } catch (err) {
      console.error('Error loading shifts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  // Compute 7 days of the active week based on weekOffset
  const weekDays = useMemo<DayItem[]>(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() + diffToMonday + weekOffset * 7);

    const days: DayItem[] = [];
    const dayNamesVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const todayKey = formatDateKey(today);

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      const key = formatDateKey(d);

      days.push({
        date: d,
        dateKey: key,
        dayNameVi: dayNamesVi[i],
        dayNameEn: dayNamesEn[i],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        isToday: key === todayKey,
      });
    }

    return days;
  }, [weekOffset]);

  // Ensure at least one day in the current week view is selected when week changes
  useEffect(() => {
    const hasAnyInView = weekDays.some((d) => selectedDateKeys.includes(d.dateKey));
    if (!hasAnyInView && weekDays.length > 0) {
      setSelectedDateKeys([weekDays[0].dateKey]);
    }
  }, [weekDays, selectedDateKeys]);

  // Weekly range string (e.g. 13/10 - 19/10/2026)
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.dayNum}/${start.monthNum} - ${end.dayNum}/${end.monthNum}/${end.date.getFullYear()}`;
  }, [weekDays]);

  // Weekly Summary
  const weeklySummary = useMemo(() => {
    const keys = weekDays.map((d) => d.dateKey);
    return scheduleService.calculateWeeklySummary(shifts, keys);
  }, [shifts, weekDays]);

  // Shifts registered on any of the selected dates
  const shiftsOnSelectedDays = useMemo(() => {
    return shifts.filter((s) => selectedDateKeys.includes(s.date) && s.status !== 'cancelled');
  }, [shifts, selectedDateKeys]);

  // Filtered shifts for "My Shifts" tab
  const filteredMyShifts = useMemo(() => {
    return shifts
      .filter((s) => s.status !== 'cancelled')
      .filter((s) => {
        if (statusFilter === 'all') return true;
        return s.status === statusFilter;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, statusFilter]);

  // Day shift lookup to display dot indicators on calendar
  const dayShiftStatusMap = useMemo(() => {
    const map: Record<string, { hasApproved: boolean; hasPending: boolean }> = {};
    shifts.forEach((s) => {
      if (s.status === 'cancelled') return;
      if (!map[s.date]) {
        map[s.date] = { hasApproved: false, hasPending: false };
      }
      if (s.status === 'approved' || s.status === 'completed') {
        map[s.date].hasApproved = true;
      }
      if (s.status === 'pending') {
        map[s.date].hasPending = true;
      }
    });
    return map;
  }, [shifts]);

  // Toggle day selection (Multi-day)
  const toggleDateSelection = (dateKey: string) => {
    setSelectedDateKeys((prev) => {
      if (prev.includes(dateKey)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter((k) => k !== dateKey);
      }
      return [...prev, dateKey].sort();
    });
  };

  // Quick preset: Select Mon - Fri (Weekdays)
  const selectWeekdays = () => {
    const weekdayKeys = weekDays.slice(0, 5).map((d) => d.dateKey);
    setSelectedDateKeys(weekdayKeys);
  };

  // Quick preset: Select Sat - Sun (Weekend)
  const selectWeekend = () => {
    const weekendKeys = weekDays.slice(5, 7).map((d) => d.dateKey);
    setSelectedDateKeys(weekendKeys);
  };

  // Quick preset: Select Today only
  const selectTodayOnly = () => {
    const today = new Date();
    const todayKey = formatDateKey(today);
    setSelectedDateKeys([todayKey]);
  };

  // Quick preset: Select all 7 days
  const selectAll7Days = () => {
    setSelectedDateKeys(weekDays.map((d) => d.dateKey));
  };

  // Quick preset: Set Shift Types
  const setShiftPreset = (types: ShiftType[]) => {
    setSelectedShiftTypes(types);
  };

  // Toggle shift selection (Multi-shift)
  const toggleShiftType = (type: ShiftType) => {
    setSelectedShiftTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev; // Keep at least one shift
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Real-time calculation: Total shifts and hours to register
  const totalShiftsCount = selectedDateKeys.length * selectedShiftTypes.length;
  const totalCalculatedHours = useMemo(() => {
    const singleDayHours = selectedShiftTypes.reduce((sum, type) => {
      const def = SHIFT_DEFINITIONS.find((d) => d.type === type);
      return sum + (def ? def.hours : 8);
    }, 0);
    return selectedDateKeys.length * singleDayHours;
  }, [selectedDateKeys, selectedShiftTypes]);

  // Handle Batch Shift Registration Submit
  const handleBatchRegisterShifts = async () => {
    if (selectedDateKeys.length === 0) {
      Alert.alert(
        isEnglish ? 'No Dates Selected' : 'Chưa Chọn Ngày',
        isEnglish ? 'Please select at least 1 date.' : 'Vui lòng chọn ít nhất một ngày trực.'
      );
      return;
    }

    if (selectedShiftTypes.length === 0) {
      Alert.alert(
        isEnglish ? 'No Shifts Selected' : 'Chưa Chọn Ca Trực',
        isEnglish ? 'Please select at least 1 shift.' : 'Vui lòng chọn ít nhất một ca trực.'
      );
      return;
    }

    const payload: BatchRegisterShiftsPayload = {
      dates: selectedDateKeys,
      shiftTypes: selectedShiftTypes,
      role: selectedRole,
      stationId: selectedStationId,
      notes: notes.trim(),
      isOnCallStandby,
    };

    const res = await scheduleService.batchRegisterShifts(payload);

    if (!res.success && res.registeredCount === 0) {
      Alert.alert(
        isEnglish ? 'Registration Conflict' : 'Trùng Lịch Đăng Ký',
        res.message
      );
      return;
    }

    Alert.alert(
      isEnglish ? 'Batch Registration Success' : 'Đăng Ký Thành Công',
      res.message,
      [
        {
          text: isEnglish ? 'View My Schedule' : 'Xem Lịch Của Tôi',
          onPress: () => setActiveTab('my_shifts'),
        },
        { text: 'OK' },
      ]
    );

    setNotes('');
    await loadShifts();
  };

  // Handle Shift Cancellation Confirm
  const handleConfirmCancelShift = async () => {
    if (!shiftToCancel) return;
    const res = await scheduleService.cancelShift(shiftToCancel.id, 'Nhân viên yêu cầu hủy');
    setCancelModalVisible(false);
    setShiftToCancel(null);

    if (res.success) {
      Alert.alert(
        isEnglish ? 'Shift Cancelled' : 'Đã Hủy Ca Trực',
        isEnglish
          ? 'The shift registration has been cancelled.'
          : 'Đã hủy đăng ký ca trực thành công.'
      );
      await loadShifts();
    } else {
      Alert.alert(isEnglish ? 'Error' : 'Lỗi', res.message || 'Không thể hủy ca trực');
    }
  };

  // Handle Shift Swap Submit
  const handleConfirmSwap = async () => {
    if (!shiftToSwap) return;
    if (!swapColleague.trim()) {
      Alert.alert(
        isEnglish ? 'Missing Information' : 'Thiếu Thông Tin',
        isEnglish
          ? 'Please enter the colleague\'s name or Staff ID.'
          : 'Vui lòng nhập tên hoặc Mã NV của đồng đội cần đổi ca.'
      );
      return;
    }

    const payload: ShiftSwapPayload = {
      shiftId: shiftToSwap.id,
      targetColleagueName: swapColleague.trim(),
      reason: swapReason.trim() || 'Lý do cá nhân',
    };

    const res = await scheduleService.requestShiftSwap(payload);
    setSwapModalVisible(false);
    setShiftToSwap(null);
    setSwapColleague('');
    setSwapReason('');

    if (res.success) {
      Alert.alert(
        isEnglish ? 'Swap Request Sent' : 'Đã Gửi Yêu Cầu Đổi Ca',
        isEnglish
          ? 'Your swap request has been logged and sent to IP command for review.'
          : 'Yêu cầu đổi ca trực đã được gửi tới Ban Chỉ Huy KCN và đồng đội xác nhận.'
      );
      await loadShifts();
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      safeArea
      edges={['top', 'left', 'right']}
      statusBarStyle="dark-content"
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleCol}>
          <View style={styles.headerBadgeRow}>
            <View style={styles.headerIconBadge}>
              <CalendarDays size={moderateScale(16)} color="#DC2626" />
            </View>
            <Text style={styles.headerMainTitle}>
              {isEnglish ? 'INDUSTRIAL PARK SHIFT ROSTER' : 'ĐĂNG KÝ CA TRỰC KCN'}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {user?.name || 'Đội Trưởng Lê Quốc Huy'} • {user?.teamName || 'Đội Cứu Hộ & PCCC KCN'} (ST-8821)
          </Text>
        </View>

        {/* Weekly hours mini gauge badge */}
        <View style={styles.hoursGaugeBadge}>
          <Text style={styles.hoursGaugeLabel}>
            {isEnglish ? 'Weekly Hours' : 'Số Giờ Tuần'}
          </Text>
          <Text style={styles.hoursGaugeVal}>
            {weeklySummary.totalRegisteredHours}h
            <Text style={styles.hoursGaugeTarget}>/{weeklySummary.targetWeeklyHours}h</Text>
          </Text>
        </View>
      </View>

      {/* 2. Week Navigation Bar & Multi-Day Carousel */}
      <View style={styles.weekPickerContainer}>
        <View style={styles.weekNavRow}>
          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekOffset((prev) => prev - 1)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={moderateScale(18)} color="#0F172A" />
            <Text style={styles.weekNavBtnText}>{isEnglish ? 'Prev' : 'Tuần Trước'}</Text>
          </TouchableOpacity>

          <View style={styles.weekLabelWrapper}>
            <Text style={styles.weekLabelText}>
              {weekOffset === 0
                ? (isEnglish ? 'CURRENT WEEK' : 'TUẦN NÀY')
                : weekOffset === 1
                ? (isEnglish ? 'NEXT WEEK' : 'TUẦN TỚI')
                : (isEnglish ? `WEEK (${weekOffset})` : `TUẦN (${weekOffset})`)}
            </Text>
            <Text style={styles.weekDateRangeText}>{weekRangeLabel}</Text>
          </View>

          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekOffset((prev) => prev + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.weekNavBtnText}>{isEnglish ? 'Next' : 'Tuần Tới'}</Text>
            <ChevronRight size={moderateScale(18)} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Quick Multi-Day Select Preset Chips */}
        <View style={styles.quickPresetRow}>
          <Text style={styles.quickPresetHint}>
            {isEnglish ? 'Pick days:' : 'Chọn ngày:'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPresetScroll}
          >
            <TouchableOpacity
              style={[
                styles.quickPresetChip,
                selectedDateKeys.length === 1 && selectedDateKeys.includes(formatDateKey(new Date())) && styles.quickPresetChipActive,
              ]}
              onPress={selectTodayOnly}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.quickPresetChipText,
                  selectedDateKeys.length === 1 && selectedDateKeys.includes(formatDateKey(new Date())) && styles.quickPresetChipTextActive,
                ]}
              >
                Hôm nay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPresetChip,
                selectedDateKeys.length === 5 && styles.quickPresetChipActive,
              ]}
              onPress={selectWeekdays}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.quickPresetChipText,
                  selectedDateKeys.length === 5 && styles.quickPresetChipTextActive,
                ]}
              >
                T2 - T6
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPresetChip,
                selectedDateKeys.length === 2 && styles.quickPresetChipActive,
              ]}
              onPress={selectWeekend}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.quickPresetChipText,
                  selectedDateKeys.length === 2 && styles.quickPresetChipTextActive,
                ]}
              >
                T7 - CN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPresetChip,
                selectedDateKeys.length === 7 && styles.quickPresetChipActive,
              ]}
              onPress={selectAll7Days}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.quickPresetChipText,
                  selectedDateKeys.length === 7 && styles.quickPresetChipTextActive,
                ]}
              >
                Cả 7 ngày
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.selectedCountBadge}>
            <Text style={styles.selectedCountBadgeText}>
              {selectedDateKeys.length} {isEnglish ? 'days' : 'ngày'}
            </Text>
          </View>
        </View>

        {/* 7-Day Multi-Select Strip */}
        <View style={styles.daysRow}>
          {weekDays.map((item) => {
            const isSelected = selectedDateKeys.includes(item.dateKey);
            const statusInfo = dayShiftStatusMap[item.dateKey];

            return (
              <TouchableOpacity
                key={item.dateKey}
                activeOpacity={0.8}
                style={[
                  styles.dayCard,
                  isSelected && styles.dayCardSelected,
                  item.isToday && !isSelected && styles.dayCardToday,
                ]}
                onPress={() => toggleDateSelection(item.dateKey)}
              >
                {/* Mini check icon when selected */}
                {isSelected && (
                  <View style={styles.dayCardCheckDot}>
                    <Check size={moderateScale(9)} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}

                <Text
                  style={[
                    styles.dayNameText,
                    isSelected && styles.dayNameTextSelected,
                    item.isToday && !isSelected && styles.dayNameTextToday,
                  ]}
                >
                  {isEnglish ? item.dayNameEn : item.dayNameVi}
                </Text>
                <Text
                  style={[
                    styles.dayNumText,
                    isSelected && styles.dayNumTextSelected,
                    item.isToday && !isSelected && styles.dayNumTextToday,
                  ]}
                >
                  {item.dayNum}
                </Text>

                {/* Dot indicator for registered shifts */}
                <View style={styles.dotContainer}>
                  {statusInfo?.hasApproved ? (
                    <View style={[styles.statusDot, styles.dotApproved]} />
                  ) : statusInfo?.hasPending ? (
                    <View style={[styles.statusDot, styles.dotPending]} />
                  ) : (
                    <View style={[styles.statusDot, styles.dotEmpty]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Segmented Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
          onPress={() => setActiveTab('register')}
        >
          <Plus size={moderateScale(15)} color={activeTab === 'register' ? '#DC2626' : '#64748B'} />
          <Text
            style={[styles.tabButtonText, activeTab === 'register' && styles.tabButtonTextActive]}
          >
            {isEnglish ? 'Register Shift' : 'Đăng Ký Ca'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'my_shifts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my_shifts')}
        >
          <CalendarCheck
            size={moderateScale(15)}
            color={activeTab === 'my_shifts' ? '#DC2626' : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'my_shifts' && styles.tabButtonTextActive]}
          >
            {isEnglish ? 'My Schedule' : 'Lịch Của Tôi'}
            {filteredMyShifts.length > 0 ? ` (${filteredMyShifts.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'summary' && styles.tabButtonActive]}
          onPress={() => setActiveTab('summary')}
        >
          <RefreshCw
            size={moderateScale(14)}
            color={activeTab === 'summary' ? '#DC2626' : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'summary' && styles.tabButtonTextActive]}
          >
            {isEnglish ? 'Overview & Swap' : 'Thống Kê & Đổi Ca'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Tab Body Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#DC2626"
            colors={['#DC2626']}
          />
        }
      >
        {/* ==================== TAB 1: REGISTER NEW SHIFT ==================== */}
        {activeTab === 'register' && (
          <View style={styles.tabContentWrapper}>
            {/* Batch Registration Tip Banner */}
            <View style={styles.batchTipBanner}>
              <Sparkles size={moderateScale(15)} color="#DC2626" />
              <Text style={styles.batchTipText}>
                {isEnglish
                  ? 'Batch Registration Active: Select multiple days above and tick multiple shifts below to register all at once.'
                  : 'Đăng Ký Hàng Loạt: Bạn có thể chọn cùng lúc NHIỀU NGÀY ở trên và tick NHIỀU CA TRỰC ở dưới để đăng ký trọn gói trong 1 lần nhấn.'}
              </Text>
            </View>

            {/* Multi-Day Selection Header Banner */}
            <View style={styles.multiDateBanner}>
              <View style={styles.multiDateHeaderRow}>
                <View style={styles.multiDateIconWrap}>
                  <CalendarDays size={moderateScale(18)} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.multiDateTitle}>
                    {isEnglish ? 'Selected Dates for Duty' : 'Các Ngày Được Chọn'}{' '}
                    <Text style={styles.multiDateCountHighlight}>
                      ({selectedDateKeys.length} {isEnglish ? 'days' : 'ngày'})
                    </Text>
                  </Text>
                  <Text style={styles.multiDateSub}>
                    {isEnglish
                      ? 'Tap any day in the top strip to add or remove it from your roster'
                      : 'Chạm vào các ngày ở thanh trên để chọn thêm hoặc bỏ ngày trực'}
                  </Text>
                </View>
              </View>

              {/* Selected Dates Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedDatesScroll}
              >
                {selectedDateKeys.map((key) => {
                  const parts = key.split('-');
                  return (
                    <View key={key} style={styles.selectedDatePill}>
                      <Text style={styles.selectedDatePillText}>
                        {parts[2]}/{parts[1]}
                      </Text>
                      {selectedDateKeys.length > 1 && (
                        <TouchableOpacity
                          onPress={() => toggleDateSelection(key)}
                          style={styles.selectedDatePillClose}
                        >
                          <X size={moderateScale(11)} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Warning if any selected days already have registered shifts */}
            {shiftsOnSelectedDays.length > 0 && (
              <View style={styles.existingShiftsAlertBox}>
                <BadgeAlert size={moderateScale(18)} color="#D97706" />
                <View style={{ flex: 1, marginLeft: scale(8) }}>
                  <Text style={styles.existingShiftsAlertTitle}>
                    {isEnglish ? 'Existing shifts on selected days:' : 'Lịch trực đã có trong các ngày này:'}
                  </Text>
                  {shiftsOnSelectedDays.map((s) => (
                    <Text key={s.id} style={styles.existingShiftsAlertDesc}>
                      • {s.date.split('-').reverse().join('/')}: {s.title} ({s.startTime} - {s.endTime}) -{' '}
                      <Text
                        style={{
                          fontWeight: '700',
                          color: s.status === 'approved' ? '#059669' : '#D97706',
                        }}
                      >
                        {s.status === 'approved' ? 'Đã Duyệt' : 'Chờ Duyệt'}
                      </Text>
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* 1. Choose Shift Types (Multi-shift selection) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                {isEnglish ? '1. SELECT INDUSTRIAL SHIFTS' : '1. CHỌN CA TRỰC KCN'}
              </Text>
              <View style={styles.sectionBadgeCount}>
                <Text style={styles.sectionBadgeCountText}>
                  {selectedShiftTypes.length} {isEnglish ? 'selected' : 'ca đã chọn'}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionSubHint}>
              {isEnglish
                ? 'Select one or multiple shifts to register across all chosen dates.'
                : 'Có thể tick chọn nhiều ca trực cùng lúc để đăng ký cho tất cả các ngày đã chọn.'}
            </Text>

            {/* Quick Shift Selection Presets */}
            <View style={styles.shiftPresetsRow}>
              <Text style={styles.shiftPresetsHint}>
                {isEnglish ? 'Pick shifts:' : 'Chọn ca:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shiftPresetsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.shiftPresetChip,
                    selectedShiftTypes.length === 1 && selectedShiftTypes.includes('morning') && styles.shiftPresetChipActive,
                  ]}
                  onPress={() => setShiftPreset(['morning'])}
                >
                  <Text
                    style={[
                      styles.shiftPresetChipText,
                      selectedShiftTypes.length === 1 && selectedShiftTypes.includes('morning') && styles.shiftPresetChipTextActive,
                    ]}
                  >
                    Sáng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shiftPresetChip,
                    selectedShiftTypes.length === 2 &&
                      selectedShiftTypes.includes('morning') &&
                      selectedShiftTypes.includes('afternoon') &&
                      styles.shiftPresetChipActive,
                  ]}
                  onPress={() => setShiftPreset(['morning', 'afternoon'])}
                >
                  <Text
                    style={[
                      styles.shiftPresetChipText,
                      selectedShiftTypes.length === 2 &&
                        selectedShiftTypes.includes('morning') &&
                        selectedShiftTypes.includes('afternoon') &&
                        styles.shiftPresetChipTextActive,
                    ]}
                  >
                    Sáng + Chiều
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shiftPresetChip,
                    selectedShiftTypes.length === 1 && selectedShiftTypes.includes('night') && styles.shiftPresetChipActive,
                  ]}
                  onPress={() => setShiftPreset(['night'])}
                >
                  <Text
                    style={[
                      styles.shiftPresetChipText,
                      selectedShiftTypes.length === 1 && selectedShiftTypes.includes('night') && styles.shiftPresetChipTextActive,
                    ]}
                  >
                    Đêm (+30%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shiftPresetChip,
                    selectedShiftTypes.length === 3 &&
                      selectedShiftTypes.includes('morning') &&
                      selectedShiftTypes.includes('afternoon') &&
                      selectedShiftTypes.includes('night') &&
                      styles.shiftPresetChipActive,
                  ]}
                  onPress={() => setShiftPreset(['morning', 'afternoon', 'night'])}
                >
                  <Text
                    style={[
                      styles.shiftPresetChipText,
                      selectedShiftTypes.length === 3 &&
                        selectedShiftTypes.includes('morning') &&
                        selectedShiftTypes.includes('afternoon') &&
                        selectedShiftTypes.includes('night') &&
                        styles.shiftPresetChipTextActive,
                    ]}
                  >
                    Cả 3 Ca
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shiftPresetChip,
                    selectedShiftTypes.length === 1 && selectedShiftTypes.includes('full24') && styles.shiftPresetChipActive,
                  ]}
                  onPress={() => setShiftPreset(['full24'])}
                >
                  <Text
                    style={[
                      styles.shiftPresetChipText,
                      selectedShiftTypes.length === 1 && selectedShiftTypes.includes('full24') && styles.shiftPresetChipTextActive,
                    ]}
                  >
                    24H Trực Chiến
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.shiftCardsGrid}>
              {SHIFT_DEFINITIONS.map((def) => {
                const isSelected = selectedShiftTypes.includes(def.type);

                return (
                  <TouchableOpacity
                    key={def.type}
                    activeOpacity={0.85}
                    style={[
                      styles.shiftCardItem,
                      isSelected && styles.shiftCardItemSelected,
                    ]}
                    onPress={() => toggleShiftType(def.type)}
                  >
                    <View style={styles.shiftCardTop}>
                      <View style={styles.shiftCardTopLeft}>
                        <View
                          style={[
                            styles.shiftCardIconCircle,
                            isSelected && styles.shiftCardIconCircleSelected,
                          ]}
                        >
                          {def.iconName === 'sun' && (
                            <Sun size={moderateScale(18)} color={isSelected ? '#DC2626' : '#D97706'} />
                          )}
                          {def.iconName === 'sunset' && (
                            <Sunset size={moderateScale(18)} color={isSelected ? '#DC2626' : '#EA580C'} />
                          )}
                          {def.iconName === 'moon' && (
                            <Moon size={moderateScale(18)} color={isSelected ? '#DC2626' : '#7C3AED'} />
                          )}
                          {def.iconName === 'zap' && (
                            <Zap size={moderateScale(18)} color={isSelected ? '#DC2626' : '#DC2626'} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.shiftCardName, isSelected && styles.shiftCardNameSelected]}>
                            {isEnglish ? def.nameEn : def.nameVi}
                          </Text>
                          <Text style={styles.shiftCardTimeText}>
                            {def.startTime} - {def.endTime}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.shiftCardTopRight}>
                        <View style={styles.shiftHoursBadge}>
                          <Clock size={moderateScale(11)} color="#0F172A" />
                          <Text style={styles.shiftHoursBadgeText}>{def.hours}h</Text>
                        </View>

                        {/* Multi-select Checkbox Indicator */}
                        <View
                          style={[
                            styles.multiCheckboxIndicator,
                            isSelected && styles.multiCheckboxIndicatorSelected,
                          ]}
                        >
                          {isSelected ? (
                            <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />
                          ) : (
                            <View style={styles.checkboxEmptyDot} />
                          )}
                        </View>
                      </View>
                    </View>

                    <Text style={styles.shiftCardDesc}>
                      {isEnglish ? def.descriptionEn : def.descriptionVi}
                    </Text>

                    {/* Bonus Badge if applicable */}
                    {def.stipendBonusVi && (
                      <View style={styles.bonusBadgePill}>
                        <Sparkles size={moderateScale(11)} color="#7C3AED" />
                        <Text style={styles.bonusBadgeText}>
                          {isEnglish ? def.stipendBonusEn : def.stipendBonusVi}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Choose Duty Role */}
            <Text style={styles.sectionHeaderTitle}>
              {isEnglish ? '2. SELECT ASSIGNED ROLE' : '2. VỊ TRÍ PHÂN CÔNG TẠI KCN'}
            </Text>

            <View style={styles.rolePillsContainer}>
              {(['driver', 'paramedic', 'dispatcher', 'rescuer'] as ShiftRole[]).map((roleKey) => {
                const isSelected = selectedRole === roleKey;
                const label = isEnglish ? ROLE_LABELS[roleKey].en : ROLE_LABELS[roleKey].vi;

                return (
                  <TouchableOpacity
                    key={roleKey}
                    activeOpacity={0.8}
                    style={[styles.rolePill, isSelected && styles.rolePillSelected]}
                    onPress={() => setSelectedRole(roleKey)}
                  >
                    <UserCheck
                      size={moderateScale(14)}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.rolePillText,
                        isSelected && styles.rolePillTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Choose Station */}
            <Text style={styles.sectionHeaderTitle}>
              {isEnglish ? '3. ASSIGNED INDUSTRIAL PARK BASE' : '3. TRẠM CỨU HỘ & PCCC KCN'}
            </Text>

            <View style={styles.stationsList}>
              {RESCUE_STATIONS.map((st) => {
                const isSelected = selectedStationId === st.id;

                return (
                  <TouchableOpacity
                    key={st.id}
                    activeOpacity={0.8}
                    style={[
                      styles.stationRowCard,
                      isSelected && styles.stationRowCardSelected,
                    ]}
                    onPress={() => setSelectedStationId(st.id)}
                  >
                    <View
                      style={[
                        styles.stationIconCircle,
                        isSelected && styles.stationIconCircleSelected,
                      ]}
                    >
                      <Building2
                        size={moderateScale(16)}
                        color={isSelected ? '#DC2626' : '#64748B'}
                      />
                    </View>

                    <View style={styles.stationTextCol}>
                      <View style={styles.stationCodeRow}>
                        <Text style={styles.stationCodePill}>{st.code}</Text>
                        <Text style={styles.stationName}>
                          {isEnglish ? st.nameEn : st.nameVi}
                        </Text>
                      </View>
                      <Text style={styles.stationAddress}>
                        {isEnglish ? st.addressEn : st.addressVi}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.stationRadioDot,
                        isSelected && styles.stationRadioDotSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.stationRadioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. On-call Standby Toggle */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextGroup}>
                <View style={styles.toggleTitleRow}>
                  <ShieldAlert size={moderateScale(16)} color="#DC2626" />
                  <Text style={styles.toggleTitle}>
                    {isEnglish ? 'Emergency Catastrophe Standby' : 'Sẵn Sàng Chi Viện Khẩn Cấp KCN'}
                  </Text>
                </View>
                <Text style={styles.toggleDesc}>
                  {isEnglish
                    ? 'Allow IP Emergency Command to activate rapid backup for hazmat leaks, factory explosions, or major structural fires.'
                    : 'Cho phép Ban chỉ huy KCN báo động chi viện khẩn khi xảy ra cháy nổ xưởng, tràn hóa chất hoặc thảm họa.'}
                </Text>
              </View>
              <Switch
                value={isOnCallStandby}
                onValueChange={setIsOnCallStandby}
                trackColor={{ false: '#CBD5E1', true: '#DC2626' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 5. Additional Notes */}
            <Text style={styles.sectionHeaderTitle}>
              {isEnglish ? '5. SPECIAL NOTES (OPTIONAL)' : '5. GHI CHÚ BỔ SUNG'}
            </Text>
            <View style={styles.noteInputWrapper}>
              <FileText size={moderateScale(16)} color="#64748B" style={styles.noteInputIcon} />
              <TextInput
                style={styles.noteTextInput}
                placeholder={
                  isEnglish
                    ? 'e.g. Assigned to IP Rescue Unit 51A-999.99, Hazmat suit & SCBA ready'
                    : 'VD: Kíp xe cứu hộ KCN 51A-999.99, chuẩn bị bộ đồ Hazmat và bình SCBA...'
                }
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* 6. Dynamic Real-time Calculation Summary Card */}
            <View style={styles.calculationCard}>
              <View style={styles.calcHeaderRow}>
                <Sparkles size={moderateScale(16)} color="#DC2626" />
                <Text style={styles.calcHeaderTitle}>
                  {isEnglish ? 'ROSTER REGISTRATION SUMMARY' : 'TỔNG HỢP CA ĐĂNG KÝ HÀNG LOẠT'}
                </Text>
              </View>

              <View style={styles.calcFormulaRow}>
                <View style={styles.calcFormulaItem}>
                  <Text style={styles.calcFormulaNum}>{selectedDateKeys.length}</Text>
                  <Text style={styles.calcFormulaLbl}>{isEnglish ? 'Days' : 'Ngày'}</Text>
                </View>

                <Text style={styles.calcFormulaOp}>×</Text>

                <View style={styles.calcFormulaItem}>
                  <Text style={styles.calcFormulaNum}>{selectedShiftTypes.length}</Text>
                  <Text style={styles.calcFormulaLbl}>{isEnglish ? 'Shifts' : 'Ca/ngày'}</Text>
                </View>

                <Text style={styles.calcFormulaOp}>=</Text>

                <View style={[styles.calcFormulaItem, styles.calcFormulaItemResult]}>
                  <Text style={styles.calcFormulaResultNum}>{totalShiftsCount}</Text>
                  <Text style={styles.calcFormulaResultLbl}>{isEnglish ? 'Shifts' : 'Lượt ca'}</Text>
                </View>

                <View style={styles.calcTotalHoursBadge}>
                  <Clock size={moderateScale(13)} color="#059669" />
                  <Text style={styles.calcTotalHoursText}>{totalCalculatedHours} giờ</Text>
                </View>
              </View>
            </View>

            {/* 7. Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitRegistrationBtn,
                (selectedDateKeys.length === 0 || selectedShiftTypes.length === 0) && styles.submitBtnDisabled,
              ]}
              onPress={handleBatchRegisterShifts}
              disabled={selectedDateKeys.length === 0 || selectedShiftTypes.length === 0}
            >
              <CalendarCheck size={moderateScale(19)} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.submitRegistrationText}>
                {isEnglish
                  ? `CONFIRM REGISTER ${totalShiftsCount} SHIFTS (${totalCalculatedHours} HRS)`
                  : `XÁC NHẬN ĐĂNG KÝ ${totalShiftsCount} CA TRỰC KCN (${totalCalculatedHours} GIỜ)`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================== TAB 2: MY SCHEDULE ==================== */}
        {activeTab === 'my_shifts' && (
          <View style={styles.tabContentWrapper}>
            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {(['all', 'approved', 'pending', 'completed'] as const).map((filterKey) => {
                const isSelected = statusFilter === filterKey;
                const filterLabels: Record<string, { vi: string; en: string }> = {
                  all: { vi: 'Tất Cả', en: 'All' },
                  approved: { vi: 'Đã Duyệt', en: 'Approved' },
                  pending: { vi: 'Chờ Duyệt', en: 'Pending' },
                  completed: { vi: 'Đã Trực', en: 'Completed' },
                };

                return (
                  <TouchableOpacity
                    key={filterKey}
                    activeOpacity={0.8}
                    style={[
                      styles.statusFilterPill,
                      isSelected && styles.statusFilterPillSelected,
                    ]}
                    onPress={() => setStatusFilter(filterKey)}
                  >
                    <Text
                      style={[
                        styles.statusFilterPillText,
                        isSelected && styles.statusFilterPillTextSelected,
                      ]}
                    >
                      {isEnglish ? filterLabels[filterKey].en : filterLabels[filterKey].vi}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* List of Shifts */}
            {filteredMyShifts.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <CalendarDays size={moderateScale(42)} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>
                  {isEnglish ? 'No Shifts Found' : 'Không có ca trực nào'}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {isEnglish
                    ? 'No registered duty shifts match this filter.'
                    : 'Chưa có ca trực nào phù hợp với bộ lọc hiện tại.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateActionBtn}
                  onPress={() => setActiveTab('register')}
                >
                  <Plus size={moderateScale(16)} color="#FFFFFF" />
                  <Text style={styles.emptyStateActionBtnText}>
                    {isEnglish ? 'Register Shift Now' : 'Đăng Ký Ca Mới Ngay'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredMyShifts.map((shift) => {
                const isApproved = shift.status === 'approved';
                const isPending = shift.status === 'pending';
                const isCompleted = shift.status === 'completed';

                return (
                  <View key={shift.id} style={styles.myShiftCard}>
                    {/* Header: Date + Status */}
                    <View style={styles.myShiftCardHeader}>
                      <View style={styles.myShiftDateBadge}>
                        <CalendarDays size={moderateScale(14)} color="#DC2626" />
                        <Text style={styles.myShiftDateText}>
                          {shift.date.split('-').reverse().join('/')}
                        </Text>
                      </View>

                      {/* Status Tag */}
                      <View
                        style={[
                          styles.myShiftStatusBadge,
                          isApproved && styles.badgeApproved,
                          isPending && styles.badgePending,
                          isCompleted && styles.badgeCompleted,
                        ]}
                      >
                        {isApproved && (
                          <CheckCircle2 size={moderateScale(12)} color="#059669" />
                        )}
                        {isPending && (
                          <Clock size={moderateScale(12)} color="#D97706" />
                        )}
                        {isCompleted && (
                          <Check size={moderateScale(12)} color="#2563EB" />
                        )}
                        <Text
                          style={[
                            styles.myShiftStatusText,
                            isApproved && styles.statusTextApproved,
                            isPending && styles.statusTextPending,
                            isCompleted && styles.statusTextCompleted,
                          ]}
                        >
                          {isApproved
                            ? (isEnglish ? 'Approved' : 'Đã Phê Duyệt')
                            : isPending
                            ? (isEnglish ? 'Pending Approval' : 'Chờ Ban ĐP Duyệt')
                            : (isEnglish ? 'Completed' : 'Đã Hoàn Tất')}
                        </Text>
                      </View>
                    </View>

                    {/* Main Title & Hours */}
                    <Text style={styles.myShiftTitle}>{shift.title}</Text>
                    <View style={styles.myShiftInfoRow}>
                      <View style={styles.myShiftInfoItem}>
                        <Clock size={moderateScale(13)} color="#64748B" />
                        <Text style={styles.myShiftInfoText}>
                          {shift.startTime} - {shift.endTime} ({shift.hours} giờ)
                        </Text>
                      </View>

                      {shift.vehiclePlate && (
                        <View style={styles.myShiftInfoItem}>
                          <Text style={styles.myShiftVehiclePill}>
                            Xe {shift.vehiclePlate}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Station & Role */}
                    <View style={styles.myShiftDetailsGrid}>
                      <View style={styles.myShiftDetailCol}>
                        <Text style={styles.myShiftDetailLabel}>
                          {isEnglish ? 'Station' : 'Trạm phân công'}
                        </Text>
                        <Text style={styles.myShiftDetailValue} numberOfLines={1}>
                          {shift.stationName}
                        </Text>
                      </View>

                      <View style={styles.myShiftDetailCol}>
                        <Text style={styles.myShiftDetailLabel}>
                          {isEnglish ? 'Role' : 'Vị trí trực'}
                        </Text>
                        <Text style={styles.myShiftDetailValue}>
                          {ROLE_LABELS[shift.role]?.vi || shift.role}
                        </Text>
                      </View>
                    </View>

                    {/* Bonus Stipend Badge */}
                    {shift.stipendBonus && (
                      <View style={styles.myShiftStipendRow}>
                        <Sparkles size={moderateScale(12)} color="#7C3AED" />
                        <Text style={styles.myShiftStipendText}>{shift.stipendBonus}</Text>
                      </View>
                    )}

                    {/* Notes if any */}
                    {shift.notes && (
                      <View style={styles.myShiftNotesRow}>
                        <Info size={moderateScale(12)} color="#64748B" />
                        <Text style={styles.myShiftNotesText}>{shift.notes}</Text>
                      </View>
                    )}

                    {/* Action buttons (Swap & Cancel) if not completed */}
                    {!isCompleted && (
                      <View style={styles.myShiftActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.myShiftSwapBtn}
                          onPress={() => {
                            setShiftToSwap(shift);
                            setSwapModalVisible(true);
                          }}
                        >
                          <RefreshCw size={moderateScale(14)} color="#2563EB" />
                          <Text style={styles.myShiftSwapBtnText}>
                            {isEnglish ? 'Request Swap' : 'Yêu Cầu Đổi Ca'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.myShiftCancelBtn}
                          onPress={() => {
                            setShiftToCancel(shift);
                            setCancelModalVisible(true);
                          }}
                        >
                          <Trash2 size={moderateScale(14)} color="#EF4444" />
                          <Text style={styles.myShiftCancelBtnText}>
                            {isEnglish ? 'Cancel' : 'Hủy Đăng Ký'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================== TAB 3: OVERVIEW & REGULATIONS ==================== */}
        {activeTab === 'summary' && (
          <View style={styles.tabContentWrapper}>
            {/* Weekly Target Gauge Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardTitle}>
                  {isEnglish ? 'WEEKLY DUTY PROGRESS' : 'TIẾN ĐỘ TRỰC TUẦN NÀY'}
                </Text>
                <Text style={styles.summaryCardRange}>{weeklySummary.weekRange}</Text>
              </View>

              <View style={styles.summaryProgressRow}>
                <Text style={styles.summaryProgressBigNum}>
                  {weeklySummary.totalRegisteredHours}
                  <Text style={styles.summaryProgressTarget}> / {weeklySummary.targetWeeklyHours} giờ</Text>
                </Text>
                <Text style={styles.summaryProgressPercent}>
                  {Math.min(
                    100,
                    Math.round((weeklySummary.totalRegisteredHours / weeklySummary.targetWeeklyHours) * 100)
                  )}
                  %
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round((weeklySummary.totalRegisteredHours / weeklySummary.targetWeeklyHours) * 100)
                      )}%`,
                    },
                  ]}
                />
              </View>

              {/* 3 Metric Pills */}
              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatVal}>{weeklySummary.approvedShiftsCount}</Text>
                  <Text style={styles.summaryStatLbl}>
                    {isEnglish ? 'Approved Shifts' : 'Ca Đã Duyệt'}
                  </Text>
                </View>

                <View style={styles.summaryStatDivider} />

                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatVal, { color: '#D97706' }]}>
                    {weeklySummary.pendingShiftsCount}
                  </Text>
                  <Text style={styles.summaryStatLbl}>
                    {isEnglish ? 'Pending Shifts' : 'Ca Chờ Duyệt'}
                  </Text>
                </View>

                <View style={styles.summaryStatDivider} />

                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatVal, { color: '#7C3AED' }]}>
                    {weeklySummary.nightShiftsCount}
                  </Text>
                  <Text style={styles.summaryStatLbl}>
                    {isEnglish ? 'Night / 24h Shifts' : 'Ca Đêm & 24h'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Roster Regulations */}
            <View style={styles.regulationsCard}>
              <View style={styles.regulationsHeader}>
                <ShieldAlert size={moderateScale(18)} color="#DC2626" />
                <Text style={styles.regulationsTitle}>
                  {isEnglish ? 'INDUSTRIAL PARK SHIFT REGULATIONS' : 'QUY ĐỊNH CA TRỰC CỨU HỘ KCN'}
                </Text>
              </View>

              <View style={styles.regulationItem}>
                <Text style={styles.regulationBullet}>1.</Text>
                <Text style={styles.regulationText}>
                  {isEnglish
                    ? 'Submit roster registration before Friday 17:00 weekly for IP Emergency Command coordination.'
                    : 'Đăng ký ca trực phân xưởng KCN trước 17:00 Thứ Sáu hàng tuần để Ban Chỉ Huy KCN bố trí kíp xe cứu hộ/PCCC.'}
                </Text>
              </View>

              <View style={styles.regulationItem}>
                <Text style={styles.regulationBullet}>2.</Text>
                <Text style={styles.regulationText}>
                  {isEnglish
                    ? 'Mandatory minimum rest interval of 8 hours between consecutive shifts to ensure heavy vehicle & hazmat safety.'
                    : 'Nghỉ ngơi tối thiểu 8 giờ giữa 2 ca trực liên tiếp để đảm bảo thể lực vận hành xe chữa cháy / cứu hộ chuyên dụng trong KCN.'}
                </Text>
              </View>

              <View style={styles.regulationItem}>
                <Text style={styles.regulationBullet}>3.</Text>
                <Text style={styles.regulationText}>
                  {isEnglish
                    ? 'Shift swaps must be requested at least 12 hours ahead with mutual confirmation and Station Lead approval.'
                    : 'Yêu cầu đổi ca trực phải báo trước tối thiểu 12 giờ và được Chỉ huy Đội Cứu hộ KCN chấp thuận.'}
                </Text>
              </View>

              <View style={styles.regulationItem}>
                <Text style={styles.regulationBullet}>4.</Text>
                <Text style={styles.regulationText}>
                  {isEnglish
                    ? 'Night shifts (22:00 - 06:00) and 24h On-Call are entitled to industrial hazardous & night duty stipend.'
                    : 'Ca Đêm KCN (22:00 - 06:00) và Ca 24h được hưởng phụ cấp độc hại & trực chiến nhà xưởng (+30% - +50%).'}
                </Text>
              </View>
            </View>

            {/* Quick Button to Register */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.summaryActionBtn}
              onPress={() => setActiveTab('register')}
            >
              <Plus size={moderateScale(18)} color="#FFFFFF" />
              <Text style={styles.summaryActionBtnText}>
                {isEnglish ? 'Register Another Shift' : 'Đăng Ký Thêm Ca Trực Mới'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: verticalScale(28) }} />
      </ScrollView>

      {/* Confirmation Modal: Cancel Shift */}
      <ConfirmationModal
        visible={cancelModalVisible}
        type="danger"
        title={isEnglish ? 'Cancel Shift Registration' : 'Hủy Đăng Ký Ca Trực'}
        description={
          shiftToCancel
            ? isEnglish
              ? `Are you sure you want to cancel ${shiftToCancel.title} on ${shiftToCancel.date}?`
              : `Bạn có chắc muốn hủy ${shiftToCancel.title} ngày ${shiftToCancel.date.split('-').reverse().join('/')}?`
            : ''
        }
        highlightBadge={shiftToCancel?.stationName}
        confirmText={isEnglish ? 'Confirm Cancel' : 'Xác Nhận Hủy'}
        cancelText={isEnglish ? 'Keep Shift' : 'Giữ Lại Ca'}
        onConfirm={handleConfirmCancelShift}
        onCancel={() => {
          setCancelModalVisible(false);
          setShiftToCancel(null);
        }}
      />

      {/* Modal: Request Shift Swap */}
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.swapModalCard}>
            <View style={styles.swapModalHeader}>
              <View style={styles.swapModalTitleRow}>
                <RefreshCw size={moderateScale(18)} color="#2563EB" />
                <Text style={styles.swapModalTitle}>
                  {isEnglish ? 'Request Shift Swap' : 'Yêu Cầu Đổi Ca Trực'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSwapModalVisible(false)}
                style={styles.swapModalCloseBtn}
              >
                <X size={moderateScale(18)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {shiftToSwap && (
              <View style={styles.swapShiftInfoPill}>
                <Text style={styles.swapShiftInfoTitle}>{shiftToSwap.title}</Text>
                <Text style={styles.swapShiftInfoSub}>
                  {shiftToSwap.date.split('-').reverse().join('/')} • {shiftToSwap.startTime} - {shiftToSwap.endTime}
                </Text>
              </View>
            )}

            <Text style={styles.swapInputLabel}>
              {isEnglish ? 'Target Colleague (Name or Staff ID):' : 'Đồng đội nhận đổi ca (Tên hoặc Mã NV):'}
            </Text>
            <TextInput
              style={styles.swapTextInput}
              placeholder={isEnglish ? 'e.g. BS. Tran Van A (ST-8840)' : 'VD: ĐD. Nguyễn Văn An (ST-8840)'}
              placeholderTextColor="#94A3B8"
              value={swapColleague}
              onChangeText={setSwapColleague}
            />

            <Text style={styles.swapInputLabel}>
              {isEnglish ? 'Reason for Swap:' : 'Lý do đổi ca:'}
            </Text>
            <TextInput
              style={[styles.swapTextInput, { height: verticalScale(60), textAlignVertical: 'top' }]}
              placeholder={isEnglish ? 'e.g. Family emergency, medical exam' : 'VD: Việc bận đột xuất, trùng lịch khám sức khỏe...'}
              placeholderTextColor="#94A3B8"
              value={swapReason}
              onChangeText={setSwapReason}
              multiline
            />

            <View style={styles.swapModalActionsRow}>
              <TouchableOpacity
                style={styles.swapModalCancelBtn}
                onPress={() => setSwapModalVisible(false)}
              >
                <Text style={styles.swapModalCancelBtnText}>
                  {isEnglish ? 'Cancel' : 'Hủy Bỏ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.swapModalConfirmBtn}
                onPress={handleConfirmSwap}
              >
                <Text style={styles.swapModalConfirmBtnText}>
                  {isEnglish ? 'Send Request' : 'Gửi Yêu Cầu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  headerIconBadge: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  hoursGaugeBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hoursGaugeLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: '#64748B',
  },
  hoursGaugeVal: {
    fontSize: moderateScale(12.5),
    fontWeight: '900',
    color: '#059669',
  },
  hoursGaugeTarget: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
  },

  /* Week Picker */
  weekPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  weekNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(6),
    gap: scale(2),
  },
  weekNavBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#0F172A',
  },
  weekLabelWrapper: {
    alignItems: 'center',
  },
  weekLabelText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  weekDateRangeText: {
    fontSize: moderateScale(10.5),
    fontWeight: '500',
    color: '#64748B',
  },

  /* Quick Preset Row */
  quickPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    gap: scale(6),
  },
  quickPresetHint: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#64748B',
    marginRight: scale(2),
  },
  quickPresetScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    paddingRight: scale(6),
  },
  quickPresetChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(6),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickPresetChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  quickPresetChipText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#334155',
  },
  quickPresetChipTextActive: {
    color: '#DC2626',
  },
  selectedCountBadge: {
    marginLeft: 'auto',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
  },
  selectedCountBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* 7-Day Selector Row */
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    marginHorizontal: scale(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  dayCardSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCardToday: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  dayCardCheckDot: {
    position: 'absolute',
    top: scale(2),
    right: scale(2),
    width: moderateScale(13),
    height: moderateScale(13),
    borderRadius: moderateScale(6.5),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNameText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: verticalScale(2),
  },
  dayNameTextSelected: {
    color: '#FFFFFF',
  },
  dayNameTextToday: {
    color: '#DC2626',
    fontWeight: '700',
  },
  dayNumText: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
  },
  dayNumTextToday: {
    color: '#DC2626',
  },
  dotContainer: {
    height: verticalScale(6),
    marginTop: verticalScale(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
  },
  dotApproved: {
    backgroundColor: '#059669',
  },
  dotPending: {
    backgroundColor: '#D97706',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },

  /* Segmented Navigation Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: scale(6),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
    gap: scale(5),
  },
  tabButtonActive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  tabButtonText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },

  /* Body Content */
  scrollBody: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
  },
  tabContentWrapper: {},

  /* Multi-Date Banner */
  /* Batch Tip Banner */
  batchTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: verticalScale(10),
    gap: scale(8),
  },
  batchTipText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    color: '#991B1B',
    lineHeight: moderateScale(14),
    fontWeight: '600',
  },

  /* Multi-Date Banner */
  multiDateBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(12),
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: verticalScale(10),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  multiDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  multiDateIconWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiDateTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  multiDateCountHighlight: {
    color: '#DC2626',
    fontWeight: '900',
  },
  multiDateSub: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(1.5),
  },
  selectedDatesScroll: {
    flexDirection: 'row',
    gap: scale(6),
    marginTop: verticalScale(10),
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: scale(4),
  },
  selectedDatePillText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  selectedDatePillClose: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  existingShiftsAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: verticalScale(12),
  },
  existingShiftsAlertTitle: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#92400E',
  },
  existingShiftsAlertDesc: {
    fontSize: moderateScale(10.5),
    color: '#78350F',
    marginTop: verticalScale(2),
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(2),
  },
  sectionHeaderTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.3,
  },
  sectionBadgeCount: {
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sectionBadgeCountText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#DC2626',
  },
  sectionSubHint: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
    marginBottom: verticalScale(8),
  },

  /* Shift Presets */
  shiftPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    gap: scale(6),
  },
  shiftPresetsHint: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#64748B',
  },
  shiftPresetsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingRight: scale(10),
  },
  shiftPresetChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(4),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  shiftPresetChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  shiftPresetChipText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#334155',
  },
  shiftPresetChipTextActive: {
    color: '#DC2626',
  },

  /* Shift Cards */
  shiftCardsGrid: {
    gap: verticalScale(8),
  },
  shiftCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  shiftCardItemSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  shiftCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  shiftCardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  shiftCardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  shiftCardIconCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftCardIconCircleSelected: {
    backgroundColor: '#FEF2F2',
  },
  shiftCardName: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  shiftCardNameSelected: {
    color: '#DC2626',
  },
  shiftCardTimeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  shiftHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    gap: scale(3),
  },
  shiftHoursBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftCardDesc: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: verticalScale(2),
    lineHeight: moderateScale(15),
  },
  bonusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderRadius: moderateScale(6),
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2.5),
    marginTop: verticalScale(6),
    gap: scale(4),
  },
  bonusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#7C3AED',
  },

  /* Multi-Select Checkbox Indicator */
  multiCheckboxIndicator: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  multiCheckboxIndicatorSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  checkboxEmptyDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: 'transparent',
  },

  /* Role selector */
  rolePillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(11),
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: scale(5),
  },
  rolePillSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  rolePillText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#334155',
  },
  rolePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Stations list */
  stationsList: {
    gap: verticalScale(6),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  stationRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stationRowCardSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  stationIconCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  stationIconCircleSelected: {
    backgroundColor: '#FEF2F2',
  },
  stationTextCol: {
    flex: 1,
  },
  stationCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  stationCodePill: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(4),
  },
  stationName: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  stationAddress: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  stationRadioDot: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  stationRadioDotSelected: {
    borderColor: '#DC2626',
  },
  stationRadioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#DC2626',
  },

  /* Toggle card */
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(12),
  },
  toggleTextGroup: {
    flex: 1,
    paddingRight: scale(10),
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  toggleTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: verticalScale(2),
    lineHeight: moderateScale(14),
  },

  /* Notes */
  noteInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(12),
  },
  noteInputIcon: {
    marginTop: verticalScale(3),
    marginRight: scale(6),
  },
  noteTextInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: '#0F172A',
    minHeight: verticalScale(40),
  },

  /* Dynamic Real-time Calculation Card */
  calculationCard: {
    borderRadius: moderateScale(14),
    padding: scale(12),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
    marginBottom: verticalScale(12),
  },
  calcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(8),
  },
  calcHeaderTitle: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.4,
  },
  calcFormulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  calcFormulaItem: {
    alignItems: 'center',
  },
  calcFormulaNum: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  calcFormulaLbl: {
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  calcFormulaOp: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    color: '#94A3B8',
  },
  calcFormulaItemResult: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  calcFormulaResultNum: {
    fontSize: moderateScale(17),
    fontWeight: '900',
    color: '#DC2626',
  },
  calcFormulaResultLbl: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  calcTotalHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: scale(3),
  },
  calcTotalHoursText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#059669',
  },

  /* Submit Button */
  submitRegistrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    marginBottom: verticalScale(10),
    gap: scale(8),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitRegistrationText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  /* Tab 2: My Shifts */
  filterPillsRow: {
    flexDirection: 'row',
    gap: scale(6),
    marginBottom: verticalScale(10),
  },
  statusFilterPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterPillSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  statusFilterPillText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  statusFilterPillTextSelected: {
    color: '#FFFFFF',
  },

  myShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(10),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  myShiftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  myShiftDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  myShiftDateText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  myShiftStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
    gap: scale(4),
  },
  badgeApproved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgePending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeCompleted: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  myShiftStatusText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextCompleted: {
    color: '#2563EB',
  },
  myShiftTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  myShiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginTop: verticalScale(4),
  },
  myShiftInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  myShiftInfoText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#475569',
  },
  myShiftVehiclePill: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(4),
  },
  myShiftDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(8),
    padding: scale(8),
    marginTop: verticalScale(8),
    gap: scale(10),
  },
  myShiftDetailCol: {
    flex: 1,
  },
  myShiftDetailLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: '#64748B',
  },
  myShiftDetailValue: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  myShiftStipendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(6),
    gap: scale(4),
  },
  myShiftStipendText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#7C3AED',
  },
  myShiftNotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
    gap: scale(4),
  },
  myShiftNotesText: {
    fontSize: moderateScale(10),
    color: '#64748B',
    fontStyle: 'italic',
  },
  myShiftActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    gap: scale(8),
  },
  myShiftSwapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    gap: scale(4),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  myShiftSwapBtnText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#2563EB',
  },
  myShiftCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    gap: scale(4),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  myShiftCancelBtnText: {
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    color: '#EF4444',
  },

  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(24),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: verticalScale(10),
  },
  emptyStateTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(10),
  },
  emptyStateSub: {
    fontSize: moderateScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
  emptyStateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    marginTop: verticalScale(14),
    gap: scale(6),
  },
  emptyStateActionBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Tab 3: Summary & Overview */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(12),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  summaryCardTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryCardRange: {
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  summaryProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },
  summaryProgressBigNum: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryProgressTarget: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  summaryProgressPercent: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: '#059669',
  },
  progressBarTrack: {
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: verticalScale(12),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: moderateScale(4),
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(10),
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatVal: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    color: '#059669',
  },
  summaryStatLbl: {
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  summaryStatDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
  },

  regulationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(12),
  },
  regulationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(10),
  },
  regulationsTitle: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  regulationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  regulationBullet: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
    width: scale(16),
  },
  regulationText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    color: '#334155',
    lineHeight: moderateScale(15),
  },

  summaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    gap: scale(6),
  },
  summaryActionBtnText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  swapModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  swapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  swapModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  swapModalTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  swapModalCloseBtn: {
    padding: scale(4),
  },
  swapShiftInfoPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    padding: scale(8),
    marginBottom: verticalScale(12),
  },
  swapShiftInfoTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  swapShiftInfoSub: {
    fontSize: moderateScale(10.5),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  swapInputLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#334155',
    marginBottom: verticalScale(4),
  },
  swapTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(11.5),
    color: '#0F172A',
    marginBottom: verticalScale(10),
  },
  swapModalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(8),
    marginTop: verticalScale(6),
  },
  swapModalCancelBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
  },
  swapModalCancelBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: '600',
    color: '#475569',
  },
  swapModalConfirmBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(8),
    backgroundColor: '#2563EB',
  },
  swapModalConfirmBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
