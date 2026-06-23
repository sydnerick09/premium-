import { User } from '../../types';

// Web stub — Firebase native SDK is Android/iOS only
// On web, auth operations are no-ops that return mock data

const mockUser: User = {
  id: 'web-preview-user',
  email: 'preview@erick.app',
  displayName: 'Preview User',
  isPremium: true,
  storageUsedBytes: 0,
};

class AuthServiceWeb {
  async signInWithEmail(_email: string, _password: string) { return mockUser; }
  async createAccount(_name: string, _email: string, _password: string) { return mockUser; }
  async signOut() {}
  async sendPasswordReset(_email: string) {}
  async updatePassword(_current: string, _next: string) {}
  async updateProfile(_data: Partial<User>) {}
  async deleteAccount(_password: string) {}
  getCurrentUserModel(): User | null { return mockUser; }
  onAuthStateChanged(cb: (user: User | null) => void) {
    setTimeout(() => cb(mockUser), 100);
    return () => {};
  }
}

export const authService = new AuthServiceWeb();
