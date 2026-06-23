import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { AdjustmentValues, BeautyValues } from '../types';
import { Filter } from '../constants/FilterCatalog';
import { buildCssFilter, buildCssTransform } from '../utils/imageFilters';

export interface EditorImageProps {
  uri: string;
  adjustments: AdjustmentValues;
  filter?: Filter | null;
  filterIntensity?: number;
  beauty?: BeautyValues | null;
  flipH?: boolean;
  flipV?: boolean;
  rotateDeg?: number;
  style?: any;
  radius?: number;
}

/**
 * WEB renderer — applies every adjustment/filter as a CSS `filter` on the actual
 * <img> pixels, so effects land ON the image, never on the canvas background.
 * The vignette is drawn over the exact displayed image rect (object-fit: contain).
 */
export default function EditorImage({
  uri, adjustments, filter, filterIntensity = 100, beauty,
  flipH, flipV, rotateDeg, style, radius = 0,
}: EditorImageProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const cssFilter = useMemo(
    () => buildCssFilter({ adjustments, filter, filterIntensity, beauty }),
    [adjustments, filter, filterIntensity, beauty],
  );
  const cssTransform = useMemo(
    () => buildCssTransform({ adjustments, flipH, flipV, rotateDeg }),
    [flipH, flipV, rotateDeg],
  );

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };

  // Displayed image rect inside the container (object-fit: contain)
  const rect = useMemo(() => {
    if (!box.w || !box.h || !natural.w || !natural.h) return null;
    const scale = Math.min(box.w / natural.w, box.h / natural.h);
    const dispW = natural.w * scale;
    const dispH = natural.h * scale;
    return { left: (box.w - dispW) / 2, top: (box.h - dispH) / 2, width: dispW, height: dispH };
  }, [box, natural]);

  const vignette = adjustments.vignette;

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      {React.createElement('img', {
        ref: imgRef,
        src: uri,
        onLoad: (e: any) =>
          setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight }),
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: cssFilter,
          transform: cssTransform,
          borderRadius: radius,
          display: 'block',
          // smooth, GPU-accelerated live edits
          transition: 'filter 90ms linear',
        },
      })}

      {/* Vignette painted only over the displayed image area */}
      {vignette > 0 && rect && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            borderRadius: radius,
            // @ts-ignore web-only CSS
            background: `radial-gradient(ellipse at center, transparent ${100 - vignette * 0.6}%, rgba(0,0,0,${(
              vignette / 130
            ).toFixed(3)}) 100%)`,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
