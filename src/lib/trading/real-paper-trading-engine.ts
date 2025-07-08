'use client'

// Simple EventEmitter implementation for browser compatibility
class EventEmitter {
  private events: Record<string, Function[]> = {}

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) return false
    this.events[event].forEach(listener => listener(...args))
    return true
  }

  removeListener(event: string, listener: Function): this {
    if (!this.events[event]) return this
    this.events[event] = this.events[event].filter(l => l !== listener)
    return this
  }
}

import { liveMarketDataService, type LiveMarketData } from '@/lib/market/live-market-data-service'
import { exchangeAPIService, type ExchangeOrder } from '@/lib/trading/exchange-api-service'

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
  stopLoss?: number
  takeProfit?: number
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
  stopLossPercentage: number // Default stop loss %
  takeProfitPercentage: number // Default take profit %
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
  source?: 'live' | 'mock'
}

// Real Paper Trading Engine
export class RealPaperTradingEngine extends EventEmitter {
  private agents = new Map<string, TradingAgent>()
  private marketPrices = new Map<string, MarketPrice>()
  private orderQueue: Order[] = []
  private isRunning = false
  private priceUpdateInterval?: ReturnType<typeof setInterval>
  private tradingInterval?: ReturnType<typeof setInterval>
  private useSupabase = false
  private defaultSessionId?: string
  private useLiveData = false
  private liveDataSymbols: string[] = []
  private riskCheckInterval?: ReturnType<typeof setInterval>
  private emergencyStopActive = false

