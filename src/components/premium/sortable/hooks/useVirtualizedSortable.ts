'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableItem } from '../types';

interface UseVirtualizedSortableOptions {
  containerHeight?: number;
  itemHeight?: number;
  overscan?: number;
  enabled?: boolean;
}

interface UseVirtualizedSortableResult<T extends SortableItem> {
  virtualizer: ReturnType<typeof useVirtualizer> | null;
  visibleItems: T[];
  containerRef: React.RefObject<HTMLDivElement>;
  scrollElement: HTMLElement | null;
  totalSize: number;
  isVirtualized: boolean;
}

/**
 * Hook for virtualizing large sortable lists to improve performance
 * Only renders visible items in the viewport
 */
export function useVirtualizedSortable<T extends SortableItem>(
  items: T[],
  options: UseVirtualizedSortableOptions = {}
): UseVirtualizedSortableResult<T> {
  const {
    containerHeight = 400,
    itemHeight = 80,
    overscan = 5,
    enabled = items.length > 50, // Auto-enable for large lists
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  // Set up scroll element
  useEffect(() => {
    if (containerRef.current) {
      setScrollElement(containerRef.current);
    }
  }, []);

  // Create virtualizer instance
  const virtualizer = useMemo(() => {
    if (!enabled || !scrollElement || items.length === 0) {
      return null;
    }

    return useVirtualizer({
      count: items.length,
      getScrollElement: () => scrollElement,
      estimateSize: () => itemHeight,
      overscan,
    });
  }, [enabled, scrollElement, items.length, itemHeight, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    if (!virtualizer || !enabled) {
      return items;
    }

    return virtualizer.getVirtualItems().map(virtualItem => items[virtualItem.index]);
  }, [virtualizer, enabled, items]);

  // Calculate total size
  const totalSize = useMemo(() => {
    if (!virtualizer || !enabled) {
      return items.length * itemHeight;
    }
    return virtualizer.getTotalSize();
  }, [virtualizer, enabled, items.length, itemHeight]);

  return {
    virtualizer,
    visibleItems,
    containerRef,
    scrollElement,
    totalSize,
    isVirtualized: enabled && !!virtualizer,
  };
}

/**
 * Hook for optimizing sortable list performance with memoization
 */
export function useSortablePerformance<T extends SortableItem>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode
) {
  // Memoize the render function to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback(
    (item: T, index: number) => renderItem(item, index),
    [renderItem]
  );

  // Memoize the items list for shallow comparison
  const memoizedItems = useMemo(() => items, [items]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const itemCount = items.length;
    const shouldVirtualize = itemCount > 50;
    const estimatedRenderTime = itemCount * 2; // Rough estimate in ms
    
    return {
      itemCount,
      shouldVirtualize,
      estimatedRenderTime,
      performanceLevel: itemCount < 20 ? 'excellent' : 
                       itemCount < 50 ? 'good' : 
                       itemCount < 100 ? 'moderate' : 'slow',
    };
  }, [items.length]);

  return {
    items: memoizedItems,
    renderItem: memoizedRenderItem,
    performanceMetrics,
  };
}

/**
 * Hook for debouncing sortable operations to improve performance
 */
export function useDebouncedSortable<T extends SortableItem>(
  items: T[],
  onItemsChange: (items: T[]) => void,
  delay: number = 150
) {
  const [debouncedItems, setDebouncedItems] = useState(items);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update items with debouncing
  const updateItems = useCallback(
    (newItems: T[]) => {
      setDebouncedItems(newItems);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        onItemsChange(newItems);
      }, delay);
    },
    [onItemsChange, delay]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sync with external items changes
  useEffect(() => {
    setDebouncedItems(items);
  }, [items]);

  return {
    items: debouncedItems,
    updateItems,
  };
}

/**
 * Hook for tracking sortable list performance metrics
 */
export function useSortableMetrics<T extends SortableItem>(items: T[]) {
  const [metrics, setMetrics] = useState({
    dragCount: 0,
    reorderCount: 0,
    averageDragDuration: 0,
    lastDragTime: 0,
  });

  const dragStartTimeRef = useRef<number>(0);

  const trackDragStart = useCallback(() => {
    dragStartTimeRef.current = Date.now();
    setMetrics(prev => ({
      ...prev,
      dragCount: prev.dragCount + 1,
    }));
  }, []);

  const trackDragEnd = useCallback(() => {
    const duration = Date.now() - dragStartTimeRef.current;
    setMetrics(prev => ({
      ...prev,
      reorderCount: prev.reorderCount + 1,
      averageDragDuration: (prev.averageDragDuration + duration) / 2,
      lastDragTime: duration,
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      dragCount: 0,
      reorderCount: 0,
      averageDragDuration: 0,
      lastDragTime: 0,
    });
  }, []);

  return {
    metrics,
    trackDragStart,
    trackDragEnd,
    resetMetrics,
  };
}