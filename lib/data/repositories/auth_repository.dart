import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';
import '../services/firebase_auth_service.dart';
import '../services/local_storage_service.dart';

class AuthRepository {
  AuthRepository({
    required FirebaseAuthService authService,
    required LocalStorageService storage,
  })  : _authService = authService,
        _storage = storage;

  final FirebaseAuthService _authService;
  final LocalStorageService _storage;

  Stream<User?> get authStateChanges => _authService.authStateChanges;
  bool get isLoggedIn => _authService.isLoggedIn;

  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    final user = await _authService.signInWithEmail(
      email: email,
      password: password,
    );
    await _storage.setCachedUserId(user.id);
    return user;
  }

  Future<UserModel> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final user = await _authService.createAccount(
      email: email,
      password: password,
      displayName: displayName,
    );
    await _storage.setCachedUserId(user.id);
    return user;
  }

  Future<void> signOut() async {
    await _authService.signOut();
    await _storage.clearUserData();
  }

  Future<void> sendPasswordReset(String email) =>
      _authService.sendPasswordResetEmail(email);

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) =>
      _authService.updatePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );

  Future<void> updateProfile({String? displayName, String? photoUrl}) =>
      _authService.updateProfile(
        displayName: displayName,
        photoUrl: photoUrl,
      );

  Future<void> deleteAccount(String password) async {
    await _authService.deleteAccount(password);
    await _storage.clearAll();
  }

  Future<UserModel?> getCurrentUser() => _authService.getCurrentUserModel();
}
