/**
 * Premium Sortable Components for Trading Dashboard
 * 
 * Export all sortable components and their related types/utilities
 */

// Core sortable components
export { SortableContainer } from './SortableContainer';
export { SortableItem } from './SortableItem';

// Trading-specific sortable components
export { WatchlistSortable } from './WatchlistSortable';
export { PortfolioSortable } from './PortfolioSortable';
export { StrategySortable } from './StrategySortable';

// Demo component
export { SortableDemo } from './SortableDemo';

// Performance hooks
export {
  useVirtualizedSortable,
  useSortablePerformance,
  useDebouncedSortable,
  useSortableMetrics,
} from './hooks/useVirtualizedSortable';

// API integration utilities
export {
  sortableApi,
  SortablePersistence,
  useSortablePersistence,
  SortableApiError,
  withRetry,
} from './utils/apiIntegration';

// Animation utilities
export {
  ANIMATION_PRESETS,
  getDragAnimationStyles,
  getDropZoneStyles,
  getSortableItemStyles,
  getPriorityIndicatorStyles,
  getTradingIndicatorStyles,
  generateSortableCSS,
  injectSortableStyles,
  SortableAnimationManager,
  sortableAnimationManager,
} from './utils/animations';

// Types and interfaces
export type {
  SortableItem as SortableItemType,
  WatchlistItem,
  PortfolioPosition,
  TradingStrategy,
  SortableContainerProps,
  SortableItemProps,
  DragOverlayProps,
  TradingSortableOptions,
  SortableEventHandlers,
  SortableAnimationConfig,
  SortableTheme,
} from './types';

// Default configurations
export {
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_TRADING_OPTIONS,
} from './types';