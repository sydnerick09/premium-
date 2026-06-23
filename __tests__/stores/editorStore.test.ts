import { act, renderHook } from '@testing-library/react-hooks';
import { useEditorStore } from '../../store/editorStore';
import { defaultAdjustments } from '../../types';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useEditorStore());
    expect(result.current.originalUri).toBeNull();
    expect(result.current.currentUri).toBeNull();
  });

  it('loadImage sets URIs', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => { result.current.loadImage('file://test.jpg', 'proj-1'); });
    expect(result.current.originalUri).toBe('file://test.jpg');
    expect(result.current.currentUri).toBe('file://test.jpg');
  });

  it('updateAdjustment changes value', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => { result.current.updateAdjustment('brightness', 50); });
    expect(result.current.adjustments.brightness).toBe(50);
  });

  it('resetAdjustments returns to defaults', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.updateAdjustment('brightness', 50);
      result.current.updateAdjustment('contrast', -30);
      result.current.resetAdjustments();
    });
    expect(result.current.adjustments).toEqual(defaultAdjustments);
  });

  it('undo/redo works with history', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.loadImage('file://test.jpg', 'proj-1');
      result.current.setCurrentUri('file://edited.jpg', true);
    });
    expect(result.current.currentUri).toBe('file://edited.jpg');
    expect(result.current.canUndo()).toBe(true);

    act(() => { result.current.undo(); });
    expect(result.current.currentUri).toBe('file://test.jpg');

    expect(result.current.canRedo()).toBe(true);
    act(() => { result.current.redo(); });
    expect(result.current.currentUri).toBe('file://edited.jpg');
  });

  it('zoom is clamped between 0.5 and 5', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => { result.current.setZoom(0.1); });
    expect(result.current.zoom).toBe(0.5);
    act(() => { result.current.setZoom(10); });
    expect(result.current.zoom).toBe(5);
    act(() => { result.current.setZoom(2); });
    expect(result.current.zoom).toBe(2);
  });

  it('applyFilter sets activeFilterId', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => { result.current.applyFilter('vintage_01', 80); });
    expect(result.current.activeFilterId).toBe('vintage_01');
    expect(result.current.filterIntensity).toBe(80);
  });

  it('applyFilter with null clears filter', () => {
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.applyFilter('vintage_01', 80);
      result.current.applyFilter(null, 100);
    });
    expect(result.current.activeFilterId).toBeNull();
  });
});
