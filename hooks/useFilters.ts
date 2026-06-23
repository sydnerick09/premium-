import { useState, useCallback } from 'react';
import { FilterCatalog, Filter, FilterCategory, getFiltersByCategory } from '../constants/FilterCatalog';
import { useEditorStore } from '../store/editorStore';

export function useFilters() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | 'All'>('All');
  const [intensity, setIntensity] = useState(100);

  const { activeFilterId, applyFilter } = useEditorStore();

  const filters = getFiltersByCategory(activeCategory);
  const activeFilter = FilterCatalog.find((f) => f.id === activeFilterId);

  const selectFilter = useCallback((filterId: string | null) => {
    applyFilter(filterId, intensity);
  }, [intensity, applyFilter]);

  const toggleFilter = useCallback((filterId: string) => {
    if (activeFilterId === filterId) {
      applyFilter(null, intensity);
    } else {
      applyFilter(filterId, intensity);
    }
  }, [activeFilterId, intensity, applyFilter]);

  const clearFilter = useCallback(() => applyFilter(null, 100), [applyFilter]);

  return {
    filters,
    activeCategory,
    setActiveCategory,
    intensity,
    setIntensity,
    activeFilterId,
    activeFilter,
    selectFilter,
    toggleFilter,
    clearFilter,
  };
}
