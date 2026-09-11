import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  PhoneCall,
  Radio,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Minimize2,
  ChevronUp,
  Flame,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ConfirmationModal } from '../../components/common';
import { MissionStepper } from '../../components/dispatch/MissionStepper';
import { IncidentTacticalMap } from '../../components/dispatch/IncidentTacticalMap';
import { IncidentDetailCard } from '../../components/dispatch/IncidentDetailCard';
import { SwipeToAction } from '../../components/dispatch/SwipeToAction';
import {
  EmergencyIncident,
  MOCK_EMERGENCY_INCIDENT,
  MissionStage,
} from '../../types/dispatch';

interface IncidentOverviewScreenProps {
  navigation?: any;
  route?: {
    params?: {
      incident?: EmergencyIncident;
    };
  };
}

export const IncidentOverviewScreen: React.FC<IncidentOverviewScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const incident = route?.params?.incident || MOCK_EMERGENCY_INCIDENT;

  // Mission State Management (4 Stages)
  const [currentStage, setCurrentStage] = useState<MissionStage>('accepted');

  // Interactive View Modes: 'split' (default), 'map_expanded' (full map), 'details_expanded' (full details)
  const [viewMode, setViewMode] = useState<'split' | 'map_expanded' | 'details_expanded'>('split');

  const handleToggleMapExpand = useCallback(() => {
    setViewMode((prev) => (prev === 'map_expanded' ? 'split' : 'map_expanded'));
  }, []);

  const handleToggleExpandDetails = useCallback(() => {
    setViewMode((prev) => (prev === 'details_expanded' ? 'split' : 'details_expanded'));
  }, []);

  // Confirmation Modal states
  const [isCallDispatcherModalVisible, setIsCallDispatcherModalVisible] = useState(false);
  const [isEnRouteModalVisible, setIsEnRouteModalVisible] = useState(false);
  const [isOnSceneModalVisible, setIsOnSceneModalVisible] = useState(false);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  // Quick Dispatcher Hotline Call
  const handleConfirmCallDispatcher = () => {
    setIsCallDispatcherModalVisible(false);
    Linking.openURL('tel:115').catch(() => {
      Alert.alert('Đàm Thoại', 'Đang kết nối qua kênh vô tuyến số 115...');
    });
  };

  // Handle Swipe to En Route
  const handleSwipeEnRoute = useCallback(() => {
    setCurrentStage('en_route');
    setIsEnRouteModalVisible(true);
  }, []);

  // Handle Advance Stage
  const handleAdvanceStage = useCallback((nextStage: MissionStage) => {
    setCurrentStage(nextStage);
    if (nextStage === 'on_scene') {
      setIsOnSceneModalVisible(true);
    }
  }, []);

  // Handle Complete Mission
  const handleCompleteMission = useCallback(() => {
    setCurrentStage('completed');
    setIsCompleteModalVisible(true);
  }, []);

  // Handle Back
  const handleGoBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };


  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right', 'bottom']}
      safeArea
      statusBarStyle="dark-content"
    >
      <View style={styles.rootContainer}>
        {/* If NOT in full-screen map mode, show standard Top Header & Mission Stepper */}
        {viewMode !== 'map_expanded' && (
          <>
            {/* 1. Header Bar */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <ArrowLeft size={moderateScale(20)} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.incidentCodeBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.incidentCodeText} numberOfLines={1}>
                  {incident.code}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.callDispatcherBtn}
                onPress={() => setIsCallDispatcherModalVisible(true)}
              >
                <PhoneCall size={moderateScale(14)} color="#FFFFFF" />
                <Text
                  style={styles.callDispatcherText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                >
                  Gọi Điều Phối
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Mission Stepper (4 Stages) */}
            <MissionStepper
              currentStage={currentStage}
              onSelectStage={setCurrentStage}
              interactive={true}
            />
          </>
        )}

        {/* 3. Main Workspace */}
        {viewMode === 'map_expanded' ? (
          /* TRUE 100% FULLSCREEN MAP */
          <View style={styles.fullscreenMapWrapper}>
            <IncidentTacticalMap
              currentStage={currentStage}
              incidentAddress={incident.address}
              distanceKm={incident.distanceKm}
              etaMinutes={incident.etaMinutes}
              onRecenter={() => {}}
              isMapExpanded={true}
              onToggleMapExpand={handleToggleMapExpand}
            />

            {/* Floating Top Nav Overlay on Fullscreen Map */}
            <View style={styles.fullscreenTopOverlay}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.floatingOverlayCircleBtn}
                onPress={handleGoBack}
              >
                <ArrowLeft size={moderateScale(18)} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.floatingCodePill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.floatingCodeText}>{incident.code}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.floatingExitMapBtn}
                onPress={handleToggleMapExpand}
              >
                <Minimize2 size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.floatingExitMapText}>Thu Nhỏ</Text>
              </TouchableOpacity>
            </View>

            {/* Ultra-compact Floating Action Dock on Fullscreen Map */}
            <View style={styles.fullscreenCompactDock}>
              {/* Compact Details Chip */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.compactDetailsChip}
                onPress={handleToggleExpandDetails}
                accessible={true}
                accessibilityLabel="Xem chi tiết ca trực"
              >
                <ChevronUp size={moderateScale(14)} color="#DC2626" />
                <Text style={styles.compactDetailsChipText}>Chi Tiết</Text>
              </TouchableOpacity>

              {/* Action Area */}
              <View style={styles.compactActionWrap}>
                {currentStage === 'accepted' && (
                  <SwipeToAction
                    onSwipeSuccess={handleSwipeEnRoute}
                    title="VUỐT XUẤT PHÁT"
                    successTitle="ĐÃ XÁC NHẬN XUẤT PHÁT!"
                    sliderColor="#10B981"
                    activeTrackColor="rgba(16, 185, 129, 0.3)"
                  />
                )}

                {currentStage === 'en_route' && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.compactAdvanceBtnRed}
                    onPress={() => handleAdvanceStage('on_scene')}
                  >
                    <Flame size={moderateScale(15)} color="#FFFFFF" />
                    <Text style={styles.compactAdvanceBtnText}>
                      ĐÃ ĐẾN HIỆN TRƯỜNG
                    </Text>
                    <ArrowRight size={moderateScale(15)} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                {currentStage === 'on_scene' && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.compactAdvanceBtnGreen}
                    onPress={handleCompleteMission}
                  >
                    <ShieldCheck size={moderateScale(15)} color="#FFFFFF" />
                    <Text style={styles.compactAdvanceBtnText}>
                      HOÀN THÀNH CA
                    </Text>
                    <CheckCircle2 size={moderateScale(14)} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                {currentStage === 'completed' && (
                  <View style={styles.compactCompletedBox}>
                    <CheckCircle2 size={moderateScale(14)} color="#10B981" />
                    <Text style={styles.compactCompletedText}>
                      ĐÃ HOÀN TẤT
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* SPLIT OR FULL DETAILS MODE */
          <View style={styles.contentSplitLayout}>
            {/* Map Area */}
            <View
              style={[
                styles.mapAreaContainer,
                viewMode === 'details_expanded' && styles.mapAreaMinimized,
              ]}
            >
              <IncidentTacticalMap
                currentStage={currentStage}
                incidentAddress={incident.address}
                distanceKm={incident.distanceKm}
                etaMinutes={incident.etaMinutes}
                onRecenter={() => {}}
                isMapExpanded={false}
                onToggleMapExpand={handleToggleMapExpand}
              />
            </View>

            {/* Detail Bottom Card */}
            <View
              style={[
                styles.bottomCardContainer,
                viewMode === 'details_expanded' && styles.bottomCardExpanded,
              ]}
            >
              <IncidentDetailCard
                incident={incident}
                currentStage={currentStage}
                onSwipeEnRoute={handleSwipeEnRoute}
                onAdvanceStage={handleAdvanceStage}
                onCompleteMission={handleCompleteMission}
                viewMode={viewMode}
                onToggleExpandDetails={handleToggleExpandDetails}
                onToggleExpandMap={handleToggleMapExpand}
              />
            </View>
          </View>
        )}

        {/* 1. Modal: Call Dispatcher Hotline */}
        <ConfirmationModal
          visible={isCallDispatcherModalVisible}
          type="danger"
          title="Gọi Trực Ban Điều Phối 115"
          description={`Kết nối thoại trực tiếp đến Tổng đài Điều phối Cứu hộ TP.HCM cho Ca trực ${incident.code}?`}
          highlightBadge="KÊNH KHẨN CẤP 115"
          confirmText="Gọi Ngay (115)"
          cancelText="Hủy"
          onConfirm={handleConfirmCallDispatcher}
          onCancel={() => setIsCallDispatcherModalVisible(false)}
        />

        {/* 2. Modal: En Route Success Confirmation */}
        <ConfirmationModal
          visible={isEnRouteModalVisible}
          type="warning"
          title="Xuất Phát Thành Công (En Route)"
          description={`Xe cứu thương ${incident.assignedUnit} đã chuyển trạng thái xuất phát.`}
          highlightBadge="ĐANG DI CHUYỂN • BẬT CÒI ƯU TIÊN"
          highlightText={`Đang dẫn đường tới hiện trường: ${incident.address}`}
          singleButton
          confirmText="Tiếp Tục Dẫn Đường"
          onConfirm={() => setIsEnRouteModalVisible(false)}
          onCancel={() => setIsEnRouteModalVisible(false)}
        />

        {/* 3. Modal: Arrived On Scene Confirmation */}
        <ConfirmationModal
          visible={isOnSceneModalVisible}
          type="danger"
          title="Đã Tiếp Cận Hiện Trường (On Scene)"
          description="Kíp trực đã có mặt tại hiện trường. Bắt đầu phân loại Triage và sơ cứu nạn nhân."
          highlightBadge="TRIAGE T1 • 3 NẠN NHÂN"
          highlightText="Yêu cầu mang kìm cắt thủy lực và bình Oxy dự phòng theo đúng ghi chú hiện trường."
          singleButton
          confirmText="Bắt Đầu Cấp Cứu"
          onConfirm={() => setIsOnSceneModalVisible(false)}
          onCancel={() => setIsOnSceneModalVisible(false)}
        />

        {/* 4. Modal: Complete Mission Confirmation */}
        <ConfirmationModal
          visible={isCompleteModalVisible}
          type="success"
          title="Hoàn Thành Ca Cấp Cứu 🎉"
          description="Đã bàn giao 3 nạn nhân an toàn cho Bệnh viện Cấp Cứu Trưng Vương."
          highlightBadge="CA TRỰC HOÀN TẤT XUẤT SẮC"
          highlightText="Báo cáo ca trực và dữ liệu Telemetry đã được đồng bộ về Trung tâm 115."
          singleButton
          confirmText="Về Bảng Trực 115"
          onConfirm={() => {
            setIsCompleteModalVisible(false);
            if (navigation?.canGoBack()) {
              navigation.goBack();
            }
          }}
          onCancel={() => setIsCompleteModalVisible(false)}
        />
      </View>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    gap: scale(6),
  },
  livePulseDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#EF4444',
  },
  incidentCodeText: {
    fontSize: moderateScale(13),
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  callDispatcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(10),
    gap: scale(5),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  callDispatcherText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contentSplitLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mapAreaContainer: {
    flex: 68,
  },
  mapAreaMinimized: {
    flex: 16,
  },
  bottomCardContainer: {
    flex: 32,
  },
  bottomCardExpanded: {
    flex: 84,
  },
  fullscreenMapWrapper: {
    flex: 1,
    position: 'relative',
  },
  fullscreenTopOverlay: {
    position: 'absolute',
    top: verticalScale(8),
    left: scale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  floatingOverlayCircleBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: scale(6),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCodeText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  floatingExitMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingExitMapText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#DC2626',
  },
  fullscreenCompactDock: {
    position: 'absolute',
    bottom: verticalScale(50),
    left: scale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    zIndex: 40,
  },
  compactDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: verticalScale(38),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(19),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  compactDetailsChipText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  compactActionWrap: {
    flex: 1,
  },
  compactAdvanceBtnRed: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    gap: scale(6),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compactAdvanceBtnGreen: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    gap: scale(6),
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compactAdvanceBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  compactCompletedBox: {
    height: verticalScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
  },
  compactCompletedText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#059669',
  },
});
