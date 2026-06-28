import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextOverlay } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { haptic } from '../../utils/haptics';
import { EDITOR_FONTS, ensureEditorFonts } from '../../utils/editorFonts';
import AppSlider from '../AppSlider';

// On-canvas text editor toolbar: [ Keyboard · Font · Color · Edit · Curve ].
type Tab = 'keyboard' | 'font' | 'color' | 'edit' | 'curve';
type ColorTarget = 'text' | 'label' | 'border';

const SWATCHES = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FACC15',
  '#22C55E', '#10B981', '#06B6D4', '#3B82F6', '#7C3AED', '#EC4899',
  '#8B5CF6', '#DC2626', '#059669', '#1E3A5F',
];

const TABS: { id: Tab; icon: string; label: string; pro?: boolean }[] = [
  { id: 'keyboard', icon: 'create-outline',        label: 'Keyboard' },
  { id: 'font',     icon: 'text-outline',          label: 'Font' },
  { id: 'color',    icon: 'color-palette-outline', label: 'Color' },
  { id: 'edit',     icon: 'options-outline',       label: 'Edit' },
  { id: 'curve',    icon: 'sparkles-outline',      label: 'Curve', pro: true },
];

const FILLED_BUBBLE = (b?: TextOverlay['bubble']) =>
  b === 'speech' || b === 'thought' || b === 'pill' || b === 'box';

