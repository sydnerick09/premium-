import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { haptic } from '../../utils/haptics';
import { formatFileSize } from '../../utils/formatters';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const projects = useProjectStore((s) => s.projects);
  const favorites = useProjectStore((s) => s.getFavorites());
  const isDark = useSettingsStore((s) => s.isDarkMode);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? Colors.dark.card : Colors.light.card;
  const textPrimary = isDark ? Colors.text.primary : Colors.text.inverse;
  const textSecondary = isDark ? Colors.text.secondary : Colors.text.inverseSecondary;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, value, danger = false }: any) => (
    <TouchableOpacity onPress={() => { haptic.light(); onPress(); }} style={[styles.menuItem, { backgroundColor: card }]}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
        <Text style={[styles.menuLabel, { color: danger ? Colors.error : textPrimary }]}>{label}</Text>
      </View>
      {value !== undefined ? (
        <Text style={[styles.menuValue, { color: textSecondary }]}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
      )}
    </TouchableOpacity>
  );

  const storageCapBytes = 500 * 1024 * 1024; // 500 MB
  const storagePercent = Math.min(
    (user?.storageUsedBytes ?? 0) / storageCapBytes,
    1
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar card */}
        <View style={[styles.profileCard, { backgroundColor: card }]}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.avatarRing}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarInitial}>{(user?.displayName ?? 'U')[0].toUpperCase()}</Text>
              </View>
            )}
          </LinearGradient>
          <Text style={[styles.displayName, { color: textPrimary }]}>{user?.displayName ?? 'User'}</Text>
          <Text style={[styles.emailText, { color: textSecondary }]}>{user?.email}</Text>
          {user?.isPremium && (
            <LinearGradient colors={Colors.gradients.gold} style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>✦ PREMIUM</Text>
            </LinearGradient>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Favorites', value: favorites.length },
            { label: 'Exports', value: projects.filter((p) => p.exportedAt).length },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: card }]}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Storage */}
        <View style={[styles.storageCard, { backgroundColor: card }]}>
          <View style={styles.storageHeader}>
            <Text style={[styles.storageTitle, { color: textPrimary }]}>Cloud Storage</Text>
            <Text style={[styles.storageUsage, { color: textSecondary }]}>
              {formatFileSize(user?.storageUsedBytes ?? 0)} / 500 MB
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${storagePercent * 100}%` }]} />
          </View>
        </View>

        {/* Premium upgrade */}
        {!user?.isPremium && (
          <TouchableOpacity onPress={() => router.push('/premium')} activeOpacity={0.9}>
            <LinearGradient colors={Colors.gradients.gold} style={styles.upgradeBanner}>
              <Text style={styles.upgradeTitle}>✦ Upgrade to Premium</Text>
              <Text style={styles.upgradeSubtitle}>Unlock all features & 500 MB cloud storage</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Menu items */}
        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/settings')} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings')} />
          <MenuItem
            icon="moon-outline"
            label="Dark Mode"
            onPress={toggleTheme}
            value={isDark ? 'On' : 'Off'}
          />
          <MenuItem icon="cloud-outline" label="Cloud Backup" onPress={() => router.push('/settings')} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/privacy-policy')} />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/terms')} />
          <MenuItem icon="star-outline" label="Rate Erick" onPress={() => {}} />
          <MenuItem icon="share-social-outline" label="Share App" onPress={() => {}} />
        </View>

        <View style={[styles.menuSection, { marginTop: 8 }]}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
        </View>

        <Text style={[styles.version, { color: Colors.text.muted }]}>Erick v1.0.0 · Made with ❤️</Text>
        <View style={{ height: Layout.tabBarHeight + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  title: { fontSize: Layout.fontSize['3xl'], fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  profileCard: { borderRadius: Layout.radius.xl, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatarRing: { width: 84, height: 84, borderRadius: 42, padding: 3, marginBottom: 12 },
  avatar: { width: 78, height: 78, borderRadius: 39 },
  avatarPlaceholder: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: Colors.white },
  displayName: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  emailText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', marginBottom: 10 },
  premiumBadge: { borderRadius: Layout.radius.sm, paddingHorizontal: 12, paddingVertical: 4 },
  premiumBadgeText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_700Bold', color: Colors.dark.background, letterSpacing: 1.5 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: Layout.radius.lg, padding: 16, alignItems: 'center' },
  statValue: { fontSize: Layout.fontSize['2xl'], fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  storageCard: { borderRadius: Layout.radius.lg, padding: 16, marginBottom: 16 },
  storageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  storageTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold' },
  storageUsage: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular' },
  progressTrack: { height: 6, backgroundColor: Colors.dark.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  upgradeBanner: { borderRadius: Layout.radius.lg, padding: 20, marginBottom: 16, alignItems: 'center' },
  upgradeTitle: { fontSize: Layout.fontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  upgradeSubtitle: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: 'rgba(0,0,0,0.7)', marginTop: 4 },
  menuSection: { gap: 2, marginBottom: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: Layout.radius.md,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium' },
  menuValue: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular' },
  version: { textAlign: 'center', fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', marginBottom: 8, marginTop: 8 },
});
