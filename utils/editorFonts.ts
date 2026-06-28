import { Platform } from 'react-native';

// Fonts offered in the on-canvas text editor. 7 free + 6 premium = 13 total.
// On web the family names map straight to CSS font-family; the Google Fonts
// stylesheet is injected once (see ensureEditorFonts). On native, families that
// aren't bundled fall back to the system font.
export interface EditorFont {
  label: string;
  family: string;
  pro: boolean;
}

export const EDITOR_FONTS: EditorFont[] = [
  // ── Free (7) ──────────────────────────────────────────────
  { label: 'Poppins',    family: 'Poppins_600SemiBold', pro: false },
  { label: 'Montserrat', family: 'Montserrat',          pro: false },
  { label: 'Roboto',     family: 'Roboto',              pro: false },
  { label: 'Oswald',     family: 'Oswald',              pro: false },
  { label: 'Playfair',   family: 'Playfair Display',    pro: false },
  { label: 'Bebas',      family: 'Bebas Neue',          pro: false },
  { label: 'Lato',       family: 'Lato',                pro: false },
  // ── Premium (6) ───────────────────────────────────────────
  { label: 'Pacifico',   family: 'Pacifico',            pro: true },
  { label: 'Dancing',    family: 'Dancing Script',      pro: true },
  { label: 'Lobster',    family: 'Lobster',             pro: true },
  { label: 'Caveat',     family: 'Caveat',              pro: true },
  { label: 'Anton',      family: 'Anton',               pro: true },
  { label: 'Satisfy',    family: 'Satisfy',             pro: true },
];

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Montserrat:wght@600' +
  '&family=Roboto:wght@500' +
  '&family=Oswald:wght@600' +
  '&family=Playfair+Display:wght@700' +
  '&family=Bebas+Neue' +
  '&family=Lato:wght@700' +
  '&family=Pacifico' +
  '&family=Dancing+Script:wght@700' +
  '&family=Lobster' +
  '&family=Caveat:wght@700' +
  '&family=Anton' +
  '&family=Satisfy' +
  '&display=swap';

let injected = false;

/** Load the editor's Google Fonts once (web only). No-op on native. */
export function ensureEditorFonts(): void {
  if (injected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  injected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}
