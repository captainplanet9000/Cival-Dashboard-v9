'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { CalendarDays, DollarSign, Percent, TrendingUp, Target, Shield } from 'lucide-react'

interface FieldConfig {
  description?: string
  placeholder?: string
  inputProps?: Record<string, any>
  showLabel?: boolean
  orderIndex?: number
  fieldType?: 'input' | 'select' | 'switch' | 'textarea' | 'slider' | 'currency' | 'percentage'
  options?: Array<{ label: string; value: string | number }>
  min?: number
  max?: number
  step?: number
  icon?: React.ReactNode
}

interface AutoFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => void | Promise<void>
  defaultValues?: Partial<T>
  fieldConfig?: Partial<Record<keyof T, FieldConfig>>
  title?: string
  description?: string
  submitText?: string
  className?: string
  isLoading?: boolean
  children?: React.ReactNode
}

export function AutoForm<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  fieldConfig = {},
  title,
  description,
  submitText = 'Submit',
  className,
  isLoading = false,
  children
}: AutoFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (data: T) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit])

  const fields = useMemo(() => {
    return getFormFields(schema, fieldConfig)
  }, [schema, fieldConfig])

  const sortedFields = useMemo(() => {
    return fields.sort((a, b) => {
      const aOrder = fieldConfig[a.name as keyof T]?.orderIndex ?? 999
      const bOrder = fieldConfig[b.name as keyof T]?.orderIndex ?? 999
      return aOrder - bOrder
    })
  }, [fields, fieldConfig])

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {sortedFields.map((field) => (
              <AutoFormField
                key={field.name}
                form={form}
                field={field}
                config={fieldConfig[field.name as keyof T]}
              />
            ))}
            {children}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : submitText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

interface FormField {
  name: string
  type: string
  required: boolean
  defaultValue?: any
  enum?: string[]
}

interface AutoFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  field: FormField
  config?: FieldConfig
}

function AutoFormField<T extends FieldValues>({
  form,
  field,
  config = {}
}: AutoFormFieldProps<T>) {
  const {
    description,
    placeholder,
    inputProps = {},
    showLabel = true,
    fieldType,
    options,
    min,
    max,
    step = 1,
    icon
  } = config

  const renderField = () => {
    // Handle enum fields as select
    if (field.enum && field.enum.length > 0) {
      return (
        <Select
          onValueChange={(value) => form.setValue(field.name as Path<T>, value as any)}
          defaultValue={form.getValues(field.name as Path<T>)}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || `Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {field.enum.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Handle custom options
    if (options && options.length > 0) {
      return (
        <Select
          onValueChange={(value) => form.setValue(field.name as Path<T>, value as any)}
          defaultValue={form.getValues(field.name as Path<T>)}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || `Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Handle different field types
    switch (fieldType || getFieldType(field.type)) {
      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={form.watch(field.name as Path<T>)}
              onCheckedChange={(checked) => form.setValue(field.name as Path<T>, checked as any)}
              {...inputProps}
            />
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={placeholder}
            {...form.register(field.name as Path<T>)}
            {...inputProps}
          />
        )

      case 'slider':
        return (
          <div className="space-y-3">
            <Slider
              value={[form.watch(field.name as Path<T>) || min || 0]}
              onValueChange={(value) => form.setValue(field.name as Path<T>, value[0] as any)}
              min={min || 0}
              max={max || 100}
              step={step}
              className="w-full"
              {...inputProps}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min || 0}</span>
              <span className="font-medium">{form.watch(field.name as Path<T>) || min || 0}</span>
              <span>{max || 100}</span>
            </div>
          </div>
        )

      case 'currency':
        return (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              placeholder={placeholder || '0.00'}
              className="pl-9"
              {...form.register(field.name as Path<T>, { valueAsNumber: true })}
              {...inputProps}
            />
          </div>
        )

      case 'percentage':
        return (
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.1"
              placeholder={placeholder || '0.0'}
              className="pl-9"
              {...form.register(field.name as Path<T>, { valueAsNumber: true })}
              {...inputProps}
            />
          </div>
        )

      default:
        return (
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {icon}
              </div>
            )}
            <Input
              type={getInputType(field.type)}
              placeholder={placeholder}
              className={icon ? 'pl-9' : ''}
              {...form.register(field.name as Path<T>, {
                valueAsNumber: field.type === 'number',
                valueAsDate: field.type === 'date',
              })}
              {...inputProps}
            />
          </div>
        )
    }
  }

  return (
    <FormField
      control={form.control}
      name={field.name as Path<T>}
      render={({ field: formField }) => (
        <FormItem>
          {showLabel && (
            <FormLabel className="flex items-center gap-2">
              {config.icon}
              {formatLabel(field.name)}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </FormLabel>
          )}
          <FormControl>
            {renderField()}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Helper functions
function getFormFields(schema: z.ZodSchema, fieldConfig: Record<string, FieldConfig>): FormField[] {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    return Object.entries(shape).map(([name, field]) => ({
      name,
      type: getZodType(field),
      required: !field.isOptional(),
      defaultValue: field._def.defaultValue?.(),
      enum: getZodEnum(field)
    }))
  }
  return []
}

function getZodType(field: any): string {
  if (field instanceof z.ZodString) return 'string'
  if (field instanceof z.ZodNumber) return 'number'
  if (field instanceof z.ZodBoolean) return 'boolean'
  if (field instanceof z.ZodDate) return 'date'
  if (field instanceof z.ZodEnum) return 'enum'
  if (field instanceof z.ZodOptional) return getZodType(field._def.innerType)
  if (field instanceof z.ZodDefault) return getZodType(field._def.innerType)
  return 'string'
}

function getZodEnum(field: any): string[] | undefined {
  if (field instanceof z.ZodEnum) {
    return field.options
  }
  if (field instanceof z.ZodOptional) {
    return getZodEnum(field._def.innerType)
  }
  if (field instanceof z.ZodDefault) {
    return getZodEnum(field._def.innerType)
  }
  return undefined
}

function getFieldType(type: string): string {
  switch (type) {
    case 'boolean': return 'switch'
    case 'number': return 'input'
    case 'date': return 'input'
    default: return 'input'
  }
}

function getInputType(type: string): string {
  switch (type) {
    case 'number': return 'number'
    case 'date': return 'date'
    case 'email': return 'email'
    default: return 'text'
  }
}

function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Trading-specific schemas
export const TradingOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  orderType: z.enum(['market', 'limit', 'stop', 'stop-limit']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'DAY']),
  reduceOnly: z.boolean().default(false),
})

export const StrategyConfigSchema = z.object({
  name: z.string().min(1, 'Strategy name is required'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  maxPositionSize: z.number().positive(),
  riskPerTrade: z.number().min(0.1).max(10),
  stopLossPercent: z.number().min(0.1).max(50),
  takeProfitPercent: z.number().min(0.1).max(100),
  symbols: z.array(z.string()).min(1, 'At least one symbol required'),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
})

export const RiskManagementSchema = z.object({
  maxDailyLoss: z.number().positive(),
  maxPositions: z.number().positive(),
  portfolioHeatPercent: z.number().min(1).max(100),
  correlationLimit: z.number().min(0).max(1),
  enableTrailingStop: z.boolean().default(false),
  trailingStopPercent: z.number().min(0.1).max(20).optional(),
})

export default AutoForm