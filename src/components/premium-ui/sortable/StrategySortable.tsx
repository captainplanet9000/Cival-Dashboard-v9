'use client'

import React, { useCallback, useMemo } from 'react'
import { Play, Pause, Square, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { SortableContainer } from './SortableContainer'
import { SortableItem } from './SortableItem'
import type { TradingStrategy, SortableOptions } from './types'

interface StrategySortableProps {
  strategies: TradingStrategy[]
  onStrategiesChange: (strategies: TradingStrategy[]) => void
  onStartStrategy?: (id: string) => void
  onPauseStrategy?: (id: string) => void
  onStopStrategy?: (id: string) => void
  onEditStrategy?: (id: string) => void
  onViewDetails?: (id: string) => void
  className?: string
  options?: SortableOptions
  title?: string
  showPerformanceMetrics?: boolean
}

export function StrategySortable({
  strategies,
  onStrategiesChange,
  onStartStrategy,
  onPauseStrategy,
  onStopStrategy,
  onEditStrategy,
  onViewDetails,
  className,
  options = {},
  title = 'Trading Strategies',
  showPerformanceMetrics = true
}: StrategySortableProps) {

  const strategyStats = useMemo(() => {
    const running = strategies.filter(s => s.status === 'running').length
    const paused = strategies.filter(s => s.status === 'paused').length
    const stopped = strategies.filter(s => s.status === 'stopped').length
    const error = strategies.filter(s => s.status === 'error').length
    const totalPnl = strategies.reduce((sum, s) => sum + s.currentPnl, 0)
    const totalAllocated = strategies.reduce((sum, s) => sum + s.allocatedCapital, 0)
    const avgWinRate = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length 
      : 0

    return {
      running,
      paused,
      stopped,
      error,
      totalPnl,
      totalAllocated,
      avgWinRate,
      total: strategies.length
    }
  }, [strategies])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-3 w-3" />
      case 'paused': return <Clock className="h-3 w-3" />
      case 'stopped': return <Square className="h-3 w-3" />
      case 'error': return <AlertCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const renderStrategyItem = (strategy: TradingStrategy, index: number) => {
    const isPositivePnl = strategy.currentPnl >= 0
    const pnlColor = isPositivePnl ? 'text-green-600' : 'text-red-600'
    const TrendIcon = isPositivePnl ? TrendingUp : TrendingDown

    return (
      <SortableItem key={strategy.id} id={strategy.id}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{strategy.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {strategy.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={cn('text-xs flex items-center gap-1', getStatusColor(strategy.status))}>
                      {getStatusIcon(strategy.status)}
                      {strategy.status}
                    </Badge>
                    
                    <Badge className={cn('text-xs', getPriorityColor(strategy.priority))}>
                      {strategy.priority}
                    </Badge>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center space-x-1">
                  {strategy.status === 'stopped' || strategy.status === 'error' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartStrategy?.(strategy.id)}
                      className="h-8 px-2 text-green-600 hover:text-green-700"
                      title="Start strategy"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  ) : strategy.status === 'running' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPauseStrategy?.(strategy.id)}
                      className="h-8 px-2 text-yellow-600 hover:text-yellow-700"
                      title="Pause strategy"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartStrategy?.(strategy.id)}
                      className="h-8 px-2 text-green-600 hover:text-green-700"
                      title="Resume strategy"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStopStrategy?.(strategy.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                    title="Stop strategy"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Allocated Capital</div>
                  <div className="font-mono font-medium">{formatCurrency(strategy.allocatedCapital)}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Current P&L</div>
                  <div className={cn('font-mono font-medium flex items-center gap-1', pnlColor)}>
                    <TrendIcon className="h-3 w-3" />
                    {formatCurrency(strategy.currentPnl)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Total Trades</div>
                  <div className="font-mono">{strategy.totalTrades}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="font-mono">{formatPercentage(strategy.winRate)}</div>
                </div>
              </div>

              {/* Performance Visualization */}
              {showPerformanceMetrics && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Win Rate</span>
                    <span>{formatPercentage(strategy.winRate)}</span>
                  </div>
                  <Progress 
                    value={strategy.winRate} 
                    className={cn(
                      'h-2',
                      strategy.winRate >= 70 ? 'bg-green-100' : 
                      strategy.winRate >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                    )}
                  />
                </div>
              )}

              {/* Execution Priority Indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Execution Priority: #{index + 1}
                </span>
                {strategy.lastExecuted && (
                  <span className="text-muted-foreground">
                    Last: {strategy.lastExecuted.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SortableItem>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Strategy Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total Strategies</div>
              <div className="text-lg font-semibold">{strategyStats.total}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Running</div>
              <div className="text-lg font-semibold text-green-600">{strategyStats.running}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Total P&L</div>
              <div className={cn(
                'text-lg font-semibold flex items-center gap-1',
                strategyStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {strategyStats.totalPnl >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatCurrency(strategyStats.totalPnl)}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Allocated Capital</div>
              <div className="text-lg font-semibold">{formatCurrency(strategyStats.totalAllocated)}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Avg Win Rate</div>
              <div className="text-lg font-semibold">{formatPercentage(strategyStats.avgWinRate)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sortable Strategies */}
      <SortableContainer
        items={strategies}
        onItemsChange={onStrategiesChange}
        renderItem={renderStrategyItem}
        title={title}
        description={`${strategies.length} strategies • Drag to change execution priority`}
        options={{
          ...options,
          enableMultiSelect: false,
          persistOrder: true,
        }}
        emptyMessage="No trading strategies configured. Create a strategy to get started."
      />
    </div>
  )
}

export default StrategySortable