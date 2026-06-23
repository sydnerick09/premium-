import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'overline';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface AppTextProps {
  children: React.ReactNode;
  variant?: Variant;
  weight?: Weight;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  onPress?: () => void;
}

const FONT_FAMILIES: Record<Weight, string> = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const VARIANT_DEFAULTS: Record<Variant, { size: number; weight: Weight; color: string }> = {
  h1: { size: Layout.fontSize['3xl'], weight: 'bold', color: Colors.text.primary },
  h2: { size: Layout.fontSize['2xl'], weight: 'bold', color: Colors.text.primary },
  h3: { size: Layout.fontSize.xl, weight: 'semibold', color: Colors.text.primary },
  body: { size: Layout.fontSize.base, weight: 'regular', color: Colors.text.secondary },
  bodySmall: { size: Layout.fontSize.sm, weight: 'regular', color: Colors.text.secondary },
  caption: { size: Layout.fontSize.xs, weight: 'regular', color: Colors.text.muted },
  label: { size: Layout.fontSize.sm, weight: 'semibold', color: Colors.text.primary },
  overline: { size: Layout.fontSize.xs, weight: 'medium', color: Colors.text.muted },
};

export function AppText({ children, variant = 'body', weight, color, style, numberOfLines, onPress }: AppTextProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const resolvedWeight = weight ?? defaults.weight;
  const resolvedColor = color ?? defaults.color;

  return (
    <Text
      style={[
        {
          fontFamily: FONT_FAMILIES[resolvedWeight],
          fontSize: defaults.size,
          color: resolvedColor,
          letterSpacing: variant === 'overline' ? 1 : 0,
          textTransform: variant === 'overline' ? 'uppercase' : undefined,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      onPress={onPress}
    >
      {children}
    </Text>
  );
}
