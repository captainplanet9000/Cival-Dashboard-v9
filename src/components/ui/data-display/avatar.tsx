"use client"

import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Avatar Component like Ant Design

export interface AvatarProps {
  alt?: string
  children?: React.ReactNode
  icon?: React.ReactNode
  shape?: 'circle' | 'square'
  size?: number | 'large' | 'small' | 'default'
  src?: string
  srcSet?: string
  draggable?: boolean
  crossOrigin?: 'anonymous' | 'use-credentials' | ''
  onError?: () => boolean
  className?: string
  style?: React.CSSProperties
}

export interface AvatarGroupProps {
  children: React.ReactElement[]
  maxCount?: number
  maxPopoverPlacement?: 'top' | 'bottom'
  maxPopoverTrigger?: 'hover' | 'focus' | 'click'
  maxStyle?: React.CSSProperties
  size?: number | 'large' | 'small' | 'default'
  className?: string
}

const Avatar: React.FC<AvatarProps> = ({
  alt,
  children,
  icon,
  shape = 'circle',
  size = 'default',
  src,
  srcSet,
  draggable = false,
  crossOrigin,
  onError,
  className,
  style
}) => {
  const [hasError, setHasError] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  const handleError = () => {
    const errorHandled = onError?.()
    if (!errorHandled) {
      setHasError(true)
    }
  }

  const handleLoad = () => {
    setHasLoaded(true)
  }

  const getSizeClasses = () => {
    if (typeof size === 'number') {
      return {
        width: size,
        height: size,
        fontSize: size * 0.5
      }
    }

    const sizeMap = {
      small: { width: 24, height: 24, fontSize: 12 },
      default: { width: 32, height: 32, fontSize: 16 },
      large: { width: 40, height: 40, fontSize: 20 }
    }

    return sizeMap[size] || sizeMap.default
  }

  const sizeStyles = getSizeClasses()

  const renderContent = () => {
    if (src && !hasError) {
      return (
        <img
          src={src}
          srcSet={srcSet}
          alt={alt}
          draggable={draggable}
          crossOrigin={crossOrigin}
          onError={handleError}
          onLoad={handleLoad}
          className="w-full h-full object-cover"
        />
      )
    }

    if (icon) {
      return <span className="flex items-center justify-center w-full h-full">{icon}</span>
    }

    if (children) {
      return (
        <span 
          className="flex items-center justify-center w-full h-full font-medium text-white"
          style={{ fontSize: sizeStyles.fontSize }}
        >
          {children}
        </span>
      )
    }

    return (
      <span className="flex items-center justify-center w-full h-full">
        <User className="w-1/2 h-1/2" />
      </span>
    )
  }

  // Generate background color based on children text
  const getBackgroundColor = () => {
    if (src && !hasError) return 'transparent'
    if (typeof children === 'string') {
      const colors = [
        '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac',
        '#4299e1', '#667eea', '#9f7aea', '#ed64a6', '#fc8181'
      ]
      let hash = 0
      for (let i = 0; i < children.length; i++) {
        hash = children.charCodeAt(i) + ((hash << 5) - hash)
      }
      return colors[Math.abs(hash) % colors.length]
    }
    return '#d69e2e'
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-gray-100 text-gray-600 select-none overflow-hidden",
        shape === 'circle' ? "rounded-full" : "rounded-md",
        className
      )}
      style={{
        width: sizeStyles.width,
        height: sizeStyles.height,
        backgroundColor: getBackgroundColor(),
        ...style
      }}
    >
      {renderContent()}
    </span>
  )
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  maxCount,
  maxPopoverPlacement = 'top',
  maxPopoverTrigger = 'hover',
  maxStyle,
  size = 'default',
  className
}) => {
  const childrenArray = React.Children.toArray(children) as React.ReactElement[]
  const visibleChildren = maxCount ? childrenArray.slice(0, maxCount) : childrenArray
  const hiddenCount = maxCount ? Math.max(0, childrenArray.length - maxCount) : 0

  return (
    <div className={cn("flex items-center", className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={cn(
            "relative",
            index > 0 && "-ml-2"
          )}
          style={{ zIndex: visibleChildren.length - index }}
        >
          {React.cloneElement(child, {
            size: child.props.size || size,
            className: cn(
              "border-2 border-white",
              child.props.className
            )
          })}
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div
          className="-ml-2 relative"
          style={{ zIndex: 0 }}
        >
          <Avatar
            size={size}
            className="border-2 border-white bg-gray-200 text-gray-600"
            style={maxStyle}
          >
            +{hiddenCount}
          </Avatar>
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarGroup }