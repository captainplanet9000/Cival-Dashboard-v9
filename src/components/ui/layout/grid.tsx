"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Enhanced Grid System like Ant Design

export interface RowProps {
  align?: 'top' | 'middle' | 'bottom' | 'stretch'
  gutter?: number | [number, number] | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number }
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export interface ColProps {
  span?: number
  order?: number
  offset?: number
  push?: number
  pull?: number
  xs?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  sm?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  md?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  lg?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  xl?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  xxl?: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number }
  flex?: string | number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const Row: React.FC<RowProps> = ({
  align = 'top',
  gutter = 0,
  justify = 'start',
  wrap = true,
  className,
  style,
  children
}) => {
  const getGutterValue = (): [number, number] => {
    if (typeof gutter === 'number') {
      return [gutter, 0]
    }
    if (Array.isArray(gutter)) {
      return [gutter[0] || 0, gutter[1] || 0]
    }
    if (typeof gutter === 'object') {
      // In a real implementation, you'd use a responsive hook here
      const { lg = 0, md = 0, sm = 0, xs = 0 } = gutter
      return [lg || md || sm || xs, 0]
    }
    return [0, 0]
  }

  const [horizontalGutter, verticalGutter] = getGutterValue()

  const alignClasses = {
    top: 'items-start',
    middle: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    'space-around': 'justify-around',
    'space-between': 'justify-between',
    'space-evenly': 'justify-evenly'
  }

  const rowStyle: React.CSSProperties = {
    marginLeft: horizontalGutter > 0 ? -horizontalGutter / 2 : 0,
    marginRight: horizontalGutter > 0 ? -horizontalGutter / 2 : 0,
    marginTop: verticalGutter > 0 ? -verticalGutter / 2 : 0,
    marginBottom: verticalGutter > 0 ? -verticalGutter / 2 : 0,
    ...style
  }

  // Clone children to pass gutter values
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Col) {
      return React.cloneElement(child, {
        ...child.props,
        __gutter: [horizontalGutter, verticalGutter]
      } as any)
    }
    return child
  })

  return (
    <div
      className={cn(
        "flex",
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
      style={rowStyle}
    >
      {childrenWithProps}
    </div>
  )
}

const Col: React.FC<ColProps & { __gutter?: [number, number] }> = ({
  span = 24,
  order,
  offset = 0,
  push = 0,
  pull = 0,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  flex,
  className,
  style,
  children,
  __gutter = [0, 0]
}) => {
  const [horizontalGutter, verticalGutter] = __gutter

  const getResponsiveProps = (breakpoint: number | { span?: number; offset?: number; order?: number; push?: number; pull?: number } | undefined) => {
    if (typeof breakpoint === 'number') {
      return { span: breakpoint }
    }
    if (typeof breakpoint === 'object') {
      return breakpoint
    }
    return {}
  }

  // For simplicity, we'll use the lg breakpoint as default
  // In a real implementation, you'd use proper responsive breakpoints
  const responsiveProps = getResponsiveProps(lg || md || sm || xs)
  const finalSpan = responsiveProps.span ?? span
  const finalOffset = responsiveProps.offset ?? offset
  const finalOrder = responsiveProps.order ?? order
  const finalPush = responsiveProps.push ?? push
  const finalPull = responsiveProps.pull ?? pull

  const getWidthClass = () => {
    if (flex) {
      return flex === 'auto' ? 'flex-auto' : flex === 'none' ? 'flex-none' : ''
    }
    
    const percentage = (finalSpan / 24) * 100
    return `w-[${percentage}%]`
  }

  const getOffsetClass = () => {
    if (finalOffset === 0) return ''
    const percentage = (finalOffset / 24) * 100
    return `ml-[${percentage}%]`
  }

  const colStyle: React.CSSProperties = {
    paddingLeft: horizontalGutter > 0 ? horizontalGutter / 2 : 0,
    paddingRight: horizontalGutter > 0 ? horizontalGutter / 2 : 0,
    paddingTop: verticalGutter > 0 ? verticalGutter / 2 : 0,
    paddingBottom: verticalGutter > 0 ? verticalGutter / 2 : 0,
    order: finalOrder,
    left: finalPush > 0 ? `${(finalPush / 24) * 100}%` : undefined,
    right: finalPull > 0 ? `${(finalPull / 24) * 100}%` : undefined,
    position: finalPush > 0 || finalPull > 0 ? 'relative' : undefined,
    flex: typeof flex === 'string' ? flex : typeof flex === 'number' ? `${flex} ${flex} auto` : undefined,
    ...style
  }

  return (
    <div
      className={cn(
        getWidthClass(),
        getOffsetClass(),
        "relative",
        className
      )}
      style={colStyle}
    >
      {children}
    </div>
  )
}

export { Row, Col }