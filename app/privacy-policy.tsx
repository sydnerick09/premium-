import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect the following types of information:

• **Account Information**: When you register, we collect your name, email address, and password (stored securely via Firebase Authentication).

• **Images and Projects**: Photos you import, edit, and save are stored locally on your device. If cloud backup is enabled, project metadata and thumbnails may be synced to Firebase Firestore/Storage.

• **Usage Data**: With your consent, we collect anonymized analytics data (screen views, feature usage) via Firebase Analytics to improve the app.

• **Device Information**: Device model, OS version, and crash reports via Firebase Crashlytics to help us fix bugs.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to:

• Provide and improve the Erick photo editing service
• Sync your projects across devices (cloud backup)
• Send you important account and service updates
• Analyze app performance and fix crashes
• Process premium subscriptions via RevenueCat
• Comply with legal obligations`,
  },
  {
    title: '3. Data Storage and Security',
    body: `Your data is stored and protected as follows:

• **Local Storage**: Photos and editing projects are stored on your device using secure local storage.

• **Cloud Storage**: Synced data is stored in Google Firebase, which uses industry-standard encryption (AES-256 at rest, TLS in transit).

• **Authentication**: Passwords are never stored in plaintext. We use Firebase Authentication with secure hashing.

• **Retention**: You can delete your account and all associated data at any time from Settings > Account > Delete Account.`,
  },
  {
    title: '4. Third-Party Services',
    body: `Erick uses the following third-party services:

• **Firebase** (Google LLC) — Authentication, database, cloud storage, analytics, and crash reporting
• **RevenueCat** — Subscription and in-app purchase management
• **Google Play** — App distribution and billing

Each service has its own privacy policy. We recommend reviewing them at their respective websites.`,
  },
  {
    title: '5. Your Photos and Images',
    body: `We respect your creative content:

• Photos you edit in Erick remain yours. We do not claim ownership of your images.
• Your original photos are processed on-device. We do not upload your photos to our servers without your explicit consent.
• Cloud backup (if enabled) stores project data to allow sync across devices — you can disable this at any time.
• We do not sell, share, or use your photos for advertising or AI training purposes.`,
  },
  {
    title: '6. Children\'s Privacy',
    body: `Erick is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`,
  },
  {
    title: '7. Your Rights',
    body: `Depending on your location, you may have rights including:

• **Access**: Request a copy of your personal data
• **Correction**: Update inaccurate information in your account
• **Deletion**: Delete your account and all associated data (Settings > Account > Delete Account)
• **Portability**: Export your data in a machine-readable format
• **Opt-out**: Disable analytics data collection in Settings > Analytics

To exercise any of these rights, contact us at privacy@erickphotoeditor.app`,
  },
  {
    title: '8. Advertising',
    body: `The free version of Erick may display ads. We use industry-standard advertising partners that may use cookies or device identifiers. You can opt out of personalized advertising in your device settings.

Premium subscribers enjoy an ad-free experience.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of Erick after changes take effect constitutes acceptance of the updated policy.`,
  },
  {
    title: '10. Contact Us',
    body: `If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:

📧 privacy@erickphotoeditor.app
🌐 erickphotoeditor.app/privacy

Erick Photo Editor
Nairobi, Kenya`,
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.effectiveDate}>Last updated: June 2025</Text>
        <Text style={styles.intro}>
          At Erick Photo Editor, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our app.
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
    padding: 16, borderRadius: Layout.radius.lg, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 10 },
  sectionBody: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 22 },
});
