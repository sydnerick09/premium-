import { MMKV } from 'react-native-mmkv';
import { Project, ExportSettings, defaultExportSettings } from '../../types';
import { AppConstants } from '../../constants/AppConstants';

const storage = new MMKV({ id: 'erick-storage' });

class LocalStorageService {
  // ─── Theme ─────────────────────────────────────────────────────────────────
  get isDarkMode(): boolean {
    return storage.getBoolean(AppConstants.THEME_MODE) ?? true;
  }
  setDarkMode(value: boolean) {
    storage.set(AppConstants.THEME_MODE, value);
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────
  get isOnboardingDone(): boolean {
    return storage.getBoolean(AppConstants.ONBOARDING_DONE) ?? false;
  }
  setOnboardingDone() {
    storage.set(AppConstants.ONBOARDING_DONE, true);
  }

  // ─── Premium ───────────────────────────────────────────────────────────────
  get isPremium(): boolean {
    return storage.getBoolean(AppConstants.PREMIUM_STATUS) ?? false;
  }
  setPremium(value: boolean) {
    storage.set(AppConstants.PREMIUM_STATUS, value);
  }

  // ─── User ID ───────────────────────────────────────────────────────────────
  get userId(): string | null {
    return storage.getString(AppConstants.USER_ID) ?? null;
  }
  setUserId(id: string) {
    storage.set(AppConstants.USER_ID, id);
  }
  clearUserId() {
    storage.delete(AppConstants.USER_ID);
  }

  // ─── Export Settings ───────────────────────────────────────────────────────
  getExportSettings(): ExportSettings {
    const raw = storage.getString('export_settings');
    if (!raw) return defaultExportSettings;
    try {
      return { ...defaultExportSettings, ...JSON.parse(raw) };
    } catch {
      return defaultExportSettings;
    }
  }
  saveExportSettings(settings: ExportSettings) {
    storage.set('export_settings', JSON.stringify(settings));
  }

  // ─── Projects (local cache) ────────────────────────────────────────────────
  getCachedProjects(): Project[] {
    const raw = storage.getString('cached_projects');
    if (!raw) return [];
    try {
      const list: Project[] = JSON.parse(raw);
      return list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch {
      return [];
    }
  }
  saveProject(project: Project) {
    const projects = this.getCachedProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) projects[idx] = project;
    else projects.unshift(project);
    storage.set('cached_projects', JSON.stringify(projects));
  }
  deleteProject(id: string) {
    const projects = this.getCachedProjects().filter((p) => p.id !== id);
    storage.set('cached_projects', JSON.stringify(projects));
  }
  getProject(id: string): Project | null {
    return this.getCachedProjects().find((p) => p.id === id) ?? null;
  }

  // ─── Favorites ─────────────────────────────────────────────────────────────
  getFavoriteIds(): Set<string> {
    const raw = storage.getString('favorites');
    if (!raw) return new Set();
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  }
  addFavorite(id: string) {
    const favs = this.getFavoriteIds();
    favs.add(id);
    storage.set('favorites', JSON.stringify([...favs]));
  }
  removeFavorite(id: string) {
    const favs = this.getFavoriteIds();
    favs.delete(id);
    storage.set('favorites', JSON.stringify([...favs]));
  }
  isFavorite(id: string): boolean {
    return this.getFavoriteIds().has(id);
  }

  // ─── Recent files ──────────────────────────────────────────────────────────
  getRecentFiles(): string[] {
    const raw = storage.getString('recent_files');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
  addRecentFile(uri: string) {
    const files = this.getRecentFiles().filter((f) => f !== uri);
    files.unshift(uri);
    storage.set('recent_files', JSON.stringify(files.slice(0, 20)));
  }

  // ─── Auto-save ─────────────────────────────────────────────────────────────
  get isAutoSave(): boolean {
    return storage.getBoolean(AppConstants.AUTO_SAVE) ?? true;
  }
  setAutoSave(value: boolean) {
    storage.set(AppConstants.AUTO_SAVE, value);
  }

  // ─── Clear ─────────────────────────────────────────────────────────────────
  clearUserData() {
    storage.delete('cached_projects');
    storage.delete('favorites');
    storage.delete('recent_files');
    this.clearUserId();
    this.setPremium(false);
  }

  clearAll() {
    storage.clearAll();
  }
}

export const localStorage = new LocalStorageService();
