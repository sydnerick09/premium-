import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEditorStore } from '../../store/editorStore';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type CreativeTab = 'text' | 'stickers' | 'frames' | 'drawing';

// ── Font catalog (Canva-style) ────────────────────────────────────────────────
const FONT_CATEGORIES = ['All', 'Serif', 'Sans-Serif', 'Script', 'Display', 'Mono', 'Handwriting', 'Decorative'];

const FONTS = [
  // Sans-Serif
  { name: 'Poppins',       family: 'Poppins_700Bold',          category: 'Sans-Serif',  preview: 'Aa' },
  { name: 'Inter',         family: 'Poppins_400Regular',       category: 'Sans-Serif',  preview: 'Aa' },
  { name: 'Roboto',        family: 'Poppins_500Medium',        category: 'Sans-Serif',  preview: 'Aa' },
  { name: 'Montserrat',    family: 'Poppins_700Bold',          category: 'Sans-Serif',  preview: 'Aa' },
  { name: 'Nunito',        family: 'Poppins_400Regular',       category: 'Sans-Serif',  preview: 'Aa' },
  { name: 'Open Sans',     family: 'Poppins_400Regular',       category: 'Sans-Serif',  preview: 'Aa' },
  // Serif
  { name: 'Georgia',       family: 'Poppins_400Regular',       category: 'Serif',       preview: 'Aa' },
  { name: 'Playfair',      family: 'Poppins_700Bold',          category: 'Serif',       preview: 'Aa' },
  { name: 'Merriweather',  family: 'Poppins_400Regular',       category: 'Serif',       preview: 'Aa' },
  { name: 'Lora',          family: 'Poppins_500Medium',        category: 'Serif',       preview: 'Aa' },
  { name: 'Cormorant',     family: 'Poppins_400Regular',       category: 'Serif',       preview: 'Aa' },
  // Script / Handwriting
  { name: 'Dancing Script', family: 'Poppins_400Regular',      category: 'Script',      preview: 'Aa' },
  { name: 'Pacifico',      family: 'Poppins_700Bold',          category: 'Script',      preview: 'Aa' },
  { name: 'Satisfy',       family: 'Poppins_400Regular',       category: 'Script',      preview: 'Aa' },
  { name: 'Caveat',        family: 'Poppins_400Regular',       category: 'Handwriting', preview: 'Aa' },
  { name: 'Kalam',         family: 'Poppins_400Regular',       category: 'Handwriting', preview: 'Aa' },
  { name: 'Patrick Hand',  family: 'Poppins_400Regular',       category: 'Handwriting', preview: 'Aa' },
  // Display
  { name: 'Bebas Neue',    family: 'Poppins_700Bold',          category: 'Display',     preview: 'AA' },
  { name: 'Oswald',        family: 'Poppins_700Bold',          category: 'Display',     preview: 'Aa' },
  { name: 'Raleway',       family: 'Poppins_500Medium',        category: 'Display',     preview: 'Aa' },
  { name: 'Fjalla One',    family: 'Poppins_700Bold',          category: 'Display',     preview: 'Aa' },
  { name: 'Anton',         family: 'Poppins_700Bold',          category: 'Display',     preview: 'AA' },
  // Mono
  { name: 'Space Mono',    family: 'Poppins_400Regular',       category: 'Mono',        preview: 'Aa' },
  { name: 'Courier New',   family: 'Poppins_400Regular',       category: 'Mono',        preview: 'Aa' },
  { name: 'Roboto Mono',   family: 'Poppins_400Regular',       category: 'Mono',        preview: 'Aa' },
  // Decorative
  { name: 'Lobster',       family: 'Poppins_700Bold',          category: 'Decorative',  preview: 'Aa' },
  { name: 'Righteous',     family: 'Poppins_700Bold',          category: 'Decorative',  preview: 'Aa' },
  { name: 'Boogaloo',      family: 'Poppins_400Regular',       category: 'Decorative',  preview: 'Aa' },
  { name: 'Fredoka One',   family: 'Poppins_700Bold',          category: 'Decorative',  preview: 'Aa' },
];

