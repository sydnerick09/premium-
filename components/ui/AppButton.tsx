import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function AppButton({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, textStyle, fullWidth,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingHorizontal: 14, paddingVertical: 8, fontSize: Layout.fontSize.sm, borderRadius: Layout.radius.md },
    md: { paddingHorizontal: 20, paddingVertical: 13, fontSize: Layout.fontSize.base, borderRadius: Layout.radius.lg },
    lg: { paddingHorizontal: 28, paddingVertical: 16, fontSize: Layout.fontSize.lg, borderRadius: Layout.radius.xl },
  }[size];

  const content = (
    <>
      {loading
        ? <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white} />
        : icon}
      <Text style={[
        styles.label,
        { fontSize: sizeStyles.fontSize },
        variant === 'outline' || variant === 'ghost' ? { color: variant === 'danger' ? Colors.error : Colors.primary } : { color: Colors.white },
        variant === 'danger' && variant !== 'outline' && { color: Colors.white },
        textStyle,
      ]}>
        {label}
      </Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, { borderRadius: sizeStyles.borderRadius }, fullWidth && { width: '100%' }, isDisabled && styles.disabled, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Colors.gradients.primary}
          style={[styles.gradient, { paddingHorizontal: sizeStyles.paddingHorizontal, paddingVertical: sizeStyles.paddingVertical, borderRadius: sizeStyles.borderRadius }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.base,
          { paddingHorizontal: sizeStyles.paddingHorizontal, paddingVertical: sizeStyles.paddingVertical, borderRadius: sizeStyles.borderRadius },
          { backgroundColor: Colors.error },
          fullWidth && { width: '100%' },
          isDisabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  const bgColor = {
    secondary: Colors.dark.card,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant] ?? Colors.dark.card;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          backgroundColor: bgColor,
        },
        variant === 'outline' && { borderWidth: 1.5, borderColor: Colors.primary },
        fullWidth && { width: '100%' },
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontFamily: 'Poppins_600SemiBold' },
  disabled: { opacity: 0.5 },
});
