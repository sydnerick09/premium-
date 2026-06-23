import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '../../types';

const mapAuthError = (code: string): string =>
  ({
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/network-request-failed': 'No internet connection. Check your network.',
    'auth/requires-recent-login': 'Please sign in again to complete this.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
  }[code] ?? 'An unexpected error occurred. Please try again.');

class AuthService {
  get currentUser() {
    return auth().currentUser;
  }

  get isLoggedIn() {
    return !!auth().currentUser;
  }

  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return auth().onAuthStateChanged(callback);
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const { user } = await auth().signInWithEmailAndPassword(
        email.trim(),
        password
      );
      await this._updateLastLogin(user.uid);
      return this._fetchOrCreateUser(user);
    } catch (e: any) {
      throw new Error(mapAuthError(e.code));
    }
  }

  async createAccount(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const { user } = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password
      );
      await user.updateProfile({ displayName: displayName.trim() });
      await user.sendEmailVerification();
      const newUser: User = {
        id: user.uid,
        email: email.trim(),
        displayName: displayName.trim(),
        photoUrl: null,
        username: null,
        bio: null,
        isPremium: false,
        premiumExpiry: null,
        projectsCount: 0,
        storageUsedBytes: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        provider: 'email',
      };
      await this._createUserDocument(newUser);
      return newUser;
    } catch (e: any) {
      throw new Error(mapAuthError(e.code));
    }
  }

  async signOut(): Promise<void> {
    await auth().signOut();
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email.trim());
    } catch (e: any) {
      throw new Error(mapAuthError(e.code));
    }
  }

  async updatePassword(current: string, newPassword: string): Promise<void> {
    const user = auth().currentUser;
    if (!user?.email) throw new Error('Not authenticated.');
    try {
      const cred = auth.EmailAuthProvider.credential(user.email, current);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(newPassword);
    } catch (e: any) {
      throw new Error(mapAuthError(e.code));
    }
  }

  async updateProfile(data: {
    displayName?: string;
    photoUrl?: string;
    bio?: string;
    username?: string;
  }): Promise<void> {
    const user = auth().currentUser;
    if (!user) throw new Error('Not authenticated.');
    if (data.displayName || data.photoUrl) {
      await user.updateProfile({
        displayName: data.displayName ?? user.displayName ?? undefined,
        photoURL: data.photoUrl ?? user.photoURL ?? undefined,
      });
    }
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  async deleteAccount(password: string): Promise<void> {
    const user = auth().currentUser;
    if (!user?.email) throw new Error('Not authenticated.');
    const cred = auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(cred);
    await firestore().collection('users').doc(user.uid).delete();
    await user.delete();
  }

  async getCurrentUserModel(): Promise<User | null> {
    const user = auth().currentUser;
    if (!user) return null;
    return this._fetchOrCreateUser(user);
  }

  private async _fetchOrCreateUser(
    user: FirebaseAuthTypes.User
  ): Promise<User> {
    const doc = await firestore().collection('users').doc(user.uid).get();
    if (doc.exists) {
      const data = doc.data()!;
      return {
        id: user.uid,
        email: user.email ?? '',
        displayName: data.displayName ?? user.displayName ?? null,
        photoUrl: data.photoUrl ?? user.photoURL ?? null,
        username: data.username ?? null,
        bio: data.bio ?? null,
        isPremium: data.isPremium ?? false,
        premiumExpiry: data.premiumExpiry?.toDate() ?? null,
        projectsCount: data.projectsCount ?? 0,
        storageUsedBytes: data.storageUsedBytes ?? 0,
        createdAt: data.createdAt?.toDate() ?? null,
        lastLoginAt: data.lastLoginAt?.toDate() ?? null,
        provider: (data.provider ?? 'email') as User['provider'],
      };
    }
    const newUser: User = {
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? null,
      photoUrl: user.photoURL ?? null,
      username: null,
      bio: null,
      isPremium: false,
      premiumExpiry: null,
      projectsCount: 0,
      storageUsedBytes: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      provider: 'email',
    };
    await this._createUserDocument(newUser);
    return newUser;
  }

  private async _createUserDocument(user: User): Promise<void> {
    await firestore()
      .collection('users')
      .doc(user.id)
      .set({
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        username: user.username,
        bio: user.bio,
        isPremium: user.isPremium,
        premiumExpiry: null,
        projectsCount: 0,
        storageUsedBytes: 0,
        provider: user.provider,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  private async _updateLastLogin(uid: string): Promise<void> {
    await firestore()
      .collection('users')
      .doc(uid)
      .update({ lastLoginAt: firestore.FieldValue.serverTimestamp() })
      .catch(() => {});
  }
}

export const authService = new AuthService();
