'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { SortableItem, SortableContainerProps, SortableOptions } from './types'
import { ANIMATION_PRESETS } from './utils/animations'
import { useVirtualizedSortable, useDebouncedSortable, useSortablePersistence } from './hooks/useVirtualizedSortable'

export function SortableContainer<T extends SortableItem>({
  items,
  onItemsChange,
  renderItem,
  className,
  options = {},
  loading = false,
  emptyMessage = 'No items to display',
  title,
  description
}: SortableContainerProps<T>) {
  const {
    enableMultiSelect = false,
    enableVirtualization = false,
    maxItems,
    persistOrder = false,
    animationPreset = 'smooth',
    onError
  } = options

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)

  // Animation configuration
  const animationConfig = ANIMATION_PRESETS[animationPreset]

  // Debounced updates for performance
  const { items: debouncedItems, updateItems } = useDebouncedSortable(
    items,
    onItemsChange,
    150
  )

  // Virtualization for large lists
  const { virtualizer, visibleItems, isVirtualized } = useVirtualizedSortable(
    debouncedItems,
    {
      containerHeight: 400,
      itemHeight: 80,
      enabled: enableVirtualization && debouncedItems.length > 50,
    }
  )

  // Persistence layer
  const { saveOrder, loadOrder } = useSortablePersistence(
    debouncedItems,
    'sortable-container',
    updateItems,
    { enabled: persistOrder }
  )

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const itemIds = useMemo(() => debouncedItems.map(item => item.id), [debouncedItems])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false)
    
    const { active, over } = event

    if (over && active.id !== over.id) {
      try {
        const oldIndex = debouncedItems.findIndex(item => item.id === active.id)
        const newIndex = debouncedItems.findIndex(item => item.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(debouncedItems, oldIndex, newIndex)
          
          // Update order property if items have it
          const orderedItems = newItems.map((item, index) => ({
            ...item,
            order: index
          }))

          updateItems(orderedItems)

          // Persist if enabled
          if (persistOrder) {
            saveOrder(orderedItems)
          }
        }
      } catch (error) {
        console.error('Error handling drag end:', error)
        onError?.(error as Error)
      }
    }
  }, [debouncedItems, updateItems, persistOrder, saveOrder, onError])

  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    if (!enableMultiSelect) return

    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }, [enableMultiSelect])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )
    }

    if (debouncedItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }

    const itemsToRender = isVirtualized ? visibleItems : debouncedItems

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div 
            className={cn(
              'space-y-2 transition-all duration-200',
              isDragging && 'pointer-events-none'
            )}
            style={{
              height: isVirtualized ? virtualizer?.getTotalSize() : 'auto',
              position: 'relative'
            }}
          >
            {itemsToRender.map((item, index) => (
              <div
                key={item.id}
                style={isVirtualized ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualizer?.getOffsetForIndex(index)}px)`,
                } : undefined}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      {(title || description) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && (
              <CardTitle className="flex items-center gap-2">
                {title}
                {maxItems && (
                  <Badge variant="outline">
                    {debouncedItems.length}/{maxItems}
                  </Badge>
                )}
              </CardTitle>
            )}
            {enableMultiSelect && selectedItems.size > 0 && (
              <Badge variant="secondary">
                {selectedItems.size} selected
              </Badge>
            )}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

export default SortableContainer