'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  MoreVertical,
  DollarSign,
  Percent,
  TrendingDown as Loss,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortableContainer } from './SortableContainer';
import { SortableItem } from './SortableItem';
import { PortfolioPosition, TradingSortableOptions } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PortfolioSortableProps {
  positions: PortfolioPosition[];
  onPositionsChange: (positions: PortfolioPosition[]) => void;
  totalPortfolioValue: number;
  className?: string;
  options?: TradingSortableOptions;
  onRebalance?: () => void;
  onClosePosition?: (symbol: string) => void;
  onAdjustPosition?: (symbol: string) => void;
  onViewAnalysis?: (symbol: string) => void;
}

export function PortfolioSortable({
  positions,
  onPositionsChange,
  totalPortfolioValue,
  className,
  options = {
    enableMultiSelect: true,
    enablePriorityIndicators: true,
    enableRiskIndicators: true,
    maxItems: 30,
    persistOrder: true,
  },
  onRebalance,
  onClosePosition,
  onAdjustPosition,
  onViewAnalysis,
}: PortfolioSortableProps) {
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>(positions);

  // Sync with external positions changes
  useEffect(() => {
    setPortfolioPositions(positions);
  }, [positions]);

  // Handle positions reorder
  const handlePositionsReorder = useCallback((reorderedPositions: PortfolioPosition[]) => {
    setPortfolioPositions(reorderedPositions);
    onPositionsChange(reorderedPositions);
  }, [onPositionsChange]);

  // Handle position closure
  const handleClosePosition = useCallback((symbol: string) => {
    const updatedPositions = portfolioPositions.filter(pos => pos.symbol !== symbol);
    setPortfolioPositions(updatedPositions);
    onPositionsChange(updatedPositions);
    onClosePosition?.(symbol);
  }, [portfolioPositions, onPositionsChange, onClosePosition]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return <ShieldCheck className="w-4 h-4" />;
      case 'medium': return <Shield className="w-4 h-4" />;
      case 'high': return <ShieldAlert className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Render portfolio position
  const renderPortfolioPosition = (position: PortfolioPosition, index: number) => (
    <SortableItem key={position.id} id={position.id}>
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              {/* Symbol and badges */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{position.symbol}</span>
                    {position.priority && options.enablePriorityIndicators && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          position.priority === 'high' && 'border-red-500 text-red-700 dark:text-red-400',
                          position.priority === 'medium' && 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
                          position.priority === 'low' && 'border-green-500 text-green-700 dark:text-green-400'
                        )}
                      >
                        {position.priority}
                      </Badge>
                    )}
                    {position.riskLevel && options.enableRiskIndicators && (
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getRiskLevelColor(position.riskLevel))}
                      >
                        {position.riskLevel}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {position.quantity.toLocaleString()} shares @ {formatCurrency(position.averagePrice)}
                  </div>
                </div>
              </div>

              {/* Action menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewAnalysis?.(position.symbol)}>
                    <Activity className="w-4 h-4 mr-2" />
                    View Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAdjustPosition?.(position.symbol)}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Adjust Position
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleClosePosition(position.symbol)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Loss className="w-4 h-4 mr-2" />
                    Close Position
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Current Value */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Market Value</div>
                <div className="font-semibold">{formatCurrency(position.marketValue)}</div>
              </div>

              {/* P&L */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Unrealized P&L</div>
                <div className={cn(
                  'font-semibold flex items-center space-x-1',
                  position.unrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {position.unrealizedPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatCurrency(position.unrealizedPnL)}</span>
                </div>
              </div>

              {/* P&L Percentage */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Return</div>
                <div className={cn(
                  'font-semibold',
                  position.unrealizedPnLPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {formatPercent(position.unrealizedPnLPercent)}
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Portfolio Weight</div>
                <div className="font-semibold flex items-center space-x-2">
                  <span>{position.weight.toFixed(1)}%</span>
                  {position.riskLevel && options.enableRiskIndicators && (
                    <span className={getRiskLevelColor(position.riskLevel)}>
                      {getRiskLevelIcon(position.riskLevel)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Weight visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Portfolio Allocation</span>
                <span>{position.weight.toFixed(1)}%</span>
              </div>
              <Progress 
                value={position.weight} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );

  // Calculate portfolio summary
  const totalUnrealizedPnL = portfolioPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalReturn = totalPortfolioValue > 0 ? (totalUnrealizedPnL / totalPortfolioValue) * 100 : 0;
  const gainers = portfolioPositions.filter(pos => pos.unrealizedPnL >= 0).length;
  const losers = portfolioPositions.filter(pos => pos.unrealizedPnL < 0).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Positions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag to reorder by priority • {portfolioPositions.length} positions
          </p>
        </div>
        {onRebalance && (
          <Button onClick={onRebalance} size="sm" variant="outline">
            Rebalance
          </Button>
        )}
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
            <div className="font-bold text-xl">{formatCurrency(totalPortfolioValue)}</div>
          </div>
        </Card>
        <Card className={cn(
          'p-4',
          totalUnrealizedPnL >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        )}>
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={cn(
              'font-bold text-xl flex items-center space-x-1',
              totalUnrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {totalUnrealizedPnL >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span>{formatCurrency(totalUnrealizedPnL)}</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Return</div>
            <div className={cn(
              'font-bold text-xl',
              totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {formatPercent(totalReturn)}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
            <div className="font-bold text-xl">
              {portfolioPositions.length > 0 ? ((gainers / portfolioPositions.length) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </Card>
      </div>

      {/* Sortable positions */}
      {portfolioPositions.length > 0 ? (
        <SortableContainer
          items={portfolioPositions}
          onItemsReorder={handlePositionsReorder}
          options={options}
          eventHandlers={{
            onItemClick: (position) => {
              console.log('Clicked position:', position.symbol);
            },
            onItemDoubleClick: (position) => {
              onViewAnalysis?.(position.symbol);
            },
          }}
        >
          {renderPortfolioPosition}
        </SortableContainer>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No positions found</p>
            <p className="text-sm mb-4">Start trading to see your positions here</p>
          </div>
        </Card>
      )}

      {/* Position breakdown */}
      {portfolioPositions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="font-semibold text-green-700 dark:text-green-400">
              {gainers}
            </div>
            <div className="text-green-600 dark:text-green-500">Winning</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="font-semibold text-red-700 dark:text-red-400">
              {losers}
            </div>
            <div className="text-red-600 dark:text-red-500">Losing</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="font-semibold text-blue-700 dark:text-blue-400">
              {portfolioPositions.filter(pos => pos.riskLevel === 'high' || pos.riskLevel === 'critical').length}
            </div>
            <div className="text-blue-600 dark:text-blue-500">High Risk</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortfolioSortable;