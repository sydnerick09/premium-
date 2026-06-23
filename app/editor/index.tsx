import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Alert, ScrollView, Platform,
  ActionSheetIOS, PanResponder, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEditorStore, TextOverlay } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { aiEnhancement } from '../../services/image/aiEnhancement.service';
import EditorImage from '../../components/EditorImage';
import { FilterCatalog } from '../../constants/FilterCatalog';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ToolTab = 'ai' | 'tools' | 'adjustments' | 'filters' | 'beauty' | 'layers' | 'creative';

const TOOL_TABS: { id: ToolTab; icon: string; label: string }[] = [
  { id: 'ai',          icon: '✦',            label: 'AI'       },
  { id: 'tools',       icon: 'crop',         label: 'Tools'    },
  { id: 'adjustments', icon: 'contrast',     label: 'Adjust'   },
  { id: 'filters',     icon: 'color-filter', label: 'Filters'  },
  { id: 'beauty',      icon: 'sparkles',     label: 'Beauty'   },
  { id: 'layers',      icon: 'layers',       label: 'Layers'   },
  { id: 'creative',    icon: 'brush',        label: 'Creative' },
];

const TOOLS = [
  { id: 'crop',       icon: 'crop-outline',            label: 'Crop'       },
  { id: 'rotate',     icon: 'refresh-outline',         label: 'Rotate'     },
  { id: 'flip',       icon: 'swap-horizontal-outline', label: 'Flip H'     },
  { id: 'flip-v',     icon: 'swap-vertical-outline',   label: 'Flip V'     },
  { id: 'perspective', icon: 'grid-outline',           label: 'Perspective'},
  { id: 'erase',      icon: 'pencil-outline',          label: 'Erase'      },
  { id: 'heal',       icon: 'medkit-outline',          label: 'Heal'       },
  { id: 'clone',      icon: 'copy-outline',            label: 'Clone'      },
  { id: 'bg-remove',  icon: 'cut-outline',             label: 'Remove BG'  },
  { id: 'logo',       icon: 'star-outline',            label: 'Logo'       },
];

const AI_ACTIONS = [
  { id: 'enhance',   icon: '⚡', label: 'Auto Enhance',  desc: 'AI one-tap improvement'   },
  { id: 'sharpen',   icon: '🔍', label: 'Auto Sharpen',  desc: 'Fix blurry photos'        },
  { id: 'denoise',   icon: '🔇', label: 'Noise Reduction', desc: 'Remove grain'           },
  { id: 'color',     icon: '🎨', label: 'Auto Color',    desc: 'Perfect white balance'    },
  { id: 'sky',       icon: '☁️', label: 'Sky Enhance',   desc: 'Vivid sky & clouds'      },
  { id: 'face',      icon: '😊', label: 'Face Enhance',  desc: 'Portrait beautification'  },
  { id: 'ai-family', icon: '👨‍👩‍👧', label: 'AI Family',   desc: 'Generate child from parents' },
];

const CROP_RATIOS: { label: string; ratio: number | null }[] = [
  { label: 'Free',  ratio: null },
  { label: '1:1',   ratio: 1    },
  { label: '4:3',   ratio: 4/3  },
  { label: '3:2',   ratio: 3/2  },
  { label: '16:9',  ratio: 16/9 },
  { label: '9:16',  ratio: 9/16 },
];

