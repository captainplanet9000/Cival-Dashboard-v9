'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  formatLabel?: (value: number) => string
  className?: string
  disabled?: boolean
  showLabels?: boolean
  showTooltips?: boolean
  precision?: number
  marks?: Array<{ value: number; label?: string }>
}

export function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  formatLabel,
  className,
  disabled = false,
  showLabels = true,
  showTooltips = true,
  precision = 0,
  marks = []
}: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const [dragValue, setDragValue] = useState<[number, number]>(value)

  useEffect(() => {
    setDragValue(value)
  }, [value])

  const formatValue = useCallback((val: number) => {
    if (formatLabel) {
      return formatLabel(val)
    }
    return val.toFixed(precision)
  }, [formatLabel, precision])

  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100
  }, [min, max])

  const getValueFromPercentage = useCallback((percentage: number) => {
    const range = max - min
    const value = min + (percentage / 100) * range
    const steppedValue = Math.round(value / step) * step
    return Math.max(min, Math.min(max, steppedValue))
  }, [min, max, step])

  const handleMouseDown = useCallback((type: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(type)
  }, [disabled])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const slider = (e.currentTarget as HTMLElement).querySelector('[data-slider-track]')
    if (!slider) return

    const rect = slider.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const newValue = getValueFromPercentage(percentage)

    setDragValue(prev => {
      const [currentMin, currentMax] = prev
      if (isDragging === 'min') {
        return [Math.min(newValue, currentMax), currentMax]
      } else {
        return [currentMin, Math.max(newValue, currentMin)]
      }
    })
  }, [isDragging, getValueFromPercentage])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onValueChange(dragValue)
      setIsDragging(null)
    }
  }, [isDragging, dragValue, onValueChange])

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
      const handleGlobalMouseUp = () => handleMouseUp()

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return

    const slider = e.currentTarget
    const rect = slider.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100
    const clickValue = getValueFromPercentage(percentage)

    const [currentMin, currentMax] = dragValue
    const distanceToMin = Math.abs(clickValue - currentMin)
    const distanceToMax = Math.abs(clickValue - currentMax)

    // Move the closer handle
    if (distanceToMin < distanceToMax) {
      const newValue: [number, number] = [Math.min(clickValue, currentMax), currentMax]
      setDragValue(newValue)
      onValueChange(newValue)
    } else {
      const newValue: [number, number] = [currentMin, Math.max(clickValue, currentMin)]
      setDragValue(newValue)
      onValueChange(newValue)
    }
  }, [disabled, isDragging, getValueFromPercentage, dragValue, onValueChange])

  const minPercentage = getPercentage(dragValue[0])
  const maxPercentage = getPercentage(dragValue[1])

  return (
    <div className={cn('w-full', className)}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}

      {/* Slider */}
      <div
        className={cn(
          'relative h-6 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleTrackClick}
      >
        {/* Track */}
        <div
          data-slider-track
          className="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-full transform -translate-y-1/2"
        />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-2 bg-primary rounded-full transform -translate-y-1/2"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        {/* Marks */}
        {marks.map((mark) => {
          const markPercentage = getPercentage(mark.value)
          return (
            <div
              key={mark.value}
              className="absolute top-1/2 w-1 h-1 bg-muted-foreground rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markPercentage}%` }}
            />
          )
        })}

        {/* Min handle */}
        <div
          className={cn(
            'absolute top-1/2 w-5 h-5 bg-primary border-2 border-background rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab shadow-md transition-all',
            isDragging === 'min' && 'scale-110 cursor-grabbing',
            disabled && 'cursor-not-allowed'
          )}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={handleMouseDown('min')}
        />

        {/* Max handle */}
        <div
          className={cn(
            'absolute top-1/2 w-5 h-5 bg-primary border-2 border-background rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab shadow-md transition-all',
            isDragging === 'max' && 'scale-110 cursor-grabbing',
            disabled && 'cursor-not-allowed'
          )}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={handleMouseDown('max')}
        />

        {/* Tooltips */}
        {showTooltips && (
          <>
            <div
              className={cn(
                'absolute bottom-8 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border shadow-md transform -translate-x-1/2',
                isDragging === 'min' ? 'opacity-100' : 'opacity-0',
                'transition-opacity pointer-events-none'
              )}
              style={{ left: `${minPercentage}%` }}
            >
              {formatValue(dragValue[0])}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
            </div>
            <div
              className={cn(
                'absolute bottom-8 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border shadow-md transform -translate-x-1/2',
                isDragging === 'max' ? 'opacity-100' : 'opacity-0',
                'transition-opacity pointer-events-none'
              )}
              style={{ left: `${maxPercentage}%` }}
            >
              {formatValue(dragValue[1])}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
            </div>
          </>
        )}
      </div>

      {/* Value display */}
      <div className="flex justify-between text-sm mt-2">
        <span className="text-muted-foreground">
          Min: <span className="font-medium text-foreground">{formatValue(dragValue[0])}</span>
        </span>
        <span className="text-muted-foreground">
          Max: <span className="font-medium text-foreground">{formatValue(dragValue[1])}</span>
        </span>
      </div>

      {/* Mark labels */}
      {marks.length > 0 && marks.some(mark => mark.label) && (
        <div className="relative mt-2">
          {marks.map((mark) => {
            if (!mark.label) return null
            const markPercentage = getPercentage(mark.value)
            return (
              <div
                key={mark.value}
                className="absolute text-xs text-muted-foreground transform -translate-x-1/2"
                style={{ left: `${markPercentage}%` }}
              >
                {mark.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DualRangeSlider