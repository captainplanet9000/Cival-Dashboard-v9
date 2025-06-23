/**
 * Trading-specific sortable component types and interfaces
 * Based on dnd-kit library with trading dashboard enhancements
 */

import { UniqueIdentifier } from '@dnd-kit/core';

// Base sortable item interface
export interface SortableItem {
  id: UniqueIdentifier;
  disabled?: boolean;
}

// Trading-specific item types
export interface WatchlistItem extends SortableItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  priority?: 'high' | 'medium' | 'low';
  alerts?: number;
}

export interface PortfolioPosition extends SortableItem {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  priority?: 'high' | 'medium' | 'low';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface TradingStrategy extends SortableItem {
  name: string;
  type: 'momentum' | 'mean-reversion' | 'arbitrage' | 'market-making' | 'custom';
  status: 'active' | 'paused' | 'stopped' | 'error';
  executionOrder: number;
  allocatedCapital: number;
  currentPnL: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  lastExecuted: Date;
  priority?: 'high' | 'medium' | 'low';
}

// Sortable container props
export interface SortableContainerProps<T extends SortableItem> {
  items: T[];
  onItemsReorder: (items: T[]) => void;
  disabled?: boolean;
  className?: string;
  children: (item: T, index: number) => React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  strategy?: 'rectSortingStrategy' | 'verticalListSortingStrategy' | 'horizontalListSortingStrategy';
}

// Sortable item props
export interface SortableItemProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  handle?: boolean;
  data?: Record<string, any>;
}

// Drag overlay props
export interface DragOverlayProps<T extends SortableItem> {
  activeItem: T | null;
  children: (item: T) => React.ReactNode;
}

// Trading-specific sortable options
export interface TradingSortableOptions {
  enableMultiSelect?: boolean;
  enableGrouping?: boolean;
  enablePriorityIndicators?: boolean;
  enableRiskIndicators?: boolean;
  maxItems?: number;
  animationDuration?: number;
  persistOrder?: boolean;
  onOrderPersist?: (items: SortableItem[]) => Promise<void>;
}

// Event handlers
export interface SortableEventHandlers<T extends SortableItem> {
  onDragStart?: (item: T) => void;
  onDragEnd?: (item: T) => void;
  onItemClick?: (item: T) => void;
  onItemDoubleClick?: (item: T) => void;
  onItemSelect?: (item: T, selected: boolean) => void;
  onBulkAction?: (items: T[], action: string) => void;
}

// Animation and styling
export interface SortableAnimationConfig {
  duration: number;
  easing: string;
  scale: number;
  opacity: number;
}

export interface SortableTheme {
  container: string;
  item: string;
  dragHandle: string;
  dragging: string;
  disabled: string;
  selected: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
}

// Default configurations
export const DEFAULT_ANIMATION_CONFIG: SortableAnimationConfig = {
  duration: 200,
  easing: 'ease-in-out',
  scale: 1.02,
  opacity: 0.8,
};

export const DEFAULT_TRADING_OPTIONS: TradingSortableOptions = {
  enableMultiSelect: false,
  enableGrouping: false,
  enablePriorityIndicators: true,
  enableRiskIndicators: true,
  maxItems: 100,
  animationDuration: 200,
  persistOrder: true,
};