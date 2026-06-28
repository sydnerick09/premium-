import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const PIN_KEY = 'erick_vault_pin';
const ITEMS_KEY = 'erick_vault_items';
const isWeb = Platform.OS === 'web';

const lsGet = (k: string): string | null => {
  try { return isWeb && typeof window !== 'undefined' ? window.localStorage.getItem(k) : null; } catch { return null; }
};
const lsSet = (k: string, v: string) => {
  try { if (isWeb && typeof window !== 'undefined') window.localStorage.setItem(k, v); } catch {}
};

function downscale(uri: string, max = 1000): Promise<string> {
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}

type Mode = 'loading' | 'setup' | 'locked' | 'unlocked';

export default function VaultScreen() {
  const [mode, setMode] = useState<Mode>('loading');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [items, setItems] = useState<string[]>([]);
  // Full-screen viewer (index of the photo being viewed) + delete confirmation.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);

  // 3-second safety countdown before the permanent "Delete forever" is allowed.
  useEffect(() => {
    if (pendingDelete === null) return;
    setCountdown(3);
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [pendingDelete]);

  useEffect(() => {
    if (!isWeb) { setMode('locked'); return; }
    setMode(lsGet(PIN_KEY) ? 'locked' : 'setup');
  }, []);

  const loadItems = () => {
    try { setItems(JSON.parse(lsGet(ITEMS_KEY) ?? '[]')); } catch { setItems([]); }
  };
  const persist = (next: string[]) => { setItems(next); lsSet(ITEMS_KEY, JSON.stringify(next)); };

  const createPin = () => {
    if (pin.length < 4) { Alert.alert('Vault', 'Choose a passcode of at least 4 digits.'); return; }
    if (pin !== confirm) { Alert.alert('Vault', 'The passcodes do not match.'); return; }
    lsSet(PIN_KEY, pin);
    haptic.success(); setPin(''); setConfirm(''); loadItems(); setMode('unlocked');
  };
  const unlock = () => {
    if (pin === lsGet(PIN_KEY)) { haptic.success(); setPin(''); loadItems(); setMode('unlocked'); }
    else { haptic.error(); Alert.alert('Vault', 'Wrong passcode.'); setPin(''); }
  };

  const addPhotos = async () => {
    if (!isWeb) { Alert.alert('Vault', 'The vault stores photos in the web app.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 1,
    });
    if (res.canceled || !res.assets?.length) return;
    haptic.light();
    try {
      const added = await Promise.all(res.assets.map((a) => downscale(a.uri)));
      persist([...added, ...items]);
    } catch { Alert.alert('Vault', 'Could not add photos (storage may be full).'); }
  };

  // Permanently delete the pending photo from the vault (cannot be recovered).
  const confirmDelete = () => {
    if (pendingDelete === null) return;
    const idx = pendingDelete;
    haptic.medium();
    persist(items.filter((_, i) => i !== idx));
    setPendingDelete(null);
    // Keep the viewer pointing at a valid photo (or close it if none remain).
    setViewerIndex((v) => {
      if (v === null) return null;
      const remaining = items.length - 1;
      if (remaining <= 0) return null;
      if (v === idx) return Math.min(idx, remaining - 1);
      return v > idx ? v - 1 : v;
    });
  };

  // ── Lock / setup screens ────────────────────────────────────────────────────
  if (mode !== 'unlocked') {
    const setup = mode === 'setup';
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Private Vault</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
        <View style={styles.lockBox}>
          <View style={styles.lockIcon}><Ionicons name="lock-closed" size={34} color={Colors.primary} /></View>
          <Text style={styles.lockTitle}>{setup ? 'Create a passcode' : 'Enter passcode'}</Text>
          <Text style={styles.lockDesc}>
            {setup ? 'Your hidden vault is protected by this passcode. Keep it secret.' : 'This vault is private. Enter your passcode to continue.'}
          </Text>
          <TextInput
            value={pin} onChangeText={setPin} placeholder="Passcode" placeholderTextColor={Colors.text.muted}
            secureTextEntry keyboardType="number-pad" style={styles.pinInput}
          />
          {setup && (
            <TextInput
              value={confirm} onChangeText={setConfirm} placeholder="Confirm passcode" placeholderTextColor={Colors.text.muted}
              secureTextEntry keyboardType="number-pad" style={styles.pinInput}
            />
          )}
          <TouchableOpacity onPress={setup ? createPin : unlock} style={styles.cta}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>{setup ? 'Create vault' : 'Unlock'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          {!isWeb && <Text style={styles.note}>Photo storage is available in the web app.</Text>}
        </View>
      </View>
    );
  }

  // ── Unlocked gallery ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Private Vault</Text>
          <TouchableOpacity onPress={() => { setMode('locked'); setItems([]); }} style={{ padding: 4 }}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={addPhotos} style={styles.addBox}>
          <Ionicons name="add" size={26} color={Colors.primary} />
          <Text style={styles.addBoxText}>Add photos to vault</Text>
        </TouchableOpacity>
        {isWeb && (
          <Text style={styles.webNote}>
            A copy is hidden here in your vault. On the web, the original stays in your device gallery — delete it there to fully hide it.
          </Text>
        )}
        {items.length === 0 ? (
          <Text style={styles.empty}>No photos yet. Added photos are hidden here behind your passcode.</Text>
        ) : (
          <>
            <Text style={styles.hint}>Tap a photo to view it. Tap the trash icon to delete it forever.</Text>
            <View style={styles.grid}>
              {items.map((u, idx) => (
                <TouchableOpacity key={idx} style={styles.thumbWrap} activeOpacity={0.85} onPress={() => { haptic.light(); setViewerIndex(idx); }}>
                  <Image source={{ uri: u }} style={styles.thumb} resizeMode="cover" />
                  <TouchableOpacity onPress={() => { haptic.light(); setPendingDelete(idx); }} style={styles.thumbRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash" size={13} color={Colors.white} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Full-screen photo viewer ─────────────────────────────────── */}
      {viewerIndex !== null && items[viewerIndex] && (
        <View style={styles.viewer}>
          <SafeAreaView edges={['top']} style={styles.viewerHeader}>
            <Text style={styles.viewerCount}>{viewerIndex + 1} / {items.length}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setPendingDelete(viewerIndex)} style={styles.viewerIconBtn}>
                <Ionicons name="trash-outline" size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewerIndex(null)} style={styles.viewerIconBtn}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.viewerBody}>
            <Image source={{ uri: items[viewerIndex] }} style={styles.viewerImage} resizeMode="contain" />
            {viewerIndex > 0 && (
              <TouchableOpacity onPress={() => setViewerIndex(viewerIndex - 1)} style={[styles.navBtn, { left: 12 }]}>
                <Ionicons name="chevron-back" size={26} color={Colors.white} />
              </TouchableOpacity>
            )}
            {viewerIndex < items.length - 1 && (
              <TouchableOpacity onPress={() => setViewerIndex(viewerIndex + 1)} style={[styles.navBtn, { right: 12 }]}>
                <Ionicons name="chevron-forward" size={26} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Delete confirmation (3s safety, permanent) ───────────────── */}
      {pendingDelete !== null && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}><Ionicons name="warning" size={28} color={Colors.error} /></View>
            <Text style={styles.confirmTitle}>Delete forever?</Text>
            <Text style={styles.confirmDesc}>
              This photo will be permanently deleted from your vault. It is NOT moved back to your files — it cannot be recovered.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setPendingDelete(null)} style={styles.confirmCancel}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={countdown > 0}
                style={[styles.confirmDelete, countdown > 0 && { opacity: 0.5 }]}
              >
                <Text style={styles.confirmDeleteText}>
                  {countdown > 0 ? `Delete forever (${countdown})` : 'Delete forever'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },

  lockBox: { padding: 24, alignItems: 'center', gap: 12, marginTop: 24 },
  lockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0C1D17', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  lockTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  lockDesc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  pinInput: {
    width: '100%', maxWidth: 320, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, height: 50,
    color: Colors.text.primary, fontFamily: 'Poppins_600SemiBold', fontSize: Layout.fontSize.lg, textAlign: 'center', letterSpacing: 6,
  },
  note: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 8 },

  addBox: { height: 80, borderRadius: Layout.radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.dark.card },
  addBoxText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  webNote: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 17, paddingHorizontal: 4 },
  hint: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, paddingHorizontal: 4 },

  // Full-screen viewer
  viewer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', zIndex: 50 },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  viewerCount: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  viewerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  viewerBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  navBtn: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Delete confirmation
  confirmOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 },
  confirmCard: { width: '100%', maxWidth: 360, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, padding: 22, alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: Colors.dark.border },
  confirmIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2A1212', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  confirmTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  confirmDesc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  confirmCancel: { flex: 1, paddingVertical: 13, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.surface, alignItems: 'center' },
  confirmCancelText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  confirmDelete: { flex: 1.4, paddingVertical: 13, borderRadius: Layout.radius.md, backgroundColor: Colors.error, alignItems: 'center' },
  confirmDeleteText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.white },
  empty: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: (Layout.window.width - 32 - 16) / 3, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.dark.card },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  cta: { borderRadius: Layout.radius.md, overflow: 'hidden', width: '100%', maxWidth: 320, marginTop: 6 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
