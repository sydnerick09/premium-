import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
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

      {/* Live preview — effects applied directly to the image pixels */}
      {currentUri && (
        <View style={styles.preview}>
          <EditorImage
            uri={currentUri}
            adjustments={adjustments}
            filter={activeFilter}
            filterIntensity={filterIntensity}
            beauty={beautyValues}
            radius={Layout.radius.xl}
          />

          {/* Active adjustment label */}
          {activeKey && (
            <View style={styles.activeLabel}>
              <Text style={styles.activeLabelText}>
                {activeKey.charAt(0).toUpperCase() + activeKey.slice(1)}: {
                  adjustments[activeKey] > 0 ? `+${adjustments[activeKey].toFixed(0)}` : adjustments[activeKey].toFixed(0)
                }
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {ADJUSTMENTS.map((adj) => {
          const value = adjustments[adj.key];
          const isActive = activeKey === adj.key;
          return (
            <TouchableOpacity
              key={adj.key}
              onPress={() => setActiveKey(isActive ? null : adj.key)}
              activeOpacity={0.8}
              style={[styles.adjRow, isActive && styles.adjRowActive]}
            >
              <Ionicons name={adj.icon as any} size={20} color={isActive ? Colors.primary : Colors.text.muted} />
              <View style={styles.adjInfo}>
                <View style={styles.adjLabelRow}>
                  <Text style={[styles.adjLabel, isActive && { color: Colors.primary }]}>
                    {adj.label}
                  </Text>
                  <Text style={[styles.adjValue, value !== 0 && { color: Colors.primary }]}>
                    {value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={adj.min}
                  maximumValue={adj.max}
                  step={adj.step}
                  value={value}
                  onValueChange={(v) => {
                    updateAdjustment(adj.key, v);
                    setActiveKey(adj.key);
                  }}
                  onSlidingComplete={() => haptic.selection()}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.dark.border}
                  thumbTintColor={Colors.white}
                />
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
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

  preview: {
    height: 180, marginHorizontal: 16, marginBottom: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  previewImage:   { width: '100%', height: '100%' },
  activeLabel: {
    position: 'absolute', bottom: 8, left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
  },
  activeLabelText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  scroll:         { paddingHorizontal: 16 },
  adjRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: Layout.radius.md, marginBottom: 4,
  },
  adjRowActive:   { backgroundColor: Colors.dark.card },
  adjInfo:        { flex: 1 },
  adjLabelRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  adjLabel:       { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  adjValue:       { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, minWidth: 36, textAlign: 'right' },
  slider:         { width: '100%', height: 36 },
});
