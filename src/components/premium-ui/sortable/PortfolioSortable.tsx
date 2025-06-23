'use client'

import React, { useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, X, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { SortableContainer } from './SortableContainer'
import { SortableItem } from './SortableItem'
import type { PortfolioPosition, SortableOptions } from './types'

interface PortfolioSortableProps {
  positions: PortfolioPosition[]
  onPositionsChange: (positions: PortfolioPosition[]) => void
  totalPortfolioValue: number
  onClosePosition?: (symbol: string) => void
  onEditPosition?: (symbol: string) => void
  onViewDetails?: (symbol: string) => void
  className?: string
  options?: SortableOptions
  title?: string
  showRiskIndicators?: boolean
  showPortfolioWeights?: boolean
}

export function PortfolioSortable({
  positions,
  onPositionsChange,
  totalPortfolioValue,
  onClosePosition,
  onEditPosition,
  onViewDetails,
  className,
  options = {},
  title = 'Portfolio Positions',
  showRiskIndicators = true,
  showPortfolioWeights = true
}: PortfolioSortableProps) {

  const portfolioStats = useMemo(() => {
    const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
    const totalPnlPercent = totalPortfolioValue > 0 ? (totalPnl / totalPortfolioValue) * 100 : 0
    const winningPositions = positions.filter(pos => pos.pnl > 0).length
    const losingPositions = positions.filter(pos => pos.pnl < 0).length
    
    return {
      totalPnl,
      totalPnlPercent,
      winningPositions,
      losingPositions,
      totalPositions: positions.length
    }
  }, [positions, totalPortfolioValue])

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Shield className="h-3 w-3" />
      case 'medium': return <Shield className="h-3 w-3" />
      case 'high': return <AlertTriangle className="h-3 w-3" />
      case 'critical': return <AlertTriangle className="h-3 w-3" />
      default: return <Shield className="h-3 w-3" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  }

  const renderPortfolioPosition = (position: PortfolioPosition, index: number) => {
    const isPositive = position.pnl >= 0
    const pnlColor = isPositive ? 'text-green-600' : 'text-red-600'
    const TrendIcon = isPositive ? TrendingUp : TrendingDown
    const positionValue = position.quantity * position.currentPrice

    return (
      <SortableItem key={position.id} id={position.id}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-semibold text-sm">{position.symbol}</h4>
                    <p className="text-xs text-muted-foreground">{position.name}</p>
                  </div>
                  
                  {showRiskIndicators && (
                    <Badge className={cn('text-xs flex items-center gap-1', getRiskColor(position.riskLevel))}>
                      {getRiskIcon(position.riskLevel)}
                      {position.riskLevel}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails?.(position.symbol)}
                    className="h-8 w-8 p-0"
                    title="View details"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditPosition?.(position.symbol)}
                    className="h-8 w-8 p-0"
                    title="Edit position"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onClosePosition?.(position.symbol)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    title="Close position"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Position Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Quantity</div>
                  <div className="font-mono">{formatNumber(position.quantity, 4)}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Avg Price</div>
                  <div className="font-mono">{formatCurrency(position.averagePrice)}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="font-mono">{formatCurrency(position.currentPrice)}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Position Value</div>
                  <div className="font-mono font-medium">{formatCurrency(positionValue)}</div>
                </div>
              </div>

              {/* P&L and Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">P&L</div>
                  <div className={cn('flex items-center space-x-2', pnlColor)}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="font-mono font-medium">
                      {formatCurrency(position.pnl)} ({isPositive ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {showPortfolioWeights && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Portfolio Weight ({position.portfolioWeight.toFixed(1)}%)
                    </div>
                    <Progress 
                      value={position.portfolioWeight} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>

              {/* Last Update */}
              {position.lastUpdate && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {position.lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </SortableItem>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Portfolio Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total Positions</div>
              <div className="text-lg font-semibold">{portfolioStats.totalPositions}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Portfolio P&L</div>
              <div className={cn(
                'text-lg font-semibold flex items-center gap-1',
                portfolioStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {portfolioStats.totalPnl >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatCurrency(portfolioStats.totalPnl)}
                <span className="text-sm">
                  ({portfolioStats.totalPnl >= 0 ? '+' : ''}{portfolioStats.totalPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Winning Positions</div>
              <div className="text-lg font-semibold text-green-600">{portfolioStats.winningPositions}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Losing Positions</div>
              <div className="text-lg font-semibold text-red-600">{portfolioStats.losingPositions}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sortable Positions */}
      <SortableContainer
        items={positions}
        onItemsChange={onPositionsChange}
        renderItem={renderPortfolioPosition}
        title={title}
        description={`${positions.length} positions • ${formatCurrency(totalPortfolioValue)} total value`}
        options={{
          ...options,
          enableMultiSelect: true,
          persistOrder: true,
        }}
        emptyMessage="No positions in portfolio. Execute some trades to see positions here."
      />
    </div>
  )
}

export default PortfolioSortable