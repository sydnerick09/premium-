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

// Each page is full width; the portrait card sits centered inside it (so paging
// snaps perfectly). The card is small enough that the whole screen fits with no
// vertical scrolling.
const SLIDE_W = Layout.window.width;
const CARD_W = Math.round(Layout.window.width * 0.46);

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

const BENEFITS = ['No ads — ever', 'Edit everything free', 'All premium tools', '7-day free trial'];

interface Plan { id: string; label: string; price: string; per: string; badge?: string; best?: boolean; productId: string; }
const PLANS: Plan[] = [
  { id: 'monthly', label: 'Monthly',  price: '$7',  per: '/mo',  productId: 'gweno_premium_monthly' },
  { id: 'quarter', label: '3 Months', price: '$15', per: '/3mo', badge: 'SAVE',       productId: 'gweno_premium_quarter' },
  { id: 'yearly',  label: 'Yearly',   price: '$47', per: '/yr',  badge: 'BEST', best: true, productId: 'gweno_premium_yearly' },
];

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

      {/* Benefits (compact 2-column) */}
      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b} style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Plans (3 across) */}
      <View style={styles.plans}>
        {PLANS.map((p) => {
          const active = selectedPlan === p.id;
          return (
            <TouchableOpacity key={p.id} onPress={() => { haptic.light(); setSelectedPlan(p.id); }} style={[styles.planCard, active && styles.planCardActive]}>
              {p.badge && <View style={[styles.planBadge, p.best && styles.planBadgeBest]}><Text style={styles.planBadgeText}>{p.badge}</Text></View>}
              <Text style={[styles.planLabel, active && { color: Colors.primary }]}>{p.label}</Text>
              <Text style={[styles.planPrice, active && { color: Colors.primary }]}>{p.price}</Text>
              <Text style={styles.planPer}>{p.per}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity onPress={handleSubscribe} disabled={isPurchasing} style={styles.cta}>
        {isPurchasing ? <ActivityIndicator color={Colors.white} /> : (
          <>
            <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
            <Text style={styles.ctaSub}>Then {plan.price}{plan.per} · Visa · Mastercard · Debit only</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.legal}>
        Cancel anytime ·{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms</Text> &{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
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

  // Carousel
  heroWrap: { flex: 1, justifyContent: 'center', minHeight: 120 },
  slide: { width: SLIDE_W, alignItems: 'center', justifyContent: 'center' },
  card: { width: CARD_W, aspectRatio: 2 / 3, borderRadius: Layout.radius.xl, overflow: 'hidden', backgroundColor: Colors.dark.card },
  cardImg: { width: '100%', height: '100%' },
  cardCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 10 },
  cardCaptionText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.white, textAlign: 'center' },
  arrow: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.dark.border },
  dotActive: { width: 18, backgroundColor: Colors.primary },

  benefits: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 6, paddingHorizontal: 16, marginBottom: 12 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '42%' },
  benefitText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },

  plans: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  planCard: { flex: 1, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.dark.border },
  planCardActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  planBadge: { position: 'absolute', top: -8, backgroundColor: Colors.premium, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  planBadgeBest: { backgroundColor: Colors.primary },
  planBadgeText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.3 },
  planLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, marginTop: 2 },
  planPrice: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginTop: 2 },
  planPer: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },

  cta: { backgroundColor: Colors.primary, borderRadius: Layout.radius.xl, paddingVertical: 14, alignItems: 'center', gap: 2, marginHorizontal: 16 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  ctaSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)' },
  legal: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', marginTop: 8 },
  legalLink: { color: Colors.primary, fontFamily: 'Poppins_500Medium' },
});
