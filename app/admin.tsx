import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://nkavbdhccvwzfiocdefq.supabase.co';
// Change this by setting EXPO_PUBLIC_ADMIN_PASSWORD before building.
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? 'erick-admin';
const KEY_STORE = 'erick_admin_service_key';
const BUCKET = 'project-images';

function lsGet(k: string): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(k) : null; } catch { return null; }
}
function lsSet(k: string, v: string) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(k, v); } catch {}
}

export default function AdminScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [serviceKey, setServiceKey] = useState<string | null>(lsGet(KEY_STORE));
  const [keyInput, setKeyInput] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const admin: SupabaseClient | null = useMemo(
    () => (serviceKey ? createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null),
    [serviceKey],
  );

  const load = useCallback(async () => {
    if (!admin) return;
    setLoading(true);
    setStatus('');
    try {
      const [pr, pj] = await Promise.all([
        admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
        admin.from('projects').select('id,user_id,title,status,updated_at,edited_image_uri').order('updated_at', { ascending: false }).limit(500),
      ]);
      if (pr.error) throw pr.error;
      if (pj.error) throw pj.error;
      setProfiles(pr.data ?? []);
      setProjects(pj.data ?? []);
      setStatus(`Loaded ${pr.data?.length ?? 0} profiles, ${pj.data?.length ?? 0} projects.`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'could not load (check the service key).'}`);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const clearMedia = useCallback(async () => {
    if (!admin) return;
    const go = async () => {
      setLoading(true);
      setStatus('Clearing…');
      try {
        // Delete every project row (service role bypasses RLS).
        const del = await admin.from('projects').delete().not('id', 'is', null);
        if (del.error) throw del.error;
        // Empty the storage bucket (folder-per-user).
        const { data: roots } = await admin.storage.from(BUCKET).list('', { limit: 1000 });
        for (const r of roots ?? []) {
          if ((r as any).id === null || !(r as any).metadata) {
            const { data: files } = await admin.storage.from(BUCKET).list(r.name, { limit: 1000 });
            const paths = (files ?? []).map((f) => `${r.name}/${f.name}`);
            if (paths.length) await admin.storage.from(BUCKET).remove(paths);
          }
        }
        setStatus('All media & projects cleared.');
        await load();
      } catch (e: any) {
        setStatus(`Error: ${e?.message ?? 'clear failed.'}`);
      } finally {
        setLoading(false);
      }
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm('Delete ALL projects and stored media? This cannot be undone.')) go();
    } else {
      Alert.alert('Delete everything?', 'Delete ALL projects and stored media? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: go },
      ]);
    }
  }, [admin, load]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    lsSet(KEY_STORE, k);
    setServiceKey(k);
    setKeyInput('');
    setTimeout(load, 0);
  };

  // ── Password gate ────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.gate}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.gateIcon}>
              <Ionicons name="lock-closed" size={26} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.gateTitle}>Admin Panel</Text>
            <Text style={styles.gateSub}>Enter the admin password to continue.</Text>
            <TextInput
              value={pw}
              onChangeText={setPw}
              placeholder="Password"
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              style={styles.input}
              onSubmitEditing={() => { if (pw === ADMIN_PASSWORD) setUnlocked(true); }}
            />
            <TouchableOpacity
              onPress={() => { if (pw === ADMIN_PASSWORD) setUnlocked(true); else setStatus('Wrong password.'); }}
              style={styles.primaryBtn}
            >
              <LinearGradient colors={Colors.gradients.primary} style={styles.primaryGradient}>
                <Text style={styles.primaryText}>Unlock</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!!status && <Text style={styles.errText}>{status}</Text>}
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ marginTop: 18 }}>
              <Text style={styles.link}>← Back to app</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Needs the service key ──────────────────────────────────────────────────────
  if (!serviceKey) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.gate}>
            <Ionicons name="key-outline" size={30} color={Colors.primary} />
            <Text style={styles.gateTitle}>Connect database</Text>
            <Text style={styles.gateSub}>
              Paste your Supabase <Text style={{ fontFamily: 'Poppins_700Bold' }}>service_role</Text> key
              (Dashboard → Project Settings → API). It is stored only on this device and never uploaded.
            </Text>
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="service_role key"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="none"
              style={[styles.input, { height: 80 }]}
              multiline
            />
            <TouchableOpacity onPress={saveKey} style={styles.primaryBtn}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.primaryGradient}>
                <Text style={styles.primaryText}>Save & Connect</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!!status && <Text style={styles.errText}>{status}</Text>}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
          <TouchableOpacity onPress={load} style={{ padding: 4 }}>
            <Ionicons name="refresh" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{profiles.length}</Text>
            <Text style={styles.statLabel}>Accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={load} disabled={loading} style={[styles.actionBtn, loading && { opacity: 0.5 }]}>
            <Ionicons name="cloud-download-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionText}>Reload</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearMedia} disabled={loading} style={[styles.actionBtn, styles.dangerBtn, loading && { opacity: 0.5 }]}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Clear all media</Text>
          </TouchableOpacity>
        </View>
        {!!status && <Text style={styles.status}>{status}</Text>}

        {/* Accounts */}
        <Text style={styles.sectionTitle}>Accounts ({profiles.length})</Text>
        {profiles.length === 0 && <Text style={styles.empty}>No accounts yet.</Text>}
        {profiles.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.email || '(no email)'}</Text>
            <Text style={styles.cardSub}>{p.display_name || '—'} · {p.is_premium ? 'Premium' : 'Free'}</Text>
            <Text style={styles.cardMeta}>{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</Text>
            <Text style={styles.cardId}>{p.id}</Text>
          </View>
        ))}

        {/* Projects */}
        <Text style={styles.sectionTitle}>Projects ({projects.length})</Text>
        {projects.length === 0 && <Text style={styles.empty}>No projects.</Text>}
        {projects.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.title || 'Untitled'}</Text>
            <Text style={styles.cardSub}>
              {p.status} · {p.edited_image_uri ? 'has edited image' : 'no edit'}
            </Text>
            <Text style={styles.cardMeta}>{p.updated_at ? new Date(p.updated_at).toLocaleString() : ''}</Text>
            <Text style={styles.cardId}>user: {p.user_id}</Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => { lsSet(KEY_STORE, ''); setServiceKey(null); }}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={styles.link}>Forget service key on this device</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  gateIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginTop: 4 },
  gateSub: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  input: {
    width: '100%', maxWidth: 420, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
    color: Colors.text.primary, fontFamily: 'Poppins_500Medium',
  },
  primaryBtn: { width: '100%', maxWidth: 420, borderRadius: Layout.radius.md, overflow: 'hidden', marginTop: 6 },
  primaryGradient: { paddingVertical: 13, alignItems: 'center' },
  primaryText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  errText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: '#EF4444', marginTop: 8, textAlign: 'center' },
  link: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.dark.border },
  statNum: { fontSize: 30, fontFamily: 'Poppins_700Bold', color: Colors.primary },
  statLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, paddingVertical: 12,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  dangerBtn: { borderColor: Colors.error },
  actionText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  status: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 10 },

  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginTop: 22, marginBottom: 8 },
  empty: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  card: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: Colors.dark.border },
  cardTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  cardSub: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, marginTop: 2 },
  cardMeta: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  cardId: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 4 },
});
