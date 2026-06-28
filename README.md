# Gweno Editor Pro

An AI-powered photo editor built with **Expo / React Native** (SDK 51, TypeScript).
It runs as a **web app** (deployed to Vercel) and as an **Android** app (EAS Build).

- **Live web app:** https://sydnerickedts.vercel.app (alias: https://premium-web-sooty.vercel.app)
- **Brand:** "Gweno Editor Pro" (short mark: **Gweno**). Internal technical ids still use `erick`
  (package `com.erick.photoeditor`, Firebase project `erick-photo-editor`) — these are intentionally
  kept stable; only the display name changed.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Web Build & Deploy (Vercel)](#web-build--deploy-vercel)
- [Firebase Setup](#firebase-setup)
- [Android Build (EAS)](#android-build-eas)
- [Premium / Pricing](#premium--pricing)
- [Design System](#design-system)
- [Architecture](#architecture)
- [Testing](#testing)

---

## Features

**Editor**
- Adjustments (brightness, contrast, temperature, vignette, fade, …)
- 60+ filters with live preview and intensity
- Effects (negative, neon, VHS, pixelate, B&W, duotone, warm/cool)
- Crop (Free + fixed ratios), rotate, flip, straighten/skew
- Beauty retouching — localized via **MediaPipe FaceLandmarker** (skin smoothing, teeth whitening, eye enhance)
- **AI background removal** (`@imgly/background-removal`) + background replace/colour/gradient/photo — subject pixels are never altered
- DSLR/portrait background blur, square pad, **collage** (multiple layouts)
- Cutout brush, shapes, logo maker, AI enhance / AI family
- **On-canvas text editor** — Keyboard / Font / Color (TEXT·LABEL·BORDER + eyedropper "Match") / Edit (size slider + pinch-to-resize) / Curve (Premium); 13 fonts (7 free, 6 premium)
- Layers, export (format / quality / up to 4K) and share

**Tools hub**
- Image → PDF, document scanner, QR (photo-based), flyer/poster, cloud backup, WhatsApp status saver
- **Private Vault** — passcode-gated hidden gallery (full-screen viewer, 3-second permanent-delete confirm). Hidden: open by long-pressing the **Gweno** title on the home screen.

**App**
- Single-screen onboarding, real auth (Firebase), settings with working dark/light theme, legal screens
- **Pro paywall** with an animated hero carousel and a 7-day free trial
- Admin panel at `/admin` (password-gated; service-role key stored only in the browser)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 51 + React Native 0.74 |
| Targets | Web (react-native-web → Vercel static export) + Android (EAS) |
| Routing | Expo Router 3.5 (file-based) |
| Language | TypeScript (strict) |
| State | Zustand + Immer |
| Auth | Firebase Auth (web: popup/redirect; email + Google/Apple/Facebook) |
| Data / sync | Supabase (Postgres) + MMKV (native) / localStorage (web) |
| Image (web) | HTML Canvas + CSS filters; `@imgly/background-removal`, MediaPipe (CDN) |
| Image (native) | expo-image-manipulator |
| IAP / billing | RevenueCat / Google Play (Android); web paywall is card-based (processor TBD) |
| Animations | react-native-reanimated |
| Fonts | @expo-google-fonts/poppins (+ web Google Fonts for the editor) |
| Build | EAS Build (Android) · `expo export -p web` + Vercel (web) |

> **Design note:** the UI is intentionally **flat** — no gradients, glassmorphism, or pastel washes.
> `expo-linear-gradient` is replaced app-wide by a solid drop-in (`components/ui/SolidGradient.tsx`);
> see [Design System](#design-system).

---

## Project Structure

```
app/                        # Expo Router routes
├── _layout.tsx             # Root layout (fonts, theme, stores)
├── index.tsx               # Animated splash
├── onboarding.tsx          # Single-screen onboarding
├── premium.tsx             # Pro paywall (animated carousel, plans, trial)
├── admin.tsx               # Admin panel (/admin)
├── settings.tsx, terms.tsx, privacy-policy.tsx
├── (auth)/                 # login, register, forgot-password
├── (tabs)/                 # index (home), projects, create, explore, profile
├── editor/                 # index, adjustments, filters, beauty, layers, creative,
│                           # export, ai-enhance, bg-remove, collage, cutout-brush, logo, shapes
└── tools/                  # pdf, scanner, qr, flyer, cloud-backup, status-saver, vault
components/
├── ui/                     # AppButton, AppText, AppTextInput, AppCard, LoadingOverlay,
│                           # PremiumBadge, EmptyState, SolidGradient (flat-gradient shim)
├── editor/TextEditToolbar.tsx
├── EditorImage.tsx(.web)   # live adjustment/filter preview
├── AppSlider.tsx(.web)     # web-safe slider
└── CutoutBrush.tsx(.web)
constants/                  # Colors, Layout, FilterCatalog, AppConstants
services/
├── firebase/               # auth.service(.web), firestore
├── supabase/               # client, profiles/projects/storage services
├── image/                  # imageProcessor.service(.web), exportService(.web)
├── storage/localStorage.service.ts
└── purchase/purchase.service.ts
store/                      # authStore, editorStore, projectStore, settingsStore, layersStore
utils/                      # haptics, formatters, validators, imageFilters, editorFonts, notify
supabase/migrations/        # Postgres schema
scripts/fix-web-assets.sh   # web export fonts fix (see Deploy)
assets/                     # icons, images, premium/ (carousel photos)
```

---

## Quick Start

```bash
npm install
cp .env.example .env        # fill in Firebase / Supabase / RevenueCat values
```

Run on web (primary dev target):

```bash
npx expo start --web
```

Run on Android (needs a dev client for native modules):

```bash
eas build --profile development --platform android
npx expo start --dev-client
```

---

## Environment Variables

Create `.env` from `.env.example`:

```env
# Firebase (real project: erick-photo-editor)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Supabase
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Admin panel (/admin)
EXPO_PUBLIC_ADMIN_PASSWORD=erick-admin

# Links / billing
EXPO_PUBLIC_APP_URL=https://gwenoeditorpro.app
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=...
```

---

## Web Build & Deploy (Vercel)

`expo export` wipes `dist/`, so `dist/vercel.json` must be recreated each time, and a fonts fix must
run or all icons render as empty "tofu" boxes (Vercel strips any folder named `node_modules`).

```bash
# 1. Build the static web bundle
npx expo export --platform web

# 2. CRITICAL fonts fix — rename assets/node_modules -> assets/deps and rewrite refs
bash scripts/fix-web-assets.sh
#    verify: (cd dist && grep -rho "assets/node_modules" . | wc -l)  # must be 0

# 3. SPA routing config
echo '{ "cleanUrls": true, "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }' > dist/vercel.json

# 4. Deploy
cd dist && vercel deploy --prod --yes

# 5. Re-point the public aliases to the new deploy
vercel alias set <new-deploy-url> sydnerickedts.vercel.app
vercel alias set <new-deploy-url> premium-web-sooty.vercel.app
```

---

## Firebase Setup

1. Use the project **`erick-photo-editor`** (id is fixed; the public name is "Gweno Editor Pro").
2. **Authentication → Sign-in method:** enable Email/Password and Google (+ Apple/Facebook if used).
3. **Authentication → Settings → Authorized domains:** add `sydnerickedts.vercel.app`,
   `premium-web-sooty.vercel.app`, and `localhost`.
4. To show the new name on the Google sign-in popup, set:
   - Firebase Console → Project settings → **Public-facing name** → `Gweno Editor Pro`
   - Google Cloud Console → OAuth consent screen → **App name** → `Gweno Editor Pro`
5. (Android) place `google-services.json` at the project root; package `com.erick.photoeditor`.

---

## Android Build (EAS)

```bash
eas login
eas build --profile preview    --platform android   # APK for testing
eas build --profile production  --platform android   # AAB for Play Store
```

`eas.json` uses `autoIncrement` for production version codes.

---

## Premium / Pricing

The Pro paywall (`app/premium.tsx`) offers a **7-day free trial** and these plans:

| Plan | Price |
|------|-------|
| Monthly | $7 / month |
| 3 Months (offer) | $15 |
| Yearly (best value) | $47 / year |

- Benefits: no ads, all premium tools, edit everything for free.
- Web payments are **card-only** (Visa · Mastercard · Debit). The card processor (e.g. Stripe) is not
  yet wired — the CTA currently uses the `purchase.service` abstraction.
- Android billing uses Google Play / RevenueCat product ids `gweno_premium_monthly|quarter|yearly`.

---

## Design System

- **Flat & solid only:** no gradients, glassmorphism, or pastel/translucent washes.
- All decorative `LinearGradient` usages import `components/ui/SolidGradient.tsx`, which renders a solid
  view (most-opaque stop) — so existing `<LinearGradient colors={...}>` code keeps working but looks flat.
- Exceptions kept as **real** gradients/blur because they are functional, not chrome: the editor
  vignette overlay, live image-adjustment tints, crop/face guides, and the canvas `blur()` filters.
- Colours/tokens live in `constants/Colors.ts` (brand green `#22C55E`). Web supports dark/light via CSS
  variables; native is dark-first.

---

## Architecture

```
User action → Zustand store (source of truth)
            → MMKV / localStorage (instant local persistence)
            → Supabase / Firebase (cloud sync, fire-and-forget)
```

- **State:** `authStore`, `editorStore` (image, adjustments, filters, text overlays, undo/redo),
  `projectStore`, `settingsStore`, `layersStore`.
- **Image processing:** real on web via HTML Canvas + CSS filters (`imageProcessor.service.web.ts`);
  AI models (`@imgly/background-removal`, MediaPipe) are imported at runtime from a CDN. Native uses
  `expo-image-manipulator`.
- **Offline:** local cache first; cloud sync is best-effort so the app works offline.

---

## Testing

```bash
npm test            # Jest (jest-expo)
npm test -- --coverage
```

```
__tests__/
├── stores/         # authStore, editorStore, layersStore
└── utils/          # validators, formatters
```
