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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  MapPin,
  Clock,
  Camera,
  Video,
  FileEdit,
  Sparkles,
  RefreshCw,
  HeartPulse,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { SosPulseButton } from '../../components/sos/SosPulseButton';
import { QuickHazardGrid, HazardItem } from '../../components/sos/QuickHazardGrid';
import { MediaReportModal } from '../../components/sos/MediaReportModal';
import { SosSuccessModal } from '../../components/sos/SosSuccessModal';
import { SosActionModal } from '../../components/sos/SosActionModal';
import { MainTabParamList } from '../../navigation/types';
import { useResponsive } from '../../utils/responsive';
import { incidentService } from '../../services/incident.service';
import { mediaService } from '../../services/media.service';
import { IncidentResponseDto } from '../../types/incident';
import { useProfileStore } from '../../store/useProfileStore';
import { useAppStore } from '../../store/useAppStore';
import { storage } from '../../services/storage';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isSmallDevice, isShortScreen, moderateScale, fontScale } = useResponsive();
  const headerIconSize = isSmallDevice ? 18 : 20;

  const { profile } = useProfileStore();
  const { user } = useAppStore();

  // GPS Address state
  const [address, setAddress] = useState('123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM');
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Modals & triggers state
  const [selectedHazard, setSelectedHazard] = useState<HazardItem | null>(null);
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [isSosSuccessModalVisible, setIsSosSuccessModalVisible] = useState(false);
  const [activeIncident, setActiveIncident] = useState<IncidentResponseDto | null>(null);
  const [isSosActionModalVisible, setIsSosActionModalVisible] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosSendingLoadingText, setSosSendingLoadingText] = useState('');
  const [isSosPressing, setIsSosPressing] = useState(false);

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

  const handleRefreshGps = () => {
    setIsRefreshingGps(true);
    setTimeout(() => {
      setIsRefreshingGps(false);
      setAddress('123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM (GPS Vệ tinh)');
    }, 600);
  };

  const recordIncidentId = async (id: string) => {
    try {
      const existing = (await storage.getItem<string[]>('MY_REPORTED_INCIDENT_IDS')) || [];
      if (!existing.includes(id)) {
        await storage.setItem('MY_REPORTED_INCIDENT_IDS', [id, ...existing]);
      }
    } catch {
      // ignore
    }
  };

  // When SOS pulse button is held for 2s, open immediate Action Modal
  const handleSosTriggered = () => {
    setIsSosActionModalVisible(true);
  };

  const handleSosTakePhoto = async () => {
    try {
      const asset = await mediaService.pickFromCamera();
      if (!asset) return;
      setIsSendingSos(true);
      setSosSendingLoadingText('Đang tải ảnh hiện trường lên Cloudinary...');
      const url = await mediaService.uploadMedia(asset);
      setSosSendingLoadingText('AI đang phân tích nguy cơ & kích hoạt điều phối...');
      const created = await incidentService.createIncident({
        title: 'Báo động SOS Khẩn cấp',
        description: 'Người dân đè nút SOS 2s kích hoạt báo động khẩn cấp kèm ảnh hiện trường.',
        latitude: 10.776889,
        longitude: 106.700806,
        locationAddress: address,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls: [url],
      });
      setActiveIncident(created);
      await recordIncidentId(created.id);
      setIsSosActionModalVisible(false);
      setIsSosSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi gửi SOS', err.message || 'Không thể gửi báo động SOS.');
    } finally {
      setIsSendingSos(false);
    }
  };

  const handleSosPickLibrary = async () => {
    try {
      const asset = await mediaService.pickFromLibrary();
      if (!asset) return;
      setIsSendingSos(true);
      setSosSendingLoadingText('Đang tải ảnh hiện trường lên Cloudinary...');
      const url = await mediaService.uploadMedia(asset);
      setSosSendingLoadingText('AI đang phân tích nguy cơ & kích hoạt điều phối...');
      const created = await incidentService.createIncident({
        title: 'Báo động SOS Khẩn cấp',
        description: 'Người dân đè nút SOS 2s kích hoạt báo động khẩn cấp kèm ảnh hiện trường.',
        latitude: 10.776889,
        longitude: 106.700806,
        locationAddress: address,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls: [url],
      });
      setActiveIncident(created);
      await recordIncidentId(created.id);
      setIsSosActionModalVisible(false);
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
      setSosSendingLoadingText('Đang gửi toạ độ GPS tới trung tâm 114/115...');
      const created = await incidentService.createIncident({
        title: 'Báo động SOS Khẩn cấp',
        description: 'Người dân đè nút SOS 2s kích hoạt báo động khẩn cấp tức thời (không kèm ảnh).',
        latitude: 10.776889,
        longitude: 106.700806,
        locationAddress: address,
        reporterName: user?.name || profile.fullName || 'Công dân SOS',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls: [],
      });
      setActiveIncident(created);
      await recordIncidentId(created.id);
      setIsSosActionModalVisible(false);
      setIsSosSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi gửi SOS', err.message || 'Không thể gửi báo động SOS.');
    } finally {
      setIsSendingSos(false);
    }
  };

  const handleSelectHazard = (hazard: HazardItem) => {
    setSelectedHazard(hazard);
    setIsMediaModalVisible(true);
  };

  const handleOpenGeneralMediaReport = () => {
    setSelectedHazard(null);
    setIsMediaModalVisible(true);
  };

  const handleSubmitReport = async (data: {
    hazardId?: string;
    mediaType: 'photo' | 'video' | 'none';
    mediaUrls?: string[];
    note: string;
  }) => {
    try {
      const hazardTitle = selectedHazard?.title
        ? `Báo cáo nguy cơ: ${selectedHazard.title}`
        : 'Báo cáo sự cố hiện trường';

      const created = await incidentService.createIncident({
        title: hazardTitle,
        description: data.note.trim() || 'Người dân gửi báo cáo nguy cơ khẩn cấp kèm ảnh hiện trường.',
        latitude: 10.776889,
        longitude: 106.700806,
        locationAddress: address,
        reporterName: user?.name || profile.fullName || 'Công dân',
        reporterPhone: user?.phone || profile.phoneNumber || undefined,
        mediaUrls: data.mediaUrls || [],
      });
      await recordIncidentId(created.id);

      const aiText = created.aiClassification?.summary
        ? `\n\nAI Phân tích: ${created.aiClassification.summary}\n(Mức độ: ${created.severity})`
        : '';

      Alert.alert(
        'Báo Cáo Đã Gửi Thành Công!',
        `Đã chuyển thông tin tới trung tâm điều phối cứu hộ 114/115. Mã sự cố: #${created.id.slice(0, 8).toUpperCase()}.${aiText}`,
        [{ text: 'Đồng ý' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Lỗi Gửi Báo Cáo',
        err.message || 'Không thể gửi báo cáo hiện trường tới máy chủ.'
      );
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
      {/* 1. Header: GPS Address Pill & History Button */}
      <View style={styles.header}>
        {/* GPS Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRefreshGps}
          style={[styles.gpsPill, { paddingVertical: moderateScale(7) }]}
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

          <View style={styles.addressInfo}>
            <View style={styles.addressTitleRow}>
              <MapPin size={12} color="#DC2626" />
              <Text style={[styles.accuracyTag, { fontSize: fontScale(9) }]}>
                Chính xác ±3m
              </Text>
            </View>
            <Text
              style={[styles.addressText, { fontSize: fontScale(isSmallDevice ? 10.5 : 11.5) }]}
              numberOfLines={1}
            >
              {address}
            </Text>
          </View>

          <RefreshCw
            size={13}
            color="#94A3B8"
            style={isRefreshingGps ? styles.rotating : undefined}
          />
        </TouchableOpacity>

        {/* Incident History Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ReportsTab')}
          style={[
            styles.historyButton,
            {
              width: moderateScale(isSmallDevice ? 38 : 42),
              height: moderateScale(isSmallDevice ? 38 : 42),
              borderRadius: moderateScale(isSmallDevice ? 19 : 21),
            },
          ]}
          accessible={true}
          accessibilityLabel="Xem lịch sử sự cố đã gửi"
          accessibilityRole="button"
        >
          <Clock size={headerIconSize} color="#475569" />
        </TouchableOpacity>

        {/* Medical ID / Profile Quick Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProfileTab')}
          style={[
            styles.historyButton,
            styles.profileButton,
            {
              width: moderateScale(isSmallDevice ? 38 : 42),
              height: moderateScale(isSmallDevice ? 38 : 42),
              borderRadius: moderateScale(isSmallDevice ? 19 : 21),
            },
          ]}
          accessible={true}
          accessibilityLabel="Xem hồ sơ y tế cứu hộ"
          accessibilityRole="button"
        >
          <HeartPulse size={headerIconSize} color="#DC2626" />
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
            HỆ THỐNG CỨU HỘ ĐANG TRỰC TUYẾN (24/7)
          </Text>
        </View>

        {/* 2. Hero SOS Trigger (Center-Bottom Thumb Zone) */}
        <View style={styles.heroSosSection}>
          <SosPulseButton
            onSosTriggered={handleSosTriggered}
            holdDuration={2000}
            onPressStateChange={setIsSosPressing}
          />
        </View>

        {/* 3. Quick Hazard Grid: 4 Cards */}
        <QuickHazardGrid onSelectHazard={handleSelectHazard} />

        {/* 4. Camera / Media Quick Bar Trigger */}
        <View style={styles.mediaQuickBar}>
          <Text style={[styles.quickBarTitle, { fontSize: fontScale(10.5) }]}>
            ĐÍNH KÈM HIỆN TRƯỜNG NHANH
          </Text>
          <View style={styles.quickBarButtonsRow}>
            {/* Quick Photo */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.photoBtn]}
              accessible={true}
              accessibilityLabel="Chụp ảnh hiện trường nhanh"
            >
              <Camera size={isSmallDevice ? 16 : 18} color="#2563EB" />
              <Text
                style={[
                  styles.quickBarBtnText,
                  { fontSize: fontScale(isSmallDevice ? 10.5 : 11.5) },
                ]}
              >
                Chụp ảnh
              </Text>
            </TouchableOpacity>

            {/* Quick 5s Video */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.videoBtn]}
              accessible={true}
              accessibilityLabel="Quay clip 5 giây hiện trường"
            >
              <Video size={isSmallDevice ? 16 : 18} color="#DC2626" />
              <Text
                style={[
                  styles.quickBarBtnText,
                  { fontSize: fontScale(isSmallDevice ? 10.5 : 11.5) },
                ]}
              >
                Video 5s
              </Text>
            </TouchableOpacity>

            {/* Quick Note */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.noteBtn]}
              accessible={true}
              accessibilityLabel="Ghi chú mô tả hiện trường"
            >
              <FileEdit size={isSmallDevice ? 16 : 18} color="#7C3AED" />
              <Text
                style={[
                  styles.quickBarBtnText,
                  { fontSize: fontScale(isSmallDevice ? 10.5 : 11.5) },
                ]}
              >
                Ghi chú
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Media Report Bottom Sheet Modal */}
      <MediaReportModal
        visible={isMediaModalVisible}
        onClose={() => setIsMediaModalVisible(false)}
        selectedHazard={selectedHazard}
        currentAddress={address}
        onSubmitReport={handleSubmitReport}
      />

      {/* SOS Action Modal (Triggered when SOS button held 2s) */}
      <SosActionModal
        visible={isSosActionModalVisible}
        onClose={() => setIsSosActionModalVisible(false)}
        address={address}
        onTakePhoto={handleSosTakePhoto}
        onPickLibrary={handleSosPickLibrary}
        onSendWithoutMedia={handleSosSendWithoutMedia}
        isLoading={isSendingSos}
        loadingMessage={sosSendingLoadingText}
      />

      {/* SOS Success Modal Feedback */}
      <SosSuccessModal
        visible={isSosSuccessModalVisible}
        onClose={() => {
          setIsSosSuccessModalVisible(false);
          setActiveIncident(null);
        }}
        address={address}
        incident={activeIncident}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  gpsPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accuracyTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  addressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  profileButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  scrollContent: {
    paddingBottom: 24,
    alignItems: 'center',
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
    marginBottom: 6,
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
    marginVertical: 4,
  },
  mediaQuickBar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickBarTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  quickBarButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoBtn: {
    borderColor: '#E2E8F0',
  },
  videoBtn: {
    borderColor: 'rgba(220, 38, 38, 0.25)',
    backgroundColor: 'rgba(220, 38, 38, 0.04)',
  },
  noteBtn: {
    borderColor: '#E2E8F0',
  },
  quickBarBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});
