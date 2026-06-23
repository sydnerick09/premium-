import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/local_storage_service.dart';

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  final isDark = LocalStorageService.instance.isDarkMode;
  return ThemeNotifier(isDark ? ThemeMode.dark : ThemeMode.light);
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier(super.initial);

  bool get isDark => state == ThemeMode.dark;

  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = newMode;
    await LocalStorageService.instance.setDarkMode(newMode == ThemeMode.dark);
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    await LocalStorageService.instance.setDarkMode(mode == ThemeMode.dark);
  }
}
