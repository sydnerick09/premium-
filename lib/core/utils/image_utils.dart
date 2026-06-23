import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:image/image.dart' as img;
import 'package:flutter/material.dart';
import 'package:path/path.dart' as path;

class ImageUtils {
  ImageUtils._();

  static const List<String> supportedExtensions = [
    'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'gif',
  ];

  static bool isSupportedFormat(String filePath) {
    final ext = path.extension(filePath).toLowerCase().replaceAll('.', '');
    return supportedExtensions.contains(ext);
  }

  static Future<Uint8List?> resizeImage(
    Uint8List imageData, {
    required int maxWidth,
    required int maxHeight,
    int quality = 90,
  }) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;

    final resized = img.copyResize(
      image,
      width: math.min(image.width, maxWidth),
      height: math.min(image.height, maxHeight),
      maintainAspect: true,
      interpolation: img.Interpolation.linear,
    );

    return Uint8List.fromList(img.encodeJpg(resized, quality: quality));
  }

  static Future<Uint8List?> applyBrightness(
    Uint8List imageData,
    double value,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final adjusted = img.adjustColor(image, brightness: value / 100);
    return Uint8List.fromList(img.encodeJpg(adjusted, quality: 95));
  }

  static Future<Uint8List?> applyContrast(
    Uint8List imageData,
    double value,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final adjusted = img.adjustColor(image, contrast: value / 100 + 1.0);
    return Uint8List.fromList(img.encodeJpg(adjusted, quality: 95));
  }

  static Future<Uint8List?> applySaturation(
    Uint8List imageData,
    double value,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final adjusted = img.adjustColor(image, saturation: value / 100 + 1.0);
    return Uint8List.fromList(img.encodeJpg(adjusted, quality: 95));
  }

  static Future<Uint8List?> applyGrayscale(Uint8List imageData) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final grayscale = img.grayscale(image);
    return Uint8List.fromList(img.encodeJpg(grayscale, quality: 95));
  }

  static Future<Uint8List?> applyVignette(
    Uint8List imageData,
    double intensity,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final vignetted = img.vignette(image, start: 0.3, end: intensity / 100);
    return Uint8List.fromList(img.encodeJpg(vignetted, quality: 95));
  }

  static Future<Uint8List?> applySharpness(
    Uint8List imageData,
    double amount,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final sharpened = img.convolution(
      image,
      filter: [0, -amount.toInt(), 0, -amount.toInt(), 1 + 4 * amount.toInt(), -amount.toInt(), 0, -amount.toInt(), 0],
      div: 1,
      offset: 0,
    );
    return Uint8List.fromList(img.encodeJpg(sharpened, quality: 95));
  }

  static Future<Uint8List?> applyGaussianBlur(
    Uint8List imageData,
    double radius,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final blurred = img.gaussianBlur(image, radius: radius.toInt().clamp(1, 25));
    return Uint8List.fromList(img.encodeJpg(blurred, quality: 95));
  }

  static Future<Uint8List?> flipHorizontal(Uint8List imageData) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final flipped = img.flipHorizontal(image);
    return Uint8List.fromList(img.encodeJpg(flipped, quality: 95));
  }

  static Future<Uint8List?> flipVertical(Uint8List imageData) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final flipped = img.flipVertical(image);
    return Uint8List.fromList(img.encodeJpg(flipped, quality: 95));
  }

  static Future<Uint8List?> rotate(Uint8List imageData, double degrees) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final rotated = img.copyRotate(image, angle: degrees);
    return Uint8List.fromList(img.encodeJpg(rotated, quality: 95));
  }

  static Future<Uint8List?> crop(
    Uint8List imageData, {
    required int x,
    required int y,
    required int width,
    required int height,
  }) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final cropped = img.copyCrop(
      image,
      x: x.clamp(0, image.width),
      y: y.clamp(0, image.height),
      width: width.clamp(1, image.width - x),
      height: height.clamp(1, image.height - y),
    );
    return Uint8List.fromList(img.encodeJpg(cropped, quality: 95));
  }

  static Future<Uint8List?> applySepia(Uint8List imageData) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final sepia = img.sepia(image);
    return Uint8List.fromList(img.encodeJpg(sepia, quality: 95));
  }

  static Future<Uint8List?> applyNoise(
    Uint8List imageData,
    double amount,
  ) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;
    final noisy = img.addTextWatermark(image, ''); // placeholder
    _ = noisy;
    // Use noise simulation via color jitter
    final result = img.adjustColor(image, gamma: 1.0 + amount / 200);
    return Uint8List.fromList(img.encodeJpg(result, quality: 95));
  }

  static Future<Size> getImageDimensions(Uint8List imageData) async {
    final image = img.decodeImage(imageData);
    if (image == null) return Size.zero;
    return Size(image.width.toDouble(), image.height.toDouble());
  }

  static Future<int> getFileSizeKB(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) return 0;
    return (await file.length()) ~/ 1024;
  }

  static Future<Uint8List?> exportAs(
    Uint8List imageData, {
    required String format,
    required int quality,
  }) async {
    final image = img.decodeImage(imageData);
    if (image == null) return null;

    return switch (format.toLowerCase()) {
      'jpg' || 'jpeg' =>
        Uint8List.fromList(img.encodeJpg(image, quality: quality)),
      'png' => Uint8List.fromList(img.encodePng(image)),
      'webp' => Uint8List.fromList(img.encodeJpg(image, quality: quality)),
      _ => Uint8List.fromList(img.encodeJpg(image, quality: quality)),
    };
  }

  static Color dominantColor(Uint8List imageData) {
    final image = img.decodeImage(imageData);
    if (image == null) return Colors.grey;

    int r = 0, g = 0, b = 0;
    final pixels = image.width * image.height;
    final step = math.max(1, pixels ~/ 1000);

    int count = 0;
    for (int i = 0; i < pixels; i += step) {
      final x = i % image.width;
      final y = i ~/ image.width;
      final pixel = image.getPixel(x, y);
      r += pixel.r.toInt();
      g += pixel.g.toInt();
      b += pixel.b.toInt();
      count++;
    }

    if (count == 0) return Colors.grey;
    return Color.fromRGBO(r ~/ count, g ~/ count, b ~/ count, 1);
  }
}
