import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../api/client';
import { Endpoints } from '../../api/endpoints';
import { incidentService } from '../../services/incident.service';
import { mobileIncidentHub, MobileHubEvents } from '../../services/signalr.service';
import { storage } from '../../services/storage';
import { useAppStore } from '../../store/useAppStore';
import {
  CitizenRescueAlertModal,
  MobileRescueAlertPayload,
} from './CitizenRescueAlertModal';

interface RawNotificationDto {
  id: string;
  type: string | number;
  title: string;
  message: string;
  incidentId: string | null;
  dataJson: string | null;
  isRead: boolean;
}

interface AreaBannerPayload {
  id: string;
  publicAlertId: string;
  notificationId?: string;
  message: string;
}

export const CitizenNotificationListener: React.FC = () => {
  const { user, isAuthenticated } = useAppStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [activeAlert, setActiveAlert] = useState<MobileRescueAlertPayload | null>(null);
  const [areaBanner, setAreaBanner] = useState<AreaBannerPayload | null>(null);
  const bannerSlideY = useRef(new Animated.Value(-140)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledKeysRef = useRef<Set<string>>(new Set());
  const seededInitialRef = useRef(false);

  const isCitizen = isAuthenticated && user?.role !== 'staff';

  useEffect(() => {
    if (areaBanner) {
      bannerSlideY.setValue(-140);
      bannerOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(bannerSlideY, {
          toValue: 0,
          friction: 9,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [areaBanner?.id, bannerOpacity, bannerSlideY]);

  useEffect(() => {
    if (!isCitizen) {
      seededInitialRef.current = false;
      handledKeysRef.current.clear();
      setActiveAlert(null);
      setAreaBanner(null);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
      return;
    }

    const triggerAlert = (payload: MobileRescueAlertPayload) => {
      if (handledKeysRef.current.has(payload.id)) return;
      handledKeysRef.current.add(payload.id);
      setActiveAlert(payload);
    };

    const showAreaBanner = async (payload: AreaBannerPayload) => {
      if (handledKeysRef.current.has(payload.id)) return;
      handledKeysRef.current.add(payload.id);

      const seenKey = `SEEN_CITIZEN_AREA_ALERTS_${user?.id || 'anon'}`;
      try {
        const prev = (await storage.getItem<string[]>(seenKey)) || [];
        if (!prev.includes(payload.publicAlertId)) {
          await storage.setItem(seenKey, [...prev.slice(-49), payload.publicAlertId]);
        }
      } catch {
        // ignore storage errors
      }

      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      setAreaBanner(payload);
      bannerTimerRef.current = setTimeout(() => {
        setAreaBanner(null);
      }, 10000);
    };

    const handleNotification = async (notif: RawNotificationDto, initialSeed = false) => {
      if (!notif?.id) return;
      const key = `notif-${notif.id}`;
      let parsedData: {
        type?: string;
        publicAlertId?: string;
        parentIncidentId?: string;
        plateNumber?: string;
        stationName?: string;
      } = {};
      if (notif.dataJson) {
        try {
          parsedData = JSON.parse(notif.dataJson);
        } catch {
          // ignore
        }
      }

      const isAreaAlert =
        notif.type === 'CitizenIncidentAlert' ||
        notif.type === 6 ||
        parsedData.type === 'citizen_incident_alert';

      if (isAreaAlert) {
        const publicAlertId = parsedData.publicAlertId || notif.id;
        const areaKey = `area-${publicAlertId}`;
        if (handledKeysRef.current.has(areaKey)) return;

        if (initialSeed) {
          if (notif.isRead) {
            handledKeysRef.current.add(areaKey);
            return;
          }
          const seenKey = `SEEN_CITIZEN_AREA_ALERTS_${user?.id || 'anon'}`;
          const seen = (await storage.getItem<string[]>(seenKey)) || [];
          if (seen.includes(publicAlertId)) {
            handledKeysRef.current.add(areaKey);
            return;
          }
          // Chỉ hiện banner lúc vừa đăng nhập nếu sự cố vẫn còn hiệu lực trên bản đồ Citizen
          const activePin = await incidentService.getCitizenMapIncidentByAlert(publicAlertId);
          if (!activePin) {
            handledKeysRef.current.add(areaKey);
            return;
          }
        }

        await showAreaBanner({
          id: areaKey,
          publicAlertId,
          notificationId: notif.id,
          message: notif.message || 'Có sự cố tại khu vực gần đây.',
        });
        return;
      }

      if (initialSeed) {
        handledKeysRef.current.add(key);
        return;
      }

      const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();
      const isDuplicateConfirmed = text.includes('trùng với sự cố') || text.includes('duplicate');
      const isTeamAccepted =
        notif.type === 'JobAssigned' ||
        text.includes('nhận lệnh') ||
        text.includes('đang đến') ||
        text.includes('đã giao đội') ||
        text.includes('accepted');

      if (!isDuplicateConfirmed && !isTeamAccepted) return;

      triggerAlert({
        id: key,
        kind: isDuplicateConfirmed ? 'duplicate_confirmed' : 'accepted',
        title: notif.title || (isDuplicateConfirmed ? 'Xác nhận báo cáo trùng' : 'Đội cứu hộ đã tiếp nhận'),
        message: notif.message || 'Yêu cầu cứu hộ của bạn đã được cập nhật tiến độ xử lý.',
        incidentId: parsedData.parentIncidentId || notif.incidentId || null,
        plateNumber: parsedData.plateNumber || null,
        stationName: parsedData.stationName || null,
      });
    };

    const pollRecentNotifications = async () => {
      try {
        const res = await apiService.get<{
          success: boolean;
          data?: { items?: RawNotificationDto[] };
        }>(Endpoints.NOTIFICATIONS.BASE, { params: { pageIndex: 1, pageSize: 10 } });
        const items = res?.data?.items || [];
        if (!seededInitialRef.current) {
          seededInitialRef.current = true;
          for (const n of items) {
            await handleNotification(n, true);
          }
          return;
        }
        for (const n of items.filter((x) => !x.isRead)) {
          await handleNotification(n, false);
        }
      } catch {
        // ignore network poll hiccup
      }
    };

    void pollRecentNotifications();
    const pollTimer = setInterval(pollRecentNotifications, 12000);

    mobileIncidentHub.start().catch(() => {});
    const unsubNotif = mobileIncidentHub.on(MobileHubEvents.ReceiveNotification, (notif: RawNotificationDto) => {
      seededInitialRef.current = true;
      void handleNotification(notif, false);
    });
    const unsubAssign = mobileIncidentHub.on(MobileHubEvents.ReceiveAssignmentStatus, (evt: any) => {
      if (!evt) return;
      const st = String(evt.status || evt.Status || '');
      if (st !== 'Accepted' && st !== 'EnRoute') return;
      const incId = evt.incidentId || evt.IncidentId;
      triggerAlert({
        id: `assign-${incId}-${st}`,
        kind: 'accepted',
        title: st === 'EnRoute' ? 'Xe cứu hộ đang xuất phát!' : 'Đội cứu hộ đã nhận lệnh!',
        message:
          st === 'EnRoute'
            ? 'Xe cứu hộ đang trên đường đến hiện trường qua GPS thời gian thực.'
            : 'Đội trực chiến đã nhận lệnh điều phối và chuẩn bị xuất phát.',
        incidentId: incId || null,
        plateNumber: evt.plateNumber || evt.PlateNumber || null,
        stationName: evt.stationName || evt.StationName || null,
      });
    });

    return () => {
      clearInterval(pollTimer);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
      unsubNotif();
      unsubAssign();
    };
  }, [isCitizen, user?.id]);

  const dismissAreaBanner = () => {
    const nid = areaBanner?.notificationId;
    setAreaBanner(null);
    if (nid) {
      apiService.put(Endpoints.NOTIFICATIONS.READ(nid)).catch(() => {});
    }
  };

  return (
    <>
      {areaBanner && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.bannerContainer,
            {
              top: Math.max(insets.top + 8, 14),
              opacity: bannerOpacity,
              transform: [{ translateY: bannerSlideY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.bannerCard}
            onPress={() => {
              const pid = areaBanner.publicAlertId;
              dismissAreaBanner();
              navigation.navigate('Main', {
                screen: 'SafetyMapTab',
                params: { focusPublicAlertId: pid },
              });
            }}
          >
            <View style={styles.bannerIconWrap}>
              <BellRing size={18} color="#EA580C" />
            </View>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTopRow}>
                <Text style={styles.bannerTitle}>Cảnh báo sự cố</Text>
                <Text style={styles.bannerTime}>Vừa xong</Text>
              </View>
              <Text style={styles.bannerMessage} numberOfLines={2}>
                {areaBanner.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={dismissAreaBanner}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.bannerClose}
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      <CitizenRescueAlertModal
        alert={activeAlert}
        onTrack={(incidentId) => {
          navigation.navigate('Main', {
            screen: 'SafetyMapTab',
            params: {
              trackingIncidentId: incidentId,
              fromHistory: true,
            },
          });
        }}
        onDismiss={() => setActiveAlert(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
    gap: 10,
  },
  bannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bannerTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bannerMessage: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },
  bannerClose: {
    padding: 4,
  },
});
