export type FilterCategory =
  | 'All'
  | 'Vintage'
  | 'Cinematic'
  | 'Portrait'
  | 'B&W'
  | 'Warm'
  | 'Cool'
  | 'HDR';

export interface Filter {
  id: string;
  name: string;
  category: FilterCategory;
  isPremium?: boolean;
  // Adjustment parameters for simulation
  brightness?: number;   // -100 to 100
  contrast?: number;     // -100 to 100
  saturation?: number;   // -100 to 100
  temperature?: number;  // -100 to 100
  vignette?: number;     // 0 to 100
  grain?: number;        // 0 to 100
  fade?: number;         // 0 to 100
  sharpness?: number;    // 0 to 100
  isGrayscale?: boolean;
  isSepia?: boolean;
  // Color matrix for advanced transforms
  colorMatrix?: number[];
}

export const FilterCatalog: Filter[] = [
  // None
  { id: 'none', name: 'Original', category: 'All' },

  // Vintage
  { id: 'v_kodak', name: 'Kodak', category: 'Vintage', saturation: -10, temperature: 15, grain: 20, vignette: 25, fade: 10 },
  { id: 'v_polaroid', name: 'Polaroid', category: 'Vintage', saturation: -20, temperature: 20, grain: 30, vignette: 30, fade: 20 },
  { id: 'v_70s', name: '70s Film', category: 'Vintage', saturation: -15, temperature: 25, grain: 25, vignette: 20, brightness: 5 },
  { id: 'v_retro', name: 'Retro', category: 'Vintage', saturation: 10, temperature: 10, grain: 15, vignette: 15, fade: 8 },
  { id: 'v_faded', name: 'Faded', category: 'Vintage', saturation: -30, temperature: 5, grain: 10, fade: 30 },
  { id: 'v_lomo', name: 'Lomo', category: 'Vintage', saturation: 20, contrast: 10, vignette: 40, grain: 20 },
  { id: 'v_aged', name: 'Aged', category: 'Vintage', saturation: -25, temperature: 18, grain: 35, vignette: 25, fade: 15 },
  { id: 'v_cross', name: 'Cross', category: 'Vintage', saturation: 30, contrast: 15, temperature: -5, vignette: 20 },
  { id: 'v_daguerr', name: 'Daguerreotype', category: 'Vintage', isSepia: true, vignette: 40, grain: 25, contrast: 10, isPremium: true },
  { id: 'v_tintype', name: 'Tintype', category: 'Vintage', isGrayscale: true, contrast: 20, grain: 30, vignette: 35, isPremium: true },
  { id: 'v_fuji', name: 'Fuji', category: 'Vintage', saturation: 5, temperature: 8, grain: 8, contrast: 5 },
  { id: 'v_ilford', name: 'Ilford', category: 'Vintage', isGrayscale: true, contrast: 15, grain: 20 },

  // Cinematic
  { id: 'c_teal_orange', name: 'Teal & Orange', category: 'Cinematic', temperature: -10, saturation: 20, contrast: 15, vignette: 20 },
  { id: 'c_blade', name: 'Blade Runner', category: 'Cinematic', temperature: -20, saturation: 15, contrast: 20, vignette: 30, brightness: -5 },
  { id: 'c_matrix', name: 'Matrix', category: 'Cinematic', temperature: -15, saturation: -10, contrast: 25, vignette: 25 },
  { id: 'c_wes', name: 'Wes Anderson', category: 'Cinematic', temperature: 20, saturation: 15, contrast: 5, fade: 10 },
  { id: 'c_noir', name: 'Noir', category: 'Cinematic', isGrayscale: true, contrast: 30, vignette: 40, brightness: -10 },
  { id: 'c_block', name: 'Blockbuster', category: 'Cinematic', saturation: 20, contrast: 15, temperature: 5, vignette: 15 },
  { id: 'c_matte', name: 'Matte', category: 'Cinematic', contrast: -10, fade: 25, saturation: -5 },
  { id: 'c_holly', name: 'Hollywood', category: 'Cinematic', contrast: 20, saturation: 15, vignette: 15, brightness: 5, isPremium: true },
  { id: 'c_kubrick', name: 'Kubrick', category: 'Cinematic', isGrayscale: true, contrast: 25, vignette: 30, brightness: -5, isPremium: true },
  { id: 'c_autumn', name: 'Autumn', category: 'Cinematic', temperature: 30, saturation: 20, contrast: 10, vignette: 15 },
  { id: 'c_dusk', name: 'Dusk', category: 'Cinematic', temperature: -25, saturation: 10, contrast: 15, vignette: 30 },
  { id: 'c_summer', name: 'Summer', category: 'Cinematic', temperature: 25, saturation: 25, brightness: 5, contrast: 8 },
  { id: 'c_winter', name: 'Winter', category: 'Cinematic', temperature: -30, saturation: -15, contrast: 10, brightness: 5 },
  { id: 'c_spring', name: 'Spring', category: 'Cinematic', temperature: 10, saturation: 30, brightness: 8, contrast: 5 },

  // Portrait
  { id: 'p_glow', name: 'Skin Glow', category: 'Portrait', brightness: 5, saturation: 5, temperature: 10, contrast: 5 },
  { id: 'p_soft', name: 'Soft Light', category: 'Portrait', brightness: 8, contrast: -5, saturation: 5, vignette: 10 },
  { id: 'p_warm', name: 'Warm Skin', category: 'Portrait', temperature: 20, saturation: 10, brightness: 5 },
  { id: 'p_natural', name: 'Natural', category: 'Portrait', saturation: -5, contrast: 5, brightness: 3 },
  { id: 'p_golden', name: 'Golden Hour', category: 'Portrait', temperature: 35, saturation: 20, contrast: 10, vignette: 15 },
  { id: 'p_studio', name: 'Studio', category: 'Portrait', brightness: 10, contrast: 10, saturation: -10, temperature: 5 },
  { id: 'p_editorial', name: 'Editorial', category: 'Portrait', contrast: 20, saturation: -15, brightness: 5, isPremium: true },
  { id: 'p_moody', name: 'Moody Portrait', category: 'Portrait', contrast: 15, saturation: -10, vignette: 25, isPremium: true },

  // B&W
  { id: 'bw_classic', name: 'Classic BW', category: 'B&W', isGrayscale: true },
  { id: 'bw_high', name: 'High Contrast', category: 'B&W', isGrayscale: true, contrast: 30 },
  { id: 'bw_soft', name: 'Soft BW', category: 'B&W', isGrayscale: true, contrast: -10, brightness: 5 },
  { id: 'bw_sepia', name: 'Sepia', category: 'B&W', isSepia: true },
  { id: 'bw_rich_sepia', name: 'Rich Sepia', category: 'B&W', isSepia: true, contrast: 15, vignette: 20 },
  { id: 'bw_news', name: 'Newspaper', category: 'B&W', isGrayscale: true, contrast: 25, grain: 30 },
  { id: 'bw_dramatic', name: 'Dramatic BW', category: 'B&W', isGrayscale: true, contrast: 40, vignette: 30 },
  { id: 'bw_infra', name: 'Infrared', category: 'B&W', isGrayscale: true, contrast: 20, brightness: 15, isPremium: true },
  { id: 'bw_carbon', name: 'Carbon', category: 'B&W', isGrayscale: true, contrast: 35, brightness: -10, isPremium: true },
  { id: 'bw_silver', name: 'Silver', category: 'B&W', isGrayscale: true, brightness: 10, contrast: 5, fade: 10 },
  { id: 'bw_gritty', name: 'Gritty', category: 'B&W', isGrayscale: true, contrast: 30, grain: 25, vignette: 20 },
  { id: 'bw_street', name: 'Street', category: 'B&W', isGrayscale: true, contrast: 20, grain: 15, vignette: 15 },

  // Warm
  { id: 'w_sunset', name: 'Sunset', category: 'Warm', temperature: 30, saturation: 20, contrast: 10 },
  { id: 'w_golden', name: 'Golden', category: 'Warm', temperature: 40, saturation: 25, brightness: 5 },
  { id: 'w_amber', name: 'Amber', category: 'Warm', temperature: 25, saturation: 15, contrast: 5 },
  { id: 'w_desert', name: 'Desert', category: 'Warm', temperature: 35, saturation: 10, contrast: 15, vignette: 15 },
  { id: 'w_bonfire', name: 'Bonfire', category: 'Warm', temperature: 50, saturation: 30, contrast: 20, vignette: 25, isPremium: true },
  { id: 'w_tropics', name: 'Tropics', category: 'Warm', temperature: 20, saturation: 40, brightness: 5, contrast: 10 },
  { id: 'w_coral', name: 'Coral', category: 'Warm', temperature: 15, saturation: 30, brightness: 8 },
  { id: 'w_sand', name: 'Sand', category: 'Warm', temperature: 20, saturation: -5, contrast: 8, fade: 10 },

  // Cool
  { id: 'co_arctic', name: 'Arctic', category: 'Cool', temperature: -30, saturation: -10, brightness: 5, contrast: 10 },
  { id: 'co_ocean', name: 'Ocean', category: 'Cool', temperature: -20, saturation: 15, contrast: 10 },
  { id: 'co_moon', name: 'Moonlight', category: 'Cool', temperature: -25, saturation: -15, brightness: 3, contrast: 5 },
  { id: 'co_ice', name: 'Ice', category: 'Cool', temperature: -35, saturation: -20, brightness: 8, contrast: 8 },
  { id: 'co_steel', name: 'Steel', category: 'Cool', temperature: -15, saturation: -25, contrast: 15 },
  { id: 'co_rain', name: 'Rain', category: 'Cool', temperature: -10, saturation: -10, contrast: 5, fade: 10 },
  { id: 'co_twilight', name: 'Twilight', category: 'Cool', temperature: -20, saturation: 5, contrast: 15, vignette: 20, isPremium: true },
  { id: 'co_blue', name: 'Bluebell', category: 'Cool', temperature: -25, saturation: 20, contrast: 10, isPremium: true },

  // HDR
  { id: 'hdr_natural', name: 'HDR Natural', category: 'HDR', contrast: 20, saturation: 15, sharpness: 10 },
  { id: 'hdr_strong', name: 'HDR Strong', category: 'HDR', contrast: 35, saturation: 25, sharpness: 20 },
  { id: 'hdr_land', name: 'HDR Landscape', category: 'HDR', contrast: 25, saturation: 30, sharpness: 15 },
  { id: 'hdr_vivid', name: 'Vivid', category: 'HDR', saturation: 40, contrast: 20, brightness: 5, sharpness: 15 },
  { id: 'hdr_drama', name: 'Drama', category: 'HDR', contrast: 40, saturation: 20, vignette: 20, sharpness: 20 },
  { id: 'hdr_clarity', name: 'Clarity', category: 'HDR', contrast: 15, saturation: 10, sharpness: 25, isPremium: true },
];

export function getFiltersByCategory(category: FilterCategory | 'All'): Filter[] {
  if (category === 'All') return FilterCatalog;
  return FilterCatalog.filter((f) => f.category === category || f.category === 'All');
}
