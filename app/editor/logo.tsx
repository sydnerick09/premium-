import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import AppSlider from '../../components/AppSlider';

// Original symbol set (emoji) — not copied from any other app.
const SYMBOLS = ['✦', '★', '◆', '❤️', '🔥', '🌿', '🍃', '☕', '🎯', '👑', '🐝', '🦊', '🚀', '💎', '🌙', '⚡', '🎨', '📷', '🏆', '🌊', '🧠', '🎵'];

type Bg = { id: string; kind: 'color' | 'gradient'; color?: string; colors?: [string, string] };
const BGS: Bg[] = [
  { id: 'night',  kind: 'gradient', colors: ['#0A0A0F', '#1E3A5F'] },
  { id: 'green',  kind: 'gradient', colors: ['#22C55E', '#059669'] },
  { id: 'grape',  kind: 'gradient', colors: ['#7C3AED', '#EC4899'] },
  { id: 'sunset', kind: 'gradient', colors: ['#FF6B6B', '#FFD93D'] },
  { id: 'ocean',  kind: 'gradient', colors: ['#0EA5E9', '#06B6D4'] },
  { id: 'black',  kind: 'color', color: '#0A0A0F' },
  { id: 'white',  kind: 'color', color: '#FFFFFF' },
  { id: 'gold',   kind: 'color', color: '#D4AF37' },
];
const TEXT_COLORS = ['#FFFFFF', '#000000', '#22C55E', '#F59E0B', '#EC4899', '#3B82F6', '#D4AF37'];

// Palette for the custom "color with percentages" background mixer.
const PALETTE = [
  '#0A0A0F', '#1E3A5F', '#22C55E', '#059669', '#0EA5E9', '#06B6D4',
  '#7C3AED', '#EC4899', '#FF6B6B', '#FFD93D', '#F59E0B', '#D4AF37', '#FFFFFF', '#111827',
];

// Brand/tagline font choices. Each chip's name is drawn IN its own typeface,
// and the chosen font applies to both the brand and the tagline on the canvas.
// `css` is the family used for both the chip preview and the rendered logo, so
// what you see on the chip is exactly what you get. Poppins is bundled; the rest
// are web-safe families that render on every browser.
const FONTS: { id: string; label: string; css: string; weight: string }[] = [
  { id: 'poppins',    label: 'Poppins',         css: '"Poppins_700Bold", sans-serif',          weight: '700' },
  { id: 'arial',      label: 'Arial',           css: 'Arial, sans-serif',                      weight: '700' },
  { id: 'helvetica',  label: 'Helvetica',       css: 'Helvetica, Arial, sans-serif',           weight: '700' },
  { id: 'verdana',    label: 'Verdana',         css: 'Verdana, Geneva, sans-serif',            weight: '700' },
  { id: 'tahoma',     label: 'Tahoma',          css: 'Tahoma, Geneva, sans-serif',             weight: '700' },
  { id: 'segoe',      label: 'Segoe UI',        css: '"Segoe UI", Tahoma, sans-serif',         weight: '700' },
  { id: 'calibri',    label: 'Calibri',         css: 'Calibri, Candara, sans-serif',           weight: '700' },
  { id: 'trebuchet',  label: 'Trebuchet MS',    css: '"Trebuchet MS", Helvetica, sans-serif',  weight: '700' },
  { id: 'gillsans',   label: 'Gill Sans',       css: '"Gill Sans", "Gill Sans MT", sans-serif', weight: '700' },
  { id: 'century',    label: 'Century Gothic',  css: '"Century Gothic", sans-serif',           weight: '700' },
  { id: 'franklin',   label: 'Franklin Gothic', css: '"Franklin Gothic Medium", sans-serif',   weight: '700' },
  { id: 'georgia',    label: 'Georgia',         css: 'Georgia, serif',                         weight: '700' },
  { id: 'times',      label: 'Times New Roman',  css: '"Times New Roman", Times, serif',        weight: '700' },
  { id: 'cambria',    label: 'Cambria',         css: 'Cambria, Georgia, serif',                weight: '700' },
  { id: 'garamond',   label: 'Garamond',        css: 'Garamond, "Times New Roman", serif',     weight: '700' },
  { id: 'palatino',   label: 'Palatino',        css: '"Palatino Linotype", Palatino, serif',   weight: '700' },
  { id: 'bookman',    label: 'Bookman',         css: '"Bookman Old Style", serif',             weight: '700' },
  { id: 'courier',    label: 'Courier New',     css: '"Courier New", Courier, monospace',      weight: '700' },
  { id: 'consolas',   label: 'Consolas',        css: 'Consolas, "Lucida Console", monospace',  weight: '700' },
  { id: 'lucida',     label: 'Lucida Console',  css: '"Lucida Console", Monaco, monospace',    weight: '700' },
  { id: 'impact',     label: 'Impact',          css: 'Impact, "Arial Narrow Bold", sans-serif', weight: '400' },
  { id: 'arialblack', label: 'Arial Black',     css: '"Arial Black", Gadget, sans-serif',      weight: '400' },
  { id: 'comic',      label: 'Comic Sans MS',   css: '"Comic Sans MS", cursive',               weight: '700' },
  { id: 'brush',      label: 'Brush Script',    css: '"Brush Script MT", cursive',             weight: '400' },
  { id: 'copperplate',label: 'Copperplate',     css: 'Copperplate, "Copperplate Gothic Light", serif', weight: '700' },
];

