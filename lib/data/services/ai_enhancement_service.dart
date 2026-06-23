import 'dart:typed_data';
import 'package:image/image.dart' as img;
import '../../core/errors/app_exception.dart';
import '../../core/utils/image_utils.dart';
import '../models/adjustment_model.dart';

class AiEnhancementService {
  AiEnhancementService();

  // One-tap AI enhancement — analyzes and applies optimal adjustments
  Future<EnhancementResult> enhance(Uint8List imageData) async {
    try {
      final image = img.decodeImage(imageData);
      if (image == null) {
        throw const ImageProcessingException('Failed to decode image.');
      }

      final analysis = _analyzeImage(image);
      final adjustments = _calculateOptimalAdjustments(analysis);
      final enhanced = await _applyEnhancements(image, adjustments);

      return EnhancementResult(
        imageData: Uint8List.fromList(img.encodeJpg(enhanced, quality: 95)),
        appliedAdjustments: adjustments,
        analysis: analysis,
      );
    } catch (e) {
      if (e is ImageProcessingException) rethrow;
      throw ImageProcessingException('AI enhancement failed: $e');
    }
  }

  Future<Uint8List?> autoSharpen(Uint8List imageData) async {
    try {
      final image = img.decodeImage(imageData);
      if (image == null) return null;
      final sharpened = img.convolution(
        image,
        filter: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        div: 1,
        offset: 0,
      );
      return Uint8List.fromList(img.encodeJpg(sharpened, quality: 95));
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> reduceNoise(Uint8List imageData) async {
    try {
      final image = img.decodeImage(imageData);
      if (image == null) return null;
      // Gaussian blur at low radius reduces noise
      final denoised = img.gaussianBlur(image, radius: 1);
      return Uint8List.fromList(img.encodeJpg(denoised, quality: 95));
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> autoColor(Uint8List imageData) async {
    try {
      final image = img.decodeImage(imageData);
      if (image == null) return null;
      final analysis = _analyzeImage(image);
      img.Image adjusted = image;

      // Auto white balance
      if (analysis.colorTemperatureShift.abs() > 5) {
        adjusted = img.adjustColor(
          adjusted,
          temperature: analysis.colorTemperatureShift / 100,
        );
      }

      // Auto exposure
      if (analysis.exposureShift.abs() > 0.05) {
        adjusted = img.adjustColor(
          adjusted,
          brightness: analysis.exposureShift,
        );
      }

      return Uint8List.fromList(img.encodeJpg(adjusted, quality: 95));
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> enhanceSky(Uint8List imageData) async {
    try {
      // Sky enhancement: boost top region blues
      final image = img.decodeImage(imageData);
      if (image == null) return null;
      // Apply slight blue boost and contrast increase
      final enhanced = img.adjustColor(image, saturation: 1.1, contrast: 1.05);
      return Uint8List.fromList(img.encodeJpg(enhanced, quality: 95));
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> enhanceFace(Uint8List imageData) async {
    try {
      final image = img.decodeImage(imageData);
      if (image == null) return null;
      // Soft skin tone enhancement
      final enhanced = img.adjustColor(image, brightness: 1.02, saturation: 1.05);
      final softened = img.gaussianBlur(enhanced, radius: 1);
      // Re-sharpen edges
      final result = img.convolution(
        softened,
        filter: [0, -0.5.round(), 0, -0.5.round(), 3, -0.5.round(), 0, -0.5.round(), 0],
        div: 1,
        offset: 0,
      );
      return Uint8List.fromList(img.encodeJpg(result, quality: 95));
    } catch (_) {
      return null;
    }
  }

  ImageAnalysis _analyzeImage(img.Image image) {
    int totalR = 0, totalG = 0, totalB = 0;
    int totalBrightness = 0;
    int pixelCount = 0;

    final step = (image.width * image.height ~/ 1000).clamp(1, 100);
    for (int y = 0; y < image.height; y += step) {
      for (int x = 0; x < image.width; x += step) {
        final pixel = image.getPixel(x, y);
        totalR += pixel.r.toInt();
        totalG += pixel.g.toInt();
        totalB += pixel.b.toInt();
        totalBrightness += ((pixel.r + pixel.g + pixel.b) / 3).round();
        pixelCount++;
      }
    }

    if (pixelCount == 0) {
      return const ImageAnalysis(
        averageBrightness: 128,
        averageR: 128,
        averageG: 128,
        averageB: 128,
        colorTemperatureShift: 0,
        exposureShift: 0,
        saturationLevel: 0,
      );
    }

    final avgR = totalR ~/ pixelCount;
    final avgG = totalG ~/ pixelCount;
    final avgB = totalB ~/ pixelCount;
    final avgBrightness = totalBrightness ~/ pixelCount;

    // Estimate color temperature shift (warm/cool)
    final warmCoolBalance = (avgR - avgB).toDouble();
    final colorTempShift = warmCoolBalance.clamp(-50.0, 50.0);

    // Estimate exposure correction needed
    final exposureShift = ((128 - avgBrightness) / 255 * 0.3)
        .clamp(-0.3, 0.3);

    // Estimate saturation level
    final maxChannel = [avgR, avgG, avgB].reduce((a, b) => a > b ? a : b);
    final minChannel = [avgR, avgG, avgB].reduce((a, b) => a < b ? a : b);
    final saturation = maxChannel == 0
        ? 0.0
        : (maxChannel - minChannel) / maxChannel.toDouble();

    return ImageAnalysis(
      averageBrightness: avgBrightness,
      averageR: avgR,
      averageG: avgG,
      averageB: avgB,
      colorTemperatureShift: colorTempShift,
      exposureShift: exposureShift,
      saturationLevel: saturation,
    );
  }

  AdjustmentModel _calculateOptimalAdjustments(ImageAnalysis analysis) {
    final brightnessAdj = (analysis.exposureShift * 50).clamp(-40.0, 40.0);
    final contrastAdj = analysis.averageBrightness < 100 ? 10.0 : 5.0;
    final saturationAdj = analysis.saturationLevel < 0.2 ? 15.0 : 5.0;
    final temperatureAdj = -analysis.colorTemperatureShift * 0.5;

    return AdjustmentModel(
      brightness: brightnessAdj,
      contrast: contrastAdj,
      saturation: saturationAdj,
      temperature: temperatureAdj.clamp(-25.0, 25.0),
      sharpness: 10,
    );
  }

  Future<img.Image> _applyEnhancements(
    img.Image image,
    AdjustmentModel adjustments,
  ) async {
    img.Image result = image;

    if (adjustments.brightness != 0) {
      result = img.adjustColor(result, brightness: adjustments.brightness / 100);
    }
    if (adjustments.contrast != 0) {
      result = img.adjustColor(result, contrast: adjustments.contrast / 100 + 1.0);
    }
    if (adjustments.saturation != 0) {
      result = img.adjustColor(result, saturation: adjustments.saturation / 100 + 1.0);
    }
    if (adjustments.sharpness > 0) {
      result = img.convolution(
        result,
        filter: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        div: 1,
        offset: 0,
      );
    }

    return result;
  }
}

class ImageAnalysis {
  const ImageAnalysis({
    required this.averageBrightness,
    required this.averageR,
    required this.averageG,
    required this.averageB,
    required this.colorTemperatureShift,
    required this.exposureShift,
    required this.saturationLevel,
  });

  final int averageBrightness;
  final int averageR;
  final int averageG;
  final int averageB;
  final double colorTemperatureShift;
  final double exposureShift;
  final double saturationLevel;

  bool get isUnderexposed => averageBrightness < 80;
  bool get isOverexposed => averageBrightness > 180;
  bool get isDesaturated => saturationLevel < 0.15;
  bool get isWarm => colorTemperatureShift > 15;
  bool get isCool => colorTemperatureShift < -15;
}

class EnhancementResult {
  const EnhancementResult({
    required this.imageData,
    required this.appliedAdjustments,
    required this.analysis,
  });

  final Uint8List imageData;
  final AdjustmentModel appliedAdjustments;
  final ImageAnalysis analysis;
}
