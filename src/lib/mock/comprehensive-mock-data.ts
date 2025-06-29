'use client'

/**
 * Comprehensive Mock Data System
 * Provides realistic mock data for complete paper trading experience
 */

// Expanded Market Data Mock with more realistic variety
export const MOCK_SYMBOLS = [
  // Major Cryptocurrencies
  'BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD', 'XRP/USD',
  // DeFi Tokens
  'SOL/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD', 'UNI/USD',
  'AAVE/USD', 'CRV/USD', 'MKR/USD', 'COMP/USD', 'SNX/USD',
  // Layer 2 & Scaling
  'ARB/USD', 'OP/USD', 'STRK/USD', 'IMX/USD', 'LRC/USD',
  // Gaming & Metaverse
  'SAND/USD', 'MANA/USD', 'AXS/USD', 'ENJ/USD', 'GALA/USD',
  // AI & Innovation
  'FET/USD', 'AGIX/USD', 'OCEAN/USD', 'RNDR/USD', 'TAO/USD',
  // Meme & Community
  'DOGE/USD', 'SHIB/USD', 'PEPE/USD', 'FLOKI/USD', 'WIF/USD'
] as const

export type MockSymbol = typeof MOCK_SYMBOLS[number]

// Market categories for realistic pricing
export const SYMBOL_CATEGORIES = {
  'BTC/USD': { basePrice: 67000, volatility: 0.04, category: 'major' },
  'ETH/USD': { basePrice: 3400, volatility: 0.05, category: 'major' },
  'BNB/USD': { basePrice: 590, volatility: 0.06, category: 'major' },
  'ADA/USD': { basePrice: 0.48, volatility: 0.08, category: 'major' },
  'XRP/USD': { basePrice: 0.62, volatility: 0.07, category: 'major' },
  
  'SOL/USD': { basePrice: 140, volatility: 0.09, category: 'defi' },
  'AVAX/USD': { basePrice: 38, volatility: 0.10, category: 'defi' },
  'MATIC/USD': { basePrice: 0.89, volatility: 0.09, category: 'defi' },
  'LINK/USD': { basePrice: 14.5, volatility: 0.08, category: 'defi' },
  'UNI/USD': { basePrice: 8.2, volatility: 0.10, category: 'defi' },
  'AAVE/USD': { basePrice: 98, volatility: 0.11, category: 'defi' },
  'CRV/USD': { basePrice: 0.35, volatility: 0.12, category: 'defi' },
  'MKR/USD': { basePrice: 1450, volatility: 0.10, category: 'defi' },
  'COMP/USD': { basePrice: 52, volatility: 0.11, category: 'defi' },
  'SNX/USD': { basePrice: 2.4, volatility: 0.13, category: 'defi' },
  
  'ARB/USD': { basePrice: 0.92, volatility: 0.12, category: 'layer2' },
  'OP/USD': { basePrice: 2.1, volatility: 0.11, category: 'layer2' },
  'STRK/USD': { basePrice: 0.58, volatility: 0.15, category: 'layer2' },
  'IMX/USD': { basePrice: 1.35, volatility: 0.14, category: 'layer2' },
  'LRC/USD': { basePrice: 0.22, volatility: 0.13, category: 'layer2' },
  
  'SAND/USD': { basePrice: 0.45, volatility: 0.15, category: 'gaming' },
  'MANA/USD': { basePrice: 0.38, volatility: 0.14, category: 'gaming' },
  'AXS/USD': { basePrice: 6.8, volatility: 0.16, category: 'gaming' },
  'ENJ/USD': { basePrice: 0.28, volatility: 0.15, category: 'gaming' },
  'GALA/USD': { basePrice: 0.034, volatility: 0.18, category: 'gaming' },
  
  'FET/USD': { basePrice: 1.25, volatility: 0.16, category: 'ai' },
  'AGIX/USD': { basePrice: 0.42, volatility: 0.17, category: 'ai' },
  'OCEAN/USD': { basePrice: 0.58, volatility: 0.15, category: 'ai' },
  'RNDR/USD': { basePrice: 7.2, volatility: 0.14, category: 'ai' },
  'TAO/USD': { basePrice: 485, volatility: 0.13, category: 'ai' },
  
  'DOGE/USD': { basePrice: 0.085, volatility: 0.20, category: 'meme' },
  'SHIB/USD': { basePrice: 0.0000145, volatility: 0.25, category: 'meme' },
  'PEPE/USD': { basePrice: 0.00001240, volatility: 0.30, category: 'meme' },
  'FLOKI/USD': { basePrice: 0.000185, volatility: 0.28, category: 'meme' },
  'WIF/USD': { basePrice: 2.15, volatility: 0.35, category: 'meme' }
} as const

