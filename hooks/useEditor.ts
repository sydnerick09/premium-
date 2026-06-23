import { useEditorStore } from '../store/editorStore';

export function useEditor() {
  const store = useEditorStore();

  const applyAdjustment = (key: string, value: number) => {
    store.updateAdjustment(key as any, value);
  };

  const hasAdjustments = Object.values(store.adjustments).some((v) => v !== 0);
  const hasFilter = !!store.activeFilterId && store.activeFilterId !== 'none';
  const hasBeauty = Object.values(store.beautyValues).some((v) => typeof v === 'number' ? v !== 0 : !!v);

  return {
    ...store,
    applyAdjustment,
    hasAdjustments,
    hasFilter,
    hasBeauty,
    canUndo: store.canUndo(),
    canRedo: store.canRedo(),
  };
}
