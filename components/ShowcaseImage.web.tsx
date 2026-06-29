import React from 'react';
import { Image, StyleSheet } from 'react-native';
import type { ShowcaseImageProps } from './ShowcaseImage';

/**
 * WEB renderer — a real <img> with CSS object-fit so the WHOLE photo is shown
 * (contain) or fills the card (cover). react-native-web's <Image resizeMode> was
 * unreliable here: with absolute-fill sizing it rendered the image at natural
 * size and clipped it to the top-left corner. A raw <img> with object-fit is the
 * same approach EditorImage.web.tsx uses and works every time.
 */
export default function ShowcaseImage({ source, fit = 'cover', style }: ShowcaseImageProps) {
  // require()'d assets resolve to a number/object on web; turn it into a URL.
  const uri =
    typeof source === 'string'
      ? source
      : (Image.resolveAssetSource(source as any)?.uri ?? (source as any)?.uri);
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, any>;

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
