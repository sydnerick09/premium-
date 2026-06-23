import 'package:flutter/material.dart';

enum FilterCategory {
  all,
  vintage,
  cinematic,
  portrait,
  landscape,
  blackAndWhite,
  hdr,
  warm,
  cool,
  custom,
}

class FilterModel {
  const FilterModel({
    required this.id,
    required this.name,
    required this.category,
    this.thumbnailPath,
    this.assetPath,
    this.previewColor,
    this.isPremium = false,
    this.brightness = 0.0,
    this.contrast = 0.0,
    this.saturation = 0.0,
    this.temperature = 0.0,
    this.vignette = 0.0,
    this.grain = 0.0,
    this.fadeAmount = 0.0,
    this.colorMatrix,
    this.lutPath,
    this.isGrayscale = false,
    this.isSepia = false,
  });

  final String id;
  final String name;
  final FilterCategory category;
  final String? thumbnailPath;
  final String? assetPath;
  final Color? previewColor;
  final bool isPremium;
  final double brightness;
  final double contrast;
  final double saturation;
  final double temperature;
  final double vignette;
  final double grain;
  final double fadeAmount;
  final List<double>? colorMatrix;
  final String? lutPath;
  final bool isGrayscale;
  final bool isSepia;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'category': category.name,
        'thumbnailPath': thumbnailPath,
        'isPremium': isPremium,
        'brightness': brightness,
        'contrast': contrast,
        'saturation': saturation,
        'temperature': temperature,
        'vignette': vignette,
        'grain': grain,
        'fadeAmount': fadeAmount,
        'lutPath': lutPath,
        'isGrayscale': isGrayscale,
        'isSepia': isSepia,
      };

  factory FilterModel.fromMap(Map<String, dynamic> map) => FilterModel(
        id: map['id'] as String,
        name: map['name'] as String,
        category: FilterCategory.values.firstWhere(
          (e) => e.name == map['category'],
          orElse: () => FilterCategory.all,
        ),
        thumbnailPath: map['thumbnailPath'] as String?,
        isPremium: map['isPremium'] as bool? ?? false,
        brightness: (map['brightness'] as num?)?.toDouble() ?? 0.0,
        contrast: (map['contrast'] as num?)?.toDouble() ?? 0.0,
        saturation: (map['saturation'] as num?)?.toDouble() ?? 0.0,
        temperature: (map['temperature'] as num?)?.toDouble() ?? 0.0,
        vignette: (map['vignette'] as num?)?.toDouble() ?? 0.0,
        grain: (map['grain'] as num?)?.toDouble() ?? 0.0,
        fadeAmount: (map['fadeAmount'] as num?)?.toDouble() ?? 0.0,
        lutPath: map['lutPath'] as String?,
        isGrayscale: map['isGrayscale'] as bool? ?? false,
        isSepia: map['isSepia'] as bool? ?? false,
      );
}

// Predefined filter catalog — 100+ filters
class FilterCatalog {
  FilterCatalog._();

  static List<FilterModel> get all => [
        ...none,
        ...vintage,
        ...cinematic,
        ...portrait,
        ...blackAndWhite,
        ...warm,
        ...cool,
        ...hdr,
      ];

  static List<FilterModel> get none => [
        const FilterModel(id: 'none', name: 'Original', category: FilterCategory.all),
      ];

