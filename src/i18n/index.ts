import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import vi from './locales/vi.json';
import en from './locales/en.json';

export const APP_LANGUAGE_KEY = 'app_lang';
export type AppLanguage = 'vi' | 'en';

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

// Language detector plugin for i18next in React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // 1. Check user preference previously stored in AsyncStorage
      const savedLang = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
      if (savedLang === 'vi' || savedLang === 'en') {
        return callback(savedLang);
      }

      // 2. Otherwise detect device default language
      const locales = Localization.getLocales();
      const deviceLang = locales?.[0]?.languageCode ?? 'vi';
      const initialLang: AppLanguage = deviceLang.toLowerCase().startsWith('vi') ? 'vi' : 'en';

      return callback(initialLang);
    } catch {
      return callback('vi');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to cache language:', e);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Required for React Native & Android Hermes engine
    resources,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const changeAppLanguage = async (lang: AppLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Error switching language:', error);
  }
};

export const getCurrentLanguage = (): AppLanguage => {
  const current = i18n.language || 'vi';
  return current.startsWith('vi') ? 'vi' : 'en';
};

export default i18n;
