import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { purchaseService } from '../services/purchase/purchase.service';
import { haptic } from '../utils/haptics';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const CARD_W = Layout.window.width - 32;

// Your real BASIC-vs-PREMIUM before/after photo (bundled asset).
const BEFORE_AFTER = require('../assets/premium/before-after.jpg');

// ── Auto-animated hero slides (designed — no external photos needed) ──────────
type Slide =
  | { kind: 'compare' }
  | { kind: 'promo'; bg: string; icon: string; title: string; sub: string };

const SLIDES: Slide[] = [
  { kind: 'compare' },
  { kind: 'promo', bg: '#7C3AED', icon: 'color-filter', title: 'Stunning Filters', sub: 'Upgrade your images with one tap.' },
  { kind: 'promo', bg: '#0E9F6E', icon: 'leaf',         title: 'Make Nature Pop',  sub: 'Vivid greens, skies & landscapes.' },
  { kind: 'promo', bg: '#F97316', icon: 'basketball',   title: 'Sharp Action Shots', sub: 'Football, basketball — freeze the moment.' },
  { kind: 'promo', bg: '#EC4899', icon: 'sparkles',     title: 'Creative Studio',  sub: '200+ templates, 500+ stickers & collage.' },
];

const CHIPS = [
  { icon: 'albums',   label: '200+ Templates' },
  { icon: 'happy',    label: '500+ Stickers' },
  { icon: 'grid',     label: 'Collage' },
  { icon: 'flash',    label: 'AI Enhance' },
  { icon: 'cut',      label: 'Remove BG' },
  { icon: 'download', label: '4K Export' },
];

const BENEFITS = [
  'No ads — ever',
  'Edit everything for free',
  'All premium tools unlocked',
  '7-day free trial, cancel anytime',
];

interface Plan { id: string; label: string; price: string; per: string; sub: string; badge?: string; best?: boolean; productId: string; }
const PLANS: Plan[] = [
  { id: 'yearly',  label: 'Yearly',   price: '$47', per: '/year',  sub: '7-day free trial, then $47/year', badge: 'BEST VALUE', best: true, productId: 'gweno_premium_yearly' },
  { id: 'quarter', label: '3 Months', price: '$15', per: '/3 mo',  sub: 'Limited-time offer',              badge: 'SAVE',                  productId: 'gweno_premium_quarter' },
  { id: 'monthly', label: 'Monthly',  price: '$7',  per: '/month', sub: 'Billed monthly',                                                  productId: 'gweno_premium_monthly' },
];

