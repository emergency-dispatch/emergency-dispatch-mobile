import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldAlert,
  Camera,
  Images,
  Zap,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface SosActionModalProps {
  visible: boolean;
  onClose: () => void;
  address: string;
  onTakePhoto: () => void;
  onPickLibrary: () => void;
  onSendWithoutMedia: () => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export const SosActionModal: React.FC<SosActionModalProps> = ({
  visible,
  onClose,
  address,
  onTakePhoto,
  onPickLibrary,
  onSendWithoutMedia,
  isLoading,
  loadingMessage,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => !isLoading && onClose()}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.alertDot} />
              <Text style={styles.title}>{t('sos_modal.title_sos_action')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={styles.closeBtn}
            >
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Location Badge */}
          <View style={styles.locationWrap}>
            <MapPin size={13} color="#DC2626" />
            <Text style={styles.locationText} numberOfLines={1}>
              {address}
            </Text>
          </View>

          <Text style={styles.promptText}>
            {t('sos_modal.action_prompt')}
          </Text>

          {/* Loading State Overlay */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingTitle}>{t('sos_modal.connecting_dispatch')}</Text>
              <Text style={styles.loadingSubtitle}>
                {loadingMessage || 'Đang tải dữ liệu hiện trường và truyền tín hiệu cứu hộ...'}
              </Text>
            </View>
          ) : (
            <View style={styles.actionList}>
              {/* 1. Direct Camera */}
              <TouchableOpacity
                style={[styles.actionButton, styles.cameraButton]}
                onPress={onTakePhoto}
                activeOpacity={0.8}
              >
                <View style={styles.iconCircleRed}>
                  <Camera size={22} color="#FFFFFF" />
                </View>
                <View style={styles.btnTextWrap}>
                  <View style={styles.btnTitleRow}>
                    <Text style={styles.btnTitleLight}>{t('sos_modal.take_photo_ai')}</Text>
                    <View style={styles.aiTag}>
                      <Sparkles size={10} color="#FDE047" />
                      <Text style={styles.aiTagText}>{t('sos_modal.ai_recommended')}</Text>
                    </View>
                  </View>
                  <Text style={styles.btnDescLight}>
                    {t('sos_modal.take_photo_ai_sub')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Pick from Library */}
              <TouchableOpacity
                style={[styles.actionButton, styles.libraryButton]}
                onPress={onPickLibrary}
                activeOpacity={0.8}
              >
                <View style={styles.iconCircleBlue}>
                  <Images size={20} color="#0284C7" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitleDark}>{t('sos_modal.pick_library_btn')}</Text>
                  <Text style={styles.btnDescDark}>
                    {t('sos_modal.pick_library_sub')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3. Send without media */}
              <TouchableOpacity
                style={[styles.actionButton, styles.directButton]}
                onPress={onSendWithoutMedia}
                activeOpacity={0.8}
              >
                <View style={styles.iconCircleAmber}>
                  <Zap size={20} color="#D97706" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitleDark}>{t('sos_modal.direct_sos_btn')}</Text>
                  <Text style={styles.btnDescDark}>
                    {t('sos_modal.direct_sos_sub')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel button */}
          {!isLoading && (
            <TouchableOpacity
              style={styles.cancelAction}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  promptText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },
  actionList: {
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  libraryButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  directButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  iconCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleAmber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTextWrap: {
    flex: 1,
    gap: 2,
  },
  btnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnTitleLight: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnTitleDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnDescLight: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  btnDescDark: {
    fontSize: 11.5,
    color: '#64748B',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE047',
  },
  cancelAction: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },
});
