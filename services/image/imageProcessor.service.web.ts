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

// ─── AI background removal (loaded from a CDN at runtime) ───────────────────
// We dynamic-import @imgly/background-removal straight from a CDN. The
// `new Function('return import(u)')` trick stops Metro from trying to resolve
// the URL at build time — it's a genuine browser dynamic import at runtime.
let _rbgPromise: Promise<any> | null = null;
function loadRemoveBg(): Promise<any> {
  if (!_rbgPromise) {
    const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
    _rbgPromise = dynamicImport('https://esm.sh/@imgly/background-removal@1.5.5')
      .catch((e) => { _rbgPromise = null; throw e; });
  }
  return _rbgPromise;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// ─── Face landmark detection (MediaPipe Tasks Vision, loaded from CDN) ───────
// Lets beauty effects target ONLY the skin / eyes / teeth instead of the whole
// image. Loaded lazily; returns null (graceful fallback) if it can't load.
const MP_VER = '0.10.18';
let _faceLmPromise: Promise<any> | null = null;
function getFaceLandmarker(): Promise<any> {
  if (!_faceLmPromise) {
    _faceLmPromise = (async () => {
      const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
      const vision = await dynamicImport(`https://esm.sh/@mediapipe/tasks-vision@${MP_VER}`);
      const fileset = await vision.FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`,
      );
      return await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
    })().catch((e) => { _faceLmPromise = null; throw e; });
  }
  return _faceLmPromise;
}

// FaceMesh landmark index groups.
const LM = {
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  rightEye: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
  leftEye: [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
  mouthInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
};

export interface FaceRegions {
  faceOval: { x: number; y: number }[];
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  mouth: { x: number; y: number }[];
}

async function detectFaceRegions(imgEl: HTMLImageElement): Promise<FaceRegions | null> {
  try {
    const lm = await getFaceLandmarker();
    const res = lm.detect(imgEl);
    const pts = res?.faceLandmarks?.[0];
    if (!pts || !pts.length) return null;
    const pick = (idxs: number[]) => idxs.map((i: number) => ({ x: pts[i].x, y: pts[i].y }));
    return {
      faceOval: pick(LM.faceOval),
      leftEye: pick(LM.leftEye),
      rightEye: pick(LM.rightEye),
      mouth: pick(LM.mouthInner),
    };
  } catch {
    return null;
  }
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
   * Straighten / level the photo. `angle` rotates (−25..25°) and the result is
   * auto-zoomed to the largest inscribed rectangle so there are no empty corners.
   * `skewH` / `skewV` (−25..25) apply a horizontal / vertical correction shear.
   */
  async straighten(uri: string, opts: { angle?: number; skewH?: number; skewV?: number } = {}): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1800;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);

    const angle = ((opts.angle ?? 0) * Math.PI) / 180;
    const skewH = ((opts.skewH ?? 0) / 100) * 0.5;
    const skewV = ((opts.skewV ?? 0) / 100) * 0.5;

    // Largest inscribed rectangle (same aspect) after rotation → zoom factor.
    const sinA = Math.abs(Math.sin(angle)), cosA = Math.abs(Math.cos(angle));
    let wr = w, hr = h;
    if (angle !== 0) {
      const widthIsLonger = w >= h;
      const sideLong = widthIsLonger ? w : h, sideShort = widthIsLonger ? h : w;
      if (sideShort <= 2 * sinA * cosA * sideLong || Math.abs(sinA - cosA) < 1e-9) {
        const x = 0.5 * sideShort;
        if (widthIsLonger) { wr = x / sinA; hr = x / cosA; } else { wr = x / cosA; hr = x / sinA; }
      } else {
        const cos2a = cosA * cosA - sinA * sinA;
        wr = (w * cosA - h * sinA) / cos2a;
        hr = (h * cosA - w * sinA) / cos2a;
      }
    }
    let cover = Math.max(w / wr, h / hr);
    if (!isFinite(cover) || cover < 1) cover = 1;
    cover *= 1 + Math.abs(skewH) + Math.abs(skewV); // extra zoom to hide shear overscan

    ctx.imageSmoothingQuality = 'high';
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angle);
    ctx.transform(1, skewV, skewH, 1, 0, 0);
    ctx.scale(cover, cover);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return encode(canvas, 'jpeg', 0.95);
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
    // Preserve transparency for cut-out shapes (PNG sources stay PNG).
    const isPng = uri.startsWith('data:image/png') || /\.png(\?|$)/i.test(uri);
    return encode(canvas, isPng ? 'png' : 'jpeg', 0.96);
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

  /**
   * Replace ONLY the background of the photo — the area around the main
   * subject — leaving the subject itself intact.
   *
   * Strategy: a BORDER FLOOD-FILL. We start from the image edges and grow a
   * "background" region inward, only over pixels whose colour stays close to the
   * border colour. Because the fill must stay connected to the edges, the
   * centred subject (person / object / building) is preserved even when it
   * happens to share colours with the background — which is why this no longer
   * tints the whole photo. The new background is baked into the returned image.
   */
  async replaceBackground(
    uri: string,
    bg:
      | { kind: 'color'; color: string }
      | { kind: 'gradient'; colors: [string, string] }
      | { kind: 'image'; uri: string },
    options: { tolerance?: number } = {},
  ): Promise<string> {
    const img = await loadImage(uri);
    // Cap the working resolution so the flood-fill stays fast on big photos.
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const { canvas, ctx } = newCanvas(w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const data = frame.data;

    // 1. Reference background colour = average of the border pixels.
    let sr = 0, sg = 0, sb = 0, sc = 0;
    const accum = (x: number, y: number) => {
      const i = (y * w + x) * 4; sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; sc++;
    };
    for (let x = 0; x < w; x++) { accum(x, 0); accum(x, h - 1); }
    for (let y = 0; y < h; y++) { accum(0, y); accum(w - 1, y); }
    const bgR = sr / sc, bgG = sg / sc, bgB = sb / sc;

    // 2. Build the replacement background on its own canvas (cover-fit for images).
    const { ctx: bgCtx } = newCanvas(w, h);
    if (bg.kind === 'color') {
      bgCtx.fillStyle = bg.color;
      bgCtx.fillRect(0, 0, w, h);
    } else if (bg.kind === 'gradient') {
      const g = bgCtx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, bg.colors[0]);
      g.addColorStop(1, bg.colors[1]);
      bgCtx.fillStyle = g;
      bgCtx.fillRect(0, 0, w, h);
    } else {
      const bgImg = await loadImage(bg.uri);
      const s = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * s;
      const dh = bgImg.naturalHeight * s;
      bgCtx.imageSmoothingQuality = 'high';
      bgCtx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    const bgData = bgCtx.getImageData(0, 0, w, h).data;

    // 3. Flood-fill the background from the borders inward.
    const tol = options.tolerance ?? 78;
    const tol2 = tol * tol;
    const N = w * h;
    const isBg = new Uint8Array(N);          // 1 = background
    const stack = new Int32Array(N);
    let sp = 0;
    const eligible = (idx: number) => {
      const p = idx * 4;
      const dr = data[p] - bgR, dg = data[p + 1] - bgG, db = data[p + 2] - bgB;
      return dr * dr + dg * dg + db * db <= tol2;
    };
    const seed = (idx: number) => { if (!isBg[idx] && eligible(idx)) { isBg[idx] = 1; stack[sp++] = idx; } };
    for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + (w - 1)); }
    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % w, y = (idx / w) | 0;
      if (x > 0)     { const n = idx - 1; if (!isBg[n] && eligible(n)) { isBg[n] = 1; stack[sp++] = n; } }
      if (x < w - 1) { const n = idx + 1; if (!isBg[n] && eligible(n)) { isBg[n] = 1; stack[sp++] = n; } }
      if (y > 0)     { const n = idx - w; if (!isBg[n] && eligible(n)) { isBg[n] = 1; stack[sp++] = n; } }
      if (y < h - 1) { const n = idx + w; if (!isBg[n] && eligible(n)) { isBg[n] = 1; stack[sp++] = n; } }
    }

    // 4. Composite with a soft 3×3 feather on the mask so edges aren't jagged.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        let sum = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= w) continue;
            sum += isBg[yy * w + xx]; cnt++;
          }
        }
        const alpha = sum / cnt;          // 1 = background, 0 = subject
        if (alpha <= 0) continue;
        const p = idx * 4;
        data[p]     = data[p]     * (1 - alpha) + bgData[p]     * alpha;
        data[p + 1] = data[p + 1] * (1 - alpha) + bgData[p + 1] * alpha;
        data[p + 2] = data[p + 2] * (1 - alpha) + bgData[p + 2] * alpha;
      }
    }
    ctx.putImageData(frame, 0, 0);
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Cut the subject out of the photo using a real AI segmentation model
   * (person / animal / object) and return a transparent PNG of just the subject.
   * Returns null if the model can't be loaded (offline / blocked) so callers can
   * fall back to the flood-fill in replaceBackground().
   */
  async removeBackgroundCutout(uri: string): Promise<string | null> {
    try {
      const mod = await loadRemoveBg();
      const removeBackground = mod.removeBackground ?? mod.default ?? mod;
      const blob: Blob = await removeBackground(uri);
      return await blobToDataURL(blob); // PNG with alpha (subject on transparent)
    } catch (e) {
      console.warn('[bg-removal] model unavailable, falling back to flood-fill', e);
      return null;
    }
  }

  /**
   * Composite a transparent subject cutout over a fresh background. Because the
   * subject is a separate layer, swapping the background colour just redraws —
   * it never stacks the previous colour underneath.
   */
  async compositeBackground(
    cutoutUri: string,
    bg:
      | { kind: 'color'; color: string }
      | { kind: 'gradient'; colors: [string, string] }
      | { kind: 'image'; uri: string },
  ): Promise<string> {
    const fg = await loadImage(cutoutUri);
    const w = fg.naturalWidth, h = fg.naturalHeight;
    const { canvas, ctx } = newCanvas(w, h);
    if (bg.kind === 'color') {
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, w, h);
    } else if (bg.kind === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, bg.colors[0]);
      g.addColorStop(1, bg.colors[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else {
      const bgImg = await loadImage(bg.uri);
      const s = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * s, dh = bgImg.naturalHeight * s;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    ctx.drawImage(fg, 0, 0, w, h); // subject on top
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Blur styles:
   *  • circle / radial / linear — tilt-shift: a region (and, when available, the
   *    AI-cutout subject) stays sharp while the rest is blurred.
   *  • motion — directional streak blur across the whole image.
   *  • zoom   — radial zoom-burst blur from the centre.
   */
  async blurBackground(
    uri: string,
    options: { strength?: number; type?: string; count?: number; opacity?: number } = {},
  ): Promise<string> {
    const strength = options.strength ?? 12;
    const type = options.type ?? 'circle';
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);

    // ── Whole-image creative blurs ───────────────────────────────────────────
    if (type === 'motion') {
      // `count` = number of streak copies; `opacity` (0..100) = how strongly the
      // motion blur covers the sharp original.
      const span = strength * 1.6;
      const n = Math.max(2, Math.round(options.count ?? Math.max(5, strength)));
      const opacity = Math.max(0, Math.min(1, (options.opacity ?? 100) / 100));
      ctx.drawImage(img, 0, 0, w, h); // sharp base
      const t = newCanvas(w, h);
      for (let i = 0; i < n; i++) {
        const off = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1..1
        t.ctx.globalAlpha = 1 / n;
        t.ctx.drawImage(img, off * span, 0, w, h);
      }
      t.ctx.globalAlpha = 1;
      ctx.globalAlpha = opacity;
      ctx.drawImage(t.canvas, 0, 0);
      ctx.globalAlpha = 1;
      return encode(canvas, 'jpeg', 0.95);
    }
    if (type === 'zoom') {
      const n = Math.max(6, Math.round(strength));
      for (let i = 0; i < n; i++) {
        const s = 1 + (i / n) * (strength / 80);
        const dw = w * s, dh = h * s;
        ctx.globalAlpha = 1 / n;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }
      ctx.globalAlpha = 1;
      return encode(canvas, 'jpeg', 0.95);
    }

    // ── Tilt-shift region blurs (circle / radial / linear) ────────────────────
    // Base: fully blurred image.
    (ctx as any).filter = `blur(${strength}px)`;
    ctx.drawImage(img, 0, 0, w, h);
    (ctx as any).filter = 'none';

    // Sharp region masked by a gradient (alpha = how sharp).
    const sharp = newCanvas(w, h);
    sharp.ctx.drawImage(img, 0, 0, w, h);
    const cx = w / 2, cy = h / 2, minD = Math.min(w, h);
    let grad: CanvasGradient;
    if (type === 'linear') {
      grad = sharp.ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.34, 'rgba(255,255,255,0)');
      grad.addColorStop(0.46, 'rgba(255,255,255,1)');
      grad.addColorStop(0.54, 'rgba(255,255,255,1)');
      grad.addColorStop(0.66, 'rgba(255,255,255,0)');
      grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    } else if (type === 'radial') {
      grad = sharp.ctx.createRadialGradient(cx, cy, minD * 0.12, cx, cy, minD * 0.55);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    } else { // circle (tighter, sharper falloff)
      grad = sharp.ctx.createRadialGradient(cx, cy, minD * 0.3, cx, cy, minD * 0.44);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    }
    sharp.ctx.globalCompositeOperation = 'destination-in';
    sharp.ctx.fillStyle = grad;
    sharp.ctx.fillRect(0, 0, w, h);
    sharp.ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sharp.canvas, 0, 0);

    // If the AI cutout is available, keep the whole subject crisp on top.
    const cutout = await this.removeBackgroundCutout(uri);
    if (cutout) {
      const fg = await loadImage(cutout);
      ctx.drawImage(fg, 0, 0, w, h);
    }
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * One-tap special effect baked into the pixels. `intensity` (0..1) blends the
   * effect with the original so the user can dial it down with a slider.
   */
  async applyEffect(uri: string, effect: string, intensity = 1): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 2000;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);

    // Always draw the untouched image first; the effect is layered over it.
    ctx.drawImage(img, 0, 0, w, h);
    const amt = Math.max(0, Math.min(1, intensity));
    if (amt <= 0) return encode(canvas, 'jpeg', 0.95);

    // Render the full-strength effect onto a temp canvas.
    const t = newCanvas(w, h);
    const tctx = t.ctx;
    if (effect === 'pixelate') {
      const px = Math.max(6, Math.round(Math.min(w, h) / 70));
      const sw = Math.max(1, Math.round(w / px));
      const sh = Math.max(1, Math.round(h / px));
      const tmp = newCanvas(sw, sh);
      tmp.ctx.drawImage(img, 0, 0, sw, sh);
      (tctx as any).imageSmoothingEnabled = false;
      tctx.drawImage(tmp.canvas, 0, 0, sw, sh, 0, 0, w, h);
    } else if (effect === 'duotone') {
      (tctx as any).filter = 'grayscale(1) contrast(1.15)';
      tctx.drawImage(img, 0, 0, w, h);
      (tctx as any).filter = 'none';
      tctx.globalCompositeOperation = 'multiply';
      tctx.fillStyle = '#5b6cff';
      tctx.fillRect(0, 0, w, h);
      tctx.globalCompositeOperation = 'lighten';
      tctx.fillStyle = '#241047';
      tctx.fillRect(0, 0, w, h);
      tctx.globalCompositeOperation = 'source-over';
    } else if (effect === 'mirror') {
      // Reflect the left half onto the right for a symmetrical look.
      tctx.drawImage(img, 0, 0, w, h);
      tctx.save();
      tctx.translate(w, 0);
      tctx.scale(-1, 1);
      tctx.drawImage(img, 0, 0, w / 2, h, 0, 0, w / 2, h);
      tctx.restore();
    } else if (effect === 'sketch') {
      // Pencil sketch: grayscale base, color-dodged with a blurred inverted copy.
      (tctx as any).filter = 'grayscale(1)';
      tctx.drawImage(img, 0, 0, w, h);
      (tctx as any).filter = 'none';
      const d = newCanvas(w, h);
      (d.ctx as any).filter = `grayscale(1) invert(1) blur(${Math.max(3, Math.round(Math.min(w, h) / 130))}px)`;
      d.ctx.drawImage(img, 0, 0, w, h);
      (d.ctx as any).filter = 'none';
      tctx.globalCompositeOperation = 'color-dodge';
      tctx.drawImage(d.canvas, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
    } else if (effect === 'cartoon') {
      // Posterized colors → flat, comic-like shading.
      (tctx as any).filter = 'saturate(1.5) contrast(1.18)';
      tctx.drawImage(img, 0, 0, w, h);
      (tctx as any).filter = 'none';
      const id = tctx.getImageData(0, 0, w, h);
      const d = id.data;
      const levels = 5, step = 255 / (levels - 1);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / step) * step;
        d[i + 1] = Math.round(d[i + 1] / step) * step;
        d[i + 2] = Math.round(d[i + 2] / step) * step;
      }
      tctx.putImageData(id, 0, 0);
    } else if (effect === 'splash') {
      // Color splash: keep vivid pixels, desaturate the muted ones.
      tctx.drawImage(img, 0, 0, w, h);
      const id = tctx.getImageData(0, 0, w, h);
      const d = id.data;
      const thresh = 42;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (sat < thresh) {
          const gray = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
          d[i] = d[i + 1] = d[i + 2] = gray;
        }
      }
      tctx.putImageData(id, 0, 0);
    } else if (effect === 'drip') {
      // Paint-drip: stretch sampled top-edge colors downward in streaks.
      tctx.drawImage(img, 0, 0, w, h);
      const streaks = Math.round(w / 14);
      for (let i = 0; i < streaks; i++) {
        const x = Math.floor((i + 0.5) * (w / streaks) + (Math.sin(i * 12.9) * 6));
        const cw = 2 + ((i * 7) % 5);
        const len = h * (0.12 + ((Math.sin(i * 3.1) * 0.5 + 0.5) * 0.45));
        tctx.drawImage(img, x, 0, cw, 1, x, 0, cw, len);
      }
    } else {
      const filters: Record<string, string> = {
        negative: 'invert(1)',
        bw: 'grayscale(1) contrast(1.12)',
        neon: 'saturate(2.3) contrast(1.5) brightness(1.08) hue-rotate(10deg)',
        vhs: 'sepia(0.35) saturate(1.7) contrast(1.2)',
        warm: 'sepia(0.45) saturate(1.35)',
        cool: 'hue-rotate(180deg) saturate(1.25) brightness(1.02)',
        sepia: 'sepia(0.8) contrast(1.05) brightness(1.02)',
        lightfix: 'brightness(1.12) contrast(1.18) saturate(1.15)',
      };
      (tctx as any).filter = filters[effect] ?? 'none';
      tctx.drawImage(img, 0, 0, w, h);
      (tctx as any).filter = 'none';
    }

    // Blend the effect over the original at the chosen intensity.
    ctx.globalAlpha = amt;
    ctx.drawImage(t.canvas, 0, 0);
    ctx.globalAlpha = 1;
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Fit the whole photo into a square (no crop) with a blurred or solid border. */
  async squarePad(uri: string, options: { border?: string } = {}): Promise<string> {
    const border = options.border ?? 'blur';
    const img = await loadImage(uri);
    const MAXD = 2000;
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, MAXD / long);
    const side = Math.max(1, Math.round(long * scale));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(side, side);

    if (border === 'blur') {
      const s = Math.max(side / w, side / h);
      const dw = w * s, dh = h * s;
      (ctx as any).filter = `blur(${Math.max(8, Math.round(side * 0.03))}px)`;
      ctx.drawImage(img, (side - dw) / 2, (side - dh) / 2, dw, dh);
      (ctx as any).filter = 'none';
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, side, side);
    } else {
      ctx.fillStyle = border === 'white' ? '#FFFFFF' : border === 'black' ? '#000000' : border;
      ctx.fillRect(0, 0, side, side);
    }
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h); // sharp, centered
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Compose 2-8 photos into a square collage. */
  async composeCollage(
    uris: string[],
    layout: string,
    options: { gap?: number; bg?: string; bgImage?: string | null; radius?: number } = {},
  ): Promise<string> {
    const SIZE = 1080;
    const gap = options.gap ?? 14;
    const bg = options.bg ?? '#FFFFFF';
    const radius = options.radius ?? 14;

    const layouts: Record<string, { x: number; y: number; w: number; h: number }[]> = {
      '2x1': [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }],
      '1x2': [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }],
      '2x2': [
        { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ],
      '3': [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ],
      '3v': [
        { x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
      ],
      '3h': [
        { x: 0, y: 0, w: 1, h: 1 / 3 }, { x: 0, y: 1 / 3, w: 1, h: 1 / 3 }, { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
      ],
      bigtop: [
        { x: 0, y: 0, w: 1, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ],
      bigleft: [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 1 / 3 }, { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 }, { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
      ],
      '4v': [
        { x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 },
        { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 },
      ],
      '5strip': [
        { x: 0, y: 0, w: 1, h: 0.5 },
        { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
      ],
      '6grid': [
        { x: 0, y: 0, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
        { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      ],
      '8grid': [
        { x: 0, y: 0, w: 0.25, h: 0.5 }, { x: 0.25, y: 0, w: 0.25, h: 0.5 }, { x: 0.5, y: 0, w: 0.25, h: 0.5 }, { x: 0.75, y: 0, w: 0.25, h: 0.5 },
        { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
      ],
    };
    const cells = layouts[layout] ?? layouts['2x2'];
    const { canvas, ctx } = newCanvas(SIZE, SIZE);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Optional image background — drawn cover-fit behind the cells.
    if (options.bgImage) {
      try {
        const bgImg = await loadImage(options.bgImage);
        const s = Math.max(SIZE / bgImg.naturalWidth, SIZE / bgImg.naturalHeight);
        const dw = bgImg.naturalWidth * s, dh = bgImg.naturalHeight * s;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bgImg, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
      } catch {}
    }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };

    if (!uris.length) return encode(canvas, 'jpeg', 0.95);
    // Fill every cell — if there are fewer photos than cells, cycle through them.
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const x = c.x * SIZE + gap / 2;
      const y = c.y * SIZE + gap / 2;
      const cw = c.w * SIZE - gap;
      const ch = c.h * SIZE - gap;
      const img = await loadImage(uris[i % uris.length]);
      ctx.save();
      roundRect(x, y, cw, ch, radius);
      ctx.clip();
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x + (cw - dw) / 2, y + (ch - dh) / 2, dw, dh);
      ctx.restore();
    }
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Apply beauty effects to ONLY the relevant facial regions using detected face
   * landmarks: skin smoothing on the face skin, eye enhancement on the eyes,
   * teeth whitening on the mouth. Falls back to a mild whole-image smooth if no
   * face is detected (or the model can't load).
   */
  async applyBeautyLocalized(
    uri: string,
    beauty: { skinSmoothing?: number; teethWhitening?: number; eyeEnhancement?: number },
  ): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const skin = Math.max(0, Math.min(1, (beauty.skinSmoothing ?? 0) / 100));
    const teeth = Math.max(0, Math.min(1, (beauty.teethWhitening ?? 0) / 100));
    const eye = Math.max(0, Math.min(1, (beauty.eyeEnhancement ?? 0) / 100));
    if (skin === 0 && teeth === 0 && eye === 0) return encode(canvas, 'jpeg', 0.95);

    const regions = await detectFaceRegions(img);

    const clipPoly = (pts: { x: number; y: number }[]) => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = p.x * w, y = p.y * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };
    const drawFiltered = (pts: { x: number; y: number }[], filter: string) => {
      ctx.save();
      clipPoly(pts);
      ctx.clip();
      (ctx as any).filter = filter;
      ctx.drawImage(img, 0, 0, w, h);
      (ctx as any).filter = 'none';
      ctx.restore();
    };

    if (regions) {
      // 1. Skin smoothing over the whole face oval (eyes/teeth get restored below).
      if (skin > 0) {
        drawFiltered(regions.faceOval, `blur(${(skin * 4).toFixed(1)}px) brightness(${(1 + skin * 0.05).toFixed(3)})`);
      }
      // 2. Eye enhancement — sharpen/brighten the eyes (drawn from the sharp original).
      if (eye > 0) {
        const f = `contrast(${(1 + eye * 0.45).toFixed(3)}) brightness(${(1 + eye * 0.15).toFixed(3)}) saturate(${(1 + eye * 0.2).toFixed(3)})`;
        drawFiltered(regions.rightEye, f);
        drawFiltered(regions.leftEye, f);
      }
      // 3. Teeth whitening — brighten + de-yellow inside the mouth.
      if (teeth > 0) {
        drawFiltered(regions.mouth, `brightness(${(1 + teeth * 0.2).toFixed(3)}) saturate(${(1 - teeth * 0.55).toFixed(3)})`);
      }
    } else if (skin > 0) {
      // No face detected → gentle whole-image softening so the slider still does something.
      (ctx as any).filter = `blur(${(skin * 1.4).toFixed(1)}px) brightness(${(1 + skin * 0.05).toFixed(3)})`;
      ctx.drawImage(img, 0, 0, w, h);
      (ctx as any).filter = 'none';
    }
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Natural makeup: tint the lips (from the detected mouth) and add soft blush on
   * the cheeks. Face-detected; if no face is found it returns the original.
   */
  async applyMakeup(
    uri: string,
    opts: { lipColor?: string; blushColor?: string; intensity?: number } = {},
  ): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const intensity = Math.max(0, Math.min(1, opts.intensity ?? 0.6));
    const lip = opts.lipColor ?? '#C2185B';
    const blush = opts.blushColor ?? '#FF6B81';
    const regions = await detectFaceRegions(img);
    if (!regions) return encode(canvas, 'jpeg', 0.95);

    // Lips — multiply a warm tint clipped to the mouth.
    ctx.save();
    ctx.beginPath();
    regions.mouth.forEach((p, i) => {
      const x = p.x * w, y = p.y * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = intensity * 0.85;
    ctx.fillStyle = lip;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Blush — soft radial dabs on each cheek, positioned from eye + mouth points.
    const centroid = (pts: { x: number; y: number }[]) => pts.reduce(
      (a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
    const le = centroid(regions.leftEye), re = centroid(regions.rightEye), mo = centroid(regions.mouth);
    const cheekR = Math.min(w, h) * 0.09;
    const dab = (ex: number, ey: number) => {
      const cxp = ((ex + mo.x) / 2) * w;
      const cyp = ((ey + mo.y) / 2) * h;
      const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, cheekR);
      g.addColorStop(0, blush);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = intensity * 0.7;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cxp, cyp, cheekR, 0, Math.PI * 2);
      ctx.fill();
    };
    dab(le.x, le.y);
    dab(re.x, re.y);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Soften wrinkles/fine lines across the face (eyes & mouth stay sharp). */
  async applyWrinkleSmooth(uri: string, opts: { intensity?: number } = {}): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const amt = Math.max(0, Math.min(1, opts.intensity ?? 0.6));
    const regions = await detectFaceRegions(img);
    const clip = (pts: { x: number; y: number }[]) => {
      ctx.beginPath();
      pts.forEach((p, i) => { const x = p.x * w, y = p.y * h; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.closePath();
    };
    if (regions) {
      // Surface-smooth the whole face, then restore the eyes & mouth crisp.
      ctx.save(); clip(regions.faceOval); ctx.clip();
      (ctx as any).filter = `blur(${(amt * 3.2).toFixed(1)}px) brightness(${(1 + amt * 0.04).toFixed(3)}) contrast(${(1 - amt * 0.05).toFixed(3)})`;
      ctx.drawImage(img, 0, 0, w, h);
      (ctx as any).filter = 'none'; ctx.restore();
      for (const r of [regions.rightEye, regions.leftEye, regions.mouth]) {
        ctx.save(); clip(r); ctx.clip(); ctx.drawImage(img, 0, 0, w, h); ctx.restore();
      }
    } else {
      (ctx as any).filter = `blur(${(amt * 1.2).toFixed(1)}px)`;
      ctx.drawImage(img, 0, 0, w, h);
      (ctx as any).filter = 'none';
    }
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Lighten under-eye dark circles (brighten + de-shadow below each eye). */
  async applyDarkCircleFix(uri: string, opts: { intensity?: number } = {}): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const amt = Math.max(0, Math.min(1, opts.intensity ?? 0.6));
    const regions = await detectFaceRegions(img);
    if (!regions) return encode(canvas, 'jpeg', 0.95);

    const underEye = (eye: { x: number; y: number }[]) => {
      const xs = eye.map((p) => p.x), ys = eye.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...ys), minY = Math.min(...ys);
      const cx = ((minX + maxX) / 2) * w;
      const eh = (maxY - minY) * h;
      const cy = maxY * h + eh * 0.55;
      const rx = ((maxX - minX) * w) / 2 * 1.05;
      const ry = eh * 1.1;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();
      (ctx as any).filter = `brightness(${(1 + amt * 0.22).toFixed(3)}) saturate(${(1 - amt * 0.25).toFixed(3)})`;
      ctx.drawImage(img, 0, 0, w, h);
      (ctx as any).filter = 'none';
      ctx.restore();
    };
    underEye(regions.leftEye);
    underEye(regions.rightEye);
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Subtly slim the face (horizontal pinch within the detected face band). */
  async reshapeFace(uri: string, opts: { amount?: number } = {}): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    const base = newCanvas(w, h);
    base.ctx.drawImage(img, 0, 0, w, h);
    ctx.drawImage(base.canvas, 0, 0);

    const amt = Math.max(0, Math.min(1, opts.amount ?? 0.6));
    const regions = await detectFaceRegions(img);
    if (!regions) return encode(canvas, 'jpeg', 0.95);
    const xs = regions.faceOval.map((p) => p.x), ys = regions.faceOval.map((p) => p.y);
    const fx0 = Math.min(...xs) * w, fx1 = Math.max(...xs) * w;
    const fy0 = Math.min(...ys) * h, fy1 = Math.max(...ys) * h;
    const fw = fx1 - fx0, fh = fy1 - fy0;
    const slim = amt * 0.12;
    const newW = fw * (1 - slim);
    const ddx = fx0 + (fw - newW) / 2;
    // Redraw the face band narrower, centred — feathered top/bottom to blend.
    const band = newCanvas(Math.max(1, Math.round(fw)), Math.max(1, Math.round(fh)));
    band.ctx.drawImage(base.canvas, fx0, fy0, fw, fh, 0, 0, fw, fh);
    const g = ctx.createLinearGradient(0, fy0, 0, fy1);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.18, 'rgba(0,0,0,1)');
    g.addColorStop(0.82, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    const slimmed = newCanvas(w, h);
    slimmed.ctx.drawImage(band.canvas, 0, 0, fw, fh, ddx, fy0, newW, fh);
    slimmed.ctx.globalCompositeOperation = 'destination-in';
    slimmed.ctx.fillStyle = g;
    slimmed.ctx.fillRect(0, fy0, w, fh);
    slimmed.ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(slimmed.canvas, 0, 0);
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Document scan look — flatten lighting & boost contrast (b&w / gray / color). */
  async scanDocument(uri: string, opts: { mode?: 'bw' | 'gray' | 'color' } = {}): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 2200;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    const mode = opts.mode ?? 'bw';
    (ctx as any).filter =
      mode === 'color' ? 'contrast(1.32) saturate(1.1) brightness(1.08)'
      : mode === 'gray' ? 'grayscale(1) contrast(1.4) brightness(1.12)'
      : 'grayscale(1) contrast(1.95) brightness(1.2)';
    ctx.drawImage(img, 0, 0, w, h);
    (ctx as any).filter = 'none';
    return encode(canvas, 'jpeg', 0.95);
  }

  /** Compose a portrait flyer/poster (background, optional photo, title/subtitle). */
  async composePoster(opts: {
    template?: string;
    bg: { kind: 'color'; color: string } | { kind: 'gradient'; colors: [string, string] };
    photoUri?: string | null;
    title?: string;
    subtitle?: string;
    footer?: string;
    textColor?: string;
  }): Promise<string> {
    const W = 1080, H = 1350;
    const { canvas, ctx } = newCanvas(W, H);
    if (opts.bg.kind === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, opts.bg.colors[0]); g.addColorStop(1, opts.bg.colors[1]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = opts.bg.color;
    ctx.fillRect(0, 0, W, H);

    if (opts.photoUri) {
      try {
        const img = await loadImage(opts.photoUri);
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        // Darken for text legibility.
        const og = ctx.createLinearGradient(0, 0, 0, H);
        og.addColorStop(0, 'rgba(0,0,0,0.15)'); og.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);
      } catch {}
    }

    const ink = opts.textColor ?? '#FFFFFF';
    const template = opts.template ?? 'bottom';
    ctx.textAlign = 'center'; ctx.fillStyle = ink;
    const wrap = (text: string, px: number, maxW: number) => {
      ctx.font = `700 ${px}px "Poppins_700Bold", sans-serif`;
      const words = text.split(/\s+/); const lines: string[] = []; let line = '';
      for (const wd of words) {
        const t = line ? line + ' ' + wd : wd;
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
      }
      if (line) lines.push(line);
      return lines;
    };
    const baseY = template === 'top' ? H * 0.16 : template === 'center' ? H * 0.42 : H * 0.66;
    const title = (opts.title ?? '').trim();
    const subtitle = (opts.subtitle ?? '').trim();
    const footer = (opts.footer ?? '').trim();
    let y = baseY;
    if (title) {
      const px = Math.round(W * 0.1);
      const lines = wrap(title.toUpperCase(), px, W * 0.84);
      ctx.font = `800 ${px}px "Poppins_700Bold", sans-serif`;
      for (const ln of lines) { ctx.fillText(ln, W / 2, y); y += px * 1.06; }
      y += px * 0.1;
    }
    if (subtitle) {
      const px = Math.round(W * 0.045);
      ctx.font = `500 ${px}px "Poppins_500Medium", sans-serif`;
      for (const ln of wrap(subtitle, px, W * 0.8)) { ctx.fillText(ln, W / 2, y); y += px * 1.3; }
    }
    if (footer) {
      const px = Math.round(W * 0.038);
      ctx.font = `600 ${px}px "Poppins_600SemiBold", sans-serif`;
      ctx.fillText(footer, W / 2, H * 0.93);
    }
    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Compose a square logo from an ORIGINAL, code-drawn template (badge, monogram,
   * crest, hexagon, etc.). All shapes are generated procedurally — there are no
   * third-party assets — so the result is the user's own original artwork.
   */
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
    const S = 1024;
    const cx = S / 2;
    const { canvas, ctx } = newCanvas(S, S);
    const ink = opts.textColor ?? '#FFFFFF';
    const brand = (opts.brand ?? '').trim();
    const tagline = (opts.tagline ?? '').trim();
    const contact = (opts.contact ?? '').trim();
    const template = opts.template ?? 'classic';
    const font = opts.font ?? {
      brand: '"Poppins_700Bold", sans-serif',
      tag: '"Poppins_500Medium", sans-serif',
      weight: '700',
    };
    const shape = opts.textShape ?? 'straight';

    // Background
    if (opts.bg.kind === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, S, S);
      if (opts.bg.stop != null) {
        // "Color with percentages" — colour A holds across `stop` of the canvas,
        // then blends into colour B by the far corner.
        const st = Math.max(0.04, Math.min(0.96, opts.bg.stop));
        g.addColorStop(0, opts.bg.colors[0]);
        g.addColorStop(st, opts.bg.colors[0]);
        g.addColorStop(1, opts.bg.colors[1]);
      } else {
        g.addColorStop(0, opts.bg.colors[0]);
        g.addColorStop(1, opts.bg.colors[1]);
      }
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = opts.bg.color;
    }
    ctx.fillRect(0, 0, S, S);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const initials = (brand.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
      || brand.slice(0, 2)).toUpperCase() || 'AB';

    // Draw text along a circular arc (rainbow up, or smile down).
    const drawArcText = (str: string, centerY: number, radius: number, fontPx: number, up: boolean) => {
      ctx.save();
      ctx.fillStyle = ink;
      ctx.font = `${font.weight} ${Math.round(fontPx)}px ${font.brand}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const chars = [...str];
      const widths = chars.map((c) => ctx.measureText(c).width);
      const totalAngle = widths.reduce((a, b) => a + b, 0) / radius;
      const circY = up ? centerY + radius : centerY - radius;
      let a = up ? -Math.PI / 2 - totalAngle / 2 : Math.PI / 2 + totalAngle / 2;
      for (let i = 0; i < chars.length; i++) {
        const adv = widths[i] / radius;
        a += (up ? 1 : -1) * (adv / 2);
        const x = cx + radius * Math.cos(a);
        const y = circY + radius * Math.sin(a);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(up ? a + Math.PI / 2 : a - Math.PI / 2);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        a += (up ? 1 : -1) * (adv / 2);
      }
      ctx.restore();
    };

    // Brand text — respects the chosen font + shape (straight / arc / angled).
    const brandText = (str: string, y: number, sizeF: number) => {
      if (!str) return;
      const px = Math.round(S * sizeF);
      if (shape === 'arcUp' || shape === 'arcDown') {
        drawArcText(str, y, S * 0.4, px, shape === 'arcUp');
      } else if (shape === 'angled') {
        ctx.save();
        ctx.translate(cx, y);
        ctx.rotate((-8 * Math.PI) / 180);
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${font.weight} ${px}px ${font.brand}`;
        ctx.fillText(str, 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${font.weight} ${px}px ${font.brand}`;
        ctx.fillText(str, cx, y);
      }
    };

    const text = (str: string, y: number, sizeF: number, weight = '700', _family?: string) => {
      if (!str) return;
      const fam = weight === '700' ? font.brand : font.tag;
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${weight === '700' ? font.weight : weight} ${Math.round(S * sizeF)}px ${fam}`;
      ctx.fillText(str, cx, y);
    };

    const drawEmblem = async (y: number, r: number) => {
      if (opts.usePhoto && opts.photoUri) {
        const img = await loadImage(opts.photoUri);
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2); ctx.clip();
        const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        ctx.drawImage(img, cx - dw / 2, y - dh / 2, dw, dh);
        ctx.restore();
        ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2);
        ctx.lineWidth = S * 0.012; ctx.strokeStyle = ink; ctx.stroke();
      } else if (opts.symbol) {
        ctx.fillStyle = ink;
        ctx.font = `${Math.round(r * 1.7)}px serif`;
        ctx.fillText(opts.symbol, cx, y);
      }
    };

    const circle = (y: number, r: number, lw: number) => {
      ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2);
      ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
    };
    const roundRect = (x: number, y: number, w: number, h: number, r: number, lw: number) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
    };
    const hLine = (y: number, halfW: number, lw: number) => {
      ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx + halfW, y);
      ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
    };

    switch (template) {
      case 'badge': {
        circle(S * 0.5, S * 0.44, S * 0.02);
        circle(S * 0.5, S * 0.38, S * 0.006);
        await drawEmblem(S * 0.37, S * 0.11);
        hLine(S * 0.5, S * 0.16, S * 0.006);
        brandText(brand.toUpperCase(), S * 0.58, 0.07);
        text(tagline.toUpperCase(), S * 0.66, 0.03, '500', 'Poppins_500Medium');
        break;
      }
      case 'monogram': {
        roundRect(cx - S * 0.23, S * 0.18, S * 0.46, S * 0.46, S * 0.06, S * 0.018);
        text(initials, S * 0.41, 0.2);
        brandText(brand.toUpperCase(), S * 0.74, 0.07);
        text(tagline.toUpperCase(), S * 0.82, 0.03, '500', 'Poppins_500Medium');
        break;
      }
      case 'lettercircle': {
        circle(S * 0.37, S * 0.2, S * 0.018);
        text(initials, S * 0.37, 0.14);
        brandText(brand.toUpperCase(), S * 0.66, 0.075);
        hLine(S * 0.73, S * 0.12, S * 0.005);
        text(tagline.toUpperCase(), S * 0.79, 0.03, '500', 'Poppins_500Medium');
        break;
      }
      case 'crest': {
        const top = S * 0.16, w = S * 0.5, h = S * 0.5, left = cx - w / 2, right = cx + w / 2;
        ctx.beginPath();
        ctx.moveTo(left, top); ctx.lineTo(right, top);
        ctx.lineTo(right, top + h * 0.55);
        ctx.quadraticCurveTo(right, top + h * 0.86, cx, top + h);
        ctx.quadraticCurveTo(left, top + h * 0.86, left, top + h * 0.55);
        ctx.closePath();
        ctx.lineWidth = S * 0.018; ctx.strokeStyle = ink; ctx.stroke();
        await drawEmblem(S * 0.3, S * 0.09);
        hLine(S * 0.4, S * 0.18, S * 0.006);
        brandText(brand.toUpperCase(), S * 0.48, 0.06);
        text(tagline.toUpperCase(), S * 0.74, 0.03, '500', 'Poppins_500Medium');
        break;
      }
      case 'hexagon': {
        const r = S * 0.3, cyy = S * 0.4;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 90);
          const x = cx + r * Math.cos(a), y = cyy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.lineWidth = S * 0.018; ctx.strokeStyle = ink; ctx.stroke();
        await drawEmblem(cyy, S * 0.1);
        brandText(brand.toUpperCase(), S * 0.78, 0.07);
        text(tagline.toUpperCase(), S * 0.86, 0.03, '500', 'Poppins_500Medium');
        break;
      }
      case 'ribbon': {
        await drawEmblem(S * 0.3, S * 0.12);
        const by = S * 0.52, bh = S * 0.13;
        ctx.fillStyle = ink;
        ctx.fillRect(cx - S * 0.34, by, S * 0.68, bh);
        // brand text in the background colour over the ribbon
        ctx.fillStyle = opts.bg.kind === 'color' ? opts.bg.color : opts.bg.colors[0];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${font.weight} ${Math.round(S * 0.065)}px ${font.brand}`;
        ctx.fillText(brand.toUpperCase(), cx, by + bh / 2);
        text(tagline.toUpperCase(), S * 0.7, 0.032, '500', 'Poppins_500Medium');
        break;
      }
      case 'minimal': {
        await drawEmblem(S * 0.34, S * 0.12);
        brandText(brand.toUpperCase(), S * 0.56, 0.085);
        hLine(S * 0.64, S * 0.14, S * 0.005);
        text(tagline.toUpperCase(), S * 0.7, 0.032, '500', 'Poppins_500Medium');
        break;
      }
      default: { // 'classic'
        const hasText = !!(brand || tagline);
        await drawEmblem(hasText ? S * 0.37 : S * 0.5, S * 0.16);
        brandText(brand, S * 0.66, 0.11);
        text(tagline, S * 0.75, 0.045, '400');
      }
    }

    // Optional contact / phone line, anchored near the bottom for every template.
    if (contact) {
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `500 ${Math.round(S * 0.03)}px ${font.tag}`;
      ctx.fillText(contact, cx, S * 0.94);
    }

    return encode(canvas, 'jpeg', 0.95);
  }

  /**
   * Cut the photo into a shape. `glyph` (a letter / number / emoji) is stamped
   * as a silhouette mask; otherwise `shape` selects a vector path. `size` (20-100)
   * scales the shape; `feather` (0-100) softens the edge. Returns a transparent PNG.
   */
  async composeCutoutShape(
    uri: string,
    opts: { shape?: string; glyph?: string; size?: number; feather?: number } = {},
  ): Promise<string> {
    const img = await loadImage(uri);
    const MAXD = 1600;
    const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const sizePct = Math.max(0.2, Math.min(1, (opts.size ?? 100) / 100));
    const dim = Math.min(w, h) * sizePct;

    // Build the white mask shape on a temp canvas.
    const m = newCanvas(w, h);
    const mc = m.ctx;
    mc.fillStyle = '#fff';
    mc.strokeStyle = '#fff';

    if (opts.glyph) {
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.font = `900 ${Math.round(dim)}px "Poppins_700Bold", Arial, sans-serif`;
      mc.fillText(opts.glyph, cx, cy);
    } else {
      const r = dim / 2;
      const poly = (n: number, rot = -Math.PI / 2) => {
        mc.beginPath();
        for (let i = 0; i < n; i++) {
          const a = rot + (i * 2 * Math.PI) / n;
          const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
          i === 0 ? mc.moveTo(x, y) : mc.lineTo(x, y);
        }
        mc.closePath(); mc.fill();
      };
      switch (opts.shape) {
        case 'square':    mc.fillRect(cx - r, cy - r, dim, dim); break;
        case 'rectangle': mc.fillRect(cx - r, cy - r * 0.65, dim, dim * 0.65); break;
        case 'circle':    mc.beginPath(); mc.arc(cx, cy, r, 0, Math.PI * 2); mc.fill(); break;
        case 'oval':      mc.beginPath(); mc.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); mc.fill(); break;
        case 'triangle':  mc.beginPath(); mc.moveTo(cx, cy - r); mc.lineTo(cx + r, cy + r); mc.lineTo(cx - r, cy + r); mc.closePath(); mc.fill(); break;
        case 'trapezium': mc.beginPath(); mc.moveTo(cx - r * 0.55, cy - r); mc.lineTo(cx + r * 0.55, cy - r); mc.lineTo(cx + r, cy + r); mc.lineTo(cx - r, cy + r); mc.closePath(); mc.fill(); break;
        case 'diamond':   mc.beginPath(); mc.moveTo(cx, cy - r); mc.lineTo(cx + r, cy); mc.lineTo(cx, cy + r); mc.lineTo(cx - r, cy); mc.closePath(); mc.fill(); break;
        case 'pentagon':  poly(5); break;
        case 'hexagon':   poly(6, 0); break;
        case 'star': {
          mc.beginPath();
          for (let i = 0; i < 10; i++) {
            const rr = i % 2 === 0 ? r : r * 0.45;
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
            i === 0 ? mc.moveTo(x, y) : mc.lineTo(x, y);
          }
          mc.closePath(); mc.fill(); break;
        }
        case 'heart': {
          mc.beginPath();
          const t = cy - r * 0.5;
          mc.moveTo(cx, cy + r * 0.7);
          mc.bezierCurveTo(cx + r * 1.3, cy - r * 0.2, cx + r * 0.5, t - r * 0.7, cx, cy - r * 0.1);
          mc.bezierCurveTo(cx - r * 0.5, t - r * 0.7, cx - r * 1.3, cy - r * 0.2, cx, cy + r * 0.7);
          mc.closePath(); mc.fill(); break;
        }
        case 'cross': {
          mc.save(); mc.translate(cx, cy); mc.rotate(Math.PI / 4);
          mc.fillRect(-r, -r * 0.32, dim, r * 0.64);
          mc.fillRect(-r * 0.32, -r, r * 0.64, dim);
          mc.restore(); break;
        }
        default: mc.beginPath(); mc.arc(cx, cy, r, 0, Math.PI * 2); mc.fill();
      }
    }

    // Mask the photo with the shape (optionally feathered).
    const feather = Math.max(0, Math.min(100, opts.feather ?? 0));
    ctx.globalCompositeOperation = 'destination-in';
    if (feather > 0) {
      const fb = newCanvas(w, h);
      (fb.ctx as any).filter = `blur(${((feather / 100) * Math.min(w, h) * 0.06).toFixed(1)}px)`;
      fb.ctx.drawImage(m.canvas, 0, 0);
      ctx.drawImage(fb.canvas, 0, 0);
    } else {
      ctx.drawImage(m.canvas, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
    return encode(canvas, 'png');
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
