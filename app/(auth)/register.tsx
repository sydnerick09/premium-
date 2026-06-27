import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput,
} from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from '@components/ui/SolidGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { validateEmail, validatePassword, validateName, validateConfirmPassword } from '../../utils/validators';
import { notify } from '../../utils/notify';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

// Defined OUTSIDE the screen component so the TextInput never remounts on re-render,
// which would cause the cursor/focus to disappear while typing.
function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, keyboardType = 'default' as any,
  autoCapitalize = 'sentences' as any, errorKey, icon,
  rightElement, errors, onClearError,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; secureTextEntry?: boolean; keyboardType?: any;
  autoCapitalize?: any; errorKey: string; icon: string;
  rightElement?: React.ReactNode;
  errors: Record<string, string | null>;
  onClearError: (key: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, errors[errorKey] ? styles.inputError : null]}>
        <Ionicons name={icon as any} size={20} color={Colors.text.muted} style={styles.icon} />
        <TextInput
          value={value}
          onChangeText={(t) => { onChangeText(t); onClearError(errorKey); }}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
          underlineColorAndroid="transparent"
        />
        {rightElement}
      </View>
      {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
    </View>
  );
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { register, socialSignIn, isLoading, clearError } = useAuthStore();

  const clearFieldError = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: null }));

  const validate = () => {
    const e = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) { haptic.error(); return; }
    try {
      await register(email.trim(), password, name.trim());
      haptic.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptic.error();
      notify('Registration Failed', e?.message ?? 'Please try again.');
    }
  };

  const handleSocial = async (provider: 'Google' | 'Facebook' | 'Apple') => {
    haptic.light();
    clearError();
    try {
      await socialSignIn(provider.toLowerCase() as 'google' | 'facebook' | 'apple');
      haptic.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptic.error();
      notify(`Sign up with ${provider}`, e?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0A2E', Colors.dark.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Erick and start editing like a pro</Text>

            <View style={styles.form}>
              <InputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                errorKey="name"
                icon="person-outline"
                errors={errors}
                onClearError={clearFieldError}
              />
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                errorKey="email"
                icon="mail-outline"
                errors={errors}
                onClearError={clearFieldError}
              />
              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                secureTextEntry={!showPassword}
                errorKey="password"
                icon="lock-closed-outline"
                errors={errors}
                onClearError={clearFieldError}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.text.muted}
                    />
                  </TouchableOpacity>
                }
              />
              <InputField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry
                errorKey="confirmPassword"
                icon="lock-closed-outline"
                errors={errors}
                onClearError={clearFieldError}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.button, isLoading && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Social sign-up */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity
              onPress={() => handleSocial('Google')}
              activeOpacity={0.85}
              style={styles.socialBtn}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialText}>Sign up with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSocial('Apple')}
              activeOpacity={0.85}
              style={styles.socialBtn}
            >
              <Ionicons name="logo-apple" size={20} color={Colors.text.primary} />
              <Text style={styles.socialText}>Sign up with Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSocial('Facebook')}
              activeOpacity={0.85}
              style={styles.socialBtn}
            >
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Text style={styles.socialText}>Sign up with Facebook</Text>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginLabel}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}> Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Text style={styles.terms}>
              By creating an account, you agree to our{' '}
              <Text
                style={{ color: Colors.primary }}
                onPress={() => router.push('/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: Colors.primary }}
                onPress={() => router.push('/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backButton: { marginTop: 16, marginBottom: 24, width: 40 },
  title: {
    fontSize: Layout.fontSize['4xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    marginBottom: 28,
    lineHeight: 22,
  },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: Layout.fontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.primary,
  },
  errorText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.error,
  },
  button: { borderRadius: Layout.radius.md, overflow: 'hidden', marginTop: 24 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: {
    fontSize: Layout.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.dark.border },
  dividerText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: Layout.radius.md,
    height: 52,
    marginTop: 12,
  },
  socialText: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginLabel: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.secondary,
  },
  loginLink: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
  },
  terms: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
