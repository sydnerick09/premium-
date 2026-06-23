import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const register = useAuthStore((s) => s.register);
  const signOut = useAuthStore((s) => s.signOut);
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    user,
    isLoading,
    isInitialized,
    error,
    isAuthenticated: !!user,
    isPremium: user?.isPremium ?? false,
    signIn,
    register,
    signOut,
    sendPasswordReset,
    updateProfile,
    clearError,
  };
}
