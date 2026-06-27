import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
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

export default function StatusSaverScreen() {
  const user = useAuthStore((s) => s.user);
  const createProject = useProjectStore((s) => s.createProject);

  const openWhatsApp = () => {
    const url = Platform.OS === 'web' ? 'https://web.whatsapp.com' : 'whatsapp://';
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => Linking.openURL('https://whatsapp.com'));
  };

  const saveFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (res.canceled || !res.assets?.[0]?.uri || !user) return;
    haptic.success();
    const p = createProject({ userId: user.id, imageUri: res.assets[0].uri, width: 0, height: 0, fileSize: 0, title: 'Saved status' });
    router.replace({ pathname: '/editor', params: { id: p.id } });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Status Saver</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <View style={{ padding: 20, gap: 16 }}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="logo-whatsapp" size={42} color="#25D366" /></View>
          <Text style={styles.heroTitle}>Save WhatsApp statuses</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            For privacy, browsers can't read WhatsApp's files directly. The full auto‑status‑grabber needs the Android app
            (reads <Text style={styles.code}>WhatsApp/Media/.Statuses</Text>). On the web you can still save a status you've
            captured: view it in WhatsApp, screenshot it, then import it below.
          </Text>
        </View>

        <TouchableOpacity onPress={openWhatsApp} style={styles.secondary}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={styles.secondaryText}>Open WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveFromGallery} style={styles.cta}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
            <Ionicons name="download-outline" size={18} color={Colors.white} />
            <Text style={styles.ctaText}>Import a status to save / edit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  hero: { alignItems: 'center', gap: 10, marginTop: 8 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0D2219', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, padding: 14, borderWidth: 0.5, borderColor: Colors.dark.border },
  infoText: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 20 },
  code: { fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.card },
  secondaryText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  cta: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