const SHAPES: { id: 'straight' | 'arcUp' | 'arcDown' | 'angled'; label: string; icon: string }[] = [
  { id: 'straight', label: 'Straight', icon: 'remove-outline' },
  { id: 'arcUp',    label: 'Arc Up',   icon: 'cloudy-outline' },
  { id: 'arcDown',  label: 'Arc Down', icon: 'cellular-outline' },
  { id: 'angled',   label: 'Angled',   icon: 'trending-up-outline' },
];

// Original, code-generated logo templates (no third-party assets).
const TEMPLATES: { id: string; label: string; icon: string }[] = [
  { id: 'badge',        label: 'Badge',    icon: 'ellipse-outline' },
  { id: 'monogram',     label: 'Monogram', icon: 'square-outline' },
  { id: 'lettercircle', label: 'Initials', icon: 'contrast-outline' },
  { id: 'crest',        label: 'Crest',    icon: 'shield-outline' },
  { id: 'hexagon',      label: 'Hexagon',  icon: 'cube-outline' },
  { id: 'ribbon',       label: 'Ribbon',   icon: 'flag-outline' },
  { id: 'minimal',      label: 'Minimal',  icon: 'remove-outline' },
  { id: 'classic',      label: 'Classic',  icon: 'sparkles-outline' },
];

