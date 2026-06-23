import 'package:permission_handler/permission_handler.dart';

class AppPermissionHandler {
  AppPermissionHandler._();

  static Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.request();
    return status == PermissionStatus.granted;
  }

  static Future<bool> requestGalleryPermission() async {
    // Android 13+ uses granular media permissions
    if (await _isAndroid13OrAbove()) {
      final status = await Permission.photos.request();
      return status == PermissionStatus.granted ||
          status == PermissionStatus.limited;
    } else {
      final status = await Permission.storage.request();
      return status == PermissionStatus.granted;
    }
  }

  static Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status == PermissionStatus.granted;
  }

  static Future<bool> isCameraGranted() async {
    return await Permission.camera.isGranted;
  }

  static Future<bool> isGalleryGranted() async {
    if (await _isAndroid13OrAbove()) {
      return await Permission.photos.isGranted ||
          await Permission.photos.isLimited;
    }
    return await Permission.storage.isGranted;
  }

  static Future<Map<String, bool>> checkAllPermissions() async {
    return {
      'camera': await isCameraGranted(),
      'gallery': await isGalleryGranted(),
      'notification': await Permission.notification.isGranted,
    };
  }

  static Future<bool> requestAllRequiredPermissions() async {
    final camera = await requestCameraPermission();
    final gallery = await requestGalleryPermission();
    return camera && gallery;
  }

  static void openSettings() => openAppSettings();

  static Future<bool> _isAndroid13OrAbove() async {
    // photo_manager handles this internally but we check for permission handler
    try {
      return await Permission.photos.status != PermissionStatus.denied ||
          await Permission.photos.isDenied;
    } catch (_) {
      return false;
    }
  }
}
