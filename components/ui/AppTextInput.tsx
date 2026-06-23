import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface AppTextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: string;
  style?: ViewStyle;
  returnKeyType?: 'done' | 'next' | 'go' | 'search';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
  autoComplete?: any;
}

export function AppTextInput({
  label, placeholder, value, onChangeText, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'sentences',
  error, disabled, multiline, numberOfLines, icon,
  style, returnKeyType, onSubmitEditing, inputRef, autoComplete,
}: AppTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={isFocused ? Colors.primary : Colors.text.muted}
            style={styles.icon}
          />
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines ?? 3 : 1}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            multiline && { height: (numberOfLines ?? 3) * 24, textAlignVertical: 'top' },
            disabled && { opacity: 0.5 },
          ]}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.text.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: Layout.fontSize.sm, fontFamily: 'Poppins_600SemiBold', color: Colors.text.primary },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.lg,
    borderWidth: 1.5, borderColor: Colors.dark.border, paddingHorizontal: 14,
  },
  inputContainerFocused: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}08` },
  inputContainerError: { borderColor: Colors.error },
  inputContainerDisabled: { opacity: 0.6 },
  icon: { marginRight: 8 },
  input: {
    flex: 1, paddingVertical: 14, fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular', color: Colors.text.primary,
  },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorText: { fontSize: Layout.fontSize.xs, fontFamily: 'Poppins_400Regular', color: Colors.error },
});
