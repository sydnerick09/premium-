class AppConstants {
  AppConstants._();

  // App info
  static const String appName = 'Erick';
  static const String appVersion = '1.0.0';
  static const String packageName = 'com.erick.photoeditor';
  static const String playStoreUrl =
      'https://play.google.com/store/apps/details?id=com.erick.photoeditor';
  static const String supportEmail = 'support@erickphotoeditor.app';
  static const String privacyPolicyUrl =
      'https://erickphotoeditor.app/privacy-policy';
  static const String termsUrl = 'https://erickphotoeditor.app/terms';
  static const String websiteUrl = 'https://erickphotoeditor.app';

  // Storage keys
  static const String kThemeMode = 'theme_mode';
  static const String kOnboardingDone = 'onboarding_done';
  static const String kUserToken = 'user_token';
  static const String kUserId = 'user_id';
  static const String kPremiumStatus = 'premium_status';
  static const String kAutoSave = 'auto_save';
  static const String kExportQuality = 'export_quality';
  static const String kDefaultExportFormat = 'default_export_format';

  // Image limits
  static const int maxImageWidth = 4096;
  static const int maxImageHeight = 4096;
  static const int maxBatchSelection = 20;
  static const int maxLayersCount = 20;
  static const int maxUndoHistory = 50;
  static const double minZoom = 0.1;
  static const double maxZoom = 10.0;

  // Export quality presets
  static const int qualityLow = 60;
  static const int qualityMedium = 80;
  static const int qualityHigh = 95;
  static const int qualityMaximum = 100;

  // Animation durations
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animNormal = Duration(milliseconds: 300);
  static const Duration animSlow = Duration(milliseconds: 500);
  static const Duration splashDuration = Duration(seconds: 2);

  // Filter categories
  static const List<String> filterCategories = [
    'All',
    'Vintage',
    'Cinematic',
    'Portrait',
    'Landscape',
    'Black & White',
    'HDR',
    'Warm',
    'Cool',
    'Custom',
  ];

  // Adjustment ranges
  static const double adjustmentMin = -100.0;
  static const double adjustmentMax = 100.0;
  static const double sharpnessMin = 0.0;
  static const double sharpnessMax = 100.0;
  static const double blurMin = 0.0;
  static const double blurMax = 25.0;
  static const double vignetteMin = 0.0;
  static const double vignetteMax = 100.0;

  // Premium features
  static const String premiumProductId = 'erick_premium_monthly';
  static const String premiumYearlyProductId = 'erick_premium_yearly';
  static const String premiumLifetimeProductId = 'erick_premium_lifetime';

  // Hive box names
  static const String projectsBox = 'projects_box';
  static const String settingsBox = 'settings_box';
  static const String favoritesBox = 'favorites_box';
  static const String filtersBox = 'filters_box';
  static const String recentFilesBox = 'recent_files_box';

  // Firestore collections
  static const String usersCollection = 'users';
  static const String projectsCollection = 'projects';
  static const String filtersCollection = 'filters';

  // Cloud storage paths
  static const String userAvatarsPath = 'avatars';
  static const String projectsPath = 'projects';
  static const String exportsPath = 'exports';

  // Blend modes
  static const List<String> blendModes = [
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
    'Hue',
    'Saturation',
    'Color',
    'Luminosity',
  ];

  // Supported image formats
  static const List<String> supportedFormats = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'heic',
    'heif',
    'bmp',
    'tiff',
  ];

  // Export formats
  static const List<String> exportFormats = ['JPG', 'PNG', 'WEBP'];

  // Social platforms for sharing
  static const List<String> socialPlatforms = [
    'Instagram',
    'Facebook',
    'Twitter',
    'WhatsApp',
    'Snapchat',
    'TikTok',
    'Save to Gallery',
  ];
}
