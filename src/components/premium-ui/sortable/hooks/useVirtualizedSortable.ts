'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { SortableItem } from '../types'

// Virtualization hook for large lists
export function useVirtualizedSortable<T extends SortableItem>(
  items: T[],
  options: {
    containerHeight: number
    itemHeight: number
    enabled?: boolean
  }
) {
  const { containerHeight, itemHeight, enabled = true } = options
  
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    enabled: enabled && items.length > 50,
  })

  const isVirtualized = enabled && items.length > 50

  const visibleItems = useMemo(() => {
    if (!isVirtualized) return items
    
    return virtualizer.getVirtualItems().map(virtualRow => items[virtualRow.index])
  }, [items, virtualizer, isVirtualized])

  return {
    parentRef,
    virtualizer: isVirtualized ? virtualizer : null,
    visibleItems,
    isVirtualized,
  }
}

// Debounced updates for performance
export function useDebouncedSortable<T extends SortableItem>(
  items: T[],
  onItemsChange: (items: T[]) => void,
  delay: number = 150
) {
  const [debouncedItems, setDebouncedItems] = useState(items)

  useEffect(() => {
    setDebouncedItems(items)
  }, [items])

  const updateItems = useCallback((newItems: T[]) => {
    setDebouncedItems(newItems)
    
    const timeoutId = setTimeout(() => {
      onItemsChange(newItems)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [onItemsChange, delay])

  return {
    items: debouncedItems,
    updateItems,
  }
}

// Persistence hook for saving/loading order
export function useSortablePersistence<T extends SortableItem>(
  items: T[],
  storageKey: string,
  onItemsChange: (items: T[]) => void,
  options: {
    enabled?: boolean
    apiEndpoint?: string
  } = {}
) {
  const { enabled = false, apiEndpoint } = options

  const saveOrder = useCallback(async (orderedItems: T[]) => {
    if (!enabled) return

    try {
      // Save to localStorage
      const order = orderedItems.map((item, index) => ({
        id: item.id,
        order: index,
      }))
      localStorage.setItem(storageKey, JSON.stringify(order))

      // Save to API if endpoint provided
      if (apiEndpoint) {
        await fetch(apiEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order }),
        })
      }
    } catch (error) {
      console.error('Failed to save sortable order:', error)
    }
  }, [enabled, storageKey, apiEndpoint])

  const loadOrder = useCallback(async () => {
    if (!enabled) return

    try {
      // Load from localStorage first
      const stored = localStorage.getItem(storageKey)
      let order: Array<{ id: string; order: number }> = []

      if (stored) {
        order = JSON.parse(stored)
      }

      // Load from API if endpoint provided and no local storage
      if (apiEndpoint && order.length === 0) {
        const response = await fetch(apiEndpoint)
        if (response.ok) {
          const data = await response.json()
          order = data.order || []
        }
      }

      if (order.length > 0) {
        // Apply saved order
        const orderedItems = [...items].sort((a, b) => {
          const aOrder = order.find(o => o.id === a.id)?.order ?? 999
          const bOrder = order.find(o => o.id === b.id)?.order ?? 999
          return aOrder - bOrder
        })

        onItemsChange(orderedItems)
      }
    } catch (error) {
      console.error('Failed to load sortable order:', error)
    }
  }, [enabled, storageKey, apiEndpoint, items, onItemsChange])

  // Load order on mount
  useEffect(() => {
    loadOrder()
  }, [])

  return {
    saveOrder,
    loadOrder,
  }
}

// Performance monitoring hook
export function useSortablePerformance() {
  const [metrics, setMetrics] = useState({
    dragStartTime: 0,
    dragEndTime: 0,
    dragDuration: 0,
    itemCount: 0,
    renderTime: 0,
  })

  const startDragPerformance = useCallback((itemCount: number) => {
    const startTime = performance.now()
    setMetrics(prev => ({
      ...prev,
      dragStartTime: startTime,
      itemCount,
    }))
  }, [])

  const endDragPerformance = useCallback(() => {
    const endTime = performance.now()
    setMetrics(prev => ({
      ...prev,
      dragEndTime: endTime,
      dragDuration: endTime - prev.dragStartTime,
    }))
  }, [])

  const measureRenderTime = useCallback((renderFn: () => void) => {
    const startTime = performance.now()
    renderFn()
    const endTime = performance.now()
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime,
    }))
  }, [])

  return {
    metrics,
    startDragPerformance,
    endDragPerformance,
    measureRenderTime,
  }
}