import { AdjustmentValues, BeautyValues } from '../types';
import { Filter } from '../constants/FilterCatalog';

/**
 * Converts editor state (adjustments + active filter + beauty) into a CSS
 * `filter` + `transform` string that is applied DIRECTLY to the image element.
 *
 * This is the key to "edits affect the image, not the background": instead of
 * laying translucent overlays over the whole canvas (which also darkens the
 * letterbox background), we bake every effect onto the <img> pixels only.
 */

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export interface FilterInput {
  adjustments: AdjustmentValues;
  filter?: Filter | null;
  filterIntensity?: number; // 0..100
  beauty?: BeautyValues | null;
  flipH?: boolean;
  flipV?: boolean;
  rotateDeg?: number;
}

/**
 * Merge a catalog filter's params (scaled by intensity) onto the base
 * adjustments so the live preview reflects the chosen filter too.
 */
function mergeFilter(adj: AdjustmentValues, filter: Filter | null | undefined, intensity: number): AdjustmentValues {
  if (!filter || filter.id === 'none') return adj;
  const k = clamp(intensity, 0, 100) / 100;
  return {
    ...adj,
    brightness: adj.brightness + (filter.brightness ?? 0) * k,
    contrast: adj.contrast + (filter.contrast ?? 0) * k,
    saturation: adj.saturation + (filter.saturation ?? 0) * k,
    temperature: adj.temperature + (filter.temperature ?? 0) * k,
    vignette: Math.max(adj.vignette, (filter.vignette ?? 0) * k),
    grain: Math.max(adj.grain, (filter.grain ?? 0) * k),
    fade: Math.max(adj.fade, (filter.fade ?? 0) * k),
    sharpness: Math.max(adj.sharpness, (filter.sharpness ?? 0) * k),
  };
}

/** Build the CSS `filter` string. Pure + web-safe. */
export function buildCssFilter(input: FilterInput): string {
  const a = mergeFilter(input.adjustments, input.filter, input.filterIntensity ?? 100);
  const f = input.filter;
  const beauty = input.beauty;
  const parts: string[] = [];

  // ── Light: brightness + exposure + highlights + fade lift + shadows lift ──
  let brightness =
    1 +
    (a.brightness / 100) * 0.6 +
    (a.exposure / 100) * 0.45 +
    (a.highlights / 100) * 0.15 +
    (a.shadows / 100) * 0.1 +
    (a.fade / 100) * 0.12;
  if (beauty?.skinSmoothing) brightness += (beauty.skinSmoothing / 100) * 0.06;
  // Teeth whitening + eye enhancement lift brightness a touch (real edit on the photo).
  if (beauty?.teethWhitening) brightness += (beauty.teethWhitening / 100) * 0.05;
  if (beauty?.eyeEnhancement) brightness += (beauty.eyeEnhancement / 100) * 0.04;
  brightness = clamp(brightness, 0.2, 2.2);
  if (brightness !== 1) parts.push(`brightness(${brightness.toFixed(3)})`);

  // ── Contrast: contrast + clarity + sharpness, reduced by fade/shadows ──
  let contrast =
    1 +
    (a.contrast / 100) * 0.5 +
    (a.clarity / 100) * 0.3 +
    (a.sharpness / 100) * 0.2 -
    (a.fade / 100) * 0.3 -
    (a.shadows / 100) * 0.08;
  // Eye enhancement adds a little local-feeling crispness via contrast.
  if (beauty?.eyeEnhancement) contrast += (beauty.eyeEnhancement / 100) * 0.12;
  contrast = clamp(contrast, 0.3, 2.2);
  if (contrast !== 1) parts.push(`contrast(${contrast.toFixed(3)})`);

  // ── Saturation: saturation + vibrance ──
  let saturate = 1 + a.saturation / 100 + (a.vibrance / 100) * 0.6;
  if (f?.isGrayscale) saturate = 0;
  saturate = clamp(saturate, 0, 3);
  if (saturate !== 1) parts.push(`saturate(${saturate.toFixed(3)})`);

  // ── Hue rotation ──
  if (a.hue && !f?.isGrayscale) parts.push(`hue-rotate(${Math.round(a.hue)}deg)`);

  // ── Temperature (warm = sepia, cool = blue cast) ──
  if (a.temperature > 0) {
    parts.push(`sepia(${clamp((a.temperature / 100) * 0.55, 0, 1).toFixed(3)})`);
  } else if (a.temperature < 0) {
    const amt = clamp((Math.abs(a.temperature) / 100) * 0.5, 0, 1);
    parts.push(`sepia(${amt.toFixed(3)}) hue-rotate(180deg)`);
  }

  // ── Filter color toning ──
  if (f?.isSepia) parts.push('sepia(0.7)');
  if (f?.isGrayscale) parts.push('grayscale(1)');

  // ── Blur: explicit blur + beauty skin smoothing ──
  let blurPx = a.blur;
  if (beauty?.skinSmoothing) blurPx += (beauty.skinSmoothing / 100) * 1.6;
  if (blurPx > 0) parts.push(`blur(${blurPx.toFixed(2)}px)`);

  return parts.length ? parts.join(' ') : 'none';
}

/** Build the CSS `transform` string for flips / rotation. */
export function buildCssTransform(input: FilterInput): string {
  const parts: string[] = [];
  if (input.rotateDeg) parts.push(`rotate(${input.rotateDeg}deg)`);
  const sx = input.flipH ? -1 : 1;
  const sy = input.flipV ? -1 : 1;
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`);
  return parts.length ? parts.join(' ') : 'none';
}

/** True if any non-destructive effect is active (used to skip work). */
export function hasActiveEffects(input: FilterInput): boolean {
  return buildCssFilter(input) !== 'none' || buildCssTransform(input) !== 'none';
}