export default function LogoScreen() {
  const user = useAuthStore((s) => s.user);
  const editorUri = useEditorStore((s) => s.currentUri);
  const createProject = useProjectStore((s) => s.createProject);

  const [template, setTemplate] = useState('badge');
  const [symbol, setSymbol] = useState('✦');
  // A photo picked from the gallery overrides the editor's current image.
  const [pickedPhoto, setPickedPhoto] = useState<string | null>(null);
  const photoUri = pickedPhoto ?? editorUri;
  const [usePhoto, setUsePhoto] = useState(!!photoUri);
  const [bg, setBg] = useState<Bg>(BGS[0]);
  const [brand, setBrand] = useState('BRAND');
  const [tagline, setTagline] = useState('YOUR TAGLINE');
  const [contact, setContact] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontId, setFontId] = useState('modern');
  const [shape, setShape] = useState<'straight' | 'arcUp' | 'arcDown' | 'angled'>('straight');

  // Custom "color with percentages" background.
  const [customMode, setCustomMode] = useState(false);
  const [colorA, setColorA] = useState('#22C55E');
  const [colorB, setColorB] = useState('#0A0A0F');
  const [mix, setMix] = useState(50); // % the first colour covers
  const [pickTarget, setPickTarget] = useState<'A' | 'B'>('A');

  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const reqId = useRef(0);

  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  const fontArg = { brand: font.css, tag: font.css, weight: font.weight };

  const bgArg = customMode
    ? { kind: 'gradient' as const, colors: [colorA, colorB] as [string, string], stop: mix / 100 }
    : bg.kind === 'gradient'
      ? { kind: 'gradient' as const, colors: bg.colors! }
      : { kind: 'color' as const, color: bg.color! };

  const pickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        haptic.success();
        setPickedPhoto(res.assets[0].uri);
        setUsePhoto(true);
      }
    } catch {
      Alert.alert('Photo', 'Could not open your gallery.');
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const myReq = ++reqId.current;
    setIsProcessing(true);
    imageProcessor.composeLogo({
      template,
      bg: bgArg,
      symbol: usePhoto ? undefined : symbol,
      photoUri,
      usePhoto,
      brand: brand.trim(),
      tagline: tagline.trim(),
      contact: contact.trim(),
      textColor,
      font: fontArg,
      textShape: shape,
    })
      .then((out) => { if (myReq === reqId.current) setResultUri(out); })
      .catch(() => {})
      .finally(() => { if (myReq === reqId.current) setIsProcessing(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, symbol, usePhoto, bg, brand, tagline, contact, textColor, photoUri,
      fontId, shape, customMode, colorA, colorB, mix]);

  const handleUse = () => {
    if (!resultUri || !user) { Alert.alert('Logo', 'Your logo is still rendering — try again in a second.'); return; }
    haptic.success();
    const project = createProject({
      userId: user.id,
      imageUri: resultUri,
      width: 1024,
      height: 1024,
      fileSize: 0,
      title: `${brand.trim() || 'Logo'} — Logo`,
    });
    router.replace({ pathname: '/editor', params: { id: project.id } });
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
              <Ionicons name="star" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Logo Maker</Text>
          </View>
          <TouchableOpacity onPress={handleUse} disabled={!resultUri} style={[styles.doneBtn, !resultUri && { opacity: 0.4 }]}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Use →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Preview */}
      <View style={styles.preview}>
        {resultUri ? (
          <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.empty}><Ionicons name="star-outline" size={44} color={Colors.text.muted} /></View>
        )}
        {isProcessing && <View style={styles.spinnerDot} />}
      </View>

      {/* Controls */}
      <ScrollView style={styles.dock} contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {/* Template */}
        <Text style={styles.sectionLabel}>Template</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TEMPLATES.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => { haptic.selection(); setTemplate(t.id); }} style={styles.symItem}>
              <View style={[styles.sym, template === t.id && styles.symActive]}>
                <Ionicons name={t.icon as any} size={22} color={template === t.id ? Colors.primary : Colors.text.muted} />
              </View>
              <Text style={[styles.symLabel, template === t.id && { color: Colors.primary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Brand + tagline + contact */}
        <View style={styles.inputs}>
          <TextInput value={brand} onChangeText={setBrand} placeholder="Brand name" placeholderTextColor={Colors.text.muted} style={styles.input} />
          <TextInput value={tagline} onChangeText={setTagline} placeholder="Tagline (optional)" placeholderTextColor={Colors.text.muted} style={styles.input} />
          <TextInput value={contact} onChangeText={setContact} placeholder="Phone / contact (optional)" placeholderTextColor={Colors.text.muted} style={styles.input} keyboardType="phone-pad" />
        </View>

        {/* Font */}
        <Text style={styles.sectionLabel}>Font</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {FONTS.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => { haptic.selection(); setFontId(f.id); }} style={styles.symItem}>
              <View style={[styles.fontChip, fontId === f.id && styles.symActive]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.fontChipText,
                    { fontFamily: f.css },
                    fontId === f.id && { color: Colors.primary },
                  ]}
                >
                  {f.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text shape */}
        <Text style={styles.sectionLabel}>Brand shape</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {SHAPES.map((sh) => (
            <TouchableOpacity key={sh.id} onPress={() => { haptic.selection(); setShape(sh.id); }} style={styles.symItem}>
              <View style={[styles.sym, shape === sh.id && styles.symActive]}>
                <Ionicons name={sh.icon as any} size={20} color={shape === sh.id ? Colors.primary : Colors.text.muted} />
              </View>
              <Text style={[styles.symLabel, shape === sh.id && { color: Colors.primary }]}>{sh.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Symbol / photo */}
        <Text style={styles.sectionLabel}>Symbol</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <TouchableOpacity onPress={pickFromGallery} style={styles.symItem}>
            <View style={[styles.sym, { borderStyle: 'dashed' }]}>
              <Ionicons name="add" size={24} color={Colors.text.muted} />
            </View>
            <Text style={styles.symLabel}>Gallery</Text>
          </TouchableOpacity>
          {photoUri ? (
            <TouchableOpacity onPress={() => { haptic.light(); setUsePhoto(true); }} style={styles.symItem}>
              <View style={[styles.sym, { overflow: 'hidden', padding: 0 }, usePhoto && styles.symActive]}>
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <Text style={[styles.symLabel, usePhoto && { color: Colors.primary }]}>Photo</Text>
            </TouchableOpacity>
          ) : null}
          {SYMBOLS.map((s) => (
            <TouchableOpacity key={s} onPress={() => { haptic.light(); setUsePhoto(false); setSymbol(s); }} style={styles.symItem}>
              <View style={[styles.sym, !usePhoto && symbol === s && styles.symActive]}>
                <Text style={{ fontSize: 24 }}>{s}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Background presets + custom toggle */}
        <Text style={styles.sectionLabel}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {BGS.map((b) => (
            <TouchableOpacity key={b.id} onPress={() => { haptic.light(); setCustomMode(false); setBg(b); }} style={styles.symItem}>
              {b.kind === 'gradient' ? (
                <LinearGradient colors={b.colors!} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.swatch, !customMode && bg.id === b.id && styles.symActive]} />
              ) : (
                <View style={[styles.swatch, { backgroundColor: b.color }, !customMode && bg.id === b.id && styles.symActive]} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => { haptic.light(); setCustomMode(true); }} style={styles.symItem}>
            <View style={[styles.swatch, styles.customSwatch, customMode && styles.symActive]}>
              <Ionicons name="color-palette" size={22} color={customMode ? Colors.primary : Colors.text.muted} />
            </View>
            <Text style={[styles.symLabel, customMode && { color: Colors.primary }]}>Custom</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Custom color mixer */}
        {customMode && (
          <View style={styles.customBox}>
            <View style={styles.mixHeaderRow}>
              <TouchableOpacity onPress={() => setPickTarget('A')} style={[styles.mixTab, pickTarget === 'A' && styles.mixTabActive]}>
                <View style={[styles.mixDot, { backgroundColor: colorA }]} />
                <Text style={styles.mixTabText}>Color A</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickTarget('B')} style={[styles.mixTab, pickTarget === 'B' && styles.mixTabActive]}>
                <View style={[styles.mixDot, { backgroundColor: colorB }]} />
                <Text style={styles.mixTabText}>Color B</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {PALETTE.map((c) => {
                const active = (pickTarget === 'A' ? colorA : colorB) === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { haptic.light(); pickTarget === 'A' ? setColorA(c) : setColorB(c); }}
                  >
                    <View style={[styles.dot, { backgroundColor: c }, active && styles.symActive]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.mixSliderRow}>
              <Text style={styles.mixPct}>A {mix}%</Text>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <AppSlider value={mix} minimumValue={5} maximumValue={95} step={1} onValueChange={setMix} />
              </View>
              <Text style={styles.mixPct}>B {100 - mix}%</Text>
            </View>
          </View>
        )}

        {/* Text color */}
        <Text style={styles.sectionLabel}>Text color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TEXT_COLORS.map((c) => (
            <TouchableOpacity key={c} onPress={() => { haptic.light(); setTextColor(c); }} style={styles.symItem}>
              <View style={[styles.dot, { backgroundColor: c }, textColor === c && styles.symActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
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

  preview: {
    height: 250, marginHorizontal: 16, marginVertical: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  spinnerDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  dock: { flex: 1, backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  inputs: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  input: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, height: 46,
    color: Colors.text.primary, fontFamily: 'Poppins_500Medium', fontSize: Layout.fontSize.base,
  },
  sectionLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, paddingHorizontal: 16, marginTop: 14 },
  row: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  symItem: { alignItems: 'center', gap: 4 },
  sym: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border,
  },
  symActive: { borderColor: Colors.primary, borderWidth: 3 },
  symLabel: { fontSize: 9, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  swatch: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.dark.border },
  customSwatch: { backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.dark.border },

  fontChip: {
    height: 52, paddingHorizontal: 16, borderRadius: 14, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border,
  },
  fontChipText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  customBox: {
    marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: Layout.radius.lg,
    backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border,
  },
  mixHeaderRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  mixTab: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Layout.radius.md, borderWidth: 1, borderColor: Colors.dark.border,
  },
  mixTabActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  mixDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: Colors.dark.border },
  mixTabText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },
  mixSliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  mixPct: { width: 52, fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, textAlign: 'center' },
});
