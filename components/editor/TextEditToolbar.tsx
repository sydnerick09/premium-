import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextOverlay } from '../../store/editorStore';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { haptic } from '../../utils/haptics';

// On-canvas text editor toolbar — mirrors the reference layout:
// [ Keyboard · Font · Color · Edit · Curve ] with TEXT/LABEL/BORDER + swatches.
// Only existing capabilities are wired; Gradient/Curve are shown as "Soon" so the
// layout matches without adding new features.

type Tab = 'keyboard' | 'font' | 'color' | 'edit' | 'curve';
type ColorTarget = 'text' | 'label' | 'border';

// Display names mapped to the Poppins families the app actually loads.
const FONTS: { label: string; family: string }[] = [
  { label: 'Regular',  family: 'Poppins_400Regular' },
  { label: 'Medium',   family: 'Poppins_500Medium' },
  { label: 'SemiBold', family: 'Poppins_600SemiBold' },
  { label: 'Bold',     family: 'Poppins_700Bold' },
];

const SWATCHES = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FACC15',
  '#22C55E', '#10B981', '#06B6D4', '#3B82F6', '#7C3AED', '#EC4899',
  '#8B5CF6', '#DC2626', '#059669', '#1E3A5F',
];

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'keyboard', icon: 'create-outline',     label: 'Keyboard' },
  { id: 'font',     icon: 'text',               label: 'Font' },
  { id: 'color',    icon: 'color-palette',      label: 'Color' },
  { id: 'edit',     icon: 'options',            label: 'Edit' },
  { id: 'curve',    icon: 'analytics-outline',  label: 'Curve' },
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
  const [tab, setTab] = useState<Tab>('color');
  const [colorTarget, setColorTarget] = useState<ColorTarget>('text');

  // Resolve the currently-active color + the setter for the selected target.
  const currentColor =
    colorTarget === 'text'
      ? overlay.color
      : overlay.bubbleColor ?? '#FFFFFF';

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
            {FONTS.map((f) => {
              const active = (overlay.fontFamily ?? 'Poppins_400Regular') === f.family;
              return (
                <TouchableOpacity
                  key={f.family}
                  onPress={() => { haptic.light(); onChange({ fontFamily: f.family }); }}
                  style={[styles.fontChip, active && styles.fontChipActive]}
                >
                  <Text style={[styles.fontPreview, { fontFamily: f.family }, active && { color: Colors.primary }]}>Ag</Text>
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
                  style={styles.segmentBtn}
                >
                  <Text style={[styles.segmentText, colorTarget === t && styles.segmentTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* COLOR | GRADIENT */}
            <View style={styles.subRow}>
              <Text style={styles.subActive}>COLOR</Text>
              <Text style={styles.subDisabled}>GRADIENT</Text>
              <View style={styles.soonTag}><Text style={styles.soonText}>SOON</Text></View>
            </View>

            {/* Swatches (eyedropper + optional "none" for label/border) */}
            <View style={styles.swatchRow}>
              <View style={styles.eyedropper}>
                <Ionicons name="eyedrop-outline" size={18} color={Colors.text.muted} />
              </View>
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
                    style={[styles.swatch, { backgroundColor: c }, currentColor === c && styles.swatchActive]}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {tab === 'edit' && (
          <View style={styles.editPanel}>
            {/* Size */}
            <View style={styles.sizeRow}>
              <Text style={styles.editLabel}>Size</Text>
              <TouchableOpacity
                onPress={() => onChange({ fontSize: Math.max(10, overlay.fontSize - 2) })}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.sizeVal}>{Math.round(overlay.fontSize)}</Text>
              <TouchableOpacity
                onPress={() => onChange({ fontSize: Math.min(160, overlay.fontSize + 2) })}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={18} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Style + align */}
            <View style={styles.styleRow}>
              <TouchableOpacity onPress={() => onChange({ bold: !overlay.bold })} style={[styles.styleBtn, overlay.bold && styles.styleBtnActive]}>
                <Text style={[styles.styleBtnText, overlay.bold && { color: Colors.primary }]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onChange({ italic: !overlay.italic })} style={[styles.styleBtn, overlay.italic && styles.styleBtnActive]}>
                <Text style={[styles.styleBtnText, { fontStyle: 'italic' }, overlay.italic && { color: Colors.primary }]}>I</Text>
              </TouchableOpacity>
              {(['left', 'center', 'right'] as const).map((a) => (
                <TouchableOpacity key={a} onPress={() => onChange({ align: a })} style={[styles.styleBtn, overlay.align === a && styles.styleBtnActive]}>
                  <Ionicons
                    name={(a === 'left' ? 'reorder-four-outline' : a === 'center' ? 'reorder-two-outline' : 'reorder-outline') as any}
                    size={18}
                    color={overlay.align === a ? Colors.primary : Colors.text.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === 'curve' && (
          <View style={styles.soonPanel}>
            <Ionicons name="analytics-outline" size={26} color={Colors.text.muted} />
            <Text style={styles.soonPanelText}>Curved / arc text — coming soon</Text>
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

  panel: { minHeight: 96, justifyContent: 'center', paddingVertical: 12 },

  // Keyboard
  kbPanel: { paddingHorizontal: 16 },
  input: {
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 0.5, borderColor: Colors.dark.border,
    color: Colors.text.primary, fontFamily: 'Poppins_500Medium', fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top',
  },

  // Font
  rowPad: { gap: 10, paddingHorizontal: 16 },
  fontChip: {
    width: 64, height: 64, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  fontChipActive: { borderColor: Colors.primary, backgroundColor: '#0C1915' },
  fontPreview: { fontSize: 20, color: Colors.text.primary },
  fontLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },

  // Color
  segment: {
    flexDirection: 'row', alignSelf: 'center', backgroundColor: Colors.dark.card,
    borderRadius: 999, padding: 3, marginBottom: 10,
  },
  segmentBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 999 },
  segmentText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, letterSpacing: 0.5 },
  segmentTextActive: { color: Colors.primary },

  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 },
  subActive: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  subDisabled: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, letterSpacing: 0.5 },
  soonTag: { backgroundColor: Colors.dark.card, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  soonText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.text.muted },

  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  eyedropper: {
    width: 40, height: 40, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    borderWidth: 0.5, borderColor: Colors.dark.border, alignItems: 'center', justifyContent: 'center',
  },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.primary },
  swatchNone: { backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', borderColor: Colors.dark.border },

  // Edit
  editPanel: { paddingHorizontal: 16, gap: 14 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editLabel: { flex: 1, fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  stepBtn: {
    width: 36, height: 36, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
  },
  sizeVal: { minWidth: 34, textAlign: 'center', fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  styleRow: { flexDirection: 'row', gap: 8 },
  styleBtn: {
    flex: 1, height: 40, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card,
    alignItems: 'center', justifyContent: 'center',
  },
  styleBtnActive: { backgroundColor: '#0C1915', borderWidth: 1, borderColor: Colors.primary },
  styleBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.muted },

  // Curve / soon
  soonPanel: { alignItems: 'center', gap: 8 },
  soonPanelText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },

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
  tabLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
});
