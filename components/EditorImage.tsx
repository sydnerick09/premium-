import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
// Vignette is a functional image-edit effect (edge darkening), so it keeps the
// real gradient — it is not decorative chrome.
import { LinearGradient } from 'expo-linear-gradient';
import { AdjustmentValues, BeautyValues } from '../types';
import { Filter } from '../constants/FilterCatalog';

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
 * NATIVE renderer. CSS filters aren't available, so effects are painted as
 * overlays — but clipped to the EXACT displayed image rect (object-fit: contain),
 * so light/color land on the image, never on the surrounding canvas background.
 */
export default function EditorImage({
  uri, adjustments, filter, filterIntensity = 100, flipH, flipV, rotateDeg, style, radius = 0,
}: EditorImageProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  React.useEffect(() => {
    let active = true;
    RNImage.getSize(uri, (w, h) => active && setNatural({ w, h }), () => {});
    return () => { active = false; };
  }, [uri]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };

  const rect = useMemo(() => {
    if (!box.w || !box.h || !natural.w || !natural.h) return null;
    const scale = Math.min(box.w / natural.w, box.h / natural.h);
    const dispW = natural.w * scale;
    const dispH = natural.h * scale;
    return { left: (box.w - dispW) / 2, top: (box.h - dispH) / 2, width: dispW, height: dispH };
  }, [box, natural]);

  const k = Math.max(0, Math.min(100, filterIntensity)) / 100;
  const fb = (v?: number) => (v ?? 0) * k;
  const a = {
    brightness: adjustments.brightness + adjustments.exposure * 0.7 + fb(filter?.brightness),
    contrast: adjustments.contrast + fb(filter?.contrast),
    shadows: adjustments.shadows,
    fade: Math.max(adjustments.fade, fb(filter?.fade)),
    temperature: adjustments.temperature + fb(filter?.temperature),
    vignette: Math.max(adjustments.vignette, fb(filter?.vignette)),
  };

  const transform: any[] = [];
  if (rotateDeg) transform.push({ rotate: `${rotateDeg}deg` });
  if (flipH) transform.push({ scaleX: -1 });
  if (flipV) transform.push({ scaleY: -1 });

  const rectStyle = rect
    ? { position: 'absolute' as const, left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: radius }
    : null;

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, { transform, borderRadius: radius }]}
        contentFit="contain"
        cachePolicy="none"
      />

      {rectStyle && (
        <>
          {a.brightness !== 0 && (
            <View pointerEvents="none" style={[rectStyle, {
              backgroundColor: a.brightness > 0
                ? `rgba(255,255,255,${Math.min(0.5, Math.abs(a.brightness) / 200)})`
                : `rgba(0,0,0,${Math.min(0.5, Math.abs(a.brightness) / 200)})`,
            }]} />
          )}
          {a.shadows < 0 && (
            <View pointerEvents="none" style={[rectStyle, { backgroundColor: `rgba(0,0,0,${Math.abs(a.shadows) / 250})` }]} />
          )}
          {a.fade > 0 && (
            <View pointerEvents="none" style={[rectStyle, { backgroundColor: `rgba(255,255,255,${a.fade / 320})` }]} />
          )}
          {a.temperature !== 0 && (
            <View pointerEvents="none" style={[rectStyle, {
              backgroundColor: a.temperature > 0
                ? `rgba(255,140,0,${a.temperature / 350})`
                : `rgba(64,128,255,${Math.abs(a.temperature) / 350})`,
            }]} />
          )}
          {a.vignette > 0 && (
            <View pointerEvents="none" style={rectStyle}>
              <LinearGradient
                colors={[`rgba(0,0,0,${a.vignette / 130})`, 'transparent', `rgba(0,0,0,${a.vignette / 130})`]}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
