import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../api/client';
import { Endpoints } from '../../api/endpoints';
import { mobileIncidentHub, MobileHubEvents } from '../../services/signalr.service';
import { useAppStore } from '../../store/useAppStore';
import {
  CitizenRescueAlertModal,
  MobileRescueAlertPayload,
} from './CitizenRescueAlertModal';

interface RawNotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  incidentId: string | null;
  dataJson: string | null;
  isRead: boolean;
}

export const CitizenNotificationListener: React.FC = () => {
  const { user, isAuthenticated } = useAppStore();
  const navigation = useNavigation<any>();
  const [activeAlert, setActiveAlert] = useState<MobileRescueAlertPayload | null>(null);
  const handledKeysRef = useRef<Set<string>>(new Set());
  const seededInitialRef = useRef(false);

  const isCitizen = isAuthenticated && user?.role !== 'staff';

  useEffect(() => {
    if (!isCitizen) {
      seededInitialRef.current = false;
      handledKeysRef.current.clear();
      setActiveAlert(null);
      return;
    }

    const triggerAlert = (payload: MobileRescueAlertPayload) => {
      if (handledKeysRef.current.has(payload.id)) return;
      handledKeysRef.current.add(payload.id);
      setActiveAlert(payload);
    };

    const handleNotification = (notif: RawNotificationDto, silentSeed = false) => {
      if (!notif?.id) return;
      const key = `notif-${notif.id}`;
      if (silentSeed) {
        handledKeysRef.current.add(key);
        return;
      }
      const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();
      let parsedData: { parentIncidentId?: string; plateNumber?: string; stationName?: string } = {};
      if (notif.dataJson) {
        try {
          parsedData = JSON.parse(notif.dataJson);
        } catch {
          // ignore
        }
      }

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
          items.forEach((n) => handleNotification(n, true));
          seededInitialRef.current = true;
          return;
        }
        items
          .filter((n) => !n.isRead)
          .forEach((n) => handleNotification(n, false));
      } catch {
        // ignore network poll hiccup
      }
    };

    void pollRecentNotifications();
    const pollTimer = setInterval(pollRecentNotifications, 12000);

    mobileIncidentHub.start().catch(() => {});
    const unsubNotif = mobileIncidentHub.on(MobileHubEvents.ReceiveNotification, (notif: RawNotificationDto) => {
      seededInitialRef.current = true;
      handleNotification(notif, false);
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
      unsubNotif();
      unsubAssign();
    };
  }, [isCitizen]);

  return (
    <CitizenRescueAlertModal
      alert={activeAlert}
      onTrack={(incidentId) => {
        navigation.navigate('SafetyMapTab', {
          trackingIncidentId: incidentId,
          fromHistory: true,
        });
      }}
      onDismiss={() => setActiveAlert(null)}
    />
  );
};
