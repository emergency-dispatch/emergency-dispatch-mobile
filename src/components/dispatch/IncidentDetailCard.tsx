import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Image,
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
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Eye,
  Truck,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { EmergencyIncident, MissionStage } from '../../types/dispatch';
import { SwipeToAction } from './SwipeToAction';

export type IncidentViewMode = 'split' | 'map_expanded' | 'details_expanded';

interface IncidentDetailCardProps {
  incident: EmergencyIncident;
  currentStage: MissionStage;
  onSwipeEnRoute: () => void;
  onAdvanceStage: (nextStage: MissionStage) => void;
  onCompleteMission: () => void;
  onRevealPhone?: () => Promise<void> | void;
  viewMode?: IncidentViewMode;
  onToggleExpandDetails?: () => void;
  onToggleExpandMap?: () => void;
}

export const IncidentDetailCard: React.FC<IncidentDetailCardProps> = ({
  incident,
  currentStage,
  onSwipeEnRoute,
  onAdvanceStage,
  onCompleteMission,
  onRevealPhone,
  viewMode = 'split',
  onToggleExpandDetails,
  onToggleExpandMap,
}) => {
  // Call caller handler (auto prompt unmask if still masked)
  const handleCallCaller = async () => {
    if (incident.callerPhone.includes('*') && onRevealPhone) {
      await onRevealPhone();
      return;
    }
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

  // SMS caller handler (auto prompt unmask if still masked)
  const handleSmsCaller = async () => {
    if (incident.callerPhone.includes('*') && onRevealPhone) {
      await onRevealPhone();
      return;
    }
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
      {/* Top Drag Indicator Handle with Interactive Toggle */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.sheetHandleContainer}
        onPress={onToggleExpandDetails}
        accessible={true}
        accessibilityLabel={
          viewMode === 'details_expanded'
            ? 'Thu nhỏ về chế độ bản đồ'
            : 'Mở rộng chi tiết ca trực'
        }
      >
        <View style={styles.sheetHandle} />

        <View style={styles.handleInfoBar}>
          <View style={styles.handleBadgeRow}>
            {viewMode === 'details_expanded' ? (
              <>
                <ChevronDown size={moderateScale(15)} color="#64748B" />
                <Text style={styles.handleBadgeText}>Chạm để thu nhỏ</Text>
              </>
            ) : viewMode === 'map_expanded' ? (
              <>
                <ChevronUp size={moderateScale(15)} color="#DC2626" />
                <Text style={[styles.handleBadgeText, { color: '#DC2626' }]}>
                  Chạm để mở rộng chi tiết ca trực
                </Text>
              </>
            ) : (
              <>
                <ChevronUp size={moderateScale(15)} color="#64748B" />
                <Text style={styles.handleBadgeText}>
                  Chạm để phóng to xem đầy đủ chi tiết
                </Text>
              </>
            )}
          </View>

          {onToggleExpandMap && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.quickMapToggleChip,
                viewMode === 'map_expanded' && styles.quickMapToggleChipActive,
              ]}
              onPress={onToggleExpandMap}
            >
              {viewMode === 'map_expanded' ? (
                <>
                  <Minimize2 size={moderateScale(12)} color="#DC2626" />
                  <Text style={styles.quickMapToggleTextRed}>Chia Đôi</Text>
                </>
              ) : (
                <>
                  <Maximize2 size={moderateScale(12)} color="#475569" />
                  <Text style={styles.quickMapToggleText}>Phóng To Map</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Main Body */}
      {viewMode === 'map_expanded' ? (
        <View style={styles.compactMapBar}>
          <View style={styles.callerAvatarWrapSmall}>
            <Users size={moderateScale(16)} color="#DC2626" />
          </View>
          <View style={styles.compactCallerInfo}>
            <Text style={styles.compactCallerName} numberOfLines={1}>
              {incident.callerName}
            </Text>
            <Text style={styles.compactCallerSub} numberOfLines={1}>
              {incident.callerPhone} • Người báo cáo
            </Text>
          </View>

          <View style={styles.contactActionButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.smsButtonSmall}
              onPress={handleSmsCaller}
            >
              <MessageSquare size={moderateScale(14)} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.callNowButtonSmall}
              onPress={handleCallCaller}
            >
              <Phone size={moderateScale(13)} color="#FFFFFF" />
              <Text style={styles.callNowTextSmall}>Gọi</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* 1. Caller & On-Scene Contact Card */}
          {/* 1. Caller & On-Scene Contact Card */}
          <View style={styles.callerCard}>
            <View style={styles.callerAvatarWrap}>
              <Users size={moderateScale(16)} color="#DC2626" />
            </View>

            <View style={styles.callerInfoGroup}>
              <View style={styles.callerNameRow}>
                <Text style={styles.callerName} numberOfLines={1}>
                  {incident.callerName}
                </Text>
                <View style={styles.callerRoleBadge}>
                  <Text style={styles.callerRoleText}>Người báo cáo</Text>
                </View>
              </View>

              <View style={styles.callerSubRow}>
                <Text style={styles.callerPhoneText} numberOfLines={1}>
                  {incident.callerPhone}
                </Text>
                {incident.callerPhone.includes('*') && onRevealPhone && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.revealPhoneChip}
                    onPress={onRevealPhone}
                  >
                    <Eye size={moderateScale(11)} color="#DC2626" />
                    <Text style={styles.revealPhoneText}>Mở khóa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Call & SMS Actions */}
            <View style={styles.contactActionButtons}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.smsButton}
                onPress={handleSmsCaller}
                accessibilityLabel="Nhắn tin cho người báo cáo"
              >
                <MessageSquare size={moderateScale(15)} color="#DC2626" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.callNowButton}
                onPress={handleCallCaller}
                accessibilityLabel="Gọi điện cho người báo cáo"
              >
                <Phone size={moderateScale(14)} color="#FFFFFF" />
                <Text
                  style={styles.callNowText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.15}
                >
                  Gọi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Operator Dispatcher Instructions */}
          {!!incident.operatorNotes && (
            <View style={styles.operatorNotesCard}>
              <View style={styles.operatorNotesHeader}>
                <ShieldAlert size={moderateScale(15)} color="#0284C7" />
                <Text style={styles.operatorNotesTitle}>CHỈ THỊ ĐIỀU PHỐI TỪ OPERATOR</Text>
              </View>
              <Text style={styles.operatorNotesBody}>"{incident.operatorNotes}"</Text>
            </View>
          )}

          {/* Citizen Evidence Photos */}
          {!!(incident.mediaUrls && incident.mediaUrls.length > 0) && (
            <View style={styles.mediaBox}>
              <Text style={styles.mediaTitle}>
                ẢNH HIỆN TRƯỜNG TỪ NGƯỜI BÁO TIN ({incident.mediaUrls.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaScroll}
              >
                {incident.mediaUrls.map((url, idx) => (
                  <Image key={idx} source={{ uri: url }} style={styles.evidenceThumbnail} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Coordinated Units at the Scene */}
          {!!(incident.cooperatingUnits && incident.cooperatingUnits.length > 0) && (
            <View style={styles.cooperatingUnitsCard}>
              <View style={styles.cooperatingHeader}>
                <Truck size={moderateScale(15)} color="#059669" />
                <Text style={styles.cooperatingTitle}>
                  ĐỘI CỨU HỘ CÙNG HIỆN TRƯỜNG ({incident.cooperatingUnits.length})
                </Text>
              </View>
              {incident.cooperatingUnits.map((u, idx) => (
                <View key={idx} style={styles.cooperatingUnitRow}>
                  <Text style={styles.cooperatingUnitPlate}>{u.rescueUnitPlate || 'Xe cứu hộ'}</Text>
                  <Text style={styles.cooperatingUnitType}>
                    • {u.rescueUnitType || 'Cứu hộ'} • Trạng thái: {u.status}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
      )}

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
              <Flame size={moderateScale(16)} color="#FFFFFF" />
              <Text
                style={styles.advanceButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.15}
              >
                ĐÃ ĐẾN HIỆN TRƯỜNG (ON SCENE)
              </Text>
              <ArrowRight size={moderateScale(16)} color="#FFFFFF" />
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
              <ShieldCheck size={moderateScale(17)} color="#FFFFFF" strokeWidth={2.4} />
              <Text
                style={styles.advanceButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.15}
              >
                HOÀN THÀNH NHIỆM VỤ (COMPLETED)
              </Text>
              <CheckCircle2 size={moderateScale(16)} color="#FFFFFF" />
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
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(6),
    paddingHorizontal: scale(14),
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#CBD5E1',
    marginBottom: verticalScale(4),
  },
  handleInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: verticalScale(2),
  },
  handleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  handleBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#64748B',
  },
  quickMapToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#F1F5F9',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickMapToggleChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  quickMapToggleText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#475569',
  },
  quickMapToggleTextRed: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  compactMapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: scale(14),
    marginBottom: verticalScale(6),
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(8),
  },
  callerAvatarWrapSmall: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCallerInfo: {
    flex: 1,
  },
  compactCallerName: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  compactCallerSub: {
    fontSize: moderateScale(9.5),
    color: '#64748B',
    marginTop: verticalScale(1),
  },
  smsButtonSmall: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNowButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
    gap: scale(4),
  },
  callNowTextSmall: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(3),
    paddingBottom: verticalScale(8),
    gap: verticalScale(6),
  },
  callerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(10),
  },
  callerAvatarWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  callerInfoGroup: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  callerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  callerName: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  callerRoleBadge: {
    backgroundColor: '#FEF2F2',
    paddingVertical: verticalScale(1.5),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#FECACA',
    flexShrink: 0,
  },
  callerRoleText: {
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    color: '#DC2626',
  },
  callerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(2),
  },
  callerPhoneText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontFamily: 'monospace',
    fontWeight: '600',
    flexShrink: 1,
  },
  revealPhoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    backgroundColor: '#FEE2E2',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(8),
    flexShrink: 0,
  },
  revealPhoneText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#DC2626',
  },
  contactActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    flexShrink: 0,
  },
  smsButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  callNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    height: moderateScale(32),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(8),
    gap: scale(4),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0,
  },
  callNowText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emergencyWarningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(10),
    padding: moderateScale(8),
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: verticalScale(4),
  },
  warningHeaderTitle: {
    fontSize: moderateScale(10.5),
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  warningNotesText: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(15),
    color: '#92400E',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  gearTagsContainer: {
    marginTop: verticalScale(5),
    paddingTop: verticalScale(5),
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  gearTitle: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#B45309',
    marginBottom: verticalScale(3),
  },
  gearTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(4),
  },
  gearTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(5),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: scale(3),
  },
  gearTagText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#92400E',
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: scale(8),
  },
  hospitalIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalTextGroup: {
    flex: 1,
  },
  hospitalLabel: {
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  hospitalName: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: verticalScale(1),
  },
  hospitalDistanceText: {
    fontSize: moderateScale(10),
    color: '#DC2626',
    fontWeight: '700',
  },
  actionFooter: {
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(5),
    paddingBottom: verticalScale(6),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  advanceStageButtonRed: {
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  advanceStageButtonEmerald: {
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  advanceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    width: '100%',
  },
  advanceTextGroup: {
    flex: 1,
    alignItems: 'center',
  },
  advanceButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  advanceButtonSubtext: {
    fontSize: moderateScale(9),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  completedBadgeBox: {
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
  },
  completedBadgeText: {
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  operatorNotesCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginBottom: verticalScale(10),
  },
  operatorNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(4),
  },
  operatorNotesTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.3,
  },
  operatorNotesBody: {
    fontSize: moderateScale(11.5),
    color: '#0369A1',
    lineHeight: verticalScale(16),
    fontWeight: '500',
  },
  mediaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginBottom: verticalScale(10),
  },
  mediaTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#334155',
    marginBottom: verticalScale(8),
    letterSpacing: 0.3,
  },
  mediaScroll: {
    gap: scale(8),
  },
  evidenceThumbnail: {
    width: scale(72),
    height: scale(72),
    borderRadius: moderateScale(8),
    backgroundColor: '#E2E8F0',
  },
  cooperatingUnitsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginBottom: verticalScale(10),
  },
  cooperatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(6),
  },
  cooperatingTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  cooperatingUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
  },
  cooperatingUnitPlate: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#065F46',
  },
  cooperatingUnitType: {
    fontSize: moderateScale(11),
    color: '#047857',
    marginLeft: scale(4),
  },
});
