'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { DualRangeSlider } from './dual-range-slider'
import type { PriceRange, RiskLevel } from './types'

interface PriceRangeSliderProps {
  priceRange: PriceRange
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  currentPrice?: number
  symbol?: string
  className?: string
  disabled?: boolean
  showPresets?: boolean
  showRiskIndicators?: boolean
  onApply?: (value: [number, number]) => void
}

const RISK_PRESETS: Record<RiskLevel, { label: string; color: string; description: string; multiplier: [number, number] }> = {
  conservative: {
    label: 'Conservative',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: '2-5% price range',
    multiplier: [0.98, 1.02]
  },
  moderate: {
    label: 'Moderate',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: '5-10% price range',
    multiplier: [0.95, 1.05]
  },
  aggressive: {
    label: 'Aggressive',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: '10-20% price range',
    multiplier: [0.90, 1.10]
  },
  custom: {
    label: 'Custom',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Custom range',
    multiplier: [1, 1]
  }
}

export function PriceRangeSlider({
  priceRange,
  value,
  onValueChange,
  currentPrice,
  symbol,
  className,
  disabled = false,
  showPresets = true,
  showRiskIndicators = true,
  onApply
}: PriceRangeSliderProps) {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel>('custom')

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: priceRange.precision || 2,
      maximumFractionDigits: priceRange.precision || 2,
    }).format(price)
  }, [priceRange.precision])

  const priceMarks = useMemo(() => {
    const marks = []
    const step = (priceRange.max - priceRange.min) / 4

    for (let i = 0; i <= 4; i++) {
      const markValue = priceRange.min + (step * i)
      marks.push({
        value: markValue,
        label: formatPrice(markValue)
      })
    }

    // Add current price mark if provided
    if (currentPrice && currentPrice >= priceRange.min && currentPrice <= priceRange.max) {
      marks.push({
        value: currentPrice,
        label: `Current: ${formatPrice(currentPrice)}`
      })
    }

    return marks.sort((a, b) => a.value - b.value)
  }, [priceRange, currentPrice, formatPrice])

  const getRiskLevel = useCallback((range: [number, number]) => {
    if (!currentPrice) return 'custom'

    const lowerPercent = ((currentPrice - range[0]) / currentPrice) * 100
    const upperPercent = ((range[1] - currentPrice) / currentPrice) * 100
    const maxPercent = Math.max(lowerPercent, upperPercent)

    if (maxPercent <= 5) return 'conservative'
    if (maxPercent <= 10) return 'moderate'
    return 'aggressive'
  }, [currentPrice])

  const currentRiskLevel = getRiskLevel(value)

  const handlePresetSelect = useCallback((riskLevel: RiskLevel) => {
    if (!currentPrice || riskLevel === 'custom') {
      setSelectedRiskLevel(riskLevel)
      return
    }

    const preset = RISK_PRESETS[riskLevel]
    const newMin = currentPrice * preset.multiplier[0]
    const newMax = currentPrice * preset.multiplier[1]

    // Clamp to price range bounds
    const clampedMin = Math.max(priceRange.min, newMin)
    const clampedMax = Math.min(priceRange.max, newMax)

    setSelectedRiskLevel(riskLevel)
    onValueChange([clampedMin, clampedMax])
  }, [currentPrice, priceRange, onValueChange])

  const getPercentageChange = useCallback((price: number) => {
    if (!currentPrice) return null
    return ((price - currentPrice) / currentPrice) * 100
  }, [currentPrice])

  const getRiskColor = (level: RiskLevel) => RISK_PRESETS[level].color

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Price Range {symbol && `for ${symbol}`}</span>
          {showRiskIndicators && (
            <Badge className={cn('flex items-center gap-1', getRiskColor(currentRiskLevel))}>
              {currentRiskLevel === 'aggressive' && <AlertTriangle className="h-3 w-3" />}
              {currentRiskLevel === 'moderate' && <Target className="h-3 w-3" />}
              {currentRiskLevel === 'conservative' && <TrendingUp className="h-3 w-3" />}
              {RISK_PRESETS[currentRiskLevel].label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Price Display */}
        {currentPrice && (
          <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Current Price</div>
              <div className="text-lg font-mono font-semibold">{formatPrice(currentPrice)}</div>
            </div>
          </div>
        )}

        {/* Risk Level Presets */}
        {showPresets && currentPrice && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Risk Presets</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(RISK_PRESETS) as RiskLevel[])
                .filter(level => level !== 'custom')
                .map(level => (
                <Button
                  key={level}
                  variant={selectedRiskLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(level)}
                  disabled={disabled}
                  className="h-auto py-2 flex flex-col items-center"
                >
                  <span className="text-xs font-medium">{RISK_PRESETS[level].label}</span>
                  <span className="text-xs text-muted-foreground">{RISK_PRESETS[level].description}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Slider */}
        <div className="space-y-4">
          <DualRangeSlider
            min={priceRange.min}
            max={priceRange.max}
            value={value}
            onValueChange={(newValue) => {
              onValueChange(newValue)
              setSelectedRiskLevel('custom')
            }}
            formatLabel={formatPrice}
            disabled={disabled}
            showLabels={true}
            showTooltips={true}
            precision={priceRange.precision || 2}
            marks={priceMarks}
          />
        </div>

        {/* Range Analysis */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Lower Bound</div>
            <div className="font-mono font-medium">{formatPrice(value[0])}</div>
            {currentPrice && (
              <div className={cn(
                'text-xs flex items-center gap-1',
                value[0] < currentPrice ? 'text-red-600' : 'text-green-600'
              )}>
                {value[0] < currentPrice ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {getPercentageChange(value[0])?.toFixed(2)}%
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground">Upper Bound</div>
            <div className="font-mono font-medium">{formatPrice(value[1])}</div>
            {currentPrice && (
              <div className={cn(
                'text-xs flex items-center gap-1',
                value[1] > currentPrice ? 'text-green-600' : 'text-red-600'
              )}>
                {value[1] > currentPrice ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {getPercentageChange(value[1])?.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Range Width */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
          <span className="text-muted-foreground">Range Width</span>
          <div className="text-right">
            <div className="font-mono font-medium">{formatPrice(value[1] - value[0])}</div>
            {currentPrice && (
              <div className="text-xs text-muted-foreground">
                {(((value[1] - value[0]) / currentPrice) * 100).toFixed(1)}% of current price
              </div>
            )}
          </div>
        </div>

        {/* Apply Button */}
        {onApply && (
          <Button
            onClick={() => onApply(value)}
            disabled={disabled}
            className="w-full"
          >
            Apply Price Range
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default PriceRangeSlider