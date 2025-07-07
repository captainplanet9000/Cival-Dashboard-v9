/**
 * Enhanced Market Data Types
 * Comprehensive types for real-time market data throughout the dashboard
 */

export interface MarketPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  open24h: number
  marketCap?: number
  lastUpdate: Date
  source: string
  bid?: number
  ask?: number
  spread?: number
}

export interface HistoricalPrice {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  symbol: string
}

export interface MarketDataPoint extends HistoricalPrice {
  sma5?: number
  sma20?: number
  sma50?: number
  rsi?: number
  macd?: number
  macdSignal?: number
  bollingerUpper?: number
  bollingerLower?: number
  volatility?: number
}

export interface MarketAnalysis {
  symbol: string
  timestamp: Date
  trend: 'bullish' | 'bearish' | 'neutral'
  strength: number // 0-100
  indicators: {
    rsi: number
    macd: number
    sma20: number
    sma50: number
    bollingerPosition: number // -1 to 1 (lower to upper)
    volumeProfile: 'high' | 'normal' | 'low'
  }
  signals: {
    buy: number // 0-100 confidence
    sell: number // 0-100 confidence
    hold: number // 0-100 confidence
  }
  supportLevels: number[]
  resistanceLevels: number[]
  analysis: string
  confidence: number
}

export interface MarketEvent {
  id: string
  type: 'price_alert' | 'volume_spike' | 'trend_change' | 'support_break' | 'resistance_break'
  symbol: string
  timestamp: Date
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  data: Record<string, any>
  triggered: boolean
  agentNotified?: boolean
}

export interface MarketDataProvider {
  name: string
  priority: number
  rateLimit: number // requests per minute
  lastRequest: Date
  isHealthy: boolean
  fetchPrices(symbols: string[]): Promise<MarketPrice[]>
  fetchHistorical(symbol: string, interval: string, limit: number): Promise<HistoricalPrice[]>
}

export interface MarketDataSubscription {
  id: string
  symbols: string[]
  callback: (data: MarketPrice[]) => void
  interval: number // milliseconds
  active: boolean
  lastUpdate: Date
}

export interface AgentMarketAccess {
  agentId: string
  subscribedSymbols: string[]
  analysisHistory: MarketAnalysis[]
  alerts: MarketEvent[]
  tradingSignals: TradingSignal[]
  permissions: {
    canCreateAlerts: boolean
    canAccessHistorical: boolean
    canPerformAnalysis: boolean
    maxSymbols: number
  }
}

export interface TradingSignal {
  id: string
  agentId: string
  symbol: string
  type: 'buy' | 'sell' | 'hold'
  confidence: number
  price: number
  timestamp: Date
  reasoning: string
  marketAnalysis: MarketAnalysis
  executed: boolean
  result?: {
    executedPrice: number
    pnl: number
    executedAt: Date
  }
}

export interface MarketCorrelation {
  symbol1: string
  symbol2: string
  correlation: number // -1 to 1
  timeframe: string
  calculatedAt: Date
  pValue: number
  significance: 'high' | 'medium' | 'low'
}

export interface MarketSentiment {
  symbol: string
  timestamp: Date
  sentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish'
  score: number // -100 to 100
  sources: {
    news: number
    social: number
    technical: number
    onchain?: number
  }
  confidence: number
}

export interface PythonAnalysisRequest {
  id: string
  type: 'technical_analysis' | 'ml_prediction' | 'pattern_recognition' | 'custom'
  symbol: string
  timeframe: string
  parameters: Record<string, any>
  agentId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  result?: PythonAnalysisResult
}

export interface PythonAnalysisResult {
  requestId: string
  analysis: {
    summary: string
    predictions: Array<{
      timeframe: string
      direction: 'up' | 'down' | 'sideways'
      confidence: number
      targetPrice?: number
    }>
    patterns: Array<{
      name: string
      confidence: number
      description: string
    }>
    indicators: Record<string, number>
    risk: {
      level: 'low' | 'medium' | 'high'
      factors: string[]
    }
  }
  charts?: {
    technical: string // base64 encoded image
    prediction: string // base64 encoded image
  }
  recommendations: {
    action: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
    timeframe: string
  }
  metadata: {
    model: string
    dataPoints: number
    processingTime: number
    version: string
  }
}

