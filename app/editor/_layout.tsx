import { Stack } from 'expo-router';

export default function EditorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="filters"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="adjustments" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="beauty"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="layers"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="creative"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="export"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ai-enhance" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="bg-remove"  options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="collage"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="logo"       options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="shapes"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="cutout-brush" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
