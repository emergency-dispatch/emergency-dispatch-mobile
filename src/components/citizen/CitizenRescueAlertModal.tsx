import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { BellRing, CheckCircle2, Navigation, Truck, X } from 'lucide-react-native';

export interface MobileRescueAlertPayload {
  id: string;
  kind: 'accepted' | 'duplicate_confirmed';
  title: string;
  message: string;
  incidentId?: string | null;
  plateNumber?: string | null;
  stationName?: string | null;
}

interface CitizenRescueAlertModalProps {
  alert: MobileRescueAlertPayload | null;
  onTrack?: (incidentId: string) => void;
  onDismiss: () => void;
}

const CHIME_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
try {
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (Ctx) {
    var ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    var now = ctx.currentTime;
    [587.33, 783.99, 987.77].forEach(function(freq, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      var t = now + i * 0.14;
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.4);
    });
  }
} catch(e) {}
</script></body></html>`;

export const CitizenRescueAlertModal: React.FC<CitizenRescueAlertModalProps> = ({
  alert,
  onTrack,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!alert) return;
    try {
      Vibration.vibrate([0, 220, 100, 220]);
    } catch {
      // ignore
    }
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [alert?.id, opacityAnim, scaleAnim]);

  const soundSource = useMemo(() => ({ html: CHIME_HTML }), []);
  if (!alert) return null;

  const isDuplicate = alert.kind === 'duplicate_confirmed';
  const RNWebView = WebView as any;

  return (
    <Modal
      visible={Boolean(alert)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Hidden WebAudio chime player (0 dependencies) */}
        <View style={styles.hiddenAudio}>
          <RNWebView
            key={alert.id}
            source={soundSource}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
          />
        </View>

        <Animated.View
          style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <View style={[styles.header, isDuplicate ? styles.headerIndigo : styles.headerEmerald]}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                {isDuplicate ? (
                  <BellRing size={20} color="#FFFFFF" />
                ) : (
                  <Truck size={20} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>
                  {isDuplicate ? 'CẬP NHẬT ĐỐI SOÁT SỰ CỐ' : 'THÔNG BÁO ĐIỀU PHỐI KHẨN'}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                  {alert.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.messageBox}>
              <CheckCircle2
                size={18}
                color={isDuplicate ? '#4F46E5' : '#059669'}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.messageText}>{alert.message}</Text>
            </View>

            {(alert.plateNumber || alert.stationName) && (
              <View style={styles.metaGrid}>
                {alert.plateNumber && (
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>PHƯƠNG TIỆN</Text>
                    <Text style={styles.metaValue}>{alert.plateNumber}</Text>
                  </View>
                )}
                {alert.stationName && (
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>ĐƠN VỊ ỨNG CỨU</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {alert.stationName}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.actions}>
              {alert.incidentId && onTrack && (
                <TouchableOpacity
                  style={[styles.trackBtn, isDuplicate ? styles.trackBtnIndigo : styles.trackBtnEmerald]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const id = alert.incidentId!;
                    onDismiss();
                    onTrack(id);
                  }}
                >
                  <Navigation size={15} color="#FFFFFF" />
                  <Text style={styles.trackBtnText}>Theo dõi ngay</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.dismissBtn} activeOpacity={0.8} onPress={onDismiss}>
                <Text style={styles.dismissBtnText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hiddenAudio: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerEmerald: {
    backgroundColor: '#059669',
  },
  headerIndigo: {
    backgroundColor: '#4F46E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
    gap: 14,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#334155',
    fontWeight: '600',
  },
  metaGrid: {
    gap: 8,
  },
  metaBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  metaValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  trackBtnEmerald: {
    backgroundColor: '#059669',
  },
  trackBtnIndigo: {
    backgroundColor: '#4F46E5',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dismissBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
});
