import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/firebase_auth_service.dart';
import '../../data/services/image_service.dart';
import '../../data/services/ai_enhancement_service.dart';
import '../../data/services/export_service.dart';
import '../../data/services/local_storage_service.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/project_repository.dart';
import '../../data/models/user_model.dart';

// Firebase auth stream — used by router for redirect
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

// Service providers
final firebaseAuthServiceProvider = Provider<FirebaseAuthService>(
  (ref) => FirebaseAuthService(),
);

final imageServiceProvider = Provider<ImageService>(
  (ref) => ImageService(),
);

final aiEnhancementServiceProvider = Provider<AiEnhancementService>(
  (ref) => AiEnhancementService(),
);

final exportServiceProvider = Provider<ExportService>(
  (ref) => ExportService(),
);

final localStorageProvider = Provider<LocalStorageService>(
  (ref) => LocalStorageService.instance,
);

// Repository providers
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    authService: ref.watch(firebaseAuthServiceProvider),
    storage: ref.watch(localStorageProvider),
  );
});

final projectRepositoryProvider = Provider<ProjectRepository>((ref) {
  return ProjectRepository(
    imageService: ref.watch(imageServiceProvider),
    storage: ref.watch(localStorageProvider),
  );
});

// Current user model
final currentUserProvider = FutureProvider<UserModel?>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  if (auth == null) return null;
  return ref.read(authRepositoryProvider).getCurrentUser();
});

// Premium status
final isPremiumProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider).valueOrNull;
  return user?.isPremiumActive ?? false;
});
