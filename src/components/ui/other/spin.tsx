"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Spin Component like Ant Design

export interface SpinProps {
  spinning?: boolean
  size?: 'small' | 'default' | 'large'
  tip?: React.ReactNode
  delay?: number
  indicator?: React.ReactNode
  wrapperClassName?: string
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const Spin: React.FC<SpinProps> = ({
  spinning = true,
  size = 'default',
  tip,
  delay = 0,
  indicator,
  wrapperClassName,
  className,
  style,
  children
}) => {
  const [isVisible, setIsVisible] = React.useState(delay === 0)

  React.useEffect(() => {
    if (delay > 0 && spinning) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(spinning)
    }
  }, [spinning, delay])

  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8"
  }

  const renderIndicator = () => {
    if (indicator) return indicator

    return (
      <Loader2 className={cn(
        "animate-spin text-blue-600",
        sizeClasses[size]
      )} />
    )
  }

  const renderSpinner = () => {
    if (!isVisible) return null

    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )} style={style}>
        {renderIndicator()}
        {tip && (
          <div className="text-sm text-gray-600 mt-2">
            {tip}
          </div>
        )}
      </div>
    )
  }

  if (!children) {
    return renderSpinner()
  }

  return (
    <div className={cn("relative", wrapperClassName)}>
      {/* Overlay */}
      {isVisible && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          {renderSpinner()}
        </div>
      )}
      
      {/* Content */}
      <div className={cn(isVisible && "pointer-events-none select-none")}>
        {children}
      </div>
    </div>
  )
}

export { Spin }