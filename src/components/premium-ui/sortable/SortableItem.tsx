'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableItemProps {
  id: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  showHandle?: boolean
  handleClassName?: string
  animationDuration?: number
}

export function SortableItem({
  id,
  children,
  className,
  disabled = false,
  showHandle = true,
  handleClassName,
  animationDuration = 200
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    isOver,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || `transform ${animationDuration}ms ease`,
  }

  const handleProps = showHandle
    ? {
        ...attributes,
        ...listeners,
      }
    : {}

  const itemProps = showHandle
    ? {}
    : {
        ...attributes,
        ...listeners,
      }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group touch-none',
        isDragging && 'z-50 opacity-50',
        isSorting && 'transition-transform',
        isOver && 'scale-105',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...itemProps}
    >
      <div className="flex items-center space-x-2">
        {showHandle && !disabled && (
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100',
              isDragging && 'cursor-grabbing opacity-100',
              handleClassName
            )}
            {...handleProps}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-md pointer-events-none" />
      )}
    </div>
  )
}

export default SortableItem