  static List<FilterModel> get vintage => [
        const FilterModel(id: 'vintage_01', name: 'Kodak', category: FilterCategory.vintage, saturation: -10, temperature: 15, grain: 20, vignette: 25, fadeAmount: 10),
        const FilterModel(id: 'vintage_02', name: 'Polaroid', category: FilterCategory.vintage, saturation: -20, temperature: 20, grain: 30, vignette: 30, fadeAmount: 20, isSepia: false),
        const FilterModel(id: 'vintage_03', name: '70s Film', category: FilterCategory.vintage, saturation: -15, temperature: 25, grain: 25, vignette: 20, brightness: 5),
        const FilterModel(id: 'vintage_04', name: 'Retro', category: FilterCategory.vintage, saturation: 10, temperature: 10, grain: 15, vignette: 15, fadeAmount: 8),
        const FilterModel(id: 'vintage_05', name: 'Faded', category: FilterCategory.vintage, saturation: -30, temperature: 5, grain: 10, fadeAmount: 30),
        const FilterModel(id: 'vintage_06', name: 'Lomo', category: FilterCategory.vintage, saturation: 20, contrast: 10, vignette: 40, grain: 20),
        const FilterModel(id: 'vintage_07', name: 'Aged', category: FilterCategory.vintage, saturation: -25, temperature: 18, grain: 35, vignette: 25, fadeAmount: 15),
        const FilterModel(id: 'vintage_08', name: 'Cross', category: FilterCategory.vintage, saturation: 30, contrast: 15, temperature: -5, vignette: 20),
        const FilterModel(id: 'vintage_09', name: 'Daguerreotype', category: FilterCategory.vintage, isSepia: true, vignette: 40, grain: 25, contrast: 10, isPremium: true),
        const FilterModel(id: 'vintage_10', name: 'Tintype', category: FilterCategory.vintage, isGrayscale: true, contrast: 20, grain: 30, vignette: 35, isPremium: true),
        const FilterModel(id: 'vintage_11', name: 'Fuji', category: FilterCategory.vintage, saturation: 5, temperature: 8, grain: 8, contrast: 5),
        const FilterModel(id: 'vintage_12', name: 'Ilford', category: FilterCategory.vintage, isGrayscale: true, contrast: 15, grain: 20),
      ];

  static List<FilterModel> get cinematic => [
        const FilterModel(id: 'cinematic_01', name: 'Teal & Orange', category: FilterCategory.cinematic, temperature: -10, saturation: 20, contrast: 15, vignette: 20),
        const FilterModel(id: 'cinematic_02', name: 'Blade Runner', category: FilterCategory.cinematic, temperature: -20, saturation: 15, contrast: 20, vignette: 30, brightness: -5),
        const FilterModel(id: 'cinematic_03', name: 'Matrix', category: FilterCategory.cinematic, temperature: -15, saturation: -10, contrast: 25, vignette: 25),
        const FilterModel(id: 'cinematic_04', name: 'Wes Anderson', category: FilterCategory.cinematic, temperature: 20, saturation: 15, contrast: 5, fadeAmount: 10),
        const FilterModel(id: 'cinematic_05', name: 'Noir', category: FilterCategory.cinematic, isGrayscale: true, contrast: 30, vignette: 40, brightness: -10),
        const FilterModel(id: 'cinematic_06', name: 'Blockbuster', category: FilterCategory.cinematic, saturation: 20, contrast: 15, temperature: 5, vignette: 15),
        const FilterModel(id: 'cinematic_07', name: 'Matte', category: FilterCategory.cinematic, contrast: -10, fadeAmount: 25, saturation: -5),
        const FilterModel(id: 'cinematic_08', name: 'Instagram K2', category: FilterCategory.cinematic, temperature: 10, saturation: -10, contrast: 10, vignette: 20, isPremium: true),
        const FilterModel(id: 'cinematic_09', name: 'Hollywood', category: FilterCategory.cinematic, contrast: 20, saturation: 15, vignette: 15, brightness: 5, isPremium: true),
        const FilterModel(id: 'cinematic_10', name: 'Kubrick', category: FilterCategory.cinematic, isGrayscale: true, contrast: 25, vignette: 30, brightness: -5, isPremium: true),
        const FilterModel(id: 'cinematic_11', name: 'Autumn', category: FilterCategory.cinematic, temperature: 30, saturation: 20, contrast: 10, vignette: 15),
        const FilterModel(id: 'cinematic_12', name: 'Dusk', category: FilterCategory.cinematic, temperature: -25, saturation: 10, contrast: 15, vignette: 30),
        const FilterModel(id: 'cinematic_13', name: 'Summer', category: FilterCategory.cinematic, temperature: 25, saturation: 25, brightness: 5, contrast: 8),
        const FilterModel(id: 'cinematic_14', name: 'Winter', category: FilterCategory.cinematic, temperature: -30, saturation: -15, contrast: 10, brightness: 5),
        const FilterModel(id: 'cinematic_15', name: 'Spring', category: FilterCategory.cinematic, temperature: 10, saturation: 30, brightness: 8, contrast: 5),
      ];

