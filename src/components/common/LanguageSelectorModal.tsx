import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Globe, X } from 'lucide-react-native';
import { AppLanguage, changeAppLanguage, getCurrentLanguage } from '../../i18n';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

  const languages: { code: AppLanguage; label: string; flag: string; subLabel: string }[] = [
    {
      code: 'vi',
      label: 'Tiếng Việt',
      flag: '🇻🇳',
      subLabel: 'Mặc định (Việt Nam)',
    },
    {
      code: 'en',
      label: 'English',
      flag: '🇬🇧',
      subLabel: 'International English',
    },
  ];

  const handleSelect = async (code: AppLanguage) => {
    await changeAppLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconCircle}>
                    <Globe size={18} color="#DC2626" />
                  </View>
                  <Text style={styles.title}>{t('language.select_title')}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsList}>
                {languages.map((item) => {
                  const isSelected = currentLang === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(item.code)}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.flagEmoji}>{item.flag}</Text>
                        <View>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.optionSub}>{item.subLabel}</Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionItemSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  optionLabelSelected: {
    color: '#DC2626',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
