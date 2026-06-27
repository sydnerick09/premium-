import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const MODES = [
  { id: 'bw',    label: 'B&W'   },
  { id: 'gray',  label: 'Gray'  },
  { id: 'color', label: 'Color' },
] as const;

export default function DocumentScannerScreen() {
  const user = useAuthStore((s) => s.user);
  const createProject = useProjectStore((s) => s.createProject);
  const [src, setSrc] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [mode, setMode] = useState<'bw' | 'gray' | 'color'>('bw');
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  const pick = async (camera: boolean) => {
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled && res.assets?.[0]?.uri) { haptic.light(); setSrc(res.assets[0].uri); }
  };

  useEffect(() => {
    if (!src || Platform.OS !== 'web') { setOut(src); return; }
    const my = ++reqId.current;
    setBusy(true);
    imageProcessor.scanDocument(src, { mode })
      .then((u) => { if (my === reqId.current) setOut(u); })
      .catch(() => { if (my === reqId.current) setOut(src); })
      .finally(() => { if (my === reqId.current) setBusy(false); });
  }, [src, mode]);

  const save = () => {
    if (!out || !user) return;
    haptic.success();
    const p = createProject({ userId: user.id, imageUri: out, width: 0, height: 0, fileSize: 0, title: `Scan ${new Date().toLocaleDateString()}` });
    router.replace({ pathname: '/editor', params: { id: p.id } });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Document Scanner</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <View style={styles.preview}>
        {out ? (
          <Image source={{ uri: out }} style={styles.previewImg} resizeMode="contain" />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>Take or pick a photo of a document</Text>
          </View>
        )}
        {busy && <View style={styles.dot} />}
      </View>

      {src && (
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <TouchableOpacity key={m.id} onPress={() => { haptic.selection(); setMode(m.id); }} style={[styles.modeChip, mode === m.id && styles.modeChipActive]}>
              <Text style={[styles.modeText, mode === m.id && { color: Colors.primary }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity onPress={() => pick(true)} style={styles.iconBtn}>
          <Ionicons name="camera-outline" size={22} color={Colors.text.primary} />
          <Text style={styles.iconBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => pick(false)} style={styles.iconBtn}>
          <Ionicons name="images-outline" size={22} color={Colors.text.primary} />
          <Text style={styles.iconBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} disabled={!out} style={[styles.cta, !out && { opacity: 0.4 }]}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Save scan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  preview: { flex: 1, margin: 16, borderRadius: Layout.radius.xl, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', gap: 10 },
  emptyText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  dot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingBottom: 6 },
  modeChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border },
  modeChipActive: { backgroundColor: '#0D2119', borderColor: Colors.primary },
  modeText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  iconBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  iconBtnText: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  cta: { flex: 1, borderRadius: Layout.radius.md, overflow: 'hidden' },
  ctaGradient: { paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
