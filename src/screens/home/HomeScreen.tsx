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
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { SosPulseButton } from '../../components/sos/SosPulseButton';
import { QuickHazardGrid, HazardItem } from '../../components/sos/QuickHazardGrid';
import { MediaReportModal } from '../../components/sos/MediaReportModal';
import { SosSuccessModal } from '../../components/sos/SosSuccessModal';
import { MainTabParamList } from '../../navigation/types';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // GPS Address state
  const [address, setAddress] = useState('123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM');
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Modals & triggers state
  const [selectedHazard, setSelectedHazard] = useState<HazardItem | null>(null);
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [isSosSuccessModalVisible, setIsSosSuccessModalVisible] = useState(false);

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

  const handleSosTriggered = () => {
    setIsSosSuccessModalVisible(true);
  };

  const handleSelectHazard = (hazard: HazardItem) => {
    setSelectedHazard(hazard);
    setIsMediaModalVisible(true);
  };

  const handleOpenGeneralMediaReport = () => {
    setSelectedHazard(null);
    setIsMediaModalVisible(true);
  };

  const handleSubmitReport = (data: {
    hazardId?: string;
    mediaType: 'photo' | 'video' | 'none';
    note: string;
  }) => {
    Alert.alert(
      'Báo Cáo Đã Gửi!',
      `Đã chuyển thông tin hiện trường tới trung tâm điều phối cứu hộ 114/115.`,
      [{ text: 'Đồng ý' }]
    );
  };

  return (
    <ScreenContainer backgroundColor="#0F172A" style={styles.container}>
      {/* 1. Header: GPS Address Pill & History Button */}
      <View style={styles.header}>
        {/* GPS Pill */}
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

          <View style={styles.addressInfo}>
            <View style={styles.addressTitleRow}>
              <MapPin size={13} color="#38BDF8" />
              <Text style={styles.accuracyTag}>Chính xác ±3m</Text>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </View>

          <RefreshCw
            size={14}
            color="#94A3B8"
            style={isRefreshingGps ? styles.rotating : undefined}
          />
        </TouchableOpacity>

        {/* Incident History Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ReportsTab')}
          style={styles.historyButton}
          accessible={true}
          accessibilityLabel="Xem lịch sử sự cố đã gửi"
          accessibilityRole="button"
        >
          <Clock size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Banner Notice */}
        <View style={styles.systemBanner}>
          <Sparkles size={14} color="#38BDF8" />
          <Text style={styles.systemBannerText}>
            HỆ THỐNG CỨU HỘ ĐANG TRỰC TUYẾN (24/7)
          </Text>
        </View>

        {/* 2. Hero SOS Trigger (Center-Bottom Thumb Zone) */}
        <View style={styles.heroSosSection}>
          <SosPulseButton onSosTriggered={handleSosTriggered} holdDuration={2000} />
        </View>

        {/* 3. Quick Hazard Grid: 4 Cards */}
        <QuickHazardGrid onSelectHazard={handleSelectHazard} />

        {/* 4. Camera / Media Quick Bar Trigger */}
        <View style={styles.mediaQuickBar}>
          <Text style={styles.quickBarTitle}>ĐÍNH KÈM HIỆN TRƯỜNG NHANH</Text>
          <View style={styles.quickBarButtonsRow}>
            {/* Quick Photo */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.photoBtn]}
              accessible={true}
              accessibilityLabel="Chụp ảnh hiện trường nhanh"
            >
              <Camera size={18} color="#38BDF8" />
              <Text style={styles.quickBarBtnText}>Chụp ảnh</Text>
            </TouchableOpacity>

            {/* Quick 5s Video */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.videoBtn]}
              accessible={true}
              accessibilityLabel="Quay clip 5 giây hiện trường"
            >
              <Video size={18} color="#EF4444" />
              <Text style={styles.quickBarBtnText}>Video 5s</Text>
            </TouchableOpacity>

            {/* Quick Note */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenGeneralMediaReport}
              style={[styles.quickBarBtn, styles.noteBtn]}
              accessible={true}
              accessibilityLabel="Ghi chú mô tả hiện trường"
            >
              <FileEdit size={18} color="#A855F7" />
              <Text style={styles.quickBarBtnText}>Ghi chú</Text>
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

      {/* SOS Success Modal Feedback */}
      <SosSuccessModal
        visible={isSosSuccessModalVisible}
        onClose={() => setIsSosSuccessModalVisible(false)}
        address={address}
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
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
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
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
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
    color: '#38BDF8',
  },
  addressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  systemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
    marginBottom: 6,
  },
  systemBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  heroSosSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  mediaQuickBar: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginTop: 8,
  },
  quickBarTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
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
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  photoBtn: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  videoBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  noteBtn: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  quickBarBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
