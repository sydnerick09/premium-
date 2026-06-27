import { Platform } from 'react-native';

// ─── Theme system ──────────────────────────────────────────────────────────────
// On WEB the themeable colors are emitted as CSS variables (e.g. `var(--c-bg)`),
// so toggling dark/light just updates the variables on :root and the whole app
// repaints instantly — no per-screen restyle needed. On native we fall back to
// the literal dark values (the app is dark-first there).
const IS_WEB = Platform.OS === 'web';

const VARS = {
  dark: {
    '--c-bg': '#0A0A0F',
    '--c-surface': '#13131A',
    '--c-card': '#1C1C28',
    '--c-border': '#2D2D3D',
    '--c-divider': '#1E1E2E',
    '--c-overlay': '#0D0D15',
    '--c-canvas': '#161622',
    '--c-text': '#F1F1F8',
    '--c-text2': '#AAAAAF',
    '--c-muted': '#6B6B7B',
  },
  light: {
    '--c-bg': '#F4F5FB',
    '--c-surface': '#FFFFFF',
    '--c-card': '#FFFFFF',
    '--c-border': '#E2E3F0',
    '--c-divider': '#EAEBF5',
    '--c-overlay': '#FFFFFF',
    '--c-canvas': '#E7E8F2',
    '--c-text': '#15151F',
    '--c-text2': '#4B5563',
    '--c-muted': '#8A8A99',
  },
} as const;

// Use a CSS var on web (themeable) or the literal dark value on native.
const v = (name: keyof typeof VARS.dark, fallback: string) =>
  IS_WEB ? `var(${name})` : fallback;

/** Switch the live web theme by updating the CSS variables on :root. */
export function applyTheme(isDark: boolean): void {
  if (!IS_WEB || typeof document === 'undefined') return;
  const vars = isDark ? VARS.dark : VARS.light;
  const root = document.documentElement;
  (Object.keys(vars) as (keyof typeof VARS.dark)[]).forEach((k) => {
    root.style.setProperty(k, vars[k]);
  });
  root.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
}

// Brand & Primary
export const Colors = {
  // Primary (green brand theme)
  primary: '#22C55E',
  primaryLight: '#4ADE80',
  primaryDark: '#15803D',
  secondary: '#059669',
  accent: '#EC4899',
  accentLight: '#F472B6',

  // Themeable surfaces (CSS vars on web; dark literals on native)
  dark: {
    background: v('--c-bg', '#0A0A0F'),
    surface: v('--c-surface', '#13131A'),
    card: v('--c-card', '#1C1C28'),
    border: v('--c-border', '#2D2D3D'),
    divider: v('--c-divider', '#1E1E2E'),
    overlay: v('--c-overlay', '#0D0D15'),
    canvasBackground: v('--c-canvas', '#161622'),
  },

  // Light Theme (static reference values)
  light: {
    background: '#F8F9FE',
    surface: '#FFFFFF',
    card: '#F0F1F8',
    border: '#E2E3F0',
    divider: '#EAEBF5',
  },

  // Text — themeable
  text: {
    primary: v('--c-text', '#F1F1F8'),
    secondary: v('--c-text2', '#AAAAAF'),
    muted: v('--c-muted', '#6B6B7B'),
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
    primary: ['#22C55E', '#059669'] as [string, string],
    accent: ['#EC4899', '#7C3AED'] as [string, string],
    gold: ['#F59E0B', '#D97706'] as [string, string],
    sunset: ['#FF6B6B', '#FFD93D'] as [string, string],
    purple: ['#7C3AED', '#EC4899'] as [string, string],
    dark: ['#1C1C28', '#0A0A0F'] as [string, string],
    premium: ['#D4AF37', '#F5D76E', '#D4AF37'] as [string, string, string],
  },
};

// Set the dark defaults immediately so var() resolves on the first paint.
applyTheme(true);

export type ColorScheme = 'dark' | 'light';
