import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Standard baseline dimensions based on standard modern smartphone (iPhone 11/12/13/14 mini/base)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Linear horizontal scaling according to screen width
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Linear vertical scaling according to screen height
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Controlled moderate scaling (default 50% factor)
 * Best for paddings, margins, border radiuses, and icons so they don't grow or shrink too wildly.
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

/**
 * Controlled moderate vertical scaling
 */
export const moderateVerticalScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (verticalScale(size) - size) * factor);
};

/**
 * Responsive font scaling that bounds scaling within reasonable limits
 * Prevents text from being tiny on small screens or giant on tablets.
 */
export const fontScale = (size: number, factor = 0.4): number => {
  const scaled = size + (scale(size) - size) * factor;
  // Clamp between 0.85x and 1.3x base size
  return Math.round(Math.min(Math.max(scaled, size * 0.85), size * 1.3));
};

/**
 * Width percentage to DP
 */
export const wp = (percentage: number): number => {
  return Math.round((percentage * SCREEN_WIDTH) / 100);
};

/**
 * Height percentage to DP
 */
export const hp = (percentage: number): number => {
  return Math.round((percentage * SCREEN_HEIGHT) / 100);
};

/**
 * Static device breakdown helpers
 */
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isStandardDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 420;
export const isLargeDevice = SCREEN_WIDTH >= 420;
export const isShortScreen = SCREEN_HEIGHT < 700;
export const isTallScreen = SCREEN_HEIGHT >= 850;
export const isTablet = SCREEN_WIDTH >= 768;
export const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;

/**
 * Dynamic hook that responds to orientation/window dimension changes in real-time
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const dynamicScale = (size: number) => (width / GUIDELINE_BASE_WIDTH) * size;
  const dynamicVerticalScale = (size: number) => (height / GUIDELINE_BASE_HEIGHT) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) =>
    Math.round(size + (dynamicScale(size) - size) * factor);
  const dynamicModerateVerticalScale = (size: number, factor = 0.5) =>
    Math.round(size + (dynamicVerticalScale(size) - size) * factor);
  const dynamicFontScale = (size: number, factor = 0.4) => {
    const scaled = size + (dynamicScale(size) - size) * factor;
    return Math.round(Math.min(Math.max(scaled, size * 0.85), size * 1.3));
  };

  const dynamicWp = (percentage: number) => Math.round((percentage * width) / 100);
  const dynamicHp = (percentage: number) => Math.round((percentage * height) / 100);

  return {
    width,
    height,
    insets,
    isSmallDevice: width < 375,
    isStandardDevice: width >= 375 && width < 420,
    isLargeDevice: width >= 420,
    isShortScreen: height < 700,
    isTallScreen: height >= 850,
    isTablet: width >= 768,
    aspectRatio: height / width,
    scale: dynamicScale,
    verticalScale: dynamicVerticalScale,
    moderateScale: dynamicModerateScale,
    moderateVerticalScale: dynamicModerateVerticalScale,
    fontScale: dynamicFontScale,
    wp: dynamicWp,
    hp: dynamicHp,
  };
};
