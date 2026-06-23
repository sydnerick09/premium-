# Erick Photo Editor

A production-ready AI-powered photo editing app built with **Expo React Native** (SDK 51). Available on Android via Google Play.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Firebase Setup](#firebase-setup)
- [RevenueCat Setup](#revenuecat-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [Play Store Submission](#play-store-submission)
- [Testing](#testing)
- [Architecture](#architecture)

---

## Project Structure

```
erick/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root layout (fonts, stores init)
│   ├── index.tsx               # Animated splash → navigate
│   ├── onboarding.tsx          # 4-slide onboarding flow
│   ├── premium.tsx             # Premium subscription screen
│   ├── settings.tsx            # Full settings screen
│   ├── privacy-policy.tsx      # Privacy policy legal screen
│   ├── terms.tsx               # Terms of service legal screen
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── index.tsx           # Home tab
│   │   ├── projects.tsx        # Projects grid
│   │   ├── create.tsx          # Image picker → editor
│   │   ├── explore.tsx         # Tutorials & tips
│   │   └── profile.tsx         # User profile
│   └── editor/
│       ├── index.tsx           # Main editor canvas
│       ├── adjustments.tsx     # 16-slider panel
│       ├── filters.tsx         # 60+ filter browser
│       ├── beauty.tsx          # Beauty retouching
│       ├── layers.tsx          # Layer management
│       ├── creative.tsx        # Text, stickers, frames, draw
│       └── export.tsx          # Export settings & share
├── components/
│   └── ui/                     # Reusable UI components
│       ├── AppButton.tsx
│       ├── AppText.tsx
│       ├── AppTextInput.tsx
│       ├── AppCard.tsx
│       ├── LoadingOverlay.tsx
│       ├── PremiumBadge.tsx
│       ├── EmptyState.tsx
│       └── index.ts
├── constants/
│   ├── Colors.ts               # Design tokens & gradients
│   ├── Layout.ts               # Spacing, radius, typography
│   ├── FilterCatalog.ts        # 60+ filter definitions
│   └── AppConstants.ts         # App-wide constants
├── hooks/
│   ├── useAuth.ts
│   ├── useEditor.ts
│   ├── useFilters.ts
│   ├── useAdjustments.ts
│   ├── useExport.ts
│   ├── useImagePicker.ts
│   ├── usePermissions.ts
│   └── useTheme.ts
├── services/
│   ├── firebase/
│   │   ├── auth.service.ts     # Firebase auth wrapper
│   │   └── firestore.service.ts
│   ├── image/
│   │   ├── imageProcessor.service.ts  # expo-image-manipulator
│   │   ├── aiEnhancement.service.ts   # AI enhancement
│   │   └── exportService.ts           # Export & share
│   ├── storage/
│   │   └── localStorage.service.ts    # MMKV local storage
│   └── purchase/
│       └── purchase.service.ts        # RevenueCat IAP
├── store/                      # Zustand state management
│   ├── authStore.ts
│   ├── editorStore.ts
│   ├── projectStore.ts
│   ├── settingsStore.ts
│   └── layersStore.ts
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/
│   ├── validators.ts
│   ├── formatters.ts
│   └── haptics.ts
└── __tests__/                  # Unit tests
    ├── stores/
    └── utils/
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 51 + React Native 0.74 |
| Routing | Expo Router 3.5 (file-based) |
| Language | TypeScript (strict) |
| State | Zustand + Immer |
| Auth & DB | Firebase (Auth, Firestore, Storage) |
| Analytics | Firebase Analytics + Crashlytics |
| Image | expo-image-manipulator |
| Storage | react-native-mmkv |
| IAP | RevenueCat (react-native-purchases) |
| Animations | react-native-reanimated |
| UI | expo-linear-gradient, @gorhom/bottom-sheet |
| Fonts | @expo-google-fonts/poppins |
| Build | EAS Build |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for emulator) or physical Android device

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

```bash
cp .env.example .env
# Fill in your Firebase and RevenueCat credentials
```

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named **erick-photo-editor**
3. Enable **Authentication** → Email/Password sign-in
4. Create **Firestore Database** in production mode
5. Enable **Storage**
6. Enable **Analytics** and **Crashlytics**
7. Add an **Android app**:
   - Package name: `com.erick.photoeditor`
   - Download `google-services.json`
   - Place it at the **root** of the project (same level as `app.json`)

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /projects/{projectId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## RevenueCat Setup

1. Create an account at [RevenueCat](https://www.revenuecat.com)
2. Create a new project and add the Android app with package `com.erick.photoeditor`
3. Set up products in **Google Play Console** (see below)
4. Link Google Play to RevenueCat
5. Create an **Entitlement** named `premium`
6. Create an **Offering** with packages:
   - `erick_premium_weekly` → Weekly subscription
   - `erick_premium_monthly` → Monthly subscription
   - `erick_premium_yearly` → Annual subscription
7. Copy your **Public SDK Key** and add it to `.env` as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

---

## Environment Variables

Create `.env` from `.env.example`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_revenuecat_key
EXPO_PUBLIC_APP_URL=https://erickphotoeditor.app
EXPO_PUBLIC_PRIVACY_URL=https://erickphotoeditor.app/privacy
EXPO_PUBLIC_TERMS_URL=https://erickphotoeditor.app/terms
```

---

## Running the App

### Development (Expo Go)

```bash
npx expo start
# Scan QR code with Expo Go on Android
```

> Note: `@react-native-firebase` and `react-native-mmkv` require a custom dev client. Use the development build below.

### Development Build (Recommended)

```bash
# Build development APK
eas build --profile development --platform android

# Start dev server
npx expo start --dev-client
```

### Android Emulator

```bash
npx expo run:android
```

---

## Building for Production

### 1. Configure EAS

```bash
eas login
eas build:configure
```

### 2. Preview Build (APK for testing)

```bash
eas build --profile preview --platform android
```

### 3. Production Build (AAB for Play Store)

```bash
eas build --profile production --platform android
```

The AAB file will be available for download from the EAS dashboard.

### Version Management

`eas.json` is configured with `"autoIncrement": true` for production builds — version code increments automatically.

---

## Play Store Submission

### 1. Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in the store listing:
   - **App name**: Erick Photo Editor
   - **Short description**: AI-powered photo editor with 100+ filters
   - **Full description**: Paste from your marketing copy
   - **Category**: Photography
   - **Tags**: photo editor, AI, filters, beauty, retouching

### 2. Required Assets

| Asset | Size |
|-------|------|
| Icon | 512×512 PNG |
| Feature Graphic | 1024×500 PNG |
| Screenshots | Min 2, portrait 1080×1920 |
| Privacy Policy URL | Required |

### 3. Content Rating

Complete the content rating questionnaire (IARC). This app:
- Does not contain violence
- Does not contain sexual content
- Collects user data (email) — declare this

### 4. App Permissions Declaration

In Play Console → App Content → Permissions:
- Camera: Required for taking photos to edit
- Photo Library: Required for selecting photos from gallery
- Internet: Required for cloud sync and authentication

### 5. Data Safety Section

Declare the following data collection:
- Email address (required for account)
- Photos/videos (user-provided, not shared)
- Analytics data (anonymized, for app improvement)
- Crash reports (for bug fixing)

### 6. In-App Purchases Setup

1. Go to **Monetization → Products → Subscriptions**
2. Create subscriptions:

| Product ID | Duration | Price |
|-----------|---------|-------|
| `erick_premium_weekly` | 1 week | $1.99 |
| `erick_premium_monthly` | 1 month | $4.99 |
| `erick_premium_yearly` | 1 year | $29.99 |

3. Link to RevenueCat (see RevenueCat Setup above)

### 7. Upload & Review

```bash
# Upload your production AAB
# In Play Console: Production → Create new release → Upload AAB
```

**Review timeline**: 1-7 days for initial review, 1-3 days for updates.

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Test Structure

```
__tests__/
├── stores/
│   ├── authStore.test.ts
│   ├── editorStore.test.ts
│   └── layersStore.test.ts
└── utils/
    ├── validators.test.ts
    └── formatters.test.ts
```

---

## Architecture

### State Management

The app uses **Zustand with Immer** for state management. All stores are in `store/`:

- `authStore` — User authentication state, Firebase auth listener
- `editorStore` — Active image, adjustments, filters, history (undo/redo)
- `projectStore` — Project CRUD, syncs to Firestore + MMKV
- `settingsStore` — App settings, theme, persisted to MMKV
- `layersStore` — Layer management for composite editing

### Data Flow

```
User Action
    ↓
Zustand Store (source of truth)
    ↓
MMKV (local persistence, instant read/write)
    ↓
Firebase (cloud sync, fire-and-forget)
```

### Routing

File-based routing with Expo Router:

```
/ (index.tsx)         → Animated splash → redirect
/onboarding           → First-launch onboarding
/(auth)/login         → Sign in
/(auth)/register      → Create account
/(tabs)/              → Home, Projects, Create, Explore, Profile
/editor/              → Photo editor
/editor/adjustments   → Adjustment sliders
/editor/filters       → Filter browser
/editor/beauty        → Beauty tools
/editor/layers        → Layer management
/editor/creative      → Text, stickers, frames, drawing
/editor/export        → Export & share
/premium              → Subscription screen
/settings             → App settings
/privacy-policy       → Privacy policy
/terms                → Terms of service
```

### Image Processing

All image processing is on-device using `expo-image-manipulator`:
- Resize, crop, rotate, flip
- Chained operations via `applyOperations()`
- Thumbnail generation for project previews
- Export with format/quality/resolution control

AI enhancement simulates on-device processing with adjustment pipelines (real ML models would integrate via ExecuTorch or TFLite in a production app).

### Offline Support

- All user data is cached in MMKV (fast synchronous reads)
- Firebase sync is fire-and-forget — app works fully offline
- Projects load instantly from local cache
- Changes sync when network is available

---

## Permissions Required

| Permission | Reason |
|-----------|--------|
| `android.permission.CAMERA` | Take photos to edit |
| `android.permission.READ_MEDIA_IMAGES` | Select photos from gallery |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Save exported photos |
| `android.permission.INTERNET` | Cloud sync, authentication |
| `android.permission.BILLING` | In-app purchases |

---

## Contact

- Email: support@erickphotoeditor.app
- Privacy: privacy@erickphotoeditor.app
- Website: https://erickphotoeditor.app
