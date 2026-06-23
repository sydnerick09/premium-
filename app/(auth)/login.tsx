import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { validateEmail, validatePassword } from '../../utils/validators';
import { haptic } from '../../utils/haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { signIn, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    clearError();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) {
      haptic.error();
      return;
    }

    try {
      await signIn(email.trim(), password);
      haptic.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptic.error();
      Alert.alert('Sign In Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0A2E', Colors.dark.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
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
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Text style={styles.logoIcon}>✦</Text>
              </LinearGradient>
              <Text style={styles.appName}>Erick</Text>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subtitleText}>
                Sign in to continue editing your photos
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={Colors.text.muted}
                    style={styles.inputIcon}
                  />
                  <_TextInput
                    value={email}
                    onChangeText={(t) => { setEmail(t); setEmailError(null); }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.text.muted}
                    style={styles.inputIcon}
                  />
                  <_TextInput
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(null); }}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.text.muted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

              {/* Forgot password */}
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </Link>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
                style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={Colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInGradient}
                >
                  <Text style={styles.signInText}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerLabel}>Don't have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}> Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Terms note */}
            <Text style={styles.termsNote}>
              By signing in, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/terms')}>Terms of Service</Text> &{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Minimal native TextInput wrapper to avoid JSX import clutter
import { TextInput } from 'react-native';
const _TextInput = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    placeholderTextColor={Colors.text.muted}
    style={[styles.nativeInput, props.style]}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: { fontSize: 32, color: Colors.white },
  appName: {
    fontSize: Layout.fontSize['4xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    letterSpacing: 4,
  },
  welcomeText: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginTop: 20,
  },
  subtitleText: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 6,
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
  inputWrapper: {
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
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1 },
  nativeInput: {
    flex: 1,
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.primary,
    height: 52,
  },
  passwordInput: { flex: 1 },
  eyeButton: { padding: 4 },
  errorText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.error,
  },

  forgotButton: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: 'Poppins_500Medium',
    color: Colors.primary,
  },

  signInButton: { borderRadius: Layout.radius.md, overflow: 'hidden', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  signInGradient: { paddingVertical: 16, alignItems: 'center' },
  signInText: {
    fontSize: Layout.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerLabel: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.secondary,
  },
  registerLink: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
  },
  termsNote: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: { color: Colors.primary },
});
