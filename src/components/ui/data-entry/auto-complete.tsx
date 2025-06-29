"use client"

import * as React from "react"
import { Search, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Enhanced AutoComplete Component like Ant Design

export interface AutoCompleteOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
  data?: any
}

export interface AutoCompleteProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  options: AutoCompleteOption[]
  onSearch?: (value: string) => void
  onSelect?: (value: string, option: AutoCompleteOption) => void
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  allowClear?: boolean
  autoFocus?: boolean
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  status?: 'error' | 'warning'
  filterOption?: boolean | ((inputValue: string, option: AutoCompleteOption) => boolean)
  notFoundContent?: React.ReactNode
  className?: string
  dropdownClassName?: string
  maxHeight?: number
  loading?: boolean
}

const AutoComplete: React.FC<AutoCompleteProps> = ({
  value,
  defaultValue = '',
  placeholder = 'Search...',
  options,
  onSearch,
  onSelect,
  onChange,
  onBlur,
  onFocus,
  allowClear = false,
  autoFocus = false,
  disabled = false,
  size = 'middle',
  status,
  filterOption = true,
  notFoundContent = "No data",
  className,
  dropdownClassName,
  maxHeight = 200,
  loading = false
}) => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || defaultValue)
  const [searchValue, setSearchValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  const filteredOptions = React.useMemo(() => {
    if (!filterOption) return options

    const searchTerm = searchValue.toLowerCase()
    
    if (typeof filterOption === 'function') {
      return options.filter(option => filterOption(searchTerm, option))
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm)
    )
  }, [options, searchValue, filterOption])

  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, AutoCompleteOption[]> = {}
    
    filteredOptions.forEach(option => {
      const group = option.group || ''
      if (!groups[group]) groups[group] = []
      groups[group].push(option)
    })
    
    return groups
  }, [filteredOptions])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    setSearchValue(newValue)
    onChange?.(newValue)
    onSearch?.(newValue)
    
    if (!open && newValue) {
      setOpen(true)
    }
  }

  const handleSelect = (selectedValue: string) => {
    const option = options.find(opt => opt.value === selectedValue)
    if (option && !option.disabled) {
      setInputValue(option.label)
      setSearchValue('')
      setOpen(false)
      onSelect?.(selectedValue, option)
      onChange?.(option.label)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue('')
    setSearchValue('')
    onChange?.('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  const sizeClasses = {
    small: "h-8 px-2 text-sm",
    middle: "h-9 px-3 text-sm",
    large: "h-11 px-4 text-base"
  }

  const statusClasses = {
    error: "border-red-500 focus:border-red-500 focus:ring-red-500",
    warning: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500"
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              setOpen(true)
              onFocus?.()
            }}
            onBlur={() => {
              // Delay to allow option selection
              setTimeout(() => {
                setOpen(false)
                onBlur?.()
              }, 200)
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              sizeClasses[size],
              status && statusClasses[status],
              allowClear && inputValue && "pr-8",
              className
            )}
          />
          
          {allowClear && inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded p-1"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          dropdownClassName
        )}
        style={{ maxHeight }}
      >
        <Command>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>
                {typeof notFoundContent === 'string' ? (
                  <div className="text-center py-6 text-gray-500">
                    {notFoundContent}
                  </div>
                ) : (
                  notFoundContent
                )}
              </CommandEmpty>
            ) : (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <CommandGroup 
                  key={group} 
                  heading={group || undefined}
                >
                  {groupOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      {inputValue === option.label && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { AutoComplete }