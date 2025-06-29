"use client"

import * as React from "react"
import { ChevronRight, ChevronDown, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

// Enhanced Cascader Component like Ant Design

export interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
  isLeaf?: boolean
  loading?: boolean
}

export interface CascaderProps {
  options: CascaderOption[]
  value?: string[]
  defaultValue?: string[]
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  allowClear?: boolean
  showSearch?: boolean
  expandTrigger?: 'click' | 'hover'
  changeOnSelect?: boolean
  displayRender?: (labels: string[], selectedOptions?: CascaderOption[]) => React.ReactNode
  fieldNames?: {
    label?: string
    value?: string
    children?: string
  }
  loadData?: (selectedOptions: CascaderOption[]) => void
  notFoundContent?: React.ReactNode
  popupPlacement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
  showArrow?: boolean
  suffixIcon?: React.ReactNode
  onChange?: (value: string[], selectedOptions: CascaderOption[]) => void
  onPopupVisibleChange?: (visible: boolean) => void
  className?: string
  popupClassName?: string
}

const Cascader: React.FC<CascaderProps> = ({
  options,
  value,
  defaultValue = [],
  placeholder = "Please select",
  size = 'middle',
  disabled = false,
  allowClear = true,
  showSearch = false,
  expandTrigger = 'click',
  changeOnSelect = false,
  displayRender,
  fieldNames = { label: 'label', value: 'value', children: 'children' },
  loadData,
  notFoundContent = "No data",
  popupPlacement = 'bottomLeft',
  showArrow = true,
  suffixIcon,
  onChange,
  onPopupVisibleChange,
  className,
  popupClassName
}) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value || defaultValue)
  const [searchValue, setSearchValue] = React.useState('')
  const [activeMenus, setActiveMenus] = React.useState<CascaderOption[][]>([options])
  const [selectedPath, setSelectedPath] = React.useState<CascaderOption[]>([])

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value)
      updateMenusFromValue(value)
    }
  }, [value])

  const updateMenusFromValue = (values: string[]) => {
    const path: CascaderOption[] = []
    const menus: CascaderOption[][] = [options]
    let currentOptions = options

    for (const val of values) {
      const option = currentOptions.find(opt => opt[fieldNames.value!] === val)
      if (option) {
        path.push(option)
        if (option[fieldNames.children!]) {
          currentOptions = option[fieldNames.children!]
          menus.push(currentOptions)
        }
      }
    }

    setSelectedPath(path)
    setActiveMenus(menus)
  }

  const handleOptionClick = (option: CascaderOption, level: number) => {
    if (option.disabled) return

    const newPath = [...selectedPath.slice(0, level), option]
    const newValues = newPath.map(opt => opt[fieldNames.value!])

    setSelectedPath(newPath)

    if (option[fieldNames.children!] && option[fieldNames.children!].length > 0) {
      // Has children, expand next level
      const newMenus = [...activeMenus.slice(0, level + 1), option[fieldNames.children!]]
      setActiveMenus(newMenus)

      if (changeOnSelect) {
        setSelectedValues(newValues)
        onChange?.(newValues, newPath)
      }
    } else if (option.isLeaf !== false) {
      // Is leaf node, complete selection
      setSelectedValues(newValues)
      setOpen(false)
      onChange?.(newValues, newPath)
    } else if (loadData) {
      // Dynamic loading
      option.loading = true
      loadData(newPath)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedValues([])
    setSelectedPath([])
    setActiveMenus([options])
    onChange?.([], [])
  }

  const getDisplayText = () => {
    if (displayRender) {
      const labels = selectedPath.map(opt => opt[fieldNames.label!])
      return displayRender(labels, selectedPath)
    }

    if (selectedPath.length === 0) return placeholder

    return selectedPath.map(opt => opt[fieldNames.label!]).join(' / ')
  }

  const filteredOptions = React.useMemo(() => {
    if (!showSearch || !searchValue) return options

    const search = (opts: CascaderOption[], path: CascaderOption[] = []): CascaderOption[] => {
      const results: CascaderOption[] = []

      for (const option of opts) {
        const currentPath = [...path, option]
        const label = option[fieldNames.label!].toLowerCase()
        
        if (label.includes(searchValue.toLowerCase())) {
          results.push(option)
        }

        if (option[fieldNames.children!]) {
          const childResults = search(option[fieldNames.children!], currentPath)
          if (childResults.length > 0) {
            results.push({
              ...option,
              [fieldNames.children!]: childResults
            })
          }
        }
      }

      return results
    }

    return search(options)
  }, [options, searchValue, showSearch])

  const sizeClasses = {
    small: "h-8 px-2 text-sm",
    middle: "h-9 px-3 text-sm",
    large: "h-11 px-4 text-base"
  }

  const isSelected = (option: CascaderOption, level: number) => {
    return selectedPath[level]?.[fieldNames.value!] === option[fieldNames.value!]
  }

  return (
    <Popover 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        onPopupVisibleChange?.(newOpen)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            sizeClasses[size],
            !selectedValues.length && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <div className="flex items-center gap-1">
            {allowClear && selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="hover:bg-gray-100 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showArrow && (
              suffixIcon || <ChevronDown className="h-4 w-4 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className={cn(
          "w-auto p-0",
          popupClassName
        )}
        align={popupPlacement.includes('Right') ? 'end' : 'start'}
        side={popupPlacement.includes('top') ? 'top' : 'bottom'}
      >
        <div className="flex">
          {/* Search */}
          {showSearch && (
            <div className="p-2 border-b">
              <Input
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8"
              />
            </div>
          )}

          {/* Menu columns */}
          {(showSearch && searchValue ? [filteredOptions] : activeMenus).map((menu, level) => (
            <div 
              key={level}
              className={cn(
                "min-w-[160px] max-h-64 overflow-y-auto border-r last:border-r-0",
                level > 0 && "border-l border-gray-200"
              )}
            >
              {menu.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {notFoundContent}
                </div>
              ) : (
                menu.map((option) => (
                  <div
                    key={option[fieldNames.value!]}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                      isSelected(option, level) && "bg-blue-50 text-blue-600",
                      option.disabled && "text-gray-400 cursor-not-allowed hover:bg-transparent"
                    )}
                    onClick={() => handleOptionClick(option, level)}
                  >
                    <span className="truncate">{option[fieldNames.label!]}</span>
                    
                    <div className="flex items-center gap-1">
                      {isSelected(option, level) && !option[fieldNames.children!] && !option.loading && (
                        <Check className="h-4 w-4" />
                      )}
                      
                      {option.loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
                      ) : option[fieldNames.children!] && option[fieldNames.children!].length > 0 ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : option.isLeaf === false ? (
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Cascader, type CascaderOption }