export interface MockPriceData {
  symbol: MockSymbol
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap: number
  high24h: number
  low24h: number
  lastUpdate: Date
  category: string
  rank: number
  circulatingSupply: number
}

export interface MockPortfolioPosition {
  symbol: MockSymbol
  quantity: number
  averagePrice: number
  currentPrice: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  marketValue: number
  lastUpdate: Date
}

export interface MockTrade {
  id: string
  symbol: MockSymbol
  side: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  status: 'filled' | 'partial' | 'pending' | 'cancelled'
  strategy?: string
  agentId?: string
}

export interface MockAgentPerformance {
  agentId: string
  name: string
  description: string
  strategy: string
  totalTrades: number
  winRate: number
  totalPnL: number
  totalPnLPercent: number
  sharpeRatio: number
  maxDrawdown: number
  avgTradeSize: number
  bestTrade: number
  worstTrade: number
  avgHoldTime: number // in hours
  profitFactor: number
  calmarRatio: number
  lastActive: Date
  status: 'active' | 'paused' | 'stopped'
  riskLevel: 'low' | 'medium' | 'high'
  allocation: number // portfolio allocation percentage
  monthlyReturn: number
  totalAssets: number
}

export interface MockAnalyticsData {
  totalPortfolioValue: number
  totalPnL: number
  totalPnLPercent: number
  dayPnL: number
  weekPnL: number
  monthPnL: number
  yearPnL: number
  winRate: number
  totalTrades: number
  activeTrades: number
  bestPerformer: string
  worstPerformer: string
  topGainers: MockSymbol[]
  topLosers: MockSymbol[]
  marketTrend: 'bullish' | 'bearish' | 'sideways'
  fearGreedIndex: number
  volatilityIndex: number
  liquidityIndex: number
}

export interface MockRiskMetrics {
  portfolioVaR: number // Value at Risk
  portfolioBeta: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  concentrationRisk: number
  liquidityRisk: number
  correlationRisk: number
  leverageRatio: number
  marginUtilization: number
  riskScore: number // 0-100
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
}

class ComprehensiveMockDataService {
  private priceData: Map<MockSymbol, MockPriceData> = new Map()
  private portfolio: MockPortfolioPosition[] = []
  private tradeHistory: MockTrade[] = []
  private agentPerformance: MockAgentPerformance[] = []
  private analyticsData: MockAnalyticsData | null = null
  private riskMetrics: MockRiskMetrics | null = null
  private priceUpdateInterval: NodeJS.Timeout | null = null
  private priceVariations: Map<MockSymbol, number> = new Map()

  constructor() {
    this.initializeMockData()
    this.startPriceUpdates()
  }

