'use client'

import { EventEmitter } from 'events'

export interface MarketData {
  symbol: string
  price: number
  volume: number
  change: number
  changePercent: number
  bid: number
  ask: number
  high24h: number
  low24h: number
  timestamp: string
  source: 'binance' | 'coinbase' | 'polygon' | 'alpha_vantage' | 'mock'
}

export interface TechnicalIndicators {
  symbol: string
  rsi: number
  macd: {
    value: number
    signal: number
    histogram: number
  }
  bollinger: {
    upper: number
    middle: number
    lower: number
    position: number // 0-1, where 0.5 is middle
  }
  ema: {
    ema12: number
    ema26: number
    ema50: number
    ema200: number
  }
  volume: {
    sma20: number
    current: number
    ratio: number
  }
  support: number
  resistance: number
  trend: 'bullish' | 'bearish' | 'sideways'
  volatility: number
  timestamp: string
}

export interface MarketNews {
  id: string
  headline: string
  summary: string
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'low' | 'medium' | 'high'
  symbols: string[]
  source: string
  publishedAt: string
  url?: string
}

export interface MarketSentiment {
  symbol: string
  overall: number // -1 to 1
  fearGreedIndex: number // 0 to 100
  socialSentiment: number // -1 to 1
  newsImpact: number // -1 to 1
  technicalSentiment: number // -1 to 1
  volumeSentiment: number // -1 to 1
  timestamp: string
}

class RealMarketDataService extends EventEmitter {
  private wsConnections = new Map<string, WebSocket>()
  private dataCache = new Map<string, MarketData>()
  private indicatorCache = new Map<string, TechnicalIndicators>()
  private priceHistory = new Map<string, number[]>()
  private subscribedSymbols = new Set<string>()
  private updateInterval: NodeJS.Timeout | null = null
  private isConnected = false

  constructor() {
    super()
    this.initializeConnections()
  }

  private async initializeConnections() {
    console.log('🔌 Initializing real-time market data connections...')
    
    // Start with mock data and attempt real connections
    this.startMockDataProvider()
    
    // Try to connect to real data sources
    await this.connectToBinance()
    await this.connectToCoinbase()
    
    this.isConnected = true
    this.emit('connected')
  }

  // Subscribe to symbol updates
  subscribe(symbol: string): void {
    if (this.subscribedSymbols.has(symbol)) return
    
    this.subscribedSymbols.add(symbol)
    console.log(`📈 Subscribed to ${symbol} market data`)
    
    // Initialize price history
    this.priceHistory.set(symbol, [])
    
    // Subscribe to real sources
    this.subscribeToRealSources(symbol)
    
    this.emit('subscribed', symbol)
  }

