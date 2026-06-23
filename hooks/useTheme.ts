import { useSettingsStore } from '../store/settingsStore';
import { Colors } from '../constants/Colors';

export function useTheme() {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);

  const colors = isDarkMode ? Colors.dark : Colors.light;
  const textColors = Colors.text;

  return { isDarkMode, colors, textColors, Colors };
}
