import 'dart:io';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';
import '../../core/errors/app_exception.dart';
import '../../core/utils/permission_handler.dart';

class ImageService {
  ImageService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;
  final _uuid = const Uuid();

  Future<File?> pickFromCamera() async {
    final hasPermission = await AppPermissionHandler.requestCameraPermission();
    if (!hasPermission) {
      throw const PermissionException(
        'Camera permission is required to take photos.',
      );
    }

    try {
      final xFile = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 100,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (xFile == null) return null;
      return await _saveToTemp(File(xFile.path));
    } catch (e) {
      throw ImageProcessingException('Failed to capture photo: $e');
    }
  }

  Future<File?> pickFromGallery() async {
    final hasPermission = await AppPermissionHandler.requestGalleryPermission();
    if (!hasPermission) {
      throw const PermissionException(
        'Gallery permission is required to select photos.',
      );
    }

    try {
      final xFile = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 100,
      );
      if (xFile == null) return null;
      return await _saveToTemp(File(xFile.path));
    } catch (e) {
      throw ImageProcessingException('Failed to pick image: $e');
    }
  }

  Future<List<File>> pickMultipleFromGallery({int limit = 20}) async {
    final hasPermission = await AppPermissionHandler.requestGalleryPermission();
    if (!hasPermission) {
      throw const PermissionException(
        'Gallery permission is required to select photos.',
      );
    }

    try {
      final xFiles = await _picker.pickMultiImage(imageQuality: 100, limit: limit);
      final files = <File>[];
      for (final xFile in xFiles) {
        final file = await _saveToTemp(File(xFile.path));
        files.add(file);
      }
      return files;
    } catch (e) {
      throw ImageProcessingException('Failed to pick images: $e');
    }
  }

  Future<List<AssetEntity>> getGalleryAssets({
    int page = 0,
    int size = 60,
  }) async {
    final hasPermission = await AppPermissionHandler.requestGalleryPermission();
    if (!hasPermission) return [];

    try {
      final albums = await PhotoManager.getAssetPathList(
        type: RequestType.image,
        onlyAll: true,
      );
      if (albums.isEmpty) return [];
      return await albums.first.getAssetListPaged(page: page, size: size);
    } catch (e) {
      return [];
    }
  }

  Future<File?> getFileFromAsset(AssetEntity asset) async {
    try {
      return await asset.file;
    } catch (e) {
      return null;
    }
  }

  Future<Uint8List?> getThumbnail(
    AssetEntity asset, {
    int size = 200,
    int quality = 80,
  }) async {
    try {
      return await asset.thumbnailDataWithSize(
        ThumbnailSize(size, size),
        quality: quality,
      );
    } catch (e) {
      return null;
    }
  }

  Future<String> saveToProjectsDir(
    Uint8List data, {
    String extension = 'jpg',
  }) async {
    final dir = await _getProjectsDirectory();
    final filename = '${_uuid.v4()}.$extension';
    final file = File(path.join(dir.path, filename));
    await file.writeAsBytes(data);
    return file.path;
  }

  Future<String> saveThumbnail(
    Uint8List data,
    String projectId,
  ) async {
    final dir = await _getThumbnailDirectory();
    final file = File(path.join(dir.path, '${projectId}_thumb.jpg'));
    await file.writeAsBytes(data);
    return file.path;
  }

  Future<void> deleteFile(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) await file.delete();
    } catch (_) {}
  }

  Future<void> clearTempFiles() async {
    try {
      final dir = await _getTempDirectory();
      final files = dir.listSync();
      for (final f in files) {
        if (f is File) await f.delete();
      }
    } catch (_) {}
  }

  Future<File> _saveToTemp(File source) async {
    final dir = await _getTempDirectory();
    final ext = path.extension(source.path);
    final dest = File(path.join(dir.path, '${_uuid.v4()}$ext'));
    return await source.copy(dest.path);
  }

  Future<Directory> _getTempDirectory() async {
    final dir = await getTemporaryDirectory();
    final ericDir = Directory(path.join(dir.path, 'erick_temp'));
    if (!await ericDir.exists()) await ericDir.create(recursive: true);
    return ericDir;
  }

  Future<Directory> _getProjectsDirectory() async {
    final dir = await getApplicationDocumentsDirectory();
    final projectsDir = Directory(path.join(dir.path, 'erick_projects'));
    if (!await projectsDir.exists()) await projectsDir.create(recursive: true);
    return projectsDir;
  }

  Future<Directory> _getThumbnailDirectory() async {
    final dir = await getApplicationDocumentsDirectory();
    final thumbDir = Directory(path.join(dir.path, 'erick_thumbnails'));
    if (!await thumbDir.exists()) await thumbDir.create(recursive: true);
    return thumbDir;
  }

  Future<bool> fileExists(String filePath) async {
    return File(filePath).exists();
  }

  Future<int> getFileSize(String filePath) async {
    try {
      return await File(filePath).length();
    } catch (_) {
      return 0;
    }
  }
}
