import 'package:flutter/material.dart';

enum LayerType {
  image,
  text,
  sticker,
  drawing,
  shape,
  adjustment,
  filter,
}

enum BlendMode {
  normal,
  multiply,
  screen,
  overlay,
  softLight,
  hardLight,
  darken,
  lighten,
  colorDodge,
  colorBurn,
  difference,
  exclusion,
}

class LayerModel {
  const LayerModel({
    required this.id,
    required this.type,
    required this.name,
    this.imagePath,
    this.imageData,
    this.text,
    this.textStyle,
    this.stickerAsset,
    this.drawingPoints = const [],
    this.opacity = 1.0,
    this.blendMode = BlendMode.normal,
    this.isVisible = true,
    this.isLocked = false,
    this.x = 0.0,
    this.y = 0.0,
    this.width,
    this.height,
    this.rotation = 0.0,
    this.scaleX = 1.0,
    this.scaleY = 1.0,
    this.order = 0,
    this.adjustmentData,
    this.filterId,
    this.filterOpacity = 1.0,
  });

  final String id;
  final LayerType type;
  final String name;
  final String? imagePath;
  final List<int>? imageData;
  final String? text;
  final Map<String, dynamic>? textStyle;
  final String? stickerAsset;
  final List<Map<String, dynamic>> drawingPoints;
  final double opacity;
  final BlendMode blendMode;
  final bool isVisible;
  final bool isLocked;
  final double x;
  final double y;
  final double? width;
  final double? height;
  final double rotation;
  final double scaleX;
  final double scaleY;
  final int order;
  final Map<String, dynamic>? adjustmentData;
  final String? filterId;
  final double filterOpacity;

  LayerModel copyWith({
    String? name,
    String? imagePath,
    String? text,
    Map<String, dynamic>? textStyle,
    double? opacity,
    BlendMode? blendMode,
    bool? isVisible,
    bool? isLocked,
    double? x,
    double? y,
    double? width,
    double? height,
    double? rotation,
    double? scaleX,
    double? scaleY,
    int? order,
    Map<String, dynamic>? adjustmentData,
    String? filterId,
    double? filterOpacity,
  }) {
    return LayerModel(
      id: id,
      type: type,
      name: name ?? this.name,
      imagePath: imagePath ?? this.imagePath,
      imageData: imageData,
      text: text ?? this.text,
      textStyle: textStyle ?? this.textStyle,
      stickerAsset: stickerAsset,
      drawingPoints: drawingPoints,
      opacity: opacity ?? this.opacity,
      blendMode: blendMode ?? this.blendMode,
      isVisible: isVisible ?? this.isVisible,
      isLocked: isLocked ?? this.isLocked,
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
      rotation: rotation ?? this.rotation,
      scaleX: scaleX ?? this.scaleX,
      scaleY: scaleY ?? this.scaleY,
      order: order ?? this.order,
      adjustmentData: adjustmentData ?? this.adjustmentData,
      filterId: filterId ?? this.filterId,
      filterOpacity: filterOpacity ?? this.filterOpacity,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'type': type.name,
        'name': name,
        'imagePath': imagePath,
        'text': text,
        'textStyle': textStyle,
        'stickerAsset': stickerAsset,
        'opacity': opacity,
        'blendMode': blendMode.name,
        'isVisible': isVisible,
        'isLocked': isLocked,
        'x': x,
        'y': y,
        'width': width,
        'height': height,
        'rotation': rotation,
        'scaleX': scaleX,
        'scaleY': scaleY,
        'order': order,
        'adjustmentData': adjustmentData,
        'filterId': filterId,
        'filterOpacity': filterOpacity,
      };

  factory LayerModel.fromMap(Map<String, dynamic> map) => LayerModel(
        id: map['id'] as String,
        type: LayerType.values.firstWhere(
          (e) => e.name == map['type'],
          orElse: () => LayerType.image,
        ),
        name: map['name'] as String? ?? 'Layer',
        imagePath: map['imagePath'] as String?,
        text: map['text'] as String?,
        textStyle: map['textStyle'] as Map<String, dynamic>?,
        stickerAsset: map['stickerAsset'] as String?,
        opacity: (map['opacity'] as num?)?.toDouble() ?? 1.0,
        blendMode: BlendMode.values.firstWhere(
          (e) => e.name == map['blendMode'],
          orElse: () => BlendMode.normal,
        ),
        isVisible: map['isVisible'] as bool? ?? true,
        isLocked: map['isLocked'] as bool? ?? false,
        x: (map['x'] as num?)?.toDouble() ?? 0.0,
        y: (map['y'] as num?)?.toDouble() ?? 0.0,
        width: (map['width'] as num?)?.toDouble(),
        height: (map['height'] as num?)?.toDouble(),
        rotation: (map['rotation'] as num?)?.toDouble() ?? 0.0,
        scaleX: (map['scaleX'] as num?)?.toDouble() ?? 1.0,
        scaleY: (map['scaleY'] as num?)?.toDouble() ?? 1.0,
        order: map['order'] as int? ?? 0,
        adjustmentData: map['adjustmentData'] as Map<String, dynamic>?,
        filterId: map['filterId'] as String?,
        filterOpacity: (map['filterOpacity'] as num?)?.toDouble() ?? 1.0,
      );

  // Factory constructors for common layer types
  factory LayerModel.imageLayer({
    required String id,
    required String imagePath,
    String name = 'Image Layer',
    int order = 0,
  }) {
    return LayerModel(
      id: id,
      type: LayerType.image,
      name: name,
      imagePath: imagePath,
      order: order,
    );
  }

  factory LayerModel.textLayer({
    required String id,
    required String text,
    Map<String, dynamic>? textStyle,
    int order = 0,
  }) {
    return LayerModel(
      id: id,
      type: LayerType.text,
      name: 'Text Layer',
      text: text,
      textStyle: textStyle,
      order: order,
    );
  }

  factory LayerModel.stickerLayer({
    required String id,
    required String asset,
    int order = 0,
  }) {
    return LayerModel(
      id: id,
      type: LayerType.sticker,
      name: 'Sticker Layer',
      stickerAsset: asset,
      order: order,
    );
  }

  factory LayerModel.drawingLayer({
    required String id,
    int order = 0,
  }) {
    return LayerModel(
      id: id,
      type: LayerType.drawing,
      name: 'Drawing Layer',
      order: order,
    );
  }
}
