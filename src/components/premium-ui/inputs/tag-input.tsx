'use client'

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Plus, Search, TrendingUp, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface Tag {
  id: string
  label: string
  value: string
  color?: string
  icon?: React.ReactNode
  description?: string
}

interface TagInputProps {
  tags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  suggestions?: Tag[]
  placeholder?: string
  maxTags?: number
  allowDuplicates?: boolean
  allowCustomTags?: boolean
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'secondary' | 'outline'
  clearable?: boolean
  searchable?: boolean
  onSearch?: (query: string) => void
  loading?: boolean
  emptyMessage?: string
  createLabel?: string
}

export function TagInput({
  tags,
  onTagsChange,
  suggestions = [],
  placeholder = 'Add tags...',
  maxTags,
  allowDuplicates = false,
  allowCustomTags = true,
  className,
  disabled = false,
  size = 'md',
  variant = 'default',
  clearable = true,
  searchable = true,
  onSearch,
  loading = false,
  emptyMessage = 'No suggestions found',
  createLabel = 'Create tag'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focusedTagIndex, setFocusedTagIndex] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'min-h-8 px-2 py-1 text-xs',
    md: 'min-h-10 px-3 py-2 text-sm',
    lg: 'min-h-12 px-4 py-3 text-base'
  }

  const variantClasses = {
    default: 'border-input bg-background',
    secondary: 'border-muted bg-muted/50',
    outline: 'border-2 border-dashed border-muted-foreground/25 bg-transparent'
  }

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.label.toLowerCase().includes(inputValue.toLowerCase()) &&
    (allowDuplicates || !tags.some(tag => tag.value === suggestion.value))
  )

  const addTag = (tag: Tag | string) => {
    if (maxTags && tags.length >= maxTags) return

    let newTag: Tag
    if (typeof tag === 'string') {
      if (!allowCustomTags) return
      newTag = {
        id: crypto.randomUUID(),
        label: tag,
        value: tag
      }
    } else {
      newTag = tag
    }

    if (!allowDuplicates && tags.some(t => t.value === newTag.value)) return

    onTagsChange([...tags, newTag])
    setInputValue('')
    setIsOpen(false)
    setFocusedTagIndex(null)
  }

  const removeTag = (tagToRemove: Tag) => {
    onTagsChange(tags.filter(tag => tag.id !== tagToRemove.id))
  }

  const removeLastTag = () => {
    if (tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue.trim())
        }
        break
      case 'Backspace':
        if (inputValue === '' && tags.length > 0) {
          if (focusedTagIndex !== null) {
            removeTag(tags[focusedTagIndex])
            setFocusedTagIndex(null)
          } else {
            setFocusedTagIndex(tags.length - 1)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedTagIndex(null)
        break
      case 'ArrowLeft':
        if (inputValue === '' && focusedTagIndex === null && tags.length > 0) {
          setFocusedTagIndex(tags.length - 1)
        } else if (focusedTagIndex !== null && focusedTagIndex > 0) {
          setFocusedTagIndex(focusedTagIndex - 1)
        }
        break
      case 'ArrowRight':
        if (focusedTagIndex !== null) {
          if (focusedTagIndex < tags.length - 1) {
            setFocusedTagIndex(focusedTagIndex + 1)
          } else {
            setFocusedTagIndex(null)
            inputRef.current?.focus()
          }
        }
        break
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (onSearch) {
      onSearch(value)
    }
    if (value && !isOpen) {
      setIsOpen(true)
    }
  }

  const clearAllTags = () => {
    onTagsChange([])
    setFocusedTagIndex(null)
  }

  useEffect(() => {
    if (focusedTagIndex !== null) {
      inputRef.current?.blur()
    }
  }, [focusedTagIndex])

  return (
    <div className={cn('relative', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex flex-wrap items-center gap-1 rounded-md border cursor-text',
              sizeClasses[size],
              variantClasses[variant],
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => {
              if (!disabled) {
                inputRef.current?.focus()
                setIsOpen(true)
              }
            }}
          >
            {/* Render Tags */}
            {tags.map((tag, index) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                focused={focusedTagIndex === index}
                onRemove={() => removeTag(tag)}
                disabled={disabled}
                size={size}
              />
            ))}

            {/* Input Field */}
            <div className="flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                disabled={disabled || (maxTags ? tags.length >= maxTags : false)}
                className="border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onFocus={() => setIsOpen(true)}
              />
            </div>

            {/* Clear Button */}
            {clearable && tags.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  clearAllTags()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>

        {/* Suggestions Dropdown */}
        <PopoverContent 
          className="w-full p-0" 
          side="bottom" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            {searchable && (
              <CommandInput
                placeholder="Search tags..."
                value={inputValue}
                onValueChange={handleInputChange}
              />
            )}
            <CommandList>
              {loading ? (
                <CommandEmpty>Loading...</CommandEmpty>
              ) : filteredSuggestions.length === 0 && inputValue ? (
                <CommandGroup>
                  {allowCustomTags && (
                    <CommandItem
                      onSelect={() => addTag(inputValue)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {createLabel}: "{inputValue}"
                    </CommandItem>
                  )}
                  {!allowCustomTags && (
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                  )}
                </CommandGroup>
              ) : (
                <CommandGroup>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => addTag(suggestion)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {suggestion.icon}
                        <div>
                          <span>{suggestion.label}</span>
                          {suggestion.description && (
                            <p className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {suggestion.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: suggestion.color }}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      {maxTags && (
        <p className="text-xs text-muted-foreground mt-1">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  )
}

interface TagBadgeProps {
  tag: Tag
  focused: boolean
  onRemove: () => void
  disabled: boolean
  size: 'sm' | 'md' | 'lg'
}

function TagBadge({ tag, focused, onRemove, disabled, size }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1'
  }

  return (
    <Badge
      variant={focused ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1 animate-in fade-in-0 zoom-in-95',
        sizeClasses[size],
        focused && 'ring-2 ring-ring ring-offset-1',
        tag.color && 'border-current',
        'cursor-default'
      )}
      style={tag.color ? { backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color } : {}}
    >
      {tag.icon}
      <span>{tag.label}</span>
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-current hover:bg-current/20 ml-1 -mr-1"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  )
}

// Trading-specific tag presets
export const TRADING_SYMBOLS: Tag[] = [
  { id: '1', label: 'BTC/USD', value: 'BTCUSD', icon: <Hash className="h-3 w-3" />, color: '#f7931a' },
  { id: '2', label: 'ETH/USD', value: 'ETHUSD', icon: <Hash className="h-3 w-3" />, color: '#627eea' },
  { id: '3', label: 'AAPL', value: 'AAPL', icon: <TrendingUp className="h-3 w-3" />, color: '#007aff' },
  { id: '4', label: 'TSLA', value: 'TSLA', icon: <TrendingUp className="h-3 w-3" />, color: '#cc0000' },
  { id: '5', label: 'NVDA', value: 'NVDA', icon: <TrendingUp className="h-3 w-3" />, color: '#76b900' },
]

export const TRADING_STRATEGIES: Tag[] = [
  { id: '1', label: 'Momentum', value: 'momentum', description: 'Follow trending movements' },
  { id: '2', label: 'Mean Reversion', value: 'mean_reversion', description: 'Buy low, sell high' },
  { id: '3', label: 'Arbitrage', value: 'arbitrage', description: 'Exploit price differences' },
  { id: '4', label: 'Scalping', value: 'scalping', description: 'Quick small profits' },
  { id: '5', label: 'Grid Trading', value: 'grid', description: 'Systematic grid orders' },
]

export const RISK_LEVELS: Tag[] = [
  { id: '1', label: 'Conservative', value: 'conservative', color: '#10b981' },
  { id: '2', label: 'Moderate', value: 'moderate', color: '#f59e0b' },
  { id: '3', label: 'Aggressive', value: 'aggressive', color: '#ef4444' },
]

export default TagInput