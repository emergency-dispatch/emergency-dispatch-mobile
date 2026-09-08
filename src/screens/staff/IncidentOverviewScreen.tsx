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
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { MissionStepper } from '../../components/dispatch/MissionStepper';
import { IncidentTacticalMap } from '../../components/dispatch/IncidentTacticalMap';
import { IncidentDetailCard } from '../../components/dispatch/IncidentDetailCard';
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

  // Quick Dispatcher Hotline Call
  const handleCallDispatcher = useCallback(() => {
    Alert.alert(
      '🚨 GỌI TRỰC BAN ĐIỀU PHỐI 115',
      `Đang kết nối thoại trực tiếp đến Tổng đài Điều phối Cứu hộ 115 TP.HCM cho Ca trực ${incident.code}.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'GỌI TỔNG ĐÀI (115)',
          style: 'destructive',
          onPress: () => {
            const phoneNumber = 'tel:115';
            Linking.canOpenURL(phoneNumber)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(phoneNumber);
                } else {
                  Alert.alert('Đàm Thoại Nội Bộ', 'Đang kết nối qua kênh vô tuyến số 115...');
                }
              })
              .catch(() => {
                Alert.alert('Đàm Thoại Nội Bộ', 'Đang kết nối qua kênh vô tuyến số 115...');
              });
          },
        },
      ]
    );
  }, [incident.code]);

  // Handle Swipe to En Route
  const handleSwipeEnRoute = useCallback(() => {
    setCurrentStage('en_route');
    Alert.alert(
      '🚑 XUẤT PHÁT THÀNH CÔNG!',
      `Xe cứu thương ${incident.assignedUnit} đã chuyển trạng thái [EN ROUTE]. Đang bật còi ưu tiên và dẫn đường tới ${incident.address}.`
    );
  }, [incident.assignedUnit, incident.address]);

  // Handle Advance Stage
  const handleAdvanceStage = useCallback((nextStage: MissionStage) => {
    setCurrentStage(nextStage);
    if (nextStage === 'on_scene') {
      Alert.alert(
        '📍 ĐÃ ĐẾN HIỆN TRƯỜNG (ON SCENE)',
        'Kíp trực đã tiếp cận hiện trường. Bắt đầu phân loại Triage và sơ cứu nạn nhân.'
      );
    }
  }, []);

  // Handle Complete Mission
  const handleCompleteMission = useCallback(() => {
    setCurrentStage('completed');
    Alert.alert(
      '✅ HOÀN THÀNH CA CẤP CỨU',
      'Đã bàn giao 3 nạn nhân an toàn cho Bệnh viện Trưng Vương. Báo cáo ca trực đã được đồng bộ về Trung tâm 115.',
      [
        {
          text: 'Về Bảng Điều Khiển',
          onPress: () => {
            if (navigation?.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [navigation]);

  // Handle Back
  const handleGoBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      Alert.alert('Thông Báo', 'Quay lại Bảng điều khiển Đội cứu hộ.');
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#0B0F19"
      edges={['top', 'left', 'right', 'bottom']}
      safeArea
      statusBarStyle="light-content"
    >
      <View style={styles.rootContainer}>
        {/* 1. Header Bar */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <ArrowLeft size={moderateScale(20)} color="#F8FAFC" />
          </TouchableOpacity>

          {/* Incident Code Badge */}
          <View style={styles.incidentCodeBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.incidentCodeText}>{incident.code}</Text>
          </View>

          {/* Call Dispatcher Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.callDispatcherBtn}
            onPress={handleCallDispatcher}
          >
            <PhoneCall size={moderateScale(14)} color="#FFFFFF" />
            <Text style={styles.callDispatcherText}>Gọi Dispatcher</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Mission Stepper (4 Stages) */}
        <MissionStepper
          currentStage={currentStage}
          onSelectStage={setCurrentStage}
          interactive={true}
        />

        {/* 3. Main Workspace: Map Area (55%) + Detail Bottom Card (45%) */}
        <View style={styles.contentSplitLayout}>
          {/* Map Area (~55% Height) */}
          <View style={styles.mapAreaContainer}>
            <IncidentTacticalMap
              currentStage={currentStage}
              incidentAddress={incident.address}
              distanceKm={incident.distanceKm}
              etaMinutes={incident.etaMinutes}
              onRecenter={() =>
                Alert.alert('Định Vị GPS', 'Đã căn giữa bản đồ theo vị trí xe cấp cứu ICU-01.')
              }
            />
          </View>

          {/* Detail Bottom Card (~45% Height) */}
          <View style={styles.bottomCardContainer}>
            <IncidentDetailCard
              incident={incident}
              currentStage={currentStage}
              onSwipeEnRoute={handleSwipeEnRoute}
              onAdvanceStage={handleAdvanceStage}
              onCompleteMission={handleCompleteMission}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
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
    color: '#FEE2E2',
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
    shadowOpacity: 0.4,
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
    flex: 55, // 55% Height
  },
  bottomCardContainer: {
    flex: 45, // 45% Height
  },
});
