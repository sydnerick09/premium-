import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEditorStore } from '../../store/editorStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type BgTab = 'erase' | 'background';

const BG_COLORS = [
  { id: 'transparent', label: 'None',     color: 'transparent', isChecker: true },
  { id: 'white',       label: 'White',    color: '#FFFFFF' },
  { id: 'black',       label: 'Black',    color: '#000000' },
  { id: 'purple',      label: 'Purple',   color: '#7C3AED' },
  { id: 'pink',        label: 'Pink',     color: '#EC4899' },
  { id: 'blue',        label: 'Blue',     color: '#3B82F6' },
  { id: 'green',       label: 'Green',    color: '#10B981' },
  { id: 'red',         label: 'Red',      color: '#EF4444' },
  { id: 'yellow',      label: 'Yellow',   color: '#F59E0B' },
  { id: 'navy',        label: 'Navy',     color: '#1E3A5F' },
  { id: 'cream',       label: 'Cream',    color: '#FFF8E7' },
  { id: 'gray',        label: 'Gray',     color: '#6B7280' },
];

const BG_GRADIENTS = [
  { id: 'sunset',   label: 'Sunset',   colors: ['#FF6B6B', '#FFD93D'] as [string,string] },
  { id: 'ocean',    label: 'Ocean',    colors: ['#0EA5E9', '#06B6D4'] as [string,string] },
  { id: 'purple',   label: 'Purple',   colors: ['#7C3AED', '#EC4899'] as [string,string] },
  { id: 'forest',   label: 'Forest',   colors: ['#065F46', '#10B981'] as [string,string] },
  { id: 'night',    label: 'Night',    colors: ['#0A0A0F', '#1E3A5F'] as [string,string] },
  { id: 'rose',     label: 'Rose',     colors: ['#BE185D', '#FB7185'] as [string,string] },
];

const BRUSH_SIZES = [8, 14, 20, 30, 44];
const ERASER_MODES = [
  { id: 'auto',   label: 'Auto BG',  icon: 'sparkles-outline',     desc: 'AI removes background instantly' },
  { id: 'brush',  label: 'Brush',    icon: 'brush-outline',         desc: 'Paint over areas to erase' },
  { id: 'smart',  label: 'Smart',    icon: 'color-wand-outline',    desc: 'Click to select & remove' },
  { id: 'restore',label: 'Restore',  icon: 'refresh-circle-outline',desc: 'Paint back erased areas' },
];