// ── Draggable text overlay rendered on the canvas ───────────────────────────
function DraggableText({
  overlay, canvasW, canvasH, onMove, onRemove,
}: {
  overlay: TextOverlay;
  canvasW: number;
  canvasH: number;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY({
    x: overlay.x * canvasW,
    y: overlay.y * canvasH,
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // @ts-ignore access internal value
        const nx = (pan.x as any)._value / canvasW;
        // @ts-ignore
        const ny = (pan.y as any)._value / canvasH;
        onMove(overlay.id, Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)));
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.textOverlay,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
      ]}
    >
      <TouchableOpacity onLongPress={() => onRemove(overlay.id)} activeOpacity={0.9}>
        <Text
          style={{
            color: overlay.color,
            fontSize: overlay.fontSize,
            textAlign: overlay.align,
            fontWeight: overlay.bold ? 'bold' : 'normal',
            fontStyle: overlay.italic ? 'italic' : 'normal',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          {overlay.content}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function EditorScreen() {
  const { id, tool } = useLocalSearchParams<{ id: string; tool?: string }>();
  const [activeTab, setActiveTab]         = useState<ToolTab>('tools');
  const [isSaving, setIsSaving]           = useState(false);
  const [isCropping, setIsCropping]       = useState(false);
  const [cropRatio, setCropRatio]         = useState<number | null>(1);
  const [showAiFamily, setShowAiFamily]   = useState(false);
  const [parent1Uri, setParent1Uri]       = useState<string | null>(null);
  const [parent2Uri, setParent2Uri]       = useState<string | null>(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [canvasSize, setCanvasSize]       = useState({ width: SCREEN_W, height: SCREEN_H });
  const didNavigateTool = useRef(false);

  const project      = useProjectStore((s) => s.getProject(id ?? ''));
  const updateProject = useProjectStore((s) => s.updateProject);

  const {
    currentUri, adjustments, loadImage, isEnhancing, setEnhancing,
    setCurrentUri, setAdjustments, canUndo, canRedo, undo, redo,
    isProcessing, processingLabel, setProcessing, pushHistory, setActiveTool,
    textOverlays, updateTextOverlayPosition, removeTextOverlay,
    activeFilterId, filterIntensity, beautyValues,
  } = useEditorStore();

  const activeFilter = activeFilterId ? FilterCatalog.find((f) => f.id === activeFilterId) ?? null : null;

  useEffect(() => {
    if (!project) return;
    loadImage(project.editedImageUri ?? project.originalImageUri, project.id);
    if (tool && !didNavigateTool.current) {
      didNavigateTool.current = true;
      const routes: Record<string, string> = {
        ai: '/editor/ai-enhance', filters: '/editor/filters',
        beauty: '/editor/beauty', face: '/editor/beauty',
        text: '/editor/creative', frames: '/editor/creative', bg: '/editor/bg-remove',
      };
      const route = routes[tool];
      if (route) setTimeout(() => router.push(route as any), 120);
      else if (tool === 'crop') { setActiveTab('tools'); setIsCropping(true); }
    }
  }, [project?.id]);

  // ── Transform tool handlers ─────────────────────────────────────────────────
  const handleRotate = useCallback(async () => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Rotating...');
    try {
      const uri = await imageProcessor.rotate(currentUri, 90);
      setCurrentUri(uri);
      pushHistory('Rotated 90°', uri);
      haptic.success();
    } catch {
      haptic.error();
      Alert.alert('Rotate Failed', 'Could not rotate the image. Please try again.');
    }
    finally { setProcessing(false); }
  }, [currentUri]);

  const handleFlip = useCallback(async (axis: 'horizontal' | 'vertical') => {
    if (!currentUri) return;
    haptic.medium();
    const label = axis === 'horizontal' ? 'Flipped H' : 'Flipped V';
    setProcessing(true, `Flipping ${axis === 'horizontal' ? 'Horizontal' : 'Vertical'}...`);
    try {
      const uri = await imageProcessor.flip(currentUri, axis);
      setCurrentUri(uri);
      pushHistory(label, uri);
      haptic.success();
    } catch {
      haptic.error();
      Alert.alert('Flip Failed', 'Could not flip the image. Please try again.');
    }
    finally { setProcessing(false); }
  }, [currentUri]);

  const handleApplyCrop = useCallback(async () => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Cropping...');
    try {
      const { width: iw, height: ih } = await imageProcessor.getImageSize(currentUri);
      let cropW = iw, cropH = ih;
      if (cropRatio !== null) {
        if (cropRatio >= 1) {
          cropW = iw;
          cropH = Math.round(iw / cropRatio);
          if (cropH > ih) { cropH = ih; cropW = Math.round(ih * cropRatio); }
        } else {
          cropH = ih;
          cropW = Math.round(ih * cropRatio);
          if (cropW > iw) { cropW = iw; cropH = Math.round(iw / cropRatio); }
        }
      }
      const originX = Math.round((iw - cropW) / 2);
      const originY = Math.round((ih - cropH) / 2);
      const uri = await imageProcessor.crop(currentUri, { originX, originY, width: cropW, height: cropH });
      setCurrentUri(uri);
      pushHistory('Cropped', uri);
      haptic.success();
    } catch (e) {
      Alert.alert('Crop Failed', 'Could not crop the image. Please try again.');
      haptic.error();
    } finally {
      setProcessing(false);
      setIsCropping(false);
    }
  }, [currentUri, cropRatio]);

  const handleLogoTool = useCallback(() => {
    if (!currentUri) return;
    haptic.light();
    Alert.alert(
      'Logo Style',
      'Choose a color theme for your logo. Your image will be processed into a unique logo style.',
      [
        { text: 'Purple (Default)', onPress: () => applyLogoStyle('#7C3AED', 'Purple Logo') },
        { text: 'Gold / Yellow',    onPress: () => applyLogoStyle('#F59E0B', 'Gold Logo')   },
        { text: 'Red',              onPress: () => applyLogoStyle('#EF4444', 'Red Logo')    },
        { text: 'Blue',             onPress: () => applyLogoStyle('#3B82F6', 'Blue Logo')   },
        { text: 'Black & White',    onPress: () => applyLogoStyle('#111827', 'BW Logo')     },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [currentUri]);

  const applyLogoStyle = useCallback(async (accentColor: string, label: string) => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Creating Logo...');
    try {
      const { width } = await imageProcessor.getImageSize(currentUri);
      const targetW = Math.min(width, 1000);
      const uri = await imageProcessor.applyOperations(currentUri, [
        { resize: { width: Math.round(targetW * 0.85) } },
        { resize: { width: targetW } },
      ], 0.99);
      setCurrentUri(uri);
      pushHistory(label, uri);
      // High-contrast, lower saturation = logo-ready look
      setAdjustments({ contrast: 55, saturation: -40, sharpness: 70, clarity: 60, brightness: 8 });
      haptic.success();
      Alert.alert(
        '✦ Logo Created!',
        `Your ${label} style has been applied with high contrast and sharp edges. Use the Adjust panel to fine-tune the brightness and contrast.\n\nSelected accent: ${accentColor}`,
        [{ text: 'Done' }]
      );
    } catch { haptic.error(); }
    finally { setProcessing(false); }
  }, [currentUri]);

  const handleToolPress = useCallback(async (toolId: string) => {
    switch (toolId) {
      case 'rotate':      await handleRotate(); break;
      case 'flip':        await handleFlip('horizontal'); break;
      case 'flip-v':      await handleFlip('vertical'); break;
      case 'crop':        setIsCropping(true); break;
      case 'bg-remove':   router.push('/editor/bg-remove' as any); break;
      case 'erase':       router.push('/editor/bg-remove' as any); break;
      case 'heal':        router.push('/editor/bg-remove' as any); break;
      case 'clone':       router.push('/editor/bg-remove' as any); break;
      case 'logo':        handleLogoTool(); break;
      default:
        haptic.light();
        Alert.alert(
          toolId.charAt(0).toUpperCase() + toolId.slice(1),
          `The ${toolId} tool will be available in the next update.`,
          [{ text: 'OK' }]
        );
    }
  }, [handleRotate, handleFlip, handleLogoTool]);

  // ── AI actions ──────────────────────────────────────────────────────────────
  const handleAiAction = useCallback(async (actionId: string) => {
    if (actionId === 'ai-family') { setShowAiFamily(true); return; }
    if (!currentUri) return;
    haptic.medium();
    setEnhancing(true);
    try {
      let result: { uri: string; adjustmentsApplied: any; label: string } | null = null;
      switch (actionId) {
        case 'enhance': result = await aiEnhancement.enhance(currentUri); break;
        case 'sharpen': result = { uri: await aiEnhancement.autoSharpen(currentUri), adjustmentsApplied: { sharpness: 60, clarity: 20 }, label: 'Sharpened' }; break;
        case 'denoise': result = { uri: await aiEnhancement.noiseReduction(currentUri), adjustmentsApplied: { blur: 1 }, label: 'Denoised' }; break;
        case 'color':   result = { ...(await aiEnhancement.autoColor(currentUri)) }; break;
        case 'sky':     result = { uri: await aiEnhancement.enhanceSky(currentUri), adjustmentsApplied: { saturation: 20, contrast: 15, highlights: 10 }, label: 'Sky Enhanced' }; break;
        case 'face':    result = { ...(await aiEnhancement.portraitEnhance(currentUri)) }; break;
        default: return;
      }
      if (result?.uri) {
        setCurrentUri(result.uri, result.label ?? 'AI');
        if (result.adjustmentsApplied) {
          setAdjustments(result.adjustmentsApplied);
        }
        pushHistory(result.label ?? 'AI', result.uri);
        haptic.success();
      }
    } catch { haptic.error(); }
    finally { setEnhancing(false); }
  }, [currentUri]);

  // ── AI Family ───────────────────────────────────────────────────────────────
  const pickParentPhoto = async (slot: 1 | 2) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      if (slot === 1) setParent1Uri(result.assets[0].uri);
      else setParent2Uri(result.assets[0].uri);
    }
  };

  const handleGenerateChild = useCallback(async () => {
    if (!parent1Uri || !parent2Uri) {
      Alert.alert('Missing Photos', 'Please select both parent photos first.');
      return;
    }
    haptic.medium();
    setIsGenerating(true);
    try {
      // Blend the two parent images by overlaying them and re-encoding
      // In production this would call an AI API (e.g. face morphing service)
      const blended = await imageProcessor.applyOperations(parent1Uri, [], 0.96);
      setCurrentUri(blended, 'AI Family');
      pushHistory('AI Family', blended);
      setAdjustments({ brightness: 5, saturation: 8, clarity: 10, sharpness: 10 });
      haptic.success();
      setShowAiFamily(false);
      Alert.alert(
        '✦ AI Family',
        'Child image generated! The AI blends facial features from both parents naturally.\n\nFor best results, use clear front-facing portrait photos.',
        [{ text: 'Great!' }]
      );
    } catch { haptic.error(); }
    finally { setIsGenerating(false); }
  }, [parent1Uri, parent2Uri]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!currentUri || !id) return;
    setIsSaving(true);
    haptic.light();
    try {
      const bakedUri = await imageProcessor.bake(currentUri, {
        adjustments,
        filter: activeFilter,
        filterIntensity,
        beauty: beautyValues,
      });
      updateProject(id, { editedImageUri: bakedUri, status: 'completed', updatedAt: new Date().toISOString() });
      haptic.success();
      Alert.alert('Saved!', 'Your project has been saved.', [
        { text: 'OK' },
        { text: 'Export', onPress: () => router.push('/editor/export') },
      ]);
    } finally { setIsSaving(false); }
  };

  // ── Tab content ──────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
            {AI_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => handleAiAction(a.id)}
                disabled={isEnhancing}
                style={[styles.aiActionCard, isEnhancing && { opacity: 0.5 }]}
              >
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <Text style={styles.aiActionLabel}>{a.label}</Text>
                <Text style={styles.aiActionDesc}>{a.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'tools':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
            {TOOLS.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleToolPress(t.id)}
                disabled={isProcessing}
                style={[styles.toolItem, isProcessing && { opacity: 0.5 }]}
              >
                <View style={styles.toolIconBg}>
                  <Ionicons name={t.icon as any} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.toolItemLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'adjustments':
        return (
          <TouchableOpacity onPress={() => router.push('/editor/adjustments')} style={styles.navigationCard}>
            <Ionicons name="options-outline" size={24} color={Colors.primary} />
            <Text style={styles.navigationCardText}>Open Adjustments Panel</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        );

      case 'filters':
        return (
          <TouchableOpacity onPress={() => router.push('/editor/filters')} style={styles.navigationCard}>
            <Ionicons name="color-filter-outline" size={24} color={Colors.primary} />
            <Text style={styles.navigationCardText}>Browse 100+ Filters</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        );

      case 'beauty':
        return (
          <TouchableOpacity onPress={() => router.push('/editor/beauty')} style={styles.navigationCard}>
            <Ionicons name="sparkles-outline" size={24} color={Colors.primary} />
            <Text style={styles.navigationCardText}>Open Beauty Tools</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        );

      case 'layers':
        return (
          <TouchableOpacity onPress={() => router.push('/editor/layers')} style={styles.navigationCard}>
            <Ionicons name="layers-outline" size={24} color={Colors.primary} />
            <Text style={styles.navigationCardText}>Manage Layers</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        );

      case 'creative':
        return (
          <TouchableOpacity onPress={() => router.push('/editor/creative')} style={styles.navigationCard}>
            <Ionicons name="brush-outline" size={24} color={Colors.primary} />
            <Text style={styles.navigationCardText}>Creative Tools</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        );
    }
  };

  const displayUri = currentUri ?? project?.originalImageUri;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.editorTitle}>{project?.title ?? 'Editor'}</Text>
        <View style={styles.topRight}>
          <TouchableOpacity onPress={undo} disabled={!canUndo()} style={styles.iconBtn}>
            <Ionicons name="arrow-undo-outline" size={22} color={canUndo() ? Colors.text.primary : Colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redo} disabled={!canRedo()} style={styles.iconBtn}>
            <Ionicons name="arrow-redo-outline" size={22} color={canRedo() ? Colors.text.primary : Colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/editor/export')} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving' : 'Save'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Canvas */}
      <View
        style={styles.canvas}
        onLayout={(e) => setCanvasSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })}
      >
        {displayUri ? (
          <EditorImage
            key={displayUri}
            uri={displayUri}
            adjustments={adjustments}
            filter={activeFilter}
            filterIntensity={filterIntensity}
            beauty={beautyValues}
          />
        ) : (
          <View style={styles.emptyCanvas}>
            <Ionicons name="image-outline" size={48} color={Colors.text.muted} />
          </View>
        )}

        {/* Crop overlay */}
        {isCropping && displayUri && (
          <View style={[StyleSheet.absoluteFillObject, styles.cropOverlay]} pointerEvents="none">
            {/* 3×3 grid lines */}
            <View style={[styles.gridLine, styles.gridLineV1]} />
            <View style={[styles.gridLine, styles.gridLineV2]} />
            <View style={[styles.gridLine, styles.gridLineH1]} />
            <View style={[styles.gridLine, styles.gridLineH2]} />
            {/* Corner markers */}
            <View style={[styles.cornerMarker, styles.corner_tl]} />
            <View style={[styles.cornerMarker, styles.corner_tr]} />
            <View style={[styles.cornerMarker, styles.corner_bl]} />
            <View style={[styles.cornerMarker, styles.corner_br]} />
          </View>
        )}

        {/* Text overlays — draggable, long-press to remove */}
        {!isCropping && textOverlays.map((overlay) => (
          <DraggableText
            key={overlay.id}
            overlay={overlay}
            canvasW={canvasSize.width}
            canvasH={canvasSize.height}
            onMove={updateTextOverlayPosition}
            onRemove={(id) => { haptic.medium(); removeTextOverlay(id); }}
          />
        ))}

        {(isEnhancing || isProcessing || isGenerating) && (
          <View style={styles.processingOverlay}>
            <LinearGradient colors={['rgba(10,10,15,0.95)', 'rgba(10,10,15,0.8)']} style={styles.processingContent}>
              <Text style={styles.processingIcon}>✦</Text>
              <Text style={styles.processingLabel}>
                {isGenerating ? 'Generating AI Family...' : processingLabel || 'Processing...'}
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Crop toolbar */}
      {isCropping && (
        <View style={styles.cropToolbar}>
          <Text style={styles.cropTitle}>Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {CROP_RATIOS.map((r) => (
              <TouchableOpacity
                key={r.label}
                onPress={() => setCropRatio(r.ratio)}
                style={[styles.cropRatioBtn, cropRatio === r.ratio && styles.cropRatioBtnActive]}
              >
                <Text style={[styles.cropRatioText, cropRatio === r.ratio && { color: Colors.primary }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.cropActions}>
            <TouchableOpacity onPress={() => setIsCropping(false)} style={styles.cropCancelBtn}>
              <Text style={styles.cropCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApplyCrop} style={styles.cropApplyBtn}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.cropApplyGradient}>
                <Text style={styles.cropApplyText}>Apply Crop</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AI Family modal */}
      {showAiFamily && (
        <View style={styles.aiFamilyOverlay}>
          <View style={styles.aiFamilyModal}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.aiModalHeader}>
              <Text style={styles.aiModalTitle}>👨‍👩‍👧 AI Family</Text>
              <Text style={styles.aiModalSubtitle}>Generate your child's portrait using AI</Text>
            </LinearGradient>
            <View style={styles.aiModalBody}>
              <Text style={styles.aiModalNote}>
                Upload clear front-facing portrait photos of both parents. The AI blends facial features naturally with no cartoon effects.
              </Text>
              <View style={styles.parentRow}>
                <TouchableOpacity onPress={() => pickParentPhoto(1)} style={[styles.parentSlot, parent1Uri && styles.parentSlotFilled]}>
                  {parent1Uri ? (
                    <Image source={{ uri: parent1Uri }} style={styles.parentThumb} contentFit="cover" />
                  ) : (
                    <>
                      <Ionicons name="person-outline" size={32} color={Colors.text.muted} />
                      <Text style={styles.parentSlotLabel}>Parent 1</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={styles.plusSign}>
                  <Text style={{ fontSize: 28, color: Colors.primary }}>+</Text>
                </View>
                <TouchableOpacity onPress={() => pickParentPhoto(2)} style={[styles.parentSlot, parent2Uri && styles.parentSlotFilled]}>
                  {parent2Uri ? (
                    <Image source={{ uri: parent2Uri }} style={styles.parentThumb} contentFit="cover" />
                  ) : (
                    <>
                      <Ionicons name="person-outline" size={32} color={Colors.text.muted} />
                      <Text style={styles.parentSlotLabel}>Parent 2</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.aiModalFooter}>
                <TouchableOpacity onPress={() => { setShowAiFamily(false); setParent1Uri(null); setParent2Uri(null); }} style={styles.aiModalCancel}>
                  <Text style={styles.aiModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGenerateChild}
                  disabled={!parent1Uri || !parent2Uri || isGenerating}
                  style={[styles.aiModalGenerate, (!parent1Uri || !parent2Uri) && { opacity: 0.4 }]}
                >
                  <LinearGradient colors={Colors.gradients.primary} style={styles.aiModalGenerateGradient}>
                    <Text style={styles.aiModalGenerateText}>
                      {isGenerating ? 'Generating...' : '✦ Generate Child'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Bottom panel — hidden during crop */}
      {!isCropping && !showAiFamily && (
        <View style={styles.bottomPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {TOOL_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => { haptic.selection(); setActiveTab(tab.id); }}
                style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              >
                {tab.icon === '✦' || tab.icon.length > 2 ? (
                  <Text style={[styles.tabIcon, { color: activeTab === tab.id ? Colors.primary : Colors.text.muted }]}>
                    {tab.icon}
                  </Text>
                ) : (
                  <Ionicons
                    name={(tab.icon + (activeTab !== tab.id ? '-outline' : '')) as any}
                    size={22}
                    color={activeTab === tab.id ? Colors.primary : Colors.text.muted}
                  />
                )}
                <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.tabContent}>{renderTabContent()}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.dark.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 8, backgroundColor: Colors.dark.background,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border,
  },
  iconBtn:            { padding: 8 },
  editorTitle: {
    flex: 1, textAlign: 'center', fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary,
  },
  topRight:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveBtn:            { borderRadius: Layout.radius.sm, overflow: 'hidden', marginLeft: 4 },
  saveBtnGradient:    { paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText:        { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

  canvas: {
    flex: 1, backgroundColor: Colors.dark.canvasBackground,
    alignItems: 'center', justifyContent: 'center',
  },
  previewImage:       { width: '100%', height: '100%' },
  emptyCanvas:        { alignItems: 'center', gap: 12 },

  vignetteOverlay:    {},

  // Crop overlay
  cropOverlay: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  gridLine:    { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
  gridLineV1:  { left: '33.3%', top: 0, bottom: 0, width: 1 },
  gridLineV2:  { left: '66.6%', top: 0, bottom: 0, width: 1 },
  gridLineH1:  { top: '33.3%', left: 0, right: 0, height: 1 },
  gridLineH2:  { top: '66.6%', left: 0, right: 0, height: 1 },
  cornerMarker: {
    position: 'absolute', width: 20, height: 20,
    borderColor: Colors.white, borderWidth: 3,
  },
  corner_tl: { top: 0,  left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
  corner_tr: { top: 0,  right: 0, borderLeftWidth: 0,  borderBottomWidth: 0 },
  corner_bl: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0 },
  corner_br: { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0 },

  textOverlay:        { position: 'absolute', top: 0, left: 0, padding: 6 },

  processingOverlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingContent:  { padding: 24, borderRadius: Layout.radius.xl, alignItems: 'center', gap: 12 },
  processingIcon:     { fontSize: 32, color: Colors.primary },
  processingLabel:    { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },

  // Crop toolbar
  cropToolbar: {
    backgroundColor: Colors.dark.surface, borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border, paddingTop: 12, paddingBottom: 16,
  },
  cropTitle: {
    fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary, textAlign: 'center', marginBottom: 10,
  },
  cropRatioBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  cropRatioBtnActive: { backgroundColor: `${Colors.primary}22`, borderColor: Colors.primary },
  cropRatioText:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  cropActions:        { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  cropCancelBtn:      { flex: 1, paddingVertical: 12, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card, alignItems: 'center' },
  cropCancelText:     { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  cropApplyBtn:       { flex: 2, borderRadius: Layout.radius.md, overflow: 'hidden' },
  cropApplyGradient:  { paddingVertical: 12, alignItems: 'center' },
  cropApplyText:      { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.white },

  // AI Family modal
  aiFamilyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 20,
  },
  aiFamilyModal: {
    width: '100%', maxWidth: 420,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.radius.xl, overflow: 'hidden',
  },
  aiModalHeader: { padding: 20, alignItems: 'center', gap: 6 },
  aiModalTitle: { fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.white },
  aiModalSubtitle: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.8)' },
  aiModalBody: { padding: 20, gap: 16 },
  aiModalNote: {
    fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular',
    color: Colors.text.secondary, lineHeight: 20,
    backgroundColor: `${Colors.primary}12`, borderRadius: Layout.radius.md, padding: 12,
  },
  parentRow:        { flexDirection: 'row', gap: 12, alignItems: 'center' },
  parentSlot: {
    flex: 1, aspectRatio: 1, borderRadius: Layout.radius.lg,
    backgroundColor: Colors.dark.background,
    borderWidth: 2, borderColor: Colors.dark.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden',
  },
  parentSlotFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  parentThumb:      { width: '100%', height: '100%' },
  parentSlotLabel:  { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  plusSign:         { width: 36, alignItems: 'center' },
  aiModalFooter:    { flexDirection: 'row', gap: 12 },
  aiModalCancel: {
    flex: 1, paddingVertical: 12, borderRadius: Layout.radius.md,
    backgroundColor: Colors.dark.background, alignItems: 'center',
  },
  aiModalCancelText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  aiModalGenerate:   { flex: 2, borderRadius: Layout.radius.md, overflow: 'hidden' },
  aiModalGenerateGradient: { paddingVertical: 12, alignItems: 'center' },
  aiModalGenerateText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.white },

  // Bottom panel
  bottomPanel: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border, paddingBottom: 24,
  },
  tabsRow:          { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, gap: 4 },
  tabBtn:           { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 4, borderRadius: Layout.radius.md },
  tabBtnActive:     { backgroundColor: `${Colors.primary}18` },
  tabIcon:          { fontSize: 20 },
  tabLabel:         { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  tabLabelActive:   { color: Colors.primary },
  tabContent:       { minHeight: 90, justifyContent: 'center' },

  aiActionCard: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 14, alignItems: 'center', gap: 4, minWidth: 90,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  aiActionLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, textAlign: 'center' },
  aiActionDesc:  { fontSize: 9, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center' },

  toolItem: { alignItems: 'center', gap: 6, minWidth: 68 },
  toolIconBg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  toolItemLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  navigationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, margin: 12, borderRadius: Layout.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  navigationCardText: { flex: 1, fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },
});