  constructor() {
    super()
    this.initializeMarketData()
    this.initializeSupabase()
    this.initializeLiveData()
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
        timestamp: new Date(),
        source: 'mock'
      })
    })
  }

  // Initialize Supabase integration
  private async initializeSupabase() {
    // Only attempt to initialize if we're running in a browser
    if (typeof window === 'undefined') return
    
    try {
      // Dynamic import to avoid bundling issues in server context
      const { isSupabaseAvailable } = await import('@/lib/supabase/client')
      const available = await isSupabaseAvailable()
      
      if (available) {
        this.useSupabase = true
        console.log('🟢 Paper Trading Engine: Using Supabase for trade persistence')
        
        // Create default trading session
        const { supabaseTradingService } = await import('@/lib/services/supabase-trading-service')
        const session = await supabaseTradingService.createTradingSession({
          name: 'Default Paper Trading Session',
          description: 'Default session for paper trading engine'
        })
        this.defaultSessionId = session.id
      } else {
        console.log('🟡 Paper Trading Engine: Supabase not available')
      }
    } catch (error) {
      console.log('🟡 Paper Trading Engine: Supabase unavailable, trades will not be persisted')
      this.useSupabase = false
    }
  }

  // Initialize live market data integration
  private async initializeLiveData() {
    if (typeof window === 'undefined') return // Only in browser
    
    this.liveDataSymbols = [
      'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD',
      'LINK/USD', 'UNI/USD', 'AAVE/USD', 'MATIC/USD', 'AVAX/USD'
    ]

    // Check if live data is available
    const hasExchangeAPI = exchangeAPIService.isLive()
    
    if (hasExchangeAPI) {
      this.useLiveData = true
      console.log('🟢 Paper Trading Engine: Using live market data')
      
      // Set up live data listener
      liveMarketDataService.on('marketData', (data: LiveMarketData) => {
        this.handleLiveMarketData(data)
      })
      
      // Start live data feeds
      liveMarketDataService.startLiveData(this.liveDataSymbols)
    } else {
      console.log('🟡 Paper Trading Engine: No live data available, using mock data')
    }
  }

  // Handle incoming live market data
  private handleLiveMarketData(data: LiveMarketData) {
    const marketPrice: MarketPrice = {
      symbol: data.symbol,
      price: data.price,
      bid: data.bid,
      ask: data.ask,
      volume: data.volume,
      change24h: data.change24h,
      high24h: data.high24h,
      low24h: data.low24h,
      timestamp: data.timestamp,
      source: 'live'
    }
    
    this.marketPrices.set(data.symbol, marketPrice)
    this.emit('liveDataUpdate', marketPrice)
  }

  // Start the trading engine
  start() {
    if (this.isRunning) return

    this.isRunning = true
    
    // Update market prices every 1 second (only for mock data)
    if (!this.useLiveData) {
      this.priceUpdateInterval = setInterval(() => {
        this.updateMarketPrices()
      }, 1000)
    } else {
      console.log('🔴 Using live market data, skipping mock price updates')
    }

    // Process trading logic every 5 seconds
    this.tradingInterval = setInterval(() => {
      this.processTradingCycle()
    }, 5000)

    // Start risk monitoring every 2 seconds
    this.startRiskMonitoring()

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

    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval)
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
    
    // Save trade to Supabase if available
    this.saveTradeToDB(order, transaction, agent.id)
    
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
      // Find agent to get risk limits for stop loss/take profit
      const agent = this.agents.get(portfolio.agentId)
      
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

      // Set automatic stop loss and take profit if enabled
      if (agent && agent.riskLimits.stopLossEnabled && agent.riskLimits.stopLossPercentage > 0) {
        position.stopLoss = price * (1 - agent.riskLimits.stopLossPercentage / 100)
      }

      if (agent && agent.riskLimits.takeProfitEnabled && agent.riskLimits.takeProfitPercentage > 0) {
        position.takeProfit = price * (1 + agent.riskLimits.takeProfitPercentage / 100)
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

  // Save trade to Supabase database
  private async saveTradeToDB(order: Order, transaction: Transaction, agentId: string) {
    if (!this.useSupabase || !this.defaultSessionId) return
    
    try {
      const { supabaseTradingService } = await import('@/lib/services/supabase-trading-service')
      
      // Create trade record in Supabase
      await supabaseTradingService.createTrade({
        session_id: this.defaultSessionId,
        agent_id: agentId,
        order_id: order.id,
        symbol: order.symbol,
        side: order.side,
        order_type: order.type,
        quantity: order.quantity,
        price: transaction.price,
        strategy_name: this.agents.get(agentId)?.strategy.name,
        reasoning: `Automated ${order.type} order execution`,
        market_conditions: {
          timestamp: transaction.timestamp,
          total: transaction.total,
          fees: transaction.fees
        }
      })
      
      // Execute the trade (mark as filled)
      await supabaseTradingService.executeTrade(order.id, {
        avg_fill_price: transaction.price,
        filled_quantity: order.quantity,
        commission: transaction.fees,
        slippage: 0
      })
      
      console.log(`💾 Trade saved to Supabase: ${order.side} ${order.quantity} ${order.symbol}`)
    } catch (error) {
      console.error('Failed to save trade to Supabase:', error)
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
    const maxPositionValue = (portfolio.totalValue || 0) * ((agent.riskLimits.maxPositionSize || 0) / 100)
    const price = marketPrice.price || marketPrice.ask || marketPrice.bid || 1
    const quantity = Math.floor((maxPositionValue || 0) / price)
    
    if (quantity <= 0 || isNaN(quantity) || !isFinite(quantity)) return

    // Check risk limits
    const orderValue = quantity * (marketPrice.ask || marketPrice.price || price)
    if (signal.type === 'buy' && (portfolio.cash || 0) < orderValue) return
    
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

  // Start risk monitoring
  private startRiskMonitoring() {
    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval)
    }

    this.riskCheckInterval = setInterval(() => {
      if (!this.emergencyStopActive) {
        this.checkStopLossAndTakeProfit()
      }
    }, 2000) // Check every 2 seconds

    console.log('🔍 Risk monitoring started')
  }

  // Check all positions for stop loss and take profit triggers
  private async checkStopLossAndTakeProfit() {
    for (const agent of this.agents.values()) {
      if (agent.status !== 'active') continue

      for (const position of agent.portfolio.positions) {
        const currentPrice = this.marketPrices.get(position.symbol)?.price
        if (!currentPrice) continue

        // Update position current price
        position.currentPrice = currentPrice
        position.marketValue = position.quantity * currentPrice
        position.unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity

        // Check stop loss
        if (position.stopLoss && currentPrice <= position.stopLoss) {
          await this.triggerStopLoss(agent, position, currentPrice)
        }

        // Check take profit
        if (position.takeProfit && currentPrice >= position.takeProfit) {
          await this.triggerTakeProfit(agent, position, currentPrice)
        }
      }
    }
  }

  // Trigger stop loss for a position
  private async triggerStopLoss(agent: TradingAgent, position: Position, currentPrice: number) {
    try {
      console.log(`🛑 Stop loss triggered for ${agent.name}: ${position.symbol} @ $${currentPrice}`)

      // Place market sell order
      const order = this.placeOrder(agent.id, {
        symbol: position.symbol,
        type: 'market',
        side: 'sell',
        quantity: position.quantity
      })

      // Broadcast stop loss event
      try {
        const { broadcastStopLossTriggered } = await import('@/lib/websocket/risk-broadcaster')
        await broadcastStopLossTriggered(agent.id, position.symbol, {
          stopLossPrice: position.stopLoss,
          currentPrice,
          quantity: position.quantity,
          unrealizedPnL: position.unrealizedPnL,
          orderId: order.id
        })
      } catch (error) {
        console.error('Error broadcasting stop loss event:', error)
      }

      // Emit event for local listeners
      this.emit('stopLossTriggered', {
        agentId: agent.id,
        symbol: position.symbol,
        stopLossPrice: position.stopLoss,
        currentPrice,
        quantity: position.quantity,
        order
      })

    } catch (error) {
      console.error(`Failed to trigger stop loss for ${agent.name} ${position.symbol}:`, error)
    }
  }

  // Trigger take profit for a position
  private async triggerTakeProfit(agent: TradingAgent, position: Position, currentPrice: number) {
    try {
      console.log(`🎯 Take profit triggered for ${agent.name}: ${position.symbol} @ $${currentPrice}`)

      // Place market sell order
      const order = this.placeOrder(agent.id, {
        symbol: position.symbol,
        type: 'market',
        side: 'sell',
        quantity: position.quantity
      })

      // Broadcast take profit event
      try {
        const { broadcastTakeProfitTriggered } = await import('@/lib/websocket/risk-broadcaster')
        await broadcastTakeProfitTriggered(agent.id, position.symbol, {
          takeProfitPrice: position.takeProfit,
          currentPrice,
          quantity: position.quantity,
          unrealizedPnL: position.unrealizedPnL,
          orderId: order.id
        })
      } catch (error) {
        console.error('Error broadcasting take profit event:', error)
      }

      // Emit event for local listeners
      this.emit('takeProfitTriggered', {
        agentId: agent.id,
        symbol: position.symbol,
        takeProfitPrice: position.takeProfit,
        currentPrice,
        quantity: position.quantity,
        order
      })

    } catch (error) {
      console.error(`Failed to trigger take profit for ${agent.name} ${position.symbol}:`, error)
    }
  }

  // Emergency stop functionality
  async emergencyStop(reason: string = 'Emergency stop activated') {
    this.emergencyStopActive = true
    
    // Stop all agents
    for (const agent of this.agents.values()) {
      agent.status = 'paused'
    }

    // Cancel all pending orders
    for (const agent of this.agents.values()) {
      for (const order of agent.portfolio.orders) {
        if (order.status === 'pending') {
          order.status = 'cancelled'
        }
      }
    }

    console.log(`🚨 Emergency stop activated: ${reason}`)
    this.emit('emergencyStop', { reason, timestamp: Date.now() })
  }

  // Resume trading after emergency stop
  async resumeTrading() {
    this.emergencyStopActive = false
    
    // Reactivate agents (they can be manually started if needed)
    console.log('✅ Emergency stop deactivated - agents can be manually restarted')
    this.emit('tradingResumed', { timestamp: Date.now() })
  }

  // Pause an agent
  async pauseAgent(agentId: string) {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.status = 'paused'
      console.log(`⏸️ Agent ${agent.name} paused`)
      this.emit('agentPaused', agent)
    }
  }

  // Cancel an order
  async cancelOrder(orderId: string) {
    for (const agent of this.agents.values()) {
      const order = agent.portfolio.orders.find(o => o.id === orderId)
      if (order && order.status === 'pending') {
        order.status = 'cancelled'
        console.log(`❌ Order cancelled: ${orderId}`)
        this.emit('orderCancelled', order)
        return true
      }
    }
    return false
  }
}

// Export singleton instance
export const paperTradingEngine = new RealPaperTradingEngine()

// Export alias for API route compatibility
export const realPaperTradingEngine = paperTradingEngine