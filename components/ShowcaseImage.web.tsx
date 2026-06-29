import React from 'react';
import { StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';
import type { ShowcaseImageProps } from './ShowcaseImage';

/**
 * WEB renderer — a real <img> with CSS object-fit so the WHOLE photo is shown
 * (contain) or fills the card (cover). react-native-web's <Image resizeMode> was
 * unreliable here: with absolute-fill sizing it rendered the image at natural
 * size and clipped it to the top-left corner. A raw <img> with object-fit is the
 * same approach EditorImage.web.tsx uses and works every time.
 *
 * NOTE: on Metro web a require()'d image is a numeric asset id — it MUST be
 * resolved via expo-asset (Asset.fromModule().uri). react-native-web's Image has
 * NO resolveAssetSource, so calling it crashes the whole app (blank page).
 */
function uriFor(source: any): string | undefined {
  if (source == null) return undefined;
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && source.uri) return source.uri;
  try {
    const a = Asset.fromModule(source);
    if (a?.uri) return a.uri;
  } catch {}
  return source.uri ?? source.default ?? undefined;
}

export default function ShowcaseImage({ source, fit = 'cover', style }: ShowcaseImageProps) {
  const uri = uriFor(source);
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, any>;
  if (!uri) return null;
  return React.createElement('img', {
    src: uri,
    alt: '',
    style: {
      width: '100%',
      height: '100%',
      objectFit: fit,
      display: 'block',
      borderRadius: flat.borderRadius,
      backgroundColor: flat.backgroundColor ?? '#0E0E14',
    },
  });
}
