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
import { imageProcessor } from '../../services/image/imageProcessor.service';
import EditorImage from '../../components/EditorImage';
import { FilterCatalog } from '../../constants/FilterCatalog';
import { BeautyValues } from '../../types';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type BeautyTab = 'retouch' | 'reshape' | 'face-guide';

interface BeautyDef {
  key: keyof BeautyValues;
  label: string;
  icon: string;
  min: number;
  max: number;
  isPremium?: boolean;
  group: 'retouch' | 'reshape';
}

const BEAUTY_TOOLS: BeautyDef[] = [
  { key: 'skinSmoothing',   label: 'Skin Smoothing',  icon: 'hand-right-outline',  min: 0,   max: 100, group: 'retouch' },
  { key: 'blemishRemoval',  label: 'Blemish Removal', icon: 'medical-outline',     min: 0,   max: 100, group: 'retouch' },
  { key: 'teethWhitening',  label: 'Teeth Whitening', icon: 'happy-outline',       min: 0,   max: 100, group: 'retouch' },
  { key: 'eyeEnhancement',  label: 'Eye Enhancement', icon: 'eye-outline',         min: 0,   max: 100, group: 'retouch' },
  { key: 'makeupIntensity', label: 'Makeup',          icon: 'color-wand-outline',  min: 0,   max: 100, group: 'retouch', isPremium: true },
  { key: 'faceSlim',  label: 'Face Slim',  icon: 'person-outline', min: 0,   max: 100, group: 'reshape', isPremium: true },
  { key: 'noseSlim',  label: 'Nose Slim',  icon: 'body-outline',   min: 0,   max: 100, group: 'reshape', isPremium: true },
  { key: 'eyeSize',   label: 'Eye Size',   icon: 'scan-outline',   min: -50, max: 50,  group: 'reshape', isPremium: true },
];

const MAKEUP_COLORS = ['#FF4444','#FF8C69','#FF69B4','#C2185B','#E91E63','#FF1493','#DC143C'];

interface FaceShape {
  id: string; name: string; emoji: string;
  description: string; bestTools: string[]; tip: string;
}
const FACE_SHAPES: FaceShape[] = [
  { id: 'oval',     name: 'Oval',     emoji: '🥚', description: 'Balanced, slightly longer than wide. Considered the most versatile face shape.', bestTools: ['Blemish Removal','Eye Enhancement','Skin Smoothing'], tip: 'Your shape suits almost every style. Focus on eye and skin enhancement.' },
  { id: 'round',    name: 'Round',    emoji: '⭕', description: 'Full cheeks and a wide forehead. Soft curves with no sharp angles.', bestTools: ['Face Slim','Nose Slim','Skin Smoothing'], tip: 'Use Face Slim to add definition. Contour the sides to elongate your look.' },
  { id: 'square',   name: 'Square',   emoji: '⬛', description: 'Strong jawline with a wide forehead. Masculine and defined angles.', bestTools: ['Face Slim','Skin Smoothing','Eye Enhancement'], tip: 'Soften the jawline with Face Slim. Enhance eyes to draw focus upward.' },
  { id: 'heart',    name: 'Heart',    emoji: '❤️', description: 'Wider forehead tapering to a pointed chin. Classic romantic shape.', bestTools: ['Nose Slim','Eye Enhancement','Skin Smoothing'], tip: 'Balance your forehead and chin with subtle reshaping tools.' },
  { id: 'diamond',  name: 'Diamond',  emoji: '💎', description: 'Narrow forehead and chin with wide cheekbones. Very striking.', bestTools: ['Face Slim','Eye Enhancement','Makeup'], tip: 'Highlight your cheekbones. Use eye enhancement to balance proportions.' },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', description: 'Narrow forehead widening to a broad jaw. Strong and grounded.', bestTools: ['Face Slim','Eye Enhancement','Skin Smoothing'], tip: 'Enhance your eyes and forehead area to balance the wider jaw.' },
];

