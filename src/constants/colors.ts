/**
 * Emergency Dispatch System - Design Tokens & Color Palette
 * Synchronized with emergency-dispatch-frontend (Tailwind CAD Design System)
 */

// High-Tech CAD & Landing Brand Palette (Synchronized with emergency-dispatch-frontend White & Red)
export const BrandColors = {
  bg: '#F8FAFC',         // Clean slate-50 light background
  surface: '#FFFFFF',    // Pure white card surface
  elevated: '#F1F5F9',   // Slate-100 elevated surface
  border: '#E2E8F0',     // Slate-200 border
  red: '#DC2626',        // Emergency Red (resq-red)
  redGlow: 'rgba(220, 38, 38, 0.25)',
  blue: '#2563EB',       // Electric Blue
  blueGlow: 'rgba(37, 99, 235, 0.25)',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
};

// CAD Light Theme Palette
export const CadColors = {
  darkest: '#F8FAFC',
  dark: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  hover: '#F1F5F9',
  accent: '#DC2626',
  red: '#DC2626',
};

// Emergency Severity Levels (1 - Low to 5 - Critical)
export const SeverityColors = {
  1: {
    color: '#10B981', // Emerald - Low
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#A7F3D0',
    text: '#047857',
  },
  2: {
    color: '#F59E0B', // Amber - Moderate
    bg: 'rgba(245, 158, 11, 0.12)',
    border: '#FDE68A',
    text: '#B45309',
  },
  3: {
    color: '#F97316', // Orange - High
    bg: 'rgba(249, 115, 22, 0.12)',
    border: '#FED7AA',
    text: '#C2410C',
  },
  4: {
    color: '#DC2626', // Emergency Red - Severe
    bg: 'rgba(220, 38, 38, 0.12)',
    border: '#FECACA',
    text: '#B91C1C',
  },
  5: {
    color: '#8B5CF6', // Purple/Violet Alert - Critical
    bg: 'rgba(139, 92, 246, 0.12)',
    border: '#DDD6FE',
    text: '#6D28D9',
  },
};

// Hazard Category Colors
export const HazardColors = {
  fire: '#DC2626',
  hazmat: '#EAB308',
  traffic: '#F97316',
  medical: '#EC4899',
  weapon: '#8B5CF6',
  collapse: '#64748B',
  flood: '#06B6D4',
};

// Response Unit Colors
export const UnitColors = {
  ambulance: '#10B981',
  fire: '#DC2626',
  police: '#2563EB',
  rescue: '#F59E0B',
};

// Standard Theme Colors
export const Colors = {
  // CAD Dark Theme (Default for Dispatch Mobile System)
  dark: {
    primary: '#DC2626',       // Emergency Red
    primaryDark: '#B91C1C',
    secondary: '#2563EB',     // Electric Blue
    accent: '#06B6D4',        // Cyan
    background: '#0F172A',    // High-tech dark base
    backgroundDarker: '#0B0F19',
    surface: '#131D33',       // Elevated card surface
    elevated: '#1E293B',      // Secondary elevated surface
    card: '#131D33',
    text: '#F8FAFC',          // Crisp light text
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B',     // Slate 500
    border: '#334155',        // Slate 700 border
    borderSubtle: '#1E293B',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#06B6D4',
  },
  // High-Contrast Light Theme
  light: {
    primary: '#DC2626',
    primaryDark: '#B91C1C',
    secondary: '#2563EB',
    accent: '#06B6D4',
    background: '#F8FAFC',
    backgroundDarker: '#F1F5F9',
    surface: '#FFFFFF',
    elevated: '#F1F5F9',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderSubtle: '#CBD5E1',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#0284C7',
  },
};

export type ThemeColors = typeof Colors.dark;