interface Props {
  overlay: TextOverlay;
  onChange: (patch: Partial<Omit<TextOverlay, 'id'>>) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function TextEditToolbar({ overlay, onChange, onClose, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('keyboard');
  const [colorTarget, setColorTarget] = useState<ColorTarget>('text');
  const isPremium = useAuthStore((s) => s.user?.isPremium ?? false);

  useEffect(() => { ensureEditorFonts(); }, []);

  const goPremium = () => { haptic.light(); router.push('/premium'); };

  // ── Colour helpers (TEXT / LABEL / BORDER) ──────────────────
  const currentColor = colorTarget === 'text' ? overlay.color : overlay.bubbleColor ?? '#FFFFFF';

  const pickColor = (c: string) => {
    haptic.light();
    if (colorTarget === 'text') onChange({ color: c });
    else if (colorTarget === 'label') {
      onChange({ bubble: FILLED_BUBBLE(overlay.bubble) ? overlay.bubble : 'box', bubbleColor: c });
    } else {
      onChange({ bubble: 'outline', bubbleColor: c });
    }
  };

  const clearBackground = () => { haptic.light(); onChange({ bubble: 'none' }); };

  // Eyedropper: pick any colour on screen (browser EyeDropper API).
  const pickFromImage = async () => {
    haptic.light();
    const ED = (typeof window !== 'undefined' ? (window as any).EyeDropper : null);
    if (Platform.OS === 'web' && typeof ED === 'function') {
      try {
        const { sRGBHex } = await new ED().open();
        if (sRGBHex) pickColor(sRGBHex);
      } catch { /* cancelled */ }
    }
  };
  const eyedropperSupported = Platform.OS === 'web' && typeof window !== 'undefined' && typeof (window as any).EyeDropper === 'function';

  const selectFont = (family: string, pro: boolean) => {
    if (pro && !isPremium) { goPremium(); return; }
    haptic.light();
    onChange({ fontFamily: family });
  };

  return (
    <View style={styles.wrap}>
      {/* ── Active panel ─────────────────────────────────────────── */}
      <View style={styles.panel}>
        {tab === 'keyboard' && (
          <View style={styles.kbPanel}>
            <TextInput
              value={overlay.content}
              onChangeText={(t) => onChange({ content: t })}
              placeholder="Type something…"
              placeholderTextColor={Colors.text.muted}
              style={styles.input}
              multiline
              autoFocus
            />
          </View>
        )}

        {tab === 'font' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowPad}>
            {EDITOR_FONTS.map((f) => {
              const active = (overlay.fontFamily ?? 'Poppins_600SemiBold') === f.family;
              const locked = f.pro && !isPremium;
              return (
                <TouchableOpacity
                  key={f.family}
                  onPress={() => selectFont(f.family, f.pro)}
                  style={[styles.fontChip, active && styles.fontChipActive]}
                >
                  {f.pro && (
                    <View style={styles.proTag}><Text style={styles.proTagText}>PRO</Text></View>
                  )}
                  <Text style={[styles.fontPreview, { fontFamily: f.family }, active && { color: Colors.primary }, locked && { opacity: 0.6 }]}>Ag</Text>
                  <Text style={[styles.fontLabel, active && { color: Colors.primary }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {tab === 'color' && (
          <View>
            {/* TEXT / LABEL / BORDER */}
            <View style={styles.segment}>
              {(['text', 'label', 'border'] as ColorTarget[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { haptic.selection(); setColorTarget(t); }}
                  style={[styles.segmentBtn, colorTarget === t && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, colorTarget === t && styles.segmentTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Swatches + eyedropper ("Match") + a "None" chip for label/border */}
            <View style={styles.swatchRow}>
              {eyedropperSupported && (
                <TouchableOpacity onPress={pickFromImage} style={styles.matchBtn}>
                  <Ionicons name="color-wand-outline" size={18} color={Colors.primary} />
                  <Text style={styles.matchText}>Match</Text>
                </TouchableOpacity>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                {colorTarget !== 'text' && (
                  <TouchableOpacity onPress={clearBackground} style={[styles.swatch, styles.swatchNone]}>
                    <Ionicons name="ban-outline" size={16} color={Colors.text.muted} />
                  </TouchableOpacity>
                )}
                {SWATCHES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => pickColor(c)}
                    style={[styles.swatch, { backgroundColor: c }, currentColor?.toLowerCase() === c.toLowerCase() && styles.swatchActive]}
                  />
                ))}
              </ScrollView>
            </View>
            <Text style={styles.helpLine}>
              {colorTarget === 'text' ? 'Colour of the letters.'
                : colorTarget === 'label' ? 'Solid background behind the text.'
                : 'Outline around the text.'}
              {eyedropperSupported ? '  ·  Tap “Match” to pick any colour from the image.' : ''}
            </Text>
          </View>
        )}

        {tab === 'edit' && (
          <View style={styles.editPanel}>
            {/* Size — drag the slider (or pinch the text on the canvas) */}
            <View style={styles.editBlock}>
              <View style={styles.editHeaderRow}>
                <Text style={styles.editLabel}>Size</Text>
                <Text style={styles.editValue}>{Math.round(overlay.fontSize)}</Text>
              </View>
              <AppSlider
                style={{ width: '100%', height: 32 }}
                minimumValue={10}
                maximumValue={160}
                step={1}
                value={overlay.fontSize}
                onValueChange={(v) => onChange({ fontSize: v })}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.dark.border}
                thumbTintColor={Colors.white}
              />
              <Text style={styles.helpLine}>Tip: pinch the text with two fingers to resize it.</Text>
            </View>

            {/* Style */}
            <View style={styles.editBlock}>
              <Text style={styles.editLabel}>Style</Text>
              <View style={styles.styleRow}>
                <TouchableOpacity onPress={() => onChange({ bold: !overlay.bold })} style={[styles.styleBtn, overlay.bold && styles.styleBtnActive]}>
                  <Text style={[styles.styleBtnText, overlay.bold && { color: Colors.primary }]}>B</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onChange({ italic: !overlay.italic })} style={[styles.styleBtn, overlay.italic && styles.styleBtnActive]}>
                  <Text style={[styles.styleBtnText, { fontStyle: 'italic' }, overlay.italic && { color: Colors.primary }]}>I</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Alignment */}
            <View style={styles.editBlock}>
              <Text style={styles.editLabel}>Alignment</Text>
              <View style={styles.styleRow}>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <TouchableOpacity key={a} onPress={() => onChange({ align: a })} style={[styles.styleBtn, overlay.align === a && styles.styleBtnActive]}>
                    <Ionicons
                      name={(a === 'left' ? 'reorder-four-outline' : a === 'center' ? 'reorder-two-outline' : 'reorder-outline') as any}
                      size={18}
                      color={overlay.align === a ? Colors.primary : Colors.text.muted}
                    />
                    <Text style={[styles.alignLabel, overlay.align === a && { color: Colors.primary }]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {tab === 'curve' && (
          <View style={styles.curvePanel}>
            <Ionicons name="sparkles-outline" size={26} color={Colors.premium} />
            <Text style={styles.curveTitle}>Curved & arc text</Text>
            <Text style={styles.curveDesc}>Bend your text along a curve — a Premium feature.</Text>
            <TouchableOpacity onPress={goPremium} style={styles.unlockBtn}>
              <Ionicons name="diamond" size={14} color={Colors.white} />
              <Text style={styles.unlockText}>{isPremium ? 'Coming soon' : 'Unlock with Pro'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={onDelete} style={styles.edgeBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity key={t.id} onPress={() => { haptic.selection(); setTab(t.id); }} style={styles.tabBtn}>
                {t.pro && <View style={styles.tabProDot} />}
                <Ionicons name={t.icon as any} size={22} color={active ? Colors.primary : Colors.text.muted} />
                <Text style={[styles.tabLabel, active && { color: Colors.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.edgeBtn}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.dark.surface, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  panel: { minHeight: 110, justifyContent: 'center', paddingVertical: 12 },

  // Keyboard
  kbPanel: { paddingHorizontal: 16 },
  input: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 0.5, borderColor: Colors.dark.border,
    color: Colors.text.primary, fontFamily: 'Poppins_500Medium', fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 76, textAlignVertical: 'top',
  },

  // Font
  rowPad: { gap: 10, paddingHorizontal: 16 },
  fontChip: {
    width: 66, height: 70, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  fontChipActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  fontPreview: { fontSize: 22, color: Colors.text.primary },
  fontLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  proTag: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.premium, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  proTagText: { fontSize: 7, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },

  // Color
  segment: {
    flexDirection: 'row', alignSelf: 'center', backgroundColor: Colors.dark.card,
    borderRadius: 999, padding: 3, marginBottom: 12,
  },
  segmentBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: '#0C1915' },
  segmentText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, letterSpacing: 0.5 },
  segmentTextActive: { color: Colors.primary },

  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  matchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 40, paddingHorizontal: 10, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    borderWidth: 1, borderColor: Colors.primary,
  },
  matchText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.primary },
  swatchNone: { backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', borderColor: Colors.dark.border },
  helpLine: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, paddingHorizontal: 16, marginTop: 8 },

  // Edit
  editPanel: { paddingHorizontal: 16, gap: 14 },
  editBlock: { gap: 6 },
  editHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  editValue: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  styleRow: { flexDirection: 'row', gap: 8 },
  styleBtn: {
    flex: 1, height: 42, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  styleBtnActive: { backgroundColor: '#0C1915', borderWidth: 1, borderColor: Colors.primary },
  styleBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.muted },
  alignLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: Colors.text.muted, textTransform: 'capitalize' },

  // Curve (premium)
  curvePanel: { alignItems: 'center', gap: 6, paddingHorizontal: 24 },
  curveTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  curveDesc: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center' },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: Colors.premium, borderRadius: Layout.radius.md, paddingHorizontal: 16, paddingVertical: 9,
  },
  unlockText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },

  // Tab bar
  tabBar: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8,
  },
  edgeBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  doneCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  tabs: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tabBtn: { alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  tabProDot: { position: 'absolute', top: -2, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.premium },
  tabLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
});
