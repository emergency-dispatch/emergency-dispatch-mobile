import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Phone,
  MessageSquare,
  AlertTriangle,
  Flame,
  Users,
  Building2,
  PackageCheck,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { EmergencyIncident, MissionStage } from '../../types/dispatch';
import { SwipeToAction } from './SwipeToAction';

interface IncidentDetailCardProps {
  incident: EmergencyIncident;
  currentStage: MissionStage;
  onSwipeEnRoute: () => void;
  onAdvanceStage: (nextStage: MissionStage) => void;
  onCompleteMission: () => void;
}

export const IncidentDetailCard: React.FC<IncidentDetailCardProps> = ({
  incident,
  currentStage,
  onSwipeEnRoute,
  onAdvanceStage,
  onCompleteMission,
}) => {
  // Call caller handler
  const handleCallCaller = () => {
    const phoneNumber = `tel:${incident.callerPhone}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert(
            'Gọi Điện',
            `Đang quay số liên hệ: ${incident.callerName} (${incident.callerPhone})`
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Gọi Điện',
          `Đang quay số liên hệ: ${incident.callerName} (${incident.callerPhone})`
        );
      });
  };

  // SMS caller handler
  const handleSmsCaller = () => {
    const smsUrl = `sms:${incident.callerPhone}`;
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(smsUrl);
        } else {
          Alert.alert('Nhắn Tin', `Đang mở trình nhắn tin đến ${incident.callerPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Nhắn Tin', `Đang mở trình nhắn tin đến ${incident.callerPhone}`);
      });
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Top Drag Indicator Handle */}
      <View style={styles.sheetHandleContainer}>
        <View style={styles.sheetHandle} />
      </View>

      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Caller & On-Scene Contact Card */}
        <View style={styles.callerCard}>
          <View style={styles.callerAvatarWrap}>
            <Users size={moderateScale(18)} color="#DC2626" />
          </View>

          <View style={styles.callerInfoGroup}>
            <View style={styles.callerNameRow}>
              <Text style={styles.callerName}>{incident.callerName}</Text>
              <View style={styles.callerRoleBadge}>
                <Text style={styles.callerRoleText}>Nhân chứng</Text>
              </View>
            </View>
            <Text style={styles.callerPhoneText}>{incident.callerPhone}</Text>
          </View>

          {/* Quick Call & SMS Actions */}
          <View style={styles.contactActionButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.smsButton}
              onPress={handleSmsCaller}
            >
              <MessageSquare size={moderateScale(16)} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.callNowButton}
              onPress={handleCallCaller}
            >
              <Phone size={moderateScale(16)} color="#FFFFFF" />
              <Text
                style={styles.callNowText}
                numberOfLines={1}
                maxFontSizeMultiplier={1.15}
              >
                Gọi Ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Critical Scene Warning Box (Ghi chú hiện trường khẩn cấp) */}
        <View style={styles.emergencyWarningBox}>
          <View style={styles.warningHeaderRow}>
            <AlertTriangle size={moderateScale(18)} color="#F59E0B" />
            <Text
              style={styles.warningHeaderTitle}
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}
            >
              CẢNH BÁO HIỆN TRƯỜNG KHẨN CẤP
            </Text>
          </View>

          <Text style={styles.warningNotesText} maxFontSizeMultiplier={1.2}>
            "{incident.emergencyNotes}"
          </Text>

          {/* Required Gear Badges */}
          <View style={styles.gearTagsContainer}>
            <Text style={styles.gearTitle} numberOfLines={1}>
              Thiết bị cần mang:
            </Text>
            <View style={styles.gearTagsRow}>
              {incident.requiredEquipment.map((item, idx) => (
                <View key={idx} style={styles.gearTag}>
                  <PackageCheck size={moderateScale(11)} color="#FBBF24" />
                  <Text style={styles.gearTagText} numberOfLines={1}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 3. Patients & Hospital Destination */}
        <View style={styles.hospitalCard}>
          <View style={styles.hospitalIconWrap}>
            <Building2 size={moderateScale(18)} color="#DC2626" />
          </View>
          <View style={styles.hospitalTextGroup}>
            <Text style={styles.hospitalLabel} numberOfLines={1}>
              BỆNH VIỆN TIẾP NHẬN ĐỀ XUẤT
            </Text>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {incident.recommendedHospital}
            </Text>
            <Text style={styles.hospitalDistanceText} numberOfLines={1}>
              {incident.hospitalDistance}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. Action Area: Swipe to Action or Next Stage Advance */}
      <View style={styles.actionFooter}>
        {currentStage === 'accepted' && (
          <SwipeToAction
            onSwipeSuccess={onSwipeEnRoute}
            title="VUỐT ĐỂ XUẤT PHÁT (SWIPE TO EN ROUTE)"
            successTitle="ĐÃ XUẤT PHÁT! ĐANG DI CHUYỂN..."
            sliderColor="#10B981"
            activeTrackColor="rgba(16, 185, 129, 0.3)"
          />
        )}

        {currentStage === 'en_route' && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.advanceStageButtonRed}
            onPress={() => onAdvanceStage('on_scene')}
          >
            <View style={styles.advanceButtonInner}>
              <Flame size={moderateScale(20)} color="#FFFFFF" />
              <View style={styles.advanceTextGroup}>
                <Text
                  style={styles.advanceButtonText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                >
                  ĐÃ ĐẾN HIỆN TRƯỜNG (ON SCENE)
                </Text>
                <Text
                  style={styles.advanceButtonSubtext}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                >
                  Tiếp cận nạn nhân & Bắt đầu sơ cứu
                </Text>
              </View>
              <ArrowRight size={moderateScale(20)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {currentStage === 'on_scene' && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.advanceStageButtonEmerald}
            onPress={onCompleteMission}
          >
            <View style={styles.advanceButtonInner}>
              <ShieldCheck size={moderateScale(22)} color="#FFFFFF" strokeWidth={2.5} />
              <View style={styles.advanceTextGroup}>
                <Text
                  style={styles.advanceButtonText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                >
                  HOÀN THÀNH NHIỆM VỤ (COMPLETED)
                </Text>
                <Text
                  style={styles.advanceButtonSubtext}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                >
                  Bàn giao viện & Hoàn tất hồ sơ
                </Text>
              </View>
              <CheckCircle2 size={moderateScale(20)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {currentStage === 'completed' && (
          <View style={styles.completedBadgeBox}>
            <CheckCircle2 size={moderateScale(22)} color="#10B981" strokeWidth={2.5} />
            <Text
              style={styles.completedBadgeText}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
            >
              CA CẤP CỨU ĐÃ HOÀN TẤT THÀNH CÔNG
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: verticalScale(6),
    flex: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#CBD5E1',
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(12),
    gap: verticalScale(10),
  },
  callerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(10),
  },
  callerAvatarWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerInfoGroup: {
    flex: 1,
  },
  callerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  callerName: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  callerRoleBadge: {
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(1),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
  },
  callerRoleText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#DC2626',
  },
  callerPhoneText: {
    fontSize: moderateScale(11.5),
    color: '#64748B',
    marginTop: verticalScale(2),
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  contactActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  smsButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(10),
    gap: scale(5),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  callNowText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emergencyWarningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(6),
  },
  warningHeaderTitle: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  warningNotesText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    color: '#92400E',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  gearTagsContainer: {
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  gearTitle: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#B45309',
    marginBottom: verticalScale(4),
  },
  gearTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(5),
  },
  gearTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: scale(4),
  },
  gearTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#92400E',
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(10),
  },
  hospitalIconWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalTextGroup: {
    flex: 1,
  },
  hospitalLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  hospitalName: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(2),
  },
  hospitalDistanceText: {
    fontSize: moderateScale(10.5),
    color: '#DC2626',
    fontWeight: '700',
    marginTop: verticalScale(1),
  },
  actionFooter: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  advanceStageButtonRed: {
    height: verticalScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  advanceStageButtonEmerald: {
    height: verticalScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  advanceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  advanceTextGroup: {
    flex: 1,
    alignItems: 'center',
  },
  advanceButtonText: {
    fontSize: moderateScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  advanceButtonSubtext: {
    fontSize: moderateScale(9.5),
    color: '#F1F5F9',
    fontWeight: '600',
  },
  completedBadgeBox: {
    height: verticalScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  completedBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
});