  static List<FilterModel> get portrait => [
        const FilterModel(id: 'portrait_01', name: 'Skin Glow', category: FilterCategory.portrait, brightness: 5, saturation: 5, temperature: 10, contrast: 5),
        const FilterModel(id: 'portrait_02', name: 'Soft Light', category: FilterCategory.portrait, brightness: 8, contrast: -5, saturation: 5, vignette: 10),
        const FilterModel(id: 'portrait_03', name: 'Warm Skin', category: FilterCategory.portrait, temperature: 20, saturation: 10, brightness: 5),
        const FilterModel(id: 'portrait_04', name: 'Natural', category: FilterCategory.portrait, saturation: -5, contrast: 5, brightness: 3),
        const FilterModel(id: 'portrait_05', name: 'Golden Hour', category: FilterCategory.portrait, temperature: 35, saturation: 20, contrast: 10, vignette: 15),
        const FilterModel(id: 'portrait_06', name: 'Studio', category: FilterCategory.portrait, brightness: 10, contrast: 10, saturation: -10, temperature: 5),
        const FilterModel(id: 'portrait_07', name: 'Editorial', category: FilterCategory.portrait, contrast: 20, saturation: -15, brightness: 5, isPremium: true),
        const FilterModel(id: 'portrait_08', name: 'Moody Portrait', category: FilterCategory.portrait, contrast: 15, saturation: -10, shadows: -20, vignette: 25, isPremium: true),
      ];

  static List<FilterModel> get blackAndWhite => [
        const FilterModel(id: 'bw_01', name: 'Classic BW', category: FilterCategory.blackAndWhite, isGrayscale: true),
        const FilterModel(id: 'bw_02', name: 'High Contrast', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 30),
        const FilterModel(id: 'bw_03', name: 'Soft BW', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: -10, brightness: 5),
        const FilterModel(id: 'bw_04', name: 'Sepia', category: FilterCategory.blackAndWhite, isSepia: true),
        const FilterModel(id: 'bw_05', name: 'Rich Sepia', category: FilterCategory.blackAndWhite, isSepia: true, contrast: 15, vignette: 20),
        const FilterModel(id: 'bw_06', name: 'Newspaper', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 25, grain: 30),
        const FilterModel(id: 'bw_07', name: 'Dramatic BW', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 40, vignette: 30),
        const FilterModel(id: 'bw_08', name: 'Infrared', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 20, brightness: 15, isPremium: true),
        const FilterModel(id: 'bw_09', name: 'Carbon', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 35, brightness: -10, isPremium: true),
        const FilterModel(id: 'bw_10', name: 'Silver', category: FilterCategory.blackAndWhite, isGrayscale: true, brightness: 10, contrast: 5, fadeAmount: 10),
        const FilterModel(id: 'bw_11', name: 'Gritty', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 30, grain: 25, vignette: 20),
        const FilterModel(id: 'bw_12', name: 'Street', category: FilterCategory.blackAndWhite, isGrayscale: true, contrast: 20, grain: 15, vignette: 15),
      ];

