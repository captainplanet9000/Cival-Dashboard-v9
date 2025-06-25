/**
 * USDT.D Stablecoin Monitor Service
 * Real-time monitoring and correlation analysis for USDT dominance
 */

import { 
  USDTDData, 
  USDTDCorrelation, 
  USDTDSignal 
} from '@/lib/stores/app-store';

export interface USDTDMetrics {
  currentIndex: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volatility: number;
  momentum: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface CorrelationAnalysis {
  symbol: string;
  correlation1h: number;
  correlation4h: number;
  correlation24h: number;
  correlation7d: number;
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  direction: 'positive' | 'negative';
  confidence: number;
  lastUpdated: Date;
}

export interface TradingSignal {
  id: string;
  signalType: 'long' | 'short' | 'neutral';
  strength: number; // 0-1
  confidence: number; // 0-1
  usdtdValue: number;
  triggerReason: string;
  recommendedSymbols: string[];
  targetPrice?: number;
  stopLoss?: number;
  timeframe: '1h' | '4h' | '1d' | '1w';
  expiresAt: Date;
  createdAt: Date;
}

export interface MarketRegime {
  regime: 'risk_on' | 'risk_off' | 'neutral' | 'transitional';
  confidence: number;
  indicators: {
    usdtdLevel: number;
    usdtdTrend: string;
    volatility: number;
    momentum: number;
  };
  implications: {
    crypto: 'bullish' | 'bearish' | 'neutral';
    alts: 'bullish' | 'bearish' | 'neutral';
    stablecoins: 'accumulating' | 'distributing' | 'neutral';
  };
}

export interface AlertCondition {
  id: string;
  name: string;
  type: 'threshold' | 'change' | 'correlation' | 'divergence';
  condition: {
    operator: '>' | '<' | '=' | '>=' | '<=';
    value: number;
    timeframe: string;
  };
  isActive: boolean;
  triggeredCount: number;
  lastTriggered?: Date;
}

export class USDTDMonitorService {
  private dataHistory: USDTDData[] = [];
  private correlations: Map<string, USDTDCorrelation> = new Map();
  private signals: TradingSignal[] = [];
  private alertConditions: AlertCondition[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  // Tracked symbols for correlation analysis
  private trackedSymbols: string[] = [
    'BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'LINK', 'AVAX', 'MATIC', 'UNI',
    'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP', 'XLM', 'HBAR', 'FLOW', 'MANA'
  ];

  constructor() {
    this.initializeAlertConditions();
  }

  /**
   * Start the monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Initial data load
    await this.loadHistoricalData();
    
    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.updateData();
    }, 60000); // Update every minute

    console.log('USDT.D Monitor service started');
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('USDT.D Monitor service stopped');
  }

  /**
   * Load historical USDT.D data
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // Generate mock historical data for the last 30 days
      const now = new Date();
      const baseIndex = 3.5; // Mock base USDT dominance index
      
      for (let i = 30; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        
        // Add some realistic movement to the index
        const randomWalk = (Math.random() - 0.5) * 0.2;
        const trendFactor = Math.sin(i * 0.1) * 0.1;
        const indexValue = baseIndex + randomWalk + trendFactor;
        
        const dataPoint: USDTDData = {
          timestamp,
          indexValue: Math.max(0, indexValue),
          change24h: (Math.random() - 0.5) * 0.5,
          change7d: (Math.random() - 0.5) * 1.0,
          volume24h: Math.random() * 10000000000,
          marketCap: indexValue * 100000000000
        };
        
        this.dataHistory.push(dataPoint);
      }

      // Sort by timestamp
      this.dataHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  /**
   * Update current data
   */
  private async updateData(): Promise<void> {
    try {
      // Fetch current USDT.D data
      const currentData = await this.fetchCurrentUSDTDData();
      this.dataHistory.push(currentData);
      
      // Keep only last 1000 data points
      if (this.dataHistory.length > 1000) {
        this.dataHistory = this.dataHistory.slice(-1000);
      }

      // Update correlations
      await this.updateCorrelations();
      
      // Generate signals
      await this.generateSignals();
      
      // Check alert conditions
      this.checkAlertConditions(currentData);

    } catch (error) {
      console.error('Error updating USDT.D data:', error);
    }
  }

  /**
   * Fetch current USDT.D data (mock implementation)
   */
  private async fetchCurrentUSDTDData(): Promise<USDTDData> {
    // Mock API call - would integrate with real USDT.D data source
    const lastValue = this.dataHistory.length > 0 ? 
      this.dataHistory[this.dataHistory.length - 1].indexValue : 3.5;
    
    const change = (Math.random() - 0.5) * 0.1;
    const newValue = Math.max(0, lastValue + change);
    
    return {
      timestamp: new Date(),
      indexValue: newValue,
      change24h: this.calculate24hChange(newValue),
      change7d: this.calculate7dChange(newValue),
      volume24h: Math.random() * 10000000000,
      marketCap: newValue * 100000000000
    };
  }

  /**
   * Update symbol correlations with USDT.D
   */
  private async updateCorrelations(): Promise<void> {
    if (this.dataHistory.length < 24) return; // Need at least 24 data points

    for (const symbol of this.trackedSymbols) {
      try {
        const priceData = await this.getSymbolPriceHistory(symbol);
        const correlation = this.calculateCorrelation(symbol, priceData);
        this.correlations.set(symbol, correlation);
      } catch (error) {
        console.error(`Error calculating correlation for ${symbol}:`, error);
      }
    }
  }

  /**
   * Calculate correlation between USDT.D and a symbol
   */
  private calculateCorrelation(symbol: string, priceData: number[]): USDTDCorrelation {
    const usdtdValues = this.dataHistory.slice(-24).map(d => d.indexValue);
    const symbolValues = priceData.slice(-24);

    const correlation1h = this.pearsonCorrelation(
      usdtdValues.slice(-1),
      symbolValues.slice(-1)
    );
    const correlation4h = this.pearsonCorrelation(
      usdtdValues.slice(-4),
      symbolValues.slice(-4)
    );
    const correlation24h = this.pearsonCorrelation(
      usdtdValues,
      symbolValues
    );
    const correlation7d = this.pearsonCorrelation(
      this.dataHistory.slice(-168).map(d => d.indexValue),
      priceData.slice(-168)
    );

    return {
      symbol,
      correlation1h,
      correlation4h,
      correlation24h,
      correlation7d,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate trading signals based on USDT.D analysis
   */
  private async generateSignals(): Promise<void> {
    if (this.dataHistory.length < 20) return;

    const current = this.dataHistory[this.dataHistory.length - 1];
    const metrics = this.getCurrentMetrics();
    
    // Signal generation logic
    const signals: TradingSignal[] = [];

    // Momentum-based signals
    if (Math.abs(metrics.momentum) > 0.3) {
      const signalType = metrics.momentum > 0 ? 'long' : 'short';
      const strength = Math.min(Math.abs(metrics.momentum), 1);
      
      // Find highly correlated symbols for counter-trading
      const highlyCorrelated = Array.from(this.correlations.values())
        .filter(c => Math.abs(c.correlation24h) > 0.5)
        .sort((a, b) => Math.abs(b.correlation24h) - Math.abs(a.correlation24h))
        .slice(0, 5);

      if (highlyCorrelated.length > 0) {
        signals.push({
          id: `momentum-${Date.now()}`,
          signalType: signalType === 'long' ? 'short' : 'long', // Counter-trade
          strength,
          confidence: 0.7,
          usdtdValue: current.indexValue,
          triggerReason: `USDT.D momentum ${signalType} signal - counter-trade crypto`,
          recommendedSymbols: highlyCorrelated.map(c => c.symbol),
          timeframe: '4h',
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
          createdAt: new Date()
        });
      }
    }

    // Mean reversion signals
    const volatility = this.calculateVolatility();
    if (volatility > 0.5) {
      const isAtExtreme = metrics.currentIndex > 4.0 || metrics.currentIndex < 3.0;
      
      if (isAtExtreme) {
        signals.push({
          id: `mean-reversion-${Date.now()}`,
          signalType: metrics.currentIndex > 4.0 ? 'long' : 'short',
          strength: 0.6,
          confidence: 0.6,
          usdtdValue: current.indexValue,
          triggerReason: `USDT.D at extreme level - mean reversion expected`,
          recommendedSymbols: ['BTC', 'ETH', 'SOL'],
          timeframe: '1d',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date()
        });
      }
    }

    // Correlation divergence signals
    const strongNegativeCorrelations = Array.from(this.correlations.values())
      .filter(c => c.correlation24h < -0.6);

    if (strongNegativeCorrelations.length > 0 && metrics.change24h > 0.2) {
      signals.push({
        id: `divergence-${Date.now()}`,
        signalType: 'long',
        strength: 0.8,
        confidence: 0.75,
        usdtdValue: current.indexValue,
        triggerReason: `Strong negative correlation + USDT.D rise = crypto buy opportunity`,
        recommendedSymbols: strongNegativeCorrelations.map(c => c.symbol),
        timeframe: '1h',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      });
    }

    // Add new signals
    this.signals.push(...signals);
    
    // Keep only recent signals (last 100)
    this.signals = this.signals.slice(-100);
  }

  /**
   * Get current USDT.D metrics
   */
  getCurrentMetrics(): USDTDMetrics {
    if (this.dataHistory.length === 0) {
      return {
        currentIndex: 0,
        change24h: 0,
        change7d: 0,
        change30d: 0,
        volatility: 0,
        momentum: 0,
        trend: 'neutral'
      };
    }

    const current = this.dataHistory[this.dataHistory.length - 1];
    const volatility = this.calculateVolatility();
    const momentum = this.calculateMomentum();
    
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (momentum > 0.1) trend = 'bullish';
    else if (momentum < -0.1) trend = 'bearish';

    return {
      currentIndex: current.indexValue,
      change24h: current.change24h,
      change7d: current.change7d,
      change30d: this.calculate30dChange(current.indexValue),
      volatility,
      momentum,
      trend
    };
  }

  /**
   * Get correlation analysis for all tracked symbols
   */
  getCorrelationAnalysis(): CorrelationAnalysis[] {
    return Array.from(this.correlations.values()).map(correlation => {
      const absCorr24h = Math.abs(correlation.correlation24h);
      let strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak' = 'very_weak';
      
      if (absCorr24h > 0.8) strength = 'very_strong';
      else if (absCorr24h > 0.6) strength = 'strong';
      else if (absCorr24h > 0.4) strength = 'moderate';
      else if (absCorr24h > 0.2) strength = 'weak';

      return {
        symbol: correlation.symbol,
        correlation1h: correlation.correlation1h,
        correlation4h: correlation.correlation4h,
        correlation24h: correlation.correlation24h,
        correlation7d: correlation.correlation7d,
        strength,
        direction: correlation.correlation24h >= 0 ? 'positive' : 'negative',
        confidence: absCorr24h,
        lastUpdated: correlation.lastUpdated
      };
    }).sort((a, b) => Math.abs(b.correlation24h) - Math.abs(a.correlation24h));
  }

  /**
   * Get current market regime
   */
  getMarketRegime(): MarketRegime {
    const metrics = this.getCurrentMetrics();
    
    let regime: 'risk_on' | 'risk_off' | 'neutral' | 'transitional' = 'neutral';
    let confidence = 0.5;

    if (metrics.currentIndex < 3.2 && metrics.trend === 'bearish') {
      regime = 'risk_on';
      confidence = 0.8;
    } else if (metrics.currentIndex > 3.8 && metrics.trend === 'bullish') {
      regime = 'risk_off';
      confidence = 0.8;
    } else if (metrics.volatility > 0.3) {
      regime = 'transitional';
      confidence = 0.6;
    }

    return {
      regime,
      confidence,
      indicators: {
        usdtdLevel: metrics.currentIndex,
        usdtdTrend: metrics.trend,
        volatility: metrics.volatility,
        momentum: metrics.momentum
      },
      implications: {
        crypto: regime === 'risk_on' ? 'bullish' : regime === 'risk_off' ? 'bearish' : 'neutral',
        alts: regime === 'risk_on' ? 'bullish' : 'bearish',
        stablecoins: regime === 'risk_off' ? 'accumulating' : 'distributing'
      }
    };
  }

  /**
   * Get recent trading signals
   */
  getRecentSignals(limit: number = 10): TradingSignal[] {
    return this.signals
      .filter(signal => signal.expiresAt > new Date())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get historical data
   */
  getHistoricalData(limit: number = 100): USDTDData[] {
    return this.dataHistory.slice(-limit);
  }

  /**
   * Add custom alert condition
   */
  addAlertCondition(condition: Omit<AlertCondition, 'id' | 'triggeredCount'>): AlertCondition {
    const alert: AlertCondition = {
      id: `alert-${Date.now()}`,
      triggeredCount: 0,
      ...condition
    };
    
    this.alertConditions.push(alert);
    return alert;
  }

  /**
   * Helper methods
   */
  private async getSymbolPriceHistory(symbol: string): Promise<number[]> {
    // Mock price data - would integrate with real price APIs
    const prices: number[] = [];
    const basePrice = this.getBasePrice(symbol);
    
    for (let i = 0; i < Math.min(168, this.dataHistory.length); i++) {
      const randomWalk = (Math.random() - 0.5) * 0.1;
      prices.push(basePrice * (1 + randomWalk));
    }
    
    return prices;
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC': 43000, 'ETH': 2400, 'BNB': 240, 'SOL': 65, 'ADA': 0.45,
      'DOT': 6.5, 'LINK': 14.2, 'AVAX': 38, 'MATIC': 0.85, 'UNI': 7.2,
      'ATOM': 9.8, 'NEAR': 3.2, 'FTM': 0.32, 'ALGO': 0.18, 'VET': 0.025
    };
    return prices[symbol] || 1;
  }

  private calculate24hChange(currentValue: number): number {
    if (this.dataHistory.length < 24) return 0;
    const value24hAgo = this.dataHistory[this.dataHistory.length - 24].indexValue;
    return ((currentValue - value24hAgo) / value24hAgo) * 100;
  }

  private calculate7dChange(currentValue: number): number {
    if (this.dataHistory.length < 168) return 0;
    const value7dAgo = this.dataHistory[this.dataHistory.length - 168].indexValue;
    return ((currentValue - value7dAgo) / value7dAgo) * 100;
  }

  private calculate30dChange(currentValue: number): number {
    if (this.dataHistory.length < 720) return 0;
    const value30dAgo = this.dataHistory[this.dataHistory.length - 720].indexValue;
    return ((currentValue - value30dAgo) / value30dAgo) * 100;
  }

  private calculateVolatility(): number {
    if (this.dataHistory.length < 24) return 0;
    
    const last24h = this.dataHistory.slice(-24).map(d => d.indexValue);
    const mean = last24h.reduce((a, b) => a + b, 0) / last24h.length;
    const variance = last24h.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / last24h.length;
    
    return Math.sqrt(variance);
  }

  private calculateMomentum(): number {
    if (this.dataHistory.length < 12) return 0;
    
    const recent = this.dataHistory.slice(-6).map(d => d.indexValue);
    const earlier = this.dataHistory.slice(-12, -6).map(d => d.indexValue);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    return (recentAvg - earlierAvg) / earlierAvg;
  }

  private initializeAlertConditions(): void {
    this.alertConditions = [
      {
        id: 'usdtd-high',
        name: 'USDT.D Above 4.0',
        type: 'threshold',
        condition: { operator: '>', value: 4.0, timeframe: '1h' },
        isActive: true,
        triggeredCount: 0
      },
      {
        id: 'usdtd-low',
        name: 'USDT.D Below 3.0',
        type: 'threshold',
        condition: { operator: '<', value: 3.0, timeframe: '1h' },
        isActive: true,
        triggeredCount: 0
      },
      {
        id: 'usdtd-spike',
        name: 'USDT.D 24h Change > 5%',
        type: 'change',
        condition: { operator: '>', value: 5.0, timeframe: '24h' },
        isActive: true,
        triggeredCount: 0
      }
    ];
  }

  private checkAlertConditions(data: USDTDData): void {
    this.alertConditions.forEach(alert => {
      if (!alert.isActive) return;

      let triggered = false;

      switch (alert.type) {
        case 'threshold':
          triggered = this.evaluateThreshold(data.indexValue, alert.condition);
          break;
        case 'change':
          triggered = this.evaluateChange(data.change24h, alert.condition);
          break;
      }

      if (triggered) {
        alert.triggeredCount++;
        alert.lastTriggered = new Date();
        console.log(`Alert triggered: ${alert.name}`);
      }
    });
  }

  private evaluateThreshold(value: number, condition: AlertCondition['condition']): boolean {
    switch (condition.operator) {
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      case '=': return Math.abs(value - condition.value) < 0.001;
      default: return false;
    }
  }

  private evaluateChange(change: number, condition: AlertCondition['condition']): boolean {
    return this.evaluateThreshold(Math.abs(change), condition);
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    dataPoints: number;
    trackedSymbols: number;
    activeSignals: number;
    lastUpdate: Date | null;
  } {
    const activeSignals = this.signals.filter(s => s.expiresAt > new Date()).length;
    const lastUpdate = this.dataHistory.length > 0 ? 
      this.dataHistory[this.dataHistory.length - 1].timestamp : null;

    return {
      isRunning: this.isRunning,
      dataPoints: this.dataHistory.length,
      trackedSymbols: this.trackedSymbols.length,
      activeSignals,
      lastUpdate
    };
  }
}

// Create and export singleton instance with lazy initialization
let _usdtdMonitorServiceInstance: USDTDMonitorService | null = null;

export const usdtdMonitorService = {
  get instance(): USDTDMonitorService {
    if (!_usdtdMonitorServiceInstance) {
      _usdtdMonitorServiceInstance = new USDTDMonitorService();
    }
    return _usdtdMonitorServiceInstance;
  },
  
  // Proxy all methods
  start: () => usdtdMonitorService.instance.start(),
  stop: () => usdtdMonitorService.instance.stop(),
  getCurrentMetrics: () => usdtdMonitorService.instance.getCurrentMetrics(),
  getHistoricalData: (count: number) => usdtdMonitorService.instance.getHistoricalData(count),
  getCorrelationAnalysis: () => usdtdMonitorService.instance.getCorrelationAnalysis(),
  getMarketRegime: () => usdtdMonitorService.instance.getMarketRegime(),
  getRecentSignals: (count: number) => usdtdMonitorService.instance.getRecentSignals(count),
  getStatus: () => usdtdMonitorService.instance.getStatus()
};

export default usdtdMonitorService;