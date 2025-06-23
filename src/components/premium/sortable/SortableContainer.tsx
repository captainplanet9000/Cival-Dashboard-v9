'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import {
  SortableItem,
  SortableContainerProps,
  SortableEventHandlers,
  TradingSortableOptions,
  DEFAULT_TRADING_OPTIONS,
} from './types';

interface ExtendedSortableContainerProps<T extends SortableItem>
  extends SortableContainerProps<T> {
  options?: TradingSortableOptions;
  eventHandlers?: SortableEventHandlers<T>;
  renderOverlay?: (item: T) => React.ReactNode;
}

export function SortableContainer<T extends SortableItem>({
  items,
  onItemsReorder,
  disabled = false,
  className,
  children,
  orientation = 'vertical',
  strategy,
  options = DEFAULT_TRADING_OPTIONS,
  eventHandlers = {},
  renderOverlay,
}: ExtendedSortableContainerProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Configure sensors for touch and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Determine sorting strategy
  const sortingStrategy = useMemo(() => {
    if (strategy) {
      switch (strategy) {
        case 'verticalListSortingStrategy':
          return verticalListSortingStrategy;
        case 'horizontalListSortingStrategy':
          return horizontalListSortingStrategy;
        case 'rectSortingStrategy':
          return rectSortingStrategy;
        default:
          return verticalListSortingStrategy;
      }
    }
    return orientation === 'horizontal' 
      ? horizontalListSortingStrategy 
      : verticalListSortingStrategy;
  }, [strategy, orientation]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = items.find(item => item.id === active.id);
    
    if (item) {
      setActiveItem(item);
      eventHandlers.onDragStart?.(item);
    }
  }, [items, eventHandlers]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onItemsReorder(reorderedItems);
      
      // Persist order if enabled
      if (options.persistOrder && options.onOrderPersist) {
        options.onOrderPersist(reorderedItems).catch(console.error);
      }
      
      // Call event handler
      const draggedItem = items[oldIndex];
      if (draggedItem) {
        eventHandlers.onDragEnd?.(draggedItem);
      }
    }
  }, [items, onItemsReorder, options, eventHandlers]);

  // Handle item selection for multi-select
  const handleItemSelect = useCallback((item: T, selected: boolean) => {
    if (!options.enableMultiSelect) return;
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(item.id.toString());
      } else {
        newSet.delete(item.id.toString());
      }
      return newSet;
    });
    
    eventHandlers.onItemSelect?.(item, selected);
  }, [options.enableMultiSelect, eventHandlers]);

  // Handle item click
  const handleItemClick = useCallback((item: T) => {
    eventHandlers.onItemClick?.(item);
  }, [eventHandlers]);

  // Handle item double click
  const handleItemDoubleClick = useCallback((item: T) => {
    eventHandlers.onItemDoubleClick?.(item);
  }, [eventHandlers]);

  // Render drag overlay
  const renderDragOverlay = useCallback(() => {
    if (!activeItem) return null;
    
    if (renderOverlay) {
      return renderOverlay(activeItem);
    }
    
    // Default overlay rendering - find the child for the active item
    const activeIndex = items.findIndex(item => item.id === activeItem.id);
    if (activeIndex === -1) return null;
    
    return (
      <div className="opacity-80 transform rotate-2 scale-105 shadow-lg">
        {children(activeItem, activeIndex)}
      </div>
    );
  }, [activeItem, items, children, renderOverlay]);

  // Check if max items limit is reached
  const isMaxItemsReached = options.maxItems && items.length >= options.maxItems;

  return (
    <div className={cn('w-full', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={sortingStrategy}
          disabled={disabled}
        >
          <div
            className={cn(
              'space-y-2',
              orientation === 'horizontal' && 'flex space-x-2 space-y-0',
              disabled && 'opacity-50 pointer-events-none'
            )}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'transition-all duration-200',
                  selectedItems.has(item.id.toString()) && 'ring-2 ring-blue-500',
                  item.disabled && 'opacity-50 pointer-events-none'
                )}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
              >
                {children(item, index)}
              </div>
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {renderDragOverlay()}
        </DragOverlay>
      </DndContext>
      
      {/* Status indicators */}
      {isMaxItemsReached && (
        <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Maximum items limit reached ({options.maxItems})
        </div>
      )}
      
      {/* Multi-select controls */}
      {options.enableMultiSelect && selectedItems.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear Selection
              </button>
              <button
                onClick={() => {
                  const selected = items.filter(item => 
                    selectedItems.has(item.id.toString())
                  );
                  eventHandlers.onBulkAction?.(selected, 'delete');
                }}
                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40"
              >
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SortableContainer;