  static List<FilterModel> get warm => [
        const FilterModel(id: 'warm_01', name: 'Sunset', category: FilterCategory.warm, temperature: 30, saturation: 20, contrast: 10),
        const FilterModel(id: 'warm_02', name: 'Golden', category: FilterCategory.warm, temperature: 40, saturation: 25, brightness: 5),
        const FilterModel(id: 'warm_03', name: 'Amber', category: FilterCategory.warm, temperature: 25, saturation: 15, contrast: 5),
        const FilterModel(id: 'warm_04', name: 'Desert', category: FilterCategory.warm, temperature: 35, saturation: 10, contrast: 15, vignette: 15),
        const FilterModel(id: 'warm_05', name: 'Bonfire', category: FilterCategory.warm, temperature: 50, saturation: 30, contrast: 20, vignette: 25, isPremium: true),
        const FilterModel(id: 'warm_06', name: 'Tropics', category: FilterCategory.warm, temperature: 20, saturation: 40, brightness: 5, contrast: 10),
        const FilterModel(id: 'warm_07', name: 'Coral', category: FilterCategory.warm, temperature: 15, saturation: 30, brightness: 8),
        const FilterModel(id: 'warm_08', name: 'Sand', category: FilterCategory.warm, temperature: 20, saturation: -5, contrast: 8, fadeAmount: 10),
      ];

  static List<FilterModel> get cool => [
        const FilterModel(id: 'cool_01', name: 'Arctic', category: FilterCategory.cool, temperature: -30, saturation: -10, brightness: 5, contrast: 10),
        const FilterModel(id: 'cool_02', name: 'Ocean', category: FilterCategory.cool, temperature: -20, saturation: 15, contrast: 10),
        const FilterModel(id: 'cool_03', name: 'Moonlight', category: FilterCategory.cool, temperature: -25, saturation: -15, brightness: 3, contrast: 5),
        const FilterModel(id: 'cool_04', name: 'Ice', category: FilterCategory.cool, temperature: -35, saturation: -20, brightness: 8, contrast: 8),
        const FilterModel(id: 'cool_05', name: 'Steel', category: FilterCategory.cool, temperature: -15, saturation: -25, contrast: 15),
        const FilterModel(id: 'cool_06', name: 'Rain', category: FilterCategory.cool, temperature: -10, saturation: -10, contrast: 5, fadeAmount: 10),
        const FilterModel(id: 'cool_07', name: 'Twilight', category: FilterCategory.cool, temperature: -20, saturation: 5, contrast: 15, vignette: 20, isPremium: true),
        const FilterModel(id: 'cool_08', name: 'Bluebell', category: FilterCategory.cool, temperature: -25, saturation: 20, contrast: 10, isPremium: true),
      ];

  static List<FilterModel> get hdr => [
        const FilterModel(id: 'hdr_01', name: 'HDR Natural', category: FilterCategory.hdr, contrast: 20, saturation: 15, sharpness: 10),
        const FilterModel(id: 'hdr_02', name: 'HDR Strong', category: FilterCategory.hdr, contrast: 35, saturation: 25, sharpness: 20),
        const FilterModel(id: 'hdr_03', name: 'HDR Landscape', category: FilterCategory.hdr, contrast: 25, saturation: 30, sharpness: 15),
        const FilterModel(id: 'hdr_04', name: 'Vivid', category: FilterCategory.hdr, saturation: 40, contrast: 20, brightness: 5, sharpness: 15),
        const FilterModel(id: 'hdr_05', name: 'Drama', category: FilterCategory.hdr, contrast: 40, saturation: 20, vignette: 20, sharpness: 20),
        const FilterModel(id: 'hdr_06', name: 'Clarity', category: FilterCategory.hdr, contrast: 15, saturation: 10, sharpness: 25, clarity: 20, isPremium: true),
      ];

  // Get filters by category
  static List<FilterModel> byCategory(FilterCategory category) {
    if (category == FilterCategory.all) return all;
    return all.where((f) => f.category == category).toList();
  }
}
