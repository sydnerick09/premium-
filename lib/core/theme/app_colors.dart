import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary brand colors
  static const Color primary = Color(0xFF7C3AED);
  static const Color primaryLight = Color(0xFF9D5CFF);
  static const Color primaryDark = Color(0xFF5B21B6);
  static const Color secondary = Color(0xFF4F46E5);
  static const Color accent = Color(0xFFEC4899);
  static const Color accentLight = Color(0xFFF472B6);

  // Gradient sets
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFEC4899), Color(0xFF7C3AED)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient sunsetGradient = LinearGradient(
    colors: [Color(0xFFFF6B6B), Color(0xFFFFD93D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Dark theme colors
  static const Color darkBackground = Color(0xFF0A0A0F);
  static const Color darkSurface = Color(0xFF13131A);
  static const Color darkCard = Color(0xFF1C1C28);
  static const Color darkBorder = Color(0xFF2D2D3D);
  static const Color darkDivider = Color(0xFF1E1E2E);
  static const Color darkOverlay = Color(0xFF0D0D15);

  // Light theme colors
  static const Color lightBackground = Color(0xFFF8F9FE);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFF0F1F8);
  static const Color lightBorder = Color(0xFFE2E3F0);
  static const Color lightDivider = Color(0xFFEAEBF5);

  // Text colors
  static const Color textPrimary = Color(0xFFF1F1F8);
  static const Color textSecondary = Color(0xFFAAAAAF);
  static const Color textMuted = Color(0xFF6B6B7B);
  static const Color textDark = Color(0xFF1A1A2E);
  static const Color textDarkSecondary = Color(0xFF6B7280);

  // Status colors
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF34D399);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);

  // Tool colors
  static const Color toolActive = Color(0xFF7C3AED);
  static const Color toolInactive = Color(0xFF3D3D52);
  static const Color toolHover = Color(0xFF2D2D42);

  // Slider colors
  static const Color sliderActive = Color(0xFF7C3AED);
  static const Color sliderInactive = Color(0xFF2D2D3D);
  static const Color sliderThumb = Color(0xFFFFFFFF);

  // Premium colors
  static const Color premiumGold = Color(0xFFD4AF37);
  static const Color premiumGoldLight = Color(0xFFF5D76E);
  static const Color premiumBackground = Color(0xFF1A1030);

  // Filter preview overlay
  static const Color filterOverlay = Color(0x80000000);
  static const Color selectedBorder = Color(0xFF7C3AED);

  // Canvas colors
  static const Color canvasBackground = Color(0xFF161622);
  static const Color checkerboard1 = Color(0xFF2D2D3D);
  static const Color checkerboard2 = Color(0xFF1C1C28);

  // Transparent
  static const Color transparent = Colors.transparent;

  // Overlay
  static const Color modalOverlay = Color(0xCC000000);
  static const Color tooltipBackground = Color(0xFF2D2D42);
}
