import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { localStorage } from '../services/storage/localStorage.service';

// Single-screen onboarding — one clear value proposition + a few proof points
// and a single call-to-action, so new users get into the app fast.
const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: 'sparkles',     title: 'One-tap AI enhance', desc: 'Fix lighting, colour & sharpness instantly.' },
  { icon: 'cut',          title: 'Clean background swap', desc: 'Change the background — your subject stays untouched.' },
  { icon: 'color-filter', title: 'Pro filters & text',  desc: '100+ filters, fonts, stickers & collages.' },
];

export default function OnboardingScreen() {
  const handleGetStarted = () => {
    localStorage.setOnboardingDone();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.content}>
          {/* Brand mark */}
          <View style={styles.logo}>
            <Ionicons name="camera" size={40} color={Colors.white} />
          </View>

          <Text style={styles.title}>Studio-quality photos,{'\n'}in seconds.</Text>
          <Text style={styles.subtitle}>
            The all-in-one editor that helps you turn everyday shots into work that wins clients.
          </Text>

          {/* Proof points */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Single CTA */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.85} style={styles.cta}>
            <Text style={styles.ctaText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  safe: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },

  logo: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  title: {
    fontSize: Layout.fontSize['4xl'], fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary, lineHeight: 40, marginBottom: 12,
  },
  subtitle: {
    fontSize: Layout.fontSize.md, fontFamily: 'Poppins_400Regular',
    color: Colors.text.secondary, lineHeight: 24, marginBottom: 36,
  },

  features: { gap: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#0C1915',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  featureDesc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },

  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Layout.radius.lg, paddingVertical: 17,
  },
  ctaText: { fontSize: Layout.fontSize.md, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.3 },
});
