/**
 * HFT Engine Service
 * High-frequency trading strategies and execution
 */

import { HFTStrategy, HFTExecution } from '@/lib/stores/app-store';

export interface HFTMarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: Date;
  orderBook: {
    bids: Array<[number, number]>; // [price, size]
    asks: Array<[number, number]>;
  };
}

export interface HFTOrder {
  id: string;
  strategyId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  timeInForce: 'IOC' | 'FOK' | 'GTC';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  executionTime?: number;
}

export interface LatencyMetrics {
  marketDataLatency: number;
  orderLatency: number;
  exchangeLatency: number;
  networkLatency: number;
  totalLatency: number;
}

export class HFTEngineService {
  private strategies: Map<string, HFTStrategy> = new Map();
  private executions: Map<string, HFTExecution> = new Map();
  private marketData: Map<string, HFTMarketData> = new Map();
  private isRunning: boolean = false;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeStrategies();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start high-frequency market data updates
    this.tickInterval = setInterval(() => {
      this.processTick();
    }, 10); // 10ms intervals for HFT

    console.log('HFT Engine started');
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
  }

  private initializeStrategies(): void {
    const strategies: HFTStrategy[] = [
      {
        id: 'market-making-btc',
        name: 'BTC Market Making',
        strategyType: 'market_making',
        symbols: ['BTC/USDT'],
        parameters: {
          spread: 0.01, // 1 basis point
          maxPosition: 0.1,
          skew: 0.5
        },
        isActive: false,
        maxPositionSize: 50000,
        maxOrdersPerSecond: 100,
        profitTargetBps: 5,
        stopLossBps: 20,
        latencyThresholdMs: 5
      },
      {
        id: 'arbitrage-eth',
        name: 'ETH Cross-Exchange Arbitrage',
        strategyType: 'arbitrage',
        symbols: ['ETH/USDT'],
        parameters: {
          minSpread: 0.05,
          maxExecutionTime: 500
        },
        isActive: false,
        maxPositionSize: 25000,
        maxOrdersPerSecond: 50,
        profitTargetBps: 10,
        stopLossBps: 30,
        latencyThresholdMs: 10
      }
    ];

    strategies.forEach(strategy => this.strategies.set(strategy.id, strategy));
  }

  private async processTick(): Promise<void> {
    // Update market data
    await this.updateMarketData();
    
    // Process active strategies
    const activeStrategies = Array.from(this.strategies.values()).filter(s => s.isActive);
    
    for (const strategy of activeStrategies) {
      await this.executeStrategy(strategy);
    }
  }

  private async updateMarketData(): Promise<void> {
    // Mock market data updates
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    
    symbols.forEach(symbol => {
      const lastData = this.marketData.get(symbol);
      const basePrice = this.getBasePrice(symbol);
      
      const spread = basePrice * 0.0001; // 1 basis point spread
      const bid = basePrice - spread/2;
      const ask = basePrice + spread/2;
      
      this.marketData.set(symbol, {
        symbol,
        bid,
        ask,
        last: basePrice,
        volume: Math.random() * 1000,
        timestamp: new Date(),
        orderBook: {
          bids: this.generateOrderBook(bid, false),
          asks: this.generateOrderBook(ask, true)
        }
      });
    });
  }

  private generateOrderBook(centerPrice: number, isAsk: boolean): Array<[number, number]> {
    const orderBook: Array<[number, number]> = [];
    const direction = isAsk ? 1 : -1;
    
    for (let i = 0; i < 10; i++) {
      const price = centerPrice + (direction * i * centerPrice * 0.0001);
      const size = Math.random() * 10 + 1;
      orderBook.push([price, size]);
    }
    
    return orderBook;
  }

  private async executeStrategy(strategy: HFTStrategy): Promise<void> {
    const startTime = performance.now();
    
    try {
      switch (strategy.strategyType) {
        case 'market_making':
          await this.executeMarketMaking(strategy);
          break;
        case 'arbitrage':
          await this.executeArbitrage(strategy);
          break;
        case 'momentum':
          await this.executeMomentum(strategy);
          break;
      }
    } catch (error) {
      console.error(`Error executing strategy ${strategy.id}:`, error);
    }
    
    const executionTime = performance.now() - startTime;
    
    // Check latency threshold
    if (executionTime > strategy.latencyThresholdMs) {
      console.warn(`Strategy ${strategy.id} exceeded latency threshold: ${executionTime}ms`);
    }
  }

  private async executeMarketMaking(strategy: HFTStrategy): Promise<void> {
    const symbols = strategy.symbols;
    
    for (const symbol of symbols) {
      const marketData = this.marketData.get(symbol);
      if (!marketData) continue;
      
      const { spread, maxPosition, skew } = strategy.parameters;
      const midPrice = (marketData.bid + marketData.ask) / 2;
      
      // Calculate optimal bid/ask prices
      const halfSpread = midPrice * spread / 2;
      const bidPrice = midPrice - halfSpread;
      const askPrice = midPrice + halfSpread;
      
      // Generate orders
      const bidSize = Math.min(maxPosition, 1 + Math.random() * 2);
      const askSize = Math.min(maxPosition, 1 + Math.random() * 2);
      
      // Mock order execution
      if (Math.random() > 0.99) { // 1% fill probability per tick
        const execution: HFTExecution = {
          id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          strategyId: strategy.id,
          symbol,
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          quantity: bidSize,
          price: Math.random() > 0.5 ? bidPrice : askPrice,
          orderId: `order-${Date.now()}`,
          executionTimeUs: Math.random() * 1000, // microseconds
          latencyMs: Math.random() * 5,
          slippageBps: Math.random() * 2,
          profitLossUSD: (Math.random() - 0.4) * 50, // Slight positive bias
          status: 'filled',
          executedAt: new Date()
        };
        
        this.executions.set(execution.id, execution);
      }
    }
  }

  private async executeArbitrage(strategy: HFTStrategy): Promise<void> {
    // Mock arbitrage opportunity detection
    const symbols = strategy.symbols;
    
    for (const symbol of symbols) {
      // Simulate cross-exchange price differences
      const exchange1Price = this.getBasePrice(symbol) * (1 + (Math.random() - 0.5) * 0.001);
      const exchange2Price = this.getBasePrice(symbol) * (1 + (Math.random() - 0.5) * 0.001);
      
      const spreadBps = Math.abs(exchange2Price - exchange1Price) / Math.min(exchange1Price, exchange2Price) * 10000;
      
      if (spreadBps > strategy.parameters.minSpread) {
        // Execute arbitrage
        const execution: HFTExecution = {
          id: `arb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          strategyId: strategy.id,
          symbol,
          side: exchange1Price < exchange2Price ? 'buy' : 'sell',
          quantity: Math.min(strategy.maxPositionSize / exchange1Price, 10),
          price: Math.min(exchange1Price, exchange2Price),
          orderId: `arb-order-${Date.now()}`,
          executionTimeUs: Math.random() * 500,
          latencyMs: Math.random() * 10,
          slippageBps: Math.random() * 5,
          profitLossUSD: spreadBps * 10, // Simplified profit calculation
          status: 'filled',
          executedAt: new Date()
        };
        
        this.executions.set(execution.id, execution);
      }
    }
  }

  private async executeMomentum(strategy: HFTStrategy): Promise<void> {
    // Momentum strategy implementation
    const symbols = strategy.symbols;
    
    for (const symbol of symbols) {
      const marketData = this.marketData.get(symbol);
      if (!marketData) continue;
      
      // Simple momentum signal based on price movement
      const priceMovement = (Math.random() - 0.5) * 0.002; // ±0.2%
      const momentumThreshold = 0.001; // 0.1%
      
      if (Math.abs(priceMovement) > momentumThreshold) {
        const execution: HFTExecution = {
          id: `momentum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          strategyId: strategy.id,
          symbol,
          side: priceMovement > 0 ? 'buy' : 'sell',
          quantity: Math.min(strategy.maxPositionSize / marketData.last, 5),
          price: marketData.last,
          orderId: `momentum-order-${Date.now()}`,
          executionTimeUs: Math.random() * 200,
          latencyMs: Math.random() * 3,
          slippageBps: Math.random() * 1,
          profitLossUSD: Math.abs(priceMovement) * 1000, // Simplified
          status: 'filled',
          executedAt: new Date()
        };
        
        this.executions.set(execution.id, execution);
      }
    }
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC/USDT': 43000,
      'ETH/USDT': 2400,
      'SOL/USDT': 65
    };
    return prices[symbol] || 100;
  }

  // Public methods
  addStrategy(strategy: Omit<HFTStrategy, 'id'>): HFTStrategy {
    const newStrategy: HFTStrategy = {
      id: `hft-${Date.now()}`,
      ...strategy
    };
    this.strategies.set(newStrategy.id, newStrategy);
    return newStrategy;
  }

  getStrategies(): HFTStrategy[] {
    return Array.from(this.strategies.values());
  }

  getExecutions(limit: number = 100): HFTExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.executedAt!.getTime() - a.executedAt!.getTime())
      .slice(0, limit);
  }

  toggleStrategy(id: string, isActive: boolean): void {
    const strategy = this.strategies.get(id);
    if (strategy) {
      strategy.isActive = isActive;
    }
  }

  getPerformanceMetrics(): {
    totalExecutions: number;
    profitableExecutions: number;
    totalPnL: number;
    averageLatency: number;
    sharpeRatio: number;
  } {
    const executions = Array.from(this.executions.values());
    const profitableExecutions = executions.filter(e => e.profitLossUSD > 0);
    const totalPnL = executions.reduce((sum, e) => sum + e.profitLossUSD, 0);
    const averageLatency = executions.reduce((sum, e) => sum + e.latencyMs, 0) / executions.length || 0;
    
    // Simplified Sharpe ratio calculation
    const returns = executions.map(e => e.profitLossUSD / 1000); // Normalize
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length || 0;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 1;
    const sharpeRatio = avgReturn / Math.sqrt(variance);
    
    return {
      totalExecutions: executions.length,
      profitableExecutions: profitableExecutions.length,
      totalPnL,
      averageLatency,
      sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0
    };
  }

  getLatencyMetrics(): LatencyMetrics {
    const executions = Array.from(this.executions.values()).slice(-100); // Last 100 executions
    
    return {
      marketDataLatency: 0.5 + Math.random() * 1, // Mock data
      orderLatency: 1 + Math.random() * 2,
      exchangeLatency: 2 + Math.random() * 3,
      networkLatency: 5 + Math.random() * 5,
      totalLatency: executions.reduce((sum, e) => sum + e.latencyMs, 0) / executions.length || 0
    };
  }

  getStatus(): {
    isRunning: boolean;
    activeStrategies: number;
    totalStrategies: number;
    executionsToday: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const executionsToday = Array.from(this.executions.values())
      .filter(e => e.executedAt && e.executedAt >= today).length;
    
    return {
      isRunning: this.isRunning,
      activeStrategies: Array.from(this.strategies.values()).filter(s => s.isActive).length,
      totalStrategies: this.strategies.size,
      executionsToday
    };
  }
}

// Create and export singleton instance with lazy initialization
let _hftEngineServiceInstance: HFTEngineService | null = null;

export const hftEngineService = {
  get instance(): HFTEngineService {
    if (!_hftEngineServiceInstance) {
      _hftEngineServiceInstance = new HFTEngineService();
    }
    return _hftEngineServiceInstance;
  },
  
  // Proxy all methods
  start: () => hftEngineService.instance.start(),
  stop: () => hftEngineService.instance.stop(),
  getStatus: () => hftEngineService.instance.getStatus(),
  getPerformanceMetrics: () => hftEngineService.instance.getPerformanceMetrics()
};