export default function PremiumScreen() {
  const { refreshUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [slide, setSlide] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance the hero carousel — but pause while the user is swiping it.
  const stopAuto = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startAuto = () => {
    stopAuto();
    timerRef.current = setInterval(() => {
      setSlide((s) => {
        const next = (s + 1) % SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * CARD_W, animated: true });
        return next;
      });
    }, 3500);
  };
  useEffect(() => { startAuto(); return stopAuto; }, []);

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / CARD_W));
    startAuto(); // resume auto-play once the user's swipe settles
  };

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleSubscribe = async () => {
    haptic.medium();
    setIsPurchasing(true);
    try {
      await purchaseService.purchasePackage({ product: { identifier: plan.productId } } as any);
      haptic.success();
      await refreshUser();
      Alert.alert('Your 7-day free trial has started 🎉', 'Enjoy every premium tool — ad-free.', [
        { text: 'Start Editing', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      haptic.error();
      if (!e?.message?.includes('cancelled')) Alert.alert('Checkout', e?.message ?? 'Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    haptic.light();
    setIsRestoring(true);
    try {
      const ok = await purchaseService.restorePurchases();
      await refreshUser();
      Alert.alert(ok ? 'Restored!' : 'No subscription found', ok ? 'Your premium access is back.' : 'No active subscription for this account.');
    } catch {
      Alert.alert('Error', 'Could not restore. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
            {isRestoring ? <ActivityIndicator size="small" color={Colors.text.muted} /> : <Text style={styles.restore}>Restore</Text>}
          </TouchableOpacity>
        </View>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Gweno</Text>
          <View style={styles.proPill}><Text style={styles.proPillText}>PRO</Text></View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* ── Hero carousel ─────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={stopAuto}
          onMomentumScrollEnd={onCarouselScroll}
          onScrollEndDrag={onCarouselScroll}
          style={{ marginTop: 8 }}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width: CARD_W }]}>
              {s.kind === 'compare' ? (
                // Real before/after photo cropped to the face, with fresh labels +
                // checklists drawn over scrim bands that blend into the card.
                <View style={styles.compare}>
                  <Image source={BEFORE_AFTER} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <View style={styles.splitLine} />

                  {/* Top scrim + labels */}
                  <View style={styles.compareTopBar}>
                    <View style={styles.photoTagDark}><Text style={styles.photoTagText}>BASIC EDIT</Text></View>
                    <View style={styles.photoTagPro}><Text style={styles.photoTagText}>PREMIUM EDIT</Text></View>
                  </View>

                  {/* Bottom scrim + short checklists */}
                  <View style={styles.compareBottomBar}>
                    <View style={styles.cbCol}>
                      <Text style={styles.cbText}>✓ Basic colour balance</Text>
                      <Text style={styles.cbText}>✓ Natural look</Text>
                    </View>
                    <View style={[styles.cbCol, { alignItems: 'flex-end' }]}>
                      <Text style={styles.cbTextPro}>✓ Pro retouching</Text>
                      <Text style={styles.cbTextPro}>✓ Sharper details</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.promo, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={54} color={Colors.white} />
                  <Text style={styles.promoTitle}>{s.title}</Text>
                  <Text style={styles.promoSub}>{s.sub}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Dots — tap to jump (works on desktop where drag-scroll doesn't) */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { haptic.light(); stopAuto(); setSlide(i); scrollRef.current?.scrollTo({ x: i * CARD_W, animated: true }); startAuto(); }}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <View style={[styles.dot, i === slide && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Feature chips ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Unlock all features to edit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CHIPS.map((c) => (
            <View key={c.label} style={styles.chip}>
              <Ionicons name={c.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.chipText}>{c.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Benefits ──────────────────────────────────────────────── */}
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* ── Plans ─────────────────────────────────────────────────── */}
        <View style={styles.plans}>
          {PLANS.map((p) => {
            const active = selectedPlan === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => { haptic.light(); setSelectedPlan(p.id); }} style={[styles.planCard, active && styles.planCardActive]}>
                <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTop}>
                    <Text style={[styles.planLabel, active && { color: Colors.primary }]}>{p.label}</Text>
                    {p.badge && <View style={[styles.planBadge, p.best && styles.planBadgeBest]}><Text style={styles.planBadgeText}>{p.badge}</Text></View>}
                  </View>
                  <Text style={styles.planSub}>{p.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, active && { color: Colors.primary }]}>{p.price}</Text>
                  <Text style={styles.planPer}>{p.per}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trial + payment note */}
        <Text style={styles.trialNote}>
          Your 7-day free trial starts after you add your account & card details. Cancel anytime before it ends and you won’t be charged.
        </Text>
        <View style={styles.payRow}>
          <Ionicons name="card-outline" size={16} color={Colors.text.muted} />
          <Text style={styles.payText}>Visa · Mastercard · Debit cards only</Text>
        </View>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity onPress={handleSubscribe} disabled={isPurchasing} style={styles.cta}>
          {isPurchasing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
              <Text style={styles.ctaSub}>Then {plan.price}{plan.per} · Cancel anytime</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms</Text> &{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/privacy-policy')}>Privacy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  restore: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  brand: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  proPill: { backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  proPillText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.5 },

  // Carousel
  slide: { paddingHorizontal: 16 },
  promo: { flex: 1, height: 300, borderRadius: Layout.radius.xxl, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  promoTitle: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_700Bold', color: Colors.white, textAlign: 'center' },
  promoSub: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  compare: { flexDirection: 'row', height: 300, borderRadius: Layout.radius.xxl, overflow: 'hidden', gap: 2 },
  splitLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
  compareTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  compareBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.5)' },
  cbCol: { flex: 1, gap: 4 },
  cbText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.92)' },
  cbTextPro: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Colors.premiumLight },
  photoTagDark: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  photoTagPro: { backgroundColor: Colors.premium, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  photoTagText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.white },
  compareCol: { flex: 1, padding: 18, gap: 8 },
  compareTag: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  compareSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginBottom: 8 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compareItem: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.white },
  compareItemDim: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.dark.border },
  dotActive: { width: 20, backgroundColor: Colors.primary },

  sectionTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, paddingHorizontal: 16, marginBottom: 10 },
  chipsRow: { gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 0.5, borderColor: Colors.dark.border },
  chipText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },

  benefits: { paddingHorizontal: 16, gap: 10, marginTop: 20, marginBottom: 22 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },

  plans: { paddingHorizontal: 16, gap: 10 },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  planCardActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  planBadge: { backgroundColor: Colors.premium, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  planBadgeBest: { backgroundColor: Colors.primary },
  planBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.3 },
  planSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 3 },
  planPrice: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  planPer: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },

  trialNote: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 17, marginTop: 16 },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  payText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },

  ctaBar: { padding: 16, paddingBottom: 24, backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  cta: { backgroundColor: Colors.primary, borderRadius: Layout.radius.xl, paddingVertical: 16, alignItems: 'center', gap: 2 },
  ctaText: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.white },
  ctaSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)' },
  legal: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', marginTop: 10, lineHeight: 16 },
  legalLink: { color: Colors.primary, fontFamily: 'Poppins_500Medium' },
});
