import 'package:cloud_firestore/cloud_firestore.dart';
import 'layer_model.dart';
import 'adjustment_model.dart';

enum ProjectStatus { draft, processing, completed, exported }

class ProjectModel {
  const ProjectModel({
    required this.id,
    required this.userId,
    required this.originalImagePath,
    this.editedImagePath,
    this.thumbnailPath,
    this.title = 'Untitled Project',
    this.layers = const [],
    this.adjustments,
    this.appliedFilterId,
    this.appliedFilterName,
    this.status = ProjectStatus.draft,
    this.isFavorite = false,
    this.tags = const [],
    this.width = 0,
    this.height = 0,
    this.fileSizeBytes = 0,
    this.cloudUrl,
    this.cloudThumbUrl,
    this.isSynced = false,
    this.createdAt,
    this.updatedAt,
    this.exportedAt,
  });

  final String id;
  final String userId;
  final String originalImagePath;
  final String? editedImagePath;
  final String? thumbnailPath;
  final String title;
  final List<LayerModel> layers;
  final AdjustmentModel? adjustments;
  final String? appliedFilterId;
  final String? appliedFilterName;
  final ProjectStatus status;
  final bool isFavorite;
  final List<String> tags;
  final int width;
  final int height;
  final int fileSizeBytes;
  final String? cloudUrl;
  final String? cloudThumbUrl;
  final bool isSynced;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? exportedAt;

  String get resolution => '${width}x$height';
  double get fileSizeMB => fileSizeBytes / (1024 * 1024);
  bool get hasEdits => layers.isNotEmpty || adjustments != null;
  String get currentImagePath => editedImagePath ?? originalImagePath;

  ProjectModel copyWith({
    String? editedImagePath,
    String? thumbnailPath,
    String? title,
    List<LayerModel>? layers,
    AdjustmentModel? adjustments,
    String? appliedFilterId,
    String? appliedFilterName,
    ProjectStatus? status,
    bool? isFavorite,
    List<String>? tags,
    int? width,
    int? height,
    int? fileSizeBytes,
    String? cloudUrl,
    String? cloudThumbUrl,
    bool? isSynced,
    DateTime? updatedAt,
    DateTime? exportedAt,
  }) {
    return ProjectModel(
      id: id,
      userId: userId,
      originalImagePath: originalImagePath,
      editedImagePath: editedImagePath ?? this.editedImagePath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      title: title ?? this.title,
      layers: layers ?? this.layers,
      adjustments: adjustments ?? this.adjustments,
      appliedFilterId: appliedFilterId ?? this.appliedFilterId,
      appliedFilterName: appliedFilterName ?? this.appliedFilterName,
      status: status ?? this.status,
      isFavorite: isFavorite ?? this.isFavorite,
      tags: tags ?? this.tags,
      width: width ?? this.width,
      height: height ?? this.height,
      fileSizeBytes: fileSizeBytes ?? this.fileSizeBytes,
      cloudUrl: cloudUrl ?? this.cloudUrl,
      cloudThumbUrl: cloudThumbUrl ?? this.cloudThumbUrl,
      isSynced: isSynced ?? this.isSynced,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      exportedAt: exportedAt ?? this.exportedAt,
    );
  }

  factory ProjectModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ProjectModel(
      id: doc.id,
      userId: data['userId'] as String? ?? '',
      originalImagePath: data['originalImagePath'] as String? ?? '',
      editedImagePath: data['editedImagePath'] as String?,
      thumbnailPath: data['thumbnailPath'] as String?,
      title: data['title'] as String? ?? 'Untitled Project',
      appliedFilterId: data['appliedFilterId'] as String?,
      appliedFilterName: data['appliedFilterName'] as String?,
      status: ProjectStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => ProjectStatus.draft,
      ),
      isFavorite: data['isFavorite'] as bool? ?? false,
      tags: List<String>.from(data['tags'] as List? ?? []),
      width: data['width'] as int? ?? 0,
      height: data['height'] as int? ?? 0,
      fileSizeBytes: data['fileSizeBytes'] as int? ?? 0,
      cloudUrl: data['cloudUrl'] as String?,
      cloudThumbUrl: data['cloudThumbUrl'] as String?,
      isSynced: data['isSynced'] as bool? ?? false,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate(),
      exportedAt: (data['exportedAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toFirestore() => {
        'userId': userId,
        'originalImagePath': originalImagePath,
        'editedImagePath': editedImagePath,
        'thumbnailPath': thumbnailPath,
        'title': title,
        'appliedFilterId': appliedFilterId,
        'appliedFilterName': appliedFilterName,
        'status': status.name,
        'isFavorite': isFavorite,
        'tags': tags,
        'width': width,
        'height': height,
        'fileSizeBytes': fileSizeBytes,
        'cloudUrl': cloudUrl,
        'cloudThumbUrl': cloudThumbUrl,
        'isSynced': isSynced,
        'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : null,
        'updatedAt': FieldValue.serverTimestamp(),
        'exportedAt':
            exportedAt != null ? Timestamp.fromDate(exportedAt!) : null,
      };

  Map<String, dynamic> toMap() => {
        'id': id,
        'userId': userId,
        'originalImagePath': originalImagePath,
        'editedImagePath': editedImagePath,
        'thumbnailPath': thumbnailPath,
        'title': title,
        'appliedFilterId': appliedFilterId,
        'appliedFilterName': appliedFilterName,
        'status': status.name,
        'isFavorite': isFavorite,
        'tags': tags,
        'width': width,
        'height': height,
        'fileSizeBytes': fileSizeBytes,
        'cloudUrl': cloudUrl,
        'isSynced': isSynced,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };

  factory ProjectModel.fromMap(Map<String, dynamic> map) => ProjectModel(
        id: map['id'] as String? ?? '',
        userId: map['userId'] as String? ?? '',
        originalImagePath: map['originalImagePath'] as String? ?? '',
        editedImagePath: map['editedImagePath'] as String?,
        thumbnailPath: map['thumbnailPath'] as String?,
        title: map['title'] as String? ?? 'Untitled Project',
        appliedFilterId: map['appliedFilterId'] as String?,
        appliedFilterName: map['appliedFilterName'] as String?,
        status: ProjectStatus.values.firstWhere(
          (e) => e.name == map['status'],
          orElse: () => ProjectStatus.draft,
        ),
        isFavorite: map['isFavorite'] as bool? ?? false,
        tags: List<String>.from(map['tags'] as List? ?? []),
        width: map['width'] as int? ?? 0,
        height: map['height'] as int? ?? 0,
        fileSizeBytes: map['fileSizeBytes'] as int? ?? 0,
        cloudUrl: map['cloudUrl'] as String?,
        isSynced: map['isSynced'] as bool? ?? false,
        createdAt: map['createdAt'] != null
            ? DateTime.tryParse(map['createdAt'] as String)
            : null,
        updatedAt: map['updatedAt'] != null
            ? DateTime.tryParse(map['updatedAt'] as String)
            : null,
      );
}
