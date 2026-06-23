// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  username: string | null;
  bio: string | null;
  isPremium: boolean;
  premiumExpiry: Date | null;
  projectsCount: number;
  storageUsedBytes: number;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  provider: 'email' | 'google' | 'apple';
}

// ─── Project ─────────────────────────────────────────────────────────────────
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'exported';

export interface Project {
  id: string;
  userId: string;
  originalImageUri: string;
  editedImageUri: string | null;
  thumbnailUri: string | null;
  title: string;
  layers: Layer[];
  adjustments: AdjustmentValues;
  appliedFilterId: string | null;
  appliedFilterName: string | null;
  status: ProjectStatus;
  isFavorite: boolean;
  tags: string[];
  width: number;
  height: number;
  fileSizeBytes: number;
  cloudUrl: string | null;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  exportedAt: string | null;
}

// ─── Layer ────────────────────────────────────────────────────────────────────
export type LayerType = 'image' | 'text' | 'sticker' | 'drawing' | 'shape' | 'adjustment';
export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'softLight' | 'hardLight' | 'darken' | 'lighten'
  | 'colorDodge' | 'colorBurn' | 'difference' | 'exclusion';

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  imageUri?: string;
  text?: string;
  textStyle?: TextLayerStyle;
  stickerAsset?: string;
  drawingData?: DrawingData;
  opacity: number;
  blendMode: BlendMode;
  isVisible: boolean;
  isLocked: boolean;
  transform: LayerTransform;
  order: number;
  filterId?: string;
  filterOpacity?: number;
}

export interface LayerTransform {
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface TextLayerStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  italic?: boolean;
  underline?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
  shadowBlur?: number;
}

export interface DrawingData {
  paths: DrawingPath[];
  backgroundColor?: string;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
  tool: 'pen' | 'brush' | 'eraser' | 'marker' | 'chalk';
}

// ─── Adjustments ─────────────────────────────────────────────────────────────
export interface AdjustmentValues {
  brightness: number;     // -100 to 100
  contrast: number;       // -100 to 100
  saturation: number;     // -100 to 100
  exposure: number;       // -100 to 100
  highlights: number;     // -100 to 100
  shadows: number;        // -100 to 100
  temperature: number;    // -100 to 100
  tint: number;           // -100 to 100
  vibrance: number;       // -100 to 100
  sharpness: number;      // 0 to 100
  blur: number;           // 0 to 25
  vignette: number;       // 0 to 100
  grain: number;          // 0 to 100
  fade: number;           // 0 to 100
  hue: number;            // -180 to 180
  clarity: number;        // 0 to 100
  dehaze: number;         // 0 to 100
}

export const defaultAdjustments: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
  fade: 0,
  hue: 0,
  clarity: 0,
  dehaze: 0,
};

// ─── Beauty ──────────────────────────────────────────────────────────────────
export interface BeautyValues {
  skinSmoothing: number;      // 0 to 100
  teethWhitening: number;     // 0 to 100
  eyeEnhancement: number;     // 0 to 100
  faceSlim: number;           // 0 to 100
  noseSlim: number;           // 0 to 100
  eyeSize: number;            // -50 to 50
  blemishRemoval: number;     // 0 to 100
  makeupIntensity: number;    // 0 to 100
  lipColor: string | null;
  eyeShadowColor: string | null;
  blushColor: string | null;
}

export const defaultBeautyValues: BeautyValues = {
  skinSmoothing: 0,
  teethWhitening: 0,
  eyeEnhancement: 0,
  faceSlim: 0,
  noseSlim: 0,
  eyeSize: 0,
  blemishRemoval: 0,
  makeupIntensity: 0,
  lipColor: null,
  eyeShadowColor: null,
  blushColor: null,
};

// ─── Export ──────────────────────────────────────────────────────────────────
export type ExportFormat = 'jpg' | 'png' | 'webp';
export type ExportQuality = 'low' | 'medium' | 'high' | 'maximum';
export type ExportResolution = 'original' | 'hd' | 'fullhd' | '4k';

export interface ExportSettings {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: ExportResolution;
  customWidth: number | null;
  customHeight: number | null;
  maintainAspectRatio: boolean;
  addWatermark: boolean;
  watermarkText: string | null;
  saveToGallery: boolean;
  shareAfterExport: boolean;
}

export const defaultExportSettings: ExportSettings = {
  format: 'jpg',
  quality: 'high',
  resolution: 'original',
  customWidth: null,
  customHeight: null,
  maintainAspectRatio: true,
  addWatermark: false,
  watermarkText: null,
  saveToGallery: true,
  shareAfterExport: false,
};

// ─── Editor History ──────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  imageUri: string;
  adjustments: AdjustmentValues;
  filterId: string | null;
}

// ─── Notification ────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
