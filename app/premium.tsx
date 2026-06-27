import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useAuthStore } from '../store/authStore';
import { purchaseService } from '../services/purchase/purchase.service';
import { haptic } from '../utils/haptics';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const FEATURES = [
  { icon: 'flash-outline', label: 'AI Background Removal', desc: 'Remove any background instantly' },
  { icon: 'color-filter-outline', label: '100+ Premium Filters', desc: 'Exclusive cinematic LUTs & effects' },
  { icon: 'sparkles-outline', label: 'Advanced Beauty Tools', desc: 'Face reshape, teeth whitening & more' },
  { icon: 'cloud-upload-outline', label: '10 GB Cloud Storage', desc: 'Backup & sync all your projects' },
  { icon: 'download-outline', label: '4K Export', desc: 'Export up to 3840px resolution' },
  { icon: 'layers-outline', label: 'Unlimited Layers', desc: 'Advanced multi-layer editing' },
  { icon: 'ban-outline', label: 'No Ads', desc: 'Pure, distraction-free editing' },
  { icon: 'infinite-outline', label: 'Unlimited Exports', desc: 'Export as many times as you want' },
];

interface Plan {
  id: string;
  label: string;
  price: string;
  period: string;
  badge?: string;
  isBest?: boolean;
  productId: string;
}

const PLANS: Plan[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$1.99',
    period: '/ week',
    productId: 'erick_premium_weekly',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$4.99',
    period: '/ month',
    badge: 'Most Popular',
    isBest: true,
    productId: 'erick_premium_monthly',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$29.99',
    period: '/ year',
    badge: 'Save 50%',
    productId: 'erick_premium_yearly',
  },
];

export default function PremiumScreen() {
  const { user, refreshUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [offerings, setOfferings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isPremium = user?.isPremium ?? false;

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const o = await purchaseService.getOfferings();
      setOfferings(o);
    } catch {
      // Use static plan data as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    haptic.medium();
    setIsPurchasing(true);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);
      if (!plan) return;

      // In production, use offerings?.current?.availablePackages with matching product
      await purchaseService.purchasePackage(
        offerings?.current?.availablePackages?.find((pkg: any) =>
          pkg.product.identifier === plan.productId
        ) ?? { product: { identifier: plan.productId } }
      );

      haptic.success();
      await refreshUser();
      Alert.alert('Welcome to Premium! 🎉', 'All premium features are now unlocked.', [
        { text: 'Start Editing', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      haptic.error();
      if (!e?.message?.includes('cancelled')) {
        Alert.alert('Purchase Failed', e?.message ?? 'Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    haptic.light();
    setIsRestoring(true);
    try {
      const restored = await purchaseService.restorePurchases();
      if (restored) {
        haptic.success();
        await refreshUser();
        Alert.alert('Restored!', 'Your premium subscription has been restored.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found for this account.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isPremium) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.alreadyPremium}>
          <LinearGradient colors={Colors.gradients.gold} style={styles.crownGrad}>
            <Text style={styles.crownIcon}>👑</Text>
          </LinearGradient>
          <Text style={styles.alreadyTitle}>You're Premium!</Text>
          <Text style={styles.alreadyDesc}>Enjoy all premium features. Thank you for your support!</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backToEditingBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.backToEditingGrad}>
              <Text style={styles.backToEditingText}>Back to Editing</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient colors={Colors.gradients.premium} style={styles.hero}>
          <Text style={styles.heroIcon}>👑</Text>
          <Text style={styles.heroTitle}>Erick Premium</Text>
          <Text style={styles.heroSubtitle}>Unlock your full creative potential</Text>
        </LinearGradient>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Everything included</Text>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.featureIconBg}>
                <Ionicons name={f.icon as any} size={16} color={Colors.white} />
              </LinearGradient>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose a plan</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 20 }} />
          ) : (
            <View style={styles.plansList}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => { haptic.light(); setSelectedPlan(plan.id); }}
                  style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
                >
                  {selectedPlan === plan.id && (
                    <LinearGradient
                      colors={['#0C1916', '#0A1315']}
                      style={StyleSheet.absoluteFillObject as any}
                    />
                  )}
                  <View style={styles.planLeft}>
                    <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioActive]}>
                      {selectedPlan === plan.id && <View style={styles.planRadioInner} />}
                    </View>
                    <View>
                      <Text style={[styles.planLabel, selectedPlan === plan.id && { color: Colors.primary }]}>
                        {plan.label}
                      </Text>
                      {plan.badge && (
                        <LinearGradient
                          colors={plan.isBest ? Colors.gradients.primary : Colors.gradients.gold}
                          style={styles.planBadge}
                        >
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={[styles.planPrice, selectedPlan === plan.id && { color: Colors.primary }]}>
                      {plan.price}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Legal */}
        <Text style={styles.legalText}>
          Subscription renews automatically. Cancel anytime.{'\n'}
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text>.
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={Colors.text.muted} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity onPress={handleSubscribe} disabled={isPurchasing} style={styles.subscribeBtn}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.subscribeBtnGrad}>
            {isPurchasing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.subscribeBtnText}>
                  Start {PLANS.find((p) => p.id === selectedPlan)?.label} Plan
                </Text>
                <Text style={styles.subscribeBtnPrice}>
                  {PLANS.find((p) => p.id === selectedPlan)?.price}{PLANS.find((p) => p.id === selectedPlan)?.period}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  scroll: { paddingBottom: 20 },
  hero: {
    alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24,
    marginHorizontal: 16, borderRadius: Layout.radius.xxl, marginBottom: 24, gap: 8,
  },
  heroIcon: { fontSize: 48 },
  heroTitle: { fontSize: Layout.fontSize['3xl'], fontFamily: 'Poppins_700Bold', color: Colors.white },
  heroSubtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  featuresSection: { paddingHorizontal: 16, gap: 10, marginBottom: 28 },
  featuresTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 4 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, padding: 14, borderRadius: Layout.radius.lg,
  },
  featureIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1 },
  featureLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  featureDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  plansSection: { paddingHorizontal: 16, marginBottom: 20 },
  plansTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 12 },
  plansList: { gap: 10 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, padding: 16,
    borderWidth: 1, borderColor: Colors.dark.border, overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.primary },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark.border,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioActive: { borderColor: Colors.primary },
  planRadioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },
  planLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  planBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, alignSelf: 'flex-start' },
  planBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: Colors.white },
  planRight: { alignItems: 'flex-end' },
  planPrice: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  planPeriod: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  legalText: {
    fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted,
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 18,
  },
  legalLink: { color: Colors.primary, fontFamily: 'Poppins_500Medium' },
  restoreBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  restoreText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  ctaBar: { padding: 16, paddingBottom: 28, backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  subscribeBtn: { borderRadius: Layout.radius.xl, overflow: 'hidden' },
  subscribeBtnGrad: { paddingVertical: 16, alignItems: 'center', gap: 2 },
  subscribeBtnText: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.white },
  subscribeBtnPrice: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)' },
  alreadyPremium: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  crownGrad: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  crownIcon: { fontSize: 40 },
  alreadyTitle: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  alreadyDesc: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, textAlign: 'center' },
  backToEditingBtn: { borderRadius: Layout.radius.xl, overflow: 'hidden', width: '100%', marginTop: 8 },
  backToEditingGrad: { paddingVertical: 16, alignItems: 'center' },
  backToEditingText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
