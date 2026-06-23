import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/editor/screens/editor_screen.dart';
import '../../features/filters/screens/filters_screen.dart';
import '../../features/adjustments/screens/adjustments_screen.dart';
import '../../features/beauty/screens/beauty_screen.dart';
import '../../features/layers/screens/layers_screen.dart';
import '../../features/creative/screens/creative_screen.dart';
import '../../features/export/screens/export_screen.dart';
import '../../features/premium/screens/premium_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/legal/screens/privacy_policy_screen.dart';
import '../../features/legal/screens/terms_screen.dart';
import '../../shared/providers/app_provider.dart';

final _rootKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final isLoggedIn = authState.valueOrNull != null;
      final onSplash = state.matchedLocation == AppRoutes.splash;
      final onOnboarding = state.matchedLocation == AppRoutes.onboarding;
      final onAuth = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register;

      if (isLoading) return null;
      if (onSplash || onOnboarding) return null;
      if (!isLoggedIn && !onAuth) return AppRoutes.login;
      if (isLoggedIn && onAuth) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
        routes: [
          GoRoute(
            path: 'register',
            builder: (_, __) => const RegisterScreen(),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (_, __) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.editor,
        builder: (context, state) {
          final imagePath = state.extra as String?;
          return EditorScreen(imagePath: imagePath);
        },
        routes: [
          GoRoute(
            path: 'filters',
            builder: (_, __) => const FiltersScreen(),
          ),
          GoRoute(
            path: 'adjustments',
            builder: (_, __) => const AdjustmentsScreen(),
          ),
          GoRoute(
            path: 'beauty',
            builder: (_, __) => const BeautyScreen(),
          ),
          GoRoute(
            path: 'layers',
            builder: (_, __) => const LayersScreen(),
          ),
          GoRoute(
            path: 'creative',
            builder: (_, __) => const CreativeScreen(),
          ),
          GoRoute(
            path: 'export',
            builder: (_, __) => const ExportScreen(),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.premium,
        builder: (_, __) => const PremiumScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (_, __) => const SettingsScreen(),
        routes: [
          GoRoute(
            path: 'privacy',
            builder: (_, __) => const PrivacyPolicyScreen(),
          ),
          GoRoute(
            path: 'terms',
            builder: (_, __) => const TermsScreen(),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.privacyPolicy,
        builder: (_, __) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: AppRoutes.terms,
        builder: (_, __) => const TermsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(state.error?.message ?? 'Unknown error'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String editor = '/editor';
  static const String filters = '/editor/filters';
  static const String adjustments = '/editor/adjustments';
  static const String beauty = '/editor/beauty';
  static const String layers = '/editor/layers';
  static const String creative = '/editor/creative';
  static const String exportScreen = '/editor/export';
  static const String premium = '/premium';
  static const String settings = '/settings';
  static const String privacyPolicy = '/privacy-policy';
  static const String terms = '/terms';
}
