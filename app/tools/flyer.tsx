import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform, Alert,
} from 'react-native';
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

type Bg = { id: string; kind: 'color' | 'gradient'; color?: string; colors?: [string, string] };
const BGS: Bg[] = [
  { id: 'green',  kind: 'gradient', colors: ['#22C55E', '#059669'] },
  { id: 'night',  kind: 'gradient', colors: ['#0A0A0F', '#1E3A5F'] },
  { id: 'grape',  kind: 'gradient', colors: ['#7C3AED', '#EC4899'] },
  { id: 'sunset', kind: 'gradient', colors: ['#FF6B6B', '#FFD93D'] },
  { id: 'ocean',  kind: 'gradient', colors: ['#0EA5E9', '#06B6D4'] },
  { id: 'black',  kind: 'color', color: '#0A0A0F' },
  { id: 'white',  kind: 'color', color: '#FFFFFF' },
];
const LAYOUTS = [
  { id: 'top',    label: 'Top'    },
  { id: 'center', label: 'Center' },
  { id: 'bottom', label: 'Bottom' },
] as const;
const TEXT_COLORS = ['#FFFFFF', '#000000', '#22C55E', '#F59E0B', '#EC4899', '#3B82F6'];

export default function FlyerScreen() {
  const user = useAuthStore((s) => s.user);
  const createProject = useProjectStore((s) => s.createProject);

  const [template, setTemplate] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [bg, setBg] = useState<Bg>(BGS[0]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('YOUR EVENT');
  const [subtitle, setSubtitle] = useState('Say something catchy here');
  const [footer, setFooter] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  const bgArg = bg.kind === 'gradient'
    ? { kind: 'gradient' as const, colors: bg.colors! }
    : { kind: 'color' as const, color: bg.color! };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled && res.assets?.[0]?.uri) { haptic.light(); setPhoto(res.assets[0].uri); }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const my = ++reqId.current;
    setBusy(true);
    imageProcessor.composePoster({
      template, bg: bgArg, photoUri: photo,
      title: title.trim(), subtitle: subtitle.trim(), footer: footer.trim(), textColor,
    })
      .then((u) => { if (my === reqId.current) setOut(u); })
      .catch(() => {})
      .finally(() => { if (my === reqId.current) setBusy(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, bg, photo, title, subtitle, footer, textColor]);

  const use = () => {
    if (!out || !user) { Alert.alert('Flyer', 'Still rendering — try again in a second.'); return; }
    haptic.success();
    const p = createProject({ userId: user.id, imageUri: out, width: 1080, height: 1350, fileSize: 0, title: `${title.trim() || 'Flyer'} — Poster` });
    router.replace({ pathname: '/editor', params: { id: p.id } });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Flyer & Poster</Text>
          <TouchableOpacity onPress={use} disabled={!out} style={[styles.useBtn, !out && { opacity: 0.4 }]}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.useGradient}>
              <Text style={styles.useText}>Use →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.preview}>
        {out ? <Image source={{ uri: out }} style={styles.previewImg} resizeMode="contain" /> : (
          <View style={styles.empty}><Ionicons name="newspaper-outline" size={44} color={Colors.text.muted} /></View>
        )}
        {busy && <View style={styles.dot} />}
      </View>

      <ScrollView style={styles.dock} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.inputs}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={Colors.text.muted} style={styles.input} />
          <TextInput value={subtitle} onChangeText={setSubtitle} placeholder="Subtitle" placeholderTextColor={Colors.text.muted} style={styles.input} />
          <TextInput value={footer} onChangeText={setFooter} placeholder="Footer / contact (optional)" placeholderTextColor={Colors.text.muted} style={styles.input} />
        </View>

        <Text style={styles.label}>Layout</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {LAYOUTS.map((l) => (
            <TouchableOpacity key={l.id} onPress={() => { haptic.selection(); setTemplate(l.id); }} style={[styles.chip, template === l.id && styles.chipActive]}>
              <Text style={[styles.chipText, template === l.id && { color: Colors.primary }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Photo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <TouchableOpacity onPress={pickPhoto} style={styles.swatchDashed}>
            <Ionicons name="image-outline" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
          {photo && (
            <TouchableOpacity onPress={() => setPhoto(null)} style={styles.swatchClear}>
              <Ionicons name="close" size={18} color={Colors.text.primary} />
              <Text style={styles.clearText}>None</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.label}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {BGS.map((b) => (
            <TouchableOpacity key={b.id} onPress={() => { haptic.light(); setBg(b); }}>
              {b.kind === 'gradient' ? (
                <LinearGradient colors={b.colors!} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.swatch, bg.id === b.id && styles.swatchActive]} />
              ) : (
                <View style={[styles.swatch, { backgroundColor: b.color }, bg.id === b.id && styles.swatchActive]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Text color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TEXT_COLORS.map((c) => (
            <TouchableOpacity key={c} onPress={() => { haptic.light(); setTextColor(c); }}>
              <View style={[styles.dot2, { backgroundColor: c }, textColor === c && styles.swatchActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  useBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  useGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  useText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  preview: { height: 280, marginHorizontal: 16, marginVertical: 12, borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%', height: '100%' },
  empty: { alignItems: 'center' },
  dot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  dock: { flex: 1, backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  inputs: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  input: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, height: 44, color: Colors.text.primary, fontFamily: 'Poppins_500Medium', fontSize: Layout.fontSize.base },
  label: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, paddingHorizontal: 16, marginTop: 14 },
  row: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border },
  chipActive: { backgroundColor: '#0D2119', borderColor: Colors.primary },
  chipText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  swatch: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.dark.border },
  swatchActive: { borderColor: Colors.primary, borderWidth: 3 },
  swatchDashed: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  swatchClear: { width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', gap: 2 },
  clearText: { fontSize: 9, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  dot2: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.dark.border },
});
