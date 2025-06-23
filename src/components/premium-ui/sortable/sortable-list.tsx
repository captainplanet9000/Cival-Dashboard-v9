'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical, X, Plus, Star, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

export interface SortableItem {
  id: string
  content: React.ReactNode
  data?: any
}

export interface SortableListProps {
  items: SortableItem[]
  onReorder: (items: SortableItem[]) => void
  onAdd?: (item: SortableItem) => void
  onRemove?: (id: string) => void
  onItemClick?: (item: SortableItem) => void
  renderItem?: (item: SortableItem, index: number) => React.ReactNode
  addable?: boolean
  removable?: boolean
  className?: string
  itemClassName?: string
  placeholder?: string
  emptyMessage?: string
  maxItems?: number
  direction?: 'vertical' | 'horizontal'
  variant?: 'default' | 'card' | 'minimal'
}

// Trading-specific item renderers
export function TradingSymbolItem({ 
  symbol, 
  price, 
  change, 
  volume,
  alert 
}: { 
  symbol: string
  price: number
  change: number
  volume?: string
  alert?: boolean
}) {
  const isPositive = change >= 0
  
  return (
    <div className="flex items-center justify-between w-full px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-medium">{symbol}</span>
          {volume && <span className="text-xs text-muted-foreground">{volume}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="font-medium">${price.toFixed(2)}</div>
          <div className={cn(
            "text-xs flex items-center gap-1",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>
        {alert && <AlertCircle className="h-4 w-4 text-yellow-500" />}
      </div>
    </div>
  )
}

export function WatchlistItem({ 
  name, 
  count, 
  performance,
  starred 
}: { 
  name: string
  count: number
  performance?: number
  starred?: boolean
}) {
  return (
    <div className="flex items-center justify-between w-full px-3 py-2">
      <div className="flex items-center gap-2">
        {starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        <span className="font-medium">{name}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      {performance !== undefined && (
        <span className={cn(
          "text-sm font-medium",
          performance >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
        </span>
      )}
    </div>
  )
}

export function SortableList({
  items,
  onReorder,
  onAdd,
  onRemove,
  onItemClick,
  renderItem,
  addable = false,
  removable = true,
  className,
  itemClassName,
  placeholder = 'Add new item...',
  emptyMessage = 'No items yet',
  maxItems,
  direction = 'vertical',
  variant = 'default'
}: SortableListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleAdd = () => {
    if (newItemValue.trim() && onAdd) {
      onAdd({
        id: Date.now().toString(),
        content: newItemValue,
        data: { value: newItemValue }
      })
      setNewItemValue('')
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewItemValue('')
    }
  }

  const canAdd = !maxItems || items.length < maxItems

  const itemVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  }

  const renderItemContent = (item: SortableItem, index: number) => {
    if (renderItem) {
      return renderItem(item, index)
    }
    return item.content
  }

  const ItemWrapper = variant === 'card' ? Card : 'div'

  return (
    <div className={cn(
      "w-full",
      direction === 'horizontal' && "flex gap-2 overflow-x-auto",
      className
    )}>
      {items.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <Reorder.Group
          axis={direction === 'horizontal' ? 'x' : 'y'}
          values={items}
          onReorder={onReorder}
          className={cn(
            direction === 'horizontal' ? "flex gap-2" : "space-y-2"
          )}
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <Reorder.Item
                key={item.id}
                value={item}
                dragListener={false}
                dragControls={undefined}
              >
                <motion.div
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layoutId={item.id}
                  className={cn(
                    "group relative",
                    direction === 'horizontal' && "flex-shrink-0"
                  )}
                >
                  <ItemWrapper className={cn(
                    "flex items-center gap-2 transition-all",
                    variant === 'default' && "border rounded-lg p-2",
                    variant === 'minimal' && "py-1",
                    variant === 'card' && "p-0",
                    "hover:bg-accent/50",
                    itemClassName
                  )}>
                    <div className="cursor-move p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onItemClick?.(item)}
                    >
                      {renderItemContent(item, index)}
                    </div>

                    {removable && onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(item.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </ItemWrapper>
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {addable && onAdd && canAdd && (
        <AnimatePresence>
          {isAdding ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newItemValue.trim()}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false)
                    setNewItemValue('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// Trading-specific sortable lists
export function TradingWatchlist({
  symbols,
  onReorder,
  onAdd,
  onRemove,
  onSymbolClick,
  className
}: {
  symbols: Array<{
    id: string
    symbol: string
    price: number
    change: number
    volume?: string
    alert?: boolean
  }>
  onReorder: (symbols: any[]) => void
  onAdd?: (symbol: string) => void
  onRemove?: (id: string) => void
  onSymbolClick?: (symbol: any) => void
  className?: string
}) {
  const items: SortableItem[] = symbols.map(s => ({
    id: s.id,
    content: <TradingSymbolItem {...s} />,
    data: s
  }))

  const handleAdd = (item: SortableItem) => {
    if (onAdd && item.data?.value) {
      onAdd(item.data.value.toUpperCase())
    }
  }

  return (
    <SortableList
      items={items}
      onReorder={(newItems) => onReorder(newItems.map(i => i.data))}
      onAdd={onAdd ? handleAdd : undefined}
      onRemove={onRemove}
      onItemClick={(item) => onSymbolClick?.(item.data)}
      addable={!!onAdd}
      removable={!!onRemove}
      placeholder="Add symbol (e.g., AAPL)"
      emptyMessage="No symbols in watchlist"
      variant="card"
      className={className}
    />
  )
}

export function StrategyList({
  strategies,
  onReorder,
  onStrategyClick,
  className
}: {
  strategies: Array<{
    id: string
    name: string
    performance: number
    status: 'active' | 'paused' | 'stopped'
  }>
  onReorder: (strategies: any[]) => void
  onStrategyClick?: (strategy: any) => void
  className?: string
}) {
  const items: SortableItem[] = strategies.map(s => ({
    id: s.id,
    content: (
      <div className="flex items-center justify-between w-full px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">{s.name}</span>
          <Badge variant={
            s.status === 'active' ? 'default' : 
            s.status === 'paused' ? 'secondary' : 
            'outline'
          }>
            {s.status}
          </Badge>
        </div>
        <span className={cn(
          "text-sm font-medium",
          s.performance >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {s.performance >= 0 ? '+' : ''}{s.performance.toFixed(2)}%
        </span>
      </div>
    ),
    data: s
  }))

  return (
    <SortableList
      items={items}
      onReorder={(newItems) => onReorder(newItems.map(i => i.data))}
      onItemClick={(item) => onStrategyClick?.(item.data)}
      removable={false}
      variant="card"
      emptyMessage="No strategies configured"
      className={className}
    />
  )
}