import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import AppSlider from '../../components/AppSlider';
import { useEditorStore } from '../../store/editorStore';
import EditorImage from '../../components/EditorImage';
import { FilterCatalog } from '../../constants/FilterCatalog';
import { AdjustmentValues } from '../../types';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface AdjustmentDef {
  key: keyof AdjustmentValues;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
}

const ADJUSTMENTS: AdjustmentDef[] = [
  { key: 'brightness',  label: 'Brightness',  icon: 'sunny-outline',            min: -100, max: 100, step: 1 },
  { key: 'contrast',    label: 'Contrast',    icon: 'contrast-outline',         min: -100, max: 100, step: 1 },
  { key: 'saturation',  label: 'Saturation',  icon: 'color-palette-outline',    min: -100, max: 100, step: 1 },
  { key: 'exposure',    label: 'Exposure',    icon: 'camera-outline',           min: -100, max: 100, step: 1 },
  { key: 'highlights',  label: 'Highlights',  icon: 'sunny',                    min: -100, max: 100, step: 1 },
  { key: 'shadows',     label: 'Shadows',     icon: 'moon-outline',             min: -100, max: 100, step: 1 },
  { key: 'temperature', label: 'Temperature', icon: 'thermometer-outline',      min: -100, max: 100, step: 1 },
  { key: 'tint',        label: 'Tint',        icon: 'color-filter-outline',     min: -100, max: 100, step: 1 },
  { key: 'vibrance',    label: 'Vibrance',    icon: 'sparkles-outline',         min: -100, max: 100, step: 1 },
  { key: 'sharpness',   label: 'Sharpness',   icon: 'scan-outline',             min: 0,    max: 100, step: 1 },
  { key: 'blur',        label: 'Blur',        icon: 'radio-button-off-outline', min: 0,    max: 25,  step: 0.5 },
  { key: 'vignette',    label: 'Vignette',    icon: 'radio-button-on-outline',  min: 0,    max: 100, step: 1 },
  { key: 'grain',       label: 'Grain',       icon: 'grid-outline',             min: 0,    max: 100, step: 1 },
  { key: 'fade',        label: 'Fade',        icon: 'water-outline',            min: 0,    max: 100, step: 1 },
  { key: 'clarity',     label: 'Clarity',     icon: 'eye-outline',              min: 0,    max: 100, step: 1 },
  { key: 'hue',         label: 'Hue',         icon: 'color-wand-outline',       min: -180, max: 180, step: 1 },
];

export default function AdjustmentsScreen() {
  const { adjustments, updateAdjustment, resetAdjustments, currentUri, activeFilterId, filterIntensity, beautyValues } = useEditorStore();
  const activeFilter = activeFilterId ? FilterCatalog.find((f) => f.id === activeFilterId) ?? null : null;
  const [activeKey, setActiveKey] = useState<keyof AdjustmentValues | null>(null);

  const handleApply = async () => {
    haptic.success();
    router.back();
  };

  const handleReset = () => {
    haptic.medium();
    resetAdjustments();
  };

  const hasChanges = Object.values(adjustments).some((v) => v !== 0);
  const activeAdj = activeKey ? ADJUSTMENTS.find((a) => a.key === activeKey) ?? null : null;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Adjustments</Text>
          <View style={styles.headerActions}>
            {hasChanges && (
              <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.applyGradient}>
                <Text style={styles.applyText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Live preview — fills the screen so you can clearly see every edit */}
      <View style={styles.preview}>
        {currentUri && (
          <EditorImage
            uri={currentUri}
            adjustments={adjustments}
            filter={activeFilter}
            filterIntensity={filterIntensity}
            beauty={beautyValues}
            radius={Layout.radius.xl}
          />
        )}
      </View>

      {/* Controls dock — single slider for the active control + a HORIZONTAL
          row of adjustment icons. Keeps the image area as large as possible. */}
      <SafeAreaView edges={['bottom']} style={styles.dock}>
        {activeAdj ? (
          <View style={styles.sliderBar}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderName}>{activeAdj.label}</Text>
              <Text style={styles.sliderValue}>
                {adjustments[activeAdj.key] > 0
                  ? `+${adjustments[activeAdj.key].toFixed(0)}`
                  : adjustments[activeAdj.key].toFixed(0)}
              </Text>
            </View>
            <AppSlider
              style={styles.slider}
              minimumValue={activeAdj.min}
              maximumValue={activeAdj.max}
              step={activeAdj.step}
              value={adjustments[activeAdj.key]}
              onValueChange={(v) => updateAdjustment(activeAdj.key, v)}
              onSlidingComplete={() => haptic.selection()}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.dark.border}
              thumbTintColor={Colors.white}
            />
          </View>
        ) : (
          <Text style={styles.hint}>Tap an adjustment below to start editing</Text>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {ADJUSTMENTS.map((adj) => {
            const value = adjustments[adj.key];
            const isActive = activeKey === adj.key;
            return (
              <TouchableOpacity
                key={adj.key}
                onPress={() => { haptic.selection(); setActiveKey(isActive ? null : adj.key); }}
                activeOpacity={0.8}
                style={styles.chip}
              >
                <View style={[styles.chipIcon, isActive && styles.chipIconActive]}>
                  <Ionicons name={adj.icon as any} size={22} color={isActive ? Colors.primary : Colors.text.muted} />
                  {value !== 0 && <View style={styles.chipDot} />}
                </View>
                <Text
                  style={[styles.chipLabel, isActive && { color: Colors.primary }]}
                  numberOfLines={1}
                >
                  {adj.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 12,
  },
  title:          { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn:       { paddingHorizontal: 12, paddingVertical: 6 },
  resetText:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  applyBtn:       { borderRadius: Layout.radius.md, overflow: 'hidden' },
  applyGradient:  { paddingHorizontal: 20, paddingVertical: 8 },
  applyText:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  // Image now fills all the space between the header and the controls dock.
  preview: {
    flex: 1, marginHorizontal: 16, marginVertical: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },

  // Bottom controls dock
  dock: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
  },
  sliderBar:      { paddingHorizontal: 20, paddingTop: 8 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderName:     { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  sliderValue:    { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, minWidth: 36, textAlign: 'right' },
  slider:         { width: '100%', height: 36 },
  hint: {
    fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted, textAlign: 'center', paddingVertical: 14,
  },

  // Horizontal adjustment icon strip
  chipRow:        { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chip:           { alignItems: 'center', width: 66, gap: 4 },
  chipIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  chipIconActive: { borderColor: Colors.primary, backgroundColor: '#0C1C16' },
  chipDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  chipLabel:      { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted, textAlign: 'center' },
});
