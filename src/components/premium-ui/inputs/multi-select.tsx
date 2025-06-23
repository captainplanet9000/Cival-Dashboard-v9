'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Check, X, ChevronsUpDown, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface MultiSelectOption {
  value: string
  label: string
  group?: string
  icon?: React.ReactNode
  disabled?: boolean
  description?: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  maxItems?: number
  variant?: 'default' | 'tags' | 'pills'
  size?: 'sm' | 'md' | 'lg'
  showClear?: boolean
  showSelectAll?: boolean
  groupBy?: boolean
  loading?: boolean
  onSearch?: (query: string) => void
  renderOption?: (option: MultiSelectOption) => React.ReactNode
  renderSelected?: (option: MultiSelectOption) => React.ReactNode
}

// Trading presets
export const TRADING_MULTI_OPTIONS = {
  EXCHANGES: [
    { value: 'binance', label: 'Binance', group: 'Centralized' },
    { value: 'coinbase', label: 'Coinbase', group: 'Centralized' },
    { value: 'kraken', label: 'Kraken', group: 'Centralized' },
    { value: 'uniswap', label: 'Uniswap', group: 'Decentralized' },
    { value: 'sushiswap', label: 'SushiSwap', group: 'Decentralized' },
  ],
  ASSET_CLASSES: [
    { value: 'stocks', label: 'Stocks', group: 'Traditional' },
    { value: 'crypto', label: 'Cryptocurrency', group: 'Digital' },
    { value: 'forex', label: 'Forex', group: 'Traditional' },
    { value: 'commodities', label: 'Commodities', group: 'Traditional' },
    { value: 'indices', label: 'Indices', group: 'Traditional' },
  ],
  INDICATORS: [
    { value: 'sma', label: 'SMA', group: 'Trend', description: 'Simple Moving Average' },
    { value: 'ema', label: 'EMA', group: 'Trend', description: 'Exponential Moving Average' },
    { value: 'rsi', label: 'RSI', group: 'Momentum', description: 'Relative Strength Index' },
    { value: 'macd', label: 'MACD', group: 'Momentum', description: 'Moving Average Convergence Divergence' },
    { value: 'bb', label: 'Bollinger Bands', group: 'Volatility' },
    { value: 'atr', label: 'ATR', group: 'Volatility', description: 'Average True Range' },
  ],
  TIMEFRAMES: [
    { value: '1m', label: '1 Minute', group: 'Intraday' },
    { value: '5m', label: '5 Minutes', group: 'Intraday' },
    { value: '15m', label: '15 Minutes', group: 'Intraday' },
    { value: '1h', label: '1 Hour', group: 'Intraday' },
    { value: '4h', label: '4 Hours', group: 'Swing' },
    { value: '1d', label: '1 Day', group: 'Swing' },
    { value: '1w', label: '1 Week', group: 'Position' },
    { value: '1M', label: '1 Month', group: 'Position' },
  ]
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  className,
  disabled = false,
  maxItems,
  variant = 'default',
  size = 'md',
  showClear = true,
  showSelectAll = true,
  groupBy = true,
  loading = false,
  onSearch,
  renderOption,
  renderSelected
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const commandRef = useRef<HTMLDivElement>(null)

  const selectedOptions = useMemo(() => {
    return options.filter(opt => value.includes(opt.value))
  }, [options, value])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchLower) ||
      opt.value.toLowerCase().includes(searchLower) ||
      opt.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const groupedOptions = useMemo(() => {
    if (!groupBy) return { '': filteredOptions }
    
    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(opt)
      return acc
    }, {} as Record<string, MultiSelectOption[]>)
  }, [filteredOptions, groupBy])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : maxItems && value.length >= maxItems
      ? value
      : [...value, optionValue]
    
    onChange(newValue)
  }

  const handleSelectAll = () => {
    const allValues = filteredOptions
      .filter(opt => !opt.disabled)
      .map(opt => opt.value)
    
    if (maxItems && allValues.length > maxItems) {
      onChange(allValues.slice(0, maxItems))
    } else {
      onChange(allValues)
    }
  }

  const handleClear = () => {
    onChange([])
    setSearch('')
  }

  const handleSearchChange = (query: string) => {
    setSearch(query)
    onSearch?.(query)
  }

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg'
  }

  const renderSelectedItems = () => {
    if (value.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>
    }

    if (variant === 'default') {
      return `${value.length} selected`
    }

    return (
      <div className="flex gap-1 flex-wrap">
        {selectedOptions.slice(0, 3).map(opt => (
          <Badge 
            key={opt.value} 
            variant={variant === 'pills' ? 'default' : 'secondary'}
            className="h-6"
          >
            {renderSelected ? renderSelected(opt) : opt.label}
          </Badge>
        ))}
        {selectedOptions.length > 3 && (
          <Badge variant="outline" className="h-6">
            +{selectedOptions.length - 3}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select items"
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            sizeClasses[size],
            className
          )}
        >
          <div className="flex-1 text-left overflow-hidden">
            {renderSelectedItems()}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {showClear && value.length > 0 && (
              <XCircle
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command ref={commandRef} shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : emptyMessage}
            </CommandEmpty>
            
            {showSelectAll && filteredOptions.length > 0 && (
              <>
                <CommandItem
                  onSelect={handleSelectAll}
                  className="justify-between"
                >
                  Select All ({filteredOptions.length})
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value.length === filteredOptions.length ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                <Separator className="my-1" />
              </>
            )}

            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <CommandGroup key={group} heading={groupBy ? group : undefined}>
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <div>{renderOption ? renderOption(option) : option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Trading-specific multi-selects
export function ExchangeSelector({
  value,
  onChange,
  className
}: {
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}) {
  return (
    <MultiSelect
      options={TRADING_MULTI_OPTIONS.EXCHANGES}
      value={value}
      onChange={onChange}
      placeholder="Select exchanges..."
      className={className}
      groupBy={true}
    />
  )
}

export function IndicatorSelector({
  value,
  onChange,
  maxIndicators = 5,
  className
}: {
  value: string[]
  onChange: (value: string[]) => void
  maxIndicators?: number
  className?: string
}) {
  return (
    <MultiSelect
      options={TRADING_MULTI_OPTIONS.INDICATORS}
      value={value}
      onChange={onChange}
      placeholder="Select indicators..."
      maxItems={maxIndicators}
      className={className}
      groupBy={true}
      variant="tags"
    />
  )
}

export function TimeframeSelector({
  value,
  onChange,
  className
}: {
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}) {
  return (
    <MultiSelect
      options={TRADING_MULTI_OPTIONS.TIMEFRAMES}
      value={value}
      onChange={onChange}
      placeholder="Select timeframes..."
      className={className}
      groupBy={true}
      variant="pills"
    />
  )
}