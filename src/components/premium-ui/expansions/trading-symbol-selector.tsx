'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, Hash, DollarSign, Activity } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { MultipleSelector } from './multiple-selector'
import type { Symbol, MarketCategory } from './types'

interface TradingSymbolSelectorProps {
  symbols: Symbol[]
  value: string[]
  onValueChange: (value: string[]) => void
  maxSelected?: number
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  showPrices?: boolean
  showCategories?: boolean
  categories?: MarketCategory[]
  onSymbolSearch?: (query: string) => void
  loading?: boolean
}

// Mock symbol data for demo
const generateMockSymbols = (): Symbol[] => [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.25,
    change: 2.15,
    changePercent: 1.22,
    volume: 58420000,
    category: 'stocks',
    exchange: 'NASDAQ',
    sector: 'Technology',
    lastUpdate: new Date(),
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.87,
    change: -8.43,
    changePercent: -3.28,
    volume: 89320000,
    category: 'stocks',
    exchange: 'NASDAQ',
    sector: 'Automotive',
    lastUpdate: new Date(),
  },
  {
    id: '3',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    price: 43250.50,
    change: 1205.30,
    changePercent: 2.87,
    volume: 15.8,
    category: 'crypto',
    exchange: 'Binance',
    lastUpdate: new Date(),
  },
  {
    id: '4',
    symbol: 'ETH/USD',
    name: 'Ethereum',
    price: 2654.75,
    change: -89.25,
    changePercent: -3.25,
    volume: 245.6,
    category: 'crypto',
    exchange: 'Binance',
    lastUpdate: new Date(),
  },
  {
    id: '5',
    symbol: 'EUR/USD',
    name: 'Euro US Dollar',
    price: 1.0875,
    change: 0.0025,
    changePercent: 0.23,
    volume: 125000000,
    category: 'forex',
    exchange: 'FX',
    lastUpdate: new Date(),
  },
  {
    id: '6',
    symbol: 'GLD',
    name: 'SPDR Gold Trust',
    price: 198.45,
    change: 3.22,
    changePercent: 1.65,
    volume: 8420000,
    category: 'etf',
    exchange: 'NYSE',
    sector: 'Commodities',
    lastUpdate: new Date(),
  },
  {
    id: '7',
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    price: 456.78,
    change: 5.43,
    changePercent: 1.20,
    volume: 65420000,
    category: 'etf',
    exchange: 'NYSE',
    lastUpdate: new Date(),
  },
  {
    id: '8',
    symbol: 'XAUUSD',
    name: 'Gold Spot',
    price: 1985.50,
    change: 15.75,
    changePercent: 0.80,
    volume: 125000,
    category: 'commodities',
    exchange: 'COMEX',
    lastUpdate: new Date(),
  },
]

export function TradingSymbolSelector({
  symbols = generateMockSymbols(),
  value,
  onValueChange,
  maxSelected = 20,
  placeholder = 'Select trading symbols...',
  searchPlaceholder = 'Search symbols by name or ticker...',
  className,
  disabled = false,
  showPrices = true,
  showCategories = true,
  categories,
  onSymbolSearch,
  loading = false,
}: TradingSymbolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const getCategoryIcon = (category: MarketCategory) => {
    switch (category) {
      case 'stocks': return <TrendingUp className="h-3 w-3" />
      case 'crypto': return <Hash className="h-3 w-3" />
      case 'forex': return <DollarSign className="h-3 w-3" />
      case 'commodities': return <Activity className="h-3 w-3" />
      case 'etf': return <TrendingUp className="h-3 w-3" />
      case 'indices': return <Activity className="h-3 w-3" />
      default: return <TrendingUp className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: MarketCategory) => {
    switch (category) {
      case 'stocks': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'crypto': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'forex': return 'bg-green-100 text-green-800 border-green-200'
      case 'commodities': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'etf': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'indices': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPrice = (price: number, category: MarketCategory) => {
    if (category === 'forex') {
      return price.toFixed(4)
    }
    if (category === 'crypto' && price > 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatVolume = (volume: number, category: MarketCategory) => {
    if (category === 'crypto') {
      return `${volume.toFixed(1)} BTC`
    }
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toString()
  }

  // Filter symbols by categories if specified
  const filteredSymbols = useMemo(() => {
    let filtered = symbols
    
    if (categories && categories.length > 0) {
      filtered = filtered.filter(symbol => categories.includes(symbol.category))
    }

    return filtered
  }, [symbols, categories])

  // Convert symbols to select options
  const options = useMemo(() => {
    return filteredSymbols.map((symbol) => {
      const isPositive = (symbol.changePercent || 0) >= 0
      const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
      const TrendIcon = isPositive ? TrendingUp : TrendingDown

      return {
        value: symbol.symbol,
        label: symbol.symbol,
        group: showCategories ? symbol.category.toUpperCase() : undefined,
        // Custom render data for complex display
        symbol,
        customRender: showPrices && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <div>
                <div className="font-medium">{symbol.symbol}</div>
                <div className="text-xs text-muted-foreground">{symbol.name}</div>
              </div>
              {showCategories && (
                <Badge className={cn('text-xs flex items-center gap-1', getCategoryColor(symbol.category))}>
                  {getCategoryIcon(symbol.category)}
                  {symbol.category}
                </Badge>
              )}
            </div>
            
            {symbol.price && (
              <div className="text-right">
                <div className="font-mono text-sm">{formatPrice(symbol.price, symbol.category)}</div>
                <div className={cn('flex items-center space-x-1 text-xs', changeColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>
                    {isPositive ? '+' : ''}{symbol.changePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ),
      }
    })
  }, [filteredSymbols, showPrices, showCategories])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    onSymbolSearch?.(query)
  }, [onSymbolSearch])

  const groupBy = useCallback((option: any) => {
    return option.group || 'Other'
  }, [])

  return (
    <div className={className}>
      <MultipleSelector
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        maxSelected={maxSelected}
        disabled={disabled}
        loading={loading}
        emptyMessage="No symbols found. Try adjusting your search."
        groupBy={showCategories ? groupBy : undefined}
        onSearch={handleSearch}
        asyncSearch={!!onSymbolSearch}
        clearable={true}
        searchable={true}
      />
      
      {/* Selection summary */}
      {value.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {value.length} symbol{value.length !== 1 ? 's' : ''} selected
          {maxSelected && ` (max ${maxSelected})`}
        </div>
      )}
    </div>
  )
}

export default TradingSymbolSelector