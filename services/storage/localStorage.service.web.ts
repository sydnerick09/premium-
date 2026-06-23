import { Project, ExportSettings, defaultExportSettings } from '../../types';

// Web stub using browser localStorage instead of MMKV
const s = typeof window !== 'undefined' ? window.localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} } as any;

const get = (key: string) => { try { const v = s.getItem(key); return v != null ? JSON.parse(v) : null; } catch { return null; } };
const put = (key: string, val: any) => { try { s.setItem(key, JSON.stringify(val)); } catch {} };
const del = (key: string) => { try { s.removeItem(key); } catch {} };

class LocalStorageWeb {
  // Theme
  get isDarkMode(): boolean { return get('isDarkMode') ?? true; }
  setDarkMode(v: boolean) { put('isDarkMode', v); }

  // Onboarding
  get isOnboardingDone(): boolean { return get('onboardingDone') ?? false; }
  setOnboardingDone() { put('onboardingDone', true); }

  // Premium
  get isPremium(): boolean { return get('isPremium') ?? false; }
  setPremium(v: boolean) { put('isPremium', v); }

  // User ID
  get userId(): string | null { return get('userId') ?? null; }
  setUserId(id: string) { put('userId', id); }
  clearUserId() { del('userId'); }

  // Export settings
  getExportSettings(): ExportSettings { return { ...defaultExportSettings, ...(get('exportSettings') ?? {}) }; }
  saveExportSettings(settings: ExportSettings) { put('exportSettings', settings); }

  // Projects
  getCachedProjects(): Project[] {
    const list: Project[] = get('projects') ?? [];
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  saveProject(p: Project) {
    const list = this.getCachedProjects();
    const idx = list.findIndex((x) => x.id === p.id);
    idx >= 0 ? (list[idx] = p) : list.unshift(p);
    put('projects', list);
  }
  deleteProject(id: string) { put('projects', this.getCachedProjects().filter((p) => p.id !== id)); }
  getProject(id: string): Project | null { return this.getCachedProjects().find((p) => p.id === id) ?? null; }

  // Favorites
  getFavoriteIds(): Set<string> { return new Set<string>(get('favorites') ?? []); }
  addFavorite(id: string) { const f = this.getFavoriteIds(); f.add(id); put('favorites', [...f]); }
  removeFavorite(id: string) { const f = this.getFavoriteIds(); f.delete(id); put('favorites', [...f]); }
  isFavorite(id: string): boolean { return this.getFavoriteIds().has(id); }

  // Recent files
  getRecentFiles(): string[] { return get('recentFiles') ?? []; }
  addRecentFile(uri: string) {
    const r = this.getRecentFiles().filter((x) => x !== uri);
    r.unshift(uri);
    put('recentFiles', r.slice(0, 20));
  }

  // Auto-save
  get isAutoSave(): boolean { return get('autoSave') ?? true; }
  setAutoSave(v: boolean) { put('autoSave', v); }

  // Clear
  clearUserData() {
    ['isPremium', 'projects', 'favorites', 'recentFiles', 'exportSettings', 'userId'].forEach(del);
  }
  clearAll() { try { s.clear(); } catch {} }
}

export const localStorage = new LocalStorageWeb();