  private initializeMockData() {
    // Initialize realistic price data using SYMBOL_CATEGORIES
    MOCK_SYMBOLS.forEach((symbol, index) => {
      const categoryInfo = SYMBOL_CATEGORIES[symbol]
      const variation = (Math.random() - 0.5) * 0.1 // ±5% initial variation
      const currentPrice = categoryInfo.basePrice * (1 + variation)
      this.priceVariations.set(symbol, variation)
      
      // Calculate realistic volume based on market cap rank
      const volumeMultiplier = Math.max(0.1, 1 - (index * 0.02)) // Decreasing volume by rank
      const volume24h = currentPrice * 1000000 * volumeMultiplier * (0.5 + Math.random())
      
      // Calculate market cap (simplified)
      const supplyMultipliers: Record<string, number> = {
        'BTC/USD': 19700000, 'ETH/USD': 120000000, 'BNB/USD': 153000000,
        'ADA/USD': 35000000000, 'XRP/USD': 54000000000, 'SOL/USD': 460000000,
        'AVAX/USD': 410000000, 'MATIC/USD': 9300000000, 'LINK/USD': 600000000,
        'UNI/USD': 750000000
      }
      const supply = supplyMultipliers[symbol] || (1000000 * (1000 - index * 10))
      const marketCap = currentPrice * supply
      
      const changePercent = (Math.random() - 0.5) * categoryInfo.volatility * 200 // Daily change
      const change24h = currentPrice * changePercent / 100
      
      this.priceData.set(symbol, {
        symbol,
        price: currentPrice,
        change24h,
        changePercent24h: changePercent,
        volume24h,
        marketCap,
        high24h: currentPrice * (1 + Math.abs(changePercent) / 200),
        low24h: currentPrice * (1 - Math.abs(changePercent) / 200),
        lastUpdate: new Date(),
        category: categoryInfo.category,
        rank: index + 1,
        circulatingSupply: supply
      })
    })

    // Initialize comprehensive agent data
    this.agentPerformance = [
      {
        agentId: 'agent_momentum_01',
        name: 'Marcus Momentum',
        description: 'AI momentum trader specializing in trend following and breakout strategies',
        strategy: 'Momentum & Trend Following',
        totalTrades: 2847,
        winRate: 0.68,
        totalPnL: 892450,
        totalPnLPercent: 89.2,
        sharpeRatio: 2.34,
        maxDrawdown: 0.15,
        avgTradeSize: 25000,
        bestTrade: 45000,
        worstTrade: -12000,
        avgHoldTime: 6.5,
        profitFactor: 2.1,
        calmarRatio: 1.8,
        lastActive: new Date(),
        status: 'active',
        riskLevel: 'medium',
        allocation: 35,
        monthlyReturn: 12.4,
        totalAssets: 1892450
      },
      {
        agentId: 'agent_arbitrage_01',
        name: 'Alex Arbitrage',
        description: 'Cross-exchange arbitrage specialist with microsecond execution',
        strategy: 'Statistical Arbitrage',
        totalTrades: 15634,
        winRate: 0.78,
        totalPnL: 654321,
        totalPnLPercent: 65.4,
        sharpeRatio: 3.12,
        maxDrawdown: 0.08,
        avgTradeSize: 15000,
        bestTrade: 18500,
        worstTrade: -5500,
        avgHoldTime: 0.5,
        profitFactor: 2.8,
        calmarRatio: 2.9,
        lastActive: new Date(Date.now() - 5000),
        status: 'active',
        riskLevel: 'low',
        allocation: 25,
        monthlyReturn: 8.9,
        totalAssets: 1154321
      },
      {
        agentId: 'agent_meanrev_01',
        name: 'Sophia Reversion',
        description: 'Mean reversion specialist focusing on oversold/overbought conditions',
        strategy: 'Mean Reversion & RSI',
        totalTrades: 1923,
        winRate: 0.72,
        totalPnL: 423890,
        totalPnLPercent: 42.4,
        sharpeRatio: 1.95,
        maxDrawdown: 0.12,
        avgTradeSize: 35000,
        bestTrade: 52000,
        worstTrade: -18000,
        avgHoldTime: 18.2,
        profitFactor: 1.9,
        calmarRatio: 1.6,
        lastActive: new Date(Date.now() - 30000),
        status: 'active',
        riskLevel: 'medium',
        allocation: 20,
        monthlyReturn: 6.8,
        totalAssets: 923890
      },
      {
        agentId: 'agent_grid_01',
        name: 'Riley Grid Bot',
        description: 'Grid trading specialist for range-bound markets and DCA strategies',
        strategy: 'Grid Trading & DCA',
        totalTrades: 8956,
        winRate: 0.65,
        totalPnL: 234567,
        totalPnLPercent: 23.5,
        sharpeRatio: 1.45,
        maxDrawdown: 0.18,
        avgTradeSize: 8000,
        bestTrade: 12000,
        worstTrade: -8500,
        avgHoldTime: 72.0,
        profitFactor: 1.4,
        calmarRatio: 1.2,
        lastActive: new Date(Date.now() - 120000),
        status: 'paused',
        riskLevel: 'high',
        allocation: 15,
        monthlyReturn: 4.2,
        totalAssets: 734567
      },
      {
        agentId: 'agent_scalp_01',
        name: 'Nova Scalper',
        description: 'High-frequency scalping bot with sub-second execution',
        strategy: 'Scalping & Market Making',
        totalTrades: 45623,
        winRate: 0.58,
        totalPnL: 156789,
        totalPnLPercent: 15.7,
        sharpeRatio: 1.28,
        maxDrawdown: 0.22,
        avgTradeSize: 5000,
        bestTrade: 3500,
        worstTrade: -2800,
        avgHoldTime: 0.08,
        profitFactor: 1.3,
        calmarRatio: 0.9,
        lastActive: new Date(Date.now() - 2000),
        status: 'active',
        riskLevel: 'high',
        allocation: 5,
        monthlyReturn: 3.1,
        totalAssets: 656789
      }
    ]

    // Initialize comprehensive portfolio with realistic positions
    this.portfolio = [
      {
        symbol: 'BTC/USD',
        quantity: 15.5,
        averagePrice: 64200,
        currentPrice: this.priceData.get('BTC/USD')?.price || 67000,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'ETH/USD',
        quantity: 125.8,
        averagePrice: 3280,
        currentPrice: this.priceData.get('ETH/USD')?.price || 3400,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'SOL/USD',
        quantity: 892.3,
        averagePrice: 135,
        currentPrice: this.priceData.get('SOL/USD')?.price || 140,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'LINK/USD',
        quantity: 2850,
        averagePrice: 13.8,
        currentPrice: this.priceData.get('LINK/USD')?.price || 14.5,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'UNI/USD',
        quantity: 4200,
        averagePrice: 7.9,
        currentPrice: this.priceData.get('UNI/USD')?.price || 8.2,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      }
    ]

    // Calculate portfolio values
    this.updatePortfolioValues()

    // Generate realistic trade history
    this.generateTradeHistory()

    // Initialize analytics data
    this.updateAnalyticsData()

    // Initialize risk metrics
    this.updateRiskMetrics()
  }