export interface MarketDataConfig {
  providers: {
    primary: string
    secondary: string
    fallback: string
  }
  updateIntervals: {
    realtime: number // milliseconds
    batch: number // milliseconds
    historical: number // milliseconds
  }
  caching: {
    realtime: number // seconds
    historical: number // seconds
    analysis: number // seconds
  }
  symbols: {
    crypto: string[]
    stocks: string[]
    forex: string[]
    commodities: string[]
  }
  limits: {
    maxSubscriptions: number
    maxHistoricalDays: number
    maxAnalysisRequests: number
  }
}

export interface MarketDataStats {
  totalUpdates: number
  successRate: number
  averageLatency: number
  providerHealth: Record<string, boolean>
  cacheHitRate: number
  activeSubscriptions: number
  lastUpdate: Date
  dataQuality: {
    priceAccuracy: number
    dataCompleteness: number
    updateFrequency: number
  }
}

// API Response types
export interface MarketDataResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
  source?: string
  cached?: boolean
  latency?: number
}

// WebSocket message types
export interface MarketDataMessage {
  type: 'price_update' | 'analysis_complete' | 'event_triggered' | 'health_check'
  data: any
  timestamp: Date
  source: string
}

// Storage interfaces
export interface MarketDataStorage {
  // Real-time data
  storePrices(prices: MarketPrice[]): Promise<void>
  getPrices(symbols: string[]): Promise<MarketPrice[]>
  
  // Historical data
  storeHistorical(data: HistoricalPrice[]): Promise<void>
  getHistorical(symbol: string, from: Date, to: Date, interval: string): Promise<HistoricalPrice[]>
  
  // Analysis results
  storeAnalysis(analysis: MarketAnalysis): Promise<void>
  getAnalysis(symbol: string, from: Date, to: Date): Promise<MarketAnalysis[]>
  
  // Events
  storeEvent(event: MarketEvent): Promise<void>
  getEvents(symbols: string[], from: Date, to: Date): Promise<MarketEvent[]>
}

// Filter and query interfaces
export interface MarketDataFilter {
  symbols?: string[]
  from?: Date
  to?: Date
  interval?: string
  sources?: string[]
  minVolume?: number
  maxAge?: number // seconds
}

export interface MarketDataQuery {
  type: 'current' | 'historical' | 'analysis' | 'events'
  filter: MarketDataFilter
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Agent integration types
export interface AgentMarketDataRequest {
  agentId: string
  symbols: string[]
  analysisType: 'technical' | 'fundamental' | 'sentiment' | 'custom'
  timeframe: string
  parameters?: Record<string, any>
  callback?: (result: MarketAnalysis | PythonAnalysisResult) => void
}

export interface AgentTradingContext {
  agentId: string
  strategy: string
  marketData: MarketPrice[]
  analysis: MarketAnalysis[]
  sentiment: MarketSentiment[]
  correlations: MarketCorrelation[]
  activeSignals: TradingSignal[]
  riskLimits: {
    maxPositionSize: number
    maxDailyLoss: number
    maxDrawdown: number
  }
}

// Real-time streaming types
export interface MarketDataStream {
  id: string
  symbols: string[]
  interval: number
  subscribers: Set<string>
  isActive: boolean
  lastPrice: Record<string, MarketPrice>
  analytics: {
    updateCount: number
    errorCount: number
    averageLatency: number
  }
}

export interface StreamSubscription {
  id: string
  streamId: string
  subscriberId: string
  callback: (data: MarketPrice[]) => void
  filters?: {
    minChange?: number
    symbols?: string[]
    alertOnly?: boolean
  }
  createdAt: Date
  lastUpdate: Date
}