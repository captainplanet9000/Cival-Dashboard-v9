'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  X, 
  Settings,
  RotateCcw,
  Save,
  Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

export interface GridItem {
  id: string
  title: string
  content: React.ReactNode
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  icon?: React.ReactNode
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    action: () => void
  }>
}

export interface DashboardGridProps {
  items: GridItem[]
  onLayoutChange?: (items: GridItem[]) => void
  cols?: number
  rowHeight?: number
  gap?: number
  className?: string
  editable?: boolean
  onRemove?: (id: string) => void
  onAdd?: () => void
  showGridLines?: boolean
  autoSize?: boolean
  compactType?: 'vertical' | 'horizontal' | null
  preventCollision?: boolean
}

// Predefined layouts for trading dashboards
export const TRADING_LAYOUTS = {
  OVERVIEW: [
    { id: 'portfolio', title: 'Portfolio Overview', x: 0, y: 0, w: 8, h: 4 },
    { id: 'watchlist', title: 'Watchlist', x: 8, y: 0, w: 4, h: 4 },
    { id: 'positions', title: 'Open Positions', x: 0, y: 4, w: 6, h: 4 },
    { id: 'orders', title: 'Recent Orders', x: 6, y: 4, w: 6, h: 4 },
    { id: 'performance', title: 'Performance Chart', x: 0, y: 8, w: 12, h: 4 },
  ],
  TRADING: [
    { id: 'chart', title: 'Price Chart', x: 0, y: 0, w: 8, h: 6 },
    { id: 'orderbook', title: 'Order Book', x: 8, y: 0, w: 4, h: 6 },
    { id: 'trades', title: 'Recent Trades', x: 8, y: 6, w: 4, h: 4 },
    { id: 'order-entry', title: 'Order Entry', x: 0, y: 6, w: 4, h: 4 },
    { id: 'positions', title: 'Positions', x: 4, y: 6, w: 4, h: 4 },
  ],
  ANALYTICS: [
    { id: 'pnl', title: 'P&L Analysis', x: 0, y: 0, w: 6, h: 4 },
    { id: 'risk', title: 'Risk Metrics', x: 6, y: 0, w: 6, h: 4 },
    { id: 'performance', title: 'Performance', x: 0, y: 4, w: 12, h: 4 },
    { id: 'strategies', title: 'Strategy Performance', x: 0, y: 8, w: 8, h: 4 },
    { id: 'agents', title: 'Agent Activity', x: 8, y: 8, w: 4, h: 4 },
  ]
}

function GridWidget({
  item,
  isEditing,
  onRemove,
  onResize,
  onMove,
  style
}: {
  item: GridItem
  isEditing: boolean
  onRemove?: () => void
  onResize?: (w: number, h: number) => void
  onMove?: (x: number, y: number) => void
  style: React.CSSProperties
}) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={style}
      className={cn(
        "absolute transition-shadow",
        isDragging && "z-50 shadow-2xl",
        isMaximized && "!inset-0 z-40"
      )}
    >
      <Card className="h-full overflow-hidden">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditing && !item.static && (
                <div
                  ref={dragRef}
                  className="cursor-move opacity-50 hover:opacity-100"
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}
              {item.icon}
              <CardTitle className="text-base">{item.title}</CardTitle>
            </div>
            
            <div className="flex items-center gap-1">
              {item.actions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.action}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              
              {isEditing && !item.static && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          {item.content}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DashboardGrid({
  items,
  onLayoutChange,
  cols = 12,
  rowHeight = 80,
  gap = 16,
  className,
  editable = false,
  onRemove,
  onAdd,
  showGridLines = false,
  autoSize = true,
  compactType = 'vertical',
  preventCollision = false
}: DashboardGridProps) {
  const [localItems, setLocalItems] = useState(items)
  const [isEditing, setIsEditing] = useState(false)
  const [savedLayouts, setSavedLayouts] = useState<Record<string, GridItem[]>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Sync with external items
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  // Load saved layouts
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-layouts')
    if (saved) {
      setSavedLayouts(JSON.parse(saved))
    }
  }, [])

  const handleLayoutChange = (newItems: GridItem[]) => {
    setLocalItems(newItems)
    onLayoutChange?.(newItems)
  }

  const handleRemove = (id: string) => {
    const newItems = localItems.filter(item => item.id !== id)
    handleLayoutChange(newItems)
    onRemove?.(id)
  }

  const saveLayout = (name: string) => {
    const newLayouts = { ...savedLayouts, [name]: localItems }
    setSavedLayouts(newLayouts)
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts))
  }

  const loadLayout = (name: string) => {
    const layout = savedLayouts[name]
    if (layout) {
      handleLayoutChange(layout)
    }
  }

  const resetLayout = () => {
    handleLayoutChange(items)
  }

  const colWidth = containerWidth > 0 ? (containerWidth - gap * (cols - 1)) / cols : 0

  const getItemStyle = (item: GridItem): React.CSSProperties => {
    return {
      left: item.x * (colWidth + gap),
      top: item.y * (rowHeight + gap),
      width: item.w * colWidth + (item.w - 1) * gap,
      height: item.h * rowHeight + (item.h - 1) * gap,
    }
  }

  const gridHeight = Math.max(...localItems.map(item => item.y + item.h)) * (rowHeight + gap)

  return (
    <div className={cn("relative", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Layout className="h-4 w-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Layout'}
            </Button>
            
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetLayout}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Layout
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => saveLayout('custom')}>
                      Save as Custom
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => saveLayout('trading')}>
                      Save as Trading
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => saveLayout('analytics')}>
                      Save as Analytics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Load Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Presets</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleLayoutChange(TRADING_LAYOUTS.OVERVIEW)}>
                Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLayoutChange(TRADING_LAYOUTS.TRADING)}>
                Trading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLayoutChange(TRADING_LAYOUTS.ANALYTICS)}>
                Analytics
              </DropdownMenuItem>
              
              {Object.keys(savedLayouts).length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Saved</DropdownMenuLabel>
                  {Object.keys(savedLayouts).map(name => (
                    <DropdownMenuItem
                      key={name}
                      onClick={() => loadLayout(name)}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Grid Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative",
          showGridLines && isEditing && "dashboard-grid-lines"
        )}
        style={{
          height: autoSize ? gridHeight : undefined,
          minHeight: 400
        }}
      >
        {/* Grid Lines */}
        {showGridLines && isEditing && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={`col-${i}`}
                className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/20"
                style={{ left: i * (colWidth + gap) }}
              />
            ))}
            {Array.from({ length: Math.ceil(gridHeight / (rowHeight + gap)) }).map((_, i) => (
              <div
                key={`row-${i}`}
                className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/20"
                style={{ top: i * (rowHeight + gap) }}
              />
            ))}
          </div>
        )}

        {/* Grid Items */}
        <AnimatePresence>
          {localItems.map(item => (
            <GridWidget
              key={item.id}
              item={item}
              isEditing={isEditing}
              onRemove={() => handleRemove(item.id)}
              style={getItemStyle(item)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}