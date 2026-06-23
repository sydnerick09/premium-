import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../../store/editorStore';
import { haptic } from '../../utils/haptics';
import {
  FilterCatalog, Filter, FilterCategory, getFiltersByCategory,
} from '../../constants/FilterCatalog';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const CATEGORIES: (FilterCategory | 'All')[] = [
  'All', 'Vintage', 'Cinematic', 'Portrait', 'B&W', 'Warm', 'Cool', 'HDR',
];

export default function FiltersScreen() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | 'All'>('All');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const { currentUri, activeFilterId, applyFilter, setAdjustments } = useEditorStore();

  const filters = getFiltersByCategory(activeCategory);

  const activeFilter = FilterCatalog.find((f) => f.id === activeFilterId);

  const handleSelect = (filter: Filter) => {
    haptic.light();
    if (filter.id === activeFilterId) {
      applyFilter(null, filterIntensity);
    } else {
      applyFilter(filter.id, filterIntensity);
    }
  };

  const handleApply = () => {
    // When user presses Apply, push filter params into adjustment store so the canvas shows them
    if (activeFilter) {
      setAdjustments({
        brightness:  activeFilter.brightness  ?? 0,
        contrast:    activeFilter.contrast    ?? 0,
        saturation:  activeFilter.isGrayscale ? -100 : (activeFilter.saturation ?? 0),
        temperature: activeFilter.temperature ?? 0,
        vignette:    activeFilter.vignette    ?? 0,
        grain:       activeFilter.grain       ?? 0,
        fade:        activeFilter.fade        ?? 0,
        sharpness:   activeFilter.sharpness   ?? 0,
      });
    }
    haptic.success();
    router.back();
  };

  // Compute overlay values from active filter + intensity scale
  const scale = filterIntensity / 100;
  const filterBrightness  = (activeFilter?.brightness  ?? 0) * scale;
  const filterTemperature = (activeFilter?.temperature ?? 0) * scale;
  const filterFade        = (activeFilter?.fade        ?? 0) * scale;
  const filterVignette    = (activeFilter?.vignette    ?? 0) * scale;
  const isGrayscale       = activeFilter?.isGrayscale  ?? false;
  const isSepia           = activeFilter?.isSepia      ?? false;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.applyGradient}>
              <Text style={styles.applyText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Preview with live filter overlays */}
      <View style={styles.preview}>
        {currentUri ? (
          <>
            <Image source={{ uri: currentUri }} style={styles.previewImage} contentFit="contain" />

            {/* Grayscale overlay */}
            {isGrayscale && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(128,128,128,${0.85 * scale})` }]} />
            )}

            {/* Sepia overlay */}
            {isSepia && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(120,80,40,${0.55 * scale})` }]} />
            )}

            {/* Brightness */}
            {filterBrightness !== 0 && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, {
                  backgroundColor: filterBrightness > 0
                    ? `rgba(255,255,255,${filterBrightness / 220})`
                    : `rgba(0,0,0,${Math.abs(filterBrightness) / 220})`,
                }]}
              />
            )}

            {/* Temperature: warm (orange) or cool (blue) */}
            {filterTemperature !== 0 && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, {
                  backgroundColor: filterTemperature > 0
                    ? `rgba(255,130,40,${filterTemperature / 350})`
                    : `rgba(60,120,255,${Math.abs(filterTemperature) / 350})`,
                }]}
              />
            )}

            {/* Fade */}
            {filterFade > 0 && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(255,255,255,${filterFade / 300})` }]} />
            )}

            {/* Vignette */}
            {filterVignette > 0 && (
              <LinearGradient
                pointerEvents="none"
                colors={[`rgba(0,0,0,${filterVignette / 130})`, 'transparent', `rgba(0,0,0,${filterVignette / 130})`]}
                style={StyleSheet.absoluteFillObject}
              />
            )}
          </>
        ) : (
          <View style={styles.previewEmpty}>
            <Ionicons name="image-outline" size={40} color={Colors.text.muted} />
          </View>
        )}
        {activeFilterId && activeFilterId !== 'none' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {FilterCatalog.find((f) => f.id === activeFilterId)?.name}
              {filterIntensity < 100 ? ` · ${filterIntensity}%` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
          >
            <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter grid */}
      <FlatList
        data={filters}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={styles.filterItem}>
            <View style={[styles.filterThumb, activeFilterId === item.id && styles.filterThumbActive]}>
              {currentUri ? (
                <>
                  <Image source={{ uri: currentUri }} style={styles.filterThumbImage} contentFit="cover" />
                  {/* Thumbnail overlay to hint the filter's look */}
                  {item.isGrayscale && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(100,100,100,0.7)' }]} />
                  )}
                  {item.isSepia && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(110,70,30,0.5)' }]} />
                  )}
                  {!item.isGrayscale && !item.isSepia && (item.temperature ?? 0) > 20 && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(255,130,40,${(item.temperature ?? 0) / 400})` }]} />
                  )}
                  {!item.isGrayscale && !item.isSepia && (item.temperature ?? 0) < -20 && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(60,120,255,${Math.abs(item.temperature ?? 0) / 400})` }]} />
                  )}
                </>
              ) : (
                <LinearGradient
                  colors={item.isGrayscale ? ['#666','#222'] : item.isSepia ? ['#8B6914','#5C4410'] : Colors.gradients.primary}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              {item.isPremium && (
                <LinearGradient colors={Colors.gradients.gold} style={styles.premiumOverlay}>
                  <Text style={styles.premiumOverlayText}>PRO</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.filterName, activeFilterId === item.id && { color: Colors.primary }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Intensity slider */}
      {activeFilterId && activeFilterId !== 'none' && (
        <View style={styles.intensityRow}>
          <Text style={styles.intensityLabel}>Intensity</Text>
          <Slider
            style={{ flex: 1, height: 36 }}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={filterIntensity}
            onValueChange={(v) => { setFilterIntensity(v); applyFilter(activeFilterId, v); }}
            onSlidingComplete={() => haptic.selection()}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.dark.border}
            thumbTintColor={Colors.white}
          />
          <Text style={styles.intensityValue}>{filterIntensity}%</Text>
        </View>
      )}
    </View>
  );
}

const THUMB_SIZE = 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  applyBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  applyGradient: { paddingHorizontal: 20, paddingVertical: 8 },
  applyText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  preview: {
    height: 220, margin: 16, borderRadius: Layout.radius.xl,
    overflow: 'hidden', backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  filterBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(124,58,237,0.9)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  filterBadgeText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  categories: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  catTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card,
  },
  catTabActive: { backgroundColor: Colors.primary },
  catLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  catLabelActive: { color: Colors.white },
  filterList: { paddingHorizontal: 16, gap: 12, paddingVertical: 12 },
  filterItem: { alignItems: 'center', gap: 6, width: THUMB_SIZE },
  filterThumb: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    borderRadius: Layout.radius.md, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.transparent,
  },
  filterThumbActive: { borderColor: Colors.primary },
  filterThumbImage: { width: '100%', height: '100%' },
  premiumOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    paddingHorizontal: 4, paddingVertical: 2, borderTopLeftRadius: 6,
  },
  premiumOverlayText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  filterName: {
    fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium',
    color: Colors.text.secondary, textAlign: 'center',
  },
  intensityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
  },
  intensityLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, width: 60 },
  intensityTrack: { flex: 1, height: 4, backgroundColor: Colors.dark.border, borderRadius: 2, overflow: 'hidden' },
  intensityFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  intensityValue: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, width: 36, textAlign: 'right' },
});