// ── Pen styles ────────────────────────────────────────────────────────────────
const PEN_STYLES = [
  { id: 'pen',       label: 'Pen',        icon: '🖊️', desc: 'Smooth ink line' },
  { id: 'marker',    label: 'Marker',     icon: '🖍️', desc: 'Bold strokes' },
  { id: 'brush',     label: 'Brush',      icon: '🖌️', desc: 'Watercolor feel' },
  { id: 'pencil',    label: 'Pencil',     icon: '✏️', desc: 'Rough sketch line' },
  { id: 'chalk',     label: 'Chalk',      icon: '🩵', desc: 'Chalky texture' },
  { id: 'neon',      label: 'Neon',       icon: '💥', desc: 'Glowing neon line' },
  { id: 'calligraphy', label: 'Calligraphy', icon: '📜', desc: 'Elegant thin/thick' },
  { id: 'spray',     label: 'Spray',      icon: '🎨', desc: 'Spray paint effect' },
];

const TEXT_COLORS = [
  '#FFFFFF','#000000','#7C3AED','#EC4899','#F59E0B',
  '#10B981','#EF4444','#3B82F6','#F97316','#06B6D4',
  '#8B5CF6','#D97706','#059669','#DC2626','#2563EB',
];

const TEXT_ALIGNS = [
  { id: 'left',   icon: 'text-outline'   },
  { id: 'center', icon: 'reorder-two-outline' },
  { id: 'right',  icon: 'text-outline'   },
];

const STICKER_CATEGORIES = ['Emoji','Hearts','Stars','Nature','Food','Sport','Fashion','Travel'];
const STICKERS: Record<string, string[]> = {
  Emoji:   ['😀','😍','🥰','😎','🤩','😂','🙌','🔥','✨','💫','🎉','🎊','😜','🤣','😇','🥳'],
  Hearts:  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💗','💓','💞','💝','💘','💟','🫀'],
  Stars:   ['⭐','🌟','💫','✨','🌠','🌌','🌃','🎇','🎆','☀️','🌙','⚡','🌈','☄️','🌤️','🌻'],
  Nature:  ['🌸','🌺','🌻','🌹','🌷','🌿','🍃','🍀','🌾','🌱','🌲','🌳','🍂','🍁','🌊','🏔️'],
  Food:    ['🍕','🍔','🍟','🌮','🌯','🥗','🍜','🍣','🍦','🍰','🎂','🧁','🍩','🍪','☕','🧋'],
  Sport:   ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🎯','🏆','🥇','🏄'],
  Fashion: ['👗','👠','👒','💄','💅','👜','💍','🕶️','🧣','🧤','🪭','🧢','👑','✨','💋','🎀'],
  Travel:  ['✈️','🚢','🏖️','🗺️','🏝️','🗼','🌍','🌏','🎡','🏕️','🚂','🎠','⛵','🚁','🌅','🗽'],
};

const FRAME_OPTIONS = [
  { id: 'none',     label: 'None',     color: 'transparent', bw: 0 },
  { id: 'white',    label: 'White',    color: '#FFFFFF',     bw: 8 },
  { id: 'black',    label: 'Black',    color: '#000000',     bw: 8 },
  { id: 'gold',     label: 'Gold',     color: '#F59E0B',     bw: 6 },
  { id: 'vintage',  label: 'Vintage',  color: '#8B4513',     bw: 10 },
  { id: 'purple',   label: 'Purple',   color: '#7C3AED',     bw: 6 },
  { id: 'polaroid', label: 'Polaroid', color: '#F5F5F0',     bw: 16 },
  { id: 'neon',     label: 'Neon',     color: '#00FF88',     bw: 4 },
  { id: 'rose',     label: 'Rose',     color: '#FB7185',     bw: 5 },
  { id: 'navy',     label: 'Navy',     color: '#1E3A5F',     bw: 7 },
  { id: 'rainbow',  label: 'Rainbow',  color: '#FF6B6B',     bw: 6 },
  { id: 'double',   label: 'Double',   color: '#FFFFFF',     bw: 12 },
];

