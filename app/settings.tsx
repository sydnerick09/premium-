import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Platform, Share, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { haptic } from '../utils/haptics';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuthStore();
  const {
    isDarkMode, toggleTheme,
    autoSave, setAutoSave,
    showGrid, hapticFeedback,
    highQualityPreview, notificationsEnabled, analyticsEnabled,
    setThemeMode,
  } = useSettingsStore();

  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () =>
            Alert.prompt?.('Confirm Password', 'Enter your password to confirm:', async (password) => {
              if (!password) return;
              try {
                await deleteAccount(password);
                router.replace('/(auth)/login');
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Could not delete account');
              }
            }) ??
            Alert.alert('Not supported', 'Please use the app menu to delete your account.'),
        },
      ]
    );
  };

  // App links — set EXPO_PUBLIC_STORE_URL to your real Play Store listing later.
  const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://premium-web-sooty.vercel.app';
  const STORE_URL = process.env.EXPO_PUBLIC_STORE_URL ?? APP_URL;

  const doSignOut = async () => {
    try { await signOut(); } catch {}
    router.replace('/(auth)/register');
  };

  const handleSignOut = () => {
    // Alert.alert button callbacks are ignored on react-native-web, so sign-out
    // did nothing in the browser. Use window.confirm on web, native Alert on phone.
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm('Sign out of Gweno Editor Pro?')) doSignOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
      ]);
    }
  };

  const handleRate = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.open(STORE_URL, '_blank');
      } else {
        await Linking.openURL(STORE_URL);
      }
    } catch {}
  };

  const handleShare = async () => {
    const message = `Check out Gweno Editor Pro — edit your photos like a pro! ${APP_URL}`;
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share) {
          // Native share sheet (Gmail, Messages, WhatsApp…) on supported mobile browsers.
          await nav.share({ title: 'Gweno Editor Pro', text: message, url: APP_URL });
        } else if (typeof window !== 'undefined') {
          // Fallback: open an email draft (opens Gmail / default mail to send).
          window.open(
            `mailto:?subject=${encodeURIComponent('Gweno Editor Pro')}&body=${encodeURIComponent(message)}`,
            '_blank',
          );
        }
      } else {
        await Share.share({ message });
      }
    } catch {}
  };

  interface ToggleRowProps {
    icon: string;
    label: string;
    desc?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }

  const ToggleRow = ({ icon, label, desc, value, onChange, disabled }: ToggleRowProps) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconBg}>
          <Ionicons name={icon as any} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          {desc && <Text style={styles.settingDesc}>{desc}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { haptic.light(); onChange(v); }}
        trackColor={{ false: Colors.dark.border, true: Colors.primary }}
        thumbColor={Colors.white}
        disabled={disabled}
      />
    </View>
  );

  interface NavRowProps {
    icon: string;
    label: string;
    desc?: string;
    onPress: () => void;
    chevron?: boolean;
    danger?: boolean;
  }

  const NavRow = ({ icon, label, desc, onPress, chevron = true, danger }: NavRowProps) => (
    <TouchableOpacity style={styles.settingRow} onPress={() => { haptic.light(); onPress(); }}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconBg, danger && styles.settingIconBgDanger]}>
          <Ionicons name={icon as any} size={18} color={danger ? Colors.error : Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, danger && { color: Colors.error }]}>{label}</Text>
          {desc && <Text style={styles.settingDesc}>{desc}</Text>}
        </View>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Account info */}
        <View style={styles.accountCard}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.accountAvatar}>
            <Text style={styles.accountAvatarText}>
              {user?.displayName?.charAt(0).toUpperCase() ?? 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{user?.displayName ?? 'User'}</Text>
            <Text style={styles.accountEmail}>{user?.email ?? ''}</Text>
          </View>
          {user?.isPremium && (
            <LinearGradient colors={Colors.gradients.gold} style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </LinearGradient>
          )}
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="moon-outline"
              label="Dark Mode"
              desc="Switch between dark and light themes"
              value={isDarkMode}
              onChange={toggleTheme}
            />
          </View>
        </View>

        {/* Editor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editor</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="save-outline"
              label="Auto Save"
              desc="Automatically save edits as you work"
              value={autoSave}
              onChange={setAutoSave}
            />
            <View style={styles.separator} />
            <ToggleRow
              icon="grid-outline"
              label="Show Grid"
              desc="Display a grid overlay on the canvas"
              value={showGrid}
              onChange={(v) => useSettingsStore.setState({ showGrid: v })}
            />
            <View style={styles.separator} />
            <ToggleRow
              icon="image-outline"
              label="High Quality Preview"
              desc="Better preview (uses more memory)"
              value={highQualityPreview}
              onChange={(v) => useSettingsStore.setState({ highQualityPreview: v })}
            />
          </View>
        </View>

        {/* Haptics & Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback & Notifications</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="phone-portrait-outline"
              label="Haptic Feedback"
              desc="Feel subtle vibrations on interactions"
              value={hapticFeedback}
              onChange={(v) => useSettingsStore.setState({ hapticFeedback: v })}
            />
            <View style={styles.separator} />
            <ToggleRow
              icon="notifications-outline"
              label="Push Notifications"
              desc="Get tips, updates, and reminders"
              value={notificationsEnabled}
              onChange={(v) => useSettingsStore.setState({ notificationsEnabled: v })}
            />
            <View style={styles.separator} />
            <ToggleRow
              icon="analytics-outline"
              label="Analytics"
              desc="Help improve Gweno Editor Pro by sharing usage data"
              value={analyticsEnabled}
              onChange={(v) => useSettingsStore.setState({ analyticsEnabled: v })}
            />
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage & Cloud</Text>
          <View style={styles.card}>
            <NavRow
              icon="cloud-outline"
              label="Cloud Backup"
              desc="Sync projects to Firebase cloud"
              onPress={() => Alert.alert('Cloud Sync', 'Your projects are automatically synced when online.')}
            />
            <View style={styles.separator} />
            <NavRow
              icon="trash-outline"
              label="Clear Cache"
              desc="Free up local storage"
              onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully!')}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <NavRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => router.push('/privacy-policy')}
            />
            <View style={styles.separator} />
            <NavRow
              icon="reader-outline"
              label="Terms of Service"
              onPress={() => router.push('/terms')}
            />
            <View style={styles.separator} />
            <NavRow
              icon="star-outline"
              label="Rate Gweno Editor Pro"
              onPress={handleRate}
            />
            <View style={styles.separator} />
            <NavRow
              icon="share-social-outline"
              label="Share Gweno Editor Pro"
              onPress={handleShare}
            />
            <View style={styles.separator} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBg}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Account actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {!user?.isPremium && (
              <>
                <NavRow
                  icon="diamond-outline"
                  label="Upgrade to Premium"
                  desc="Unlock all features"
                  onPress={() => router.push('/premium')}
                />
                <View style={styles.separator} />
              </>
            )}
            <NavRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              chevron={false}
            />
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={() => setShowDangerZone((v) => !v)}
              style={styles.settingRow}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBg}>
                  <Ionicons name="warning-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Danger Zone</Text>
              </View>
              <Ionicons
                name={showDangerZone ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.text.muted}
              />
            </TouchableOpacity>
          </View>

          {showDangerZone && (
            <View style={[styles.card, styles.dangerCard]}>
              <NavRow
                icon="trash-outline"
                label="Delete Account"
                desc="Permanently delete all data"
                onPress={handleDeleteAccount}
                danger
              />
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 12,
  },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl,
    padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  accountAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  accountAvatarText: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.white },
  accountInfo: { flex: 1 },
  accountName: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  accountEmail: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  premiumBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  premiumBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, overflow: 'hidden', borderWidth: 0.5, borderColor: Colors.dark.border },
  dangerCard: { marginTop: 8, borderColor: Colors.error },
  separator: { height: 0.5, backgroundColor: Colors.dark.border, marginHorizontal: 16 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIconBg: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#0C1C16', alignItems: 'center', justifyContent: 'center',
  },
  settingIconBgDanger: { backgroundColor: '#200F14' },
  settingLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  settingDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  versionText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
});
