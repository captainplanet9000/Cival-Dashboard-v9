/**
 * API integration utilities for persisting sortable list orders
 * Integrates with the trading dashboard backend
 */

import { SortableItem, WatchlistItem, PortfolioPosition, TradingStrategy } from '../types';

// Base API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class SortableApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Watchlist API methods
  async getWatchlistOrder(): Promise<string[]> {
    return this.makeRequest<string[]>('/api/v1/watchlist/order');
  }

  async updateWatchlistOrder(symbolOrder: string[]): Promise<void> {
    await this.makeRequest('/api/v1/watchlist/order', {
      method: 'PUT',
      body: JSON.stringify({ order: symbolOrder }),
    });
  }

  async getWatchlistItems(): Promise<WatchlistItem[]> {
    return this.makeRequest<WatchlistItem[]>('/api/v1/watchlist');
  }

  async addWatchlistItem(symbol: string): Promise<WatchlistItem> {
    return this.makeRequest<WatchlistItem>('/api/v1/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  }

  async removeWatchlistItem(symbol: string): Promise<void> {
    await this.makeRequest(`/api/v1/watchlist/${symbol}`, {
      method: 'DELETE',
    });
  }

  // Portfolio API methods
  async getPortfolioOrder(): Promise<string[]> {
    return this.makeRequest<string[]>('/api/v1/portfolio/order');
  }

  async updatePortfolioOrder(positionOrder: string[]): Promise<void> {
    await this.makeRequest('/api/v1/portfolio/order', {
      method: 'PUT',
      body: JSON.stringify({ order: positionOrder }),
    });
  }

  async getPortfolioPositions(): Promise<PortfolioPosition[]> {
    return this.makeRequest<PortfolioPosition[]>('/api/v1/portfolio/positions');
  }

  async updatePositionPriority(symbol: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    await this.makeRequest(`/api/v1/portfolio/positions/${symbol}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority }),
    });
  }

  // Strategy API methods
  async getStrategyOrder(): Promise<string[]> {
    return this.makeRequest<string[]>('/api/v1/strategies/order');
  }

  async updateStrategyOrder(strategyOrder: string[]): Promise<void> {
    await this.makeRequest('/api/v1/strategies/order', {
      method: 'PUT',
      body: JSON.stringify({ order: strategyOrder }),
    });
  }

  async getStrategies(): Promise<TradingStrategy[]> {
    return this.makeRequest<TradingStrategy[]>('/api/v1/strategies');
  }

  async updateStrategyExecutionOrder(strategyId: string, executionOrder: number): Promise<void> {
    await this.makeRequest(`/api/v1/strategies/${strategyId}/execution-order`, {
      method: 'PUT',
      body: JSON.stringify({ executionOrder }),
    });
  }

  async createStrategy(strategy: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return this.makeRequest<TradingStrategy>('/api/v1/strategies', {
      method: 'POST',
      body: JSON.stringify(strategy),
    });
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    await this.makeRequest(`/api/v1/strategies/${strategyId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
export const sortableApi = new SortableApiClient();

// Utility functions for handling sortable persistence
export class SortablePersistence {
  /**
   * Save watchlist order to backend
   */
  static async saveWatchlistOrder(items: WatchlistItem[]): Promise<void> {
    const order = items.map(item => item.symbol);
    await sortableApi.updateWatchlistOrder(order);
  }

  /**
   * Load watchlist order from backend and apply to items
   */
  static async loadWatchlistOrder(items: WatchlistItem[]): Promise<WatchlistItem[]> {
    try {
      const savedOrder = await sortableApi.getWatchlistOrder();
      return this.applySavedOrder(items, savedOrder, 'symbol');
    } catch (error) {
      console.warn('Failed to load watchlist order:', error);
      return items;
    }
  }

  /**
   * Save portfolio order to backend
   */
  static async savePortfolioOrder(positions: PortfolioPosition[]): Promise<void> {
    const order = positions.map(pos => pos.symbol);
    await sortableApi.updatePortfolioOrder(order);
  }

  /**
   * Load portfolio order from backend and apply to positions
   */
  static async loadPortfolioOrder(positions: PortfolioPosition[]): Promise<PortfolioPosition[]> {
    try {
      const savedOrder = await sortableApi.getPortfolioOrder();
      return this.applySavedOrder(positions, savedOrder, 'symbol');
    } catch (error) {
      console.warn('Failed to load portfolio order:', error);
      return positions;
    }
  }

  /**
   * Save strategy execution order to backend
   */
  static async saveStrategyOrder(strategies: TradingStrategy[]): Promise<void> {
    const order = strategies.map(strategy => strategy.id.toString());
    await sortableApi.updateStrategyOrder(order);
    
    // Also update individual strategy execution orders
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      await sortableApi.updateStrategyExecutionOrder(strategy.id.toString(), i + 1);
    }
  }

  /**
   * Load strategy order from backend and apply to strategies
   */
  static async loadStrategyOrder(strategies: TradingStrategy[]): Promise<TradingStrategy[]> {
    try {
      const savedOrder = await sortableApi.getStrategyOrder();
      return this.applySavedOrder(strategies, savedOrder, 'id');
    } catch (error) {
      console.warn('Failed to load strategy order:', error);
      return strategies;
    }
  }

  /**
   * Generic function to apply saved order to items
   */
  private static applySavedOrder<T extends SortableItem>(
    items: T[],
    savedOrder: string[],
    keyProperty: keyof T
  ): T[] {
    if (!savedOrder || savedOrder.length === 0) {
      return items;
    }

    // Create a map for quick lookup
    const itemMap = new Map<string, T>();
    items.forEach(item => {
      itemMap.set(String(item[keyProperty]), item);
    });

    // Reorder items based on saved order
    const reorderedItems: T[] = [];
    const usedItems = new Set<string>();

    // Add items in saved order
    for (const key of savedOrder) {
      const item = itemMap.get(key);
      if (item) {
        reorderedItems.push(item);
        usedItems.add(key);
      }
    }

    // Add any remaining items that weren't in the saved order
    for (const item of items) {
      const key = String(item[keyProperty]);
      if (!usedItems.has(key)) {
        reorderedItems.push(item);
      }
    }

    return reorderedItems;
  }
}

// Hook for handling sortable persistence
export function useSortablePersistence<T extends SortableItem>(
  items: T[],
  persistenceKey: 'watchlist' | 'portfolio' | 'strategies',
  onItemsChange: (items: T[]) => void
) {
  const saveOrder = async (newItems: T[]) => {
    try {
      switch (persistenceKey) {
        case 'watchlist':
          await SortablePersistence.saveWatchlistOrder(newItems as unknown as WatchlistItem[]);
          break;
        case 'portfolio':
          await SortablePersistence.savePortfolioOrder(newItems as unknown as PortfolioPosition[]);
          break;
        case 'strategies':
          await SortablePersistence.saveStrategyOrder(newItems as unknown as TradingStrategy[]);
          break;
      }
      onItemsChange(newItems);
    } catch (error) {
      console.error(`Failed to save ${persistenceKey} order:`, error);
      // Still update local state even if save fails
      onItemsChange(newItems);
    }
  };

  const loadOrder = async (): Promise<T[]> => {
    try {
      switch (persistenceKey) {
        case 'watchlist':
          return await SortablePersistence.loadWatchlistOrder(items as unknown as WatchlistItem[]) as unknown as T[];
        case 'portfolio':
          return await SortablePersistence.loadPortfolioOrder(items as unknown as PortfolioPosition[]) as unknown as T[];
        case 'strategies':
          return await SortablePersistence.loadStrategyOrder(items as unknown as TradingStrategy[]) as unknown as T[];
        default:
          return items;
      }
    } catch (error) {
      console.error(`Failed to load ${persistenceKey} order:`, error);
      return items;
    }
  };

  return {
    saveOrder,
    loadOrder,
    api: sortableApi,
  };
}

// Error handling utilities
export class SortableApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'SortableApiError';
  }
}

// Retry utility for failed API calls
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw new SortableApiError(
    `Operation failed after ${maxRetries} attempts: ${lastError.message}`
  );
}