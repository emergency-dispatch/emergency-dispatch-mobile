import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
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
import i18n from '../../i18n';
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

    let cancelled = false;
    const seenModalsKey = `SEEN_CITIZEN_ALERT_MODALS_${user?.id || 'anon'}`;
    const seenModalsReady = storage
      .getItem<string[]>(seenModalsKey)
      .then((saved) => {
        if (!cancelled && Array.isArray(saved)) {
          saved.forEach((k) => handledKeysRef.current.add(k));
        }
      })
      .catch(() => {});

    const triggerAlert = async (payload: MobileRescueAlertPayload, markNotifId?: string) => {
      await seenModalsReady;
      if (cancelled || handledKeysRef.current.has(payload.id)) return;
      handledKeysRef.current.add(payload.id);
      storage
        .getItem<string[]>(seenModalsKey)
        .then((prev) => {
          const next = Array.isArray(prev) ? prev : [];
          if (!next.includes(payload.id)) {
            return storage.setItem(seenModalsKey, [...next.slice(-49), payload.id]);
          }
        })
        .catch(() => {});
      if (markNotifId) {
        apiService.put(Endpoints.NOTIFICATIONS.READ(markNotifId)).catch(() => {});
      }
      setActiveAlert(payload);
    };

    const verifyOwnActiveIncident = async (incidentId: string | null | undefined): Promise<boolean> => {
      if (!incidentId || !user?.id) return false;
      try {
        const detail = await incidentService.getIncidentById(incidentId);
        if (!detail || detail.viewedAsDuplicateReporter) return false;
        if (detail.status === 'Completed' || detail.status === 'Cancelled') return false;
        if (detail.reportedByUserId && detail.reportedByUserId.toLowerCase() !== user.id.toLowerCase()) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
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
        status?: string;
        assignmentId?: string;
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
          message:
            notif.message ||
            ((i18n.language || 'vi').startsWith('vi')
              ? 'Có sự cố tại khu vực gần đây.'
              : 'An incident has been reported nearby.'),
        });
        return;
      }

      if (initialSeed) {
        handledKeysRef.current.add(key);
        return;
      }

      const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();
      const isDuplicateConfirmed = text.includes('trùng với sự cố') || text.includes('duplicate');
      const statusNorm = String(parsedData.status || '').toLowerCase();
      const isDispatchedPendingAccept =
        statusNorm === 'dispatched' ||
        text.includes('đang chờ đội xác nhận') ||
        text.includes('đã giao sự cố') ||
        text.includes('waiting for the team to accept');
      const isAccepted =
        !isDispatchedPendingAccept &&
        (statusNorm === 'accepted' ||
          text.includes('đã nhận lệnh') ||
          text.includes('accepted'));

      if (!isDuplicateConfirmed && !isAccepted) return;

      const targetIncidentId = parsedData.parentIncidentId || notif.incidentId || null;
      if (!isDuplicateConfirmed) {
        const isOwn = await verifyOwnActiveIncident(targetIncidentId);
        if (!isOwn) return;
      }

      const alertDedupId = isDuplicateConfirmed
        ? key
        : `accepted-${targetIncidentId || parsedData.assignmentId || notif.id}`;

      const cleanRawMsg = String(notif.message || '').replace(/^\s*\[[^\]]+\]\s*/, '').trim();
      const plateMatch = cleanRawMsg.match(/(?:Vehicle|Xe)\s+(.+?)\s+(?:has accepted|đã nhận lệnh)/i);
      const resolvedPlate = parsedData.plateNumber || plateMatch?.[1]?.trim() || null;
      const isVi = (i18n.language || 'vi').startsWith('vi');

      await triggerAlert(
        {
          id: alertDedupId,
          kind: isDuplicateConfirmed ? 'duplicate_confirmed' : 'accepted',
          title: isDuplicateConfirmed
            ? (isVi ? 'Sự cố đã có người báo cáo' : 'Incident already reported')
            : (isVi ? 'Đội cứu hộ đã nhận lệnh' : 'Rescue team accepted'),
          message: isDuplicateConfirmed
            ? (isVi
                ? 'Đã có người báo cáo sự cố này và trung tâm đang xử lý.'
                : 'This incident has already been reported and dispatch is handling it.')
            : (isVi
                ? (resolvedPlate
                    ? `Xe ${resolvedPlate} đã nhận lệnh và đang chuẩn bị xuất phát tới vị trí của bạn.`
                    : 'Đội cứu hộ đã nhận lệnh và đang chuẩn bị xuất phát tới vị trí của bạn.')
                : (resolvedPlate
                    ? `Vehicle ${resolvedPlate} has accepted and is preparing to head to your location.`
                    : 'Rescue team has accepted and is preparing to head to your location.')),
          incidentId: targetIncidentId,
          plateNumber: parsedData.plateNumber || null,
          stationName: parsedData.stationName || null,
        },
        notif.id
      );
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
      void handleNotification(notif, false);
    });
    const unsubReconn = mobileIncidentHub.onReconnected(() => {
      void pollRecentNotifications();
    });
    const unsubCitizenMap = mobileIncidentHub.on(MobileHubEvents.ReceiveCitizenMapChanged, () => {
      void pollRecentNotifications();
    });
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void pollRecentNotifications();
      }
    });
    const unsubAssign = mobileIncidentHub.on(MobileHubEvents.ReceiveAssignmentStatus, async (evt: any) => {
      if (!evt) return;
      const st = String(evt.status || evt.Status || '');
      if (st !== 'Accepted') return;
      const incId = evt.incidentId || evt.IncidentId;
      const assignId = evt.assignmentId || evt.AssignmentId;
      const isOwn = await verifyOwnActiveIncident(incId);
      if (!isOwn) return;
      const isVi = (i18n.language || 'vi').startsWith('vi');
      await triggerAlert({
        id: `accepted-${incId || assignId}`,
        kind: 'accepted',
        title: isVi ? 'Đội cứu hộ đã nhận lệnh!' : 'Rescue team accepted!',
        message: isVi
          ? 'Đội trực chiến đã nhận lệnh điều phối và chuẩn bị xuất phát.'
          : 'Rescue team has accepted and is preparing to head to your location.',
        incidentId: incId || null,
        plateNumber: evt.plateNumber || evt.PlateNumber || evt.rescueUnitPlate || evt.RescueUnitPlate || null,
        stationName: evt.stationName || evt.StationName || null,
      });
    });

    return () => {
      cancelled = true;
      seededInitialRef.current = false;
      handledKeysRef.current.clear();
      setActiveAlert(null);
      setAreaBanner(null);
      clearInterval(pollTimer);
      appStateSub.remove();
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
      unsubNotif();
      unsubReconn();
      unsubCitizenMap();
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
                <Text style={styles.bannerTitle}>
                  {(i18n.language || 'vi').startsWith('vi') ? 'Cảnh báo sự cố' : 'Incident alert'}
                </Text>
                <Text style={styles.bannerTime}>
                  {(i18n.language || 'vi').startsWith('vi') ? 'Vừa xong' : 'Just now'}
                </Text>
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
