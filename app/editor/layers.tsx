import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLayersStore } from '../../store/layersStore';
import { useEditorStore } from '../../store/editorStore';
import { Layer, BlendMode } from '../../types';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { AppConstants } from '../../constants/AppConstants';

const BLEND_MODE_OPTIONS: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'softLight', 'hardLight',
  'darken', 'lighten', 'colorDodge', 'colorBurn', 'difference', 'exclusion',
];

const LAYER_TYPE_ICONS: Record<string, string> = {
  image: 'image-outline',
  text: 'text-outline',
  sticker: 'happy-outline',
  drawing: 'brush-outline',
  shape: 'shapes-outline',
  adjustment: 'options-outline',
};

export default function LayersScreen() {
  const layers = useLayersStore((s) => s.getLayers());
  const activeLayerId = useLayersStore((s) => s.activeLayerId);
  const addLayer = useLayersStore((s) => s.addLayer);
  const removeLayer = useLayersStore((s) => s.removeLayer);
  const setActiveLayer = useLayersStore((s) => s.setActiveLayer);
  const toggleVisibility = useLayersStore((s) => s.toggleVisibility);
  const toggleLock = useLayersStore((s) => s.toggleLock);
  const setOpacity = useLayersStore((s) => s.setOpacity);
  const duplicateLayer = useLayersStore((s) => s.duplicateLayer);
  const currentUri = useEditorStore((s) => s.currentUri);

  // Auto-create base layer from the editor image if no layers exist
  useEffect(() => {
    if (layers.length === 0 && currentUri) {
      addLayer('image', { name: 'Background', imageUri: currentUri });
    }
  }, []);

  const handleAddLayer = () => {
    haptic.light();
    addLayer('adjustment', { name: `Adjustment ${layers.length + 1}` });
  };

  const handleDeleteLayer = (layer: Layer) => {
    if (layers.length <= 1) {
      Alert.alert('Cannot delete', 'You need at least one layer.');
      return;
    }
    haptic.medium();
    Alert.alert('Delete Layer', `Delete "${layer.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeLayer(layer.id) },
    ]);
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Layers</Text>
          <TouchableOpacity onPress={handleAddLayer} style={styles.addBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.addBtnGradient}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {layers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>No Layers</Text>
          <Text style={styles.emptyDesc}>Tap + to add your first layer</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={layers}
            keyExtractor={(l) => l.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isActive = item.id === activeLayerId;
              return (
                <TouchableOpacity
                  onPress={() => { haptic.selection(); setActiveLayer(item.id); }}
                  style={[styles.layerCard, isActive && styles.layerCardActive]}
                >
                  {/* Layer type icon */}
                  <View style={[styles.layerIconBg, isActive && styles.layerIconBgActive]}>
                    <Ionicons
                      name={LAYER_TYPE_ICONS[item.type] as any}
                      size={18}
                      color={isActive ? Colors.primary : Colors.text.muted}
                    />
                  </View>

                  {/* Name & blend mode */}
                  <View style={styles.layerInfo}>
                    <Text style={[styles.layerName, isActive && { color: Colors.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.layerMeta}>
                      {item.blendMode} · {Math.round(item.opacity * 100)}%
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.layerActions}>
                    <TouchableOpacity onPress={() => { haptic.light(); toggleVisibility(item.id); }}>
                      <Ionicons
                        name={item.isVisible ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color={item.isVisible ? Colors.text.secondary : Colors.text.muted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { haptic.light(); toggleLock(item.id); }}>
                      <Ionicons
                        name={item.isLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                        size={18}
                        color={item.isLocked ? Colors.warning : Colors.text.muted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { haptic.light(); duplicateLayer(item.id); }}>
                      <Ionicons name="copy-outline" size={18} color={Colors.text.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteLayer(item)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Active layer controls */}
          {activeLayer && (
            <View style={styles.layerControls}>
              <Text style={styles.controlsTitle}>Layer: {activeLayer.name}</Text>
              <View style={styles.opacityRow}>
                <Text style={styles.opacityLabel}>Opacity</Text>
                <Slider
                  style={{ flex: 1, height: 36 }}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.01}
                  value={activeLayer.opacity}
                  onValueChange={(v) => setOpacity(activeLayer.id, v)}
                  onSlidingComplete={() => haptic.selection()}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.dark.border}
                  thumbTintColor={Colors.white}
                />
                <Text style={styles.opacityValue}>{Math.round(activeLayer.opacity * 100)}%</Text>
              </View>
              <Text style={styles.blendLabel}>Blend Mode: {activeLayer.blendMode}</Text>
            </View>
          )}
        </>
      )}
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
  addBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  addBtnGradient: { padding: 8 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  layerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.transparent,
  },
  layerCardActive: { borderColor: `${Colors.primary}50`, backgroundColor: `${Colors.primary}10` },
  layerIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center',
  },
  layerIconBgActive: { backgroundColor: `${Colors.primary}20` },
  layerInfo: { flex: 1 },
  layerName: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  layerMeta: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, marginTop: 2, textTransform: 'capitalize' },
  layerActions: { flexDirection: 'row', gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  emptyDesc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  layerControls: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
    padding: 16, gap: 10,
  },
  controlsTitle: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  opacityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  opacityLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, width: 56 },
  opacityValue: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary, width: 36, textAlign: 'right' },
  blendLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textTransform: 'capitalize' },
});
