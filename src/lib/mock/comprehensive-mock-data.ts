'use client'

/**
 * Comprehensive Mock Data System
 * Provides realistic mock data for complete paper trading experience
 */

// Market Data Mock
export const MOCK_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD', 'MATIC/USD',
  'LINK/USD', 'UNI/USD', 'AAVE/USD', 'CRV/USD', 'MKR/USD',
  'COMP/USD', 'SNX/USD', 'YFI/USD', 'SUSHI/USD', 'BAL/USD'
] as const

export type MockSymbol = typeof MOCK_SYMBOLS[number]

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
  totalTrades: number
  winRate: number
  totalPnL: number
  totalPnLPercent: number
  sharpeRatio: number
  maxDrawdown: number
  avgTradeSize: number
  lastActive: Date
  status: 'active' | 'paused' | 'stopped'
}

class ComprehensiveMockDataService {
  private priceData: Map<MockSymbol, MockPriceData> = new Map()
  private portfolio: MockPortfolioPosition[] = []
  private tradeHistory: MockTrade[] = []
  private agentPerformance: MockAgentPerformance[] = []
  private priceUpdateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeMockData()
    this.startPriceUpdates()
  }

  private initializeMockData() {
    // Initialize mock prices
    const basePrices: Record<MockSymbol, number> = {
      'BTC/USD': 45000,
      'ETH/USD': 2500,
      'SOL/USD': 85,
      'AVAX/USD': 25,
      'MATIC/USD': 0.85,
      'LINK/USD': 15,
      'UNI/USD': 8,
      'AAVE/USD': 120,
      'CRV/USD': 1.2,
      'MKR/USD': 1800,
      'COMP/USD': 80,
      'SNX/USD': 3.5,
      'YFI/USD': 8500,
      'SUSHI/USD': 1.5,
      'BAL/USD': 12
    }

    MOCK_SYMBOLS.forEach(symbol => {
      const basePrice = basePrices[symbol]
      const change24h = (Math.random() - 0.5) * basePrice * 0.1 // ±10% max change
      const changePercent24h = (change24h / basePrice) * 100

      this.priceData.set(symbol, {
        symbol,
        price: basePrice + change24h,
        change24h,
        changePercent24h,
        volume24h: Math.random() * 1000000000, // Random volume up to 1B
        marketCap: basePrice * Math.random() * 10000000, // Random market cap
        high24h: basePrice + Math.abs(change24h) + (Math.random() * basePrice * 0.02),
        low24h: basePrice - Math.abs(change24h) - (Math.random() * basePrice * 0.02),
        lastUpdate: new Date()
      })
    })

    // Initialize mock portfolio
    this.portfolio = [
      {
        symbol: 'BTC/USD',
        quantity: 0.5,
        averagePrice: 44000,
        currentPrice: this.priceData.get('BTC/USD')!.price,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'ETH/USD',
        quantity: 10,
        averagePrice: 2400,
        currentPrice: this.priceData.get('ETH/USD')!.price,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      },
      {
        symbol: 'SOL/USD',
        quantity: 25,
        averagePrice: 80,
        currentPrice: this.priceData.get('SOL/USD')!.price,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: 0,
        lastUpdate: new Date()
      }
    ]

    // Calculate portfolio values
    this.updatePortfolioValues()

    // Initialize mock trade history
    this.generateMockTradeHistory()

    // Initialize mock agent performance
    this.initializeMockAgents()
  }

  private updatePortfolioValues() {
    this.portfolio.forEach(position => {
      const currentPrice = this.priceData.get(position.symbol)?.price || position.currentPrice
      position.currentPrice = currentPrice
      position.marketValue = position.quantity * currentPrice
      position.unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity
      position.unrealizedPnLPercent = (position.unrealizedPnL / (position.averagePrice * position.quantity)) * 100
      position.lastUpdate = new Date()
    })
  }

  private generateMockTradeHistory() {
    const strategies = ['Momentum', 'Mean Reversion', 'Arbitrage', 'DCA', 'Grid Trading']
    const agents = ['Agent-Alpha', 'Agent-Beta', 'Agent-Gamma', 'Agent-Delta']

    for (let i = 0; i < 50; i++) {
      const symbol = MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)]
      const side = Math.random() > 0.5 ? 'buy' : 'sell'
      const price = this.priceData.get(symbol)!.price * (0.9 + Math.random() * 0.2) // ±10% of current price
      
      this.tradeHistory.push({
        id: `trade-${i + 1}`,
        symbol,
        side,
        quantity: Math.random() * 10,
        price,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        status: 'filled',
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        agentId: agents[Math.floor(Math.random() * agents.length)]
      })
    }

    // Sort by timestamp
    this.tradeHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private initializeMockAgents() {
    const agentNames = [
      'Alpha Momentum Trader',
      'Beta Arbitrage Master',
      'Gamma Grid Bot',
      'Delta DCA Manager',
      'Epsilon Scalper',
      'Zeta Risk Parity'
    ]

    this.agentPerformance = agentNames.map((name, index) => ({
      agentId: `agent-${index + 1}`,
      name,
      totalTrades: Math.floor(Math.random() * 100) + 20,
      winRate: 0.4 + Math.random() * 0.4, // 40-80% win rate
      totalPnL: (Math.random() - 0.3) * 10000, // -3k to +7k PnL
      totalPnLPercent: (Math.random() - 0.2) * 50, // -10% to +40%
      sharpeRatio: Math.random() * 3, // 0-3 Sharpe ratio
      maxDrawdown: Math.random() * 0.3, // 0-30% max drawdown
      avgTradeSize: Math.random() * 1000 + 100, // $100-$1100 avg trade
      lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
      status: Math.random() > 0.3 ? 'active' : Math.random() > 0.5 ? 'paused' : 'stopped'
    }))
  }

  private startPriceUpdates() {
    // Update prices every 5 seconds
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices()
    }, 5000)
  }

  private updatePrices() {
    this.priceData.forEach((data, symbol) => {
      // Simulate realistic price movement (small random walk)
      const volatility = 0.001 // 0.1% volatility per update
      const priceChange = data.price * volatility * (Math.random() - 0.5) * 2
      
      data.price += priceChange
      data.change24h += priceChange
      data.changePercent24h = (data.change24h / (data.price - data.change24h)) * 100
      data.lastUpdate = new Date()

      // Update high/low
      if (data.price > data.high24h) data.high24h = data.price
      if (data.price < data.low24h) data.low24h = data.price
    })

    // Update portfolio values with new prices
    this.updatePortfolioValues()
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

  // Trading simulation methods
  simulateTrade(symbol: MockSymbol, side: 'buy' | 'sell', quantity: number): MockTrade {
    const currentPrice = this.priceData.get(symbol)?.price || 1000
    const slippage = 0.001 // 0.1% slippage
    const executionPrice = side === 'buy' 
      ? currentPrice * (1 + slippage)
      : currentPrice * (1 - slippage)

    const trade: MockTrade = {
      id: `trade-${Date.now()}`,
      symbol,
      side,
      quantity,
      price: executionPrice,
      timestamp: new Date(),
      status: 'filled'
    }

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
      this.portfolio.push({
        symbol,
        quantity,
        averagePrice: executionPrice,
        currentPrice: currentPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        marketValue: quantity * currentPrice,
        lastUpdate: new Date()
      })
    }

    // Add to trade history
    this.tradeHistory.unshift(trade)

    // Update portfolio values
    this.updatePortfolioValues()

    return trade
  }

  // Portfolio summary
  getPortfolioSummary() {
    const totalValue = this.portfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
    const totalCost = this.portfolio.reduce((sum, pos) => sum + (pos.averagePrice * pos.quantity), 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      positionsCount: this.portfolio.length,
      cash: 100000 - totalCost, // Assume $100k starting balance
      lastUpdate: new Date()
    }
  }

  // Market summary
  getMarketSummary() {
    const prices = Array.from(this.priceData.values())
    const gainers = prices.filter(p => p.changePercent24h > 0).length
    const losers = prices.filter(p => p.changePercent24h < 0).length
    const totalVolume = prices.reduce((sum, p) => sum + p.volume24h, 0)

    return {
      totalSymbols: prices.length,
      gainers,
      losers,
      unchanged: prices.length - gainers - losers,
      totalVolume,
      avgChange: prices.reduce((sum, p) => sum + p.changePercent24h, 0) / prices.length
    }
  }

  // Cleanup
  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
    }
  }
}

// Export singleton instance
let mockDataService: ComprehensiveMockDataService | null = null

export function getMockDataService(): ComprehensiveMockDataService {
  if (!mockDataService) {
    mockDataService = new ComprehensiveMockDataService()
  }
  return mockDataService
}

// Export for direct use
export const mockDataService = getMockDataService()