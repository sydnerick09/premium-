import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ExportSettings, defaultExportSettings } from '../types';
import { localStorage } from '../services/storage/localStorage.service';

type ThemeMode = 'dark' | 'light' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  language: string;
  autoSave: boolean;
  showGrid: boolean;
  hapticFeedback: boolean;
  highQualityPreview: boolean;
  exportSettings: ExportSettings;
  notificationsEnabled: boolean;
  analyticsEnabled: boolean;

  // Actions
  initialize: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setAutoSave: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setHapticFeedback: (v: boolean) => void;
  setHighQualityPreview: (v: boolean) => void;
  updateExportSettings: (s: Partial<ExportSettings>) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setAnalyticsEnabled: (v: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  immer((set, get) => ({
    themeMode: 'dark',
    isDarkMode: true,
    language: 'en',
    autoSave: true,
    showGrid: false,
    hapticFeedback: true,
    highQualityPreview: true,
    exportSettings: { ...defaultExportSettings },
    notificationsEnabled: true,
    analyticsEnabled: true,

    initialize: () => {
      const isDark = localStorage.isDarkMode;
      const exportSettings = localStorage.getExportSettings();
      const autoSave = localStorage.isAutoSave;
      set((s) => {
        s.isDarkMode = isDark;
        s.themeMode = isDark ? 'dark' : 'light';
        s.exportSettings = exportSettings;
        s.autoSave = autoSave;
      });
    },

    setThemeMode: (mode) => {
      set((s) => {
        s.themeMode = mode;
        s.isDarkMode = mode === 'dark' || (mode === 'system');
      });
      localStorage.setDarkMode(get().isDarkMode);
    },

    toggleTheme: () => {
      const newMode: ThemeMode = get().isDarkMode ? 'light' : 'dark';
      get().setThemeMode(newMode);
    },

    setAutoSave: (v) => {
      set((s) => { s.autoSave = v; });
      localStorage.setAutoSave(v);
    },

    setShowGrid: (v) => set((s) => { s.showGrid = v; }),
    setHapticFeedback: (v) => set((s) => { s.hapticFeedback = v; }),
    setHighQualityPreview: (v) => set((s) => { s.highQualityPreview = v; }),

    updateExportSettings: (updates) => {
      set((s) => { Object.assign(s.exportSettings, updates); });
      localStorage.saveExportSettings(get().exportSettings);
    },

    setNotificationsEnabled: (v) => set((s) => { s.notificationsEnabled = v; }),
    setAnalyticsEnabled: (v) => set((s) => { s.analyticsEnabled = v; }),
    setLanguage: (lang) => set((s) => { s.language = lang; }),
  }))
);
