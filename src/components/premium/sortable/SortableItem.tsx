'use client';

import React, { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { SortableItemProps } from './types';

const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  ({ id, children, disabled = false, className, handle = true, data, ...props }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({
      id,
      disabled,
      data,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group relative flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200',
          isDragging && 'opacity-50 shadow-lg scale-105 z-50',
          isOver && 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20',
          disabled && 'opacity-50 cursor-not-allowed',
          'cursor-grab active:cursor-grabbing',
          className
        )}
        {...props}
      >
        {/* Drag handle */}
        {handle && !disabled && (
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'flex-1 min-w-0',
            !handle && '!cursor-grab active:!cursor-grabbing'
          )}
          {...(!handle && !disabled ? { ...attributes, ...listeners } : {})}
        >
          {children}
        </div>

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg" />
        )}
      </div>
    );
  }
);

SortableItem.displayName = 'SortableItem';

export { SortableItem };
export default SortableItem;