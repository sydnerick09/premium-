import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from '@components/ui/SolidGradient';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
  subLabel?: string;
}

export function LoadingOverlay({ visible, label = 'Processing...', subLabel }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <LinearGradient colors={Colors.gradients.primary} style={styles.iconBg}>
          <Text style={styles.sparkle}>✦</Text>
        </LinearGradient>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Text style={styles.label}>{label}</Text>
        {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.radius.xxl,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    minWidth: 200,
    borderWidth: 0.5,
    borderColor: Colors.dark.border,
  },
  iconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  sparkle: { fontSize: 28, color: Colors.white },
  spinner: { marginTop: 4 },
  label: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  subLabel: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
