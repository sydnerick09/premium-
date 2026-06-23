import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';
import '../models/project_model.dart';
import '../services/image_service.dart';
import '../services/local_storage_service.dart';

class ProjectRepository {
  ProjectRepository({
    required ImageService imageService,
    required LocalStorageService storage,
    FirebaseFirestore? firestore,
  })  : _imageService = imageService,
        _storage = storage,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final ImageService _imageService;
  final LocalStorageService _storage;
  final FirebaseFirestore _firestore;
  final _uuid = const Uuid();

  Future<ProjectModel> createProject({
    required String userId,
    required String imagePath,
    String? title,
    int width = 0,
    int height = 0,
    int fileSizeBytes = 0,
  }) async {
    final id = _uuid.v4();
    final project = ProjectModel(
      id: id,
      userId: userId,
      originalImagePath: imagePath,
      title: title ?? 'Project ${DateTime.now().day}/${DateTime.now().month}',
      width: width,
      height: height,
      fileSizeBytes: fileSizeBytes,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    await _storage.saveProject(project);
    _syncToCloud(project);
    return project;
  }

  Future<ProjectModel> updateProject(ProjectModel project) async {
    final updated = project.copyWith(updatedAt: DateTime.now());
    await _storage.saveProject(updated);
    _syncToCloud(updated);
    return updated;
  }

  Future<void> deleteProject(String projectId) async {
    final project = _storage.getProject(projectId);
    if (project != null) {
      await _imageService.deleteFile(project.originalImagePath);
      if (project.editedImagePath != null) {
        await _imageService.deleteFile(project.editedImagePath!);
      }
      if (project.thumbnailPath != null) {
        await _imageService.deleteFile(project.thumbnailPath!);
      }
    }
    await _storage.deleteProject(projectId);
    _deleteFromCloud(projectId);
  }

  List<ProjectModel> getAllProjects() => _storage.getCachedProjects();

  List<ProjectModel> getFavoriteProjects() => getAllProjects()
      .where((p) => p.isFavorite)
      .toList();

  List<ProjectModel> getRecentProjects({int limit = 10}) =>
      getAllProjects().take(limit).toList();

  ProjectModel? getProject(String id) => _storage.getProject(id);

  Future<ProjectModel> toggleFavorite(ProjectModel project) async {
    final updated = project.copyWith(isFavorite: !project.isFavorite);
    if (updated.isFavorite) {
      await _storage.addFavorite(project.id);
    } else {
      await _storage.removeFavorite(project.id);
    }
    return updateProject(updated);
  }

  Future<String> saveEditedImage(
    String projectId,
    Uint8List imageData,
  ) async {
    final savedPath = await _imageService.saveToProjectsDir(
      imageData,
      extension: 'jpg',
    );
    return savedPath;
  }

  Future<String> saveThumbnail(
    String projectId,
    Uint8List thumbnailData,
  ) async {
    return _imageService.saveThumbnail(thumbnailData, projectId);
  }

  // Cloud sync (fire and forget)
  void _syncToCloud(ProjectModel project) {
    _firestore
        .collection('projects')
        .doc(project.id)
        .set(project.toFirestore(), SetOptions(merge: true))
        .catchError((_) {}); // Non-blocking
  }

  void _deleteFromCloud(String projectId) {
    _firestore
        .collection('projects')
        .doc(projectId)
        .delete()
        .catchError((_) {});
  }

  Stream<List<ProjectModel>> watchUserProjects(String userId) {
    return _firestore
        .collection('projects')
        .where('userId', isEqualTo: userId)
        .orderBy('updatedAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snap) => snap.docs.map(ProjectModel.fromFirestore).toList());
  }
}
