import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';

// On web the glyph fonts must be registered as @font-face rules or every icon
// renders as an empty "tofu" box. expo-font's useFonts does this, but it can race
// the first paint (our root layout renders after a 3s font timeout). We inject the
// rules ourselves at startup so icons are reliable.
//
// IMPORTANT: on Metro web, `Ionicons.font.Ionicons` is a numeric ASSET ID, not a
// URL — it must be resolved through expo-asset (`Asset.fromModule().uri`).
function uriFor(mod: any): string | null {
  if (mod == null) return null;
  if (typeof mod === 'string') return mod;
  try {
    const a = Asset.fromModule(mod);
    if (a?.uri) return a.uri;
  } catch {}
  return mod.uri ?? mod.default ?? null;
}

export function ensureIconFont() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('app-icon-fonts')) return;

  const sets: any[] = [Ionicons, MaterialIcons, MaterialCommunityIcons];
  let css = '';
  for (const set of sets) {
    const fontMap = set?.font as Record<string, any> | undefined;
    if (!fontMap) continue;
    for (const family of Object.keys(fontMap)) {
      const url = uriFor(fontMap[family]);
      if (url) {
        css +=
          `@font-face{font-family:"${family}";` +
          `src:url(${JSON.stringify(url)}) format("truetype");` +
          `font-weight:normal;font-style:normal;font-display:swap;}`;
      }
    }
  }
  if (!css) return;

  const style = document.createElement('style');
  style.id = 'app-icon-fonts';
  style.textContent = css;
  document.head.appendChild(style);
}
