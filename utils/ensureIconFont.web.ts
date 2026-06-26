import { Ionicons } from '@expo/vector-icons';

// On mobile web the Ionicons glyph font sometimes hasn't applied by the time the
// UI first paints (our root layout renders after a 3s font timeout so a slow
// network never blanks the screen). Without the font, every icon shows as an
// empty "tofu" box. Injecting an explicit @font-face with `font-display: swap`
// makes the browser fetch the bundled glyph font natively and repaint icons the
// moment it arrives — independent of React's font-loading gate.
export function ensureIconFont() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ionicons-font-face')) return;

  // On web, requiring the .ttf resolves to its served URL string.
  const mod = (Ionicons as any).font?.Ionicons;
  const url = typeof mod === 'string' ? mod : mod?.uri ?? mod?.default;
  if (!url) return;

  const style = document.createElement('style');
  style.id = 'ionicons-font-face';
  style.textContent =
    `@font-face{` +
    `font-family:"Ionicons";` +
    `src:url(${JSON.stringify(url)}) format("truetype");` +
    `font-weight:normal;font-style:normal;font-display:swap;}`;
  document.head.appendChild(style);
}
