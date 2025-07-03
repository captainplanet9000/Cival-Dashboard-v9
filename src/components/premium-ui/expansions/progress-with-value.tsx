'use client'

import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressWithValueProps extends React.ComponentPropsWithoutRef<typeof Progress> {
  value: number
  max?: number
  showValue?: boolean
  valuePrefix?: string
  valueSuffix?: string
  size?: 'sm' | 'md' | 'lg'
}

const ProgressWithValue = React.forwardRef<
  React.ElementRef<typeof Progress>,
  ProgressWithValueProps
>(({ 
  value, 
  max = 100, 
  showValue = true, 
  valuePrefix = '', 
  valueSuffix = '%', 
  size = 'md',
  className,
  ...props 
}, ref) => {
  const percentage = Math.round((value / max) * 100)

  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm', 
    lg: 'h-4 text-base'
  }

  return (
    <div className="w-full space-y-2">
      <Progress
        ref={ref}
        value={percentage}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
      {showValue && (
        <div className="flex justify-between items-center">
          <span className={cn('font-medium', sizeClasses[size])}>
            {valuePrefix}{value}{valueSuffix}
          </span>
          <span className={cn('text-muted-foreground', sizeClasses[size])}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  )
})

ProgressWithValue.displayName = 'ProgressWithValue'

export { ProgressWithValue }