"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown, ChevronRight, Circle, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Enhanced Dropdown with search, icons, and advanced features like PrimeReact/Ant Design

interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  description?: string
  group?: string
}

interface EnhancedDropdownProps {
  options: DropdownOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  className?: string
  trigger?: React.ReactNode
  maxHeight?: number
  showGroupLabels?: boolean
}

const EnhancedDropdown = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  EnhancedDropdownProps
>(({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchable = false,
  clearable = false,
  loading = false,
  className,
  trigger,
  maxHeight = 300,
  showGroupLabels = true,
  ...props
}, ref) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const selectedOption = options.find(option => option.value === value)
  
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])
  
  const groupedOptions = React.useMemo(() => {
    if (!showGroupLabels) return { "": filteredOptions }
    
    return filteredOptions.reduce((acc, option) => {
      const group = option.group || ""
      if (!acc[group]) acc[group] = []
      acc[group].push(option)
      return acc
    }, {} as Record<string, DropdownOption[]>)
  }, [filteredOptions, showGroupLabels])

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue)
    setOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange?.("")
    setSearchQuery("")
  }

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-gray-300 transition-colors",
          className
        )}
        {...props}
      >
        {trigger || (
          <>
            <div className="flex items-center gap-2 flex-1 truncate">
              {selectedOption?.icon && (
                <span className="flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span className={cn(
                "truncate",
                !selectedOption && "text-gray-500"
              )}>
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {clearable && selectedOption && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-shrink-0 rounded-full p-1 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
            </div>
          </>
        )}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn(
            "z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          sideOffset={4}
          style={{ maxHeight }}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm border-gray-200 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-gray-500">
                {searchQuery ? "No options found" : "No options available"}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {showGroupLabels && group && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => (
                    <DropdownMenuPrimitive.Item
                      key={option.value}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                        "focus:bg-blue-50 focus:text-blue-900 hover:bg-gray-50",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        value === option.value && "bg-blue-50 text-blue-900"
                      )}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {value === option.value && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </DropdownMenuPrimitive.Item>
                  ))}
                </div>
              ))
            )}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
})

EnhancedDropdown.displayName = "EnhancedDropdown"

export { EnhancedDropdown, type DropdownOption }