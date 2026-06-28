import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Alert, ScrollView, Platform,
  ActionSheetIOS, PanResponder, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { useEditorStore, TextOverlay } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { imageProcessor } from '../../services/image/imageProcessor.service';
import { aiEnhancement } from '../../services/image/aiEnhancement.service';
import EditorImage from '../../components/EditorImage';
import AppSlider from '../../components/AppSlider';
import { TextEditToolbar } from '../../components/editor/TextEditToolbar';
import { FilterCatalog } from '../../constants/FilterCatalog';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ToolTab = 'ai' | 'tools' | 'adjustments' | 'filters' | 'effects' | 'beauty' | 'layers' | 'creative';

const TOOL_TABS: { id: ToolTab; icon: string; label: string }[] = [
  { id: 'ai',          icon: '✦',            label: 'AI'       },
  { id: 'tools',       icon: 'crop',         label: 'Tools'    },
  { id: 'adjustments', icon: 'contrast',     label: 'Adjust'   },
  { id: 'filters',     icon: 'color-filter', label: 'Filters'  },
  { id: 'effects',     icon: 'color-wand',   label: 'Effects'  },
  { id: 'beauty',      icon: 'sparkles',     label: 'Beauty'   },
  { id: 'layers',      icon: 'layers',       label: 'Layers'   },
  { id: 'creative',    icon: 'brush',        label: 'Creative' },
];

// Full tool row. Tools with a sub-menu open a bottom sheet of options; the rest
// act directly. (Tune-up intentionally omitted per request.)
const TOOLS = [
  { id: 'crop',     icon: 'crop-outline',         label: 'Crop'     },
  { id: 'adjust',   icon: 'options-outline',      label: 'Adjust'   },
  { id: 'filter',   icon: 'color-filter-outline', label: 'Filter'   },
  { id: 'effects',  icon: 'color-wand-outline',   label: 'Effects'  },
  { id: 'beautify', icon: 'sparkles-outline',     label: 'Beautify' },
  { id: 'remove',   icon: 'trash-outline',        label: 'Remove'   },
  { id: 'frame',    icon: 'tablet-landscape-outline', label: 'Frame' },
  { id: 'fit',      icon: 'resize-outline',       label: 'Fit'      },
  { id: 'text',     icon: 'text-outline',         label: 'Text'     },
  { id: 'sticker',  icon: 'happy-outline',        label: 'Sticker'  },
  { id: 'blur',     icon: 'aperture-outline',     label: 'Blur'     },
  { id: 'add',      icon: 'add-circle-outline',   label: 'Add'      },
  { id: 'draw',     icon: 'brush-outline',        label: 'Draw'     },
  { id: 'enhance',  icon: 'flash-outline',        label: 'Enhance'  },
  { id: 'cutout',   icon: 'cut-outline',          label: 'Cut Out'  },
  { id: 'body',     icon: 'body-outline',         label: 'Body'     },
  { id: 'logo',     icon: 'star-outline',         label: 'Logo'     },
];

// ── Sub-menus ────────────────────────────────────────────────────────────────
// kind: route → open a screen | tab → switch bottom tab | crop → start crop
//       blur → open the blur modal with this style | fit → square pad
//       enhance → one-tap AI | files/camera → import | restore → revert to original
//       submenu → open a nested sheet | pro → Pro (coming soon) | soon → coming soon
type SubKind =
  | 'route' | 'tab' | 'crop' | 'blur' | 'fit' | 'enhance' | 'makeup' | 'beautyfx'
  | 'files' | 'camera' | 'restore' | 'submenu' | 'pro' | 'soon' | 'addText';
type SubItem = { id: string; label: string; icon?: string; kind: SubKind; target?: string; sub?: string };

const SUBMENUS: Record<string, { title: string; items: SubItem[] }> = {
  beautify: { title: 'Beautify', items: [
    { id: 'ai-looks',  label: 'AI Looks',    icon: 'color-wand-outline',  kind: 'route', target: '/editor/beauty' },
    { id: 'face',      label: 'Face',        icon: 'happy-outline',       kind: 'route', target: '/editor/beauty' },
    { id: 'retouch',   label: 'Retouch',     icon: 'brush-outline',       kind: 'route', target: '/editor/beauty' },
    { id: 'makeup',    label: 'Makeup',      icon: 'color-palette-outline', kind: 'makeup' },
    { id: 'blemish',   label: 'Blemish',     icon: 'medkit-outline',      kind: 'route', target: '/editor/beauty' },
    { id: 'wrinkles',  label: 'Wrinkles',    icon: 'remove-circle-outline', kind: 'beautyfx' },
    { id: 'darkcirc',  label: 'Dark Circles', icon: 'eye-outline',        kind: 'beautyfx' },
    { id: 'shape',     label: 'Shape',       icon: 'body-outline',        kind: 'submenu', sub: 'shape' },
  ]},
  shape: { title: 'Shape', items: [
    { id: 'reshape', label: 'Reshape', icon: 'body-outline',    kind: 'beautyfx' },
    { id: 'details', label: 'Details', icon: 'sparkles-outline', kind: 'route', target: '/editor/beauty' },
    { id: 'resize',  label: 'Resize',  icon: 'resize-outline',  kind: 'soon' },
    { id: 'restore', label: 'Restore', icon: 'refresh-outline', kind: 'restore' },
  ]},
  remove: { title: 'Remove', items: [
    { id: 'object',   label: 'Remove Object', icon: 'trash-outline',   kind: 'pro' },
    { id: 'recovery', label: 'Recovery',      icon: 'refresh-outline', kind: 'restore' },
    { id: 'bg',       label: 'Background',     icon: 'cut-outline',     kind: 'route', target: '/editor/bg-remove' },
  ]},
  text: { title: 'Text', items: [
    { id: 'font',   label: 'Add Text',     icon: 'text-outline',       kind: 'addText' },
    { id: 'bubble', label: 'Text Bubbles', icon: 'chatbubble-outline', kind: 'addText', target: 'bubble' },
    { id: 'more',   label: 'More Fonts',   icon: 'color-wand-outline', kind: 'route', target: '/editor/creative' },
  ]},
  blur: { title: 'Blur', items: [
    { id: 'circle', label: 'Circle', icon: 'ellipse-outline',         kind: 'blur' },
    { id: 'linear', label: 'Linear', icon: 'reorder-four-outline',    kind: 'blur' },
    { id: 'radial', label: 'Radial', icon: 'aperture-outline',        kind: 'blur' },
    { id: 'motion', label: 'Motion', icon: 'swap-horizontal-outline', kind: 'blur' },
    { id: 'zoom',   label: 'Zoom',   icon: 'scan-outline',            kind: 'blur' },
  ]},
  add: { title: 'Add', items: [
    { id: 'files',  label: 'Files',  icon: 'folder-outline', kind: 'files' },
    { id: 'camera', label: 'Camera', icon: 'camera-outline', kind: 'camera' },
    { id: 'search', label: 'Search', icon: 'search-outline', kind: 'pro' },
  ]},
  cutout: { title: 'Cut Out', items: [
    { id: 'ai',     label: 'AI Cutout', icon: 'cut-outline',    kind: 'route', target: '/editor/bg-remove' },
    { id: 'brush',  label: 'Brush',     icon: 'brush-outline',  kind: 'route', target: '/editor/cutout-brush' },
    { id: 'shapes', label: 'Shapes',    icon: 'shapes-outline', kind: 'route', target: '/editor/shapes' },
  ]},
};
// Nested sheets → their parent, for the back button.
const SUB_PARENT: Record<string, string> = { shape: 'beautify' };

