// Web image processor — real pixel editing via HTML <canvas>.
// Mirrors the native expo-image-manipulator service interface, but runs in the
// browser so Crop / Rotate / Flip / Resize / Export all genuinely work on web.

import { AdjustmentValues, BeautyValues } from '../../types';
import { Filter } from '../../constants/FilterCatalog';
import { buildCssFilter } from '../../utils/imageFilters';

export interface ProcessingResult {
  uri: string;
  width: number;
  height: number;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // blob:/data: URLs (from the file picker) don't taint the canvas;
    // crossOrigin lets remote demo images export too when CORS allows.
    if (!uri.startsWith('blob:') && !uri.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = uri;
  });
}

function newCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function encode(canvas: HTMLCanvasElement, format = 'jpeg', quality = 0.95): string {
  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  return canvas.toDataURL(mime, quality);
}

class ImageProcessorWeb {
  async resize(uri: string, options: { width?: number; height?: number }): Promise<string> {
    const img = await loadImage(uri);
    let { width, height } = options;
    if (width && !height) height = (img.naturalHeight / img.naturalWidth) * width;
    if (height && !width) width = (img.naturalWidth / img.naturalHeight) * height;
    const { canvas, ctx } = newCanvas(width ?? img.naturalWidth, height ?? img.naturalHeight);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return encode(canvas);
  }

  async crop(uri: string, region: { originX: number; originY: number; width: number; height: number }): Promise<string> {
    const img = await loadImage(uri);
    const { canvas, ctx } = newCanvas(region.width, region.height);
    ctx.drawImage(
      img,
      region.originX, region.originY, region.width, region.height,
      0, 0, region.width, region.height,
    );
    return encode(canvas);
  }

  async rotate(uri: string, degrees: number): Promise<string> {
    const img = await loadImage(uri);
    const rad = (degrees * Math.PI) / 180;
    const swap = Math.abs(degrees % 180) === 90;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const { canvas, ctx } = newCanvas(swap ? h : w, swap ? w : h);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -w / 2, -h / 2);
    return encode(canvas);
  }

  async flip(uri: string, direction: 'horizontal' | 'vertical'): Promise<string> {
    const img = await loadImage(uri);
    const { canvas, ctx } = newCanvas(img.naturalWidth, img.naturalHeight);
    if (direction === 'horizontal') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    else { ctx.translate(0, canvas.height); ctx.scale(1, -1); }
    ctx.drawImage(img, 0, 0);
    return encode(canvas);
  }

  /**
   * Bake live adjustments + the active filter onto the pixels using the SAME
   * CSS filter string the live preview uses (Canvas2D `ctx.filter` accepts it),
   * so an exported/saved file matches exactly what's on screen.
   */
  async bake(
    uri: string,
    opts: { adjustments: AdjustmentValues; filter?: Filter | null; filterIntensity?: number; beauty?: BeautyValues | null },
  ): Promise<string> {
    const img = await loadImage(uri);
    const { canvas, ctx } = newCanvas(img.naturalWidth, img.naturalHeight);
    const css = buildCssFilter({
      adjustments: opts.adjustments,
      filter: opts.filter,
      filterIntensity: opts.filterIntensity,
      beauty: opts.beauty,
    });
    if (css !== 'none') (ctx as any).filter = css;
    ctx.drawImage(img, 0, 0);
    (ctx as any).filter = 'none';

    // Vignette (can't be expressed as a CSS filter) — radial darkening.
    const vig = opts.adjustments.vignette;
    if (vig > 0) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const outer = Math.hypot(cx, cy);
      const g = ctx.createRadialGradient(cx, cy, outer * (1 - vig / 130), cx, cy, outer);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, vig / 110)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return encode(canvas, 'jpeg', 0.96);
  }

  async exportAs(uri: string, format: string, quality: number, maxDim?: number): Promise<string> {
    const img = await loadImage(uri);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (maxDim && Math.max(w, h) > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w *= scale; h *= scale;
    }
    const { canvas, ctx } = newCanvas(w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return encode(canvas, format.replace('jpg', 'jpeg'), quality <= 1 ? quality : quality / 100);
  }

  async generateThumbnail(uri: string, size = 200): Promise<string> {
    const img = await loadImage(uri);
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    return this.resize(uri, { width: img.naturalWidth * scale, height: img.naturalHeight * scale });
  }

  async applyOperations(uri: string, ops: any[] = []): Promise<string> {
    let current = uri;
    for (const op of ops) {
      if (op.resize) current = await this.resize(current, op.resize);
      else if (op.crop) current = await this.crop(current, op.crop);
      else if (op.rotate != null) current = await this.rotate(current, op.rotate);
      else if (op.flip) current = await this.flip(current, op.flip);
    }
    return current;
  }

  async getImageSize(uri: string): Promise<{ width: number; height: number }> {
    try {
      const img = await loadImage(uri);
      return { width: img.naturalWidth, height: img.naturalHeight };
    } catch {
      return { width: 1080, height: 1920 };
    }
  }

  async getFileInfo(_uri: string) { return { size: 1024 * 500, exists: true }; }
  async copyToCache(uri: string): Promise<string> { return uri; }
  async deleteFile(_uri: string): Promise<void> {}
  buildColorMatrixFromAdjustments(_adj: any) { return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]; }
}

export const imageProcessor = new ImageProcessorWeb();
