import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { useEditorStore } from '../../store/editorStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type BgDef =
  | { id: string; label: string; kind: 'color'; color: string }
  | { id: string; label: string; kind: 'gradient'; colors: [string, string] };

const BG_COLORS: BgDef[] = [
  { id: 'white',  label: 'White',  kind: 'color', color: '#FFFFFF' },
  { id: 'black',  label: 'Black',  kind: 'color', color: '#000000' },
  { id: 'green',  label: 'Green',  kind: 'color', color: '#22C55E' },
  { id: 'blue',   label: 'Blue',   kind: 'color', color: '#3B82F6' },
  { id: 'red',    label: 'Red',    kind: 'color', color: '#EF4444' },
  { id: 'yellow', label: 'Yellow', kind: 'color', color: '#F59E0B' },
  { id: 'pink',   label: 'Pink',   kind: 'color', color: '#EC4899' },
  { id: 'navy',   label: 'Navy',   kind: 'color', color: '#1E3A5F' },
  { id: 'cream',  label: 'Cream',  kind: 'color', color: '#FFF8E7' },
  { id: 'gray',   label: 'Gray',   kind: 'color', color: '#6B7280' },
];

const BG_GRADIENTS: BgDef[] = [
  { id: 'sunset', label: 'Sunset', kind: 'gradient', colors: ['#FF6B6B', '#FFD93D'] },
  { id: 'ocean',  label: 'Ocean',  kind: 'gradient', colors: ['#0EA5E9', '#06B6D4'] },
  { id: 'forest', label: 'Forest', kind: 'gradient', colors: ['#065F46', '#10B981'] },
  { id: 'grape',  label: 'Grape',  kind: 'gradient', colors: ['#7C3AED', '#EC4899'] },
  { id: 'night',  label: 'Night',  kind: 'gradient', colors: ['#0A0A0F', '#1E3A5F'] },
  { id: 'rose',   label: 'Rose',   kind: 'gradient', colors: ['#BE185D', '#FB7185'] },
];

export default function BgRemoveScreen() {
  const { currentUri, setCurrentUri } = useEditorStore();

  // The ORIGINAL subject photo (captured once). Every background is composited
  // from this — so swapping White → Black just swaps, it never stacks.
  const baseUriRef = useRef<string | null>(null);
  const cutoutRef = useRef<string | null>(null);     // cached transparent subject
  const cutoutTriedRef = useRef(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [procLabel, setProcLabel] = useState('Working…');
  const [selectedId, setSelectedId] = useState('original');

  useEffect(() => {
    if (currentUri && !baseUriRef.current) baseUriRef.current = currentUri;
  }, [currentUri]);

  // Run the AI cutout once and cache it (the model download is the slow part).
  const ensureCutout = async (): Promise<string | null> => {
    if (cutoutTriedRef.current) return cutoutRef.current;
    cutoutTriedRef.current = true;
    if (Platform.OS !== 'web' || !baseUriRef.current) return null;
    setProcLabel('Detecting subject…');
    const cut = await imageProcessor.removeBackgroundCutout(baseUriRef.current);
    cutoutRef.current = cut;
    return cut;
  };

  const applyBackground = async (id: string, bg: BgDef | { kind: 'image'; uri: string }) => {
    const base = baseUriRef.current;
    if (!base) { haptic.error(); Alert.alert('No Image', 'Please select a photo first.'); return; }
    haptic.light();
    setSelectedId(id);

    if (id === 'original') { setCurrentUri(base); return; }

    if (Platform.OS !== 'web') {
      Alert.alert('Background', 'Background replacement runs in the web app. Open the site to use it.');
      return;
    }

    setIsProcessing(true);
    try {
      const cut = await ensureCutout();
      setProcLabel('Applying background…');
      const bgArg =
        bg.kind === 'image' ? bg
        : bg.kind === 'gradient' ? { kind: 'gradient' as const, colors: bg.colors }
        : { kind: 'color' as const, color: bg.color };

      const out = cut
        ? await imageProcessor.compositeBackground(cut, bgArg)
        : await imageProcessor.replaceBackground(base, bgArg); // fallback, still from ORIGINAL
      setCurrentUri(out);
      haptic.success();
    } catch (e: any) {
      haptic.error();
      Alert.alert('Could not apply background', e?.message ?? 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickBgImage = async () => {
    haptic.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length) {
      await applyBackground('photo', { kind: 'image', uri: result.assets[0].uri });
    }
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
              <Ionicons name="cut" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Background</Text>
          </View>
          <TouchableOpacity onPress={() => { haptic.success(); router.back(); }} style={styles.doneBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Full-screen preview */}
      <View style={styles.preview}>
        {currentUri ? (
          <Image source={{ uri: currentUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={40} color={Colors.text.muted} />
          </View>
        )}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <LinearGradient colors={['rgba(10,10,15,0.95)','rgba(10,10,15,0.85)']} style={styles.processingBox}>
              <Text style={{ fontSize: 26, marginBottom: 6 }}>🪄</Text>
              <Text style={styles.processingLabel}>{procLabel}</Text>
              <Text style={styles.processingSub}>First time may take a few seconds to load the AI model.</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Horizontal controls dock */}
      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <Text style={styles.hint}>
          Tap a background — your subject stays, only the background changes.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {/* Original */}
          <TouchableOpacity onPress={() => applyBackground('original', { id: 'original', label: 'Original', kind: 'color', color: '#000' })} style={styles.swatchItem}>
            <View style={[styles.swatch, styles.specialSwatch, selectedId === 'original' && styles.swatchActive]}>
              <Ionicons name="refresh" size={20} color={Colors.text.secondary} />
            </View>
            <Text style={styles.swatchLabel}>Original</Text>
          </TouchableOpacity>

          {/* Photo background */}
          <TouchableOpacity onPress={handlePickBgImage} style={styles.swatchItem}>
            <View style={[styles.swatch, styles.specialSwatch, selectedId === 'photo' && styles.swatchActive]}>
              <Ionicons name="images-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.swatchLabel}>Photo</Text>
          </TouchableOpacity>

          {/* Solid colours */}
          {BG_COLORS.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => applyBackground(c.id, c)} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: (c as any).color }, selectedId === c.id && styles.swatchActive]} />
              <Text style={styles.swatchLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Gradients */}
          {BG_GRADIENTS.map((g) => (
            <TouchableOpacity key={g.id} onPress={() => applyBackground(g.id, g)} style={styles.swatchItem}>
              <LinearGradient
                colors={(g as any).colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.swatch, selectedId === g.id && styles.swatchActive]}
              />
              <Text style={styles.swatchLabel}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
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
    flex: 1, marginHorizontal: 16, marginVertical: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingBox: { padding: 22, borderRadius: 16, alignItems: 'center', gap: 2, maxWidth: 260 },
  processingLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  processingSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', marginTop: 4 },

  dock: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
    paddingTop: 10,
  },
  hint: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', paddingHorizontal: 16, marginBottom: 8 },
  row: { paddingHorizontal: 14, paddingBottom: 6, gap: 12 },
  swatchItem: { alignItems: 'center', gap: 5, width: 60 },
  swatch: {
    width: 52, height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.dark.border,
    alignItems: 'center', justifyContent: 'center',
  },
  specialSwatch: { backgroundColor: Colors.dark.card },
  swatchActive: { borderColor: Colors.primary, borderWidth: 3 },
  swatchLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted, textAlign: 'center' },
});
