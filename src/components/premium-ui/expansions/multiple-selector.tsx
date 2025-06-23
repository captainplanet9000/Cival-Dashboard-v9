'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import type { SelectOption } from './types'

interface MultipleSelectorProps {
  options: SelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxSelected?: number
  emptyMessage?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
  groupBy?: (option: SelectOption) => string
  onSearch?: (query: string) => void
  loading?: boolean
  asyncSearch?: boolean
}

export function MultipleSelector({
  options,
  value,
  onValueChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  maxSelected,
  emptyMessage = 'No options found',
  className,
  disabled = false,
  clearable = true,
  searchable = true,
  groupBy,
  onSearch,
  loading = false,
  asyncSearch = false
}: MultipleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search query
  const filteredOptions = searchQuery && !asyncSearch
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // Group options if groupBy function is provided
  const groupedOptions = groupBy
    ? filteredOptions.reduce((groups, option) => {
        const group = groupBy(option)
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(option)
        return groups
      }, {} as Record<string, SelectOption[]>)
    : null

  const selectedOptions = options.filter(option => value.includes(option.value))

  const handleSelect = useCallback((optionValue: string) => {
    if (value.includes(optionValue)) {
      // Remove from selection
      onValueChange(value.filter(v => v !== optionValue))
    } else {
      // Add to selection if not at max limit
      if (!maxSelected || value.length < maxSelected) {
        onValueChange([...value, optionValue])
      }
    }
  }, [value, onValueChange, maxSelected])

  const handleRemove = useCallback((optionValue: string) => {
    onValueChange(value.filter(v => v !== optionValue))
  }, [value, onValueChange])

  const handleClear = useCallback(() => {
    onValueChange([])
  }, [onValueChange])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (asyncSearch && onSearch) {
      onSearch(query)
    }
  }, [asyncSearch, onSearch])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && searchQuery === '' && value.length > 0) {
      // Remove last selected item on backspace
      handleRemove(value[value.length - 1])
    }
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const renderSelectedItems = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {selectedOptions.map((option) => (
          <Badge
            key={option.value}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
          >
            {option.label}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(option.value)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    )
  }

  const renderOptions = () => {
    if (loading) {
      return <CommandEmpty>Loading...</CommandEmpty>
    }

    if (filteredOptions.length === 0) {
      return <CommandEmpty>{emptyMessage}</CommandEmpty>
    }

    if (groupedOptions) {
      return Object.entries(groupedOptions).map(([group, groupOptions]) => (
        <CommandGroup key={group} heading={group}>
          {groupOptions.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={() => handleSelect(option.value)}
              disabled={option.disabled}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  value.includes(option.value) ? 'opacity-100' : 'opacity-0'
                )}
              />
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ))
    }

    return filteredOptions.map((option) => (
      <CommandItem
        key={option.value}
        value={option.value}
        onSelect={() => handleSelect(option.value)}
        disabled={option.disabled}
      >
        <Check
          className={cn(
            'mr-2 h-4 w-4',
            value.includes(option.value) ? 'opacity-100' : 'opacity-0'
          )}
        />
        {option.label}
      </CommandItem>
    ))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between min-h-10 h-auto',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={disabled}
        >
          <div className="flex-1 text-left overflow-hidden">
            {renderSelectedItems()}
          </div>
          <div className="flex items-center space-x-1">
            {clearable && value.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-0 shadow-none focus:ring-0 focus:ring-offset-0"
              />
            </div>
          )}
          <CommandList>
            {renderOptions()}
          </CommandList>
        </Command>
        
        {/* Selection summary */}
        {(maxSelected || value.length > 0) && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {value.length} selected
            {maxSelected && ` of ${maxSelected} maximum`}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MultipleSelector