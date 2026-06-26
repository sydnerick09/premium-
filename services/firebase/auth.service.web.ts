import { User } from '../../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';

// Real web auth via the Firebase JS SDK. Email/password create + sign in real
// accounts; the social buttons REDIRECT to the provider (Google / Apple /
// Facebook) and the user is returned to the app signed in. Requires, in the
// Firebase console for project `erick-photo-editor`:
//   1. Authentication → Sign-in method → enable Email/Password + Google (+ others)
//   2. Authentication → Settings → Authorized domains → add the live web domains
//      (sydnerickedts.vercel.app, premium-web-sooty.vercel.app, localhost)

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);
  return getAuth(app);
}

type Provider = 'google' | 'facebook' | 'apple';

// Map a Firebase user onto our app's User model.
function toUser(u: FirebaseUser, provider?: Provider): User {
  const detected =
    u.providerData[0]?.providerId.includes('google') ? 'google'
    : u.providerData[0]?.providerId.includes('facebook') ? 'facebook'
    : u.providerData[0]?.providerId.includes('apple') ? 'apple'
    : undefined;
  return {
    id: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? (u.email ? u.email.split('@')[0] : 'User'),
    isPremium: true,
    storageUsedBytes: 0,
    photoUrl: u.photoURL ?? null,
    provider: provider ?? detected,
  } as User;
}

// Turn raw Firebase auth errors into friendly messages.
function friendly(e: any): Error {
  const code = e?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method isn’t enabled yet. Enable it in the Firebase console.',
    'auth/unauthorized-domain': 'This domain isn’t authorised in Firebase. Add it under Authentication → Settings.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow popups and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };
  return new Error(map[code] ?? e?.message ?? 'Something went wrong. Please try again.');
}

class AuthServiceWeb {
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      return toUser(cred.user);
    } catch (e) {
      throw friendly(e);
    }
  }

  async createAccount(email: string, password: string, displayName: string): Promise<User> {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      if (displayName) {
        try { await fbUpdateProfile(cred.user, { displayName: displayName.trim() }); } catch {}
      }
      return toUser(cred.user, undefined);
    } catch (e) {
      throw friendly(e);
    }
  }

  async signInWithProvider(provider: Provider): Promise<User> {
    const auth = getFirebaseAuth();
    let p;
    if (provider === 'google') {
      p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
    } else if (provider === 'facebook') {
      p = new FacebookAuthProvider();
    } else {
      p = new OAuthProvider('apple.com');
      p.addScope('email');
      p.addScope('name');
    }
    try {
      // Full-page redirect to the provider. The browser navigates away here;
      // on return, getRedirectResult / onAuthStateChanged complete the sign-in.
      await signInWithRedirect(auth, p);
    } catch (e) {
      throw friendly(e);
    }
    // The page is navigating to the provider — nothing past this point runs.
    return new Promise<User>(() => {});
  }

  async signOut() {
    try { await fbSignOut(getFirebaseAuth()); } catch {}
  }

  async sendPasswordReset(email: string) {
    try { await sendPasswordResetEmail(getFirebaseAuth(), email); }
    catch (e) { throw friendly(e); }
  }

  async updatePassword(_current: string, _next: string) {}

  async updateProfile(data: Partial<User>) {
    const u = getFirebaseAuth().currentUser;
    if (u && (data.displayName != null || data.photoUrl != null)) {
      try {
        await fbUpdateProfile(u, {
          displayName: data.displayName ?? u.displayName ?? undefined,
          photoURL: (data.photoUrl as string) ?? u.photoURL ?? undefined,
        });
      } catch {}
    }
  }

  async deleteAccount(_password: string) {
    const u = getFirebaseAuth().currentUser;
    if (u) { try { await u.delete(); } catch (e) { throw friendly(e); } }
  }

  getCurrentUserModel(): User | null {
    const u = getFirebaseAuth().currentUser;
    return u ? toUser(u) : null;
  }

  onAuthStateChanged(cb: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    // Resolve any pending social redirect from before the page reloaded.
    getRedirectResult(auth).catch(() => {});
    return fbOnAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null));
  }
}

export const authService = new AuthServiceWeb();
