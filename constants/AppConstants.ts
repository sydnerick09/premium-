export const AppConstants = {
  // App info
  appName: 'Erick',
  appVersion: '1.0.0',
  packageName: 'com.erick.photoeditor',
  supportEmail: 'support@erickphotoeditor.app',
  privacyPolicyUrl: 'https://erickphotoeditor.app/privacy-policy',
  termsUrl: 'https://erickphotoeditor.app/terms',
  websiteUrl: 'https://erickphotoeditor.app',
  playStoreUrl:
    'https://play.google.com/store/apps/details?id=com.erick.photoeditor',

  // Storage keys
  THEME_MODE: 'theme_mode',
  ONBOARDING_DONE: 'onboarding_done',
  USER_ID: 'user_id',
  PREMIUM_STATUS: 'premium_status',
  AUTO_SAVE: 'auto_save',
  EXPORT_QUALITY: 'export_quality',
  EXPORT_FORMAT: 'export_format',

  // Image limits
  maxImageDimension: 4096,
  maxBatchSelection: 20,
  maxLayers: 20,
  maxUndoHistory: 50,
  minZoom: 0.1,
  maxZoom: 10.0,

  // Export quality
  quality: { low: 60, medium: 80, high: 95, maximum: 100 },

  // Animation durations (ms)
  animFast: 150,
  animNormal: 300,
  animSlow: 500,
  splashDuration: 2000,

  // Premium product IDs (RevenueCat)
  premiumMonthlyId: 'erick_premium_monthly',
  premiumYearlyId: 'erick_premium_yearly',
  premiumLifetimeId: 'erick_premium_lifetime',

  // Firestore collections
  USERS_COLLECTION: 'users',
  PROJECTS_COLLECTION: 'projects',

  // Supported import formats
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp'],

  // Export formats
  exportFormats: ['JPG', 'PNG', 'WEBP'] as const,

  // Filter categories
  filterCategories: [
    'All',
    'Vintage',
    'Cinematic',
    'Portrait',
    'B&W',
    'Warm',
    'Cool',
    'HDR',
  ] as const,

  // Blend modes
  blendModes: [
    'Normal',
    'Multiply',
    'Screen',
    'Overlay',
    'Soft Light',
    'Hard Light',
    'Darken',
    'Lighten',
    'Color Dodge',
    'Color Burn',
    'Difference',
    'Exclusion',
  ] as const,

  // Storage limits
  storageLimitFree: 2 * 1024 * 1024 * 1024, // 2 GB
  storageLimitPremium: 50 * 1024 * 1024 * 1024, // 50 GB
} as const;
