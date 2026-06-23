import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Clamp content width for tablets / desktop web so it doesn't stretch too wide
const maxContentWidth = 680;
const contentWidth = Math.min(width, maxContentWidth);

export const Layout = {
  window:         { width, height },
  screen:         Dimensions.get('screen'),
  contentWidth,
  isSmallDevice:  width < 375,
  isTablet:       width >= 600,
  isDesktop:      width >= 1024,
  isIOS:          Platform.OS === 'ios',
  isAndroid:      Platform.OS === 'android',
  isWeb:          Platform.OS === 'web',

  // Spacing scale
  spacing: {
    xs:   4,
    sm:   8,
    md:   12,
    base: 16,
    lg:   20,
    xl:   24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },

  // Border radius
  radius: {
    xs:   4,
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    xxl:  28,
    '2xl': 24,
    full: 9999,
  },

  // Icon sizes
  icon: {
    xs:   14,
    sm:   16,
    md:   20,
    lg:   24,
    xl:   28,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },

  // Font sizes — slightly larger on tablets/desktop
  fontSize: {
    xs:   width >= 600 ? 11 : 10,
    sm:   width >= 600 ? 13 : 12,
    base: width >= 600 ? 15 : 14,
    md:   width >= 600 ? 17 : 16,
    lg:   width >= 600 ? 19 : 18,
    xl:   width >= 600 ? 21 : 20,
    '2xl': width >= 600 ? 23 : 22,
    '3xl': width >= 600 ? 26 : 24,
    '4xl': width >= 600 ? 30 : 28,
    '5xl': width >= 600 ? 34 : 32,
    '6xl': width >= 600 ? 44 : 40,
  },

  // Line heights
  lineHeight: {
    tight:   1.2,
    snug:    1.3,
    normal:  1.4,
    relaxed: 1.5,
    loose:   1.7,
  },

  // Shadow presets
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    primary: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Bottom tab bar height — taller on desktop web for better click targets
  tabBarHeight:         Platform.OS === 'web' && width >= 1024 ? 56 : 70,
  headerHeight:         56,
  editorToolbarHeight:  60,
  editorPanelHeight:    200,
} as const;
