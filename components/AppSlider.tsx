import React from 'react';
import Slider from '@react-native-community/slider';

export interface AppSliderProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange?: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
  style?: any;
}

/**
 * NATIVE slider — the community slider works fine on iOS/Android. (Web uses
 * AppSlider.web.tsx with an <input type="range"> to avoid a react-dom crash.)
 */
export default function AppSlider(props: AppSliderProps) {
  return <Slider {...props} />;
}
