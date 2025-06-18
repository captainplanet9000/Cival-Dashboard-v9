/**
 * Watchlist Service
 * Real-time price monitoring and watchlist management
 */

import { 
  Watchlist, 
  WatchlistItem, 
  PriceAlert, 
  AgentWatchlistAssignment 
} from '@/lib/stores/app-store';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface WatchlistUpdateEvent {
  type: 'price_update' | 'alert_triggered' | 'item_added' | 'item_removed';
  data: any;
  timestamp: Date;
}

export class WatchlistService {
  private priceCache: Map<string, PriceData> = new Map();
  private priceSubscriptions: Map<string, Set<(data: PriceData) => void>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the watchlist service with real-time price monitoring
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateAllPrices();
    }, 5000); // Update every 5 seconds

    console.log('Watchlist service started');
  }

  /**
   * Stop the watchlist service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Watchlist service stopped');
  }

  /**
   * Subscribe to price updates for a symbol
   */
  subscribeToPriceUpdates(symbol: string, callback: (data: PriceData) => void): () => void {
    if (!this.priceSubscriptions.has(symbol)) {
      this.priceSubscriptions.set(symbol, new Set());
    }
    
    this.priceSubscriptions.get(symbol)!.add(callback);
    
    // If we have cached data, immediately call the callback
    const cached = this.priceCache.get(symbol);
    if (cached) {
      callback(cached);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.priceSubscriptions.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.priceSubscriptions.delete(symbol);
        }
      }
    };
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<PriceData | null> {
    // Check cache first
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.lastUpdated.getTime() < 30000) { // 30 seconds
      return cached;
    }

    // Fetch fresh data
    return this.fetchPriceData(symbol);
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    
    await Promise.all(symbols.map(async (symbol) => {
      const data = await this.getCurrentPrice(symbol);
      if (data) {
        results.set(symbol, data);
      }
    }));

    return results;
  }

  /**
   * Create a new watchlist
   */
  async createWatchlist(name: string, description?: string, isPublic: boolean = false): Promise<Watchlist> {
    const watchlist: Watchlist = {
      id: `watchlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      items: [],
      isDefault: false,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Here you would typically save to database
    // For now, we'll just return the created watchlist
    return watchlist;
  }

  /**
   * Add item to watchlist
   */
  async addToWatchlist(
    watchlistId: string, 
    symbol: string, 
    options?: {
      exchange?: string;
      targetPrice?: number;
      stopLoss?: number;
      takeProfit?: number;
      notes?: string;
    }
  ): Promise<WatchlistItem> {
    // Get current price
    const priceData = await this.getCurrentPrice(symbol);
    
    const item: WatchlistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: symbol.toUpperCase(),
      exchange: options?.exchange,
      targetPrice: options?.targetPrice,
      stopLoss: options?.stopLoss,
      takeProfit: options?.takeProfit,
      currentPrice: priceData?.price || 0,
      change24h: priceData?.change24h || 0,
      volume24h: priceData?.volume24h || 0,
      notes: options?.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Subscribe to price updates for this symbol
    this.subscribeToPriceUpdates(symbol, (data) => {
      // Update item with new price data
      item.currentPrice = data.price;
      item.change24h = data.change24h;
      item.volume24h = data.volume24h;
      item.updatedAt = new Date();
      
      // Check for alerts
      this.checkPriceAlerts(item);
    });

    return item;
  }

  /**
   * Remove item from watchlist
   */
  async removeFromWatchlist(watchlistId: string, itemId: string): Promise<boolean> {
    // Here you would typically remove from database
    // For now, we'll just return success
    return true;
  }

  /**
   * Create price alert
   */
  async createPriceAlert(
    symbol: string,
    alertType: 'above' | 'below' | 'change_percent',
    targetPrice?: number,
    percentageChange?: number
  ): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: symbol.toUpperCase(),
      alertType,
      targetPrice,
      percentageChange,
      isActive: true,
      createdAt: new Date()
    };

    // Subscribe to price updates to monitor the alert
    this.subscribeToPriceUpdates(symbol, (data) => {
      this.checkAlert(alert, data);
    });

    return alert;
  }

  /**
   * Assign agent to watchlist symbol
   */
  async assignAgentToSymbol(
    agentId: string,
    watchlistId: string,
    symbol: string,
    options?: {
      strategy?: string;
      maxPositionSize?: number;
      maxTradeSize?: number;
    }
  ): Promise<AgentWatchlistAssignment> {
    const assignment: AgentWatchlistAssignment = {
      id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      watchlistId,
      symbol: symbol.toUpperCase(),
      strategy: options?.strategy,
      maxPositionSize: options?.maxPositionSize,
      maxTradeSize: options?.maxTradeSize,
      isActive: true
    };

    return assignment;
  }

  /**
   * Get agent assignments for a symbol
   */
  async getAgentAssignments(symbol: string): Promise<AgentWatchlistAssignment[]> {
    // Here you would typically query database
    // For now, return empty array
    return [];
  }

  /**
   * Update all prices (called periodically)
   */
  private async updateAllPrices(): Promise<void> {
    const symbols = Array.from(this.priceSubscriptions.keys());
    if (symbols.length === 0) return;

    try {
      // Batch fetch prices for all subscribed symbols
      const prices = await this.batchFetchPrices(symbols);
      
      prices.forEach((data, symbol) => {
        // Update cache
        this.priceCache.set(symbol, data);
        
        // Notify subscribers
        const subscribers = this.priceSubscriptions.get(symbol);
        if (subscribers) {
          subscribers.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in price update callback for ${symbol}:`, error);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }

  /**
   * Fetch price data for a single symbol
   */
  private async fetchPriceData(symbol: string): Promise<PriceData | null> {
    try {
      // Mock API call - replace with real price feed
      // This would typically call CoinGecko, Binance, or other price APIs
      const mockPrice = this.generateMockPrice(symbol);
      
      const data: PriceData = {
        symbol: symbol.toUpperCase(),
        price: mockPrice.price,
        change24h: mockPrice.change24h,
        changePercent24h: mockPrice.changePercent24h,
        volume24h: mockPrice.volume24h,
        marketCap: mockPrice.marketCap,
        lastUpdated: new Date()
      };

      this.priceCache.set(symbol, data);
      return data;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Batch fetch prices for multiple symbols
   */
  private async batchFetchPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    
    // In a real implementation, this would make batch API calls
    // For now, we'll generate mock data
    symbols.forEach(symbol => {
      const mockPrice = this.generateMockPrice(symbol);
      results.set(symbol, {
        symbol: symbol.toUpperCase(),
        price: mockPrice.price,
        change24h: mockPrice.change24h,
        changePercent24h: mockPrice.changePercent24h,
        volume24h: mockPrice.volume24h,
        marketCap: mockPrice.marketCap,
        lastUpdated: new Date()
      });
    });

    return results;
  }

  /**
   * Generate mock price data (replace with real API calls)
   */
  private generateMockPrice(symbol: string): {
    price: number;
    change24h: number;
    changePercent24h: number;
    volume24h: number;
    marketCap: number;
  } {
    // Base prices for common symbols
    const basePrices: Record<string, number> = {
      'BTC': 43000,
      'ETH': 2400,
      'SOL': 100,
      'ADA': 0.45,
      'DOT': 6.5,
      'LINK': 14.2,
      'AVAX': 38,
      'MATIC': 0.85,
      'UNI': 7.2,
      'ATOM': 9.8
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 1;
    const randomFactor = 0.95 + Math.random() * 0.1; // ±5% variation
    const price = basePrice * randomFactor;
    
    const changePercent = (Math.random() - 0.5) * 10; // ±5% change
    const change24h = price * (changePercent / 100);
    
    return {
      price: Number(price.toFixed(4)),
      change24h: Number(change24h.toFixed(4)),
      changePercent24h: Number(changePercent.toFixed(2)),
      volume24h: Math.random() * 1000000000, // Random volume
      marketCap: price * (Math.random() * 100000000 + 10000000) // Random market cap
    };
  }

  /**
   * Check price alerts for a watchlist item
   */
  private checkPriceAlerts(item: WatchlistItem): void {
    // Check target price
    if (item.targetPrice && item.currentPrice >= item.targetPrice) {
      this.triggerAlert('target_reached', item);
    }

    // Check stop loss
    if (item.stopLoss && item.currentPrice <= item.stopLoss) {
      this.triggerAlert('stop_loss_hit', item);
    }

    // Check take profit
    if (item.takeProfit && item.currentPrice >= item.takeProfit) {
      this.triggerAlert('take_profit_hit', item);
    }
  }

  /**
   * Check a specific price alert
   */
  private checkAlert(alert: PriceAlert, priceData: PriceData): void {
    if (!alert.isActive) return;

    let triggered = false;

    switch (alert.alertType) {
      case 'above':
        if (alert.targetPrice && priceData.price >= alert.targetPrice) {
          triggered = true;
        }
        break;
      case 'below':
        if (alert.targetPrice && priceData.price <= alert.targetPrice) {
          triggered = true;
        }
        break;
      case 'change_percent':
        if (alert.percentageChange && Math.abs(priceData.changePercent24h) >= alert.percentageChange) {
          triggered = true;
        }
        break;
    }

    if (triggered) {
      alert.triggeredAt = new Date();
      alert.isActive = false;
      this.triggerAlert('price_alert', { alert, priceData });
    }
  }

  /**
   * Trigger an alert (can be extended to send notifications)
   */
  private triggerAlert(type: string, data: any): void {
    console.log(`Alert triggered: ${type}`, data);
    
    // Here you would typically:
    // - Send push notifications
    // - Execute trades via agents
    // - Log to database
    // - Send webhooks
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    subscribedSymbols: string[];
    cachedPrices: number;
    lastUpdate: Date | null;
  } {
    const cachedSymbols = Array.from(this.priceCache.keys());
    const lastUpdate = cachedSymbols.length > 0 
      ? new Date(Math.max(...Array.from(this.priceCache.values()).map(p => p.lastUpdated.getTime())))
      : null;

    return {
      isRunning: this.isRunning,
      subscribedSymbols: Array.from(this.priceSubscriptions.keys()),
      cachedPrices: this.priceCache.size,
      lastUpdate
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.priceCache.clear();
    console.log('Watchlist cache cleared');
  }

  /**
   * Export watchlist data
   */
  async exportWatchlist(watchlistId: string): Promise<any> {
    // Here you would typically export from database
    return {
      format: 'json',
      timestamp: new Date(),
      data: {}
    };
  }

  /**
   * Import watchlist data
   */
  async importWatchlist(data: any): Promise<Watchlist> {
    // Here you would typically import to database
    const watchlist = await this.createWatchlist(
      data.name || 'Imported Watchlist',
      data.description,
      false
    );
    
    return watchlist;
  }
}

// Create and export singleton instance
export const watchlistService = new WatchlistService();
export default watchlistService;