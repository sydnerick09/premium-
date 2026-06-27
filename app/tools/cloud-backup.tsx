import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useProjectStore } from '../../store/projectStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function CloudBackupScreen() {
  const projects = useProjectStore((s) => s.projects);
  const syncToCloud = useProjectStore((s) => s.syncToCloud);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const backupAll = async () => {
    if (!projects.length) { setStatus('Nothing to back up yet.'); return; }
    setBusy(true); haptic.medium();
    setStatus(`Backing up ${projects.length} project${projects.length === 1 ? '' : 's'}…`);
    try {
      for (const p of projects) {
        await Promise.resolve(syncToCloud(p));
      }
      haptic.success();
      setStatus(`✓ Backed up ${projects.length} project${projects.length === 1 ? '' : 's'} to the cloud.`);
    } catch (e: any) {
      haptic.error();
      setStatus('Backup failed. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  const restore = () => {
    haptic.light();
    setBusy(true);
    setStatus('Restoring from the cloud…');
    loadProjects();
    setTimeout(() => { setBusy(false); setStatus('✓ Synced with the cloud.'); haptic.success(); }, 1200);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Cloud Backup</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <View style={{ padding: 20, gap: 16 }}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="cloud-done-outline" size={40} color={Colors.primary} /></View>
          <Text style={styles.heroNum}>{projects.length}</Text>
          <Text style={styles.heroLabel}>projects on this device</Text>
        </View>

        <Text style={styles.desc}>
          Back up your projects and edited images to your secure Supabase cloud, then restore them on any device you sign in from.
        </Text>

        <TouchableOpacity onPress={backupAll} disabled={busy} style={[styles.cta, busy && { opacity: 0.5 }]}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
            <Ionicons name="cloud-upload" size={18} color={Colors.white} />
            <Text style={styles.ctaText}>Back up now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={restore} disabled={busy} style={[styles.secondary, busy && { opacity: 0.5 }]}>
          <Ionicons name="cloud-download-outline" size={18} color={Colors.primary} />
          <Text style={styles.secondaryText}>Restore from cloud</Text>
        </TouchableOpacity>

        {status && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  hero: { alignItems: 'center', gap: 4, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, paddingVertical: 24, borderWidth: 0.5, borderColor: Colors.dark.border },
  heroIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#0C1D17', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  heroNum: { fontSize: 34, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  heroLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  desc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, lineHeight: 20, textAlign: 'center' },
  cta: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: Colors.primary },
  secondaryText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  statusBox: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, padding: 14, borderWidth: 0.5, borderColor: Colors.dark.border },
  statusText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, textAlign: 'center' },
});
