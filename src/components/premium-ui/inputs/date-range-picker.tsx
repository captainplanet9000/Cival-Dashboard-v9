'use client'

import React, { useState, useEffect } from 'react'
import { CalendarIcon, X, TrendingUp, Calendar as CalendarIconLucide } from 'lucide-react'
import { addDays, format, isValid, parse, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showPresets?: boolean
  showComparison?: boolean
  maxDate?: Date
  minDate?: Date
  format?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

interface Preset {
  label: string
  value: string
  dateRange: DateRange
  description?: string
}

const createPresets = (): Preset[] => {
  const today = new Date()
  
  return [
    {
      label: 'Today',
      value: 'today',
      dateRange: { from: startOfDay(today), to: endOfDay(today) },
      description: 'Current trading day'
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      dateRange: { 
        from: startOfDay(subDays(today, 1)), 
        to: endOfDay(subDays(today, 1)) 
      }
    },
    {
      label: 'Last 7 days',
      value: 'last7days',
      dateRange: { from: subDays(today, 6), to: today },
      description: 'Including today'
    },
    {
      label: 'Last 30 days',
      value: 'last30days',
      dateRange: { from: subDays(today, 29), to: today },
      description: 'Including today'
    },
    {
      label: 'This week',
      value: 'thisweek',
      dateRange: { from: startOfWeek(today), to: endOfWeek(today) }
    },
    {
      label: 'Last week',
      value: 'lastweek',
      dateRange: { 
        from: startOfWeek(subDays(today, 7)), 
        to: endOfWeek(subDays(today, 7)) 
      }
    },
    {
      label: 'This month',
      value: 'thismonth',
      dateRange: { from: startOfMonth(today), to: endOfMonth(today) }
    },
    {
      label: 'Last month',
      value: 'lastmonth',
      dateRange: { 
        from: startOfMonth(subDays(today, 30)), 
        to: endOfMonth(subDays(today, 30)) 
      }
    },
    {
      label: 'This quarter',
      value: 'thisquarter',
      dateRange: { 
        from: startOfMonth(new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)), 
        to: endOfMonth(new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 2, 1)) 
      }
    },
    {
      label: 'This year',
      value: 'thisyear',
      dateRange: { from: startOfYear(today), to: endOfYear(today) }
    }
  ]
}

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
  showPresets = true,
  showComparison = false,
  maxDate,
  minDate,
  format: dateFormat = 'MMM dd, yyyy',
  align = 'start',
  side = 'bottom'
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comparisonDate, setComparisonDate] = useState<DateRange | undefined>()
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(date)

  const presets = createPresets()

  useEffect(() => {
    setCustomRange(date)
  }, [date])

  const formatDateRange = (dateRange: DateRange | undefined): string => {
    if (!dateRange?.from) return placeholder

    if (dateRange.from && !dateRange.to) {
      return format(dateRange.from, dateFormat)
    }

    if (dateRange.from && dateRange.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        return format(dateRange.from, dateFormat)
      }
      return `${format(dateRange.from, dateFormat)} - ${format(dateRange.to, dateFormat)}`
    }

    return placeholder
  }

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.value)
    setCustomRange(preset.dateRange)
    onDateChange?.(preset.dateRange)
    
    if (showComparison) {
      // Auto-generate comparison period (previous period of same length)
      const days = Math.ceil((preset.dateRange.to!.getTime() - preset.dateRange.from!.getTime()) / (1000 * 60 * 60 * 24))
      const comparisonFrom = subDays(preset.dateRange.from!, days + 1)
      const comparisonTo = subDays(preset.dateRange.to!, days + 1)
      setComparisonDate({ from: comparisonFrom, to: comparisonTo })
    }
  }

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range)
    setSelectedPreset('')
    onDateChange?.(range)
  }

  const clearSelection = () => {
    setCustomRange(undefined)
    setSelectedPreset('')
    setComparisonDate(undefined)
    onDateChange?.(undefined)
  }

  const isPresetSelected = (preset: Preset): boolean => {
    if (!customRange?.from || !customRange?.to) return false
    return (
      customRange.from.getTime() === preset.dateRange.from!.getTime() &&
      customRange.to.getTime() === preset.dateRange.to!.getTime()
    )
  }

  const getDayCount = (dateRange: DateRange | undefined): number => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(customRange)}
            {customRange && (
              <Badge variant="secondary" className="ml-auto">
                {getDayCount(customRange)} day{getDayCount(customRange) !== 1 ? 's' : ''}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align={align} 
          side={side}
        >
          <div className="flex">
            {/* Presets Sidebar */}
            {showPresets && (
              <div className="border-r">
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-3">Quick Select</h4>
                  <div className="space-y-1">
                    {presets.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={isPresetSelected(preset) ? 'default' : 'ghost'}
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <div>
                          <div className="font-medium text-xs">{preset.label}</div>
                          {preset.description && (
                            <div className="text-xs text-muted-foreground">
                              {preset.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Time Inputs */}
                <Separator />
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-3">Custom Range</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="from-date" className="text-xs">From</Label>
                      <Input
                        id="from-date"
                        placeholder="YYYY-MM-DD"
                        value={customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = parse(e.target.value, 'yyyy-MM-dd', new Date())
                          if (isValid(date)) {
                            handleCustomRangeSelect({
                              from: date,
                              to: customRange?.to
                            })
                          }
                        }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="to-date" className="text-xs">To</Label>
                      <Input
                        id="to-date"
                        placeholder="YYYY-MM-DD"
                        value={customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = parse(e.target.value, 'yyyy-MM-dd', new Date())
                          if (isValid(date)) {
                            handleCustomRangeSelect({
                              from: customRange?.from,
                              to: date
                            })
                          }
                        }}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customRange?.from}
                selected={customRange}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={2}
                disabled={(date) => {
                  if (maxDate && date > maxDate) return true
                  if (minDate && date < minDate) return true
                  return false
                }}
              />

              {/* Comparison Date Range */}
              {showComparison && comparisonDate && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Compare to</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setComparisonDate(undefined)}
                      className="h-auto p-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateRange(comparisonDate)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={!customRange}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Comparison Display */}
      {showComparison && comparisonDate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>vs {formatDateRange(comparisonDate)}</span>
        </div>
      )}
    </div>
  )
}

// Trading-specific date range picker with market presets
export function TradingDateRangePicker(props: DateRangePickerProps) {
  return (
    <DateRangePicker
      {...props}
      showPresets={true}
      showComparison={true}
      placeholder="Select trading period"
    />
  )
}

// Quick preset buttons for common trading periods
export function TradingPeriodButtons({
  onPeriodSelect,
  activePeriod
}: {
  onPeriodSelect: (period: DateRange) => void
  activePeriod?: string
}) {
  const quickPeriods = [
    { label: '1D', value: '1d', days: 1 },
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
    { label: '1Y', value: '1y', days: 365 }
  ]

  return (
    <div className="flex space-x-1">
      {quickPeriods.map((period) => {
        const today = new Date()
        const dateRange = {
          from: subDays(today, period.days - 1),
          to: today
        }
        
        return (
          <Button
            key={period.value}
            variant={activePeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodSelect(dateRange)}
            className="px-3"
          >
            {period.label}
          </Button>
        )
      })}
    </div>
  )
}

export default DateRangePicker