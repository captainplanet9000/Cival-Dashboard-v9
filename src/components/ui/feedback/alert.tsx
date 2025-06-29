"use client"

import * as React from "react"
import { X, Info, CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Enhanced Alert Component like Ant Design

export interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error'
  message: React.ReactNode
  description?: React.ReactNode
  showIcon?: boolean
  icon?: React.ReactNode
  closable?: boolean
  closeText?: React.ReactNode
  closeIcon?: React.ReactNode
  afterClose?: () => void
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void
  banner?: boolean
  className?: string
  action?: React.ReactNode
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  description,
  showIcon = false,
  icon,
  closable = false,
  closeText,
  closeIcon,
  afterClose,
  onClose,
  banner = false,
  className,
  action
}) => {
  const [visible, setVisible] = React.useState(true)

  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    setVisible(false)
    onClose?.(e)
    
    // Call afterClose after animation completes
    setTimeout(() => {
      afterClose?.()
    }, 300)
  }

  const getIcon = () => {
    if (icon) return icon

    const iconMap = {
      success: <CheckCircle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />
    }

    return iconMap[type]
  }

  const typeStyles = {
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: "text-green-600",
      banner: "bg-green-100 border-green-300"
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "text-blue-600",
      banner: "bg-blue-100 border-blue-300"
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: "text-yellow-600",
      banner: "bg-yellow-100 border-yellow-300"
    },
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: "text-red-600",
      banner: "bg-red-100 border-red-300"
    }
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 transition-all duration-300",
        banner ? typeStyles[type].banner : typeStyles[type].container,
        banner && "border-l-4 border-t-0 border-r-0 border-b-0 rounded-none",
        className
      )}
    >
      <div className="flex">
        {/* Icon */}
        {showIcon && (
          <div className={cn("flex-shrink-0", typeStyles[type].icon)}>
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className={cn("flex-1", showIcon && "ml-3")}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Message */}
              <div className={cn(
                "font-medium",
                description ? "text-sm" : "text-base"
              )}>
                {message}
              </div>

              {/* Description */}
              {description && (
                <div className="mt-1 text-sm opacity-90">
                  {description}
                </div>
              )}

              {/* Action */}
              {action && (
                <div className="mt-3">
                  {action}
                </div>
              )}
            </div>

            {/* Close button */}
            {closable && (
              <div className="ml-4 flex-shrink-0">
                {closeText ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className={cn(
                      "h-auto p-0 text-sm font-medium hover:bg-transparent",
                      typeStyles[type].icon
                    )}
                  >
                    {closeText}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className={cn(
                      "h-6 w-6 p-0 hover:bg-black/10",
                      typeStyles[type].icon
                    )}
                  >
                    {closeIcon || <X className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Alert.ErrorBoundary component
export interface AlertErrorBoundaryProps {
  children: React.ReactNode
  message?: React.ReactNode
  description?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface AlertErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class AlertErrorBoundary extends React.Component<
  AlertErrorBoundaryProps,
  AlertErrorBoundaryState
> {
  constructor(props: AlertErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AlertErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="error"
          message={this.props.message || "Something went wrong"}
          description={
            this.props.description || 
            (process.env.NODE_ENV === 'development' && this.state.error?.message)
          }
          showIcon
        />
      )
    }

    return this.props.children
  }
}

Alert.ErrorBoundary = AlertErrorBoundary

export { Alert }