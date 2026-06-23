import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../models/project_model.dart';
import '../models/export_settings_model.dart';

class LocalStorageService {
  static LocalStorageService? _instance;
  static LocalStorageService get instance =>
      _instance ?? (_instance = LocalStorageService._());
  LocalStorageService._();

  late SharedPreferences _prefs;
  late Box _settingsBox;
  late Box _projectsBox;
  late Box _favoritesBox;
  late Box _recentFilesBox;

  Future<void> init() async {
    await Hive.initFlutter();
    _prefs = await SharedPreferences.getInstance();
    _settingsBox = await Hive.openBox(AppConstants.settingsBox);
    _projectsBox = await Hive.openBox(AppConstants.projectsBox);
    _favoritesBox = await Hive.openBox(AppConstants.favoritesBox);
    _recentFilesBox = await Hive.openBox(AppConstants.recentFilesBox);
  }

  // Theme
  bool get isDarkMode => _prefs.getBool(AppConstants.kThemeMode) ?? true;
  Future<void> setDarkMode(bool value) =>
      _prefs.setBool(AppConstants.kThemeMode, value);

  // Onboarding
  bool get isOnboardingDone => _prefs.getBool(AppConstants.kOnboardingDone) ?? false;
  Future<void> setOnboardingDone() =>
      _prefs.setBool(AppConstants.kOnboardingDone, true);

  // Premium
  bool get isPremium => _prefs.getBool(AppConstants.kPremiumStatus) ?? false;
  Future<void> setPremium(bool value) =>
      _prefs.setBool(AppConstants.kPremiumStatus, value);

  // User ID cache
  String? get cachedUserId => _prefs.getString(AppConstants.kUserId);
  Future<void> setCachedUserId(String id) =>
      _prefs.setString(AppConstants.kUserId, id);
  Future<void> clearUserId() => _prefs.remove(AppConstants.kUserId);

  // Export settings
  ExportSettingsModel getExportSettings() {
    final map = _settingsBox.get('export_settings');
    if (map == null) return const ExportSettingsModel();
    return ExportSettingsModel.fromMap(Map<String, dynamic>.from(map as Map));
  }

  Future<void> saveExportSettings(ExportSettingsModel settings) =>
      _settingsBox.put('export_settings', settings.toMap());

  // Projects (local cache)
  List<ProjectModel> getCachedProjects() {
    final data = _projectsBox.values.toList();
    return data
        .map((e) => ProjectModel.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList()
      ..sort((a, b) => (b.updatedAt ?? DateTime(0))
          .compareTo(a.updatedAt ?? DateTime(0)));
  }

  Future<void> saveProject(ProjectModel project) =>
      _projectsBox.put(project.id, project.toMap());

  Future<void> deleteProject(String id) => _projectsBox.delete(id);

  ProjectModel? getProject(String id) {
    final data = _projectsBox.get(id);
    if (data == null) return null;
    return ProjectModel.fromMap(Map<String, dynamic>.from(data as Map));
  }

  // Favorites
  Set<String> getFavoriteIds() =>
      Set<String>.from(_favoritesBox.values.map((e) => e.toString()));

  Future<void> addFavorite(String projectId) =>
      _favoritesBox.put(projectId, projectId);

  Future<void> removeFavorite(String projectId) =>
      _favoritesBox.delete(projectId);

  bool isFavorite(String projectId) =>
      _favoritesBox.containsKey(projectId);

  // Recent files
  List<String> getRecentFiles() =>
      _recentFilesBox.values.map((e) => e.toString()).toList();

  Future<void> addRecentFile(String filePath) async {
    final files = getRecentFiles();
    files.remove(filePath);
    files.insert(0, filePath);
    await _recentFilesBox.clear();
    for (final f in files.take(20)) {
      await _recentFilesBox.add(f);
    }
  }

  // Auto-save setting
  bool get isAutoSaveEnabled => _prefs.getBool(AppConstants.kAutoSave) ?? true;
  Future<void> setAutoSave(bool value) =>
      _prefs.setBool(AppConstants.kAutoSave, value);

  // Clear all data
  Future<void> clearAll() async {
    await _prefs.clear();
    await _settingsBox.clear();
    await _projectsBox.clear();
    await _favoritesBox.clear();
    await _recentFilesBox.clear();
  }

  // User-specific clear (keep settings)
  Future<void> clearUserData() async {
    await _projectsBox.clear();
    await _favoritesBox.clear();
    await _recentFilesBox.clear();
    await clearUserId();
  }

  Future<void> close() async {
    await _settingsBox.close();
    await _projectsBox.close();
    await _favoritesBox.close();
    await _recentFilesBox.close();
  }
}
