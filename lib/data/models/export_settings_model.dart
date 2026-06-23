enum ExportFormat { jpg, png, webp }

enum ExportQuality { low, medium, high, maximum }

enum ExportResolution { original, hd, fullHd, fourK }

class ExportSettingsModel {
  const ExportSettingsModel({
    this.format = ExportFormat.jpg,
    this.quality = ExportQuality.high,
    this.resolution = ExportResolution.original,
    this.customWidth,
    this.customHeight,
    this.maintainAspectRatio = true,
    this.includeMetadata = true,
    this.stripExif = false,
    this.addWatermark = false,
    this.watermarkText,
    this.saveToGallery = true,
    this.shareAfterExport = false,
    this.cloudBackup = false,
    this.filename,
  });

  final ExportFormat format;
  final ExportQuality quality;
  final ExportResolution resolution;
  final int? customWidth;
  final int? customHeight;
  final bool maintainAspectRatio;
  final bool includeMetadata;
  final bool stripExif;
  final bool addWatermark;
  final String? watermarkText;
  final bool saveToGallery;
  final bool shareAfterExport;
  final bool cloudBackup;
  final String? filename;

  int get qualityValue => switch (quality) {
        ExportQuality.low => 60,
        ExportQuality.medium => 80,
        ExportQuality.high => 95,
        ExportQuality.maximum => 100,
      };

  String get formatExtension => switch (format) {
        ExportFormat.jpg => 'jpg',
        ExportFormat.png => 'png',
        ExportFormat.webp => 'webp',
      };

  String get formatMimeType => switch (format) {
        ExportFormat.jpg => 'image/jpeg',
        ExportFormat.png => 'image/png',
        ExportFormat.webp => 'image/webp',
      };

  String get qualityLabel => switch (quality) {
        ExportQuality.low => 'Low (60%)',
        ExportQuality.medium => 'Medium (80%)',
        ExportQuality.high => 'High (95%)',
        ExportQuality.maximum => 'Maximum (100%)',
      };

  String get resolutionLabel => switch (resolution) {
        ExportResolution.original => 'Original',
        ExportResolution.hd => 'HD (1280px)',
        ExportResolution.fullHd => 'Full HD (1920px)',
        ExportResolution.fourK => '4K (3840px)',
      };

  int? get maxDimension => switch (resolution) {
        ExportResolution.original => null,
        ExportResolution.hd => 1280,
        ExportResolution.fullHd => 1920,
        ExportResolution.fourK => 3840,
      };

  ExportSettingsModel copyWith({
    ExportFormat? format,
    ExportQuality? quality,
    ExportResolution? resolution,
    int? customWidth,
    int? customHeight,
    bool? maintainAspectRatio,
    bool? includeMetadata,
    bool? stripExif,
    bool? addWatermark,
    String? watermarkText,
    bool? saveToGallery,
    bool? shareAfterExport,
    bool? cloudBackup,
    String? filename,
  }) {
    return ExportSettingsModel(
      format: format ?? this.format,
      quality: quality ?? this.quality,
      resolution: resolution ?? this.resolution,
      customWidth: customWidth ?? this.customWidth,
      customHeight: customHeight ?? this.customHeight,
      maintainAspectRatio: maintainAspectRatio ?? this.maintainAspectRatio,
      includeMetadata: includeMetadata ?? this.includeMetadata,
      stripExif: stripExif ?? this.stripExif,
      addWatermark: addWatermark ?? this.addWatermark,
      watermarkText: watermarkText ?? this.watermarkText,
      saveToGallery: saveToGallery ?? this.saveToGallery,
      shareAfterExport: shareAfterExport ?? this.shareAfterExport,
      cloudBackup: cloudBackup ?? this.cloudBackup,
      filename: filename ?? this.filename,
    );
  }

  Map<String, dynamic> toMap() => {
        'format': format.name,
        'quality': quality.name,
        'resolution': resolution.name,
        'customWidth': customWidth,
        'customHeight': customHeight,
        'maintainAspectRatio': maintainAspectRatio,
        'includeMetadata': includeMetadata,
        'stripExif': stripExif,
        'addWatermark': addWatermark,
        'watermarkText': watermarkText,
        'saveToGallery': saveToGallery,
        'shareAfterExport': shareAfterExport,
        'cloudBackup': cloudBackup,
        'filename': filename,
      };

  factory ExportSettingsModel.fromMap(Map<String, dynamic> map) {
    return ExportSettingsModel(
      format: ExportFormat.values.firstWhere(
        (e) => e.name == map['format'],
        orElse: () => ExportFormat.jpg,
      ),
      quality: ExportQuality.values.firstWhere(
        (e) => e.name == map['quality'],
        orElse: () => ExportQuality.high,
      ),
      resolution: ExportResolution.values.firstWhere(
        (e) => e.name == map['resolution'],
        orElse: () => ExportResolution.original,
      ),
      customWidth: map['customWidth'] as int?,
      customHeight: map['customHeight'] as int?,
      maintainAspectRatio: map['maintainAspectRatio'] as bool? ?? true,
      includeMetadata: map['includeMetadata'] as bool? ?? true,
      stripExif: map['stripExif'] as bool? ?? false,
      addWatermark: map['addWatermark'] as bool? ?? false,
      watermarkText: map['watermarkText'] as String?,
      saveToGallery: map['saveToGallery'] as bool? ?? true,
      shareAfterExport: map['shareAfterExport'] as bool? ?? false,
      cloudBackup: map['cloudBackup'] as bool? ?? false,
      filename: map['filename'] as String?,
    );
  }
}
