"use client"

import * as React from "react"
import { Check, X, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Steps Component like Ant Design

export interface StepItem {
  title: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
  status?: 'wait' | 'process' | 'finish' | 'error'
  subTitle?: string
}

export interface StepsProps {
  current?: number
  direction?: 'horizontal' | 'vertical'
  labelPlacement?: 'horizontal' | 'vertical'
  progressDot?: boolean | ((icon: React.ReactNode, step: StepItem, index: number) => React.ReactNode)
  size?: 'default' | 'small'
  status?: 'wait' | 'process' | 'finish' | 'error'
  type?: 'default' | 'navigation'
  onChange?: (current: number) => void
  className?: string
  items: StepItem[]
  responsive?: boolean
}

const Steps: React.FC<StepsProps> = ({
  current = 0,
  direction = 'horizontal',
  labelPlacement = 'horizontal',
  progressDot = false,
  size = 'default',
  status = 'process',
  type = 'default',
  onChange,
  className,
  items,
  responsive = true
}) => {
  const getStepStatus = (index: number, step: StepItem): 'wait' | 'process' | 'finish' | 'error' => {
    if (step.status) return step.status
    
    if (index < current) return 'finish'
    if (index === current) return status
    return 'wait'
  }

  const getStepIcon = (index: number, step: StepItem, stepStatus: string) => {
    if (progressDot) {
      if (typeof progressDot === 'function') {
        return progressDot(step.icon, step, index)
      }
      return (
        <div className={cn(
          "w-3 h-3 rounded-full border-2",
          stepStatus === 'finish' && "bg-blue-600 border-blue-600",
          stepStatus === 'process' && "bg-blue-600 border-blue-600",
          stepStatus === 'error' && "bg-red-600 border-red-600",
          stepStatus === 'wait' && "bg-white border-gray-300"
        )} />
      )
    }

    if (step.icon) return step.icon

    switch (stepStatus) {
      case 'finish':
        return <Check className="h-4 w-4" />
      case 'error':
        return <X className="h-4 w-4" />
      case 'process':
        return <Clock className="h-4 w-4" />
      default:
        return <span className="text-sm font-medium">{index + 1}</span>
    }
  }

  const handleStepClick = (index: number) => {
    if (type === 'navigation' && !items[index].disabled && onChange) {
      onChange(index)
    }
  }

  const sizeClasses = {
    default: {
      icon: "w-8 h-8",
      title: "text-base",
      description: "text-sm"
    },
    small: {
      icon: "w-6 h-6",
      title: "text-sm",
      description: "text-xs"
    }
  }

  const iconContainerClasses = (stepStatus: string, isClickable: boolean) => cn(
    "flex items-center justify-center rounded-full border-2 transition-all",
    sizeClasses[size].icon,
    stepStatus === 'finish' && "bg-blue-600 border-blue-600 text-white",
    stepStatus === 'process' && "bg-blue-600 border-blue-600 text-white",
    stepStatus === 'error' && "bg-red-600 border-red-600 text-white",
    stepStatus === 'wait' && "bg-white border-gray-300 text-gray-600",
    isClickable && "cursor-pointer hover:border-blue-400"
  )

  if (direction === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {items.map((step, index) => {
          const stepStatus = getStepStatus(index, step)
          const isClickable = type === 'navigation' && !step.disabled
          const isLast = index === items.length - 1

          return (
            <div key={index} className="relative">
              <div 
                className={cn(
                  "flex",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => handleStepClick(index)}
              >
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div className={iconContainerClasses(stepStatus, isClickable)}>
                    {getStepIcon(index, step, stepStatus)}
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={cn(
                      "w-px h-12 mt-2",
                      stepStatus === 'finish' ? "bg-blue-600" : "bg-gray-300"
                    )} />
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 pb-8">
                  <div className={cn(
                    "font-medium",
                    sizeClasses[size].title,
                    stepStatus === 'process' && "text-blue-600",
                    stepStatus === 'error' && "text-red-600",
                    stepStatus === 'wait' && "text-gray-600"
                  )}>
                    {step.title}
                    {step.subTitle && (
                      <span className="ml-2 text-gray-500 font-normal">
                        {step.subTitle}
                      </span>
                    )}
                  </div>
                  
                  {step.description && (
                    <div className={cn(
                      "text-gray-600 mt-1",
                      sizeClasses[size].description
                    )}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal layout
  return (
    <div className={cn(
      "flex items-start",
      responsive && "overflow-x-auto",
      className
    )}>
      {items.map((step, index) => {
        const stepStatus = getStepStatus(index, step)
        const isClickable = type === 'navigation' && !step.disabled
        const isLast = index === items.length - 1

        return (
          <div key={index} className={cn(
            "flex items-center",
            !isLast && "flex-1"
          )}>
            <div 
              className={cn(
                "flex flex-col items-center min-w-0",
                labelPlacement === 'vertical' ? "text-center" : "flex-row",
                isClickable && "cursor-pointer"
              )}
              onClick={() => handleStepClick(index)}
            >
              {/* Icon */}
              <div className={iconContainerClasses(stepStatus, isClickable)}>
                {getStepIcon(index, step, stepStatus)}
              </div>

              {/* Content */}
              <div className={cn(
                labelPlacement === 'vertical' ? "mt-2" : "ml-3 flex-1 min-w-0"
              )}>
                <div className={cn(
                  "font-medium",
                  sizeClasses[size].title,
                  stepStatus === 'process' && "text-blue-600",
                  stepStatus === 'error' && "text-red-600",
                  stepStatus === 'wait' && "text-gray-600",
                  labelPlacement === 'vertical' && "truncate"
                )}>
                  {step.title}
                  {step.subTitle && (
                    <span className="ml-2 text-gray-500 font-normal">
                      {step.subTitle}
                    </span>
                  )}
                </div>
                
                {step.description && (
                  <div className={cn(
                    "text-gray-600 mt-1",
                    sizeClasses[size].description,
                    labelPlacement === 'vertical' && "truncate"
                  )}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className={cn(
                "flex-1 h-px mx-4",
                labelPlacement === 'vertical' && "mt-4",
                stepStatus === 'finish' ? "bg-blue-600" : "bg-gray-300"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { Steps, type StepItem }