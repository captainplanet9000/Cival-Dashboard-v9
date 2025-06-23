'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Square,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  BarChart3,
  Settings,
  MoreVertical,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortableContainer } from './SortableContainer';
import { SortableItem } from './SortableItem';
import { TradingStrategy, TradingSortableOptions } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StrategySortableProps {
  strategies: TradingStrategy[];
  onStrategiesChange: (strategies: TradingStrategy[]) => void;
  className?: string;
  options?: TradingSortableOptions;
  onCreateStrategy?: () => void;
  onStartStrategy?: (strategyId: string) => void;
  onPauseStrategy?: (strategyId: string) => void;
  onStopStrategy?: (strategyId: string) => void;
  onConfigureStrategy?: (strategyId: string) => void;
  onViewPerformance?: (strategyId: string) => void;
  onDeleteStrategy?: (strategyId: string) => void;
}

export function StrategySortable({
  strategies,
  onStrategiesChange,
  className,
  options = {
    enableMultiSelect: true,
    enablePriorityIndicators: true,
    enableRiskIndicators: false,
    maxItems: 20,
    persistOrder: true,
  },
  onCreateStrategy,
  onStartStrategy,
  onPauseStrategy,
  onStopStrategy,
  onConfigureStrategy,
  onViewPerformance,
  onDeleteStrategy,
}: StrategySortableProps) {
  const [tradingStrategies, setTradingStrategies] = useState<TradingStrategy[]>(strategies);

  // Sync with external strategies changes
  useEffect(() => {
    setTradingStrategies(strategies);
  }, [strategies]);

  // Handle strategies reorder
  const handleStrategiesReorder = useCallback((reorderedStrategies: TradingStrategy[]) => {
    // Update execution order based on new positions
    const updatedStrategies = reorderedStrategies.map((strategy, index) => ({
      ...strategy,
      executionOrder: index + 1,
    }));
    
    setTradingStrategies(updatedStrategies);
    onStrategiesChange(updatedStrategies);
  }, [onStrategiesChange]);

  // Handle strategy status toggle
  const handleStrategyToggle = useCallback((strategyId: string, newStatus: 'active' | 'paused') => {
    const updatedStrategies = tradingStrategies.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: newStatus }
        : strategy
    );
    setTradingStrategies(updatedStrategies);
    onStrategiesChange(updatedStrategies);
    
    if (newStatus === 'active') {
      onStartStrategy?.(strategyId);
    } else {
      onPauseStrategy?.(strategyId);
    }
  }, [tradingStrategies, onStrategiesChange, onStartStrategy, onPauseStrategy]);

  // Handle strategy stop
  const handleStrategyStop = useCallback((strategyId: string) => {
    const updatedStrategies = tradingStrategies.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: 'stopped' as const }
        : strategy
    );
    setTradingStrategies(updatedStrategies);
    onStrategiesChange(updatedStrategies);
    onStopStrategy?.(strategyId);
  }, [tradingStrategies, onStrategiesChange, onStopStrategy]);

  // Handle strategy deletion
  const handleDeleteStrategy = useCallback((strategyId: string) => {
    const updatedStrategies = tradingStrategies.filter(strategy => strategy.id !== strategyId);
    setTradingStrategies(updatedStrategies);
    onStrategiesChange(updatedStrategies);
    onDeleteStrategy?.(strategyId);
  }, [tradingStrategies, onStrategiesChange, onDeleteStrategy]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get strategy type icon
  const getStrategyTypeIcon = (type: TradingStrategy['type']) => {
    switch (type) {
      case 'momentum': return <TrendingUp className="w-4 h-4" />;
      case 'mean-reversion': return <Target className="w-4 h-4" />;
      case 'arbitrage': return <Zap className="w-4 h-4" />;
      case 'market-making': return <Activity className="w-4 h-4" />;
      case 'custom': return <Settings className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: TradingStrategy['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'paused': return 'text-yellow-600 dark:text-yellow-400';
      case 'stopped': return 'text-gray-600 dark:text-gray-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: TradingStrategy['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'stopped': return 'outline';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  // Render trading strategy
  const renderTradingStrategy = (strategy: TradingStrategy, index: number) => (
    <SortableItem key={strategy.id} id={strategy.id}>
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              {/* Strategy info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {getStrategyTypeIcon(strategy.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{strategy.name}</span>
                      <Badge variant={getStatusBadgeVariant(strategy.status)}>
                        {strategy.status}
                      </Badge>
                      {strategy.priority && options.enablePriorityIndicators && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            strategy.priority === 'high' && 'border-red-500 text-red-700 dark:text-red-400',
                            strategy.priority === 'medium' && 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
                            strategy.priority === 'low' && 'border-green-500 text-green-700 dark:text-green-400'
                          )}
                        >
                          {strategy.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {strategy.type.replace('-', ' ')} • Order #{strategy.executionOrder}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {/* Active/Pause toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={strategy.status === 'active'}
                    onCheckedChange={(checked) => 
                      handleStrategyToggle(strategy.id.toString(), checked ? 'active' : 'paused')
                    }
                    disabled={strategy.status === 'error'}
                  />
                </div>

                {/* Stop button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStrategyStop(strategy.id.toString())}
                  disabled={strategy.status === 'stopped'}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Square className="w-4 h-4" />
                </Button>

                {/* Action menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewPerformance?.(strategy.id.toString())}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Performance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onConfigureStrategy?.(strategy.id.toString())}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteStrategy(strategy.id.toString())}
                      className="text-red-600 dark:text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Delete Strategy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Allocated Capital */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Allocated Capital</div>
                <div className="font-semibold">{formatCurrency(strategy.allocatedCapital)}</div>
              </div>

              {/* Current P&L */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Current P&L</div>
                <div className={cn(
                  'font-semibold flex items-center space-x-1',
                  strategy.currentPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {strategy.currentPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatCurrency(strategy.currentPnL)}</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                <div className="font-semibold">{formatPercent(strategy.winRate)}</div>
              </div>

              {/* Sharpe Ratio */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</div>
                <div className={cn(
                  'font-semibold',
                  strategy.sharpeRatio >= 1 ? 'text-green-600 dark:text-green-400' : 
                  strategy.sharpeRatio >= 0.5 ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-red-600 dark:text-red-400'
                )}>
                  {strategy.sharpeRatio.toFixed(2)}
                </div>
              </div>

              {/* Max Drawdown */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</div>
                <div className="font-semibold text-red-600 dark:text-red-400">
                  {formatPercent(-Math.abs(strategy.maxDrawdown))}
                </div>
              </div>
            </div>

            {/* Last executed */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last executed: {formatTimeAgo(strategy.lastExecuted)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );

  // Calculate summary stats
  const activeStrategies = tradingStrategies.filter(s => s.status === 'active').length;
  const totalAllocated = tradingStrategies.reduce((sum, s) => sum + s.allocatedCapital, 0);
  const totalPnL = tradingStrategies.reduce((sum, s) => sum + s.currentPnL, 0);
  const avgWinRate = tradingStrategies.length > 0 
    ? tradingStrategies.reduce((sum, s) => sum + s.winRate, 0) / tradingStrategies.length 
    : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trading Strategies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag to reorder execution priority • {tradingStrategies.length} strategies
          </p>
        </div>
        {onCreateStrategy && (
          <Button onClick={onCreateStrategy} size="sm">
            Create Strategy
          </Button>
        )}
      </div>

      {/* Strategy summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Strategies</div>
            <div className="font-bold text-xl text-green-600 dark:text-green-400">{activeStrategies}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Allocated</div>
            <div className="font-bold text-xl">{formatCurrency(totalAllocated)}</div>
          </div>
        </Card>
        <Card className={cn(
          'p-4',
          totalPnL >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        )}>
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={cn(
              'font-bold text-xl',
              totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {formatCurrency(totalPnL)}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Win Rate</div>
            <div className="font-bold text-xl">{formatPercent(avgWinRate)}</div>
          </div>
        </Card>
      </div>

      {/* Sortable strategies */}
      {tradingStrategies.length > 0 ? (
        <SortableContainer
          items={tradingStrategies}
          onItemsReorder={handleStrategiesReorder}
          options={options}
          eventHandlers={{
            onItemClick: (strategy) => {
              console.log('Clicked strategy:', strategy.name);
            },
            onItemDoubleClick: (strategy) => {
              onViewPerformance?.(strategy.id.toString());
            },
          }}
        >
          {renderTradingStrategy}
        </SortableContainer>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No strategies configured</p>
            <p className="text-sm mb-4">Create your first trading strategy to get started</p>
            {onCreateStrategy && (
              <Button onClick={onCreateStrategy} variant="outline">
                Create First Strategy
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Strategy breakdown */}
      {tradingStrategies.length > 0 && (
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="font-semibold text-green-700 dark:text-green-400">
              {activeStrategies}
            </div>
            <div className="text-green-600 dark:text-green-500">Active</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="font-semibold text-yellow-700 dark:text-yellow-400">
              {tradingStrategies.filter(s => s.status === 'paused').length}
            </div>
            <div className="text-yellow-600 dark:text-yellow-500">Paused</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="font-semibold text-gray-700 dark:text-gray-400">
              {tradingStrategies.filter(s => s.status === 'stopped').length}
            </div>
            <div className="text-gray-600 dark:text-gray-500">Stopped</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="font-semibold text-red-700 dark:text-red-400">
              {tradingStrategies.filter(s => s.status === 'error').length}
            </div>
            <div className="text-red-600 dark:text-red-500">Error</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategySortable;