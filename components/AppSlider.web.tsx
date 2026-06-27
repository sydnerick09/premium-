import React from 'react';
import { Colors } from '../constants/Colors';

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
 * WEB slider — a native <input type="range">. We deliberately avoid
 * @react-native-community/slider on web: its web build leans on react-dom
 * internals and throws on render in this stack (which blanked the editor the
 * moment a slider mounted). A plain range input is bulletproof.
 */
export default function AppSlider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 1,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = Colors.primary,
  disabled,
}: AppSliderProps) {
  const safeValue = Number.isFinite(value) ? value : minimumValue;
  return React.createElement('input', {
    type: 'range',
    min: minimumValue,
    max: maximumValue,
    step,
    value: safeValue,
    disabled,
    onChange: (e: any) => onValueChange?.(parseFloat(e.target.value)),
    onMouseUp: (e: any) => onSlidingComplete?.(parseFloat(e.target.value)),
    onTouchEnd: (e: any) => onSlidingComplete?.(parseFloat(e.target.value)),
    style: {
      width: '100%',
      height: 36,
      // accentColor tints both the filled track and the thumb in modern browsers
      accentColor: minimumTrackTintColor,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    },
  });
}
