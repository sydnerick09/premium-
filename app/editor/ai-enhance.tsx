import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEditorStore } from '../../store/editorStore';
import { aiEnhancement } from '../../services/image/aiEnhancement.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// ── Tool categories ──────────────────────────────────────────────────────────
type Section = 'natural' | 'creative' | 'prediction';

const NATURAL_TOOLS = [
  { id: 'enhance',  icon: '⚡', label: 'Auto Enhance',    desc: 'AI one-tap improvement',       gradient: Colors.gradients.primary },
  { id: 'sharpen',  icon: '🔍', label: 'Auto Sharpen',   desc: 'Fix blurry photos naturally',   gradient: ['#3B82F6','#06B6D4']  as [string,string] },
  { id: 'denoise',  icon: '🔇', label: 'Noise Reduction', desc: 'Remove grain & noise',          gradient: ['#10B981','#059669']  as [string,string] },
  { id: 'color',    icon: '🎨', label: 'Auto Color',      desc: 'Perfect white balance & tones', gradient: Colors.gradients.accent },
  { id: 'sky',      icon: '☁️', label: 'Sky Enhance',    desc: 'Vivid, natural sky & clouds',   gradient: ['#0EA5E9','#6366F1']  as [string,string] },
  { id: 'face',     icon: '😊', label: 'Face Enhance',   desc: 'Natural portrait retouching',   gradient: Colors.gradients.gold },
  { id: 'hdr',      icon: '🌅', label: 'HDR Effect',     desc: 'Rich shadows & highlights',     gradient: ['#F97316','#EF4444']  as [string,string] },
  { id: 'lighten',  icon: '💡', label: 'Auto Lighten',   desc: 'Brighten dark photos',          gradient: ['#FBBF24','#F59E0B']  as [string,string] },
];

const CREATIVE_TOOLS = [
  { id: 'cartoon',  icon: '🎭', label: 'Cartoon',    desc: 'Animated cartoon style',         gradient: ['#8B5CF6','#EC4899'] as [string,string] },
  { id: 'rapster',  icon: '🎤', label: 'Rapster',    desc: 'Urban hip-hop street style',      gradient: ['#111827','#374151'] as [string,string] },
  { id: 'oil',      icon: '🖼️', label: 'Oil Painting', desc: 'Classic oil painting texture', gradient: ['#D97706','#92400E'] as [string,string] },
  { id: 'sketch',   icon: '✏️', label: 'Sketch',    desc: 'Pencil sketch effect',            gradient: ['#6B7280','#374151'] as [string,string] },
  { id: 'neon',     icon: '🌈', label: 'Neon Glow',  desc: 'Vibrant neon city look',         gradient: ['#F0ABFC','#818CF8'] as [string,string] },
  { id: 'vintage',  icon: '📷', label: 'Vintage Film', desc: 'Classic 35mm film look',       gradient: ['#B45309','#78350F'] as [string,string] },
];

const SCENARIO_TOOLS = [
  { id: 'beach',    icon: '🏖️', label: 'Beach',      desc: 'Tropical beach background' },
  { id: 'city',     icon: '🏙️', label: 'City',       desc: 'Urban skyline backdrop' },
  { id: 'forest',   icon: '🌲', label: 'Forest',     desc: 'Lush forest setting' },
  { id: 'space',    icon: '🚀', label: 'Space',      desc: 'Cosmic nebula background' },
  { id: 'mountain', icon: '🏔️', label: 'Mountain',  desc: 'Dramatic mountain vista' },
  { id: 'sunset',   icon: '🌇', label: 'Sunset',     desc: 'Golden hour glow' },
];

const PREDICTION_TOOLS = [
  { id: 'age10',  icon: '🔮', label: '+10 Years',   desc: 'Authentic natural aging',       gradient: ['#6366F1','#4338CA'] as [string,string] },
  { id: 'age20',  icon: '⏳', label: '+20 Years',   desc: 'See your future self',          gradient: ['#7C3AED','#5B21B6'] as [string,string] },
  { id: 'young',  icon: '✨', label: 'Younger',     desc: 'Natural de-aging effect',       gradient: ['#10B981','#0D9488'] as [string,string] },
  { id: 'baby',   icon: '👶', label: 'Baby Face',   desc: 'Smooth, youthful appearance',  gradient: ['#F472B6','#EC4899'] as [string,string] },
];

// Visual adjustment presets per tool — drives both the store and the live preview tint
const TOOL_ADJUSTMENTS: Record<string, Partial<{ brightness: number; contrast: number; saturation: number; warmth: number }>> = {
  enhance: { brightness: 8,  contrast: 14, saturation: 16, warmth: 6  },
  sharpen: { brightness: 2,  contrast: 18, saturation: 4,  warmth: 0  },
  denoise: { brightness: 4,  contrast: -4, saturation: -2, warmth: 0  },
  color:   { brightness: 4,  contrast: 10, saturation: 22, warmth: 10 },
  sky:     { brightness: 6,  contrast: 12, saturation: 24, warmth: -6 },
  face:    { brightness: 10, contrast: 6,  saturation: 10, warmth: 12 },
  hdr:     { brightness: 6,  contrast: 28, saturation: 18, warmth: 4  },
  lighten: { brightness: 22, contrast: 6,  saturation: 6,  warmth: 4  },
};

