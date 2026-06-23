import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';
import { authService } from '../services/firebase/auth.service';
import { localStorage } from '../services/storage/localStorage.service';
import { purchaseService } from '../services/purchase/purchase.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'displayName' | 'photoUrl' | 'bio' | 'username'>>) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
      set((s) => { s.isInitialized = false; });
      // Listen to Firebase auth state
      authService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const user = await authService.getCurrentUserModel();
            set((s) => {
              s.user = user;
              s.isInitialized = true;
            });
            if (user) {
              localStorage.setUserId(user.id);
              await purchaseService.loginUser(user.id).catch(() => {});
            }
          } catch {
            set((s) => { s.user = null; s.isInitialized = true; });
          }
        } else {
          set((s) => { s.user = null; s.isInitialized = true; });
        }
      });
    },

    signIn: async (email, password) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const user = await authService.signInWithEmail(email, password);
        set((s) => { s.user = user; });
        localStorage.setUserId(user.id);
        await purchaseService.loginUser(user.id).catch(() => {});
      } catch (e: any) {
        set((s) => { s.error = e.message; });
        throw e;
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    register: async (email, password, displayName) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const user = await authService.createAccount(email, password, displayName);
        set((s) => { s.user = user; });
        localStorage.setUserId(user.id);
      } catch (e: any) {
        set((s) => { s.error = e.message; });
        throw e;
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    signOut: async () => {
      set((s) => { s.isLoading = true; });
      try {
        await authService.signOut();
        await purchaseService.logoutUser().catch(() => {});
        localStorage.clearUserData();
        set((s) => { s.user = null; });
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    sendPasswordReset: async (email) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        await authService.sendPasswordReset(email);
      } catch (e: any) {
        set((s) => { s.error = e.message; });
        throw e;
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    updateProfile: async (data) => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        await authService.updateProfile(data);
        set((s) => {
          if (s.user) Object.assign(s.user, data);
        });
      } catch (e: any) {
        set((s) => { s.error = e.message; });
        throw e;
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    deleteAccount: async (password) => {
      set((s) => { s.isLoading = true; });
      try {
        await authService.deleteAccount(password);
        localStorage.clearAll();
        set((s) => { s.user = null; });
      } catch (e: any) {
        set((s) => { s.error = e.message; });
        throw e;
      } finally {
        set((s) => { s.isLoading = false; });
      }
    },

    clearError: () => set((s) => { s.error = null; }),
    setUser: (user) => set((s) => { s.user = user; }),
    refreshUser: async () => {
      const user = await authService.getCurrentUserModel();
      set((s) => { s.user = user; });
    },
  }))
);