  // Unsubscribe from symbol
  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol)
    this.dataCache.delete(symbol)
    this.indicatorCache.delete(symbol)
    this.priceHistory.delete(symbol)
    
    console.log(`📉 Unsubscribed from ${symbol} market data`)
    this.emit('unsubscribed', symbol)
  }

  // Get current market data
  getMarketData(symbol: string): MarketData | null {
    return this.dataCache.get(symbol) || null
  }

  // Get technical indicators
  getTechnicalIndicators(symbol: string): TechnicalIndicators | null {
    return this.indicatorCache.get(symbol) || null
  }

  // Get price history
  getPriceHistory(symbol: string, limit: number = 100): number[] {
    return this.priceHistory.get(symbol)?.slice(-limit) || []
  }

  // Get all subscribed symbols data
  getAllMarketData(): MarketData[] {
    return Array.from(this.dataCache.values())
  }

  // Get market sentiment
  async getMarketSentiment(symbol: string): Promise<MarketSentiment> {
    const data = this.getMarketData(symbol)
    const indicators = this.getTechnicalIndicators(symbol)
    const history = this.getPriceHistory(symbol, 20)
    
    if (!data || !indicators) {
      return this.generateMockSentiment(symbol)
    }

    // Calculate sentiment components
    const technicalSentiment = this.calculateTechnicalSentiment(indicators)
    const volumeSentiment = this.calculateVolumeSentiment(data, indicators)
    const priceMomentum = history.length > 10 ? this.calculateMomentum(history) : 0
    
    // Aggregate sentiment
    const overall = (technicalSentiment + volumeSentiment + priceMomentum) / 3
    
    return {
      symbol,
      overall,
      fearGreedIndex: 50 + overall * 25, // Convert to 0-100 scale
      socialSentiment: overall * 0.8, // Simulated
      newsImpact: Math.random() * 0.4 - 0.2, // Simulated
      technicalSentiment,
      volumeSentiment,
      timestamp: new Date().toISOString()
    }
  }

  // Get recent market news
  async getMarketNews(symbol?: string, limit: number = 10): Promise<MarketNews[]> {
    // This would typically fetch from news APIs
    // For now, return mock news
    return this.generateMockNews(symbol, limit)
  }

  // Real-time data connections
  private async connectToBinance() {
    try {
      // Binance WebSocket connection for crypto data
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr')
      
      ws.onopen = () => {
        console.log('✅ Connected to Binance WebSocket')
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (Array.isArray(data)) {
            data.forEach(ticker => this.processBinanceTicker(ticker))
          }
        } catch (error) {
          console.error('Error processing Binance data:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('Binance WebSocket disconnected')
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.connectToBinance(), 5000)
      }
      
      this.wsConnections.set('binance', ws)
      
    } catch (error) {
      console.error('Failed to connect to Binance:', error)
    }
  }

  private async connectToCoinbase() {
    try {
      // Coinbase Pro WebSocket connection
      const ws = new WebSocket('wss://ws-feed.pro.coinbase.com')
      
      ws.onopen = () => {
        console.log('✅ Connected to Coinbase WebSocket')
        
        // Subscribe to ticker data for major pairs
        const subscribeMessage = {
          type: 'subscribe',
          product_ids: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'],
          channels: ['ticker']
        }
        
        ws.send(JSON.stringify(subscribeMessage))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'ticker') {
            this.processCoinbaseTicker(data)
          }
        } catch (error) {
          console.error('Error processing Coinbase data:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('Coinbase WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('Coinbase WebSocket disconnected')
        setTimeout(() => this.connectToCoinbase(), 5000)
      }
      
      this.wsConnections.set('coinbase', ws)
      
    } catch (error) {
      console.error('Failed to connect to Coinbase:', error)
    }
  }

  private processBinanceTicker(ticker: any) {
    const symbol = ticker.s?.replace('USDT', '/USD') || ticker.symbol
    
    if (!symbol || !this.subscribedSymbols.has(symbol)) return
    
    const marketData: MarketData = {
      symbol,
      price: parseFloat(ticker.c || ticker.price),
      volume: parseFloat(ticker.v || ticker.volume),
      change: parseFloat(ticker.P || ticker.priceChange),
      changePercent: parseFloat(ticker.p || ticker.priceChangePercent),
      bid: parseFloat(ticker.b || ticker.bidPrice),
      ask: parseFloat(ticker.a || ticker.askPrice),
      high24h: parseFloat(ticker.h || ticker.high),
      low24h: parseFloat(ticker.l || ticker.low),
      timestamp: new Date().toISOString(),
      source: 'binance'
    }
    
    this.updateMarketData(marketData)
  }

  private processCoinbaseTicker(ticker: any) {
    const symbol = ticker.product_id?.replace('-', '/') || ticker.symbol
    
    if (!symbol || !this.subscribedSymbols.has(symbol)) return
    
    const price = parseFloat(ticker.price)
    const volume = parseFloat(ticker.volume_24h)
    
    const marketData: MarketData = {
      symbol,
      price,
      volume,
      change: 0, // Would need to calculate from previous price
      changePercent: 0,
      bid: parseFloat(ticker.best_bid),
      ask: parseFloat(ticker.best_ask),
      high24h: parseFloat(ticker.high_24h),
      low24h: parseFloat(ticker.low_24h),
      timestamp: new Date().toISOString(),
      source: 'coinbase'
    }
    
    this.updateMarketData(marketData)
  }

  private updateMarketData(data: MarketData) {
    // Update cache
    this.dataCache.set(data.symbol, data)
    
    // Update price history
    const history = this.priceHistory.get(data.symbol) || []
    history.push(data.price)
    
    // Keep last 1000 prices
    if (history.length > 1000) {
      history.shift()
    }
    
    this.priceHistory.set(data.symbol, history)
    
    // Calculate technical indicators
    this.updateTechnicalIndicators(data.symbol, history)
    
    // Emit update event
    this.emit('marketUpdate', data)
    this.emit(`update:${data.symbol}`, data)
  }

  private updateTechnicalIndicators(symbol: string, prices: number[]) {
    if (prices.length < 50) return // Need enough data
    
    const current = prices[prices.length - 1]
    const volume = this.dataCache.get(symbol)?.volume || 0
    
    const indicators: TechnicalIndicators = {
      symbol,
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollinger: this.calculateBollinger(prices),
      ema: this.calculateEMAs(prices),
      volume: this.calculateVolumeIndicators(symbol),
      support: this.calculateSupport(prices),
      resistance: this.calculateResistance(prices),
      trend: this.calculateTrend(prices),
      volatility: this.calculateVolatility(prices),
      timestamp: new Date().toISOString()
    }
    
    this.indicatorCache.set(symbol, indicators)
    this.emit('indicatorsUpdate', indicators)
  }

  // Technical Analysis Calculations
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50
    
    let gains = 0
    let losses = 0
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    
    const avgGain = gains / period
    const avgLoss = losses / period
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    const macdLine = ema12 - ema26
    
    // Simplified signal line (would normally be EMA of MACD)
    const signal = macdLine * 0.9
    const histogram = macdLine - signal
    
    return {
      value: macdLine,
      signal,
      histogram
    }
  }

  private calculateBollinger(prices: number[], period: number = 20): {
    upper: number; middle: number; lower: number; position: number
  } {
    if (prices.length < period) {
      const current = prices[prices.length - 1]
      return { upper: current * 1.02, middle: current, lower: current * 0.98, position: 0.5 }
    }
    
    const recent = prices.slice(-period)
    const sma = recent.reduce((a, b) => a + b) / period
    
    const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    
    const upper = sma + (stdDev * 2)
    const lower = sma - (stdDev * 2)
    const current = prices[prices.length - 1]
    const position = (current - lower) / (upper - lower)
    
    return {
      upper,
      middle: sma,
      lower,
      position: Math.max(0, Math.min(1, position))
    }
  }

  private calculateEMAs(prices: number[]): {
    ema12: number; ema26: number; ema50: number; ema200: number
  } {
    return {
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      ema50: this.calculateEMA(prices, 50),
      ema200: this.calculateEMA(prices, 200)
    }
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    if (prices.length < period) return prices[prices.length - 1]
    
    const multiplier = 2 / (period + 1)
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  private calculateVolumeIndicators(symbol: string): {
    sma20: number; current: number; ratio: number
  } {
    const current = this.dataCache.get(symbol)?.volume || 0
    // Simplified - would track volume history
    const sma20 = current * (0.8 + Math.random() * 0.4)
    
    return {
      sma20,
      current,
      ratio: current / sma20
    }
  }

  private calculateSupport(prices: number[]): number {
    if (prices.length < 20) return prices[prices.length - 1] * 0.95
    
    const recent = prices.slice(-50)
    const lows = recent.filter((_, i) => {
      const prev = recent[i - 1] || Infinity
      const next = recent[i + 1] || Infinity
      return recent[i] <= prev && recent[i] <= next
    })
    
    return lows.length > 0 ? Math.max(...lows) : recent[recent.length - 1] * 0.95
  }

  private calculateResistance(prices: number[]): number {
    if (prices.length < 20) return prices[prices.length - 1] * 1.05
    
    const recent = prices.slice(-50)
    const highs = recent.filter((_, i) => {
      const prev = recent[i - 1] || 0
      const next = recent[i + 1] || 0
      return recent[i] >= prev && recent[i] >= next
    })
    
    return highs.length > 0 ? Math.min(...highs) : recent[recent.length - 1] * 1.05
  }

  private calculateTrend(prices: number[]): 'bullish' | 'bearish' | 'sideways' {
    if (prices.length < 10) return 'sideways'
    
    const recent = prices.slice(-10)
    const first = recent[0]
    const last = recent[recent.length - 1]
    const change = (last - first) / first
    
    if (change > 0.02) return 'bullish'
    if (change < -0.02) return 'bearish'
    return 'sideways'
  }

  private calculateVolatility(prices: number[], period: number = 20): number {
    if (prices.length < period) return 0.02
    
    const recent = prices.slice(-period)
    const returns = recent.slice(1).map((price, i) => Math.log(price / recent[i]))
    
    const mean = returns.reduce((a, b) => a + b) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance * 252) // Annualized volatility
  }

  // Sentiment calculations
  private calculateTechnicalSentiment(indicators: TechnicalIndicators): number {
    let sentiment = 0
    let factors = 0
    
    // RSI sentiment
    if (indicators.rsi < 30) sentiment += 1 // Oversold = bullish
    else if (indicators.rsi > 70) sentiment -= 1 // Overbought = bearish
    else sentiment += (50 - indicators.rsi) / 50 // Neutral zone
    factors++
    
    // MACD sentiment
    if (indicators.macd.histogram > 0) sentiment += 0.5
    else sentiment -= 0.5
    factors++
    
    // Bollinger sentiment
    if (indicators.bollinger.position < 0.2) sentiment += 0.5 // Near lower band
    else if (indicators.bollinger.position > 0.8) sentiment -= 0.5 // Near upper band
    factors++
    
    // Trend sentiment
    if (indicators.trend === 'bullish') sentiment += 1
    else if (indicators.trend === 'bearish') sentiment -= 1
    factors++
    
    return sentiment / factors
  }

  private calculateVolumeSentiment(data: MarketData, indicators: TechnicalIndicators): number {
    const volumeRatio = indicators.volume.ratio
    
    if (volumeRatio > 1.5) return 0.5 // High volume = strong movement
    if (volumeRatio < 0.5) return -0.2 // Low volume = weak movement
    return 0
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 10) return 0
    
    const recent = prices.slice(-10)
    const older = prices.slice(-20, -10)
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length
    const olderAvg = older.reduce((a, b) => a + b) / older.length
    
    return (recentAvg - olderAvg) / olderAvg
  }

  // Mock data providers
  private startMockDataProvider() {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'AAPL', 'GOOGL', 'TSLA', 'MSFT']
    
    // Initialize mock data
    symbols.forEach(symbol => {
      this.subscribe(symbol)
      this.generateMockData(symbol)
    })
    
    // DISABLED: Aggressive mock data updates causing performance issues
    // this.updateInterval = setInterval(() => {
    //   this.subscribedSymbols.forEach(symbol => {
    //     this.generateMockData(symbol)
    //   })
    // }, 5000)
    
    // Generate initial mock data only
    this.subscribedSymbols.forEach(symbol => {
      this.generateMockData(symbol)
    })
    
    console.log('Real market data aggressive polling DISABLED to improve performance')
  }

  private generateMockData(symbol: string) {
    const basePrice = this.getBasePriceForSymbol(symbol)
    const volatility = 0.02 // 2% volatility
    
    const price = basePrice * (1 + (Math.random() - 0.5) * volatility)
    const volume = 1000000 + Math.random() * 5000000
    const change = (Math.random() - 0.5) * basePrice * 0.05
    
    const mockData: MarketData = {
      symbol,
      price,
      volume,
      change,
      changePercent: (change / basePrice) * 100,
      bid: price * 0.999,
      ask: price * 1.001,
      high24h: price * 1.02,
      low24h: price * 0.98,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
    
    this.updateMarketData(mockData)
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC/USD': 45000,
      'ETH/USD': 2800,
      'SOL/USD': 110,
      'ADA/USD': 0.45,
      'AAPL': 175,
      'GOOGL': 140,
      'TSLA': 220,
      'MSFT': 380
    }
    
    return basePrices[symbol] || 100
  }

  private generateMockSentiment(symbol: string): MarketSentiment {
    const overall = (Math.random() - 0.5) * 2 // -1 to 1
    
    return {
      symbol,
      overall,
      fearGreedIndex: 50 + overall * 25,
      socialSentiment: overall * 0.8,
      newsImpact: (Math.random() - 0.5) * 0.4,
      technicalSentiment: overall,
      volumeSentiment: (Math.random() - 0.5) * 0.3,
      timestamp: new Date().toISOString()
    }
  }

  private generateMockNews(symbol?: string, limit: number = 10): MarketNews[] {
    const headlines = [
      'Bitcoin reaches new all-time high amid institutional adoption',
      'Ethereum 2.0 upgrade shows promising scalability improvements',
      'Major tech stocks rally on strong earnings reports',
      'Federal Reserve maintains interest rates, markets respond positively',
      'Cryptocurrency regulations provide clarity for institutional investors',
      'AI technology drives innovation in blockchain and DeFi protocols',
      'Green energy investments surge in renewable technology sector',
      'Global markets stabilize after recent geopolitical tensions',
      'Digital assets gain mainstream acceptance in payment systems',
      'Institutional investors increase allocation to alternative assets'
    ]
    
    return Array.from({ length: limit }, (_, i) => ({
      id: `news_${Date.now()}_${i}`,
      headline: headlines[i % headlines.length],
      summary: `Market analysis suggests ${headlines[i % headlines.length].toLowerCase()}.`,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
      impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      symbols: symbol ? [symbol] : ['BTC/USD', 'ETH/USD'],
      source: 'Market News Wire',
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }))
  }

  private subscribeToRealSources(symbol: string) {
    // Subscribe to real data sources if available
    // Implementation would depend on specific API requirements
  }

  // Cleanup
  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    this.wsConnections.forEach((ws, source) => {
      ws.close()
      console.log(`Disconnected from ${source}`)
    })
    
    this.wsConnections.clear()
    this.isConnected = false
    this.emit('disconnected')
  }

  // Health check
  getConnectionStatus(): { connected: boolean; sources: string[]; subscribedSymbols: string[] } {
    return {
      connected: this.isConnected,
      sources: Array.from(this.wsConnections.keys()),
      subscribedSymbols: Array.from(this.subscribedSymbols)
    }
  }
}

// Lazy initialization
let realMarketDataServiceInstance: RealMarketDataService | null = null

export function getRealMarketDataService(): RealMarketDataService {
  if (!realMarketDataServiceInstance) {
    realMarketDataServiceInstance = new RealMarketDataService()
  }
  return realMarketDataServiceInstance
}

// For backward compatibility
export const realMarketDataService = {
  get instance() {
    return getRealMarketDataService()
  }
}

// Export types
export type { MarketData, TechnicalIndicators, MarketNews, MarketSentiment }