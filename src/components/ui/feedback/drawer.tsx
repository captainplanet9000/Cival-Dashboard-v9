"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

// Enhanced Drawer Component like Ant Design

export interface DrawerProps {
  title?: React.ReactNode
  placement?: 'top' | 'right' | 'bottom' | 'left'
  closable?: boolean
  destroyOnClose?: boolean
  forceRender?: boolean
  getContainer?: HTMLElement | (() => HTMLElement) | string
  mask?: boolean
  maskClosable?: boolean
  maskStyle?: React.CSSProperties
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  headerStyle?: React.CSSProperties
  drawerStyle?: React.CSSProperties
  className?: string
  size?: 'default' | 'large'
  extra?: React.ReactNode
  footer?: React.ReactNode
  footerStyle?: React.CSSProperties
  level?: string | number | Array<string | number> | null
  levelMove?: number | [number, number] | ((e: { target: any }) => number | [number, number])
  keyboard?: boolean
  push?: boolean
  closeIcon?: React.ReactNode
  zIndex?: number
  width?: string | number
  height?: string | number
  children?: React.ReactNode
  open?: boolean
  afterOpenChange?: (open: boolean) => void
  onClose?: (e: React.MouseEvent | React.KeyboardEvent) => void
}

const Drawer: React.FC<DrawerProps> = ({
  title,
  placement = 'right',
  closable = true,
  destroyOnClose = false,
  forceRender = false,
  getContainer,
  mask = true,
  maskClosable = true,
  maskStyle,
  style,
  bodyStyle,
  headerStyle,
  drawerStyle,
  className,
  size = 'default',
  extra,
  footer,
  footerStyle,
  keyboard = true,
  closeIcon = <X className="h-4 w-4" />,
  zIndex = 1000,
  width,
  height,
  children,
  open = false,
  afterOpenChange,
  onClose
}) => {
  const [isVisible, setIsVisible] = React.useState(open)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [hasBeenOpened, setHasBeenOpened] = React.useState(open || forceRender)

  React.useEffect(() => {
    if (open) {
      setHasBeenOpened(true)
      setIsVisible(true)
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        afterOpenChange?.(true)
      }, 300)
      
      return () => clearTimeout(timer)
    } else if (isVisible) {
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsAnimating(false)
        afterOpenChange?.(false)
        
        if (destroyOnClose) {
          setHasBeenOpened(false)
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [open, afterOpenChange, destroyOnClose, isVisible])

  const handleClose = (e: React.MouseEvent | React.KeyboardEvent) => {
    onClose?.(e)
  }

  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      handleClose(e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (keyboard && e.key === 'Escape') {
      handleClose(e)
    }
  }

  React.useEffect(() => {
    if (open && keyboard) {
      document.addEventListener('keydown', handleKeyDown as any)
      return () => document.removeEventListener('keydown', handleKeyDown as any)
    }
  }, [open, keyboard])

  const getSize = () => {
    if (width) return { width }
    if (height) return { height }
    
    const sizeMap = {
      default: placement === 'left' || placement === 'right' ? { width: 378 } : { height: 378 },
      large: placement === 'left' || placement === 'right' ? { width: 736 } : { height: 736 }
    }
    
    return sizeMap[size]
  }

  const getTransform = () => {
    const isOpen = open && !isAnimating
    
    switch (placement) {
      case 'top':
        return isOpen ? 'translateY(0)' : 'translateY(-100%)'
      case 'bottom':
        return isOpen ? 'translateY(0)' : 'translateY(100%)'
      case 'left':
        return isOpen ? 'translateX(0)' : 'translateX(-100%)'
      case 'right':
      default:
        return isOpen ? 'translateX(0)' : 'translateX(100%)'
    }
  }

  const getPlacementClasses = () => {
    switch (placement) {
      case 'top':
        return 'top-0 left-0 right-0'
      case 'bottom':
        return 'bottom-0 left-0 right-0'
      case 'left':
        return 'top-0 left-0 bottom-0'
      case 'right':
      default:
        return 'top-0 right-0 bottom-0'
    }
  }

  const renderDrawer = () => {
    if (!hasBeenOpened && !forceRender) return null

    return (
      <div
        className={cn(
          "fixed inset-0 overflow-hidden",
          !isVisible && "pointer-events-none"
        )}
        style={{ zIndex }}
      >
        {/* Mask */}
        {mask && (
          <div
            className={cn(
              "absolute inset-0 bg-black transition-opacity duration-300",
              open ? "opacity-50" : "opacity-0"
            )}
            style={maskStyle}
            onClick={handleMaskClick}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            "absolute bg-white shadow-lg flex flex-col transition-transform duration-300",
            getPlacementClasses(),
            className
          )}
          style={{
            transform: getTransform(),
            ...getSize(),
            ...style,
            ...drawerStyle
          }}
        >
          {/* Header */}
          {(title || extra || closable) && (
            <div
              className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between"
              style={headerStyle}
            >
              <div className="flex items-center gap-4">
                {title && (
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                )}
                {extra && <div>{extra}</div>}
              </div>
              
              {closable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  {closeIcon}
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div
            className="flex-1 overflow-auto p-6"
            style={bodyStyle}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="flex-shrink-0 px-6 py-4 border-t border-gray-200"
              style={footerStyle}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (typeof window === 'undefined') return null

  const container = getContainer
    ? typeof getContainer === 'string'
      ? document.querySelector(getContainer)
      : typeof getContainer === 'function'
      ? getContainer()
      : getContainer
    : document.body

  return container ? createPortal(renderDrawer(), container) : renderDrawer()
}

export { Drawer }