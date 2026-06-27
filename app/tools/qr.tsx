import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

function loadImg(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new (window as any).Image();
    i.onload = () => resolve(i); i.onerror = reject; i.src = uri;
  });
}

export default function QrScannerScreen() {
  const [src, setSrc] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isUrl = result ? /^https?:\/\//i.test(result) : false;

  const scan = async (camera: boolean) => {
    setResult(null); setError(null);
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    const uri = res.assets[0].uri;
    setSrc(uri);
    haptic.light();

    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      setError('QR scanning needs a supported browser (Chrome / Android). Try the web app.');
      return;
    }
    setBusy(true);
    try {
      const Det = (window as any).BarcodeDetector;
      const det = new Det({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'data_matrix'] });
      const img = await loadImg(uri);
      const codes = await det.detect(img);
      if (codes?.length) { haptic.success(); setResult(codes[0].rawValue); }
      else setError('No code found. Make sure the QR/barcode is clear and centered.');
    } catch {
      setError('Could not scan that image. Try a clearer photo.');
    } finally { setBusy(false); }
  };

  const copy = async () => {
    if (!result) return;
    try {
      if (Platform.OS === 'web' && (navigator as any)?.clipboard) await (navigator as any).clipboard.writeText(result);
      haptic.success();
    } catch {}
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>QR Scanner</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <View style={styles.preview}>
        {src ? <Image source={{ uri: src }} style={styles.previewImg} resizeMode="contain" /> : (
          <View style={styles.empty}>
            <Ionicons name="qr-code-outline" size={54} color={Colors.text.muted} />
            <Text style={styles.emptyText}>Scan a QR or barcode from a photo</Text>
          </View>
        )}
        {busy && <View style={styles.dot} />}
      </View>

      {(result || error) && (
        <View style={styles.resultBox}>
          {result ? (
            <>
              <Text style={styles.resultLabel}>Result</Text>
              <Text style={styles.resultText} numberOfLines={4}>{result}</Text>
              <View style={styles.resultActions}>
                {isUrl && (
                  <TouchableOpacity onPress={() => Platform.OS === 'web' ? window.open(result!, '_blank') : Linking.openURL(result!)} style={styles.smallBtn}>
                    <Ionicons name="open-outline" size={16} color={Colors.primary} />
                    <Text style={styles.smallBtnText}>Open</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={copy} style={styles.smallBtn}>
                  <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                  <Text style={styles.smallBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity onPress={() => scan(true)} style={styles.iconBtn}>
          <Ionicons name="camera-outline" size={22} color={Colors.text.primary} />
          <Text style={styles.iconBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => scan(false)} style={styles.cta}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.ctaGradient}>
            <Ionicons name="scan-outline" size={18} color={Colors.white} />
            <Text style={styles.ctaText}>Scan from photo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: Layout.fontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  preview: { flex: 1, margin: 16, borderRadius: Layout.radius.xl, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', gap: 10 },
  emptyText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted },
  dot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  resultBox: { marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md, borderWidth: 0.5, borderColor: Colors.dark.border },
  resultLabel: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_600SemiBold', color: Colors.text.muted, marginBottom: 4 },
  resultText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_500Medium', color: Colors.text.primary },
  resultActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  smallBtnText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
  errorText: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.secondary, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: Colors.dark.border },
  iconBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  iconBtnText: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: Colors.text.secondary },
  cta: { flex: 1, borderRadius: Layout.radius.md, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  ctaText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_700Bold', color: Colors.white },
});