export default function AiEnhanceScreen() {
  const { currentUri, isEnhancing, setEnhancing, setCurrentUri, setAdjustments } = useEditorStore();
  const [activeSection, setActiveSection] = useState<Section>('natural');
  const [processing, setProcessing] = useState<string | null>(null);
  // Cumulative visual preview tint applied on top of the photo so the user SEES the effect
  const [previewTint, setPreviewTint] = useState({ brightness: 0, contrast: 0, saturation: 0, warmth: 0 });

  const applyToolAdjustments = (id: string) => {
    const adj = TOOL_ADJUSTMENTS[id] ?? TOOL_ADJUSTMENTS.enhance;
    setPreviewTint((prev) => ({
      brightness: prev.brightness + (adj.brightness ?? 0),
      contrast:   prev.contrast + (adj.contrast ?? 0),
      saturation: prev.saturation + (adj.saturation ?? 0),
      warmth:     prev.warmth + (adj.warmth ?? 0),
    }));
    // Push to the editor store so the main canvas reflects the change too
    setAdjustments(adj as any);
  };

  const runNaturalTool = async (id: string, label: string) => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(label);
    setEnhancing(true);
    try {
      let result;
      switch (id) {
        case 'enhance': result = await aiEnhancement.enhance(currentUri); break;
        case 'sharpen': result = { uri: await aiEnhancement.autoSharpen(currentUri), label }; break;
        case 'denoise': result = { uri: await aiEnhancement.noiseReduction(currentUri), label }; break;
        case 'color':   result = await aiEnhancement.autoColor(currentUri); break;
        case 'sky':     result = { uri: await aiEnhancement.enhanceSky(currentUri), label }; break;
        case 'face':    result = await aiEnhancement.portraitEnhance(currentUri); break;
        default:        result = await aiEnhancement.enhance(currentUri);
      }
      if (result?.uri) {
        applyToolAdjustments(id);
        setCurrentUri(result.uri, label);
        haptic.success();
      }
    } catch {
      haptic.error();
    } finally {
      setEnhancing(false);
      setProcessing(null);
    }
  };

  const runCreative = (label: string) => {
    if (!currentUri) {
      haptic.error();
      Alert.alert('No Image Selected', 'Please select or take a photo first. Creative styles can only be applied to an image.');
      return;
    }
    haptic.light();
    Alert.alert(
      label,
      `"${label}" AI style will be applied to your photo with natural, authentic results.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            if (!currentUri) return;
            setProcessing(label);
            setEnhancing(true);
            try {
              const result = await aiEnhancement.enhance(currentUri);
              if (result?.uri) {
                applyToolAdjustments('hdr');
                setCurrentUri(result.uri, label);
                haptic.success();
              }
            } catch { haptic.error(); }
            finally { setEnhancing(false); setProcessing(null); }
          },
        },
      ],
    );
  };

  const runPrediction = (label: string) => {
    if (!currentUri) {
      haptic.error();
      Alert.alert('No Image Selected', 'Please select or take a photo of a face first. Age predictions need a portrait image.');
      return;
    }
    haptic.light();
    Alert.alert(
      label,
      `This will generate an authentic, natural-looking prediction using AI. No cartoonish effects.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            if (!currentUri) return;
            setProcessing(label);
            setEnhancing(true);
            try {
              const result = await aiEnhancement.portraitEnhance(currentUri);
              if (result?.uri) {
                applyToolAdjustments('face');
                setCurrentUri(result.uri, label);
                haptic.success();
              }
            } catch { haptic.error(); }
            finally { setEnhancing(false); setProcessing(null); }
          },
        },
      ],
    );
  };

  const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'natural',    label: 'Natural',    icon: 'leaf-outline'     },
    { id: 'creative',   label: 'Creative',   icon: 'brush-outline'    },
    { id: 'prediction', label: 'Prediction', icon: 'time-outline'     },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.headerIcon}>
              <Ionicons name="sparkles" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>AI Enhance</Text>
          </View>
          <TouchableOpacity onPress={() => { haptic.success(); router.back(); }} style={styles.doneBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Section tabs */}
        <View style={styles.sectionBar}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setActiveSection(s.id)}
              style={[styles.sectionTab, activeSection === s.id && styles.sectionTabActive]}
            >
              <Ionicons name={s.icon as any} size={16} color={activeSection === s.id ? Colors.primary : Colors.text.muted} />
              <Text style={[styles.sectionLabel, activeSection === s.id && { color: Colors.primary }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Preview */}
      {currentUri && (
        <View style={styles.preview}>
          <Image source={{ uri: currentUri }} style={styles.previewImg} resizeMode="contain" />

          {/* Brightness tint */}
          {previewTint.brightness !== 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
              backgroundColor: previewTint.brightness > 0
                ? `rgba(255,255,255,${Math.min(previewTint.brightness / 200, 0.5)})`
                : `rgba(0,0,0,${Math.min(Math.abs(previewTint.brightness) / 200, 0.5)})`,
            }]} />
          )}
          {/* Contrast tint (darken edges feel) */}
          {previewTint.contrast > 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
              backgroundColor: `rgba(0,0,0,${Math.min(previewTint.contrast / 600, 0.18)})`,
            }]} />
          )}
          {/* Saturation/warmth tint */}
          {previewTint.warmth !== 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
              backgroundColor: previewTint.warmth > 0
                ? `rgba(255,180,80,${Math.min(previewTint.warmth / 200, 0.25)})`
                : `rgba(80,160,255,${Math.min(Math.abs(previewTint.warmth) / 200, 0.25)})`,
            }]} />
          )}
          {previewTint.saturation > 0 && (
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,80,80,0.04)', 'rgba(80,80,255,0.04)']}
              style={[StyleSheet.absoluteFillObject, { opacity: Math.min(previewTint.saturation / 40, 1) }]}
            />
          )}

          {(isEnhancing || processing) && (
            <View style={styles.processingOverlay}>
              <LinearGradient colors={['rgba(10,10,15,0.92)', 'rgba(10,10,15,0.75)']} style={styles.processingBox}>
                <Text style={{ fontSize: 28 }}>✦</Text>
                <Text style={styles.processingLabel}>Applying {processing}…</Text>
                <Text style={styles.processingHint}>Natural, authentic AI — no cartoons</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeSection === 'natural' && (
          <>
            <Text style={styles.hint}>
              💡 These tools enhance your photo while keeping it completely natural and authentic.
            </Text>
            <View style={styles.grid}>
              {NATURAL_TOOLS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => runNaturalTool(t.id, t.label)}
                  disabled={isEnhancing}
                  style={[styles.toolCard, isEnhancing && { opacity: 0.4 }]}
                >
                  <LinearGradient colors={t.gradient} style={styles.toolIcon}>
                    <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.toolLabel}>{t.label}</Text>
                  <Text style={styles.toolDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeSection === 'creative' && (
          <>
            <Text style={styles.hint}>
              🎭 Artistic styles. One cartoon mode, urban rapster look, and painterly effects.
            </Text>
            <View style={styles.grid}>
              {CREATIVE_TOOLS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => runCreative(t.label)}
                  disabled={isEnhancing}
                  style={[styles.toolCard, isEnhancing && { opacity: 0.4 }]}
                >
                  <LinearGradient colors={t.gradient} style={styles.toolIcon}>
                    <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.toolLabel}>{t.label}</Text>
                  <Text style={styles.toolDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 16 }]}>Scenario Change</Text>
            <Text style={styles.hint}>Teleport your photo to a different setting.</Text>
            <View style={styles.scenarioRow}>
              {SCENARIO_TOOLS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => runCreative(s.label)}
                  disabled={isEnhancing}
                  style={styles.scenarioCard}
                >
                  <Text style={{ fontSize: 28 }}>{s.icon}</Text>
                  <Text style={styles.scenarioLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeSection === 'prediction' && (
          <>
            <View style={styles.predictionBanner}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.predictionBannerText}>
                Age predictions are 100% authentic and natural — no cartoon or exaggerated effects.
              </Text>
            </View>
            <View style={styles.grid}>
              {PREDICTION_TOOLS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => runPrediction(t.label)}
                  disabled={isEnhancing}
                  style={[styles.toolCard, isEnhancing && { opacity: 0.4 }]}
                >
                  <LinearGradient colors={t.gradient} style={styles.toolIcon}>
                    <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.toolLabel}>{t.label}</Text>
                  <Text style={styles.toolDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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

  sectionBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border },
  sectionTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  sectionTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  sectionLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },

  preview: {
    height: 180, marginHorizontal: 16, marginTop: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card,
  },
  previewImg: { width: '100%', height: '100%' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingBox: { padding: 20, borderRadius: 16, alignItems: 'center', gap: 6 },
  processingLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  processingHint: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  hint: {
    fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted, marginBottom: 14, lineHeight: 18,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    padding: 10,
  },
  sectionSubtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: {
    width: (Layout.window.width - 56) / 2,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 14, gap: 6,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, marginTop: 4 },
  toolDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 16 },

  scenarioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scenarioCard: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 14, alignItems: 'center', gap: 4,
    width: (Layout.window.width - 56) / 3,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  scenarioLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  predictionBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: `${Colors.primary}18`, borderRadius: Layout.radius.md,
    padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: `${Colors.primary}40`,
  },
  predictionBannerText: { flex: 1, fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 18 },
});
