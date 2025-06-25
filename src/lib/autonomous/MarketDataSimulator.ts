/**
 * Market Data Simulator
 * Generates realistic market data for paper trading and autonomous agents
 */

import { EventEmitter } from 'events'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'

export interface SimulatedMarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  timestamp: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  vwap: number
}

export interface MarketSimulationConfig {
  symbols: string[]
  updateInterval: number // milliseconds
  volatilityMultiplier: number
  trendBias: number // -1 to 1 (bearish to bullish)
  enableNews: boolean
  enableVolatilitySpikes: boolean
}

class MarketDataSimulator extends EventEmitter {
  private config: MarketSimulationConfig
  private marketData: Map<string, SimulatedMarketData> = new Map()
  private priceHistory: Map<string, number[]> = new Map()
  private isRunning = false
  private updateInterval: NodeJS.Timeout | null = null
  private newsEvents: string[] = []
  
  // Base prices for major crypto pairs (USD)
  private basePrices: Record<string, number> = {
    'BTC/USD': 65000,
    'ETH/USD': 3500,
    'SOL/USD': 180,
    'ADA/USD': 0.65,
    'MATIC/USD': 1.25,
    'AVAX/USD': 45,
    'DOT/USD': 8.5,
    'LINK/USD': 18,
    'UNI/USD': 12,
    'AAVE/USD': 320
  }

  constructor(config?: Partial<MarketSimulationConfig>) {
    super()
    
    this.config = {
      symbols: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'MATIC/USD'],
      updateInterval: 5000, // 5 seconds
      volatilityMultiplier: 1.0,
      trendBias: 0,
      enableNews: true,
      enableVolatilitySpikes: true,
      ...config
    }

