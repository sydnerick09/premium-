import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { exportService } from '../../services/image/exportService';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { FilterCatalog } from '../../constants/FilterCatalog';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type ExportFormat = 'jpeg' | 'png' | 'webp';
type Resolution = '1x' | '2x' | '4k' | 'custom';

const FORMAT_OPTIONS: { id: ExportFormat; label: string; desc: string }[] = [
  { id: 'jpeg', label: 'JPEG', desc: 'Smaller file, great for photos' },
  { id: 'png', label: 'PNG', desc: 'Lossless, great for graphics' },
  { id: 'webp', label: 'WebP', desc: 'Best compression quality' },
];

const RESOLUTION_OPTIONS: { id: Resolution; label: string; desc: string }[] = [
  { id: '1x', label: '1x Original', desc: 'Keep original size' },
  { id: '2x', label: '2x HD', desc: 'Double resolution' },
  { id: '4k', label: '4K Ultra', desc: 'Up to 3840px wide' },
  { id: 'custom', label: 'Custom', desc: 'Set your own size' },
];

const QUALITY_MARKS = [60, 70, 80, 90, 95, 100];

export default function ExportScreen() {
  const { currentUri, adjustments, activeFilterId, filterIntensity, beautyValues } = useEditorStore();
  const { user } = useAuthStore();
  const activeFilter = activeFilterId ? FilterCatalog.find((f) => f.id === activeFilterId) ?? null : null;

  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [resolution, setResolution] = useState<Resolution>('1x');
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isPremium = user?.isPremium ?? false;

  const handleExport = async (shareAfter = false) => {
    if (!currentUri) {
      Alert.alert('No image', 'Open an image in the editor first.');
      return;
    }

    haptic.medium();
    shareAfter ? setIsSharing(true) : setIsExporting(true);

    try {
      let maxDimension: number | undefined;
      if (resolution === '2x') maxDimension = 2560;
      if (resolution === '4k') maxDimension = 3840;

      // Bake live adjustments + active filter into the pixels so the exported
      // file matches the on-screen preview (real edit on web; no-op on native).
      const bakedUri = await imageProcessor.bake(currentUri, {
        adjustments,
        filter: activeFilter,
        filterIntensity,
        beauty: beautyValues,
      });

      const result = await exportService.export(bakedUri, {
        format,
        quality: quality / 100,
        maxDimension,
        saveToGallery,
        addWatermark: !isPremium && addWatermark,
      });

      haptic.success();

      if (shareAfter) {
        await exportService.share(result.uri, `erick_photo.${format}`);
      } else {
        Alert.alert(
          'Exported!',
          `${result.filename}\n${result.width}×${result.height}px${result.savedToGallery ? '\nSaved to Gallery' : ''}`,
          [
            { text: 'Done', onPress: () => router.back() },
            { text: 'Share', onPress: () => exportService.share(result.uri, result.filename) },
          ]
        );
      }
    } catch (e: any) {
      haptic.error();
      Alert.alert('Export failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsExporting(false);
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Export</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Format</Text>
          <View style={styles.optionRow}>
            {FORMAT_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => { haptic.light(); setFormat(f.id); }}
                style={[styles.optionCard, format === f.id && styles.optionCardActive]}
              >
                {format === f.id && (
                  <LinearGradient colors={Colors.gradients.primary} style={StyleSheet.absoluteFillObject as any} />
                )}
                <Text style={[styles.optionLabel, format === f.id && { color: Colors.white }]}>{f.label}</Text>
                <Text style={[styles.optionDesc, format === f.id && { color: 'rgba(255,255,255,0.7)' }]}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quality */}
        {format !== 'png' && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Quality</Text>
              <View style={styles.qualityBadge}>
                <LinearGradient colors={Colors.gradients.primary} style={styles.qualityBadgeGrad}>
                  <Text style={styles.qualityBadgeText}>{quality}%</Text>
                </LinearGradient>
              </View>
            </View>
            <View style={styles.qualityMarks}>
              {QUALITY_MARKS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => { haptic.light(); setQuality(q); }}
                  style={[styles.qualityMark, quality === q && styles.qualityMarkActive]}
                >
                  <Text style={[styles.qualityMarkText, quality === q && { color: Colors.primary }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Resolution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution</Text>
          <View style={styles.resolutionList}>
            {RESOLUTION_OPTIONS.map((r) => {
              const isLocked = r.id === '4k' && !isPremium;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => {
                    if (isLocked) {
                      Alert.alert('Premium Required', 'Upgrade to Gweno Premium for 4K export.', [
                        { text: 'Maybe later', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => router.push('/premium') },
                      ]);
                      return;
                    }
                    haptic.light();
                    setResolution(r.id);
                  }}
                  style={[styles.resolutionItem, resolution === r.id && styles.resolutionItemActive]}
                >
                  <View style={styles.resolutionLeft}>
                    <View style={[styles.radioOuter, resolution === r.id && styles.radioOuterActive]}>
                      {resolution === r.id && <View style={styles.radioInner} />}
                    </View>
                    <View>
                      <View style={styles.resolutionLabelRow}>
                        <Text style={[styles.resolutionLabel, resolution === r.id && { color: Colors.primary }]}>{r.label}</Text>
                        {isLocked && (
                          <LinearGradient colors={Colors.gradients.gold} style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={10} color={Colors.dark.background} />
                            <Text style={styles.lockBadgeText}>PRO</Text>
                          </LinearGradient>
                        )}
                      </View>
                      <Text style={styles.resolutionDesc}>{r.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.toggleList}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Ionicons name="images-outline" size={20} color={Colors.text.secondary} />
                <View>
                  <Text style={styles.toggleLabel}>Save to Gallery</Text>
                  <Text style={styles.toggleDesc}>Save exported photo to your camera roll</Text>
                </View>
              </View>
              <Switch
                value={saveToGallery}
                onValueChange={(v) => { haptic.light(); setSaveToGallery(v); }}
                trackColor={{ false: Colors.dark.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Ionicons name="water-outline" size={20} color={Colors.text.secondary} />
                <View>
                  <View style={styles.resolutionLabelRow}>
                    <Text style={styles.toggleLabel}>Watermark</Text>
                    {isPremium && (
                      <View style={styles.removedBadge}>
                        <Text style={styles.removedBadgeText}>Removed for Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.toggleDesc}>Add "Gweno Editor Pro" watermark to exported photo</Text>
                </View>
              </View>
              <Switch
                value={isPremium ? false : addWatermark}
                onValueChange={(v) => { haptic.light(); setAddWatermark(v); }}
                trackColor={{ false: Colors.dark.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={isPremium}
              />
            </View>
          </View>
        </View>

        {/* Premium upsell */}
        {!isPremium && (
          <TouchableOpacity onPress={() => router.push('/premium')} style={styles.premiumBanner}>
            <LinearGradient colors={Colors.gradients.premium} style={styles.premiumBannerGrad}>
              <Ionicons name="star" size={20} color={Colors.white} />
              <View>
                <Text style={styles.premiumBannerTitle}>Unlock 4K Export</Text>
                <Text style={styles.premiumBannerDesc}>No watermarks · All resolutions · Unlimited exports</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={() => handleExport(true)}
          disabled={isSharing || isExporting}
          style={styles.shareBtn}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="share-outline" size={22} color={Colors.primary} />
          )}
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleExport(false)}
          disabled={isExporting || isSharing}
          style={styles.exportBtn}
        >
          <LinearGradient colors={Colors.gradients.primary} style={styles.exportBtnGrad}>
            {isExporting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="download-outline" size={20} color={Colors.white} />
            )}
            <Text style={styles.exportBtnText}>{isExporting ? 'Exporting…' : 'Export'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionCard: {
    flex: 1, padding: 14, borderRadius: Layout.radius.lg, overflow: 'hidden',
    backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  optionCardActive: { borderColor: Colors.primary },
  optionLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 3 },
  optionDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  qualityBadge: { borderRadius: Layout.radius.sm, overflow: 'hidden' },
  qualityBadgeGrad: { paddingHorizontal: 10, paddingVertical: 4 },
  qualityBadgeText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.white },
  qualityMarks: { flexDirection: 'row', gap: 8 },
  qualityMark: {
    flex: 1, paddingVertical: 8, borderRadius: Layout.radius.md,
    backgroundColor: Colors.dark.card, alignItems: 'center',
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  qualityMarkActive: { borderColor: Colors.primary, backgroundColor: '#0C1916' },
  qualityMarkText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  resolutionList: { gap: 8 },
  resolutionItem: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    padding: 14, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  resolutionItemActive: { borderColor: Colors.primary, backgroundColor: '#0B1011' },
  resolutionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.dark.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  resolutionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resolutionLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  resolutionDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  lockBadgeText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  toggleList: { gap: 4 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.dark.card, padding: 14, borderRadius: Layout.radius.md,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  toggleLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  toggleDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2 },
  removedBadge: { backgroundColor: '#0B201D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  removedBadgeText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: Colors.success },
  premiumBanner: { borderRadius: Layout.radius.xl, overflow: 'hidden', marginBottom: 8 },
  premiumBannerGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  premiumBannerTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
  premiumBannerDesc: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Layout.radius.lg,
    backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  shareBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  exportBtn: { flex: 2, borderRadius: Layout.radius.lg, overflow: 'hidden' },
  exportBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  exportBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
