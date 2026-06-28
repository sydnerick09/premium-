import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';
import 'package:image/image.dart' as img;
import '../../core/errors/app_exception.dart';
import '../models/export_settings_model.dart';

class ExportService {
  ExportService();

  final _uuid = const Uuid();

  Future<ExportResult> export(
    Uint8List imageData,
    ExportSettingsModel settings,
  ) async {
    try {
      // Decode and potentially resize
      final image = img.decodeImage(imageData);
      if (image == null) throw const ExportException('Failed to decode image.');

      img.Image processed = image;

      // Resize if needed
      if (settings.maxDimension != null) {
        final maxDim = settings.maxDimension!;
        if (image.width > maxDim || image.height > maxDim) {
          processed = img.copyResize(
            image,
            width: image.width > image.height ? maxDim : null,
            height: image.height >= image.width ? maxDim : null,
            maintainAspect: true,
            interpolation: img.Interpolation.linear,
          );
        }
      }

      // Apply custom size if specified
      if (settings.customWidth != null && settings.customHeight != null) {
        processed = img.copyResize(
          image,
          width: settings.customWidth!,
          height: settings.customHeight!,
          maintainAspect: settings.maintainAspectRatio,
        );
      }

      // Add watermark if requested
      if (settings.addWatermark && settings.watermarkText != null) {
        processed = _addTextWatermark(processed, settings.watermarkText!);
      }

      // Encode to requested format
      final encoded = _encode(processed, settings);

      // Generate filename
      final filename = settings.filename ??
          'erick_${DateTime.now().millisecondsSinceEpoch}';
      final fullFilename = '$filename.${settings.formatExtension}';

      String? savedPath;
      if (settings.saveToGallery) {
        savedPath = await _saveToGallery(encoded, fullFilename, settings.formatMimeType);
      }

      // Also save to temp for sharing
      final tempPath = await _saveToTemp(encoded, fullFilename);

      return ExportResult(
        savedPath: savedPath,
        tempPath: tempPath,
        filename: fullFilename,
        fileSize: encoded.length,
        width: processed.width,
        height: processed.height,
      );
    } catch (e) {
      if (e is ExportException) rethrow;
      throw ExportException('Export failed: $e');
    }
  }

  Future<void> shareFile(String filePath) async {
    try {
      await Share.shareXFiles(
        [XFile(filePath)],
        subject: 'Edited with Gweno Editor Pro',
      );
    } catch (e) {
      throw ExportException('Failed to share: $e');
    }
  }

  Future<void> shareToInstagram(String filePath) async {
    try {
      await Share.shareXFiles(
        [XFile(filePath)],
        subject: 'Edited with Gweno Editor Pro',
      );
    } catch (e) {
      throw ExportException('Failed to share to Instagram: $e');
    }
  }

  Uint8List _encode(img.Image image, ExportSettingsModel settings) {
    return switch (settings.format) {
      ExportFormat.jpg =>
        Uint8List.fromList(img.encodeJpg(image, quality: settings.qualityValue)),
      ExportFormat.png => Uint8List.fromList(img.encodePng(image)),
      ExportFormat.webp =>
        Uint8List.fromList(img.encodeJpg(image, quality: settings.qualityValue)),
    };
  }

  img.Image _addTextWatermark(img.Image image, String text) {
    // Draw watermark text in bottom-right corner
    img.drawString(
      image,
      text,
      font: img.arial14,
      x: image.width - (text.length * 8) - 10,
      y: image.height - 24,
      color: img.ColorRgba8(255, 255, 255, 120),
    );
    return image;
  }

  Future<String?> _saveToGallery(
    Uint8List data,
    String filename,
    String mimeType,
  ) async {
    try {
      final result = await ImageGallerySaver.saveImage(
        data,
        quality: 100,
        name: path.basenameWithoutExtension(filename),
        isReturnImagePathOfIOS: false,
      );
      if (result['isSuccess'] == true) {
        return result['filePath'] as String?;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<String> _saveToTemp(Uint8List data, String filename) async {
    final dir = await getTemporaryDirectory();
    final file = File(path.join(dir.path, filename));
    await file.writeAsBytes(data);
    return file.path;
  }

  Future<Size> getImageDimensions(Uint8List data) async {
    final image = img.decodeImage(data);
    if (image == null) return Size.zero;
    return Size(image.width.toDouble(), image.height.toDouble());
  }

  String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class ExportResult {
  const ExportResult({
    this.savedPath,
    required this.tempPath,
    required this.filename,
    required this.fileSize,
    required this.width,
    required this.height,
  });

  final String? savedPath;
  final String tempPath;
  final String filename;
  final int fileSize;
  final int width;
  final int height;

  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  String get resolution => '${width}x$height';
}
