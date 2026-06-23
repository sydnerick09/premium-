import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { localStorage } from '../services/storage/localStorage.service';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: '✦',
    title: 'AI-Powered Editing',
    subtitle: 'One tap to enhance any photo with intelligent AI that auto-adjusts brightness, sharpness, colors, and more.',
    gradient: Colors.gradients.primary,
  },
  {
    id: '2',
    icon: '🎨',
    title: '100+ Pro Filters',
    subtitle: 'From vintage film looks to cinematic LUTs — apply stunning filters and create your own signature style.',
    gradient: Colors.gradients.accent,
  },
  {
    id: '3',
    icon: '✂️',
    title: 'Pro Tools & Layers',
    subtitle: 'Crop, rotate, perspective correct, draw, add text and stickers with a full non-destructive layer system.',
    gradient: ['#10B981', '#0891B2'],
  },
  {
    id: '4',
    icon: '☁️',
    title: 'Cloud Sync & Share',
    subtitle: 'Your projects are automatically backed up. Export in 4K and share directly to social media.',
    gradient: Colors.gradients.gold,
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => handleGetStarted();

  const handleGetStarted = () => {
    localStorage.setOnboardingDone();
    router.replace('/(auth)/login');
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient
              colors={item.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Text style={styles.icon}>{item.icon}</Text>
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Indicators */}
      <View style={styles.indicators}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={styles.nextButton}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: { fontSize: 52 },
  title: {
    fontSize: Layout.fontSize['4xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  nextButton: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
  },
  nextGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: Layout.radius.lg,
  },
  nextText: {
    fontSize: Layout.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
  },
});
