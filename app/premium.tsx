import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image,
  NativeSyntheticEvent, NativeScrollEvent, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { purchaseService } from '../services/purchase/purchase.service';
import { haptic } from '../utils/haptics';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

// Each page is full width; the portrait card sits centered inside it (so paging
// snaps perfectly). The card is small enough that the whole screen fits with no
// vertical scrolling.
const SLIDE_W = Layout.window.width;
const CARD_W = Math.round(Layout.window.width * 0.50);
const CARD_H = Math.round(CARD_W * 1.5);

// ── Hero cards — ONE portrait image per card ─────────────────────────────────
// To change a picture, just replace the matching file in assets/premium/ with
// your own PORTRAIT image (keep the same file name). before-after.jpg is your
// real photo; the others are placeholders until you swap them.
const SLIDES: { img: any; title: string }[] = [
  { img: require('../assets/premium/before-after.jpg'), title: 'Before / After' },
  { img: require('../assets/premium/filters.jpg'),      title: 'Stunning Filters' },
  { img: require('../assets/premium/nature.jpg'),       title: 'Make Nature Pop' },
  { img: require('../assets/premium/sports.jpg'),       title: 'Sharp Action Shots' },
  { img: require('../assets/premium/creative.jpg'),     title: 'Creative Studio' },
];

// Premium features teased to free users — "unlock 700+ with Pro".
const FEATURES: { icon: string; label: string; color: string }[] = [
  { icon: 'eye',          label: 'Eye Enhance',   color: '#3B82F6' },
  { icon: 'happy',        label: '500+ Stickers', color: '#EC4899' },
  { icon: 'albums',       label: '200+ Templates', color: '#F59E0B' },
  { icon: 'color-filter', label: '100+ Filters',  color: '#7C3AED' },
  { icon: 'flash',        label: 'AI Enhance',    color: '#06B6D4' },
  { icon: 'cut',          label: 'Remove BG',     color: '#EF4444' },
  { icon: 'sparkles',     label: 'Skin Retouch',  color: '#10B981' },
  { icon: 'grid',         label: 'Collage',       color: '#0EA5E9' },
  { icon: 'text',         label: 'Fonts & Curve', color: '#8B5CF6' },
  { icon: 'download',     label: '4K Export',     color: '#22C55E' },
  { icon: 'ban',          label: 'No Ads',        color: '#F97316' },
];

interface Plan { id: string; label: string; price: string; per: string; sub: string; sticker?: string; badge?: string; best?: boolean; productId: string; }
const PLANS: Plan[] = [
  { id: 'weekly',  label: 'Weekly',   price: 'Ksh 500',   per: '/week',     sub: 'Billed every week',                                                              productId: 'gweno_premium_weekly' },
  { id: 'quarter', label: '3 Months', price: 'Ksh 1,600', per: '/3 months', sub: 'About Ksh 123/wk, billed quarterly', sticker: 'SAVE 75%', badge: 'POPULAR',    productId: 'gweno_premium_quarter' },
  { id: 'yearly',  label: 'Yearly',   price: 'Ksh 3,000', per: '/year',     sub: '7-day free trial · about Ksh 58/wk', sticker: 'SAVE 88%', badge: 'BEST VALUE', best: true, productId: 'gweno_premium_yearly' },
];

