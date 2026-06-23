import { act, renderHook } from '@testing-library/react-hooks';
import { useAuthStore } from '../../store/authStore';

// Mock Firebase
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    onAuthStateChanged: jest.fn((cb) => { cb(null); return () => {}; }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({ collection: () => ({ doc: () => ({ set: jest.fn(), get: jest.fn() }) }) }),
}));

jest.mock('react-native-purchases', () => ({ default: { logIn: jest.fn() } }));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  it('starts with no user', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
  });

  it('sets isInitialized after initialize', async () => {
    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.isInitialized).toBe(true);
  });

  it('clearError sets error to null', () => {
    useAuthStore.setState({ error: 'Test error' });
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });

  it('setUser updates the user', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = { id: '123', email: 'test@test.com', displayName: 'Test', isPremium: false };
    act(() => { result.current.setUser(mockUser as any); });
    expect(result.current.user).toEqual(mockUser);
  });
});
