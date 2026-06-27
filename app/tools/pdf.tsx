import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;

function toDataURL(uri: string): Promise<string> {
  return fetch(uri).then((r) => r.blob()).then(
    (blob) => new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    }),
  );
}
function getSize(uri: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const i = new (window as any).Image();
    i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => resolve({ w: 1080, h: 1440 });
    i.src = uri;
  });
}

export default function ImageToPdfScreen() {
  const [uris, setUris] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const addImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled && res.assets?.length) {
      haptic.light();
      setUris((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  const makePdf = async () => {
    if (!uris.length) return;
    if (Platform.OS !== 'web') { Alert.alert('Image → PDF', 'PDF export runs in the web app.'); return; }
    setBusy(true);
    haptic.medium();
    try {
      const mod = await dynImport('https://esm.sh/jspdf@2.5.1');
      const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default;
      let doc: any = null;
      for (let i = 0; i < uris.length; i++) {
        const { w, h } = await getSize(uris[i]);
        const data = await toDataURL(uris[i]);
        const fmt = data.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const orient = w >= h ? 'l' : 'p';
        if (i === 0) doc = new JsPDF({ orientation: orient, unit: 'px', format: [w, h] });
        else doc.addPage([w, h], orient);
        doc.addImage(data, fmt, 0, 0, w, h);
      }
      doc.save(`erick-${Date.now()}.pdf`);
      haptic.success();
    } catch (e: any) {
      haptic.error();
      Alert.alert('PDF failed', e?.message ?? 'Could not create the PDF.');
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Image → PDF</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={addImages} style={styles.addBox}>
          <Ionicons name="images-outline" size={26} color={Colors.primary} />
          <Text style={styles.addBoxText}>Add images</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {uris.map((u, idx) => (
            <View key={`${u}-${idx}`} style={styles.thumbWrap}>
              <Image source={{ uri: u }} style={styles.thumb} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setUris((p) => p.filter((_, i) => i !== idx))}
                style={styles.thumbRemove}
              >
                <Ionicons name="close" size={14} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.pageNo}><Text style={styles.pageNoText}>{idx + 1}</Text></View>
            </View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.count}>{uris.length} page{uris.length === 1 ? '' : 's'}</Text>
        <TouchableOpacity onPress={makePdf} disabled={!uris.length || busy} style={[styles.cta, (!uris.length || busy) && { opacity: 0.4 }]}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
            <Ionicons name="document-text" size={18} color={Colors.white} />
            <Text style={styles.ctaText}>{busy ? 'Creating…' : 'Create PDF'}</Text>
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
  addBox: {
    height: 96, borderRadius: Layout.radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.dark.card,
  },
  addBoxText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { width: (Layout.window.width - 32 - 20) / 3, aspectRatio: 0.78, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.dark.card },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  pageNo: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  pageNoText: { color: Colors.white, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  count: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  cta: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