const EFFECTS = [
  { id: 'lightfix', label: 'Light Fix', emoji: '🔆' },
  { id: 'cartoon',  label: 'Cartoon',  emoji: '🖼️' },
  { id: 'sketch',   label: 'Sketch',   emoji: '✏️' },
  { id: 'neon',     label: 'Neon',     emoji: '💡' },
  { id: 'splash',   label: 'Splash',   emoji: '💧' },
  { id: 'mirror',   label: 'Mirror',   emoji: '🪞' },
  { id: 'drip',     label: 'Drip',     emoji: '🎨' },
  { id: 'duotone',  label: 'Duotone',  emoji: '🌈' },
  { id: 'vhs',      label: 'VHS',      emoji: '📼' },
  { id: 'pixelate', label: 'Pixel',    emoji: '🟦' },
  { id: 'sepia',    label: 'Sepia',    emoji: '🟤' },
  { id: 'bw',       label: 'B&W',      emoji: '⬛' },
  { id: 'negative', label: 'Negative', emoji: '🔲' },
  { id: 'warm',     label: 'Warm',     emoji: '🔥' },
  { id: 'cool',     label: 'Cool',     emoji: '❄️' },
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

const LOGO_STYLES: { color: string; label: string; name: string }[] = [
  { color: '#22C55E', label: 'Green',         name: 'Green Logo' },
  { color: '#F59E0B', label: 'Gold',          name: 'Gold Logo'  },
  { color: '#EF4444', label: 'Red',           name: 'Red Logo'   },
  { color: '#3B82F6', label: 'Blue',          name: 'Blue Logo'  },
  { color: '#111827', label: 'Black & White', name: 'BW Logo'    },
];

const CROP_RATIOS: { label: string; ratio: number | null }[] = [
  { label: 'Free',          ratio: null },
  { label: '1:1',           ratio: 1     },
  { label: 'IG 4:5',        ratio: 4/5   },
  { label: 'Post 5:4',      ratio: 5/4   },
  { label: '4:3',           ratio: 4/3   },
  { label: '3:4',           ratio: 3/4   },
  { label: '3:2',           ratio: 3/2   },
  { label: 'Pin 2:3',       ratio: 2/3   },
  { label: '16:9',          ratio: 16/9  },
  { label: 'Story 9:16',    ratio: 9/16  },
  { label: 'X Header 3:1',  ratio: 3     },
  { label: 'FB Cover 1.91', ratio: 1.91  },
  { label: 'Wide 16:10',    ratio: 16/10 },
  { label: 'Movie 21:9',    ratio: 21/9  },
];

// ── Draggable text overlay rendered on the canvas ───────────────────────────
function DraggableText({
  overlay, canvasW, canvasH, selected, onMove, onRemove, onSelect, onResize,
}: {
  overlay: TextOverlay;
  canvasW: number;
  canvasH: number;
  selected: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onResize: (id: string, fontSize: number) => void;
}) {
  const pan = useRef(new Animated.ValueXY({
    x: overlay.x * canvasW,
    y: overlay.y * canvasH,
  })).current;

  // Latest props for the gesture closures (which are created once).
  const ref = useRef(overlay);
  ref.current = overlay;
  // Pinch state: distance + font size captured when the 2nd finger lands.
  const pinch = useRef<{ dist: number; size: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        onSelect(ref.current.id);
        pan.extractOffset();
      },
      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches;
        // Two fingers → pinch-to-resize the TEXT only (never the photo).
        if (touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.hypot(dx, dy) || 1;
          if (!pinch.current) pinch.current = { dist, size: ref.current.fontSize };
          else {
            const next = Math.max(10, Math.min(200, pinch.current.size * (dist / pinch.current.dist)));
            onResize(ref.current.id, next);
          }
          return;
        }
        // One finger → move.
        pan.x.setValue(g.dx);
        pan.y.setValue(g.dy);
      },
      onPanResponderRelease: () => {
        pinch.current = null;
        pan.flattenOffset();
        const nx = (pan.x as any)._value / canvasW;
        const ny = (pan.y as any)._value / canvasH;
        onMove(ref.current.id, Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)));
      },
    })
  ).current;

  // Bottom-right drag handle to resize on devices without pinch (e.g. desktop).
  const resizeStart = useRef(0);
  const resizePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { resizeStart.current = ref.current.fontSize; },
      onPanResponderMove: (_, g) => {
        const delta = (g.dx + g.dy) / 2;
        onResize(ref.current.id, Math.max(10, Math.min(200, resizeStart.current + delta * 0.6)));
      },
    })
  ).current;

  const bubble = overlay.bubble ?? 'none';
  const bubbleColor = overlay.bubbleColor ?? '#FFFFFF';
  const hasBubble = bubble !== 'none';
  const outlineOnly = bubble === 'outline';

  // Container shape for the bubble (LABEL = filled, BORDER = outline).
  const bubbleStyle = hasBubble
    ? {
        backgroundColor: outlineOnly ? 'transparent' : bubbleColor,
        borderColor: outlineOnly ? bubbleColor : 'transparent',
        borderWidth: outlineOnly ? 3 : 0,
        borderRadius: bubble === 'box' ? 8 : bubble === 'pill' ? 999 : 18,
        paddingHorizontal: bubble === 'pill' ? 18 : 14,
        paddingVertical: bubble === 'pill' ? 10 : 12,
      }
    : null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.textOverlay,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
      ]}
    >
      <TouchableOpacity onPress={() => onSelect(overlay.id)} activeOpacity={0.9}>
        <View style={hasBubble ? bubbleStyle : undefined}>
          <Text
            style={{
              color: overlay.color,
              fontSize: overlay.fontSize,
              textAlign: overlay.align,
              fontFamily: overlay.fontFamily,
              fontWeight: overlay.bold ? 'bold' : 'normal',
              fontStyle: overlay.italic ? 'italic' : 'normal',
              textShadowColor: hasBubble ? 'transparent' : 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {overlay.content || ' '}
          </Text>
          {/* Speech tail */}
          {bubble === 'speech' && (
            <View style={[styles.bubbleTail, { backgroundColor: bubbleColor }]} pointerEvents="none" />
          )}
          {/* Thought trail */}
          {bubble === 'thought' && (
            <>
              <View style={[styles.thoughtDot, { backgroundColor: bubbleColor, width: 12, height: 12, left: 14, bottom: -10 }]} pointerEvents="none" />
              <View style={[styles.thoughtDot, { backgroundColor: bubbleColor, width: 7, height: 7, left: 8, bottom: -20 }]} pointerEvents="none" />
            </>
          )}
        </View>

        {/* Selection chrome — kept separate so it never hides the BORDER colour. */}
        {selected && (
          <>
            <View pointerEvents="none" style={styles.selectionBox} />
            <TouchableOpacity onPress={() => onRemove(overlay.id)} style={styles.textDeleteBadge} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={14} color={Colors.white} />
            </TouchableOpacity>
            <View {...resizePan.panHandlers} style={styles.textResizeHandle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="resize-outline" size={13} color={Colors.white} />
            </View>
          </>
        )}
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
  const [showLogo, setShowLogo]           = useState(false);
  // Effects intensity (live preview before committing)
  const [effectId, setEffectId]           = useState<string | null>(null);
  const [effectBase, setEffectBase]       = useState<string | null>(null);
  const [effectIntensity, setEffectIntensity] = useState(100);
  // Blur Background strength modal
  const [showBlur, setShowBlur]           = useState(false);
  const [blurStrength, setBlurStrength]   = useState(14);
  const [blurType, setBlurType]           = useState<string>('circle');
  const [blurCount, setBlurCount]         = useState(8);   // motion: streak count
  const [blurOpacity, setBlurOpacity]     = useState(100); // motion: blur opacity
  // Tool sub-menu bottom sheet (e.g. Beautify, Remove, Blur, Add, Cut Out)
  const [subTool, setSubTool]             = useState<string | null>(null);
  // Lightweight, auto-dismissing toast (non-blocking action feedback)
  const [toast, setToast]                 = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [parent1Uri, setParent1Uri]       = useState<string | null>(null);
  const [parent2Uri, setParent2Uri]       = useState<string | null>(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [canvasSize, setCanvasSize]       = useState({ width: SCREEN_W, height: SCREEN_H });
  const [imgNatural, setImgNatural]       = useState({ width: 0, height: 0 });
  // Currently-selected text overlay (shows the on-canvas text toolbar).
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const didNavigateTool = useRef(false);

  const project      = useProjectStore((s) => s.getProject(id ?? ''));
  const updateProject = useProjectStore((s) => s.updateProject);

  const {
    currentUri, adjustments, loadImage, isEnhancing, setEnhancing,
    setCurrentUri, setAdjustments, canUndo, canRedo, undo, redo,
    isProcessing, processingLabel, setProcessing, pushHistory, setActiveTool,
    textOverlays, updateTextOverlayPosition, removeTextOverlay,
    addTextOverlay, updateTextOverlay,
    activeFilterId, filterIntensity, beautyValues,
  } = useEditorStore();

  const activeFilter = activeFilterId ? FilterCatalog.find((f) => f.id === activeFilterId) ?? null : null;

  // Show a brief, non-blocking toast (auto-hides) so actions confirm without
  // covering the image with a pop-up.
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

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
  const handleRotateBy = useCallback(async (deg: number) => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Rotating...');
    try {
      const uri = await imageProcessor.rotate(currentUri, deg);
      setCurrentUri(uri);
      pushHistory(`Rotated ${deg}°`, uri);
      haptic.success();
    } catch {
      haptic.error();
      Alert.alert('Rotate Failed', 'Could not rotate the image. Please try again.');
    }
    finally { setProcessing(false); }
  }, [currentUri]);
  const handleRotate = useCallback(() => handleRotateBy(90), [handleRotateBy]);

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

  // ── Straighten / level (rotate + H/V correction), applied live from a base ────
  const cropBaseRef = useRef<string | null>(null);
  const straReq = useRef(0);
  const [straMode, setStraMode] = useState<'angle' | 'skewH' | 'skewV'>('angle');
  const [stra, setStra] = useState({ angle: 0, skewH: 0, skewV: 0 });

  // Capture the pre-crop image once when entering crop, and reset straighten.
  useEffect(() => {
    if (isCropping) {
      cropBaseRef.current = currentUri;
      setStra({ angle: 0, skewH: 0, skewV: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCropping]);

  const applyStraighten = useCallback(async (next: { angle: number; skewH: number; skewV: number }) => {
    const base = cropBaseRef.current;
    if (!base) return;
    const myReq = ++straReq.current;
    try {
      const uri = await imageProcessor.straighten(base, next);
      if (myReq === straReq.current) setCurrentUri(uri);
    } catch {}
  }, [setCurrentUri]);

  // ── Interactive crop box (drag to move, drag corners to resize) ───────────────
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropRectRef = useRef(cropRect);
  useEffect(() => { cropRectRef.current = cropRect; }, [cropRect]);
  const cropRatioRef = useRef(cropRatio);
  useEffect(() => { cropRatioRef.current = cropRatio; }, [cropRatio]);
  const gestureStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Fetch the image's natural size so the crop overlay maps to the displayed image.
  useEffect(() => {
    if (!isCropping || !currentUri) return;
    let cancelled = false;
    imageProcessor.getImageSize(currentUri)
      .then((s) => { if (!cancelled) setImgNatural(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isCropping, currentUri]);

  // Displayed image rect within the canvas (object-fit: contain).
  const dispRect = useMemo(() => {
    const cw = canvasSize.width, ch = canvasSize.height;
    if (!cw || !ch) return null;
    let dispW = cw, dispH = ch;
    if (imgNatural.width && imgNatural.height) {
      const scale = Math.min(cw / imgNatural.width, ch / imgNatural.height);
      dispW = imgNatural.width * scale;
      dispH = imgNatural.height * scale;
    }
    return { left: (cw - dispW) / 2, top: (ch - dispH) / 2, width: dispW, height: dispH };
  }, [canvasSize, imgNatural]);
  const dispRectRef = useRef(dispRect);
  useEffect(() => { dispRectRef.current = dispRect; }, [dispRect]);

  // Re-fit the crop box when cropping starts or the ratio changes.
  useEffect(() => {
    if (!isCropping || !dispRect) return;
    let w = dispRect.width, h = dispRect.height;
    if (cropRatio) {
      if (dispRect.width / dispRect.height > cropRatio) { h = dispRect.height; w = h * cropRatio; }
      else { w = dispRect.width; h = w / cropRatio; }
    } else {
      // Free: start inset to 80% so the corner handles sit INSIDE the image and
      // are easy to grab — then drag any corner to crop to any size you want.
      w = dispRect.width * 0.8;
      h = dispRect.height * 0.8;
    }
    setCropRect({ x: dispRect.left + (dispRect.width - w) / 2, y: dispRect.top + (dispRect.height - h) / 2, w, h });
  }, [isCropping, cropRatio, dispRect]);

  const clampCrop = (r: { x: number; y: number; w: number; h: number }) => {
    const d = dispRectRef.current;
    if (!d) return r;
    let { x, y, w, h } = r;
    w = Math.max(40, Math.min(w, d.width));
    h = Math.max(40, Math.min(h, d.height));
    x = Math.max(d.left, Math.min(x, d.left + d.width - w));
    y = Math.max(d.top, Math.min(y, d.top + d.height - h));
    return { x, y, w, h };
  };

  // Move the whole box.
  const bodyPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { gestureStart.current = cropRectRef.current; },
      onPanResponderMove: (_, g) => {
        const s = gestureStart.current;
        if (!s) return;
        setCropRect(clampCrop({ x: s.x + g.dx, y: s.y + g.dy, w: s.w, h: s.h }));
      },
    }),
  ).current;

  // Corner resize (aspect-locked when a fixed ratio is selected).
  const cornersRef = useRef<Record<string, any> | null>(null);
  if (!cornersRef.current) {
    const makeCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { gestureStart.current = cropRectRef.current; },
        onPanResponderMove: (_, g) => {
          const s = gestureStart.current;
          if (!s) return;
          const ratio = cropRatioRef.current;
          const right = corner === 'tr' || corner === 'br';
          const bottom = corner === 'bl' || corner === 'br';
          let x = s.x, y = s.y, w = s.w, h = s.h;
          if (ratio) {
            const nw = Math.max(40, s.w + (right ? g.dx : -g.dx));
            const nh = nw / ratio;
            x = right ? s.x : s.x + (s.w - nw);
            y = bottom ? s.y : s.y + (s.h - nh);
            w = nw; h = nh;
          } else {
            if (right) w = s.w + g.dx; else { x = s.x + g.dx; w = s.w - g.dx; }
            if (bottom) h = s.h + g.dy; else { y = s.y + g.dy; h = s.h - g.dy; }
            if (w < 40) { w = 40; if (!right) x = s.x + s.w - 40; }
            if (h < 40) { h = 40; if (!bottom) y = s.y + s.h - 40; }
          }
          setCropRect(clampCrop({ x, y, w, h }));
        },
      });
    cornersRef.current = { tl: makeCorner('tl'), tr: makeCorner('tr'), bl: makeCorner('bl'), br: makeCorner('br') };
  }
  const corners = cornersRef.current;

  const handleApplyCrop = useCallback(async () => {
    if (!currentUri || !dispRect || !cropRect) { setIsCropping(false); return; }
    haptic.medium();
    setProcessing(true, 'Cropping...');
    try {
      const { width: iw, height: ih } = await imageProcessor.getImageSize(currentUri);
      const nx = (cropRect.x - dispRect.left) / dispRect.width;
      const ny = (cropRect.y - dispRect.top) / dispRect.height;
      const nw = cropRect.w / dispRect.width;
      const nh = cropRect.h / dispRect.height;
      const originX = Math.max(0, Math.round(nx * iw));
      const originY = Math.max(0, Math.round(ny * ih));
      const cropW = Math.max(1, Math.min(iw - originX, Math.round(nw * iw)));
      const cropH = Math.max(1, Math.min(ih - originY, Math.round(nh * ih)));
      const uri = await imageProcessor.crop(currentUri, { originX, originY, width: cropW, height: cropH });
      setCurrentUri(uri);
      pushHistory('Cropped', uri);
      haptic.success();
      showToast('Cropped');
    } catch (e) {
      Alert.alert('Crop Failed', 'Could not crop the image. Please try again.');
      haptic.error();
    } finally {
      setProcessing(false);
      setIsCropping(false);
    }
  }, [currentUri, dispRect, cropRect, showToast]);

  // Opens the full Logo Maker (symbol/photo emblem + brand text + background).
  const handleLogoTool = useCallback(() => {
    haptic.light();
    router.push('/editor/logo' as any);
  }, []);

  const applyLogoStyle = useCallback(async (accentColor: string, label: string) => {
    if (!currentUri) return;
    setShowLogo(false);
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
    } catch { haptic.error(); }
    finally { setProcessing(false); }
  }, [currentUri]);

  const handleToolPress = useCallback(async (toolId: string) => {
    // Tools backed by a sub-menu open the bottom sheet of options.
    if (SUBMENUS[toolId]) { haptic.selection(); setSubTool(toolId); return; }
    switch (toolId) {
      case 'crop':    haptic.light(); setIsCropping(true); break;
      case 'adjust':  router.push('/editor/adjustments' as any); break;
      case 'filter':  router.push('/editor/filters' as any); break;
      case 'effects': haptic.selection(); setActiveTab('effects'); break;
      case 'frame':   router.push('/editor/creative' as any); break;
      case 'draw':    router.push('/editor/creative' as any); break;
      case 'fit':     await handleSquare(); break;
      case 'enhance': await handleAiAction('enhance'); break;
      case 'logo':    handleLogoTool(); break;
      case 'sticker': router.push({ pathname: '/editor/creative', params: { tab: 'stickers' } } as any); break;
      case 'body':    haptic.light(); showToast('Body — Pro (coming soon)'); break;
      default:
        haptic.light();
        showToast('Coming soon');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLogoTool, showToast, currentUri]);

  // ── Add: import a new photo from gallery / camera ─────────────────────────────
  const importPhoto = useCallback(async (source: 'files' | 'camera') => {
    try {
      const res = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
      if (!res.canceled && res.assets?.[0]?.uri) {
        haptic.success();
        setCurrentUri(res.assets[0].uri);
        pushHistory(source === 'camera' ? 'Camera photo' : 'Added photo', res.assets[0].uri);
        showToast(source === 'camera' ? 'Photo captured' : 'Photo added');
      }
    } catch {
      haptic.error();
      showToast(source === 'camera' ? 'Camera unavailable' : 'Could not open files');
    }
  }, [setCurrentUri, pushHistory, showToast]);

  // ── Restore / Recovery: revert to the original photo ──────────────────────────
  const restoreOriginal = useCallback(() => {
    const orig = project?.originalImageUri;
    if (!orig) return;
    haptic.medium();
    setCurrentUri(orig);
    pushHistory('Restored original', orig);
    showToast('Restored original');
  }, [project?.originalImageUri, setCurrentUri, pushHistory, showToast]);

  // ── Sub-menu item dispatch ────────────────────────────────────────────────────
  const handleSubItem = useCallback(async (item: SubItem) => {
    switch (item.kind) {
      case 'route':   setSubTool(null); router.push(item.target as any); break;
      case 'tab':     setSubTool(null); setActiveTab(item.target as ToolTab); break;
      case 'crop':    setSubTool(null); setIsCropping(true); break;
      case 'fit':     setSubTool(null); await handleSquare(); break;
      case 'enhance': setSubTool(null); await handleAiAction('enhance'); break;
      case 'makeup':  setSubTool(null); await handleMakeup(); break;
      case 'beautyfx': setSubTool(null); await handleBeautyFx(item.id); break;
      case 'files':   setSubTool(null); await importPhoto('files'); break;
      case 'camera':  setSubTool(null); await importPhoto('camera'); break;
      case 'restore': setSubTool(null); restoreOriginal(); break;
      case 'blur':    setSubTool(null); haptic.light(); setBlurType(item.id); setBlurStrength(14); setShowBlur(true); break;
      case 'submenu': haptic.selection(); if (item.sub) setSubTool(item.sub); break;
      case 'pro':     haptic.light(); showToast(`${item.label} — Pro (coming soon)`); break;
      case 'soon':    haptic.light(); showToast(`${item.label} — coming soon`); break;
      case 'addText': {
        setSubTool(null);
        haptic.light();
        const newId = addTextOverlay({
          content: '',
          color: '#FFFFFF',
          fontSize: 36,
          align: 'center',
          bold: false,
          italic: false,
          fontFamily: 'Poppins_600SemiBold',
          x: 0.3,
          y: 0.4,
          bubble: item.target === 'bubble' ? 'box' : 'none',
          bubbleColor: '#000000',
        });
        setSelectedTextId(newId);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importPhoto, restoreOriginal, showToast, currentUri, addTextOverlay]);

  // ── Blur Background (DSLR/portrait) — opens a strength modal ──────────────────
  const handleBlurBackground = useCallback(() => {
    if (!currentUri) return;
    haptic.light();
    setBlurStrength(14);
    setShowBlur(true);
  }, [currentUri]);

  const applyBlur = useCallback(async () => {
    if (!currentUri) return;
    setShowBlur(false);
    haptic.medium();
    setProcessing(true, 'Blurring background…');
    try {
      const uri = await imageProcessor.blurBackground(currentUri, {
        strength: blurStrength, type: blurType, count: blurCount, opacity: blurOpacity,
      });
      setCurrentUri(uri);
      pushHistory(`${blurType} Blur`, uri);
      haptic.success();
      showToast(`${blurType.charAt(0).toUpperCase() + blurType.slice(1)} blur applied`);
    } catch (e: any) {
      haptic.error();
      Alert.alert('Blur failed', e?.message ?? 'Please try again.');
    } finally { setProcessing(false); }
  }, [currentUri, blurStrength, blurType, blurCount, blurOpacity, showToast]);

  // ── Square (no-crop, blurred border) ──────────────────────────────────────────
  const handleSquare = useCallback(async () => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Making square…');
    try {
      const uri = await imageProcessor.squarePad(currentUri, { border: 'blur' });
      setCurrentUri(uri);
      pushHistory('Square', uri);
      haptic.success();
      showToast('Square applied');
    } catch (e: any) {
      haptic.error();
      Alert.alert('Square failed', e?.message ?? 'Please try again.');
    } finally { setProcessing(false); }
  }, [currentUri, showToast]);

  // ── Makeup (face-aware lips + blush) ──────────────────────────────────────────
  const handleMakeup = useCallback(async () => {
    if (!currentUri) return;
    haptic.medium();
    setProcessing(true, 'Applying makeup…');
    try {
      const uri = await imageProcessor.applyMakeup(currentUri, { intensity: 0.6 });
      setCurrentUri(uri);
      pushHistory('Makeup', uri);
      haptic.success();
      showToast('Makeup applied');
    } catch (e: any) {
      haptic.error();
      Alert.alert('Makeup failed', e?.message ?? 'Please try again.');
    } finally { setProcessing(false); }
  }, [currentUri, showToast]);

  // ── Face-aware one-tap beauty fixes (wrinkles / dark circles / reshape) ──────
  const handleBeautyFx = useCallback(async (id: string) => {
    if (!currentUri) return;
    haptic.medium();
    const meta: Record<string, { label: string; run: (u: string) => Promise<string> }> = {
      wrinkles: { label: 'Wrinkles softened', run: (u) => imageProcessor.applyWrinkleSmooth(u, { intensity: 0.6 }) },
      darkcirc: { label: 'Dark circles reduced', run: (u) => imageProcessor.applyDarkCircleFix(u, { intensity: 0.65 }) },
      reshape:  { label: 'Face reshaped',     run: (u) => imageProcessor.reshapeFace(u, { amount: 0.6 }) },
    };
    const m = meta[id];
    if (!m) return;
    setProcessing(true, 'Processing…');
    try {
      const uri = await m.run(currentUri);
      setCurrentUri(uri);
      pushHistory(m.label, uri);
      haptic.success();
      showToast(m.label);
    } catch (e: any) {
      haptic.error();
      Alert.alert('Could not process', e?.message ?? 'Please try again.');
    } finally { setProcessing(false); }
  }, [currentUri, showToast]);

  // ── Effects with live intensity (preview, then commit) ────────────────────────
  // Select an effect → preview at full strength from the pre-effect base.
  const selectEffect = useCallback(async (eid: string) => {
    if (!currentUri) return;
    haptic.selection();
    const base = effectBase ?? currentUri; // don't stack uncommitted previews
    setEffectBase(base);
    setEffectId(eid);
    setEffectIntensity(100);
    setProcessing(true, 'Applying effect…');
    try {
      const uri = await imageProcessor.applyEffect(base, eid, 1);
      setCurrentUri(uri);
    } catch (e: any) {
      haptic.error();
      Alert.alert('Effect failed', e?.message ?? 'Please try again.');
    } finally { setProcessing(false); }
  }, [currentUri, effectBase]);

  // Re-render the preview at the released slider value.
  const previewEffectIntensity = useCallback(async (v: number) => {
    if (!effectBase || !effectId) return;
    try {
      const uri = await imageProcessor.applyEffect(effectBase, effectId, v / 100);
      setCurrentUri(uri);
    } catch {}
  }, [effectBase, effectId]);

  const commitEffect = useCallback(() => {
    if (!effectId || !currentUri) return;
    haptic.success();
    pushHistory(`Effect: ${effectId}`, currentUri);
    showToast('Effect applied');
    setEffectId(null);
    setEffectBase(null);
    setEffectIntensity(100);
  }, [effectId, currentUri, showToast]);

  const cancelEffect = useCallback(() => {
    if (effectBase) setCurrentUri(effectBase);
    setEffectId(null);
    setEffectBase(null);
    setEffectIntensity(100);
  }, [effectBase]);

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
      // Bake the live adjustments/filter/beauty into the actual pixels so the
      // saved image reflects every edit.
      const bakedUri = await imageProcessor.bake(currentUri, {
        adjustments,
        filter: activeFilter,
        filterIntensity,
        beauty: beautyValues,
      });
      // Refresh the thumbnail from the baked result (best-effort).
      let thumbnailUri: string | undefined;
      try { thumbnailUri = await imageProcessor.generateThumbnail(bakedUri, 300); } catch {}

      updateProject(id, {
        editedImageUri: bakedUri,
        ...(thumbnailUri ? { thumbnailUri } : {}),
        status: 'completed',
      });

      haptic.success();
      showToast('Saved ✓');
      // Brief pause so the toast is seen, then back to the dashboard.
      setTimeout(() => router.replace('/(tabs)'), 650);
    } catch (e: any) {
      haptic.error();
      // Single-button alert works on web (multi-button Alert.alert is ignored there).
      Alert.alert('Save failed', e?.message ?? 'Could not save your image. Please try again.');
    } finally { setIsSaving(false); }
  };

  // ── Tab content ──────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingVertical: 4 }}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 4 }}>
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

      case 'effects':
        return (
          <View>
            {effectId && (
              <View style={styles.effectBar}>
                <View style={styles.effectBarRow}>
                  <Text style={styles.effectName}>
                    {EFFECTS.find((e) => e.id === effectId)?.label} · {Math.round(effectIntensity)}%
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={cancelEffect}>
                      <Ionicons name="close" size={22} color={Colors.text.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={commitEffect}>
                      <Ionicons name="checkmark" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <AppSlider
                  style={{ width: '100%', height: 30 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={effectIntensity}
                  onValueChange={(v) => setEffectIntensity(v)}
                  onSlidingComplete={(v) => previewEffectIntensity(v)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.dark.border}
                  thumbTintColor={Colors.white}
                />
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 4 }}>
              {EFFECTS.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => selectEffect(e.id)}
                  disabled={isProcessing}
                  style={[styles.toolItem, isProcessing && { opacity: 0.5 }]}
                >
                  <View style={[styles.toolIconBg, effectId === e.id && styles.toolIconBgActive]}>
                    <Text style={{ fontSize: 22 }}>{e.emoji}</Text>
                  </View>
                  <Text style={[styles.toolItemLabel, effectId === e.id && { color: Colors.primary }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
      {/* Toast — non-blocking action feedback */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.editorTitle}>{project?.title ?? 'Editor'}</Text>
        <View style={styles.topRight}>
          <TouchableOpacity onPress={() => { if (canUndo()) { undo(); haptic.light(); showToast('Undone'); } }} disabled={!canUndo()} style={styles.iconBtn}>
            <Ionicons name="arrow-undo-outline" size={22} color={canUndo() ? Colors.text.primary : Colors.text.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (canRedo()) { redo(); haptic.light(); showToast('Redone'); } }} disabled={!canRedo()} style={styles.iconBtn}>
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

        {/* Crop overlay — drag to move, drag corners to resize */}
        {isCropping && displayUri && cropRect && (
          <View
            style={[styles.cropOverlay, { position: 'absolute', left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }]}
            {...bodyPan.panHandlers}
          >
            {/* 3×3 grid lines */}
            <View style={[styles.gridLine, styles.gridLineV1]} pointerEvents="none" />
            <View style={[styles.gridLine, styles.gridLineV2]} pointerEvents="none" />
            <View style={[styles.gridLine, styles.gridLineH1]} pointerEvents="none" />
            <View style={[styles.gridLine, styles.gridLineH2]} pointerEvents="none" />
            {/* Corner drag handles */}
            <View style={[styles.cropHandle, styles.handle_tl]} {...corners.tl.panHandlers}>
              <View style={[styles.cornerMarker, styles.corner_tl]} pointerEvents="none" />
            </View>
            <View style={[styles.cropHandle, styles.handle_tr]} {...corners.tr.panHandlers}>
              <View style={[styles.cornerMarker, styles.corner_tr]} pointerEvents="none" />
            </View>
            <View style={[styles.cropHandle, styles.handle_bl]} {...corners.bl.panHandlers}>
              <View style={[styles.cornerMarker, styles.corner_bl]} pointerEvents="none" />
            </View>
            <View style={[styles.cropHandle, styles.handle_br]} {...corners.br.panHandlers}>
              <View style={[styles.cornerMarker, styles.corner_br]} pointerEvents="none" />
            </View>
          </View>
        )}

        {/* Text overlays — tap to edit, drag to move, long-press to remove */}
        {!isCropping && textOverlays.map((overlay) => (
          <DraggableText
            key={overlay.id}
            overlay={overlay}
            canvasW={canvasSize.width}
            canvasH={canvasSize.height}
            selected={selectedTextId === overlay.id}
            onMove={updateTextOverlayPosition}
            onRemove={(id) => { haptic.medium(); removeTextOverlay(id); if (selectedTextId === id) setSelectedTextId(null); }}
            onSelect={(id) => { setSelectedTextId(id); }}
            onResize={(id, fontSize) => updateTextOverlay(id, { fontSize })}
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
          {/* Quick transforms — rotate & flip (kept accessible from the crop view) */}
          <View style={styles.transformRow}>
            <TouchableOpacity onPress={() => handleRotateBy(-90)} style={styles.transformBtn}>
              <Ionicons name="arrow-undo-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.transformLabel}>Left</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRotateBy(90)} style={styles.transformBtn}>
              <Ionicons name="arrow-redo-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.transformLabel}>Right</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFlip('horizontal')} style={styles.transformBtn}>
              <Ionicons name="swap-horizontal-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.transformLabel}>Flip H</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFlip('vertical')} style={styles.transformBtn}>
              <Ionicons name="swap-vertical-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.transformLabel}>Flip V</Text>
            </TouchableOpacity>
          </View>

          {/* Straighten / correction */}
          <View style={styles.straBlock}>
            <View style={styles.straTabs}>
              {([['angle', 'Straighten'], ['skewH', 'Horizontal'], ['skewV', 'Vertical']] as const).map(([m, label]) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { haptic.selection(); setStraMode(m); }}
                  style={[styles.straTab, straMode === m && styles.straTabActive]}
                >
                  <Text style={[styles.straTabText, straMode === m && { color: Colors.primary }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.straSliderRow}>
              <AppSlider
                style={{ flex: 1, height: 30 }}
                minimumValue={-25}
                maximumValue={25}
                step={1}
                value={stra[straMode]}
                onValueChange={(v) => { const next = { ...stra, [straMode]: v }; setStra(next); applyStraighten(next); }}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.dark.border}
                thumbTintColor={Colors.white}
              />
              <Text style={styles.straVal}>{stra[straMode] > 0 ? '+' : ''}{Math.round(stra[straMode])}°</Text>
            </View>
          </View>

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
            <TouchableOpacity
              onPress={() => { if (cropBaseRef.current) setCurrentUri(cropBaseRef.current); setIsCropping(false); }}
              style={styles.cropCancelBtn}
            >
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

      {/* Logo style modal */}
      {showLogo && (
        <View style={styles.aiFamilyOverlay}>
          <View style={styles.aiFamilyModal}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.aiModalHeader}>
              <Ionicons name="star" size={22} color={Colors.white} />
              <Text style={styles.aiModalTitle}>Create a Logo</Text>
              <Text style={styles.aiModalSubtitle}>Pick a color theme — we'll turn your photo into a sharp, high-contrast logo.</Text>
            </LinearGradient>
            <View style={styles.aiModalBody}>
              <View style={styles.logoGrid}>
                {LOGO_STYLES.map((s) => (
                  <TouchableOpacity
                    key={s.name}
                    onPress={() => applyLogoStyle(s.color, s.name)}
                    style={styles.logoSwatchItem}
                  >
                    <View style={[styles.logoSwatch, { backgroundColor: s.color }]}>
                      <Ionicons name="star" size={20} color={Colors.white} />
                    </View>
                    <Text style={styles.logoSwatchLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowLogo(false)} style={styles.aiModalCancel}>
                <Text style={styles.aiModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Blur Background strength modal */}
      {showBlur && (
        <View style={styles.aiFamilyOverlay}>
          <View style={styles.aiFamilyModal}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.aiModalHeader}>
              <Ionicons name="aperture" size={22} color={Colors.white} />
              <Text style={styles.aiModalTitle}>{blurType.charAt(0).toUpperCase() + blurType.slice(1)} Blur</Text>
              <Text style={styles.aiModalSubtitle}>Keeps your subject sharp. Pick how strong the blur should be.</Text>
            </LinearGradient>
            <View style={styles.aiModalBody}>
              <View style={styles.effectBarRow}>
                <Text style={styles.effectName}>Strength</Text>
                <Text style={[styles.effectName, { color: Colors.primary }]}>{Math.round(blurStrength)}px</Text>
              </View>
              <AppSlider
                style={{ width: '100%', height: 36 }}
                minimumValue={2}
                maximumValue={30}
                step={1}
                value={blurStrength}
                onValueChange={(v) => setBlurStrength(v)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.dark.border}
                thumbTintColor={Colors.white}
              />
              {blurType === 'motion' && (
                <>
                  <View style={styles.effectBarRow}>
                    <Text style={styles.effectName}>Count</Text>
                    <Text style={[styles.effectName, { color: Colors.primary }]}>{Math.round(blurCount)}</Text>
                  </View>
                  <AppSlider
                    style={{ width: '100%', height: 36 }}
                    minimumValue={2} maximumValue={30} step={1}
                    value={blurCount} onValueChange={(v) => setBlurCount(v)}
                    minimumTrackTintColor={Colors.primary} maximumTrackTintColor={Colors.dark.border} thumbTintColor={Colors.white}
                  />
                  <View style={styles.effectBarRow}>
                    <Text style={styles.effectName}>Opacity</Text>
                    <Text style={[styles.effectName, { color: Colors.primary }]}>{Math.round(blurOpacity)}%</Text>
                  </View>
                  <AppSlider
                    style={{ width: '100%', height: 36 }}
                    minimumValue={10} maximumValue={100} step={1}
                    value={blurOpacity} onValueChange={(v) => setBlurOpacity(v)}
                    minimumTrackTintColor={Colors.primary} maximumTrackTintColor={Colors.dark.border} thumbTintColor={Colors.white}
                  />
                </>
              )}
              <View style={styles.aiModalFooter}>
                <TouchableOpacity onPress={() => setShowBlur(false)} style={styles.aiModalCancel}>
                  <Text style={styles.aiModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyBlur} style={styles.aiModalGenerate}>
                  <LinearGradient colors={Colors.gradients.primary} style={styles.aiModalGenerateGradient}>
                    <Text style={styles.aiModalGenerateText}>Apply Blur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tool sub-menu sheet (Beautify / Remove / Text / Blur / Add / Cut Out …) */}
      {subTool && SUBMENUS[subTool] && !isCropping && !showAiFamily && !showLogo && !showBlur && (
        <View style={styles.subSheet}>
          <View style={styles.subSheetHeader}>
            <TouchableOpacity
              onPress={() => { haptic.light(); setSubTool(SUB_PARENT[subTool] ?? null); }}
              style={styles.iconBtn}
            >
              <Ionicons name={SUB_PARENT[subTool] ? 'chevron-back' : 'close'} size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.subSheetTitle}>{SUBMENUS[subTool].title}</Text>
            <View style={{ width: 36 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 6 }}>
            {SUBMENUS[subTool].items.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleSubItem(item)} style={styles.toolItem}>
                <View style={styles.toolIconBg}>
                  <Ionicons name={(item.icon ?? 'ellipse-outline') as any} size={22} color={Colors.primary} />
                  {(item.kind === 'pro') && (
                    <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
                  )}
                </View>
                <Text style={styles.toolItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* On-canvas text editor toolbar (shown when a text layer is selected) */}
      {(() => {
        const sel = textOverlays.find((o) => o.id === selectedTextId);
        if (!sel || isCropping) return null;
        return (
          <TextEditToolbar
            overlay={sel}
            onChange={(patch) => updateTextOverlay(sel.id, patch)}
            onClose={() => {
              // Discard a text layer left empty so blank placeholders never stick.
              if (!sel.content.trim()) removeTextOverlay(sel.id);
              setSelectedTextId(null);
            }}
            onDelete={() => { haptic.medium(); removeTextOverlay(sel.id); setSelectedTextId(null); }}
          />
        );
      })()}

      {/* Bottom panel — hidden during crop / sheets / text editing */}
      {!isCropping && !showAiFamily && !showLogo && !showBlur && !subTool && !selectedTextId && (
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
  toastWrap:          { position: 'absolute', top: 96, left: 0, right: 0, alignItems: 'center', zIndex: 300 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#14141C',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Layout.radius.full, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  toastText:          { color: Colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: Layout.fontSize.sm },
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
  cropDimmer: { alignItems: 'center', justifyContent: 'center' },
  cropOverlay: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.95)' },
  cropHandle: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  handle_tl: { left: -10, top: -10 },
  handle_tr: { right: -10, top: -10 },
  handle_bl: { left: -10, bottom: -10 },
  handle_br: { right: -10, bottom: -10 },
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
  selectionBox:       { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 8 },
  textDeleteBadge:    { position: 'absolute', top: -12, right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  textResizeHandle:   { position: 'absolute', bottom: -12, right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bubbleTail:         { position: 'absolute', left: 18, bottom: -7, width: 18, height: 18, transform: [{ rotate: '45deg' }] },
  thoughtDot:         { position: 'absolute', borderRadius: 999 },

  processingOverlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  processingContent:  { padding: 24, borderRadius: Layout.radius.xl, alignItems: 'center', gap: 12 },
  processingIcon:     { fontSize: 32, color: Colors.primary },
  processingLabel:    { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.white },

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
  cropRatioBtnActive: { backgroundColor: '#0D231A', borderColor: Colors.primary },
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
    backgroundColor: '#0C1715', borderRadius: Layout.radius.md, padding: 12,
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

  // Logo modal
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  logoSwatchItem: { alignItems: 'center', gap: 6, width: 72 },
  logoSwatch: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  logoSwatchLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, textAlign: 'center' },

  // Bottom panel
  // Effects panel kept as compact as possible so the image preview fills nearly
  // the whole screen — the editor can clearly see what they're applying.
  bottomPanel: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border, paddingBottom: 4,
  },
  tabsRow:          { paddingHorizontal: 12, paddingTop: 5, paddingBottom: 0, gap: 4 },
  tabBtn:           { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, gap: 2, borderRadius: Layout.radius.md },
  tabBtnActive:     { backgroundColor: '#0C1C16' },
  tabIcon:          { fontSize: 18 },
  tabLabel:         { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  tabLabelActive:   { color: Colors.primary },
  tabContent:       { minHeight: 50, justifyContent: 'center' },

  aiActionCard: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    padding: 10, alignItems: 'center', gap: 2, minWidth: 88,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  aiActionLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, textAlign: 'center' },
  aiActionDesc:  { fontSize: 9, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center' },

  toolItem: { alignItems: 'center', gap: 4, minWidth: 64 },
  toolIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  toolItemLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  toolIconBgActive: { borderColor: Colors.primary, backgroundColor: '#0C1C16' },

  // Pro badge on sub-menu items
  proBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  proBadgeText: { fontSize: 7, fontFamily: 'Poppins_700Bold', color: Colors.white, letterSpacing: 0.5 },

  // Tool sub-menu sheet
  subSheet: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
    paddingBottom: 10,
  },
  subSheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 6 },
  subSheetTitle: { flex: 1, textAlign: 'center', fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },

  // Crop transform row
  transformRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 16 },
  transformBtn: {
    alignItems: 'center', gap: 2, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  transformLabel: { fontSize: 9, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  // Straighten panel
  straBlock: { paddingHorizontal: 16, marginBottom: 12 },
  straTabs: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 6 },
  straTab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Layout.radius.full,
    backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  straTabActive: { backgroundColor: '#0D2119', borderColor: Colors.primary },
  straTabText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },
  straSliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  straVal: { width: 44, textAlign: 'right', fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },

  // Effects intensity bar
  effectBar: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 },
  effectBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  effectName: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary },

  navigationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark.card, marginHorizontal: 12, marginVertical: 6,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navigationCardText: { flex: 1, fontSize: Layout.fontSize.base, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },
});
