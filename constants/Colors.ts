// Brand & Primary
export const Colors = {
  // Primary
  primary: '#7C3AED',
  primaryLight: '#9D5CFF',
  primaryDark: '#5B21B6',
  secondary: '#4F46E5',
  accent: '#EC4899',
  accentLight: '#F472B6',

  // Dark Theme
  dark: {
    background: '#0A0A0F',
    surface: '#13131A',
    card: '#1C1C28',
    border: '#2D2D3D',
    divider: '#1E1E2E',
    overlay: '#0D0D15',
    canvasBackground: '#161622',
  },

  // Light Theme
  light: {
    background: '#F8F9FE',
    surface: '#FFFFFF',
    card: '#F0F1F8',
    border: '#E2E3F0',
    divider: '#EAEBF5',
  },

  // Text - Dark Mode
  text: {
    primary: '#F1F1F8',
    secondary: '#AAAAAF',
    muted: '#6B6B7B',
    inverse: '#1A1A2E',
    inverseSecondary: '#6B7280',
  },

  // Status
  success: '#10B981',
  successLight: '#34D399',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  // Premium
  premium: '#D4AF37',
  premiumLight: '#F5D76E',
  premiumBackground: '#1A1030',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',

  // Gradient stops
  gradients: {
    primary: ['#7C3AED', '#4F46E5'] as [string, string],
    accent: ['#EC4899', '#7C3AED'] as [string, string],
    gold: ['#F59E0B', '#D97706'] as [string, string],
    sunset: ['#FF6B6B', '#FFD93D'] as [string, string],
    purple: ['#7C3AED', '#EC4899'] as [string, string],
    dark: ['#1C1C28', '#0A0A0F'] as [string, string],
    premium: ['#D4AF37', '#F5D76E', '#D4AF37'] as [string, string, string],
  },
} as const;

export type ColorScheme = 'dark' | 'light';
