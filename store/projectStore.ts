import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { localStorage } from '../services/storage/localStorage.service';
import { firestoreService } from '../services/firebase/firestore.service';
import { imageProcessor } from '../services/image/imageProcessor.service';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => void;
  createProject: (params: {
    userId: string;
    imageUri: string;
    width: number;
    height: number;
    fileSize: number;
    title?: string;
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  getProject: (id: string) => Project | null;
  getFavorites: () => Project[];
  getRecent: (n?: number) => Project[];
  syncToCloud: (project: Project) => void;
  setError: (msg: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projects: [],
    isLoading: false,
    error: null,

    loadProjects: () => {
      const cached = localStorage.getCachedProjects();
      set((s) => { s.projects = cached; });
    },

    createProject: ({ userId, imageUri, width, height, fileSize, title }) => {
      const project: Project = {
        id: uuidv4(),
        userId,
        originalImageUri: imageUri,
        editedImageUri: null,
        thumbnailUri: null,
        title: title ?? `Project ${new Date().toLocaleDateString()}`,
        layers: [],
        adjustments: {
          brightness: 0, contrast: 0, saturation: 0, exposure: 0,
          highlights: 0, shadows: 0, temperature: 0, tint: 0,
          vibrance: 0, sharpness: 0, blur: 0, vignette: 0,
          grain: 0, fade: 0, hue: 0, clarity: 0, dehaze: 0,
        },
        appliedFilterId: null,
        appliedFilterName: null,
        status: 'draft',
        isFavorite: false,
        tags: [],
        width,
        height,
        fileSizeBytes: fileSize,
        cloudUrl: null,
        isSynced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exportedAt: null,
      };

      set((s) => { s.projects.unshift(project); });
      localStorage.saveProject(project);
      get().syncToCloud(project);

      // Generate thumbnail async
      imageProcessor
        .generateThumbnail(imageUri, 300)
        .then((thumbUri) => {
          get().updateProject(project.id, { thumbnailUri: thumbUri });
        })
        .catch(() => {});

      return project;
    },

    updateProject: (id, updates) => {
      set((s) => {
        const idx = s.projects.findIndex((p) => p.id === id);
        if (idx < 0) return;
        Object.assign(s.projects[idx], updates, {
          updatedAt: new Date().toISOString(),
        });
        localStorage.saveProject(s.projects[idx]);
      });
      const updated = get().getProject(id);
      if (updated) get().syncToCloud(updated);
    },

    deleteProject: async (id) => {
      set((s) => { s.projects = s.projects.filter((p) => p.id !== id); });
      localStorage.deleteProject(id);
      await firestoreService.deleteProject(id).catch(() => {});
    },

    toggleFavorite: (id) => {
      set((s) => {
        const project = s.projects.find((p) => p.id === id);
        if (!project) return;
        project.isFavorite = !project.isFavorite;
        localStorage.saveProject(project);
        if (project.isFavorite) localStorage.addFavorite(id);
        else localStorage.removeFavorite(id);
      });
    },

    getProject: (id) => get().projects.find((p) => p.id === id) ?? null,
    getFavorites: () => get().projects.filter((p) => p.isFavorite),
    getRecent: (n = 10) => get().projects.slice(0, n),

    syncToCloud: (project) => {
      firestoreService.saveProject(project).catch(() => {});
    },

    setError: (msg) => set((s) => { s.error = msg; }),
  }))
);
