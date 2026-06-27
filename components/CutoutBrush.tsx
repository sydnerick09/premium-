import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export interface CutoutBrushHandle {
  exportPng: () => string;
  reset: () => void;
}

interface Props {
  uri: string;
  brushSize: number;
  mode: 'erase' | 'restore';
}

/**
 * Native fallback. The interactive pixel-painting cut-out runs on the web build
 * (CutoutBrush.web.tsx) where a real <canvas> is available.
 */
const CutoutBrush = forwardRef<CutoutBrushHandle, Props>(({ uri }, ref) => {
  useImperativeHandle(ref, () => ({ exportPng: () => uri, reset: () => {} }));
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Manual brush cut-out is available on the web app.</Text>
    </View>
  );
});

CutoutBrush.displayName = 'CutoutBrush';
export default CutoutBrush;

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: Colors.text.muted, textAlign: 'center', fontFamily: 'Poppins_500Medium' },
});
