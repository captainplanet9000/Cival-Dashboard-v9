"use client"

import * as React from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Enhanced Wizard Component like PrimeReact/Ant Design

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  optional?: boolean
  validate?: (data: any) => boolean | string | Promise<boolean | string>
  content: React.ReactNode
  disabled?: boolean
}

export interface WizardProps {
  steps: WizardStep[]
  currentStep?: number
  onStepChange?: (step: number) => void
  onComplete?: (data: any) => void | Promise<void>
  onCancel?: () => void
  data?: any
  onDataChange?: (data: any) => void
  allowStepClick?: boolean
  showProgress?: boolean
  size?: 'small' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
  className?: string
  loading?: boolean
  completedSteps?: number[]
  errorSteps?: number[]
}

const Wizard: React.FC<WizardProps> = ({
  steps,
  currentStep = 0,
  onStepChange,
  onComplete,
  onCancel,
  data = {},
  onDataChange,
  allowStepClick = true,
  showProgress = true,
  size = 'medium',
  layout = 'horizontal',
  className,
  loading = false,
  completedSteps = [],
  errorSteps = []
}) => {
  const [internalStep, setInternalStep] = React.useState(currentStep)
  const [internalData, setInternalData] = React.useState(data)
  const [validationErrors, setValidationErrors] = React.useState<Record<number, string>>({})
  const [isValidating, setIsValidating] = React.useState(false)

  const activeStep = currentStep ?? internalStep
  const activeData = data ?? internalData

  const updateData = React.useCallback((newData: any) => {
    if (onDataChange) {
      onDataChange(newData)
    } else {
      setInternalData(newData)
    }
  }, [onDataChange])

  const goToStep = React.useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    if (steps[stepIndex].disabled) return

    // Validate current step before moving forward
    if (stepIndex > activeStep) {
      const currentStepConfig = steps[activeStep]
      if (currentStepConfig.validate) {
        setIsValidating(true)
        try {
          const isValid = await currentStepConfig.validate(activeData)
          if (typeof isValid === 'string') {
            setValidationErrors(prev => ({ ...prev, [activeStep]: isValid }))
            setIsValidating(false)
            return
          }
          if (!isValid) {
            setValidationErrors(prev => ({ ...prev, [activeStep]: 'Please complete this step correctly' }))
            setIsValidating(false)
            return
          }
          // Clear validation error if step is now valid
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[activeStep]
            return newErrors
          })
        } catch (error) {
          setValidationErrors(prev => ({ ...prev, [activeStep]: 'Validation failed' }))
          setIsValidating(false)
          return
        }
        setIsValidating(false)
      }
    }

    if (onStepChange) {
      onStepChange(stepIndex)
    } else {
      setInternalStep(stepIndex)
    }
  }, [activeStep, activeData, steps, onStepChange])

  const nextStep = () => goToStep(activeStep + 1)
  const prevStep = () => goToStep(activeStep - 1)

  const handleComplete = async () => {
    // Validate final step
    const finalStepConfig = steps[activeStep]
    if (finalStepConfig.validate) {
      setIsValidating(true)
      try {
        const isValid = await finalStepConfig.validate(activeData)
        if (typeof isValid === 'string') {
          setValidationErrors(prev => ({ ...prev, [activeStep]: isValid }))
          setIsValidating(false)
          return
        }
        if (!isValid) {
          setValidationErrors(prev => ({ ...prev, [activeStep]: 'Please complete this step correctly' }))
          setIsValidating(false)
          return
        }
      } catch (error) {
        setValidationErrors(prev => ({ ...prev, [activeStep]: 'Validation failed' }))
        setIsValidating(false)
        return
      }
      setIsValidating(false)
    }

    if (onComplete) {
      await onComplete(activeData)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed'
    if (errorSteps.includes(stepIndex) || validationErrors[stepIndex]) return 'error'
    if (stepIndex === activeStep) return 'active'
    if (stepIndex < activeStep) return 'completed'
    return 'pending'
  }

  const sizeClasses = {
    small: {
      card: "p-4",
      title: "text-lg",
      description: "text-sm",
      button: "h-8 px-3 text-sm"
    },
    medium: {
      card: "p-6",
      title: "text-xl",
      description: "text-base",
      button: "h-10 px-4 text-sm"
    },
    large: {
      card: "p-8",
      title: "text-2xl",
      description: "text-lg",
      button: "h-12 px-6 text-base"
    }
  }

  const isLastStep = activeStep === steps.length - 1
  const isFirstStep = activeStep === 0

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Indicator */}
      {showProgress && (
        <Card>
          <CardContent className={sizeClasses[size].card}>
            <div className={cn(
              "flex",
              layout === 'horizontal' ? "items-center justify-between" : "flex-col space-y-4"
            )}>
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isClickable = allowStepClick && !step.disabled

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center",
                      layout === 'horizontal' ? "flex-1" : "w-full"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center",
                        isClickable && "cursor-pointer",
                        layout === 'horizontal' ? "flex-1" : "w-full"
                      )}
                      onClick={isClickable ? () => goToStep(index) : undefined}
                    >
                      {/* Step Circle */}
                      <div className={cn(
                        "flex items-center justify-center rounded-full border-2 font-semibold",
                        size === 'small' ? "w-8 h-8 text-sm" : size === 'medium' ? "w-10 h-10 text-sm" : "w-12 h-12 text-base",
                        status === 'completed' && "bg-green-500 border-green-500 text-white",
                        status === 'active' && "bg-blue-500 border-blue-500 text-white",
                        status === 'error' && "bg-red-500 border-red-500 text-white",
                        status === 'pending' && "bg-gray-100 border-gray-300 text-gray-600",
                        step.disabled && "opacity-50"
                      )}>
                        {status === 'completed' ? (
                          <Check className={size === 'small' ? "h-4 w-4" : "h-5 w-5"} />
                        ) : step.icon ? (
                          <span className={size === 'small' ? "text-xs" : "text-sm"}>{step.icon}</span>
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Step Content */}
                      <div className={cn(
                        "ml-3 flex-1",
                        layout === 'vertical' && "min-w-0"
                      )}>
                        <div className={cn(
                          "font-medium",
                          sizeClasses[size].title,
                          status === 'active' && "text-blue-600",
                          status === 'completed' && "text-green-600",
                          status === 'error' && "text-red-600",
                          step.disabled && "text-gray-400"
                        )}>
                          {step.title}
                          {step.optional && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Optional
                            </Badge>
                          )}
                        </div>
                        {step.description && (
                          <div className={cn(
                            "text-gray-500",
                            sizeClasses[size].description,
                            step.disabled && "text-gray-400"
                          )}>
                            {step.description}
                          </div>
                        )}
                        {validationErrors[index] && (
                          <div className="text-red-500 text-sm mt-1">
                            {validationErrors[index]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connector Line */}
                    {layout === 'horizontal' && index < steps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-px mx-4",
                        status === 'completed' ? "bg-green-300" : "bg-gray-300"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader className={sizeClasses[size].card}>
          <CardTitle className={sizeClasses[size].title}>
            {steps[activeStep]?.title}
          </CardTitle>
          {steps[activeStep]?.description && (
            <CardDescription className={sizeClasses[size].description}>
              {steps[activeStep].description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={sizeClasses[size].card}>
          {steps[activeStep]?.content}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={loading || isValidating}
              className={sizeClasses[size].button}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading || isValidating}
              className={sizeClasses[size].button}
            >
              Cancel
            </Button>
          )}

          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={loading || isValidating}
              className={sizeClasses[size].button}
            >
              {loading || isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isValidating ? 'Validating...' : 'Completing...'}
                </div>
              ) : (
                'Complete'
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={loading || isValidating || steps[activeStep]?.disabled}
              className={sizeClasses[size].button}
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validating...
                </div>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Wizard Context for sharing data between steps
export const WizardContext = React.createContext<{
  data: any
  updateData: (data: any) => void
  goToStep: (step: number) => void
  currentStep: number
}>({
  data: {},
  updateData: () => {},
  goToStep: () => {},
  currentStep: 0
})

export const useWizard = () => {
  const context = React.useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a Wizard component')
  }
  return context
}

// Higher-order component to wrap wizard content with context
export const WizardProvider: React.FC<{
  children: React.ReactNode
  data: any
  updateData: (data: any) => void
  goToStep: (step: number) => void
  currentStep: number
}> = ({ children, data, updateData, goToStep, currentStep }) => {
  return (
    <WizardContext.Provider value={{ data, updateData, goToStep, currentStep }}>
      {children}
    </WizardContext.Provider>
  )
}

export { Wizard }