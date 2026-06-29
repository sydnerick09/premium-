import React from 'react';
import { Image, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';

export interface ShowcaseImageProps {
  source: ImageSourcePropType;
  fit?: 'cover' | 'contain';
  style?: StyleProp<ImageStyle>;
}

/**
 * NATIVE renderer — a plain RN Image sized to fill its parent with the chosen
 * resize mode. The web counterpart (ShowcaseImage.web.tsx) uses a raw <img> with
 * CSS object-fit because react-native-web's `resizeMode` doesn't apply reliably
 * with absolute-fill sizing (it clipped images to their top-left corner).
 */
export default function ShowcaseImage({ source, fit = 'cover', style }: ShowcaseImageProps) {
  return (
    <Image
      source={source}
      style={[{ width: '100%', height: '100%' }, style]}
      resizeMode={fit}
    />
  );
}
