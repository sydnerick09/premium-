import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="pdf" />
      <Stack.Screen name="vault" />
      <Stack.Screen name="cloud-backup" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="flyer" />
      <Stack.Screen name="status-saver" />
    </Stack>
  );
}
