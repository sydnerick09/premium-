import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Layer, LayerType, BlendMode, LayerTransform } from '../types';

interface LayersState {
  layers: Layer[];
  activeLayerId: string | null;

  // Actions
  addLayer: (type: LayerType, data?: Partial<Layer>) => Layer;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  setActiveLayer: (id: string | null) => void;
  reorderLayers: (from: number, to: number) => void;
  duplicateLayer: (id: string) => Layer | null;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  setBlendMode: (id: string, mode: BlendMode) => void;
  mergeVisibleLayers: () => void;
  clearLayers: () => void;
  getLayers: () => Layer[];
  getActiveLayer: () => Layer | null;
  setLayers: (layers: Layer[]) => void;
}

const defaultTransform: LayerTransform = {
  x: 0, y: 0, width: null, height: null,
  rotation: 0, scaleX: 1, scaleY: 1,
};

export const useLayersStore = create<LayersState>()(
  immer((set, get) => ({
    layers: [],
    activeLayerId: null,

    addLayer: (type, data = {}) => {
      const layer: Layer = {
        id: uuidv4(),
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
        opacity: 1,
        blendMode: 'normal',
        isVisible: true,
        isLocked: false,
        transform: { ...defaultTransform },
        order: get().layers.length,
        ...data,
      };
      set((s) => {
        s.layers.push(layer);
        s.activeLayerId = layer.id;
      });
      return layer;
    },

    removeLayer: (id) => {
      set((s) => {
        s.layers = s.layers.filter((l) => l.id !== id);
        if (s.activeLayerId === id) {
          s.activeLayerId = s.layers.length > 0 ? s.layers[s.layers.length - 1].id : null;
        }
      });
    },

    updateLayer: (id, updates) => {
      set((s) => {
        const idx = s.layers.findIndex((l) => l.id === id);
        if (idx >= 0) Object.assign(s.layers[idx], updates);
      });
    },

    setActiveLayer: (id) => set((s) => { s.activeLayerId = id; }),

    reorderLayers: (from, to) => {
      set((s) => {
        const layers = [...s.layers];
        const [moved] = layers.splice(from, 1);
        layers.splice(to, 0, moved);
        layers.forEach((l, i) => { l.order = i; });
        s.layers = layers;
      });
    },

    duplicateLayer: (id) => {
      const src = get().layers.find((l) => l.id === id);
      if (!src) return null;
      const copy: Layer = {
        ...src,
        id: uuidv4(),
        name: `${src.name} copy`,
        order: get().layers.length,
        transform: { ...src.transform },
      };
      set((s) => {
        s.layers.push(copy);
        s.activeLayerId = copy.id;
      });
      return copy;
    },

    toggleVisibility: (id) => {
      set((s) => {
        const l = s.layers.find((x) => x.id === id);
        if (l) l.isVisible = !l.isVisible;
      });
    },

    toggleLock: (id) => {
      set((s) => {
        const l = s.layers.find((x) => x.id === id);
        if (l) l.isLocked = !l.isLocked;
      });
    },

    setOpacity: (id, opacity) => {
      set((s) => {
        const l = s.layers.find((x) => x.id === id);
        if (l) l.opacity = Math.max(0, Math.min(1, opacity));
      });
    },

    setBlendMode: (id, mode) => {
      set((s) => {
        const l = s.layers.find((x) => x.id === id);
        if (l) l.blendMode = mode;
      });
    },

    mergeVisibleLayers: () => {
      // Placeholder — actual merge requires canvas composition
      // In production this triggers a render pass on the editor canvas
    },

    clearLayers: () => set((s) => { s.layers = []; s.activeLayerId = null; }),

    getLayers: () => [...get().layers].sort((a, b) => b.order - a.order),
    getActiveLayer: () => get().layers.find((l) => l.id === get().activeLayerId) ?? null,
    setLayers: (layers) => set((s) => { s.layers = layers; }),
  }))
);
