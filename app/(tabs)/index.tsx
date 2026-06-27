import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Image, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// ─── Tool tiles shown under the big Photo button ──────────────────────────────
const TILES = [
  { id: 'collage',   name: 'Collage',   icon: 'grid-outline',     route: '/editor/collage'  },
  { id: 'templates', name: 'Templates', icon: 'albums-outline',   route: '/editor/creative' },
  { id: 'beautify',  name: 'Beautify',  icon: 'sparkles-outline', route: '/editor/beauty'   },
  { id: 'camera',    name: 'Camera',    icon: 'camera-outline',   route: null               },
] as const;

// ─── Home tools ───────────────────────────────────────────────────────────────
// Only the Status Saver lives on the home screen; the rest moved to the Explore
// tab. Private Photo Vault stays hidden — opened by long-pressing the brand title.
const TOOLS_HUB = [
  { id: 'status', name: 'Status Saver', icon: 'logo-whatsapp', route: '/tools/status-saver' },
] as const;

// ─── Explore showcase cards ───────────────────────────────────────────────────
const EXPLORE = [
  { id: 'enhance',  name: 'AI Enhance', icon: 'flash',        gradient: Colors.gradients.primary,                     route: '/editor/ai-enhance' },
  { id: 'filters',  name: 'Filters',    icon: 'color-filter', gradient: Colors.gradients.accent,                      route: '/editor/filters'    },
  { id: 'bg',       name: 'Remove BG',  icon: 'cut',          gradient: ['#EF4444', '#F97316'] as [string, string],   route: '/editor/bg-remove'  },
  { id: 'adjust',   name: 'Adjust',     icon: 'options',      gradient: ['#10B981', '#0891B2'] as [string, string],   route: '/editor/adjustments'},
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const projects = useProjectStore((s) => s.getRecent(8));
  const createProject = useProjectStore((s) => s.createProject);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hidden Private Photo Vault — revealed only by long-pressing the brand title.
  const openVault = useCallback(() => {
    haptic.medium();
    setToast('Opening private vault…');
    setTimeout(() => { setToast(null); router.push('/tools/vault' as any); }, 650);
  }, []);

  // ── Pick an image, create a project, open the full-screen editor ─────────
  const openWithImage = useCallback(async (route?: string | null) => {
    haptic.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    const project = createProject({
      userId: user!.id,
      imageUri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      fileSize: asset.fileSize ?? 0,
    });
    router.push({ pathname: '/editor', params: { id: project.id } });
    if (route) setTimeout(() => router.push(route as any), 140);
  }, [user]);

  const openCamera = useCallback(async () => {
    haptic.light();
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return openWithImage();
      const result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      const project = createProject({
        userId: user!.id,
        imageUri: asset.uri,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        fileSize: asset.fileSize ?? 0,
      });
      router.push({ pathname: '/editor', params: { id: project.id } });
    } catch {
      openWithImage(); // web fallback
    }
  }, [user]);

  const onTile = (tile: typeof TILES[number]) => {
    if (tile.id === 'camera') return openCamera();
    if (tile.id === 'collage') { haptic.light(); return router.push('/editor/collage' as any); }
    return openWithImage(tile.route);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerIcon}>
              <Ionicons name="menu-outline" size={26} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/projects')} style={styles.headerIcon}>
              <Ionicons name="folder-open-outline" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onLongPress={openVault}
            delayLongPress={650}
            style={styles.brandWrap}
          >
            <Text style={styles.brand}>Polish</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/premium')} style={styles.proBtn}>
            <Ionicons name="diamond" size={13} color={Colors.white} />
            <Text style={styles.proText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="lock-closed" size={15} color={Colors.primary} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Big Photo button ───────────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => openWithImage()} style={styles.photoBtnWrap}>
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.photoBtn}
          >
            <Ionicons name="image-outline" size={26} color={Colors.white} />
            <Text style={styles.photoBtnText}>Photo</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Tool tiles ─────────────────────────────────────────── */}
        <View style={styles.tilesRow}>
          {TILES.map((tile) => (
            <TouchableOpacity key={tile.id} onPress={() => onTile(tile)} style={styles.tile} activeOpacity={0.85}>
              <View style={styles.tileIcon}>
                <Ionicons name={tile.icon as any} size={22} color={Colors.text.primary} />
              </View>
              <Text style={styles.tileLabel}>{tile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Explore ────────────────────────────────────────────── */}
        <View style={styles.exploreHeader}>
          <Text style={styles.exploreTitle}>Explore</Text>
          <View style={styles.exploreUnderline} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exploreRow}
        >
          {EXPLORE.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => openWithImage(item.route)}
              style={styles.exploreCard}
            >
              <LinearGradient colors={item.gradient as [string, string]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.exploreOverlay}>
                <Ionicons name={item.icon as any} size={26} color={Colors.white} />
                <Text style={styles.exploreCardLabel}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Tools (Status Saver) — below the Explore items ───────── */}
        <View style={styles.exploreHeader}>
          <Text style={styles.exploreTitle}>Tools</Text>
          <View style={styles.exploreUnderline} />
        </View>
        <View style={styles.toolsGrid}>
          {TOOLS_HUB.map((t) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.9}
              onPress={() => { haptic.light(); router.push(t.route as any); }}
              style={styles.statusCard}
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.statusIconWrap}>
                <Ionicons name="logo-whatsapp" size={30} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>{t.name}</Text>
                <Text style={styles.statusSub}>Save WhatsApp statuses & reels</Text>
              </View>
              <Ionicons name="download-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent projects ────────────────────────────────────── */}
        {projects.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/projects')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={projects}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
                  style={styles.projectCard}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.thumbnailUri ?? item.originalImageUri }} style={styles.projectThumb} resizeMode="cover" />
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <View style={{ height: Layout.tabBarHeight + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0D' },
  scroll: { paddingTop: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { padding: 4 },
  brandWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  brand: {
    textAlign: 'center',
    fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.5,
  },
  toastWrap: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#14141C', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  toastText: { color: Colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: Layout.fontSize.sm },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 30 },
  toolCard: {
    width: (Layout.window.width - 40 - 24) / 3, aspectRatio: 1,
    backgroundColor: '#16161A', borderRadius: Layout.radius.lg,
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6,
  },
  toolCardIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#0C1D17',
    alignItems: 'center', justifyContent: 'center',
  },
  toolCardLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, textAlign: 'center' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    width: '100%', paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: Layout.radius.lg, overflow: 'hidden',
  },
  statusIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  statusSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  proBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF4D6D', borderRadius: Layout.radius.md,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  proText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 1 },

  // Big Photo button
  photoBtnWrap: { paddingHorizontal: 20, marginTop: 8, marginBottom: 18 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 96, borderRadius: Layout.radius.xl,
    shadowColor: '#1E6FFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  photoBtnText: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  // Tiles
  tilesRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 36 },
  tile: {
    flex: 1, aspectRatio: 1, backgroundColor: '#16161A', borderRadius: Layout.radius.lg,
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  tileIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#222228',
    alignItems: 'center', justifyContent: 'center',
  },
  tileLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  // Explore
  exploreHeader: { paddingHorizontal: 20, marginBottom: 16 },
  exploreTitle: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_700Bold', color: Colors.white },
  exploreUnderline: { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 4 },
  exploreRow: { gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  exploreCard: {
    width: 130, height: 180, borderRadius: Layout.radius.lg, overflow: 'hidden',
  },
  exploreOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'flex-start', justifyContent: 'flex-end', padding: 14, gap: 6 },
  exploreCardLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  // Recent
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 28, marginBottom: 14,
  },
  sectionTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.white },
  seeAll: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.primary },
  projectCard: { width: 120, height: 150, borderRadius: Layout.radius.lg, overflow: 'hidden', backgroundColor: '#16161A' },
  projectThumb: { width: '100%', height: '100%' },
});
