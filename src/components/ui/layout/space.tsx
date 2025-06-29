"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Enhanced Space Component like Ant Design

export interface SpaceProps {
  align?: 'start' | 'end' | 'center' | 'baseline'
  direction?: 'vertical' | 'horizontal'
  size?: 'small' | 'middle' | 'large' | number | [number, number]
  split?: React.ReactNode
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const Space: React.FC<SpaceProps> = ({
  align = 'center',
  direction = 'horizontal',
  size = 'small',
  split,
  wrap = false,
  className,
  style,
  children
}) => {
  const getSpacing = (): [number, number] => {
    if (typeof size === 'number') {
      return [size, size]
    }
    
    if (Array.isArray(size)) {
      return [size[0] || 0, size[1] || 0]
    }
    
    const sizeMap = {
      small: 8,
      middle: 16,
      large: 24
    }
    
    const spacing = sizeMap[size] || 8
    return [spacing, spacing]
  }

  const [horizontalSpacing, verticalSpacing] = getSpacing()

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline'
  }

  const childrenArray = React.Children.toArray(children).filter(child => 
    React.isValidElement(child) || (typeof child === 'string' && child.trim() !== '')
  )

  if (childrenArray.length === 0) {
    return null
  }

  const renderChildren = () => {
    return childrenArray.map((child, index) => {
      const isLast = index === childrenArray.length - 1
      
      const itemStyle: React.CSSProperties = {}
      
      if (!isLast) {
        if (direction === 'horizontal') {
          itemStyle.marginRight = horizontalSpacing
        } else {
          itemStyle.marginBottom = verticalSpacing
        }
      }

      return (
        <React.Fragment key={index}>
          <div className="inline-block" style={itemStyle}>
            {child}
          </div>
          {split && !isLast && (
            <div 
              className="inline-block"
              style={{
                [direction === 'horizontal' ? 'marginRight' : 'marginBottom']: 
                  direction === 'horizontal' ? horizontalSpacing : verticalSpacing
              }}
            >
              {split}
            </div>
          )}
        </React.Fragment>
      )
    })
  }

  return (
    <div
      className={cn(
        "inline-flex",
        direction === 'vertical' ? "flex-col" : "flex-row",
        alignClasses[align],
        wrap && "flex-wrap",
        className
      )}
      style={style}
    >
      {renderChildren()}
    </div>
  )
}

// Compact Space component for tighter spacing
export interface SpaceCompactProps extends Omit<SpaceProps, 'size'> {
  block?: boolean
}

const SpaceCompact: React.FC<SpaceCompactProps> = ({
  block = false,
  ...props
}) => {
  return (
    <Space
      {...props}
      size="small"
      className={cn(
        block && "flex w-full",
        props.className
      )}
    />
  )
}

Space.Compact = SpaceCompact

export { Space }