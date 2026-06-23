import { useEditorStore } from '../store/editorStore';
import { AdjustmentValues } from '../types';

export function useAdjustments() {
  const { adjustments, updateAdjustment, resetAdjustments, setAdjustments } = useEditorStore();

  const hasChanges = Object.values(adjustments).some((v) => v !== 0);

  const getValueForKey = (key: keyof AdjustmentValues) => adjustments[key];

  const updateValue = (key: keyof AdjustmentValues, value: number) => {
    updateAdjustment(key, value);
  };

  const resetKey = (key: keyof AdjustmentValues) => {
    updateAdjustment(key, 0);
  };

  const applyPreset = (preset: Partial<AdjustmentValues>) => {
    setAdjustments({ ...adjustments, ...preset });
  };

  return {
    adjustments,
    hasChanges,
    getValueForKey,
    updateValue,
    resetKey,
    resetAll: resetAdjustments,
    applyPreset,
  };
}
