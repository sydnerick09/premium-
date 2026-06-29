import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@components/ui/SolidGradient';
// Real gradient only for the photo label scrim (functional legibility fade).
import { LinearGradient as Gradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// ── Featured image cards ──────────────────────────────────────────────────────
// Each card shows a real image. The files below are PLACEHOLDERS — replace them
// with your own photos at the SAME path/name (assets/explore/explore-1.jpg …4.jpg)
// and they'll appear automatically.
const FEATURED = [
  { id: '1', title: 'AI Enhance',        sub: 'One-tap magic',  img: require('../../assets/explore/explore-1.jpg'), route: '/(tabs)/create' },
  { id: '2', title: 'Filters',           sub: '100+ pro looks', img: require('../../assets/explore/explore-2.jpg'), route: '/(tabs)/create' },
  { id: '3', title: 'Remove Background', sub: 'Clean cut-outs', img: require('../../assets/explore/explore-3.jpg'), route: '/(tabs)/create' },
  { id: '4', title: 'Adjust',            sub: 'Fine-tune tones', img: require('../../assets/explore/explore-4.jpg'), route: '/(tabs)/create' },
];

// Explicit card size (web can collapse aspectRatio cards with absolute children).
const FEAT_W = (Layout.window.width - 48 - 12) / 2;
const FEAT_H = Math.round(FEAT_W * 1200 / 896); // match the 896x1200 images

const TOOLS = [
  { id: 'qr',    name: 'QR Scanner',   icon: 'qr-code-outline',         route: '/tools/qr'           },
  { id: 'scan',  name: 'Doc Scanner',  icon: 'document-text-outline',   route: '/tools/scanner'      },
  { id: 'pdf',   name: 'Image → PDF',  icon: 'document-attach-outline', route: '/tools/pdf'          },
  { id: 'flyer', name: 'Flyer Maker',  icon: 'newspaper-outline',       route: '/tools/flyer'        },
  { id: 'cloud', name: 'Cloud Backup', icon: 'cloud-upload-outline',    route: '/tools/cloud-backup' },
];

const TUTORIALS = [
  { id: '1', title: 'Cinematic Color Grading', duration: '3 min', icon: '🎬', gradient: Colors.gradients.primary },
  { id: '2', title: 'Perfect Portrait Retouching', duration: '5 min', icon: '👤', gradient: Colors.gradients.accent },
  { id: '3', title: 'Landscape HDR Effect', duration: '4 min', icon: '🏔', gradient: ['#10B981', '#0891B2'] },
  { id: '4', title: 'Vintage Film Look', duration: '3 min', icon: '🎞', gradient: Colors.gradients.gold },
];

const TIPS = [
  { id: '1', tip: 'Use the AI Enhance button for a quick one-tap improvement on any photo.' },
  { id: '2', tip: 'Stack multiple filters at reduced opacity for a unique look.' },
  { id: '3', tip: 'The healing brush works best on uniform backgrounds.' },
  { id: '4', tip: 'Shoot in RAW mode for maximum editing flexibility.' },
  { id: '5', tip: 'Use the curves tool for precise tonal adjustments.' },
];

export default function ExploreScreen() {
  const isDark = useSettingsStore((s) => s.isDarkMode);
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? Colors.dark.card : Colors.light.card;
  const textPrimary = isDark ? Colors.text.primary : Colors.text.inverse;
  const textSecondary = isDark ? Colors.text.secondary : Colors.text.inverseSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>Explore</Text>
        </View>
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Featured</Text>
        <View style={styles.featGrid}>
          {FEATURED.map((f) => (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.9}
              onPress={() => { haptic.light(); router.push(f.route as any); }}
              style={styles.featCard}
            >
              <Image source={f.img} style={styles.featImg} resizeMode="cover" />
              <Gradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.featScrim} pointerEvents="none" />
              <View style={styles.featText}>
                <Text style={styles.featTitle}>{f.title}</Text>
                <Text style={styles.featSub}>{f.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tools</Text>
        <View style={styles.toolsGrid}>
          {TOOLS.map((t) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.85}
              onPress={() => { haptic.light(); router.push(t.route as any); }}
              style={[styles.toolCard, { backgroundColor: card }]}
            >
              <View style={styles.toolIcon}>
                <Ionicons name={t.icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={[styles.toolLabel, { color: textSecondary }]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tutorials</Text>
        {TUTORIALS.map((t) => (
          <TouchableOpacity key={t.id} style={[styles.tutorialCard, { backgroundColor: card }]}>
            <LinearGradient colors={t.gradient as [string, string]} style={styles.tutorialIcon}>
              <Text style={{ fontSize: 28 }}>{t.icon}</Text>
            </LinearGradient>
            <View style={styles.tutorialInfo}>
              <Text style={[styles.tutorialTitle, { color: textPrimary }]}>{t.title}</Text>
              <Text style={[styles.tutorialDuration, { color: textSecondary }]}>{t.duration} read</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Pro Tips</Text>
        {TIPS.map((t) => (
          <View key={t.id} style={[styles.tipCard, { backgroundColor: card }]}>
            <Text style={styles.tipBullet}>✦</Text>
            <Text style={[styles.tipText, { color: textSecondary }]}>{t.tip}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => router.push('/premium')} style={styles.unlockMore}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.unlockGradient}>
            <Text style={styles.unlockText}>✦ Unlock Premium Features</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: Layout.tabBarHeight + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: Layout.fontSize['3xl'], fontFamily: 'Poppins_700Bold' },
  scroll: { paddingTop: 8 },
  sectionTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', paddingHorizontal: 24, marginBottom: 12, marginTop: 8 },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  featCard: {
    width: FEAT_W, height: FEAT_H,
    borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  featImg: { width: '100%', height: '100%' },
  featScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  featText: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 },
  featTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  featSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.92)', marginTop: 1 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  toolCard: { width: (Layout.window.width - 48 - 24) / 3, aspectRatio: 1, borderRadius: Layout.radius.lg, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6 },
  toolIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0C1D17', alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  tutorialCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 24, marginBottom: 12,
    borderRadius: Layout.radius.lg, padding: 16,
  },
  tutorialIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tutorialInfo: { flex: 1 },
  tutorialTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold' },
  tutorialDuration: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 24, marginBottom: 10,
    borderRadius: Layout.radius.md, padding: 14,
  },
  tipBullet: { fontSize: 14, color: Colors.primary, marginTop: 1 },
  tipText: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  unlockMore: { marginHorizontal: 24, marginTop: 24, borderRadius: Layout.radius.lg, overflow: 'hidden' },
  unlockGradient: { paddingVertical: 16, alignItems: 'center' },
  unlockText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.5 },
});
