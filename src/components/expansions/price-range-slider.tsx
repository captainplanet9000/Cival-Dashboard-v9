"use client";

import * as React from "react";
import { DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { DualRangeSlider } from "./dual-range-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  min?: number;
  max?: number;
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  symbol?: string;
  currentPrice?: number;
  currency?: string;
  disabled?: boolean;
  showInput?: boolean;
  showStats?: boolean;
  showPresets?: boolean;
  className?: string;
  step?: number;
  precision?: number;
}

interface PricePreset {
  label: string;
  description: string;
  getRange: (currentPrice: number, min: number, max: number) => [number, number];
}

const PriceRangeSlider = ({
  min = 0,
  max = 1000,
  value = [min, max],
  onValueChange,
  symbol = "STOCK",
  currentPrice,
  currency = "USD",
  disabled,
  showInput = true,
  showStats = true,
  showPresets = true,
  className,
  step = 0.01,
  precision = 2,
}: PriceRangeSliderProps) => {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);
  const [inputMin, setInputMin] = React.useState(value[0].toString());
  const [inputMax, setInputMax] = React.useState(value[1].toString());

  const pricePresets: PricePreset[] = React.useMemo(() => [
    {
      label: "Conservative",
      description: "±5% from current price",
      getRange: (current, minVal, maxVal) => [
        Math.max(minVal, current * 0.95),
        Math.min(maxVal, current * 1.05)
      ]
    },
    {
      label: "Moderate",
      description: "±15% from current price",
      getRange: (current, minVal, maxVal) => [
        Math.max(minVal, current * 0.85),
        Math.min(maxVal, current * 1.15)
      ]
    },
    {
      label: "Aggressive",
      description: "±30% from current price",
      getRange: (current, minVal, maxVal) => [
        Math.max(minVal, current * 0.70),
        Math.min(maxVal, current * 1.30)
      ]
    },
    {
      label: "Full Range",
      description: "Complete price range",
      getRange: (current, minVal, maxVal) => [minVal, maxVal]
    }
  ], []);

  React.useEffect(() => {
    setLocalValue(value);
    setInputMin(value[0].toFixed(precision));
    setInputMax(value[1].toFixed(precision));
  }, [value, precision]);

  const handleSliderChange = (newValue: number[]) => {
    const range: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(range);
    setInputMin(range[0].toFixed(precision));
    setInputMax(range[1].toFixed(precision));
    onValueChange?.(range);
  };

  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    if (type === 'min') {
      setInputMin(inputValue);
    } else {
      setInputMax(inputValue);
    }

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const newRange: [number, number] = type === 'min' 
        ? [Math.max(min, Math.min(numValue, localValue[1])), localValue[1]]
        : [localValue[0], Math.min(max, Math.max(numValue, localValue[0]))];
      
      setLocalValue(newRange);
      onValueChange?.(newRange);
    }
  };

  const handlePresetSelect = (preset: PricePreset) => {
    if (!currentPrice) return;
    
    const [newMin, newMax] = preset.getRange(currentPrice, min, max);
    const range: [number, number] = [newMin, newMax];
    
    setLocalValue(range);
    setInputMin(newMin.toFixed(precision));
    setInputMax(newMax.toFixed(precision));
    onValueChange?.(range);
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(amount);
    }
    return `${amount.toFixed(precision)} ${currency}`;
  };

  const formatLabel = (val: number) => formatCurrency(val);

  const getRangeStats = () => {
    const range = localValue[1] - localValue[0];
    const midpoint = (localValue[0] + localValue[1]) / 2;
    const rangePercentage = ((range / (max - min)) * 100).toFixed(1);
    
    return {
      range: formatCurrency(range),
      midpoint: formatCurrency(midpoint),
      rangePercentage: `${rangePercentage}%`,
      isNarrow: parseFloat(rangePercentage) < 10,
      isWide: parseFloat(rangePercentage) > 50
    };
  };

  const getCurrentPricePosition = () => {
    if (!currentPrice) return null;
    
    const position = ((currentPrice - min) / (max - min)) * 100;
    const isInRange = currentPrice >= localValue[0] && currentPrice <= localValue[1];
    
    return {
      position: `${position}%`,
      isInRange,
      distance: {
        toLower: Math.abs(currentPrice - localValue[0]),
        toUpper: Math.abs(currentPrice - localValue[1])
      }
    };
  };

  const stats = showStats ? getRangeStats() : null;
  const pricePosition = getCurrentPricePosition();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Range for {symbol}
          </div>
          {currentPrice && (
            <Badge variant="outline" className="flex items-center gap-1">
              Current: {formatCurrency(currentPrice)}
              {pricePosition?.isInRange ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-orange-600" />
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preset Buttons */}
        {showPresets && currentPrice && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Ranges</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {pricePresets.map((preset) => (
                <TooltipProvider key={preset.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect(preset)}
                        disabled={disabled}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {/* Range Slider */}
        <div className="space-y-4">
          <div className="relative">
            <DualRangeSlider
              value={localValue}
              onValueChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              label={formatLabel}
              labelPosition="bottom"
              disabled={disabled}
              className="py-6"
            />
            
            {/* Current Price Indicator */}
            {currentPrice && pricePosition && (
              <div
                className="absolute top-0 transform -translate-x-1/2"
                style={{ left: pricePosition.position }}
              >
                <div className={cn(
                  "w-0.5 h-8 rounded-full",
                  pricePosition.isInRange ? "bg-green-500" : "bg-orange-500"
                )}>
                  <div className={cn(
                    "absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                    pricePosition.isInRange 
                      ? "bg-green-100 text-green-800" 
                      : "bg-orange-100 text-orange-800"
                  )}>
                    Current
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Input */}
        {showInput && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-price">Minimum Price</Label>
              <Input
                id="min-price"
                type="number"
                value={inputMin}
                onChange={(e) => handleInputChange('min', e.target.value)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-price">Maximum Price</Label>
              <Input
                id="max-price"
                type="number"
                value={inputMax}
                onChange={(e) => handleInputChange('max', e.target.value)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="text-right"
              />
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium">Range</div>
              <div className="text-lg font-semibold">{stats.range}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Midpoint</div>
              <div className="text-lg font-semibold">{stats.midpoint}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Coverage</div>
              <div className="text-lg font-semibold">{stats.rangePercentage}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Strategy</div>
              <Badge variant={stats.isNarrow ? "default" : stats.isWide ? "destructive" : "secondary"}>
                {stats.isNarrow ? "Focused" : stats.isWide ? "Broad" : "Balanced"}
              </Badge>
            </div>
          </div>
        )}

        {/* Price Position Info */}
        {pricePosition && currentPrice && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Current price is {pricePosition.isInRange ? "within" : "outside"} selected range
              </span>
            </div>
            {!pricePosition.isInRange && (
              <Badge variant="outline" className="text-xs">
                {currentPrice < localValue[0] 
                  ? `${formatCurrency(pricePosition.distance.toLower)} below`
                  : `${formatCurrency(pricePosition.distance.toUpper)} above`
                }
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { PriceRangeSlider };