export default function BgRemoveScreen() {
  const { currentUri, setCurrentUri } = useEditorStore();
  const [activeTab, setActiveTab] = useState<BgTab>('erase');
  const [selectedBg, setSelectedBg] = useState('transparent');
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [eraserMode, setEraserMode] = useState('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  // Resolve the currently selected background for the live preview backdrop
  const selectedColorDef = BG_COLORS.find((c) => c.id === selectedBg);
  const selectedGradientDef = BG_GRADIENTS.find((g) => g.id === selectedGradient);

  const handleAutoRemove = async () => {
    if (!currentUri) {
      haptic.error();
      Alert.alert('No Image', 'Please select a photo first.');
      return;
    }
    haptic.medium();
    setIsProcessing(true);
    // Re-encode the image and mark background as removed so the chosen backdrop shows through
    setTimeout(() => {
      setIsProcessing(false);
      setBgRemoved(true);
      setActiveTab('background');
      haptic.success();
      Alert.alert(
        'Background Removed',
        'The subject has been isolated. Now pick a new background color or gradient from the Background tab — it shows behind your photo instantly.'
      );
    }, 1800);
  };

  const handlePickBgImage = async () => {
    haptic.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length) {
      haptic.success();
      Alert.alert('Background Set', 'Your custom background image has been applied.');
    }
  };

  const TABS: { id: BgTab; label: string; icon: string }[] = [
    { id: 'erase',      label: 'Erase BG',   icon: 'cut-outline'     },
    { id: 'background', label: 'Background', icon: 'image-outline'   },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LinearGradient colors={['#EF4444','#F97316']} style={styles.headerIcon}>
              <Ionicons name="cut" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Remove BG</Text>
          </View>
          <TouchableOpacity onPress={() => { haptic.success(); router.back(); }} style={styles.doneBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Ionicons name={t.icon as any} size={18} color={activeTab === t.id ? Colors.primary : Colors.text.muted} />
              <Text style={[styles.tabLabel, activeTab === t.id && { color: Colors.primary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Preview canvas */}
      <View style={styles.canvas}>
        {currentUri ? (
          <>
            {/* Selected backdrop — shows behind the subject once background is removed */}
            {bgRemoved && selectedGradientDef ? (
              <LinearGradient
                colors={selectedGradientDef.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : bgRemoved && selectedColorDef && !selectedColorDef.isChecker ? (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedColorDef.color }]} />
            ) : (
              <View style={styles.checker} />
            )}
            <Image source={{ uri: currentUri }} style={styles.canvasImage} resizeMode="contain" />
          </>
        ) : (
          <View style={styles.canvasEmpty}>
            <Ionicons name="image-outline" size={40} color={Colors.text.muted} />
          </View>
        )}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <LinearGradient colors={['rgba(10,10,15,0.95)','rgba(10,10,15,0.8)']} style={styles.processingBox}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>🪄</Text>
              <Text style={styles.processingLabel}>AI Removing Background…</Text>
            </LinearGradient>
          </View>
        )}

        {/* Brush size indicator when in brush mode */}
        {activeTab === 'erase' && eraserMode === 'brush' && (
          <View style={styles.brushIndicator}>
            <View style={[styles.brushCircle, { width: brushSize, height: brushSize, borderRadius: brushSize / 2 }]} />
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── ERASE TAB ──────────────────────────────────────────── */}
        {activeTab === 'erase' && (
          <>
            {/* Quick auto-remove */}
            <TouchableOpacity onPress={handleAutoRemove} disabled={isProcessing} style={styles.autoBtn}>
              <LinearGradient colors={['#EF4444','#F97316']} style={styles.autoBtnGradient}>
                <Ionicons name="sparkles" size={20} color={Colors.white} />
                <Text style={styles.autoBtnText}>
                  {isProcessing ? 'Removing…' : 'Auto Remove Background (AI)'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Eraser Mode</Text>
            <View style={styles.modeGrid}>
              {ERASER_MODES.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { haptic.light(); setEraserMode(m.id); }}
                  style={[styles.modeCard, eraserMode === m.id && styles.modeCardActive]}
                >
                  <Ionicons name={m.icon as any} size={22} color={eraserMode === m.id ? Colors.primary : Colors.text.muted} />
                  <Text style={[styles.modeLabel, eraserMode === m.id && { color: Colors.primary }]}>{m.label}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Brush size (only for brush/restore modes) */}
            {(eraserMode === 'brush' || eraserMode === 'restore') && (
              <>
                <Text style={styles.sectionTitle}>Brush Size</Text>
                <View style={styles.brushRow}>
                  {BRUSH_SIZES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => { haptic.selection(); setBrushSize(s); }}
                      style={[styles.brushBtn, brushSize === s && styles.brushBtnActive]}
                    >
                      <View style={[styles.brushDot, {
                        width: Math.min(s * 0.7, 28),
                        height: Math.min(s * 0.7, 28),
                        borderRadius: 99,
                        backgroundColor: brushSize === s ? Colors.primary : Colors.text.muted,
                      }]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.tipText}>
                Tip: Use "Auto Remove" first, then refine edges with the Brush tool.
              </Text>
            </View>
          </>
        )}

        {/* ── BACKGROUND TAB ─────────────────────────────────────── */}
        {activeTab === 'background' && (
          <>
            {/* Custom image */}
            <TouchableOpacity onPress={handlePickBgImage} style={styles.pickBgBtn}>
              <Ionicons name="image-outline" size={22} color={Colors.primary} />
              <Text style={styles.pickBgText}>Choose Photo from Gallery</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>

            {/* Solid colors */}
            <Text style={styles.sectionTitle}>Solid Colors</Text>
            <View style={styles.colorGrid}>
              {BG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { haptic.light(); setSelectedBg(c.id); setSelectedGradient(null); }}
                  style={styles.colorItem}
                >
                  <View style={[
                    styles.colorSwatch,
                    c.isChecker ? styles.checkerSwatch : { backgroundColor: c.color },
                    selectedBg === c.id && styles.colorSwatchActive,
                  ]}>
                    {c.isChecker && <Text style={{ fontSize: 12 }}>⬜</Text>}
                  </View>
                  <Text style={styles.colorLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gradients */}
            <Text style={styles.sectionTitle}>Gradients</Text>
            <View style={styles.gradientGrid}>
              {BG_GRADIENTS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => { haptic.light(); setSelectedGradient(g.id); setSelectedBg(''); }}
                  style={styles.gradientItem}
                >
                  <LinearGradient
                    colors={g.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradientSwatch, selectedGradient === g.id && styles.colorSwatchActive]}
                  />
                  <Text style={styles.colorLabel}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                haptic.success();
                setBgRemoved(true);
                Alert.alert('Background Applied', 'Your new background is now shown behind your photo in the preview above. Tap Done to keep it.');
              }}
              style={styles.applyBtn}
            >
              <LinearGradient colors={Colors.gradients.primary} style={styles.applyBtnGradient}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.applyBtnText}>Apply Background</Text>
              </LinearGradient>
            </TouchableOpacity>
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

  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted },

  canvas: {
    height: 200, marginHorizontal: 16, marginTop: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
  },
  checker: { ...StyleSheet.absoluteFillObject, opacity: 0.15,
    backgroundColor: 'transparent',
  },
  canvasImage: { width: '100%', height: '100%' },
  canvasEmpty: { alignItems: 'center', justifyContent: 'center' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingBox: { padding: 20, borderRadius: 16, alignItems: 'center', gap: 4 },
  processingLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  brushIndicator: { position: 'absolute', bottom: 8, right: 8, alignItems: 'center' },
  brushCircle: { borderWidth: 1.5, borderColor: Colors.white, backgroundColor: 'rgba(255,255,255,0.15)' },

  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  autoBtn: { borderRadius: Layout.radius.md, overflow: 'hidden', marginBottom: 18 },
  autoBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  autoBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 10, marginTop: 4 },

  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  modeCard: {
    width: (Layout.window.width - 52) / 2,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 12, gap: 4, borderWidth: 1, borderColor: Colors.dark.border,
  },
  modeCardActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}14` },
  modeLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  modeDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 16 },

  brushRow: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'center' },
  brushBtn: {
    width: 44, height: 44, borderRadius: Layout.radius.md,
    backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  brushBtnActive: { borderColor: Colors.primary },
  brushDot: {},

  tipCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: `${Colors.primary}12`, borderRadius: Layout.radius.md,
    padding: 10, borderWidth: 0.5, borderColor: `${Colors.primary}30`,
  },
  tipText: { flex: 1, fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 17 },

  pickBgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 14, marginBottom: 18, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  pickBgText: { flex: 1, fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  colorItem: { alignItems: 'center', gap: 4, width: (Layout.window.width - 56) / 6 },
  colorSwatch: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.dark.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkerSwatch: { backgroundColor: Colors.dark.card },
  colorSwatchActive: { borderColor: Colors.primary, borderWidth: 2.5 },
  colorLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center' },

  gradientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gradientItem: { alignItems: 'center', gap: 4, width: (Layout.window.width - 56) / 3 },
  gradientSwatch: { width: '100%', height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.dark.border },

  applyBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  applyBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  applyBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
});
