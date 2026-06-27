import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  AdjustmentValues,
  BeautyValues,
  HistoryEntry,
  ExportSettings,
  defaultAdjustments,
  defaultBeautyValues,
  defaultExportSettings,
} from '../types';
import { AppConstants } from '../constants/AppConstants';

type EditorTool =
  | 'none'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'perspective'
  | 'text'
  | 'sticker'
  | 'drawing'
  | 'clone'
  | 'heal'
  | 'erase';

export interface TextOverlay {
  id: string;
  content: string;
  color: string;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  x: number; // 0..1 relative position
  y: number; // 0..1 relative position
  // Optional speech/thought bubble behind the text.
  bubble?: 'none' | 'speech' | 'thought' | 'pill' | 'box' | 'outline';
  bubbleColor?: string;
}

interface EditorState {
  // Source image
  originalUri: string | null;
  currentUri: string | null;
  projectId: string | null;

  // Text overlays drawn on top of the canvas
  textOverlays: TextOverlay[];

  // Adjustments
  adjustments: AdjustmentValues;

  // Filter
  activeFilterId: string | null;
  filterIntensity: number;

  // Beauty
  beautyValues: BeautyValues;

  // Tool
  activeTool: EditorTool;

  // Zoom / pan
  zoom: number;

  // Undo/Redo history
  history: HistoryEntry[];
  historyIndex: number;

  // Export settings
  exportSettings: ExportSettings;

  // AI
  isEnhancing: boolean;
  lastEnhancedUri: string | null;

  // Loading
  isProcessing: boolean;
  processingLabel: string;
  error: string | null;

  // Actions
  loadImage: (uri: string, projectId?: string) => void;
  setCurrentUri: (uri: string, historyLabel?: string) => void;
  addTextOverlay: (overlay: Omit<TextOverlay, 'id'>) => void;
  updateTextOverlayPosition: (id: string, x: number, y: number) => void;
  removeTextOverlay: (id: string) => void;
  clearTextOverlays: () => void;
  updateAdjustment: (key: keyof AdjustmentValues, value: number) => void;
  setAdjustments: (adj: Partial<AdjustmentValues>) => void;
  resetAdjustments: () => void;
  applyFilter: (filterId: string | null, intensity?: number) => void;
  setFilterIntensity: (v: number) => void;
  updateBeauty: (key: keyof BeautyValues, value: number | string | null) => void;
  resetBeauty: () => void;
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (z: number) => void;
  pushHistory: (label: string, uri: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  updateExportSettings: (s: Partial<ExportSettings>) => void;
  setEnhancing: (v: boolean) => void;
  setProcessing: (v: boolean, label?: string) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  originalUri: null,
  currentUri: null,
  projectId: null,
  textOverlays: [] as TextOverlay[],
  adjustments: { ...defaultAdjustments },
  activeFilterId: null,
  filterIntensity: 100,
  beautyValues: { ...defaultBeautyValues },
  activeTool: 'none' as EditorTool,
  zoom: 1,
  history: [] as HistoryEntry[],
  historyIndex: -1,
  exportSettings: { ...defaultExportSettings },
  isEnhancing: false,
  lastEnhancedUri: null,
  isProcessing: false,
  processingLabel: '',
  error: null,
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    ...initialState,

    loadImage: (uri, projectId) => {
      set((s) => {
        s.originalUri = uri;
        s.currentUri = uri;
        s.projectId = projectId ?? null;
        s.textOverlays = [];
        s.adjustments = { ...defaultAdjustments };
        s.activeFilterId = null;
        s.filterIntensity = 100;
        s.beautyValues = { ...defaultBeautyValues };
        s.activeTool = 'none';
        s.zoom = 1;
        s.history = [];
        s.historyIndex = -1;
        s.error = null;
      });
    },

    setCurrentUri: (uri, historyLabel) => {
      set((s) => {
        s.currentUri = uri;
      });
      if (historyLabel) get().pushHistory(historyLabel, uri);
    },

    addTextOverlay: (overlay) => {
      set((s) => {
        s.textOverlays.push({ ...overlay, id: Date.now().toString() });
      });
    },

    updateTextOverlayPosition: (id, x, y) => {
      set((s) => {
        const t = s.textOverlays.find((o) => o.id === id);
        if (t) { t.x = x; t.y = y; }
      });
    },

    removeTextOverlay: (id) => {
      set((s) => {
        s.textOverlays = s.textOverlays.filter((o) => o.id !== id);
      });
    },

    clearTextOverlays: () => set((s) => { s.textOverlays = []; }),

    updateAdjustment: (key, value) => {
      set((s) => { s.adjustments[key] = value as never; });
    },

    setAdjustments: (adj) => {
      set((s) => { Object.assign(s.adjustments, adj); });
    },

    resetAdjustments: () => {
      set((s) => { s.adjustments = { ...defaultAdjustments }; });
    },

    applyFilter: (filterId, intensity = 100) => {
      set((s) => {
        s.activeFilterId = filterId;
        s.filterIntensity = intensity;
      });
    },

    setFilterIntensity: (v) => set((s) => { s.filterIntensity = v; }),

    updateBeauty: (key, value) => {
      set((s) => { (s.beautyValues as any)[key] = value; });
    },

    resetBeauty: () => set((s) => { s.beautyValues = { ...defaultBeautyValues }; }),

    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),
    setZoom: (z) => set((s) => { s.zoom = Math.max(AppConstants.minZoom, Math.min(AppConstants.maxZoom, z)); }),

    pushHistory: (label, uri) => {
      set((s) => {
        // Truncate forward history
        s.history = s.history.slice(0, s.historyIndex + 1);
        if (s.history.length >= AppConstants.maxUndoHistory) {
          s.history.shift();
        }
        s.history.push({
          id: Date.now().toString(),
          timestamp: Date.now(),
          label,
          imageUri: uri,
          adjustments: { ...s.adjustments },
          filterId: s.activeFilterId,
        });
        s.historyIndex = s.history.length - 1;
      });
    },

    undo: () => {
      set((s) => {
        if (s.historyIndex <= 0) return;
        s.historyIndex -= 1;
        const entry = s.history[s.historyIndex];
        s.currentUri = entry.imageUri;
        s.adjustments = { ...entry.adjustments };
        s.activeFilterId = entry.filterId;
      });
    },

    redo: () => {
      set((s) => {
        if (s.historyIndex >= s.history.length - 1) return;
        s.historyIndex += 1;
        const entry = s.history[s.historyIndex];
        s.currentUri = entry.imageUri;
        s.adjustments = { ...entry.adjustments };
        s.activeFilterId = entry.filterId;
      });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    updateExportSettings: (s) => {
      set((state) => { Object.assign(state.exportSettings, s); });
    },

    setEnhancing: (v) => set((s) => { s.isEnhancing = v; }),
    setProcessing: (v, label = '') => set((s) => {
      s.isProcessing = v;
      s.processingLabel = label;
    }),
    setError: (msg) => set((s) => { s.error = msg; }),
    reset: () => set(initialState),
  }))
);
