import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useEditorStore } from '../../store/editorStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import AppSlider from '../../components/AppSlider';

type ShapeDef = { id: string; label: string; vector?: string; glyph?: string };

const CATEGORIES: { id: string; label: string; shapes: ShapeDef[] }[] = [
  { id: 'basic', label: 'Basic', shapes: [
    { id: 'square',    label: 'Square',    vector: 'square' },
    { id: 'rectangle', label: 'Rectangle', vector: 'rectangle' },
    { id: 'circle',    label: 'Circle',    vector: 'circle' },
    { id: 'oval',      label: 'Oval',      vector: 'oval' },
    { id: 'triangle',  label: 'Triangle',  vector: 'triangle' },
    { id: 'trapezium', label: 'Trapezium', vector: 'trapezium' },
  ]},
  { id: 'geometric', label: 'Geometric', shapes: [
    { id: 'diamond',  label: 'Diamond',  vector: 'diamond' },
    { id: 'pentagon', label: 'Pentagon', vector: 'pentagon' },
    { id: 'hexagon',  label: 'Hexagon',  vector: 'hexagon' },
    { id: 'star',     label: 'Star',     vector: 'star' },
    { id: 'heart',    label: 'Heart',    vector: 'heart' },
    { id: 'cross',    label: 'Cross',    vector: 'cross' },
  ]},
  { id: 'alphabet', label: 'A–Z', shapes:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ({ id: `L${c}`, label: c, glyph: c })),
  },
  { id: 'numbers', label: '0–9', shapes:
    '0123456789'.split('').map((c) => ({ id: `N${c}`, label: c, glyph: c })),
  },
  { id: 'food', label: 'Food', shapes:
    ['🍎','🍌','🍓','🍇','🍉','🥑','🍕','🍔','🍩','🍦','🍰','🌮'].map((e, i) => ({ id: `F${i}`, label: e, glyph: e })),
  },
  { id: 'animals', label: 'Animals', shapes:
    ['🐶','🐱','🐼','🦊','🐰','🐯','🐸','🐧','🦋','🐢','🐝','🦁'].map((e, i) => ({ id: `A${i}`, label: e, glyph: e })),
  },
  { id: 'plants', label: 'Plants', shapes:
    ['🌵','🌲','🌳','🌴','🌻','🌹','🌷','🍀','🌿','🌸','🌼','🍁'].map((e, i) => ({ id: `P${i}`, label: e, glyph: e })),
  },
];

export default function ShapesScreen() {
  const currentUri = useEditorStore((s) => s.currentUri);
  const setCurrentUri = useEditorStore((s) => s.setCurrentUri);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const [category, setCategory] = useState('basic');
  const [shape, setShape] = useState<ShapeDef>(CATEGORIES[0].shapes[0]);
  const [size, setSize] = useState(100);
  const [feather, setFeather] = useState(50);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const reqId = useRef(0);

  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];

  useEffect(() => {
    if (Platform.OS !== 'web' || !currentUri) return;
    const myReq = ++reqId.current;
    setIsProcessing(true);
    imageProcessor.composeCutoutShape(currentUri, {
      shape: shape.vector,
      glyph: shape.glyph,
      size,
      feather,
    })
      .then((out) => { if (myReq === reqId.current) setResultUri(out); })
      .catch(() => {})
      .finally(() => { if (myReq === reqId.current) setIsProcessing(false); });
  }, [currentUri, shape, size, feather]);

  const handleApply = () => {
    if (!resultUri) return;
    haptic.success();
    setCurrentUri(resultUri);
    pushHistory(`Cut Out: ${shape.label}`, resultUri);
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
              <Ionicons name="shapes" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Cut Out · Shapes</Text>
          </View>
          <TouchableOpacity onPress={handleApply} disabled={!resultUri} style={[styles.doneBtn, !resultUri && { opacity: 0.4 }]}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Preview (checkerboard hints transparency) */}
      <View style={styles.preview}>
        {resultUri ? (
          <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.empty}><Ionicons name="shapes-outline" size={44} color={Colors.text.muted} /></View>
        )}
        {isProcessing && <View style={styles.spinnerDot} />}
      </View>

      <ScrollView style={styles.dock} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Category */}
        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => { haptic.selection(); setCategory(c.id); setShape(c.shapes[0]); }}
              style={[styles.catChip, category === c.id && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, category === c.id && { color: Colors.primary }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shapes */}
        <Text style={styles.sectionLabel}>Shape</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {cat.shapes.map((s) => (
            <TouchableOpacity key={s.id} onPress={() => { haptic.light(); setShape(s); }} style={styles.shapeItem}>
              <View style={[styles.shapeBox, shape.id === s.id && styles.shapeBoxActive]}>
                {s.glyph ? (
                  <Text style={{ fontSize: 26 }}>{s.glyph}</Text>
                ) : (
                  <View style={[styles.vshape, vectorStyle(s.vector!), shape.id === s.id && { backgroundColor: Colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Size */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Size</Text>
          <View style={styles.sliderTrack}>
            <AppSlider value={size} minimumValue={20} maximumValue={100} step={1} onValueChange={setSize} />
          </View>
          <Text style={styles.sliderVal}>{Math.round(size)}</Text>
        </View>

        {/* Feather */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Feather</Text>
          <View style={styles.sliderTrack}>
            <AppSlider value={feather} minimumValue={0} maximumValue={100} step={1} onValueChange={setFeather} />
          </View>
          <Text style={styles.sliderVal}>{Math.round(feather)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Rough preview of vector shapes using View styling.
function vectorStyle(v: string): any {
  switch (v) {
    case 'circle':    return { borderRadius: 999 };
    case 'oval':      return { borderRadius: 999, width: 30, height: 20 };
    case 'rectangle': return { width: 30, height: 18, borderRadius: 2 };
    case 'square':    return { borderRadius: 2 };
    case 'pill':      return { borderRadius: 999, width: 30, height: 16 };
    default:          return { borderRadius: 4 }; // triangle/star/etc. shown as a block chip
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  doneBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  doneGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  doneText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  preview: {
    height: 280, marginHorizontal: 16, marginVertical: 12,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
    backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  spinnerDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  dock: { flex: 1, backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  sectionLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, paddingHorizontal: 16, marginTop: 14 },
  row: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },

  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border },
  catChipActive: { backgroundColor: '#0D2119', borderColor: Colors.primary },
  catChipText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  shapeItem: { alignItems: 'center' },
  shapeBox: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border,
  },
  shapeBoxActive: { borderColor: Colors.primary, borderWidth: 3 },
  vshape: { width: 24, height: 24, backgroundColor: Colors.text.secondary },

  sliderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, gap: 10 },
  sliderLabel: { width: 56, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  sliderTrack: { flex: 1 },
  sliderVal: { width: 34, textAlign: 'right', fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
});
