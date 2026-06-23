import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, Alert, Platform, ActionSheetIOS,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { haptic } from '../../utils/haptics';
import { formatRelativeTime } from '../../utils/formatters';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type FilterMode = 'all' | 'favorites' | 'recent';

export default function ProjectsScreen() {
  const [filter, setFilter] = useState<FilterMode>('all');
  const allProjects = useProjectStore((s) => s.projects);
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const createProject = useProjectStore((s) => s.createProject);
  const user = useAuthStore((s) => s.user);
  const isDark = useSettingsStore((s) => s.isDarkMode);

  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? Colors.dark.card : Colors.light.card;
  const textPrimary = isDark ? Colors.text.primary : Colors.text.inverse;
  const textSecondary = isDark ? Colors.text.secondary : Colors.text.inverseSecondary;

  const filtered = filter === 'favorites'
    ? allProjects.filter((p) => p.isFavorite)
    : filter === 'recent'
    ? allProjects.slice(0, 20)
    : allProjects;

  const doImport = async (useCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Photo library access is needed.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
    }
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const project = createProject({
      userId: user!.id,
      imageUri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      fileSize: asset.fileSize ?? 0,
    });
    router.push({ pathname: '/editor', params: { id: project.id } });
  };

  const handleNewProject = () => {
    haptic.light();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', '📷  Take Photo', '🖼️  Choose from Gallery'], cancelButtonIndex: 0 },
        (index) => { if (index === 1) doImport(true); else if (index === 2) doImport(false); }
      );
    } else {
      Alert.alert('Add Photo', 'Choose your photo source', [
        { text: '📷  Camera', onPress: () => doImport(true) },
        { text: '🖼️  Gallery', onPress: () => doImport(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleDelete = (id: string) => {
    haptic.medium();
    Alert.alert('Delete Project', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteProject(id),
      },
    ]);
  };

  const numColumns = 2;
  const itemWidth = (Layout.window.width - 48 - 12) / numColumns;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>My Projects</Text>
          <TouchableOpacity onPress={handleNewProject} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'favorites', 'recent'] as FilterMode[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {f === 'all' ? 'All' : f === 'favorites' ? '❤️ Favorites' : '🕒 Recent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No projects yet</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            Tap + to import a photo and start editing
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={numColumns}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
              onLongPress={() => handleDelete(item.id)}
              style={[styles.card, { width: itemWidth, backgroundColor: card }]}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.thumbnailUri ?? item.originalImageUri }}
                style={[styles.thumb, { width: itemWidth, height: itemWidth }]}
                resizeMode="cover"
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDate, { color: textSecondary }]}>
                  {formatRelativeTime(item.updatedAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { haptic.light(); toggleFavorite(item.id); }}
                style={styles.favBtn}
              >
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={item.isFavorite ? Colors.accent : Colors.text.muted}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
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
  addBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, paddingBottom: 16 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card,
  },
  filterTabActive: { backgroundColor: Colors.primary },
  filterLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  filterLabelActive: { color: Colors.white },
  grid: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: Layout.tabBarHeight + 20 },
  card: { borderRadius: Layout.radius.lg, overflow: 'hidden' },
  thumb: {},
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold' },
  cardDate: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  favBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: Layout.tabBarHeight },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_600SemiBold' },
  emptySubtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
