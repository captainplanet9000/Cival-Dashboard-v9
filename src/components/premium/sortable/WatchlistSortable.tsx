'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Star,
  MoreVertical,
  Bell,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortableContainer } from './SortableContainer';
import { SortableItem } from './SortableItem';
import { WatchlistItem, TradingSortableOptions } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WatchlistSortableProps {
  items: WatchlistItem[];
  onItemsChange: (items: WatchlistItem[]) => void;
  className?: string;
  options?: TradingSortableOptions;
  onAddSymbol?: () => void;
  onRemoveSymbol?: (symbol: string) => void;
  onToggleAlert?: (symbol: string) => void;
  onViewChart?: (symbol: string) => void;
}

export function WatchlistSortable({
  items,
  onItemsChange,
  className,
  options = {
    enableMultiSelect: true,
    enablePriorityIndicators: true,
    enableRiskIndicators: false,
    maxItems: 50,
    persistOrder: true,
  },
  onAddSymbol,
  onRemoveSymbol,
  onToggleAlert,
  onViewChart,
}: WatchlistSortableProps) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(items);

  // Sync with external items changes
  useEffect(() => {
    setWatchlistItems(items);
  }, [items]);

  // Handle items reorder
  const handleItemsReorder = useCallback((reorderedItems: WatchlistItem[]) => {
    setWatchlistItems(reorderedItems);
    onItemsChange(reorderedItems);
  }, [onItemsChange]);

  // Handle item removal
  const handleRemoveItem = useCallback((symbol: string) => {
    const updatedItems = watchlistItems.filter(item => item.symbol !== symbol);
    setWatchlistItems(updatedItems);
    onItemsChange(updatedItems);
    onRemoveSymbol?.(symbol);
  }, [watchlistItems, onItemsChange, onRemoveSymbol]);

  // Handle alert toggle
  const handleToggleAlert = useCallback((symbol: string) => {
    const updatedItems = watchlistItems.map(item => 
      item.symbol === symbol 
        ? { ...item, alerts: (item.alerts || 0) > 0 ? 0 : 1 }
        : item
    );
    setWatchlistItems(updatedItems);
    onItemsChange(updatedItems);
    onToggleAlert?.(symbol);
  }, [watchlistItems, onItemsChange, onToggleAlert]);

  // Format price with proper decimals
  const formatPrice = (price: number) => {
    return price >= 1 ? price.toFixed(2) : price.toFixed(4);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Format volume
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  // Render watchlist item
  const renderWatchlistItem = (item: WatchlistItem, index: number) => (
    <SortableItem key={item.id} id={item.id}>
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Symbol and name */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{item.symbol}</span>
                    {item.priority && options.enablePriorityIndicators && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          item.priority === 'high' && 'border-red-500 text-red-700 dark:text-red-400',
                          item.priority === 'medium' && 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
                          item.priority === 'low' && 'border-green-500 text-green-700 dark:text-green-400'
                        )}
                      >
                        {item.priority}
                      </Badge>
                    )}
                    {(item.alerts || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Bell className="w-3 h-3 mr-1" />
                        {item.alerts}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              </div>
            </div>

            {/* Price and change */}
            <div className="flex items-center space-x-4">
              {/* Price */}
              <div className="text-right">
                <div className="font-semibold text-lg">${formatPrice(item.price)}</div>
                <div className="flex items-center space-x-1">
                  {item.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    item.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {formatPercent(item.changePercent)}
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                <div>Vol: {formatVolume(item.volume)}</div>
                {item.marketCap && (
                  <div>Cap: {formatVolume(item.marketCap)}</div>
                )}
              </div>

              {/* Action menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewChart?.(item.symbol)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Chart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleAlert(item.symbol)}>
                    <Bell className="w-4 h-4 mr-2" />
                    {(item.alerts || 0) > 0 ? 'Remove Alert' : 'Add Alert'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleRemoveItem(item.symbol)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Watchlist</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag to reorder • {watchlistItems.length} symbols
          </p>
        </div>
        {onAddSymbol && (
          <Button onClick={onAddSymbol} size="sm">
            Add Symbol
          </Button>
        )}
      </div>

      {/* Sortable watchlist */}
      {watchlistItems.length > 0 ? (
        <SortableContainer
          items={watchlistItems}
          onItemsReorder={handleItemsReorder}
          options={options}
          eventHandlers={{
            onItemClick: (item) => {
              console.log('Clicked item:', item.symbol);
            },
            onItemDoubleClick: (item) => {
              onViewChart?.(item.symbol);
            },
          }}
        >
          {renderWatchlistItem}
        </SortableContainer>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No symbols in watchlist</p>
            <p className="text-sm mb-4">Add symbols to start tracking them</p>
            {onAddSymbol && (
              <Button onClick={onAddSymbol} variant="outline">
                Add First Symbol
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Summary stats */}
      {watchlistItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="font-semibold text-green-700 dark:text-green-400">
              {watchlistItems.filter(item => item.changePercent >= 0).length}
            </div>
            <div className="text-green-600 dark:text-green-500">Gainers</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="font-semibold text-red-700 dark:text-red-400">
              {watchlistItems.filter(item => item.changePercent < 0).length}
            </div>
            <div className="text-red-600 dark:text-red-500">Losers</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="font-semibold text-blue-700 dark:text-blue-400">
              {watchlistItems.reduce((sum, item) => sum + (item.alerts || 0), 0)}
            </div>
            <div className="text-blue-600 dark:text-blue-500">Alerts</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchlistSortable;