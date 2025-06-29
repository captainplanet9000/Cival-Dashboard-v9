"use client"

import * as React from "react"
import { useForm, FormProvider, useFormContext, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EnhancedDropdown, type DropdownOption } from "./enhanced-dropdown"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Eye, EyeOff, Upload, X, Plus, Minus, AlertCircle } from "lucide-react"
import { format } from "date-fns"

// Enhanced Form Components inspired by PrimeReact/Ant Design with validation

export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'switch' | 'radio' | 'date' | 'file' | 'array'
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  options?: DropdownOption[]
  validation?: z.ZodType<any>
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  accept?: string // for file inputs
  multiple?: boolean // for file inputs
  rows?: number // for textarea
  className?: string
  render?: (field: any, fieldState: any) => React.ReactNode
}

export interface EnhancedFormProps {
  fields: FormFieldConfig[]
  onSubmit: (data: any) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  schema?: z.ZodType<any>
  defaultValues?: Record<string, any>
  layout?: 'horizontal' | 'vertical'
  size?: 'small' | 'medium' | 'large'
  className?: string
  submitText?: string
  cancelText?: string
  showCancel?: boolean
  resetOnSubmit?: boolean
}

const EnhancedForm: React.FC<EnhancedFormProps> = ({
  fields,
  onSubmit,
  onCancel,
  loading = false,
  schema,
  defaultValues = {},
  layout = 'vertical',
  size = 'medium',
  className,
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = false,
  resetOnSubmit = false
}) => {
  // Generate default schema if not provided
  const formSchema = React.useMemo(() => {
    if (schema) return schema

    const schemaFields: Record<string, z.ZodType<any>> = {}
    
    fields.forEach(field => {
      if (field.validation) {
        schemaFields[field.name] = field.validation
      } else {
        // Auto-generate basic validation
        let fieldSchema: z.ZodType<any> = z.any()
        
        if (field.type === 'email') {
          fieldSchema = z.string().email()
        } else if (field.type === 'url') {
          fieldSchema = z.string().url()
        } else if (field.type === 'number') {
          fieldSchema = z.number()
          if (field.min !== undefined) fieldSchema = fieldSchema.min(field.min)
          if (field.max !== undefined) fieldSchema = fieldSchema.max(field.max)
        } else if (field.type === 'text' || field.type === 'password' || field.type === 'tel' || field.type === 'textarea') {
          fieldSchema = z.string()
        } else if (field.type === 'checkbox' || field.type === 'switch') {
          fieldSchema = z.boolean()
        } else if (field.type === 'array') {
          fieldSchema = z.array(z.any())
        }
        
        if (field.required) {
          if (field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'tel' || field.type === 'url' || field.type === 'textarea') {
            fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`)
          }
        } else {
          fieldSchema = fieldSchema.optional()
        }
        
        schemaFields[field.name] = fieldSchema
      }
    })
    
    return z.object(schemaFields)
  }, [fields, schema])

  // Form setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: field.defaultValue ?? (field.type === 'checkbox' || field.type === 'switch' ? false : field.type === 'array' ? [] : '')
      }), {}),
      ...defaultValues
    }
  })

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data)
      if (resetOnSubmit) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const sizeClasses = {
    small: "text-sm",
    medium: "text-base", 
    large: "text-lg"
  }

  const inputSizeClasses = {
    small: "h-8 px-2 text-sm",
    medium: "h-10 px-3 text-sm",
    large: "h-12 px-4 text-base"
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-6", className)}>
        <div className={cn(
          "grid gap-6",
          layout === 'horizontal' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}>
          {fields.map((field) => (
            <FormField key={field.name} field={field} layout={layout} size={size} />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={loading}
            className={cn(
              "min-w-24",
              sizeClasses[size]
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : (
              submitText
            )}
          </Button>
          
          {showCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className={sizeClasses[size]}
            >
              {cancelText}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  )
}

const FormField: React.FC<{
  field: FormFieldConfig
  layout: 'horizontal' | 'vertical'
  size: 'small' | 'medium' | 'large'
}> = ({ field, layout, size }) => {
  const { control, formState: { errors } } = useFormContext()
  const error = errors[field.name]

  const inputSizeClasses = {
    small: "h-8 px-2 text-sm",
    medium: "h-10 px-3 text-sm", 
    large: "h-12 px-4 text-base"
  }

  return (
    <div className={cn("space-y-2", field.className)}>
      <div className={cn(
        layout === 'horizontal' ? "grid grid-cols-3 gap-4 items-start" : "space-y-2"
      )}>
        <div className={cn(
          layout === 'horizontal' ? "col-span-1 pt-2" : ""
        )}>
          <Label htmlFor={field.name} className="font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-gray-500 mt-1">{field.description}</p>
          )}
        </div>

        <div className={cn(
          layout === 'horizontal' ? "col-span-2" : ""
        )}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField, fieldState }) => {
              if (field.render) {
                return field.render(controllerField, fieldState)
              }

              switch (field.type) {
                case 'text':
                case 'email':
                case 'tel':
                case 'url':
                case 'number':
                  return (
                    <Input
                      {...controllerField}
                      type={field.type}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className={cn(inputSizeClasses[size], error && "border-red-500")}
                    />
                  )

                case 'password':
                  return <PasswordField field={field} controllerField={controllerField} size={size} error={!!error} />

                case 'textarea':
                  return (
                    <Textarea
                      {...controllerField}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      rows={field.rows || 3}
                      className={cn(error && "border-red-500")}
                    />
                  )

                case 'select':
                  return (
                    <EnhancedDropdown
                      options={field.options || []}
                      value={controllerField.value}
                      onValueChange={controllerField.onChange}
                      placeholder={field.placeholder}
                      searchable
                      clearable
                      className={cn(error && "border-red-500")}
                    />
                  )

                case 'multiselect':
                  return <MultiSelectField field={field} controllerField={controllerField} error={!!error} />

                case 'checkbox':
                  return (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                        disabled={field.disabled}
                      />
                      <Label htmlFor={field.name} className="text-sm font-normal">
                        {field.placeholder || field.label}
                      </Label>
                    </div>
                  )

                case 'switch':
                  return (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                        disabled={field.disabled}
                      />
                      <Label htmlFor={field.name} className="text-sm font-normal">
                        {field.placeholder || field.label}
                      </Label>
                    </div>
                  )

                case 'radio':
                  return (
                    <RadioGroup
                      value={controllerField.value}
                      onValueChange={controllerField.onChange}
                      disabled={field.disabled}
                    >
                      {field.options?.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} />
                          <Label className="text-sm font-normal">{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )

                case 'date':
                  return <DateField controllerField={controllerField} field={field} error={!!error} />

                case 'file':
                  return <FileField controllerField={controllerField} field={field} error={!!error} />

                case 'array':
                  return <ArrayField controllerField={controllerField} field={field} error={!!error} />

                default:
                  return (
                    <Input
                      {...controllerField}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className={cn(inputSizeClasses[size], error && "border-red-500")}
                    />
                  )
              }
            }}
          />

          {error && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error.message as string}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PasswordField: React.FC<{
  field: FormFieldConfig
  controllerField: any
  size: 'small' | 'medium' | 'large'
  error: boolean
}> = ({ field, controllerField, size, error }) => {
  const [showPassword, setShowPassword] = React.useState(false)

  const inputSizeClasses = {
    small: "h-8 px-2 text-sm pr-10",
    medium: "h-10 px-3 text-sm pr-10",
    large: "h-12 px-4 text-base pr-12"
  }

  return (
    <div className="relative">
      <Input
        {...controllerField}
        type={showPassword ? "text" : "password"}
        placeholder={field.placeholder}
        disabled={field.disabled}
        className={cn(inputSizeClasses[size], error && "border-red-500")}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded p-1"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

const DateField: React.FC<{
  controllerField: any
  field: FormFieldConfig
  error: boolean
}> = ({ controllerField, field, error }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !controllerField.value && "text-muted-foreground",
            error && "border-red-500"
          )}
          disabled={field.disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {controllerField.value ? format(controllerField.value, "PPP") : field.placeholder || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={controllerField.value}
          onSelect={controllerField.onChange}
          disabled={(date) => field.disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

const FileField: React.FC<{
  controllerField: any
  field: FormFieldConfig
  error: boolean
}> = ({ controllerField, field, error }) => {
  const [files, setFiles] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    controllerField.onChange(field.multiple ? selectedFiles : selectedFiles[0])
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    controllerField.onChange(field.multiple ? newFiles : null)
  }

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer",
          error && "border-red-500"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          Click to upload {field.multiple ? 'files' : 'a file'} or drag and drop
        </p>
        {field.accept && (
          <p className="text-xs text-gray-500 mt-1">
            Accepted: {field.accept}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={field.accept}
        multiple={field.multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={field.disabled}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ArrayField: React.FC<{
  controllerField: any
  field: FormFieldConfig
  error: boolean
}> = ({ controllerField, field, error }) => {
  const addItem = () => {
    const currentValue = controllerField.value || []
    controllerField.onChange([...currentValue, ''])
  }

  const removeItem = (index: number) => {
    const currentValue = controllerField.value || []
    controllerField.onChange(currentValue.filter((_: any, i: number) => i !== index))
  }

  const updateItem = (index: number, value: string) => {
    const currentValue = controllerField.value || []
    const newValue = [...currentValue]
    newValue[index] = value
    controllerField.onChange(newValue)
  }

  return (
    <div className="space-y-2">
      {(controllerField.value || []).map((item: string, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`${field.label} ${index + 1}`}
            className={cn(error && "border-red-500")}
            disabled={field.disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeItem(index)}
            disabled={field.disabled}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        disabled={field.disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {field.label}
      </Button>
    </div>
  )
}

const MultiSelectField: React.FC<{
  field: FormFieldConfig
  controllerField: any
  error: boolean
}> = ({ field, controllerField, error }) => {
  const selectedValues = controllerField.value || []
  
  const handleToggle = (value: string) => {
    const isSelected = selectedValues.includes(value)
    const newValue = isSelected
      ? selectedValues.filter((v: string) => v !== value)
      : [...selectedValues, value]
    
    controllerField.onChange(newValue)
  }

  return (
    <div className={cn("border rounded-md p-2 space-y-2", error && "border-red-500")}>
      {field.options?.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            checked={selectedValues.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
            disabled={field.disabled || option.disabled}
          />
          <Label className="text-sm font-normal">{option.label}</Label>
        </div>
      ))}
    </div>
  )
}

export { EnhancedForm, type FormFieldConfig }