// Slowly auto-scrolling row of feature icons (no cards — just icons + labels).
function FeatureMarquee() {
  const tx = useRef(new Animated.Value(0)).current;
  const [setW, setSetW] = useState(0);

  useEffect(() => {
    if (!setW) return;
    tx.setValue(0);
    const anim = Animated.loop(
      Animated.timing(tx, { toValue: -setW, duration: setW * 28, easing: Easing.linear, useNativeDriver: false }),
    );
    anim.start();
    return () => anim.stop();
  }, [setW]);

  return (
    <View style={styles.marqueeWrap} pointerEvents="none">
      <Animated.View
        style={[styles.marqueeRow, { transform: [{ translateX: tx }] }]}
        onLayout={(e) => setSetW(e.nativeEvent.layout.width / 2)} // two copies → half = one set
      >
        {[...FEATURES, ...FEATURES].map((f, i) => (
          <View key={i} style={styles.featItem}>
            <View style={[styles.featTile, { backgroundColor: f.color }]}>
              <Ionicons name={f.icon as any} size={20} color={Colors.white} />
            </View>
            <Text style={styles.featLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export default function PremiumScreen() {
  const { refreshUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [slide, setSlide] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAuto = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startAuto = () => {
    stopAuto();
    timerRef.current = setInterval(() => {
      setSlide((s) => {
        const next = (s + 1) % SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SLIDE_W, animated: true });
        return next;
      });
    }, 3500);
  };
  useEffect(() => { startAuto(); return stopAuto; }, []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W));
    startAuto();
  };
  const goTo = (i: number) => {
    const next = (i + SLIDES.length) % SLIDES.length;
    haptic.light(); stopAuto(); setSlide(next);
    scrollRef.current?.scrollTo({ x: next * SLIDE_W, animated: true }); startAuto();
  };

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleSubscribe = async () => {
    haptic.medium(); setIsPurchasing(true);
    try {
      await purchaseService.purchasePackage({ product: { identifier: plan.productId } } as any);
      haptic.success(); await refreshUser();
      Alert.alert('Your 7-day free trial has started 🎉', 'Enjoy every premium tool — ad-free.', [
        { text: 'Start Editing', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      haptic.error();
      if (!e?.message?.includes('cancelled')) Alert.alert('Checkout', e?.message ?? 'Please try again.');
    } finally { setIsPurchasing(false); }
  };

  const handleRestore = async () => {
    haptic.light(); setIsRestoring(true);
    try {
      const ok = await purchaseService.restorePurchases(); await refreshUser();
      Alert.alert(ok ? 'Restored!' : 'No subscription found', ok ? 'Your premium access is back.' : 'No active subscription.');
    } catch { Alert.alert('Error', 'Could not restore.'); } finally { setIsRestoring(false); }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Gweno</Text>
          <View style={styles.proPill}><Text style={styles.proPillText}>PRO</Text></View>
        </View>
        <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
          {isRestoring ? <ActivityIndicator size="small" color={Colors.text.muted} /> : <Text style={styles.restore}>Restore</Text>}
        </TouchableOpacity>
      </View>

      {/* Hero carousel (flex — takes the free space) */}
      <View style={styles.heroWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={stopAuto}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={styles.slide}>
              <View style={styles.card}>
                <Image source={s.img} style={styles.cardImg} resizeMode="cover" />
                <View style={styles.cardCaption}><Text style={styles.cardCaptionText}>{s.title}</Text></View>
              </View>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => goTo(slide - 1)} style={[styles.arrow, styles.arrowLeft]}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goTo(slide + 1)} style={[styles.arrow, styles.arrowRight]}>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
            <View style={[styles.dot, i === slide && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Pro features showcase — animated icons */}
      <Text style={styles.featHead}>Unlock 700+ Pro features</Text>
      <FeatureMarquee />

      {/* Trust line */}
      <Text style={styles.trust}>No ads · All premium tools · Cancel anytime</Text>

      {/* Plans — vertically stacked, with offer stickers (fills the space) */}
      <View style={styles.plans}>
        {PLANS.map((p) => {
          const active = selectedPlan === p.id;
          return (
            <TouchableOpacity key={p.id} onPress={() => { haptic.light(); setSelectedPlan(p.id); }} style={[styles.planRow, active && styles.planRowActive]}>
              {p.badge && <View style={[styles.planBadge, p.best && styles.planBadgeBest]}><Text style={styles.planBadgeText}>{p.badge}</Text></View>}
              <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
              <View style={{ flex: 1 }}>
                <View style={styles.planTop}>
                  <Text style={[styles.planLabel, active && { color: Colors.primary }]}>{p.label}</Text>
                  {p.sticker && <View style={styles.sticker}><Text style={styles.stickerText}>{p.sticker}</Text></View>}
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

      {/* CTA */}
      <TouchableOpacity onPress={handleSubscribe} disabled={isPurchasing} style={styles.cta}>
        {isPurchasing ? <ActivityIndicator color={Colors.white} /> : (
          <>
            <View style={styles.ctaBadge}>
              <Ionicons name="thumbs-up" size={11} color={Colors.dark.background} />
              <Text style={styles.ctaBadgeText}>95%</Text>
            </View>
            <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
            <Text style={styles.ctaSub}>Then {plan.price}{plan.per} · Visa · Mastercard · Debit only</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.legal}>
        7-day free trial, then {plan.price}{plan.per}. Auto-renews until cancelled.{'\n'}
        <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms &amp; Conditions</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  proPill: { backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  proPillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.5 },
  restore: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  // Carousel — fixed to the card height so the plans below fill the rest
  heroWrap: { height: CARD_H + 6, justifyContent: 'center' },
  slide: { width: SLIDE_W, alignItems: 'center', justifyContent: 'center' },
  card: { width: CARD_W, height: CARD_H, borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card },
  cardImg: { width: '100%', height: '100%' },
  cardCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 10 },
  cardCaptionText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.white, textAlign: 'center' },
  arrow: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.dark.border },
  dotActive: { width: 18, backgroundColor: Colors.primary },

  featHead: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center', marginBottom: 8 },
  marqueeWrap: { height: 64, overflow: 'hidden', justifyContent: 'center' },
  marqueeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featItem: { width: 76, alignItems: 'center', gap: 5 },
  featTile: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, textAlign: 'center' },
  trust: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted, textAlign: 'center', marginVertical: 6 },

  // Plans — vertical stack that fills the space below the carousel
  plans: { flex: 1, justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 4 },
  planRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg, paddingVertical: 11, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: Colors.dark.border,
  },
  planRowActive: {
    borderColor: Colors.primary, backgroundColor: '#0C1915',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  planSub: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  planPrice: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  planPer: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  sticker: { backgroundColor: '#1E3A2E', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  stickerText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: Colors.primaryLight, letterSpacing: 0.3 },
  planBadge: { position: 'absolute', top: -8, right: 14, backgroundColor: Colors.premium, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  planBadgeBest: { backgroundColor: Colors.primary },
  planBadgeText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.3 },

  cta: {
    backgroundColor: Colors.primary, borderRadius: Layout.radius.xl, paddingVertical: 15, alignItems: 'center', gap: 2, marginHorizontal: 16, marginTop: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  ctaBadge: {
    position: 'absolute', top: -10, right: 14, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.premiumLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  ctaBadgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  ctaSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)' },
  legal: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, textAlign: 'center', marginTop: 8, marginBottom: 4, lineHeight: 16, paddingHorizontal: 16 },
  legalLink: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold', textDecorationLine: 'underline' },
});