    this.initializeMarketData()
  }

  private initializeMarketData(): void {
    for (const symbol of this.config.symbols) {
      const basePrice = this.basePrices[symbol] || 100
      const spread = basePrice * 0.001 // 0.1% spread
      
      const marketData: SimulatedMarketData = {
        symbol,
        price: basePrice,
        bid: basePrice - spread / 2,
        ask: basePrice + spread / 2,
        volume: this.generateRandomVolume(),
        timestamp: Date.now(),
        change24h: 0,
        changePercent24h: 0,
        high24h: basePrice,
        low24h: basePrice,
        vwap: basePrice
      }

      this.marketData.set(symbol, marketData)
      this.priceHistory.set(symbol, [basePrice])
      
      // Update paper trading engine
      persistentTradingEngine.updateMarketData(symbol, marketData)
    }

    console.log(`📊 Initialized market data for ${this.config.symbols.length} symbols`)
  }

  start(): void {
    if (this.isRunning) return

    console.log('🚀 Starting Market Data Simulator')
    this.isRunning = true

    this.updateInterval = setInterval(() => {
      this.updateAllMarketData()
    }, this.config.updateInterval)

    // Generate periodic news events
    if (this.config.enableNews) {
      setInterval(() => {
        this.generateNewsEvent()
      }, 60000) // Every minute
    }

    this.emit('simulator:started')
  }

  stop(): void {
    if (!this.isRunning) return

    console.log('🛑 Stopping Market Data Simulator')
    this.isRunning = false

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.emit('simulator:stopped')
  }

  private updateAllMarketData(): void {
    const currentTime = Date.now()
    
    // Global market conditions
    const marketSentiment = this.calculateMarketSentiment()
    const volatilityMultiplier = this.calculateVolatilityMultiplier()
    
    for (const symbol of this.config.symbols) {
      this.updateSymbolPrice(symbol, marketSentiment, volatilityMultiplier, currentTime)
    }

    this.emit('market:data_updated', Array.from(this.marketData.values()))
  }

  private updateSymbolPrice(
    symbol: string, 
    marketSentiment: number, 
    volatilityMultiplier: number, 
    timestamp: number
  ): void {
    const current = this.marketData.get(symbol)!
    const history = this.priceHistory.get(symbol)!
    
    // Calculate price movement
    const baseVolatility = this.getSymbolVolatility(symbol) * volatilityMultiplier
    const trendComponent = this.config.trendBias * 0.001
    const sentimentComponent = marketSentiment * 0.0005
    const randomComponent = (Math.random() - 0.5) * baseVolatility
    
    // Mean reversion component (prevents prices from trending too far)
    const meanReversionComponent = this.calculateMeanReversion(symbol, history) * 0.0002
    
    const totalPriceChange = (trendComponent + sentimentComponent + randomComponent + meanReversionComponent) * current.price
    const newPrice = Math.max(current.price + totalPriceChange, 0.01) // Prevent negative prices
    
    // Update price history
    history.push(newPrice)
    if (history.length > 1440) { // Keep last 24 hours (assuming 1min updates)
      history.shift()
    }

    // Calculate 24h statistics
    const price24hAgo = history.length >= 1440 ? history[0] : history[0]
    const change24h = newPrice - price24hAgo
    const changePercent24h = (change24h / price24hAgo) * 100
    
    const recentPrices = history.slice(-288) // Last 4 hours
    const high24h = Math.max(...recentPrices)
    const low24h = Math.min(...recentPrices)
    const vwap = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length

    // Calculate spread based on volatility
    const spreadPercent = Math.max(0.001, baseVolatility * 0.5) // Min 0.1% spread
    const spread = newPrice * spreadPercent

    // Generate volume based on price movement and time of day
    const volume = this.generateVolume(symbol, Math.abs(changePercent24h))

    const updatedData: SimulatedMarketData = {
      symbol,
      price: newPrice,
      bid: newPrice - spread / 2,
      ask: newPrice + spread / 2,
      volume,
      timestamp,
      change24h,
      changePercent24h,
      high24h,
      low24h,
      vwap
    }

    this.marketData.set(symbol, updatedData)
    
    // Update paper trading engine
    persistentTradingEngine.updateMarketData(symbol, updatedData)

    // Emit significant price movements
    if (Math.abs(changePercent24h) > 5) {
      this.emit('market:significant_movement', {
        symbol,
        changePercent: changePercent24h,
        price: newPrice
      })
    }
  }

  private getSymbolVolatility(symbol: string): number {
    // Different volatilities for different assets
    const volatilities: Record<string, number> = {
      'BTC/USD': 0.02,   // 2% base volatility
      'ETH/USD': 0.025,  // 2.5%
      'SOL/USD': 0.04,   // 4%
      'ADA/USD': 0.035,  // 3.5%
      'MATIC/USD': 0.045, // 4.5%
      'AVAX/USD': 0.04,  // 4%
      'DOT/USD': 0.035,  // 3.5%
      'LINK/USD': 0.03,  // 3%
      'UNI/USD': 0.035,  // 3.5%
      'AAVE/USD': 0.04   // 4%
    }

    return (volatilities[symbol] || 0.03) * this.config.volatilityMultiplier
  }

  private calculateMarketSentiment(): number {
    // Simulate market sentiment cycles
    const time = Date.now()
    const hourOfDay = new Date(time).getHours()
    
    // Higher activity during trading hours (US market overlap)
    const timeFactor = hourOfDay >= 9 && hourOfDay <= 16 ? 1.2 : 0.8
    
    // Random sentiment with some persistence
    const randomSentiment = (Math.random() - 0.5) * 2
    const persistentSentiment = this.config.trendBias
    
    return (randomSentiment * 0.3 + persistentSentiment * 0.7) * timeFactor
  }

  private calculateVolatilityMultiplier(): number {
    let multiplier = 1.0

    // Time-based volatility (higher during market hours)
    const hour = new Date().getHours()
    if (hour >= 9 && hour <= 16) {
      multiplier *= 1.3 // Higher volatility during US market hours
    } else if (hour >= 22 || hour <= 2) {
      multiplier *= 1.1 // Moderate volatility during Asian hours
    }

    // Random volatility spikes
    if (this.config.enableVolatilitySpikes && Math.random() < 0.01) {
      multiplier *= 2.0 + Math.random() * 3.0 // 2-5x volatility spike
      console.log('⚡ Volatility spike detected!')
      this.emit('market:volatility_spike', { multiplier })
    }

    return multiplier
  }

  private calculateMeanReversion(symbol: string, history: number[]): number {
    if (history.length < 20) return 0

    const recent20 = history.slice(-20)
    const currentPrice = recent20[recent20.length - 1]
    const average20 = recent20.reduce((sum, price) => sum + price, 0) / recent20.length
    
    // Return value that pushes price back toward mean
    return (average20 - currentPrice) / average20
  }

  private generateRandomVolume(): number {
    // Generate realistic volume (thousands to millions)
    return Math.random() * 1000000 + 100000
  }

  private generateVolume(symbol: string, volatilityPercent: number): number {
    const baseVolume = this.generateRandomVolume()
    
    // Higher volume during high volatility
    const volatilityMultiplier = 1 + (volatilityPercent / 100) * 5
    
    // Time-based volume (higher during market hours)
    const hour = new Date().getHours()
    const timeMultiplier = hour >= 9 && hour <= 16 ? 1.5 : 0.7
    
    return baseVolume * volatilityMultiplier * timeMultiplier
  }

  private generateNewsEvent(): void {
    const newsTemplates = [
      'Major institutional investor announces {symbol} allocation',
      'Regulatory approval boosts {symbol} sentiment',
      'Technical analysis suggests {symbol} breakout incoming',
      'Whale movement detected in {symbol}',
      'DeFi protocol integration announced for {symbol}',
      'Market makers increase {symbol} liquidity',
      'Options flow indicates bullish sentiment for {symbol}',
      'Cross-chain bridge supports {symbol}',
      'Staking rewards increased for {symbol}',
      'Layer 2 scaling solution adopts {symbol}'
    ]

    const bearishTemplates = [
      'Security concerns raised about {symbol}',
      'Large holder sells significant {symbol} position',
      'Technical indicators show {symbol} weakness',
      'Regulatory uncertainty affects {symbol}',
      'Market correction impacts {symbol}',
      'Profit-taking pressure on {symbol}',
      'Liquidity concerns for {symbol}',
      'Network congestion affects {symbol}',
      'Competitor gains market share from {symbol}',
      'Macroeconomic factors pressure {symbol}'
    ]

    const isBullish = Math.random() > 0.5
    const templates = isBullish ? newsTemplates : bearishTemplates
    const template = templates[Math.floor(Math.random() * templates.length)]
    const symbol = this.config.symbols[Math.floor(Math.random() * this.config.symbols.length)]
    
    const newsEvent = template.replace('{symbol}', symbol.split('/')[0])
    this.newsEvents.unshift(newsEvent)
    
    // Keep only last 50 news events
    if (this.newsEvents.length > 50) {
      this.newsEvents = this.newsEvents.slice(0, 50)
    }

    // Apply news impact to price
    this.applyNewsImpact(symbol, isBullish ? 0.02 : -0.02)

    this.emit('market:news_event', {
      event: newsEvent,
      symbol,
      sentiment: isBullish ? 'bullish' : 'bearish',
      timestamp: Date.now()
    })

    console.log(`📰 News: ${newsEvent}`)
  }

  private applyNewsImpact(symbol: string, impactPercent: number): void {
    const current = this.marketData.get(symbol)
    if (!current) return

    const priceImpact = current.price * impactPercent
    const newPrice = current.price + priceImpact

    // Apply impact gradually over several updates
    const steps = 5
    const stepImpact = priceImpact / steps
    
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        const currentData = this.marketData.get(symbol)
        if (currentData) {
          const updatedPrice = currentData.price + stepImpact
          this.marketData.set(symbol, {
            ...currentData,
            price: updatedPrice,
            timestamp: Date.now()
          })
          
          persistentTradingEngine.updateMarketData(symbol, {
            ...currentData,
            price: updatedPrice,
            timestamp: Date.now()
          })
        }
      }, i * 2000) // 2-second intervals
    }
  }

  // Public API methods
  getMarketData(symbol?: string): SimulatedMarketData | SimulatedMarketData[] {
    if (symbol) {
      return this.marketData.get(symbol) || null
    }
    return Array.from(this.marketData.values())
  }

  getPriceHistory(symbol: string, length?: number): number[] {
    const history = this.priceHistory.get(symbol) || []
    return length ? history.slice(-length) : [...history]
  }

  getNewsEvents(count: number = 10): string[] {
    return this.newsEvents.slice(0, count)
  }

  setConfig(newConfig: Partial<MarketSimulationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart if running
    if (this.isRunning) {
      this.stop()
      setTimeout(() => this.start(), 1000)
    }
  }

  addSymbol(symbol: string, basePrice?: number): void {
    if (!this.config.symbols.includes(symbol)) {
      this.config.symbols.push(symbol)
      
      if (basePrice) {
        this.basePrices[symbol] = basePrice
      }
      
      // Initialize if running
      if (this.isRunning) {
        const price = this.basePrices[symbol] || 100
        const spread = price * 0.001
        
        const marketData: SimulatedMarketData = {
          symbol,
          price,
          bid: price - spread / 2,
          ask: price + spread / 2,
          volume: this.generateRandomVolume(),
          timestamp: Date.now(),
          change24h: 0,
          changePercent24h: 0,
          high24h: price,
          low24h: price,
          vwap: price
        }

        this.marketData.set(symbol, marketData)
        this.priceHistory.set(symbol, [price])
        
        persistentTradingEngine.updateMarketData(symbol, marketData)
        
        this.emit('symbol:added', { symbol, price })
      }
    }
  }

  removeSymbol(symbol: string): void {
    const index = this.config.symbols.indexOf(symbol)
    if (index > -1) {
      this.config.symbols.splice(index, 1)
      this.marketData.delete(symbol)
      this.priceHistory.delete(symbol)
      
      this.emit('symbol:removed', { symbol })
    }
  }

  // Simulation controls
  triggerMarketCrash(severity: number = 0.2): void {
    console.log(`💥 Triggering market crash with ${severity * 100}% severity`)
    
    for (const symbol of this.config.symbols) {
      this.applyNewsImpact(symbol, -severity)
    }
    
    this.emit('market:crash', { severity })
  }

  triggerMarketRally(strength: number = 0.15): void {
    console.log(`🚀 Triggering market rally with ${strength * 100}% strength`)
    
    for (const symbol of this.config.symbols) {
      this.applyNewsImpact(symbol, strength)
    }
    
    this.emit('market:rally', { strength })
  }

  isSimulatorRunning(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
export const marketDataSimulator = new MarketDataSimulator()
export default marketDataSimulator