import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { AdjustmentValues } from '../../types';

export type ManipulateAction = ImageManipulator.Action;
export type SaveFormat = ImageManipulator.SaveFormat;

class ImageProcessorService {
  // ─── Core Resize / Crop ────────────────────────────────────────────────────
  async resize(
    uri: string,
    options: { width?: number; height?: number }
  ): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: options }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async crop(
    uri: string,
    crop: { originX: number; originY: number; width: number; height: number }
  ): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async rotate(uri: string, degrees: number): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: degrees }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async flip(uri: string, axis: 'horizontal' | 'vertical'): Promise<string> {
    const action =
      axis === 'horizontal'
        ? { flip: ImageManipulator.FlipType.Horizontal }
        : { flip: ImageManipulator.FlipType.Vertical };
    const result = await ImageManipulator.manipulateAsync(uri, [action], {
      compress: 0.95,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  }

  // ─── Export ────────────────────────────────────────────────────────────────
  async exportAs(
    uri: string,
    format: 'jpg' | 'png' | 'webp',
    quality: number,
    maxDimension?: number
  ): Promise<string> {
    const actions: ManipulateAction[] = [];
    if (maxDimension) {
      actions.push({ resize: { width: maxDimension } });
    }

    const saveFormat =
      format === 'png'
        ? ImageManipulator.SaveFormat.PNG
        : ImageManipulator.SaveFormat.JPEG;

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: quality / 100,
      format: saveFormat,
    });
    return result.uri;
  }

  // ─── Thumbnail ────────────────────────────────────────────────────────────
  async generateThumbnail(uri: string, size = 200): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: size, height: size } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  // ─── Chained operations ───────────────────────────────────────────────────
  async applyOperations(
    uri: string,
    actions: ManipulateAction[],
    quality = 0.95
  ): Promise<string> {
    if (!actions.length) return uri;
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  }

  // ─── Utility ──────────────────────────────────────────────────────────────
  async getImageSize(
    uri: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      // expo-image-manipulator can read dimensions via an empty action list
      ImageManipulator.manipulateAsync(uri, [])
        .then((r) => resolve({ width: r.width, height: r.height }))
        .catch(reject);
    });
  }

  async getFileInfo(
    uri: string
  ): Promise<{ size: number; exists: boolean }> {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists) return { size: 0, exists: false };
    return { size: (info as any).size ?? 0, exists: true };
  }

  async copyToCache(uri: string, filename: string): Promise<string> {
    const dest = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  async deleteFile(uri: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  // ─── Bake edits (web parity) ─────────────────────────────────────────────
  // Native renders adjustments/filters as a live preview; baking into pixels is
  // handled on web via canvas. Here we pass through so the shared export call
  // works on every platform.
  async bake(uri: string, _opts: unknown): Promise<string> {
    return uri;
  }
  async straighten(uri: string, _opts?: { angle?: number; skewH?: number; skewV?: number }): Promise<string> {
    return uri;
  }

  // ─── Background replacement (web parity) ─────────────────────────────────
  // Real per-pixel background replacement runs on web via canvas
  // (imageProcessor.service.web.ts). On native we pass the original through so
  // the shared call site compiles; the screen falls back to a preview-only flow.
  async replaceBackground(uri: string, _bg: unknown, _options?: unknown): Promise<string> {
    return uri;
  }

  // AI cutout + composite run on web (canvas + WASM model). Native stubs keep
  // the shared call sites compiling.
  async removeBackgroundCutout(_uri: string): Promise<string | null> {
    return null;
  }
  async compositeBackground(cutoutUri: string, _bg: unknown): Promise<string> {
    return cutoutUri;
  }
  async blurBackground(uri: string, _options?: unknown): Promise<string> {
    return uri;
  }
  async applyEffect(uri: string, _effect: string, _intensity = 1): Promise<string> {
    return uri;
  }
  async squarePad(uri: string, _options?: unknown): Promise<string> {
    return uri;
  }
  async composeCollage(uris: string[], _layout: unknown, _options?: unknown): Promise<string> {
    return uris[0] ?? '';
  }
  async applyBeautyLocalized(uri: string, _beauty: unknown): Promise<string> {
    return uri;
  }
  async composeCutoutShape(
    uri: string,
    _opts?: { shape?: string; glyph?: string; size?: number; feather?: number },
  ): Promise<string> {
    return uri;
  }
  async applyMakeup(
    uri: string,
    _opts?: { lipColor?: string; blushColor?: string; intensity?: number },
  ): Promise<string> {
    return uri;
  }
  async applyWrinkleSmooth(uri: string, _opts?: { intensity?: number }): Promise<string> {
    return uri;
  }
  async applyDarkCircleFix(uri: string, _opts?: { intensity?: number }): Promise<string> {
    return uri;
  }
  async reshapeFace(uri: string, _opts?: { amount?: number }): Promise<string> {
    return uri;
  }
  async scanDocument(uri: string, _opts?: { mode?: 'bw' | 'gray' | 'color' }): Promise<string> {
    return uri;
  }
  async composePoster(opts: {
    template?: string;
    bg: { kind: 'color'; color: string } | { kind: 'gradient'; colors: [string, string] };
    photoUri?: string | null;
    title?: string;
    subtitle?: string;
    footer?: string;
    textColor?: string;
  }): Promise<string> {
    return opts.photoUri ?? '';
  }
  async composeLogo(opts: {
    template?: string;
    bg: { kind: 'color'; color: string } | { kind: 'gradient'; colors: [string, string]; stop?: number };
    symbol?: string;
    photoUri?: string | null;
    usePhoto?: boolean;
    brand?: string;
    tagline?: string;
    contact?: string;
    textColor?: string;
    font?: { brand: string; tag: string; weight: string };
    textShape?: 'straight' | 'arcUp' | 'arcDown' | 'angled';
  }): Promise<string> {
    return opts.photoUri ?? '';
  }

  // ─── Adjustment simulation (via color matrix) ────────────────────────────
  buildColorMatrixFromAdjustments(adj: Partial<AdjustmentValues>): number[] {
    // Build a 4×5 flat color matrix applying basic linear adjustments.
    // This is used with react-native-image-filter-kit / ColorMatrix.
    const br = (adj.brightness ?? 0) / 100; // -1 to 1
    const ct = (adj.contrast ?? 0) / 100 + 1.0; // 0 to 2
    const sat = (adj.saturation ?? 0) / 100 + 1.0;

    // Luminosity weights
    const lR = 0.2126, lG = 0.7152, lB = 0.0722;

    // Combine contrast + saturation into a single 4×5 matrix
    const sr = (1 - sat) * lR, sg = (1 - sat) * lG, sb = (1 - sat) * lB;

    const rr = ct * (sr + sat), rg = ct * sg, rb = ct * sb;
    const gr = ct * sr, gg = ct * (sg + sat), gb = ct * sb;
    const br2 = ct * sr, bg = ct * sg, bb = ct * (sb + sat);

    const offset = br * 255 + (1 - ct) * 128;

    return [
      rr, rg, rb, 0, offset,
      gr, gg, gb, 0, offset,
      br2, bg, bb, 0, offset,
      0, 0, 0, 1, 0,
    ];
  }
}

export const imageProcessor = new ImageProcessorService();
