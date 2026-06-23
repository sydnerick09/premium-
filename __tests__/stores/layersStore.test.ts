import { act, renderHook } from '@testing-library/react-hooks';
import { useLayersStore } from '../../store/layersStore';

describe('layersStore', () => {
  beforeEach(() => {
    useLayersStore.getState().clearLayers();
  });

  it('starts with no layers', () => {
    const { result } = renderHook(() => useLayersStore());
    expect(result.current.getLayers()).toHaveLength(0);
  });

  it('addLayer creates a layer', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', { name: 'Background' }); });
    const layers = result.current.getLayers();
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Background');
    expect(layers[0].type).toBe('image');
  });

  it('toggleVisibility flips isVisible', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', {}); });
    const id = result.current.getLayers()[0].id;
    expect(result.current.getLayers()[0].isVisible).toBe(true);
    act(() => { result.current.toggleVisibility(id); });
    expect(result.current.getLayers()[0].isVisible).toBe(false);
  });

  it('toggleLock flips isLocked', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', {}); });
    const id = result.current.getLayers()[0].id;
    act(() => { result.current.toggleLock(id); });
    expect(result.current.getLayers()[0].isLocked).toBe(true);
  });

  it('setOpacity clamps to 0-1', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', {}); });
    const id = result.current.getLayers()[0].id;
    act(() => { result.current.setOpacity(id, -0.5); });
    expect(result.current.getLayers()[0].opacity).toBe(0);
    act(() => { result.current.setOpacity(id, 1.5); });
    expect(result.current.getLayers()[0].opacity).toBe(1);
  });

  it('duplicateLayer creates a copy', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', { name: 'Original' }); });
    const id = result.current.getLayers()[0].id;
    act(() => { result.current.duplicateLayer(id); });
    expect(result.current.getLayers()).toHaveLength(2);
    expect(result.current.getLayers()[0].id).not.toBe(id);
  });

  it('removeLayer reduces count', () => {
    const { result } = renderHook(() => useLayersStore());
    act(() => { result.current.addLayer('image', {}); result.current.addLayer('text', {}); });
    const id = result.current.getLayers()[0].id;
    act(() => { result.current.removeLayer(id); });
    expect(result.current.getLayers()).toHaveLength(1);
  });
});
