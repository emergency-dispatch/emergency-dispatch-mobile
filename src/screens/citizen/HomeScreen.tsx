import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { SosPulseButton, SosSuccessModal, SosConfirmModal, OutOfServiceAreaModal } from '../../components/citizen';
import { MainTabParamList } from '../../navigation/types';
import { useResponsive } from '../../utils/responsive';
import { incidentService } from '../../services/incident.service';
import { mediaService } from '../../services/media.service';
import { IncidentResponseDto } from '../../types/incident';
import { useProfileStore } from '../../store/useProfileStore';
import { useAppStore } from '../../store/useAppStore';
import { useLocationStore } from '../../store/useLocationStore';
import { storage } from '../../services/storage';
import { mapboxService } from '../../services/mapbox.service';
import { locationService } from '../../services/location.service';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const { isSmallDevice, isShortScreen, moderateScale, fontScale } = useResponsive();
  const headerIconSize = isSmallDevice ? 18 : 20;

  const { profile } = useProfileStore();
  const { user } = useAppStore();

  // Global Shared GPS Location State
  const {
    coords: userCoords,
    address,
    isFetchingLocation: isRefreshingGps,
    refreshLocation,
  } = useLocationStore();

  // Modals & triggers state
  const [isSosSuccessModalVisible, setIsSosSuccessModalVisible] = useState(false);
  const [isSosConfirmModalVisible, setIsSosConfirmModalVisible] = useState(false);
  const [pendingSosAsset, setPendingSosAsset] = useState<any | null>(null);
  const [activeIncident, setActiveIncident] = useState<IncidentResponseDto | null>(null);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosSendingLoadingText, setSosSendingLoadingText] = useState('');
  const [isSosPressing, setIsSosPressing] = useState(false);
  const [outOfAreaInfo, setOutOfAreaInfo] = useState<{
    visible: boolean;
    areaName?: string | null;
    radiusKm?: number;
    distanceOutsideKm?: number;
    latitude?: number;
    longitude?: number;
  }>({ visible: false });

  // Green GPS accuracy pulsing dot animation
  const gpsPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(gpsPulseAnim, {
          toValue: 1.5,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gpsPulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch real GPS on mount (shared with Map screen)
  useEffect(() => {
    refreshLocation();
  }, []);

  const handleRefreshGps = () => {
    refreshLocation(true);
  };

  const recordIncidentId = async (id: string, incident?: IncidentResponseDto) => {
    try {
      const existing = (await storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS')) || [];
      if (!existing.includes(id)) {
        await storage.setItem('MY_REPORTED_INCIDENT_IDS', [id, ...existing]);
      }
      if (incident) {
        const cached = (await storage.getItem<IncidentResponseDto[]>('MY_REPORTED_INCIDENTS_CACHE')) || [];
        await storage.setItem('MY_REPORTED_INCIDENTS_CACHE', [incident, ...cached.filter((x) => x.id !== id)]);
      }
    } catch {
      // ignore
    }
  };

  const handleCancelIncident = async (incidentId: string) => {
    try {
      // Remove from local storage list
      const existing = (await storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS')) || [];
      await storage.setItem(
        'MY_REPORTED_INCIDENT_IDS',
        existing.filter((id) => id !== incidentId)
      );

      // Call backend cancel API if authenticated
      try {
        await incidentService.cancelIncident(incidentId, 'Người dân bấm nhầm nút SOS');
      } catch {
        // Ghi chú: BE yêu cầu quyền xác thực khi hủy sự cố, phía client đã dọn dẹp local state
      }

      setIsSosSuccessModalVisible(false);
      setActiveIncident(null);
      Alert.alert('Đã Hủy Báo Động', 'Tín hiệu SOS đã được hủy bỏ thành công.');
    } catch {
      setIsSosSuccessModalVisible(false);
      setActiveIncident(null);
    }
  };

  // When SOS pulse button is held for 2s: open camera with crop, then open confirm modal with note
  const handleSosTriggered = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (asset) {
        setPendingSosAsset(asset);
      }
      setIsSosConfirmModalVisible(true);
    } catch {
      setIsSosConfirmModalVisible(true);
    }
  };

  const handleRetakePhotoInConfirm = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (asset) setPendingSosAsset(asset);
    } catch {
      // ignore
    }
  };

  const handlePickLibraryInConfirm = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (asset) setPendingSosAsset(asset);
    } catch {
      // ignore
    }
  };

  const handleRemovePhotoInConfirm = () => {
    setPendingSosAsset(null);
  };

  const handleConfirmSosDispatch = async (note: string) => {
    setIsSosConfirmModalVisible(false);
    setIsSendingSos(true);
    setSosSendingLoadingText('Đang kết nối trung tâm cứu hộ khẩn cấp...');
    try {
      let mediaUrls: string[] = [];
      if (pendingSosAsset) {
        setSosSendingLoadingText('Đang tải ảnh hiện trường lên...');
        const url = await mediaService.uploadMedia(pendingSosAsset);
        if (url) mediaUrls.push(url);
      }

      setSosSendingLoadingText('AI đang phân tích nguy cơ & kích hoạt điều phối...');
      const loc = await useLocationStore.getState().refreshLocation(false);

      const areaCheck = await incidentService.checkOutsideServiceArea(loc.latitude, loc.longitude);
      if (areaCheck.isOutside) {
        setIsSendingSos(false);
        setOutOfAreaInfo({
          visible: true,
          areaName: areaCheck.area?.name,
          radiusKm: areaCheck.area?.radiusKm,
          distanceOutsideKm: areaCheck.distanceOutsideKm,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
        return;
      }

      const created = await incidentService.createIncident({
        title: t('sos.emergency_sos_title', 'Báo động SOS Khẩn cấp'),
        description: note.trim() || t('sos.default_description', 'Người dân đè nút SOS 2s kích hoạt báo động khẩn cấp.'),
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationAddress: loc.address,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls,
      });

      setActiveIncident(created);
      await recordIncidentId(created.id, created);
      setPendingSosAsset(null);
      setIsSosSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi gửi SOS', err.message || 'Không thể gửi báo động SOS.');
    } finally {
      setIsSendingSos(false);
    }
  };

  const handleSosSendWithoutMedia = async () => {
    try {
      setIsSendingSos(true);
      setSosSendingLoadingText('Đang gửi toạ độ GPS tới trung tâm cứu hộ khẩn cấp...');
      const loc = await useLocationStore.getState().refreshLocation(false);

      const areaCheck = await incidentService.checkOutsideServiceArea(loc.latitude, loc.longitude);
      if (areaCheck.isOutside) {
        setIsSendingSos(false);
        setOutOfAreaInfo({
          visible: true,
          areaName: areaCheck.area?.name,
          radiusKm: areaCheck.area?.radiusKm,
          distanceOutsideKm: areaCheck.distanceOutsideKm,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
        return;
      }

      const created = await incidentService.createIncident({
        title: t('sos.emergency_sos_title', 'Báo động SOS Khẩn cấp'),
        description: t('sos.default_description_no_media', 'Người dân đè nút SOS 2s kích hoạt báo động khẩn cấp tức thời (không kèm ảnh).'),
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationAddress: loc.address,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls: [],
      });
      setActiveIncident(created);
      await recordIncidentId(created.id, created);
      setIsSosSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi gửi SOS', err.message || 'Không thể gửi báo động SOS.');
    } finally {
      setIsSendingSos(false);
    }
  };


  return (
    <ScreenContainer
      backgroundColor="#F8FAFC"
      edges={['top', 'left', 'right']}
      style={[
        styles.container,
        { paddingHorizontal: moderateScale(isSmallDevice ? 12 : 16) },
      ]}
    >
      {/* 1. Header: Full-Width Prominent GPS Address Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRefreshGps}
          style={styles.gpsPill}
          accessible={true}
          accessibilityLabel={`Vị trí hiện tại: ${address}. Chạm để cập nhật GPS`}
          accessibilityRole="button"
        >
          <View style={styles.gpsIndicatorWrapper}>
            <Animated.View
              style={[
                styles.gpsPulseRing,
                { transform: [{ scale: gpsPulseAnim }] },
              ]}
            />
            <View style={styles.gpsDot} />
          </View>

          <MapPin size={moderateScale(18)} color="#DC2626" />

          <Text
            style={[
              styles.addressText,
              {
                fontSize: fontScale(isSmallDevice ? 13 : 14.5),
                lineHeight: fontScale(isSmallDevice ? 18 : 20),
              },
            ]}
            numberOfLines={2}
          >
            {address}
          </Text>

          <RefreshCw
            size={moderateScale(16)}
            color="#94A3B8"
            style={isRefreshingGps ? styles.rotating : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        scrollEnabled={!isSosPressing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isShortScreen ? 16 : 24 },
        ]}
      >
        {/* Top Banner Notice */}
        <View style={styles.systemBanner}>
          <Sparkles size={13} color="#DC2626" />
          <Text style={[styles.systemBannerText, { fontSize: fontScale(9.5) }]}>
            {t('common.online_status')}
          </Text>
        </View>

        {/* 2. Hero SOS Trigger (Center-Bottom Thumb Zone) */}
        <View style={styles.heroSosSection}>
          <SosPulseButton
            onSosTriggered={handleSosTriggered}
            holdDuration={2000}
            onPressStateChange={setIsSosPressing}
          />

          {/* Reference Layout Prompt */}
          <View style={styles.promptContainer}>
            <Text
              style={[
                styles.promptTitle,
                {
                  fontSize: fontScale(isSmallDevice ? 18 : 20),
                  lineHeight: fontScale(isSmallDevice ? 24 : 28),
                },
              ]}
            >
              {t('home.incident_prompt_title', 'Khi có sự cố hoả hoạn hoặc tai nạn')}
            </Text>
            <Text
              style={[
                styles.promptSubtitle,
                {
                  fontSize: fontScale(isSmallDevice ? 12 : 13.5),
                  lineHeight: fontScale(isSmallDevice ? 17 : 20),
                },
              ]}
            >
              {t('home.hold_instruction', 'Nhấn giữ “SOS” để báo cho lực lượng cứu hộ!')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Emergency Dispatch Loading Overlay */}
      {isSendingSos && (
        <View style={styles.emergencyLoadingOverlay}>
          <View style={styles.emergencyLoadingCard}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.emergencyLoadingTitle}>ĐANG KÍCH HOẠT CỨU HỘ SOS</Text>
            <Text style={styles.emergencyLoadingText}>{sosSendingLoadingText}</Text>
          </View>
        </View>
      )}

      {/* SOS Confirm Modal with Note & Cropped Image */}
      <SosConfirmModal
        visible={isSosConfirmModalVisible}
        onClose={() => {
          setIsSosConfirmModalVisible(false);
          setPendingSosAsset(null);
        }}
        photoUri={pendingSosAsset?.uri}
        address={address}
        onConfirm={handleConfirmSosDispatch}
        onRetakePhoto={handleRetakePhotoInConfirm}
        onPickLibrary={handlePickLibraryInConfirm}
        onRemovePhoto={handleRemovePhotoInConfirm}
      />

      {/* SOS Success Modal Feedback */}
      <SosSuccessModal
        visible={isSosSuccessModalVisible}
        onClose={() => {
          setIsSosSuccessModalVisible(false);
          setActiveIncident(null);
        }}
        onCancelIncident={handleCancelIncident}
        address={address}
        incident={activeIncident}
      />

      {/* Out of Service Area Informational Modal */}
      <OutOfServiceAreaModal
        visible={outOfAreaInfo.visible}
        onClose={() => setOutOfAreaInfo((prev) => ({ ...prev, visible: false }))}
        areaName={outOfAreaInfo.areaName}
        radiusKm={outOfAreaInfo.radiusKm}
        distanceOutsideKm={outOfAreaInfo.distanceOutsideKm}
        latitude={outOfAreaInfo.latitude}
        longitude={outOfAreaInfo.longitude}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    width: '100%',
    marginBottom: 8,
  },
  gpsPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  gpsIndicatorWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsPulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  addressText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
    marginBottom: 16,
  },
  systemBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  heroSosSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emergencyLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  emergencyLoadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyLoadingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  emergencyLoadingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  promptContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  promptTitle: {
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  promptSubtitle: {
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
