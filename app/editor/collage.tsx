import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type CollageLayout =
  | '2x2' | '2x1' | '1x2' | '3' | '3v' | '3h' | 'bigtop'
  | 'bigleft' | '4v' | '5strip' | '6grid' | '8grid';
type Cell = { x: number; y: number; w: number; h: number };

// Cell maps mirror imageProcessor.composeCollage so the preview matches the output.
const CELLS: Record<CollageLayout, Cell[]> = {
  '2x1': [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }],
  '1x2': [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }],
  '2x2': [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  '3': [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  '3v': [
    { x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
  ],
  '3h': [
    { x: 0, y: 0, w: 1, h: 1 / 3 }, { x: 0, y: 1 / 3, w: 1, h: 1 / 3 }, { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
  ],
  bigtop: [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  bigleft: [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 1 / 3 }, { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 }, { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
  ],
  '4v': [
    { x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 },
    { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 },
  ],
  '5strip': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
  ],
  '6grid': [
    { x: 0, y: 0, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
    { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
  ],
  '8grid': [
    { x: 0, y: 0, w: 0.25, h: 0.5 }, { x: 0.25, y: 0, w: 0.25, h: 0.5 }, { x: 0.5, y: 0, w: 0.25, h: 0.5 }, { x: 0.75, y: 0, w: 0.25, h: 0.5 },
    { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
  ],
};

const LAYOUTS: { id: CollageLayout; label: string }[] = [
  { id: '2x2',     label: 'Grid'    },
  { id: '2x1',     label: 'Side'    },
  { id: '1x2',     label: 'Stack'   },
  { id: '3',       label: 'Trio'    },
  { id: '3v',      label: '3 Cols'  },
  { id: '3h',      label: '3 Rows'  },
  { id: 'bigtop',  label: 'Top Big' },
  { id: 'bigleft', label: 'Left Big' },
  { id: '4v',      label: '4 Cols'  },
  { id: '5strip',  label: 'Five'    },
  { id: '6grid',   label: 'Six'     },
  { id: '8grid',   label: 'Eight'   },
];

// Mini diagram of a layout's cells, drawn inside the chip.
function LayoutPreview({ cells, active }: { cells: Cell[]; active: boolean }) {
  return (
    <View style={styles.previewBox}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${c.x * 100}%`,
            top: `${c.y * 100}%`,
            width: `${c.w * 100}%`,
            height: `${c.h * 100}%`,
            padding: 1.5,
          }}
        >
          <View style={{ flex: 1, borderRadius: 2, backgroundColor: active ? Colors.primary : Colors.text.muted }} />
        </View>
      ))}
    </View>
  );
}

const BGS = [
  { id: 'white', color: '#FFFFFF' },
  { id: 'black', color: '#000000' },
  { id: 'green', color: '#22C55E' },
  { id: 'blue',  color: '#3B82F6' },
  { id: 'pink',  color: '#EC4899' },
  { id: 'cream', color: '#FFF8E7' },
];

export default function CollageScreen() {
  const user = useAuthStore((s) => s.user);
  const createProject = useProjectStore((s) => s.createProject);

  const [uris, setUris] = useState<string[]>([]);
  const [layout, setLayout] = useState<CollageLayout>('2x2');
  const [bg, setBg] = useState('#FFFFFF');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const reqId = useRef(0);

  const pickPhotos = async () => {
    haptic.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.9,
    });
    if (result.canceled || !result.assets.length) return;
    setUris(result.assets.slice(0, 8).map((a) => a.uri));
  };

  // Pick a custom solid colour — uses the browser's native colour picker (web only).
  const pickCustomColor = () => {
    haptic.light();
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = bg.startsWith('#') ? bg : '#FFFFFF';
    input.addEventListener('input', () => { setBgImage(null); setBg(input.value); });
    input.click();
  };

  // Pick an image to use as the collage background.
  const pickBgImage = async () => {
    haptic.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets.length) return;
    setBgImage(result.assets[0].uri);
  };

  // Re-compose whenever the inputs change.
  useEffect(() => {
    if (uris.length < 2 || Platform.OS !== 'web') { setResultUri(null); return; }
    const myReq = ++reqId.current;
    setIsProcessing(true);
    imageProcessor.composeCollage(uris, layout, { bg, bgImage })
      .then((out) => { if (myReq === reqId.current) setResultUri(out); })
      .catch(() => {})
      .finally(() => { if (myReq === reqId.current) setIsProcessing(false); });
  }, [uris, layout, bg, bgImage]);

  const handleUse = () => {
    if (!resultUri || !user) {
      Alert.alert('Add photos', 'Pick at least 2 photos to make a collage.');
      return;
    }
    haptic.success();
    const project = createProject({
      userId: user.id,
      imageUri: resultUri,
      width: 1080,
      height: 1080,
      fileSize: 0,
      title: `Collage ${new Date().toLocaleDateString()}`,
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
              <Ionicons name="grid" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Collage</Text>
          </View>
          <TouchableOpacity onPress={handleUse} disabled={!resultUri} style={[styles.doneBtn, !resultUri && { opacity: 0.4 }]}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.doneGradient}>
              <Text style={styles.doneText}>Edit →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Preview */}
      <View style={styles.preview}>
        {resultUri ? (
          <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <TouchableOpacity onPress={pickPhotos} style={styles.empty} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={44} color={Colors.text.muted} />
            <Text style={styles.emptyText}>Tap to add 2–8 photos</Text>
          </TouchableOpacity>
        )}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <LinearGradient colors={['rgba(10,10,15,0.9)','rgba(10,10,15,0.8)']} style={styles.processingBox}>
              <Text style={{ fontSize: 24 }}>🧩</Text>
              <Text style={styles.processingLabel}>Building collage…</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Controls */}
      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <TouchableOpacity onPress={pickPhotos} style={styles.addBtn}>
          <Ionicons name="add" size={18} color={Colors.primary} />
          <Text style={styles.addBtnText}>{uris.length ? `${uris.length} photo${uris.length > 1 ? 's' : ''} — change` : 'Add Photos'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Layout</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {LAYOUTS.map((l) => (
            <TouchableOpacity key={l.id} onPress={() => { haptic.selection(); setLayout(l.id); }} style={styles.chipItem}>
              <View style={[styles.chip, layout === l.id && styles.chipActive]}>
                <LayoutPreview cells={CELLS[l.id]} active={layout === l.id} />
              </View>
              <Text style={[styles.chipLabel, layout === l.id && { color: Colors.primary }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {BGS.map((b) => (
            <TouchableOpacity key={b.id} onPress={() => { haptic.light(); setBgImage(null); setBg(b.color); }} style={styles.chipItem}>
              <View style={[styles.swatch, { backgroundColor: b.color }, !bgImage && bg === b.color && styles.chipActive]} />
            </TouchableOpacity>
          ))}

          {/* Custom colour picker */}
          <TouchableOpacity onPress={pickCustomColor} style={styles.chipItem}>
            <View style={[styles.swatchSpecial, !bgImage && !BGS.some((b) => b.color === bg) && styles.chipActive]}>
              <LinearGradient
                colors={['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.swatchFill}
              />
              <Ionicons name="color-palette" size={18} color={Colors.white} style={styles.swatchIcon} />
            </View>
            <Text style={styles.chipLabel}>Custom</Text>
          </TouchableOpacity>

          {/* Image background */}
          <TouchableOpacity onPress={pickBgImage} style={styles.chipItem}>
            {bgImage ? (
              <Image source={{ uri: bgImage }} style={[styles.swatch, styles.chipActive]} />
            ) : (
              <View style={styles.swatchSpecial}>
                <Ionicons name="image" size={20} color={Colors.text.muted} />
              </View>
            )}
            <Text style={[styles.chipLabel, !!bgImage && { color: Colors.primary }]}>Image</Text>
          </TouchableOpacity>
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
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingBox: { padding: 20, borderRadius: 16, alignItems: 'center', gap: 4 },
  processingLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },

  dock: { backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border, paddingTop: 10 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8, paddingVertical: 12,
    borderRadius: Layout.radius.md, borderWidth: 1, borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}14`,
  },
  addBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  sectionLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, paddingHorizontal: 16, marginTop: 4 },
  row: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  chipItem: { alignItems: 'center', gap: 4 },
  chip: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border,
    padding: 7,
  },
  chipActive: { borderColor: Colors.primary, borderWidth: 3 },
  previewBox: { width: '100%', height: '100%' },
  chipLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  swatch: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.dark.border },
  swatchSpecial: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.dark.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: Colors.dark.card,
  },
  swatchFill: { ...StyleSheet.absoluteFillObject },
  swatchIcon: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 },
});