  private generateTradeHistory() {
    const strategies = ['Momentum', 'Arbitrage', 'Mean Reversion', 'Grid Trading', 'Scalping']
    const agentIds = this.agentPerformance.map(a => a.agentId)
    
    // Generate last 100 trades
    for (let i = 0; i < 100; i++) {
      const symbol = MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)]
      const price = this.priceData.get(symbol)?.price || 100
      const priceVariation = (Math.random() - 0.5) * 0.1 // ±5% from current price
      const tradePrice = price * (1 + priceVariation)
      
      this.tradeHistory.push({
        id: `trade_${Date.now()}_${i}`,
        symbol,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.random() * 10 + 0.1,
        price: tradePrice,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        status: 'filled',
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        agentId: agentIds[Math.floor(Math.random() * agentIds.length)]
      })
    }

    // Sort by timestamp (newest first)
    this.tradeHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private updatePortfolioValues() {
    this.portfolio.forEach(position => {
      const currentPrice = this.priceData.get(position.symbol)?.price || position.averagePrice
      position.currentPrice = currentPrice
      position.marketValue = position.quantity * currentPrice
      position.unrealizedPnL = position.marketValue - (position.quantity * position.averagePrice)
      position.unrealizedPnLPercent = (position.unrealizedPnL / (position.quantity * position.averagePrice)) * 100
      position.lastUpdate = new Date()
    })
  }

  private updateAnalyticsData() {
    const totalValue = this.portfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
    const totalInvested = this.portfolio.reduce((sum, pos) => sum + (pos.quantity * pos.averagePrice), 0)
    const totalPnL = totalValue - totalInvested
    const totalPnLPercent = (totalPnL / totalInvested) * 100

    // Calculate performance metrics
    const priceChanges = Array.from(this.priceData.values()).map(p => p.changePercent24h)
    const positiveChanges = priceChanges.filter(c => c > 0).length
    const totalChanges = priceChanges.length
    
    // Sort by performance for top gainers/losers
    const sortedByChange = Array.from(this.priceData.values()).sort((a, b) => b.changePercent24h - a.changePercent24h)
    
    this.analyticsData = {
      totalPortfolioValue: totalValue,
      totalPnL,
      totalPnLPercent,
      dayPnL: totalPnL * 0.1, // Simulate daily P&L
      weekPnL: totalPnL * 0.7,
      monthPnL: totalPnL,
      yearPnL: totalPnL * 12,
      winRate: positiveChanges / totalChanges,
      totalTrades: this.tradeHistory.length,
      activeTrades: Math.floor(Math.random() * 5) + 1,
      bestPerformer: sortedByChange[0]?.symbol || 'BTC/USD',
      worstPerformer: sortedByChange[sortedByChange.length - 1]?.symbol || 'ETH/USD',
      topGainers: sortedByChange.slice(0, 5).map(p => p.symbol) as MockSymbol[],
      topLosers: sortedByChange.slice(-5).map(p => p.symbol) as MockSymbol[],
      marketTrend: positiveChanges > totalChanges * 0.6 ? 'bullish' : 
                   positiveChanges < totalChanges * 0.4 ? 'bearish' : 'sideways',
      fearGreedIndex: 25 + Math.random() * 50, // 25-75 range
      volatilityIndex: Math.random() * 100,
      liquidityIndex: 60 + Math.random() * 30 // 60-90 range
    }
  }

  private updateRiskMetrics() {
    const portfolioValue = this.portfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
    const positions = this.portfolio.length
    const maxPosition = Math.max(...this.portfolio.map(p => p.marketValue))
    const concentrationRisk = maxPosition / portfolioValue
    
    // Calculate portfolio beta (simplified)
    const avgVolatility = Array.from(this.priceData.values())
      .reduce((sum, p) => sum + Math.abs(p.changePercent24h), 0) / this.priceData.size
    
    this.riskMetrics = {
      portfolioVaR: portfolioValue * 0.05, // 5% VaR
      portfolioBeta: 0.8 + Math.random() * 0.4, // 0.8 - 1.2
      sharpeRatio: 1.5 + Math.random() * 1.0, // 1.5 - 2.5
      sortinoRatio: 1.8 + Math.random() * 1.2, // 1.8 - 3.0
      maxDrawdown: 0.05 + Math.random() * 0.15, // 5-20%
      concentrationRisk,
      liquidityRisk: Math.random() * 0.3, // 0-30%
      correlationRisk: Math.random() * 0.5, // 0-50%
      leverageRatio: 1.0 + Math.random() * 0.5, // 1.0 - 1.5x
      marginUtilization: Math.random() * 0.3, // 0-30%
      riskScore: Math.floor(20 + avgVolatility * 2), // 20-100
      riskLevel: avgVolatility < 5 ? 'very_low' :
                 avgVolatility < 10 ? 'low' :
                 avgVolatility < 15 ? 'medium' :
                 avgVolatility < 20 ? 'high' : 'very_high'
    }
  }

  // Enhanced real-time price updates
  private startPriceUpdates() {
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices()
      this.updatePortfolioValues()
      this.updateAnalyticsData()
      this.updateRiskMetrics()
    }, 2000) // Update every 2 seconds
  }

  private updatePrices() {
    MOCK_SYMBOLS.forEach(symbol => {
      const priceData = this.priceData.get(symbol)
      if (!priceData) return

      const categoryInfo = SYMBOL_CATEGORIES[symbol]
      const volatility = categoryInfo.volatility
      
      // Generate realistic price movement
      const randomWalk = (Math.random() - 0.5) * volatility * 0.01 // Small random walk
      const newPrice = priceData.price * (1 + randomWalk)
      
      // Calculate new 24h change
      const change24h = newPrice - categoryInfo.basePrice
      const changePercent24h = (change24h / categoryInfo.basePrice) * 100
      
      // Update high/low if needed
      const high24h = Math.max(priceData.high24h, newPrice)
      const low24h = Math.min(priceData.low24h, newPrice)
      
      // Simulate volume fluctuation
      const volumeChange = (Math.random() - 0.5) * 0.1 // ±10% volume change
      const volume24h = priceData.volume24h * (1 + volumeChange)

      this.priceData.set(symbol, {
        ...priceData,
        price: newPrice,
        change24h,
        changePercent24h,
        volume24h,
        high24h,
        low24h,
        lastUpdate: new Date()
      })
    })
  }

  // Public API methods
  getPriceData(symbol?: MockSymbol): MockPriceData[] {
    if (symbol) {
      const data = this.priceData.get(symbol)
      return data ? [data] : []
    }
    return Array.from(this.priceData.values())
  }

  getPortfolio(): MockPortfolioPosition[] {
    return [...this.portfolio]
  }

  getTradeHistory(limit = 20): MockTrade[] {
    return this.tradeHistory.slice(0, limit)
  }

  getAgentPerformance(): MockAgentPerformance[] {
    return [...this.agentPerformance]
  }

  getAnalyticsData(): MockAnalyticsData | null {
    return this.analyticsData
  }

  getRiskMetrics(): MockRiskMetrics | null {
    return this.riskMetrics
  }

  // Enhanced summary methods
  getPortfolioSummary() {
    const totalValue = this.portfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
    const totalInvested = this.portfolio.reduce((sum, pos) => sum + (pos.quantity * pos.averagePrice), 0)
    const totalPnL = this.portfolio.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      positionsCount: this.portfolio.length,
      cash: 100000 - totalInvested // Assume $100k starting capital
    }
  }

  getMarketSummary() {
    const prices = Array.from(this.priceData.values())
    const gainers = prices.filter(p => p.changePercent24h > 0).length
    const losers = prices.filter(p => p.changePercent24h < 0).length
    const neutral = prices.length - gainers - losers

    const avgChange = prices.reduce((sum, p) => sum + p.changePercent24h, 0) / prices.length
    const totalVolume = prices.reduce((sum, p) => sum + p.volume24h, 0)
    const totalMarketCap = prices.reduce((sum, p) => sum + p.marketCap, 0)

    return {
      gainers,
      losers,
      neutral,
      avgChange,
      totalVolume,
      totalMarketCap,
      marketTrend: gainers > losers ? 'bullish' : losers > gainers ? 'bearish' : 'neutral'
    }
  }

  // Trading simulation methods
  simulateTrade(symbol: MockSymbol, side: 'buy' | 'sell', quantity: number, limitPrice?: number): MockTrade {
    const currentPrice = this.priceData.get(symbol)?.price || 1000
    const slippage = 0.001 // 0.1% slippage
    const executionPrice = limitPrice || (side === 'buy' 
      ? currentPrice * (1 + slippage)
      : currentPrice * (1 - slippage))

    const trade: MockTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side,
      quantity,
      price: executionPrice,
      timestamp: new Date(),
      status: 'filled',
      strategy: 'Manual',
      agentId: 'user'
    }

    // Add to trade history
    this.tradeHistory.unshift(trade)
    this.tradeHistory = this.tradeHistory.slice(0, 200) // Keep last 200 trades

    // Update portfolio
    const existingPosition = this.portfolio.find(p => p.symbol === symbol)
    if (existingPosition) {
      if (side === 'buy') {
        const totalValue = existingPosition.averagePrice * existingPosition.quantity + executionPrice * quantity
        const totalQuantity = existingPosition.quantity + quantity
        existingPosition.averagePrice = totalValue / totalQuantity
        existingPosition.quantity = totalQuantity
      } else {
        existingPosition.quantity = Math.max(0, existingPosition.quantity - quantity)
      }
    } else if (side === 'buy') {
      // Create new position
      this.portfolio.push({
        symbol,
        quantity,
        averagePrice: executionPrice,
        currentPrice: this.priceData.get(symbol)?.price || executionPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      })
    }

    // Recalculate portfolio values
    this.updatePortfolioValues()
    this.updateAnalyticsData()

    return trade
  }

  // Cleanup method
  cleanup() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = null
    }
  }
}

// Singleton instance
let mockDataService: ComprehensiveMockDataService | null = null

export function getMockDataService(): ComprehensiveMockDataService {
  if (!mockDataService) {
    mockDataService = new ComprehensiveMockDataService()
  }
  return mockDataService
}

export default ComprehensiveMockDataService
