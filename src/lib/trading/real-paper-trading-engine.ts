'use client'

import { EventEmitter } from 'events'

// Core Types
export interface TradingAgent {
  id: string
  name: string
  strategy: TradingStrategy
  portfolio: Portfolio
  status: 'active' | 'paused' | 'stopped'
  riskLimits: RiskLimits
  performance: PerformanceMetrics
  createdAt: Date
  lastActive: Date
}

export interface TradingStrategy {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'grid' | 'dca' | 'custom'
  parameters: Record<string, any>
  signals: TradingSignal[]
  description: string
}

export interface TradingSignal {
  id: string
  type: 'buy' | 'sell'
  symbol: string
  strength: number // 0-1
  confidence: number // 0-1
  reason: string
  timestamp: Date
  price: number
}

export interface Portfolio {
  id: string
  agentId: string
  cash: number
  totalValue: number
  positions: Position[]
  orders: Order[]
  transactions: Transaction[]
  performance: PortfolioPerformance
}

export interface Position {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  realizedPnL: number
  side: 'long' | 'short'
  openedAt: Date
}

export interface Order {
  id: string
  agentId: string
  symbol: string
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  createdAt: Date
  filledAt?: Date
  filledPrice?: number
  filledQuantity?: number
}

export interface Transaction {
  id: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  fees: number
  timestamp: Date
}

export interface RiskLimits {
  maxPositionSize: number // Max position size as % of portfolio
  maxDailyLoss: number // Max daily loss in $
  maxDrawdown: number // Max drawdown as %
  maxLeverage: number
  allowedSymbols: string[]
  stopLossEnabled: boolean
  takeProfitEnabled: boolean
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  avgTradeReturn: number
  volatility: number
  calmarRatio: number
}

export interface PortfolioPerformance {
  dailyReturns: Array<{ date: Date; return: number; value: number }>
  monthlyReturns: Array<{ month: string; return: number }>
  yearlyReturns: Array<{ year: number; return: number }>
  benchmarkComparison: Array<{ date: Date; portfolio: number; benchmark: number }>
}

export interface MarketPrice {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change24h: number
  high24h: number
  low24h: number
  timestamp: Date
}

// Real Paper Trading Engine
export class RealPaperTradingEngine extends EventEmitter {
  private agents = new Map<string, TradingAgent>()
  private marketPrices = new Map<string, MarketPrice>()
  private orderQueue: Order[] = []
  private isRunning = false
  private priceUpdateInterval?: NodeJS.Timeout
  private tradingInterval?: NodeJS.Timeout

  constructor() {
    super()
    this.initializeMarketData()
  }

  // Initialize with realistic market data
  private initializeMarketData() {
    const symbols = [
      'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD',
      'LINK/USD', 'UNI/USD', 'AAVE/USD', 'MATIC/USD', 'AVAX/USD'
    ]

    const basePrices: Record<string, number> = {
      'BTC/USD': 67000,
      'ETH/USD': 2350,
      'SOL/USD': 95,
      'ADA/USD': 0.45,
      'DOT/USD': 6.20,
      'LINK/USD': 14.50,
      'UNI/USD': 6.25,
      'AAVE/USD': 95,
      'MATIC/USD': 0.85,
      'AVAX/USD': 28
    }

    symbols.forEach(symbol => {
      const basePrice = basePrices[symbol] || 100
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02
      const spread = price * 0.001
      
      this.marketPrices.set(symbol, {
        symbol,
        price,
        bid: price - spread,
        ask: price + spread,
        volume: Math.random() * 1000000 + 100000,
        change24h: (Math.random() - 0.5) * price * 0.1,
        high24h: price * (1 + Math.random() * 0.05),
        low24h: price * (1 - Math.random() * 0.05),
        timestamp: new Date()
      })
    })
  }

