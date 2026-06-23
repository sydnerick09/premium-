sealed class AppException implements Exception {
  const AppException(this.message, {this.code});
  final String message;
  final String? code;

  @override
  String toString() => message;
}

class AuthException extends AppException {
  const AuthException(super.message, {super.code});
}

class NetworkException extends AppException {
  const NetworkException(super.message, {super.code});
}

class StorageException extends AppException {
  const StorageException(super.message, {super.code});
}

class ImageProcessingException extends AppException {
  const ImageProcessingException(super.message, {super.code});
}

class PermissionException extends AppException {
  const PermissionException(super.message, {super.code});
}

class PremiumRequiredException extends AppException {
  const PremiumRequiredException(super.message, {super.code});
}

class ValidationException extends AppException {
  const ValidationException(super.message, {super.code});
}

class CloudException extends AppException {
  const CloudException(super.message, {super.code});
}

class ExportException extends AppException {
  const ExportException(super.message, {super.code});
}

// Firebase auth error mapper
String mapFirebaseAuthError(String code) {
  return switch (code) {
    'user-not-found' => 'No account found with this email.',
    'wrong-password' => 'Incorrect password. Please try again.',
    'email-already-in-use' => 'An account already exists with this email.',
    'weak-password' => 'Password is too weak. Use at least 8 characters.',
    'invalid-email' => 'Please enter a valid email address.',
    'too-many-requests' => 'Too many attempts. Please try again later.',
    'user-disabled' => 'This account has been disabled. Contact support.',
    'network-request-failed' => 'No internet connection. Please check your network.',
    'requires-recent-login' => 'Please sign in again to complete this action.',
    'operation-not-allowed' => 'This sign-in method is not enabled.',
    'account-exists-with-different-credential' =>
      'An account exists with a different sign-in method.',
    _ => 'An unexpected error occurred. Please try again.',
  };
}
