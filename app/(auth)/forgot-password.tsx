import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from '@components/ui/SolidGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { validateEmail } from '../../utils/validators';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { sendPasswordReset, isLoading } = useAuthStore();

  const handleSend = async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={48} color={Colors.success} />
          </View>
          <Text style={styles.title}>Email Sent!</Text>
          <Text style={styles.subtitle}>
            We've sent password reset instructions to{' '}
            <Text style={{ color: Colors.primary }}>{email}</Text>
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
            <View style={[styles.inputRow, emailError ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color={Colors.text.muted} style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(null); }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            <TouchableOpacity onPress={handleSend} disabled={isLoading} activeOpacity={0.85} style={[styles.sendBtn, isLoading && { opacity: 0.6 }]}>
              <LinearGradient colors={Colors.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendGradient}>
                <Text style={styles.sendText}>{isLoading ? 'Sending...' : 'Send Reset Email'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  back: { width: 40, marginBottom: 28 },
  successIcon: { width: 80, height: 80, backgroundColor: Colors.dark.card, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: Layout.fontSize['3xl'], fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 12 },
  subtitle: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', color: Colors.text.muted, lineHeight: 22, marginBottom: 28, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md,
    borderWidth: 1, borderColor: Colors.dark.border,
    paddingHorizontal: 14, height: 52,
  },
  inputError: { borderColor: Colors.error },
  input: { flex: 1, fontSize: Layout.fontSize.base, fontFamily: 'Poppins_400Regular', color: Colors.text.primary },
  errorText: { fontSize: Layout.fontSize.xs, color: Colors.error, marginTop: 4 },
  sendBtn: { borderRadius: Layout.radius.md, overflow: 'hidden', marginTop: 20 },
  sendGradient: { paddingVertical: 16, alignItems: 'center' },
  sendText: { fontSize: Layout.fontSize.md, fontFamily: 'Poppins_600SemiBold', color: Colors.white },
  backBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: Colors.dark.card, borderRadius: Layout.radius.md },
  backBtnText: { fontSize: Layout.fontSize.base, fontFamily: 'Poppins_600SemiBold', color: Colors.primary },
});
