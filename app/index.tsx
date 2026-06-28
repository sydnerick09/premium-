import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from '@components/ui/SolidGradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { localStorage } from '../services/storage/localStorage.service';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

export default function SplashScreen() {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  const navigate = () => {
    const isOnboardingDone = localStorage.isOnboardingDone;
    if (!isOnboardingDone) {
      router.replace('/onboarding');
    } else if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    // Animate logo in
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    textOpacity.value = withSequence(
      withTiming(0, { duration: 400 }),
      withTiming(1, { duration: 600 })
    );
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      navigate();
    }, 500);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0A2E', Colors.dark.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <LinearGradient
          colors={Colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <Ionicons name="aperture" size={58} color={Colors.white} />
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Animated.Text style={styles.appName}>GWENO</Animated.Text>
        <Animated.Text style={styles.tagline}>Editor Pro</Animated.Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <Animated.View style={styles.progressFill} />
        </View>
        <Animated.Text style={[styles.version, { opacity: textOpacity }]}>
          v1.0.0
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 48,
    color: Colors.white,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: Layout.fontSize['6xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    letterSpacing: 3,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: 120,
    height: 3,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    width: '70%',
  },
  version: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    letterSpacing: 1,
  },
});
