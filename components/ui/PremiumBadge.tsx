import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function PremiumBadge({ size = 'sm', style }: PremiumBadgeProps) {
  return (
    <LinearGradient
      colors={Colors.gradients.gold}
      style={[styles.badge, size === 'md' && styles.badgeMd, style]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd]}>PRO</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeMd: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  text: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: Colors.dark.background },
  textMd: { fontSize: 11 },
});
