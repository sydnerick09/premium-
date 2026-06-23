import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the Erick Photo Editor application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

These Terms apply to all users of the App, including free and premium subscribers.`,
  },
  {
    title: '2. Description of Service',
    body: `Erick Photo Editor is a mobile photo editing application that provides:

• Photo import from camera and gallery
• AI-powered photo enhancement tools
• Professional photo editing and adjustment tools
• Creative filters, beauty tools, and effects
• Cloud backup and sync features (Premium)
• Export and sharing capabilities

We reserve the right to modify, suspend, or discontinue any part of the service at any time.`,
  },
  {
    title: '3. User Accounts',
    body: `To access certain features, you must create an account:

• You must provide accurate and complete information during registration
• You are responsible for maintaining the confidentiality of your account credentials
• You are responsible for all activities that occur under your account
• You must be at least 13 years old to create an account
• You agree to notify us immediately of any unauthorized access to your account

We reserve the right to terminate accounts that violate these Terms.`,
  },
  {
    title: '4. User Content',
    body: `You retain ownership of all photos and content you create with Erick:

• You grant us a limited license to store and process your content solely to provide the service
• You represent that you have the right to use all photos you import into the App
• You must not use the App to edit or create content that is illegal, harmful, or infringes on others' rights
• You are solely responsible for the content you create and share

We do not claim ownership of your photos or creations.`,
  },
  {
    title: '5. Prohibited Uses',
    body: `You agree NOT to:

• Use the App for illegal purposes or to violate any laws
• Create, edit, or distribute non-consensual intimate imagery
• Infringe upon intellectual property rights of others
• Attempt to reverse-engineer or hack the App
• Use automated scripts or bots to access the App
• Create fake accounts or impersonate others
• Upload malware or harmful code
• Use the App in any way that could damage or overburden our systems`,
  },
  {
    title: '6. Premium Subscriptions',
    body: `Erick offers premium subscription plans:

• **Billing**: Subscriptions are billed through Google Play. By subscribing, you agree to Google Play's terms.
• **Auto-renewal**: Subscriptions auto-renew at the end of each period unless cancelled at least 24 hours before renewal.
• **Cancellation**: You can cancel anytime via Google Play > Subscriptions.
• **Refunds**: Refund requests are handled by Google Play according to their refund policy.
• **Pricing**: We reserve the right to change subscription prices with reasonable notice.
• **Premium benefits**: Premium features are available as long as your subscription is active.

No refunds are provided for partial subscription periods.`,
  },
  {
    title: '7. Intellectual Property',
    body: `The Erick app, including its design, code, filters, and other content (excluding your photos), is owned by us and protected by intellectual property laws:

• You may not copy, reproduce, or redistribute any part of the App
• All filters, effects, and AI models are proprietary
• The Erick name and logo are trademarks
• Open source components are used under their respective licenses`,
  },
  {
    title: '8. Disclaimer of Warranties',
    body: `THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:

• Merchantability and fitness for a particular purpose
• Non-infringement of third-party rights
• Uninterrupted or error-free service
• Accuracy of AI enhancement results

AI photo enhancement results may vary and are not guaranteed to be accurate or satisfactory.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:

• Loss of photos, projects, or data
• Indirect, incidental, or consequential damages
• Loss of profits or revenue
• Damages exceeding the amount paid for the App in the past 12 months

You acknowledge that photo editing inherently carries risk of undesired results. Always maintain backups of important photos.`,
  },
  {
    title: '10. Privacy',
    body: `Our Privacy Policy (available at Settings > Privacy Policy) explains how we collect and use your data. By using the App, you agree to our Privacy Policy, which is incorporated into these Terms.`,
  },
  {
    title: '11. Termination',
    body: `We may suspend or terminate your account if you:

• Violate these Terms
• Engage in fraudulent activity
• Abuse the service

You may terminate your account at any time via Settings > Account > Delete Account.

Upon termination, your right to use the App ceases immediately.`,
  },
  {
    title: '12. Changes to Terms',
    body: `We may update these Terms from time to time. We will notify you of significant changes via in-app notification. Continued use of the App after changes take effect constitutes acceptance of the updated Terms.`,
  },
  {
    title: '13. Governing Law',
    body: `These Terms are governed by the laws of Kenya. Any disputes shall be resolved through binding arbitration in Nairobi, Kenya, except where prohibited by law.`,
  },
  {
    title: '14. Contact',
    body: `For questions about these Terms:

📧 legal@erickphotoeditor.app
🌐 erickphotoeditor.app/terms

Erick Photo Editor
Nairobi, Kenya`,
  },
];

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Terms of Service</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.effectiveDate}>Last updated: June 2025</Text>
        <Text style={styles.intro}>
          Please read these Terms of Service carefully before using Erick Photo Editor. These Terms govern your use of our application and services.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border,
  },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  scroll: { padding: 20 },
  effectiveDate: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginBottom: 12 },
  intro: {
    fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary,
    lineHeight: 22, marginBottom: 24, backgroundColor: Colors.dark.card,
    padding: 16, borderRadius: Layout.radius.lg, borderLeftWidth: 3, borderLeftColor: Colors.secondary,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 10 },
  sectionBody: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 22 },
});
