import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { purchaseService } from '../services/purchase/purchase.service';
import { Colors, applyTheme } from '../constants/Colors';
import { ensureIconFont } from '../utils/ensureIconFont';

SplashScreen.preventAutoHideAsync();
// Guarantee the Ionicons glyph font is registered on web even if useFonts times
// out on a slow network (otherwise icons render as empty boxes).
ensureIconFont();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    // Load the Ionicons glyph font so icons render on web (otherwise every icon
    // shows as an empty "tofu" box on top of its label).
    ...Ionicons.font,
  });
  // Safety net: never block the UI on fonts forever (e.g. slow/failed font
  // fetch on mobile networks would otherwise leave a permanent blank screen).
  const [fontTimedOut, setFontTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const initialize = useAuthStore((s) => s.initialize);
  const initSettings = useSettingsStore((s) => s.initialize);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);

  // Keep the live web theme (CSS variables) in sync with the user's preference.
  useEffect(() => { applyTheme(isDarkMode); }, [isDarkMode]);

  useEffect(() => {
    async function bootstrap() {
      initSettings();
      loadProjects();
      await initialize();
      await purchaseService.configure().catch(() => {});
    }
    bootstrap();
  }, []);

  const ready = fontsLoaded || fontError || fontTimedOut;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar
          style={isDarkMode ? 'light' : 'dark'}
          backgroundColor={isDarkMode ? Colors.dark.background : Colors.light.background}
          translucent
        />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="editor"
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen name="premium" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="tools" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
