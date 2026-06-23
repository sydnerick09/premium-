class AdjustmentModel {
  const AdjustmentModel({
    this.brightness = 0.0,
    this.contrast = 0.0,
    this.saturation = 0.0,
    this.exposure = 0.0,
    this.highlights = 0.0,
    this.shadows = 0.0,
    this.temperature = 0.0,
    this.tint = 0.0,
    this.vibrance = 0.0,
    this.sharpness = 0.0,
    this.blur = 0.0,
    this.vignette = 0.0,
    this.grain = 0.0,
    this.fadeAmount = 0.0,
    this.colorMixerRed = 0.0,
    this.colorMixerGreen = 0.0,
    this.colorMixerBlue = 0.0,
    this.hue = 0.0,
    this.luminance = 0.0,
    this.clarity = 0.0,
    this.dehaze = 0.0,
  });

  final double brightness;
  final double contrast;
  final double saturation;
  final double exposure;
  final double highlights;
  final double shadows;
  final double temperature;
  final double tint;
  final double vibrance;
  final double sharpness;
  final double blur;
  final double vignette;
  final double grain;
  final double fadeAmount;
  final double colorMixerRed;
  final double colorMixerGreen;
  final double colorMixerBlue;
  final double hue;
  final double luminance;
  final double clarity;
  final double dehaze;

  bool get hasAdjustments =>
      brightness != 0 ||
      contrast != 0 ||
      saturation != 0 ||
      exposure != 0 ||
      highlights != 0 ||
      shadows != 0 ||
      temperature != 0 ||
      tint != 0 ||
      vibrance != 0 ||
      sharpness != 0 ||
      blur != 0 ||
      vignette != 0 ||
      grain != 0 ||
      hue != 0 ||
      clarity != 0;

  AdjustmentModel copyWith({
    double? brightness,
    double? contrast,
    double? saturation,
    double? exposure,
    double? highlights,
    double? shadows,
    double? temperature,
    double? tint,
    double? vibrance,
    double? sharpness,
    double? blur,
    double? vignette,
    double? grain,
    double? fadeAmount,
    double? colorMixerRed,
    double? colorMixerGreen,
    double? colorMixerBlue,
    double? hue,
    double? luminance,
    double? clarity,
    double? dehaze,
  }) {
    return AdjustmentModel(
      brightness: brightness ?? this.brightness,
      contrast: contrast ?? this.contrast,
      saturation: saturation ?? this.saturation,
      exposure: exposure ?? this.exposure,
      highlights: highlights ?? this.highlights,
      shadows: shadows ?? this.shadows,
      temperature: temperature ?? this.temperature,
      tint: tint ?? this.tint,
      vibrance: vibrance ?? this.vibrance,
      sharpness: sharpness ?? this.sharpness,
      blur: blur ?? this.blur,
      vignette: vignette ?? this.vignette,
      grain: grain ?? this.grain,
      fadeAmount: fadeAmount ?? this.fadeAmount,
      colorMixerRed: colorMixerRed ?? this.colorMixerRed,
      colorMixerGreen: colorMixerGreen ?? this.colorMixerGreen,
      colorMixerBlue: colorMixerBlue ?? this.colorMixerBlue,
      hue: hue ?? this.hue,
      luminance: luminance ?? this.luminance,
      clarity: clarity ?? this.clarity,
      dehaze: dehaze ?? this.dehaze,
    );
  }

  AdjustmentModel reset() => const AdjustmentModel();

  Map<String, dynamic> toMap() => {
        'brightness': brightness,
        'contrast': contrast,
        'saturation': saturation,
        'exposure': exposure,
        'highlights': highlights,
        'shadows': shadows,
        'temperature': temperature,
        'tint': tint,
        'vibrance': vibrance,
        'sharpness': sharpness,
        'blur': blur,
        'vignette': vignette,
        'grain': grain,
        'fadeAmount': fadeAmount,
        'colorMixerRed': colorMixerRed,
        'colorMixerGreen': colorMixerGreen,
        'colorMixerBlue': colorMixerBlue,
        'hue': hue,
        'luminance': luminance,
        'clarity': clarity,
        'dehaze': dehaze,
      };

  factory AdjustmentModel.fromMap(Map<String, dynamic> map) => AdjustmentModel(
        brightness: (map['brightness'] as num?)?.toDouble() ?? 0.0,
        contrast: (map['contrast'] as num?)?.toDouble() ?? 0.0,
        saturation: (map['saturation'] as num?)?.toDouble() ?? 0.0,
        exposure: (map['exposure'] as num?)?.toDouble() ?? 0.0,
        highlights: (map['highlights'] as num?)?.toDouble() ?? 0.0,
        shadows: (map['shadows'] as num?)?.toDouble() ?? 0.0,
        temperature: (map['temperature'] as num?)?.toDouble() ?? 0.0,
        tint: (map['tint'] as num?)?.toDouble() ?? 0.0,
        vibrance: (map['vibrance'] as num?)?.toDouble() ?? 0.0,
        sharpness: (map['sharpness'] as num?)?.toDouble() ?? 0.0,
        blur: (map['blur'] as num?)?.toDouble() ?? 0.0,
        vignette: (map['vignette'] as num?)?.toDouble() ?? 0.0,
        grain: (map['grain'] as num?)?.toDouble() ?? 0.0,
        fadeAmount: (map['fadeAmount'] as num?)?.toDouble() ?? 0.0,
        colorMixerRed: (map['colorMixerRed'] as num?)?.toDouble() ?? 0.0,
        colorMixerGreen: (map['colorMixerGreen'] as num?)?.toDouble() ?? 0.0,
        colorMixerBlue: (map['colorMixerBlue'] as num?)?.toDouble() ?? 0.0,
        hue: (map['hue'] as num?)?.toDouble() ?? 0.0,
        luminance: (map['luminance'] as num?)?.toDouble() ?? 0.0,
        clarity: (map['clarity'] as num?)?.toDouble() ?? 0.0,
        dehaze: (map['dehaze'] as num?)?.toDouble() ?? 0.0,
      );
}
