import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useEditorStore } from '../../store/editorStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import AppSlider from '../../components/AppSlider';
import CutoutBrush, { CutoutBrushHandle } from '../../components/CutoutBrush';

export default function CutoutBrushScreen() {
  const uri = useEditorStore((s) => s.currentUri);
  const setCurrentUri = useEditorStore((s) => s.setCurrentUri);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const brushRef = useRef<CutoutBrushHandle>(null);
  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [size, setSize] = useState(40);

  const onUse = () => {
    const png = brushRef.current?.exportPng();
    if (png) {
      haptic.success();
      setCurrentUri(png);
      pushHistory('Cutout (brush)', png);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.headerIcon}>
              <Ionicons name="brush" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Cut Out — Brush</Text>
          </View>
          <TouchableOpacity onPress={onUse} style={styles.doneBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Use →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Paint canvas */}
      <View style={styles.canvasArea}>
        {uri ? (
          <CutoutBrush ref={brushRef} uri={uri} brushSize={size} mode={mode} />
        ) : (
          <Text style={styles.muted}>No image loaded.</Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.dock}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => { haptic.selection(); setMode('erase'); }}
            style={[styles.modeBtn, mode === 'erase' && styles.modeBtnActive]}
          >
            <Ionicons name="cut-outline" size={18} color={mode === 'erase' ? Colors.primary : Colors.text.muted} />
            <Text style={[styles.modeText, mode === 'erase' && { color: Colors.primary }]}>Erase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { haptic.selection(); setMode('restore'); }}
            style={[styles.modeBtn, mode === 'restore' && styles.modeBtnActive]}
          >
            <Ionicons name="brush-outline" size={18} color={mode === 'restore' ? Colors.primary : Colors.text.muted} />
            <Text style={[styles.modeText, mode === 'restore' && { color: Colors.primary }]}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptic.light(); brushRef.current?.reset(); }} style={styles.modeBtn}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
            <Text style={styles.modeText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Brush</Text>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <AppSlider
              minimumValue={8}
              maximumValue={90}
              step={1}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.dark.border}
              thumbTintColor={Colors.white}
            />
          </View>
          <Text style={styles.sliderVal}>{Math.round(size)}px</Text>
        </View>

        <Text style={styles.hint}>
          Erase to remove parts of the photo; Restore to paint them back. Transparency is kept when you save.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  doneBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  doneGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  doneText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  canvasArea: { flex: 1, margin: 12, borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.text.muted, fontFamily: 'Poppins_500Medium' },

  dock: { backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
  modeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  modeBtnActive: { backgroundColor: '#0D2119', borderColor: Colors.primary },
  modeText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderLabel: { width: 44, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  sliderVal: { width: 48, textAlign: 'right', fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  hint: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', lineHeight: 16 },
});