export default function BeautyScreen() {
  const {
    beautyValues, updateBeauty, resetBeauty, currentUri,
    setCurrentUri, pushHistory, setProcessing, setAdjustments,
    adjustments, activeFilterId, filterIntensity,
  } = useEditorStore();
  const activeFilter = activeFilterId ? FilterCatalog.find((f) => f.id === activeFilterId) ?? null : null;

  const [activeTab, setActiveTab] = useState<BeautyTab>('retouch');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [activeBeautyKey, setActiveBeautyKey] = useState<keyof BeautyValues | null>(null);

  const TABS = [
    { id: 'retouch'    as BeautyTab, label: 'Retouch',    icon: 'sparkles-outline' },
    { id: 'reshape'    as BeautyTab, label: 'Reshape',    icon: 'person-outline'   },
    { id: 'face-guide' as BeautyTab, label: 'Face Guide', icon: 'happy-outline'    },
  ];


  const handleDone = async () => {
    haptic.success();

    const hasEffects = Object.values(beautyValues).some((v) =>
      typeof v === 'number' ? v !== 0 : v !== null
    );

    if (hasEffects && currentUri) {
      setIsApplying(true);
      try {
        // Bake beauty into ONLY the detected facial regions (skin / eyes / teeth).
        const out = await imageProcessor.applyBeautyLocalized(currentUri, {
          skinSmoothing: beautyValues.skinSmoothing,
          teethWhitening: beautyValues.teethWhitening,
          eyeEnhancement: beautyValues.eyeEnhancement,
        });
        if (out && out !== currentUri) {
          setCurrentUri(out, 'Beauty Applied');
          pushHistory('Beauty Applied', out);
        }
        // Clear the live (global) preview values so they aren't re-applied on top
        // of the now-baked, localized result.
        resetBeauty();
      } catch { haptic.error(); }
      finally { setIsApplying(false); }
    }

    router.back();
  };

  // Tools in the currently selected group (Retouch / Reshape) and the active one.
  const groupTools = BEAUTY_TOOLS.filter(
    (t) => t.group === (activeTab === 'reshape' ? 'reshape' : 'retouch'),
  );
  const activeTool = activeBeautyKey
    ? BEAUTY_TOOLS.find((t) => t.key === activeBeautyKey) ?? null
    : null;

  const switchTab = (tab: BeautyTab) => {
    haptic.selection();
    setActiveTab(tab);
    setActiveBeautyKey(null); // active control belongs to a group; reset on switch
  };

  // A horizontal strip of beauty-tool icons + a single slider for the active one.
  const renderToolDock = () => (
    <SafeAreaView edges={['bottom']} style={styles.dock}>
      {activeTool ? (
        <View style={styles.sliderBar}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderName}>{activeTool.label}</Text>
            <Text style={styles.sliderValue}>
              {(beautyValues[activeTool.key] as number).toFixed(0)}
            </Text>
          </View>
          <AppSlider
            style={{ width: '100%', height: 36 }}
            minimumValue={activeTool.min}
            maximumValue={activeTool.max}
            step={1}
            value={beautyValues[activeTool.key] as number}
            onValueChange={(v) => updateBeauty(activeTool.key, v)}
            onSlidingComplete={() => haptic.selection()}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={Colors.dark.border}
            thumbTintColor={Colors.white}
            disabled={activeTool.isPremium}
          />
          {activeTool.isPremium && (
            <Text style={styles.proHint}>This is a Premium tool — upgrade to unlock.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>Tap a tool below to start editing</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {groupTools.map((tool) => {
          const value = beautyValues[tool.key] as number;
          const isActive = activeBeautyKey === tool.key;
          return (
            <TouchableOpacity
              key={tool.key}
              onPress={() => { haptic.selection(); setActiveBeautyKey(isActive ? null : tool.key); }}
              activeOpacity={0.8}
              style={styles.chip}
            >
              <View style={[styles.chipIcon, isActive && styles.chipIconActive]}>
                <Ionicons name={tool.icon as any} size={22} color={isActive ? Colors.accent : Colors.text.muted} />
                {value !== 0 && <View style={styles.chipDot} />}
                {tool.isPremium && (
                  <View style={styles.chipPro}>
                    <Text style={styles.chipProText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.chipLabel, isActive && { color: Colors.accent }]} numberOfLines={1}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lip Color (Retouch only) */}
      {activeTab === 'retouch' && (
        <View style={styles.lipRow}>
          <Text style={styles.lipLabel}>Lip Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MAKEUP_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => { haptic.light(); updateBeauty('lipColor', beautyValues.lipColor === color ? null : color); }}
                style={[styles.colorSwatch, { backgroundColor: color }, beautyValues.lipColor === color && styles.colorSwatchActive]}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LinearGradient colors={Colors.gradients.gold} style={styles.headerIcon}>
              <Ionicons name="rose" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Beauty</Text>
          </View>
          <TouchableOpacity onPress={() => { haptic.medium(); resetBeauty(); }} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} disabled={isApplying} style={styles.doneBtn}>
            <LinearGradient colors={Colors.gradients.accent} style={styles.doneGradient}>
              <Text style={styles.doneText}>{isApplying ? 'Applying...' : 'Done'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => switchTab(t.id)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Ionicons name={t.icon as any} size={17} color={activeTab === t.id ? Colors.accent : Colors.text.muted} />
              <Text style={[styles.tabLabel, activeTab === t.id && { color: Colors.accent }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Live preview — beauty is applied to the ACTUAL image pixels (no overlay
          shapes). Skin smoothing softens + evens the skin; teeth/eye add subtle
          brightening/clarity. */}
      {activeTab !== 'face-guide' && currentUri && (
        <View style={styles.preview}>
          <EditorImage
            uri={currentUri}
            adjustments={adjustments}
            filter={activeFilter}
            filterIntensity={filterIntensity}
            beauty={beautyValues}
            radius={Layout.radius.xl}
          />
          {isApplying && (
            <View style={styles.applyingOverlay}>
              <Text style={styles.applyingText}>✦ Applying beauty…</Text>
            </View>
          )}
        </View>
      )}

      {/* Retouch / Reshape → compact horizontal tool dock. Face Guide → scroll. */}
      {activeTab === 'face-guide' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.faceGuideBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.faceGuideBannerText}>
              Select your face shape. We'll recommend the best beauty tools for you.
            </Text>
          </View>
          <View style={styles.shapeGrid}>
            {FACE_SHAPES.map((shape) => (
              <TouchableOpacity
                key={shape.id}
                onPress={() => { haptic.light(); setSelectedShape(selectedShape === shape.id ? null : shape.id); }}
                style={[styles.shapeCard, selectedShape === shape.id && styles.shapeCardActive]}
              >
                <Text style={{ fontSize: 28 }}>{shape.emoji}</Text>
                <Text style={[styles.shapeName, selectedShape === shape.id && { color: Colors.primary }]}>
                  {shape.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedShape && (() => {
            const shape = FACE_SHAPES.find((s) => s.id === selectedShape)!;
            return (
              <View style={styles.shapeDetail}>
                <Text style={styles.shapeDetailTitle}>{shape.emoji} {shape.name} Face</Text>
                <Text style={styles.shapeDetailDesc}>{shape.description}</Text>
                <Text style={styles.shapeDetailSubtitle}>💡 Personalized Tip</Text>
                <Text style={styles.shapeDetailTip}>{shape.tip}</Text>
                <Text style={styles.shapeDetailSubtitle}>⭐ Best Tools For You</Text>
                {shape.bestTools.map((toolName) => (
                  <View key={toolName} style={styles.recommendedTool}>
                    <LinearGradient colors={Colors.gradients.accent} style={styles.recommendedDot} />
                    <Text style={styles.recommendedToolText}>{toolName}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        haptic.light();
                        const tool = BEAUTY_TOOLS.find((t) => t.label === toolName);
                        switchTab(tool?.group === 'reshape' ? 'reshape' : 'retouch');
                        if (tool) setActiveBeautyKey(tool.key); // open ready to edit
                      }}
                      style={styles.goBtn}
                    >
                      <Text style={styles.goBtnText}>Open →</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })()}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        renderToolDock()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.dark.background },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerCenter:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  resetBtn:    { paddingHorizontal: 10, paddingVertical: 6 },
  resetText:   { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  doneBtn:     { borderRadius: Layout.radius.md, overflow: 'hidden' },
  doneGradient:{ paddingHorizontal: 16, paddingVertical: 8 },
  doneText:    { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  tabBar:      { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border },
  tab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabLabel:    { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted },

  preview: {
    flex: 1, marginHorizontal: 16, marginVertical: 10,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  previewImage: { width: '100%', height: '100%' },

  // Bottom controls dock (horizontal tool strip + single slider)
  dock: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
  },
  sliderBar:      { paddingHorizontal: 20, paddingTop: 8 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderName:     { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.accent },
  sliderValue:    { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, minWidth: 32, textAlign: 'right' },
  proHint:        { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  hint:           { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', paddingVertical: 14 },

  chipRow:        { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chip:           { alignItems: 'center', width: 70, gap: 4 },
  chipIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  chipIconActive: { borderColor: Colors.accent, backgroundColor: '#21101D' },
  chipDot:        { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  chipPro:        { position: 'absolute', bottom: 4, backgroundColor: Colors.dark.background, borderRadius: 4, paddingHorizontal: 4 },
  chipProText:    { fontSize: 7, fontFamily: 'Poppins_700Bold', color: Colors.accent },
  chipLabel:      { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted, textAlign: 'center' },

  lipRow:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 8 },
  lipLabel:       { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  // Centered face region (approximate — assumes a portrait with face in the upper-center)
  faceRegion: {
    position: 'absolute',
    top: '12%',
    left: '32%',
    right: '32%',
    height: '76%',
    alignItems: 'center',
  },
  faceOval: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
  },
  faceGuideOutline: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
  },
  eyeRow: {
    position: 'absolute',
    top: '30%',
    left: '12%',
    right: '12%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyeSpot: { width: '34%', height: 14, borderRadius: 8 },
  teethRegion: {
    position: 'absolute',
    top: '64%',
    left: '28%',
    right: '28%',
    height: 12,
    borderRadius: 6,
  },
  lipRegion: {
    position: 'absolute',
    top: '70%',
    left: '24%',
    right: '24%',
    height: 14,
    borderRadius: 10,
  },

  applyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  applyingText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 14, marginBottom: 16,
  },
  infoIcon:  { fontSize: 28 },
  infoText:  { flex: 1 },
  infoTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  infoDesc:  { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2, lineHeight: 16 },

  toolRow: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8,
  },
  toolHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolLabel:  { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  proBadge:   { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  toolValue:  { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.accent, minWidth: 28, textAlign: 'right' },

  colorSection: { marginTop: 8, marginBottom: 12 },
  colorTitle:   { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, marginBottom: 10 },
  colorSwatch:  { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: Colors.white },

  faceGuideBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#0C1916', borderRadius: Layout.radius.md,
    padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: Colors.primary,
  },
  faceGuideBannerText: { flex: 1, fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 18 },

  shapeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  shapeCard: {
    width: (Layout.window.width - 52) / 3,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 12, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  shapeCardActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  shapeName:       { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  shapeDetail: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl,
    padding: 16, gap: 8, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  shapeDetailTitle:    { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  shapeDetailDesc:     { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 20 },
  shapeDetailSubtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, marginTop: 4 },
  shapeDetailTip:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 19, backgroundColor: '#0C1715', borderRadius: Layout.radius.md, padding: 10 },

  recommendedTool: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  recommendedDot:  { width: 8, height: 8, borderRadius: 4 },
  recommendedToolText: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  goBtn:           { backgroundColor: '#0D2119', borderRadius: Layout.radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  goBtnText:       { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
});
