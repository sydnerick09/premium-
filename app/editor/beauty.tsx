import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../../store/editorStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
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
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<BeautyTab>('retouch');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const TABS = [
    { id: 'retouch'    as BeautyTab, label: 'Retouch',    icon: 'sparkles-outline' },
    { id: 'reshape'    as BeautyTab, label: 'Reshape',    icon: 'person-outline'   },
    { id: 'face-guide' as BeautyTab, label: 'Face Guide', icon: 'happy-outline'    },
  ];

  // Compute visual overlay effects from beauty values
  const smoothingOpacity  = beautyValues.skinSmoothing  / 400;   // subtle brightening
  const whiteningOpacity  = beautyValues.teethWhitening / 300;
  const eyeEnhanceOpacity = beautyValues.eyeEnhancement / 350;

  const handleDone = async () => {
    haptic.success();

    // Apply beauty effects: skin smoothing → slight brightness + saturation boost
    // In a production app, this would call a native facial processing pipeline
    const hasEffects = Object.values(beautyValues).some((v) =>
      typeof v === 'number' ? v !== 0 : v !== null
    );

    if (hasEffects && currentUri) {
      setIsApplying(true);
      try {
        // Translate beauty values into adjustment tweaks
        const skinSmooth  = beautyValues.skinSmoothing  / 100;
        const teethWhite  = beautyValues.teethWhitening / 100;
        const eyeEnhance  = beautyValues.eyeEnhancement / 100;

        // Apply as image-level adjustments (re-encode with quality improvement + blur for smoothing)
        const actions: any[] = [];
        // Slight downsample + upsample simulates softening pass
        if (skinSmooth > 0.1) {
          const { width } = await imageProcessor.getImageSize(currentUri);
          actions.push({ resize: { width: Math.round(width * 0.92) } });
          actions.push({ resize: { width } });
        }

        const uri = actions.length > 0
          ? await imageProcessor.applyOperations(currentUri, actions, 0.97)
          : currentUri;

        // Push adjustment tweaks to the store so the canvas overlay shows them
        setAdjustments({
          brightness:  Math.round(skinSmooth  * 8 + teethWhite * 12),
          saturation:  Math.round(eyeEnhance  * 10),
          clarity:     Math.round(eyeEnhance  * 20),
          sharpness:   Math.round(eyeEnhance  * 15),
        });

        if (uri !== currentUri) {
          setCurrentUri(uri, 'Beauty Applied');
          pushHistory('Beauty Applied', uri);
        }
      } catch { haptic.error(); }
      finally { setIsApplying(false); }
    }

    router.back();
  };

  const renderSliders = (group: 'retouch' | 'reshape') =>
    BEAUTY_TOOLS.filter((t) => t.group === group).map((tool) => {
      const value = beautyValues[tool.key] as number;
      return (
        <View key={tool.key} style={styles.toolRow}>
          <View style={styles.toolHeader}>
            <Ionicons name={tool.icon as any} size={18} color={Colors.accent} />
            <Text style={styles.toolLabel}>{tool.label}</Text>
            {tool.isPremium && (
              <LinearGradient colors={Colors.gradients.gold} style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </LinearGradient>
            )}
            <Text style={styles.toolValue}>{(value as number).toFixed(0)}</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 36 }}
            minimumValue={tool.min}
            maximumValue={tool.max}
            step={1}
            value={value}
            onValueChange={(v) => updateBeauty(tool.key, v)}
            onSlidingComplete={() => haptic.selection()}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={Colors.dark.border}
            thumbTintColor={Colors.white}
            disabled={tool.isPremium}
          />
        </View>
      );
    });

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
              onPress={() => setActiveTab(t.id)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Ionicons name={t.icon as any} size={17} color={activeTab === t.id ? Colors.accent : Colors.text.muted} />
              <Text style={[styles.tabLabel, activeTab === t.id && { color: Colors.accent }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Live preview with beauty overlays — effects target the centered face region */}
      {currentUri && (
        <View style={styles.preview}>
          <Image source={{ uri: currentUri }} style={styles.previewImage} contentFit="contain" />

          {/* Face-region container: beauty effects are confined here (upper-center, oval)
              so they target the face instead of the whole image. */}
          <View pointerEvents="none" style={styles.faceRegion}>
            {/* Skin smoothing: warm soft-light overlay (whole face oval) */}
            {smoothingOpacity > 0 && (
              <View style={[styles.faceOval, { backgroundColor: `rgba(255,225,195,${Math.min(smoothingOpacity * 1.6, 0.45)})` }]} />
            )}

            {/* Teeth whitening: localized bright patch over the mouth area */}
            {whiteningOpacity > 0 && (
              <View style={[styles.teethRegion, { backgroundColor: `rgba(255,255,255,${Math.min(whiteningOpacity * 2.2, 0.7)})` }]} />
            )}

            {/* Eye enhancement: two bright spots over the eye area */}
            {eyeEnhanceOpacity > 0 && (
              <View style={styles.eyeRow}>
                <View style={[styles.eyeSpot, { backgroundColor: `rgba(180,220,255,${Math.min(eyeEnhanceOpacity * 2.5, 0.6)})` }]} />
                <View style={[styles.eyeSpot, { backgroundColor: `rgba(180,220,255,${Math.min(eyeEnhanceOpacity * 2.5, 0.6)})` }]} />
              </View>
            )}

            {/* Lip color: localized tint over the lip area */}
            {beautyValues.lipColor && (
              <View style={[styles.lipRegion, { backgroundColor: beautyValues.lipColor + 'AA' }]} />
            )}
          </View>

          {/* Guide outline so the user sees where the face region is targeted */}
          {(smoothingOpacity > 0 || whiteningOpacity > 0 || eyeEnhanceOpacity > 0 || beautyValues.lipColor) && (
            <View pointerEvents="none" style={[styles.faceRegion]}>
              <View style={styles.faceGuideOutline} />
            </View>
          )}

          {/* Processing indicator */}
          {isApplying && (
            <View style={styles.applyingOverlay}>
              <Text style={styles.applyingText}>✦ Applying beauty to face...</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── RETOUCH ──────────────────────────── */}
        {activeTab === 'retouch' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💎</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Natural Skin Retouching</Text>
                <Text style={styles.infoDesc}>
                  AI-powered tools that keep your photo authentic — no over-processed looks.
                </Text>
              </View>
            </View>
            {renderSliders('retouch')}
            <View style={styles.colorSection}>
              <Text style={styles.colorTitle}>Lip Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {MAKEUP_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => { haptic.light(); updateBeauty('lipColor', beautyValues.lipColor === color ? null : color); }}
                    style={[styles.colorSwatch, { backgroundColor: color }, beautyValues.lipColor === color && styles.colorSwatchActive]}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* ── RESHAPE ─────────────────────────── */}
        {activeTab === 'reshape' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>✨</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Face Reshaping</Text>
                <Text style={styles.infoDesc}>
                  Slim your face, refine your nose, and resize your eyes naturally.
                </Text>
              </View>
            </View>
            {renderSliders('reshape')}
          </>
        )}

        {/* ── FACE GUIDE ──────────────────────── */}
        {activeTab === 'face-guide' && (
          <>
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
                          setActiveTab(
                            toolName === 'Face Slim' || toolName === 'Nose Slim' || toolName === 'Eye Size'
                              ? 'reshape' : 'retouch'
                          );
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
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    height: 160, marginHorizontal: 16, marginTop: 10,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  previewImage: { width: '100%', height: '100%' },

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
    backgroundColor: `${Colors.primary}15`, borderRadius: Layout.radius.md,
    padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: `${Colors.primary}35`,
  },
  faceGuideBannerText: { flex: 1, fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 18 },

  shapeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  shapeCard: {
    width: (Layout.window.width - 52) / 3,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 12, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  shapeCardActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}14` },
  shapeName:       { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  shapeDetail: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl,
    padding: 16, gap: 8, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  shapeDetailTitle:    { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  shapeDetailDesc:     { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 20 },
  shapeDetailSubtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, marginTop: 4 },
  shapeDetailTip:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 19, backgroundColor: `${Colors.primary}12`, borderRadius: Layout.radius.md, padding: 10 },

  recommendedTool: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  recommendedDot:  { width: 8, height: 8, borderRadius: 4 },
  recommendedToolText: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  goBtn:           { backgroundColor: `${Colors.primary}20`, borderRadius: Layout.radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  goBtnText:       { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
});