const BRUSH_COLORS = ['#FFFFFF','#000000','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#FF8800','#8800FF'];
const BRUSH_SIZES = [2, 4, 8, 12, 20, 32];

export default function CreativeScreen() {
  const addTextOverlay = useEditorStore((s) => s.addTextOverlay);
  const [activeTab, setActiveTab] = useState<CreativeTab>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('Poppins');
  const [fontCategory, setFontCategory] = useState('All');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);
  const [textAlign, setTextAlign] = useState('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedPen, setSelectedPen] = useState('pen');
  const [stickerCategory, setStickerCategory] = useState('Emoji');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(8);

  const TABS: { id: CreativeTab; icon: string; label: string }[] = [
    { id: 'text',     icon: 'text-outline',    label: 'Text'     },
    { id: 'stickers', icon: 'happy-outline',   label: 'Stickers' },
    { id: 'frames',   icon: 'square-outline',  label: 'Frames'   },
    { id: 'drawing',  icon: 'brush-outline',   label: 'Draw'     },
  ];

  const filteredFonts = fontCategory === 'All' ? FONTS : FONTS.filter((f) => f.category === fontCategory);

  const renderContent = () => {
    switch (activeTab) {

      // ── TEXT ───────────────────────────────────────────────────
      case 'text':
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>

            {/* Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Text</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Type something…"
                  placeholderTextColor={Colors.text.muted}
                  style={[
                    styles.textInput,
                    isBold && { fontWeight: 'bold' },
                    isItalic && { fontStyle: 'italic' },
                    { fontSize, color: selectedTextColor, textAlign: textAlign as any },
                  ]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Style row: bold / italic / align */}
            <View style={styles.styleRow}>
              <TouchableOpacity onPress={() => setIsBold(!isBold)} style={[styles.styleBtn, isBold && styles.styleBtnActive]}>
                <Text style={[styles.styleBtnText, isBold && { color: Colors.primary }]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsItalic(!isItalic)} style={[styles.styleBtn, isItalic && styles.styleBtnActive]}>
                <Text style={[styles.styleBtnText, { fontStyle: 'italic' }, isItalic && { color: Colors.primary }]}>I</Text>
              </TouchableOpacity>
              {[['left','reorder-four-outline'],['center','reorder-two-outline'],['right','reorder-outline']].map(([align, icon]) => (
                <TouchableOpacity key={align} onPress={() => setTextAlign(align)} style={[styles.styleBtn, textAlign === align && styles.styleBtnActive]}>
                  <Ionicons name={icon as any} size={18} color={textAlign === align ? Colors.primary : Colors.text.muted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Font size */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Size</Text>
                <Text style={styles.sectionValue}>{fontSize}px</Text>
              </View>
              <View style={styles.sizeRow}>
                <TouchableOpacity onPress={() => setFontSize((s) => Math.max(10, s - 2))} style={styles.sizeBtn}>
                  <Ionicons name="remove" size={18} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.sizeTrack}>
                  <View style={[styles.sizeFill, { width: `${((fontSize - 10) / 90) * 100}%` as any }]} />
                </View>
                <TouchableOpacity onPress={() => setFontSize((s) => Math.min(100, s + 2))} style={styles.sizeBtn}>
                  <Ionicons name="add" size={18} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Text color */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { haptic.light(); setSelectedTextColor(c); }}
                    style={[styles.colorDot, { backgroundColor: c }, selectedTextColor === c && styles.colorDotActive]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Font category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Font Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                {FONT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFontCategory(cat)}
                    style={[styles.catChip, fontCategory === cat && styles.catChipActive]}
                  >
                    <Text style={[styles.catChipText, fontCategory === cat && { color: Colors.primary }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Font list */}
              <View style={styles.fontGrid}>
                {filteredFonts.map((f) => (
                  <TouchableOpacity
                    key={f.name}
                    onPress={() => { haptic.light(); setSelectedFont(f.name); }}
                    style={[styles.fontCard, selectedFont === f.name && styles.fontCardActive]}
                  >
                    <Text style={[styles.fontPreview, selectedFont === f.name && { color: Colors.primary }]}>
                      {f.preview}
                    </Text>
                    <Text style={[styles.fontName, selectedFont === f.name && { color: Colors.primary }]}>
                      {f.name}
                    </Text>
                    <Text style={styles.fontCategory}>{f.category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Add to photo */}
            <TouchableOpacity
              onPress={() => {
                if (!textInput.trim()) return;
                haptic.success();
                addTextOverlay({
                  content: textInput.trim(),
                  color: selectedTextColor,
                  fontSize,
                  align: textAlign as 'left' | 'center' | 'right',
                  bold: isBold,
                  italic: isItalic,
                  x: 0.3,
                  y: 0.4,
                });
                router.back();
              }}
              disabled={!textInput.trim()}
              style={[styles.addBtn, !textInput.trim() && { opacity: 0.4 }]}
            >
              <LinearGradient colors={Colors.gradients.primary} style={styles.addBtnGradient}>
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addBtnText}>Add Text to Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.helperNote}>
              Tip: After adding, drag the text on your photo to reposition. Long-press it to remove.
            </Text>
          </ScrollView>
        );

      // ── STICKERS ───────────────────────────────────────────────
      case 'stickers':
        return (
          <View style={{ flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {STICKER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setStickerCategory(cat)}
                  style={[styles.catChip, stickerCategory === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, stickerCategory === cat && { color: Colors.primary }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              data={STICKERS[stickerCategory]}
              numColumns={8}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.stickerGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    haptic.success();
                    addTextOverlay({
                      content: item,
                      color: '#FFFFFF',
                      fontSize: 56,
                      align: 'center',
                      bold: false,
                      italic: false,
                      x: 0.35,
                      y: 0.4,
                    });
                    router.back();
                  }}
                  style={styles.stickerItem}
                >
                  <Text style={styles.stickerText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        );

      // ── FRAMES ─────────────────────────────────────────────────
      case 'frames':
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            <Text style={styles.sectionTitle}>Frames & Borders</Text>
            <View style={styles.frameGrid}>
              {FRAME_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => { haptic.light(); setSelectedFrame(f.id); }}
                  style={[styles.frameItem, selectedFrame === f.id && styles.frameItemActive]}
                >
                  <View style={[styles.framePreview, { borderColor: f.color, borderWidth: f.id === 'none' ? 0 : 3 }]}>
                    {f.id === 'none' && <Ionicons name="close" size={20} color={Colors.text.muted} />}
                  </View>
                  <Text style={[styles.frameLabel, selectedFrame === f.id && { color: Colors.primary }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => { haptic.success(); router.back(); }} style={[styles.addBtn, { marginTop: 8 }]} disabled={selectedFrame === 'none'}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.addBtnGradient}>
                <Text style={styles.addBtnText}>Apply Frame</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        );

      // ── DRAWING ────────────────────────────────────────────────
      case 'drawing':
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            {/* Pen styles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pen Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PEN_STYLES.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => { haptic.light(); setSelectedPen(p.id); }}
                    style={[styles.penCard, selectedPen === p.id && styles.penCardActive]}
                  >
                    <Text style={{ fontSize: 22 }}>{p.icon}</Text>
                    <Text style={[styles.penLabel, selectedPen === p.id && { color: Colors.primary }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Brush color */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.colorRow}>
                {BRUSH_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { haptic.light(); setBrushColor(c); }}
                    style={[styles.colorDot, { backgroundColor: c }, brushColor === c && styles.colorDotActive]}
                  />
                ))}
              </View>
            </View>

            {/* Brush size */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Brush Size</Text>
              <View style={styles.brushSizeRow}>
                {BRUSH_SIZES.map((s) => (
                  <TouchableOpacity key={s} onPress={() => { haptic.light(); setBrushSize(s); }} style={[styles.brushSizeItem, brushSize === s && styles.brushSizeItemActive]}>
                    <View style={[styles.brushDot, { width: Math.min(s, 24), height: Math.min(s, 24), backgroundColor: brushColor }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Canvas */}
            <View style={styles.drawingCanvas}>
              <Text style={{ fontSize: 40 }}>✏️</Text>
              <Text style={styles.drawingHint}>Touch here to draw on your photo</Text>
            </View>

            <TouchableOpacity onPress={() => { haptic.success(); router.back(); }} style={styles.addBtn}>
              <LinearGradient colors={Colors.gradients.primary} style={styles.addBtnGradient}>
                <Text style={styles.addBtnText}>Apply Drawing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <LinearGradient colors={['#8B5CF6','#EC4899']} style={styles.headerIcon}>
              <Ionicons name="text" size={16} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Creative</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => { haptic.selection(); setActiveTab(tab.id); }}
              style={[styles.tabBarItem, activeTab === tab.id && styles.tabBarItemActive]}
            >
              <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.id ? Colors.primary : Colors.text.muted} />
              <Text style={[styles.tabBarLabel, activeTab === tab.id && { color: Colors.primary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border },
  tabBarItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabBarItemActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabBarLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.muted },
  tabContent: { padding: 16, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionValue: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },

  textInputContainer: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, borderWidth: 0.5, borderColor: Colors.dark.border },
  textInput: { padding: 14, minHeight: 80, textAlignVertical: 'top' },

  styleRow: { flexDirection: 'row', gap: 8, marginTop: -8 },
  styleBtn: { width: 40, height: 40, borderRadius: Layout.radius.md, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.dark.border },
  styleBtnActive: { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  styleBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.secondary },

  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sizeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  sizeTrack: { flex: 1, height: 4, backgroundColor: Colors.dark.border, borderRadius: 2, overflow: 'hidden' },
  sizeFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  colorDotActive: { borderWidth: 3, borderColor: Colors.white },

  catRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Layout.radius.full, backgroundColor: Colors.dark.card, borderWidth: 0.5, borderColor: Colors.dark.border },
  catChipActive: { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  catChipText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  fontGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fontCard: {
    width: (Layout.window.width - 56) / 3,
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    padding: 10, alignItems: 'center', gap: 2,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  fontCardActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}14` },
  fontPreview: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  fontName: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: Colors.text.secondary, textAlign: 'center' },
  fontCategory: { fontSize: 8, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },

  addBtn: { borderRadius: Layout.radius.md, overflow: 'hidden' },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  helperNote: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center', marginTop: 10, lineHeight: 16 },

  stickerGrid: { paddingHorizontal: 12, paddingBottom: 40 },
  stickerItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  stickerText: { fontSize: 28 },

  frameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  frameItem: { width: '22%', alignItems: 'center', gap: 6 },
  frameItemActive: {},
  framePreview: { width: 56, height: 56, borderRadius: Layout.radius.sm, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  frameLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary, textAlign: 'center' },

  penCard: { backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, padding: 10, alignItems: 'center', gap: 4, minWidth: 68, borderWidth: 0.5, borderColor: Colors.dark.border },
  penCardActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}14` },
  penLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },

  brushSizeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  brushSizeItem: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.dark.border },
  brushSizeItemActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  brushDot: { borderRadius: 50 },
  drawingCanvas: { height: 160, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.xl, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 0.5, borderColor: Colors.dark.border },
  drawingHint: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
});
