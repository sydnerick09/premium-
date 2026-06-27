import { Alert, Platform } from 'react-native';

// Cross-platform alert. react-native-web's Alert.alert is unreliable (ignores
// buttons and often shows nothing), so on web we use the browser's own dialog.
export function notify(title: string, message?: string) {
  const text = [title, message].filter(Boolean).join('\n\n');
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(text);
    }
    return;
  }
  Alert.alert(title, message);
}
