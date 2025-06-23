'use client'

import React, { useCallback, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Bell, BellOff, BarChart3, X, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { SortableContainer } from './SortableContainer'
import { SortableItem } from './SortableItem'
import type { WatchlistItem, SortableOptions } from './types'

interface WatchlistSortableProps {
  items: WatchlistItem[]
  onItemsChange: (items: WatchlistItem[]) => void
  onAddSymbol?: () => void
  onRemoveSymbol?: (symbol: string) => void
  onToggleAlert?: (symbol: string) => void
  onViewChart?: (symbol: string) => void
  onToggleVisibility?: (symbol: string) => void
  className?: string
  options?: SortableOptions
  title?: string
  searchable?: boolean
  addable?: boolean
}

export function WatchlistSortable({
  items,
  onItemsChange,
  onAddSymbol,
  onRemoveSymbol,
  onToggleAlert,
  onViewChart,
  onToggleVisibility,
  className,
  options = {},
  title = 'Watchlist',
  searchable = true,
  addable = true
}: WatchlistSortableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newSymbol, setNewSymbol] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const filteredItems = searchQuery
    ? items.filter(item =>
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  const handleAddSymbol = useCallback(() => {
    if (newSymbol.trim()) {
      const newItem: WatchlistItem = {
        id: crypto.randomUUID(),
        symbol: newSymbol.toUpperCase(),
        name: `${newSymbol.toUpperCase()} Inc.`,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        priority: 'medium',
        alerts: 0,
        lastUpdate: new Date(),
        order: items.length
      }
      onItemsChange([...items, newItem])
      setNewSymbol('')
      setShowAddForm(false)
    }
    onAddSymbol?.()
  }, [newSymbol, items, onItemsChange, onAddSymbol])

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toString()
  }

  const renderWatchlistItem = (item: WatchlistItem, index: number) => {
    const isPositive = item.changePercent >= 0
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
    const TrendIcon = isPositive ? TrendingUp : TrendingDown

    return (
      <SortableItem key={item.id} id={item.id}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Symbol and Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">{item.symbol}</h4>
                  {item.priority && (
                    <Badge className={cn('text-xs', getPriorityColor(item.priority))}>
                      {item.priority}
                    </Badge>
                  )}
                  {item.alerts && item.alerts > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {item.alerts} alerts
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
              </div>

              {/* Price and Change */}
              <div className="text-right">
                <div className="font-mono text-sm font-medium">
                  {formatPrice(item.price)}
                </div>
                <div className={cn('flex items-center space-x-1 text-xs', changeColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
                </div>
              </div>

              {/* Volume */}
              <div className="text-right ml-4">
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-xs font-mono">{formatVolume(item.volume)}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleAlert?.(item.symbol)}
                  className="h-8 w-8 p-0"
                  title={item.alerts && item.alerts > 0 ? 'Disable alerts' : 'Enable alerts'}
                >
                  {item.alerts && item.alerts > 0 ? (
                    <Bell className="h-3 w-3 text-yellow-600" />
                  ) : (
                    <BellOff className="h-3 w-3" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewChart?.(item.symbol)}
                  className="h-8 w-8 p-0"
                  title="View chart"
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleVisibility?.(item.symbol)}
                  className="h-8 w-8 p-0"
                  title="Toggle visibility"
                >
                  <Eye className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveSymbol?.(item.symbol)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Remove from watchlist"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SortableItem>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between space-x-4">
        {searchable && (
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        )}

        {addable && (
          <div className="flex items-center space-x-2">
            {showAddForm ? (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Symbol (e.g. AAPL)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                  className="h-9 w-32"
                />
                <Button size="sm" onClick={handleAddSymbol}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewSymbol('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Symbol
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sortable Watchlist */}
      <SortableContainer
        items={filteredItems}
        onItemsChange={onItemsChange}
        renderItem={renderWatchlistItem}
        title={title}
        description={`${filteredItems.length} symbols`}
        options={{
          ...options,
          enableMultiSelect: true,
          persistOrder: true,
        }}
        emptyMessage={
          searchQuery
            ? `No symbols found matching "${searchQuery}"`
            : 'No symbols in watchlist. Add some symbols to get started.'
        }
      />
    </div>
  )
}

export default WatchlistSortable