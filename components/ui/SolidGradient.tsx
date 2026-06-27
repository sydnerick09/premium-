import React from 'react';
import { View, ViewProps } from 'react-native';

/**
 * Drop-in replacement for `expo-linear-gradient`'s `LinearGradient`.
 *
 * The app's design was being flattened: no more soft gradients. This component
 * keeps the exact same API (`colors`, `start`, `end`, `locations`, …) so every
 * existing `<LinearGradient colors={...}>` keeps working untouched, but it
 * renders a single SOLID color instead of a gradient. The solid color picked is
 * the most opaque / most vivid stop, so "if it was green, it stays green".
 */
export interface LinearGradientProps extends ViewProps {
  colors: readonly string[];
  start?: { x: number; y: number } | [number, number] | null;
  end?: { x: number; y: number } | [number, number] | null;
  locations?: readonly number[] | null;
  dither?: boolean;
}

/** Rough alpha (0–1) of a CSS/RN color string; opaque/unknown → 1. */
function alphaOf(color: string): number {
  if (!color) return 0;
  const c = color.trim().toLowerCase();
  if (c === 'transparent') return 0;

  const rgba = c.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => p.trim());
    return parts.length === 4 ? parseFloat(parts[3]) : 1;
  }

  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 4) return parseInt(hex[3] + hex[3], 16) / 255; // #RGBA
    if (hex.length === 8) return parseInt(hex.slice(6, 8), 16) / 255; // #RRGGBBAA
    return 1; // #RGB / #RRGGBB
  }

  return 1; // named color
}

/** Pick the most opaque stop; ties keep the earliest (the "primary") stop. */
function solidColor(colors: readonly string[]): string {
  if (!colors || colors.length === 0) return 'transparent';
  let best = colors[0];
  let bestAlpha = alphaOf(colors[0]);
  for (let i = 1; i < colors.length; i++) {
    const a = alphaOf(colors[i]);
    if (a > bestAlpha) {
      best = colors[i];
      bestAlpha = a;
    }
  }
  return best;
}

export function LinearGradient({
  colors,
  // gradient-only props are intentionally dropped so they never reach the DOM
  start,
  end,
  locations,
  dither,
  style,
  children,
  ...rest
}: LinearGradientProps) {
  return (
    <View {...rest} style={[style, { backgroundColor: solidColor(colors) }]}>
      {children}
    </View>
  );
}

export default LinearGradient;