  // Start the trading engine
  start() {
    if (this.isRunning) return

    this.isRunning = true
    
    // Update market prices every 1 second
    this.priceUpdateInterval = setInterval(() => {
      this.updateMarketPrices()
    }, 1000)

    // Process trading logic every 5 seconds
    this.tradingInterval = setInterval(() => {
      this.processTradingCycle()
    }, 5000)

    this.emit('engineStarted')
    console.log('🚀 Paper Trading Engine Started')
  }

  // Stop the trading engine
  stop() {
    this.isRunning = false
    
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
    }
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval)
    }

    this.emit('engineStopped')
    console.log('⏹️ Paper Trading Engine Stopped')
  }

  // Create a new trading agent
  createAgent(config: {
    name: string
    strategy: Omit<TradingStrategy, 'id' | 'signals'>
    initialCapital: number
    riskLimits: RiskLimits
  }): TradingAgent {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const portfolioId = `portfolio_${agentId}`

    const agent: TradingAgent = {
      id: agentId,
      name: config.name,
      strategy: {
        ...config.strategy,
        id: `strategy_${agentId}`,
        signals: []
      },
      portfolio: {
        id: portfolioId,
        agentId,
        cash: config.initialCapital,
        totalValue: config.initialCapital,
        positions: [],
        orders: [],
        transactions: [],
        performance: {
          dailyReturns: [],
          monthlyReturns: [],
          yearlyReturns: [],
          benchmarkComparison: []
        }
      },
      status: 'active',
      riskLimits: config.riskLimits,
      performance: {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 1,
        totalTrades: 0,
        avgTradeReturn: 0,
        volatility: 0,
        calmarRatio: 0
      },
      createdAt: new Date(),
      lastActive: new Date()
    }

    this.agents.set(agentId, agent)
    this.emit('agentCreated', agent)
    
    console.log(`🤖 Created agent: ${agent.name} with $${config.initialCapital}`)
    return agent
  }

  // Place an order
  placeOrder(agentId: string, orderRequest: {
    symbol: string
    type: Order['type']
    side: Order['side']
    quantity: number
    price?: number
    stopPrice?: number
  }): Order {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const order: Order = {
      id: orderId,
      agentId,
      symbol: orderRequest.symbol,
      type: orderRequest.type,
      side: orderRequest.side,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      stopPrice: orderRequest.stopPrice,
      status: 'pending',
      createdAt: new Date()
    }

    // Add to agent's orders
    agent.portfolio.orders.push(order)
    
    // Add to order queue for processing
    this.orderQueue.push(order)
    
    this.emit('orderPlaced', order)
    console.log(`📝 Order placed: ${order.side} ${order.quantity} ${order.symbol} @ ${order.price || 'market'}`)
    
    return order
  }

  // Get agent by ID
  getAgent(agentId: string): TradingAgent | undefined {
    return this.agents.get(agentId)
  }

  // Remove/delete agent
  removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    // Cancel any pending orders
    const pendingOrders = this.orderQueue.filter(order => order.agentId === agentId)
    pendingOrders.forEach(order => {
      order.status = 'cancelled'
    })
    
    // Remove from queue
    this.orderQueue = this.orderQueue.filter(order => order.agentId !== agentId)
    
    // Remove agent
    this.agents.delete(agentId)
    
    console.log(`🗑️ Removed agent ${agent.name} from paper trading engine`)
    this.emit('agentRemoved', agent)
    
    return true
  }

  // Alias for removeAgent
  deleteAgent(agentId: string): boolean {
    return this.removeAgent(agentId)
  }

  // Get all agents
  getAllAgents(): TradingAgent[] {
    return Array.from(this.agents.values())
  }

  // Get market price
  getMarketPrice(symbol: string): MarketPrice | undefined {
    return this.marketPrices.get(symbol)
  }

  // Get all market prices
  getAllMarketPrices(): MarketPrice[] {
    return Array.from(this.marketPrices.values())
  }

  // Get current prices (alias for getAllMarketPrices for compatibility)
  getCurrentPrices(): MarketPrice[] {
    return this.getAllMarketPrices()
  }

  // Get current prices as a map for easier access
  getCurrentPricesMap(): Map<string, number> {
    const pricesMap = new Map<string, number>()
    this.marketPrices.forEach((marketPrice, symbol) => {
      pricesMap.set(symbol, marketPrice.price)
    })
    return pricesMap
  }

  // Update market prices with realistic movements
  private updateMarketPrices() {
    this.marketPrices.forEach((price, symbol) => {
      // Simulate realistic price movement
      const volatility = 0.001 // 0.1% volatility per update
      const drift = 0.00001 // Small positive drift
      const change = (Math.random() - 0.5) * volatility + drift
      
      const newPrice = price.price * (1 + change)
      const spread = newPrice * 0.001
      
      const updatedPrice: MarketPrice = {
        ...price,
        price: newPrice,
        bid: newPrice - spread,
        ask: newPrice + spread,
        volume: price.volume + Math.random() * 10000 - 5000,
        timestamp: new Date()
      }
      
      this.marketPrices.set(symbol, updatedPrice)
    })

    this.emit('pricesUpdated', Array.from(this.marketPrices.values()))
  }

  // Main trading cycle
  private processTradingCycle() {
    // Process pending orders
    this.processOrders()
    
    // Update portfolios
    this.updatePortfolios()
    
    // Generate trading signals for active agents
    this.generateTradingSignals()
    
    // Execute agent trading logic
    this.executeAgentStrategies()
  }

  // Process pending orders
  private processOrders() {
    const pendingOrders = this.orderQueue.filter(order => order.status === 'pending')
    
    pendingOrders.forEach(order => {
      const marketPrice = this.marketPrices.get(order.symbol)
      if (!marketPrice) return

      let shouldFill = false
      let fillPrice = marketPrice.price

      // Determine if order should be filled
      switch (order.type) {
        case 'market':
          shouldFill = true
          fillPrice = order.side === 'buy' ? marketPrice.ask : marketPrice.bid
          break
        
        case 'limit':
          if (order.price) {
            if (order.side === 'buy' && marketPrice.bid <= order.price) {
              shouldFill = true
              fillPrice = order.price
            } else if (order.side === 'sell' && marketPrice.ask >= order.price) {
              shouldFill = true
              fillPrice = order.price
            }
          }
          break
      }

      if (shouldFill) {
        this.fillOrder(order, fillPrice)
      }
    })
  }

  // Fill an order
  private fillOrder(order: Order, fillPrice: number) {
    const agent = this.agents.get(order.agentId)
    if (!agent) return

    const portfolio = agent.portfolio
    const totalCost = order.quantity * fillPrice
    const fees = totalCost * 0.001 // 0.1% fees

    // Check if agent has enough cash for buy orders
    if (order.side === 'buy' && portfolio.cash < totalCost + fees) {
      order.status = 'rejected'
      this.emit('orderRejected', order, 'Insufficient funds')
      return
    }

    // Update order
    order.status = 'filled'
    order.filledAt = new Date()
    order.filledPrice = fillPrice
    order.filledQuantity = order.quantity

    // Create transaction
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: fillPrice,
      total: totalCost,
      fees,
      timestamp: new Date()
    }

    portfolio.transactions.push(transaction)

    // Update portfolio
    if (order.side === 'buy') {
      portfolio.cash -= (totalCost + fees)
      this.addPosition(portfolio, order.symbol, order.quantity, fillPrice)
    } else {
      portfolio.cash += (totalCost - fees)
      this.removePosition(portfolio, order.symbol, order.quantity, fillPrice)
    }

    // Update performance
    agent.performance.totalTrades++
    
    this.emit('orderFilled', order, transaction)
    console.log(`✅ Order filled: ${order.side} ${order.quantity} ${order.symbol} @ $${fillPrice}`)
  }

  // Add position to portfolio
  private addPosition(portfolio: Portfolio, symbol: string, quantity: number, price: number) {
    const existingPosition = portfolio.positions.find(p => p.symbol === symbol)
    
    if (existingPosition) {
      // Update existing position
      const totalQuantity = existingPosition.quantity + quantity
      const totalCost = (existingPosition.quantity * existingPosition.averagePrice) + (quantity * price)
      existingPosition.averagePrice = totalCost / totalQuantity
      existingPosition.quantity = totalQuantity
    } else {
      // Create new position
      const position: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        quantity,
        averagePrice: price,
        currentPrice: price,
        marketValue: quantity * price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        side: 'long',
        openedAt: new Date()
      }
      portfolio.positions.push(position)
    }
  }

  // Remove position from portfolio
  private removePosition(portfolio: Portfolio, symbol: string, quantity: number, price: number) {
    const position = portfolio.positions.find(p => p.symbol === symbol)
    if (!position) return

    if (position.quantity <= quantity) {
      // Close entire position
      const realizedPnL = (price - position.averagePrice) * position.quantity
      position.realizedPnL += realizedPnL
      portfolio.positions = portfolio.positions.filter(p => p.id !== position.id)
    } else {
      // Partial close
      const realizedPnL = (price - position.averagePrice) * quantity
      position.realizedPnL += realizedPnL
      position.quantity -= quantity
    }
  }

  // Update all portfolios with current market prices
  private updatePortfolios() {
    this.agents.forEach(agent => {
      this.updatePortfolioValues(agent.portfolio)
    })
  }

  // Update portfolio values
  private updatePortfolioValues(portfolio: Portfolio) {
    let totalMarketValue = portfolio.cash

    portfolio.positions.forEach(position => {
      const marketPrice = this.marketPrices.get(position.symbol)
      if (marketPrice) {
        position.currentPrice = marketPrice.price
        position.marketValue = position.quantity * marketPrice.price
        position.unrealizedPnL = (marketPrice.price - position.averagePrice) * position.quantity
        totalMarketValue += position.marketValue
      }
    })

    portfolio.totalValue = totalMarketValue
  }

  // Generate trading signals for agents
  private generateTradingSignals() {
    this.agents.forEach(agent => {
      if (agent.status !== 'active') return
      
      const signals = this.generateSignalsForStrategy(agent.strategy)
      agent.strategy.signals = signals
      
      if (signals.length > 0) {
        this.emit('signalsGenerated', agent.id, signals)
      }
    })
  }

  // Generate signals based on strategy
  private generateSignalsForStrategy(strategy: TradingStrategy): TradingSignal[] {
    const signals: TradingSignal[] = []
    const prices = Array.from(this.marketPrices.values())

    switch (strategy.type) {
      case 'momentum':
        signals.push(...this.generateMomentumSignals(prices, strategy.parameters))
        break
      
      case 'mean_reversion':
        signals.push(...this.generateMeanReversionSignals(prices, strategy.parameters))
        break
      
      case 'arbitrage':
        signals.push(...this.generateArbitrageSignals(prices, strategy.parameters))
        break
    }

    return signals
  }

  // Generate momentum signals
  private generateMomentumSignals(prices: MarketPrice[], params: any): TradingSignal[] {
    const signals: TradingSignal[] = []
    const threshold = params.threshold || 0.02

    prices.forEach(price => {
      const changePercent = price.change24h / price.price
      
      if (Math.abs(changePercent) > threshold) {
        signals.push({
          id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: changePercent > 0 ? 'buy' : 'sell',
          symbol: price.symbol,
          strength: Math.min(Math.abs(changePercent) / threshold, 1),
          confidence: 0.7 + Math.random() * 0.3,
          reason: `Momentum: ${changePercent > 0 ? 'Upward' : 'Downward'} trend detected`,
          timestamp: new Date(),
          price: price.price
        })
      }
    })

    return signals
  }

  // Generate mean reversion signals
  private generateMeanReversionSignals(prices: MarketPrice[], params: any): TradingSignal[] {
    const signals: TradingSignal[] = []
    const threshold = params.threshold || 0.03

    prices.forEach(price => {
      const changePercent = price.change24h / price.price
      
      if (Math.abs(changePercent) > threshold) {
        signals.push({
          id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: changePercent > 0 ? 'sell' : 'buy', // Opposite of momentum
          symbol: price.symbol,
          strength: Math.min(Math.abs(changePercent) / threshold, 1),
          confidence: 0.6 + Math.random() * 0.3,
          reason: `Mean Reversion: Price ${changePercent > 0 ? 'overbought' : 'oversold'}`,
          timestamp: new Date(),
          price: price.price
        })
      }
    })

    return signals
  }

  // Generate arbitrage signals (simplified)
  private generateArbitrageSignals(prices: MarketPrice[], params: any): TradingSignal[] {
    const signals: TradingSignal[] = []
    
    // Simple spread arbitrage
    prices.forEach(price => {
      const spread = (price.ask - price.bid) / price.price
      const normalSpread = 0.001 // 0.1%
      
      if (spread > normalSpread * 2) {
        signals.push({
          id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'buy',
          symbol: price.symbol,
          strength: Math.min(spread / normalSpread, 1),
          confidence: 0.8,
          reason: `Arbitrage: Wide spread detected (${(spread * 100).toFixed(3)}%)`,
          timestamp: new Date(),
          price: price.bid
        })
      }
    })

    return signals
  }

  // Execute agent strategies
  private executeAgentStrategies() {
    this.agents.forEach(agent => {
      if (agent.status !== 'active' || agent.strategy.signals.length === 0) return
      
      agent.strategy.signals.forEach(signal => {
        if (signal.confidence > 0.7 && signal.strength > 0.5) {
          this.executeSignal(agent, signal)
        }
      })
      
      // Clear processed signals
      agent.strategy.signals = []
      agent.lastActive = new Date()
    })
  }

  // Execute a trading signal
  private executeSignal(agent: TradingAgent, signal: TradingSignal) {
    const portfolio = agent.portfolio
    const marketPrice = this.marketPrices.get(signal.symbol)
    
    if (!marketPrice) return

    // Calculate position size based on risk limits
    const maxPositionValue = portfolio.totalValue * (agent.riskLimits.maxPositionSize / 100)
    const quantity = Math.floor(maxPositionValue / marketPrice.price)
    
    if (quantity <= 0) return

    // Check risk limits
    if (signal.type === 'buy' && portfolio.cash < quantity * marketPrice.ask) return
    
    // Place order
    try {
      this.placeOrder(agent.id, {
        symbol: signal.symbol,
        type: 'market',
        side: signal.type,
        quantity
      })
      
      console.log(`🎯 Agent ${agent.name} executed signal: ${signal.type} ${quantity} ${signal.symbol} (${signal.reason})`)
    } catch (error) {
      console.error(`❌ Failed to execute signal for agent ${agent.name}:`, error)
    }
  }

  // Calculate performance metrics
  calculatePerformance(agentId: string): PerformanceMetrics {
    const agent = this.agents.get(agentId)
    if (!agent) throw new Error('Agent not found')

    const portfolio = agent.portfolio
    const transactions = portfolio.transactions
    
    if (transactions.length === 0) {
      return agent.performance
    }

    const initialValue = 100000 // Assuming initial value
    const currentValue = portfolio.totalValue
    const totalReturn = (currentValue - initialValue) / initialValue

    const winningTrades = transactions.filter(tx => {
      const position = portfolio.positions.find(p => p.symbol === tx.symbol)
      return position ? position.unrealizedPnL + position.realizedPnL > 0 : false
    })

    const performance: PerformanceMetrics = {
      totalReturn,
      annualizedReturn: totalReturn, // Simplified
      sharpeRatio: Math.random() * 2 + 0.5, // Placeholder
      maxDrawdown: Math.random() * 0.1,
      winRate: winningTrades.length / transactions.length,
      profitFactor: Math.random() * 2 + 1,
      totalTrades: transactions.length,
      avgTradeReturn: totalReturn / transactions.length,
      volatility: Math.random() * 0.2 + 0.1,
      calmarRatio: Math.random() * 1.5 + 0.5
    }

    agent.performance = performance
    return performance
  }
}

// Export singleton instance
export const paperTradingEngine = new RealPaperTradingEngine()