import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  PaperTradingEngine,
  PaperPortfolio,
  PaperOrder,
  PaperTrade,
  PaperPosition,
  MarketData,
  OrderBookData,
  PaperTradingEvent,
  EventType,
  DeFiProtocol
} from '@/types/paper-trading.types'

interface PaperTradingState {
  // Core State
  engine: PaperTradingEngine | null
  portfolios: Record<string, PaperPortfolio>
  activePortfolio: string | null
  
  // Market Data
  marketData: Record<string, MarketData>
  orderBooks: Record<string, OrderBookData>
  
  // Orders & Trades
  orders: Record<string, PaperOrder>
  trades: Record<string, PaperTrade>
  
  // Events
  events: PaperTradingEvent[]
  unprocessedEvents: number
  
  // UI State
  isLoading: boolean
  error: string | null
  selectedSymbol: string
  selectedTimeframe: string
  
  // WebSocket State
  connected: boolean
  reconnecting: boolean
  lastUpdate: Date | null
}

interface PaperTradingActions {
  // Engine Management
  initializeEngine: (config: any) => Promise<void>
  shutdown: () => void
  
  // Portfolio Management
  createPortfolio: (agentId: string, initialBalance: number) => Promise<string>
  updatePortfolio: (portfolioId: string, updates: Partial<PaperPortfolio>) => void
  setActivePortfolio: (portfolioId: string) => void
  getPortfolio: (portfolioId: string) => PaperPortfolio | null
  
  // Order Management
  placeOrder: (order: Omit<PaperOrder, 'id' | 'createdAt' | 'status'>) => Promise<string>
  cancelOrder: (orderId: string) => Promise<void>
  modifyOrder: (orderId: string, updates: Partial<PaperOrder>) => Promise<void>
  fillOrder: (orderId: string, fillPrice: number, fillQuantity: number) => Promise<void>
  
  // Position Management
  updatePosition: (positionId: string, updates: Partial<PaperPosition>) => void
  closePosition: (positionId: string, closePrice?: number) => Promise<void>
  
  // Market Data
  updateMarketData: (symbol: string, data: MarketData) => void
  updateOrderBook: (symbol: string, data: OrderBookData) => void
  subscribeToSymbol: (symbol: string) => void
  unsubscribeFromSymbol: (symbol: string) => void
  
  // Events
  addEvent: (event: Omit<PaperTradingEvent, 'id' | 'timestamp' | 'processed'>) => void
  processEvent: (eventId: string) => void
  clearProcessedEvents: () => void
  
  // DeFi Operations
  executeSwap: (protocol: DeFiProtocol, tokenIn: string, tokenOut: string, amount: number) => Promise<string>
  addLiquidity: (protocol: DeFiProtocol, tokenA: string, tokenB: string, amountA: number, amountB: number) => Promise<string>
  removeLiquidity: (positionId: string, percentage: number) => Promise<void>
  supply: (protocol: DeFiProtocol, token: string, amount: number) => Promise<string>
  borrow: (protocol: DeFiProtocol, token: string, amount: number) => Promise<string>
  repay: (positionId: string, amount?: number) => Promise<void>
  
  // Utility Actions
  setSelectedSymbol: (symbol: string) => void
  setSelectedTimeframe: (timeframe: string) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  
  // WebSocket Actions
  connect: () => void
  disconnect: () => void
  setConnectionStatus: (connected: boolean, reconnecting?: boolean) => void
}

type PaperTradingStore = PaperTradingState & PaperTradingActions

export const usePaperTrading = create<PaperTradingStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial State
      engine: null,
      portfolios: {},
      activePortfolio: null,
      marketData: {},
      orderBooks: {},
      orders: {},
      trades: {},
      events: [],
      unprocessedEvents: 0,
      isLoading: false,
      error: null,
      selectedSymbol: 'BTC/USD',
      selectedTimeframe: '1h',
      connected: false,
      reconnecting: false,
      lastUpdate: null,

      // Engine Management
      initializeEngine: async (config) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          // Initialize paper trading engine
          const engine: PaperTradingEngine = {
            portfolio: {} as any, // Will be set with actual portfolios
            orderManager: {} as any,
            riskEngine: {} as any,
            performanceTracker: {} as any,
            defiProtocols: {} as any,
            agentFarm: {} as any
          }

          set((state) => {
            state.engine = engine
            state.isLoading = false
            state.lastUpdate = new Date()
          })

          console.log('Paper trading engine initialized')
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to initialize engine'
            state.isLoading = false
          })
        }
      },

      shutdown: () => {
        set((state) => {
          state.engine = null
          state.portfolios = {}
          state.activePortfolio = null
          state.orders = {}
          state.trades = {}
          state.connected = false
        })
      },

      // Portfolio Management
      createPortfolio: async (agentId: string, initialBalance: number) => {
        const portfolioId = `portfolio_${agentId}_${Date.now()}`
        
        const portfolio: PaperPortfolio = {
          id: portfolioId,
          agentId,
          virtualBalance: initialBalance,
          totalValue: initialBalance,
          positions: [],
          openOrders: [],
          tradingHistory: [],
          performanceMetrics: {
            totalReturn: 0,
            annualizedReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            winRate: 0,
            profitFactor: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            consistencyScore: 0,
            riskScore: 0,
            calmarRatio: 0,
            sortinoRatio: 0,
            informationRatio: 0,
            treynorRatio: 0,
            trackingError: 0,
            beta: 0,
            alpha: 0,
            volatility: 0,
            downside_deviation: 0,
            var95: 0,
            var99: 0,
            cvar95: 0,
            cvar99: 0,
            returnSeries: [],
            benchmarkComparison: {
              benchmark: 'SPY',
              correlation: 0,
              beta: 0,
              alpha: 0,
              trackingError: 0,
              informationRatio: 0,
              outperformance: 0
            },
            performanceAttribution: []
          },
          defiPositions: [],
          yieldPositions: []
        }

        set((state) => {
          state.portfolios[portfolioId] = portfolio
          if (!state.activePortfolio) {
            state.activePortfolio = portfolioId
          }
        })

        get().addEvent({
          type: EventType.AGENT_CREATED,
          agentId,
          portfolioId,
          data: { portfolioId, initialBalance }
        })

        return portfolioId
      },

      updatePortfolio: (portfolioId: string, updates: Partial<PaperPortfolio>) => {
        set((state) => {
          if (state.portfolios[portfolioId]) {
            Object.assign(state.portfolios[portfolioId], updates)
            state.lastUpdate = new Date()
          }
        })
      },

      setActivePortfolio: (portfolioId: string) => {
        set((state) => {
          state.activePortfolio = portfolioId
        })
      },

      getPortfolio: (portfolioId: string) => {
        return get().portfolios[portfolioId] || null
      },

      // Order Management
      placeOrder: async (orderData) => {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const order: PaperOrder = {
          ...orderData,
          id: orderId,
          status: 'pending',
          createdAt: new Date(),
          slippage: 0.001 // Default 0.1% slippage
        }

        set((state) => {
          state.orders[orderId] = order
          // Add to portfolio's open orders
          if (state.portfolios[order.portfolioId]) {
            state.portfolios[order.portfolioId].openOrders.push(order)
          }
        })

        get().addEvent({
          type: EventType.ORDER_PLACED,
          agentId: order.agentId,
          portfolioId: order.portfolioId,
          orderId,
          data: order
        })

        // Simulate order execution (in real system, this would be handled by execution engine)
        setTimeout(() => {
          const currentPrice = get().marketData[order.symbol]?.price || order.price || 0
          if (currentPrice > 0) {
            get().fillOrder(orderId, currentPrice, order.quantity)
          }
        }, Math.random() * 2000 + 500) // Random delay 0.5-2.5 seconds

        return orderId
      },

      cancelOrder: async (orderId: string) => {
        set((state) => {
          if (state.orders[orderId]) {
            state.orders[orderId].status = 'cancelled'
            
            // Remove from portfolio's open orders
            Object.values(state.portfolios).forEach(portfolio => {
              portfolio.openOrders = portfolio.openOrders.filter(o => o.id !== orderId)
            })
          }
        })

        const order = get().orders[orderId]
        if (order) {
          get().addEvent({
            type: EventType.ORDER_CANCELLED,
            agentId: order.agentId,
            portfolioId: order.portfolioId,
            orderId,
            data: { reason: 'user_cancelled' }
          })
        }
      },

      modifyOrder: async (orderId: string, updates: Partial<PaperOrder>) => {
        set((state) => {
          if (state.orders[orderId]) {
            Object.assign(state.orders[orderId], updates)
          }
        })
      },

      fillOrder: async (orderId: string, fillPrice: number, fillQuantity: number) => {
        const order = get().orders[orderId]
        if (!order || order.status !== 'pending') return

        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const value = fillPrice * fillQuantity
        const fee = value * 0.001 // 0.1% fee

        const trade: PaperTrade = {
          id: tradeId,
          orderId,
          agentId: order.agentId,
          symbol: order.symbol,
          side: order.side,
          quantity: fillQuantity,
          price: fillPrice,
          value,
          fee,
          timestamp: new Date(),
          protocol: order.protocol,
          pnl: 0, // Will be calculated when position is closed
          strategy: 'paper_trading'
        }

        set((state) => {
          // Update order status
          state.orders[orderId].status = 'filled'
          state.orders[orderId].executedAt = new Date()
          
          // Add trade
          state.trades[tradeId] = trade
          
          // Update portfolio
          const portfolio = state.portfolios[order.portfolioId]
          if (portfolio) {
            // Remove from open orders
            portfolio.openOrders = portfolio.openOrders.filter(o => o.id !== orderId)
            
            // Add to trading history
            portfolio.tradingHistory.push(trade)
            
            // Update or create position
            const existingPosition = portfolio.positions.find(p => p.symbol === order.symbol)
            
            if (existingPosition) {
              // Update existing position
              if (order.side === 'buy') {
                const newQuantity = existingPosition.quantity + fillQuantity
                const newAveragePrice = ((existingPosition.averagePrice * existingPosition.quantity) + (fillPrice * fillQuantity)) / newQuantity
                existingPosition.quantity = newQuantity
                existingPosition.averagePrice = newAveragePrice
                existingPosition.marketValue = newQuantity * fillPrice
              } else {
                existingPosition.quantity -= fillQuantity
                existingPosition.realizedPnL += (fillPrice - existingPosition.averagePrice) * fillQuantity
                if (existingPosition.quantity <= 0) {
                  portfolio.positions = portfolio.positions.filter(p => p.id !== existingPosition.id)
                }
              }
            } else if (order.side === 'buy') {
              // Create new position
              const positionId = `position_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              const newPosition: PaperPosition = {
                id: positionId,
                symbol: order.symbol,
                quantity: fillQuantity,
                averagePrice: fillPrice,
                currentPrice: fillPrice,
                marketValue: value,
                unrealizedPnL: 0,
                realizedPnL: 0,
                entryDate: new Date(),
                lastUpdated: new Date(),
                side: 'long',
                protocol: order.protocol,
                fees: {
                  entry: fee,
                  exit: 0,
                  ongoing: 0
                }
              }
              portfolio.positions.push(newPosition)
            }
            
            // Update portfolio balance
            if (order.side === 'buy') {
              portfolio.virtualBalance -= (value + fee)
            } else {
              portfolio.virtualBalance += (value - fee)
            }
            
            // Recalculate total value
            portfolio.totalValue = portfolio.virtualBalance + portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0)
          }
        })

        get().addEvent({
          type: EventType.ORDER_FILLED,
          agentId: order.agentId,
          portfolioId: order.portfolioId,
          orderId,
          tradeId,
          data: { trade, fillPrice, fillQuantity }
        })
      },

      // Position Management
      updatePosition: (positionId: string, updates: Partial<PaperPosition>) => {
        set((state) => {
          Object.values(state.portfolios).forEach(portfolio => {
            const position = portfolio.positions.find(p => p.id === positionId)
            if (position) {
              Object.assign(position, updates)
              position.lastUpdated = new Date()
            }
          })
        })
      },

      closePosition: async (positionId: string, closePrice?: number) => {
        const portfolio = Object.values(get().portfolios).find(p => 
          p.positions.some(pos => pos.id === positionId)
        )
        const position = portfolio?.positions.find(p => p.id === positionId)
        
        if (!position || !portfolio) return

        const currentPrice = closePrice || get().marketData[position.symbol]?.price || position.currentPrice
        
        // Create sell order to close position
        await get().placeOrder({
          agentId: portfolio.agentId,
          portfolioId: portfolio.id,
          symbol: position.symbol,
          type: 'market',
          side: 'sell',
          quantity: position.quantity,
          timeInForce: 'ioc'
        })
      },

      // Market Data
      updateMarketData: (symbol: string, data: MarketData) => {
        set((state) => {
          state.marketData[symbol] = data
          state.lastUpdate = new Date()
          
          // Update position current prices and unrealized PnL
          Object.values(state.portfolios).forEach(portfolio => {
            portfolio.positions.forEach(position => {
              if (position.symbol === symbol) {
                position.currentPrice = data.price
                position.marketValue = position.quantity * data.price
                position.unrealizedPnL = (data.price - position.averagePrice) * position.quantity
              }
            })
            
            // Recalculate portfolio total value
            portfolio.totalValue = portfolio.virtualBalance + portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0)
          })
        })
      },

      updateOrderBook: (symbol: string, data: OrderBookData) => {
        set((state) => {
          state.orderBooks[symbol] = data
        })
      },

      subscribeToSymbol: (symbol: string) => {
        // In real implementation, this would subscribe to WebSocket feeds
        console.log(`Subscribing to ${symbol}`)
      },

      unsubscribeFromSymbol: (symbol: string) => {
        // In real implementation, this would unsubscribe from WebSocket feeds
        console.log(`Unsubscribing from ${symbol}`)
      },

      // Events
      addEvent: (eventData) => {
        const event: PaperTradingEvent = {
          ...eventData,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          processed: false
        }

        set((state) => {
          state.events.unshift(event) // Add to beginning for newest first
          state.unprocessedEvents += 1
          
          // Keep only last 1000 events
          if (state.events.length > 1000) {
            state.events = state.events.slice(0, 1000)
          }
        })
      },

      processEvent: (eventId: string) => {
        set((state) => {
          const event = state.events.find(e => e.id === eventId)
          if (event && !event.processed) {
            event.processed = true
            state.unprocessedEvents = Math.max(0, state.unprocessedEvents - 1)
          }
        })
      },

      clearProcessedEvents: () => {
        set((state) => {
          state.events = state.events.filter(event => !event.processed)
        })
      },

      // DeFi Operations (Simplified implementations)
      executeSwap: async (protocol: DeFiProtocol, tokenIn: string, tokenOut: string, amount: number) => {
        // Simulate DeFi swap
        const swapId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // This would integrate with actual DeFi protocol simulators
        console.log(`Executing ${protocol} swap: ${amount} ${tokenIn} -> ${tokenOut}`)
        
        return swapId
      },

      addLiquidity: async (protocol: DeFiProtocol, tokenA: string, tokenB: string, amountA: number, amountB: number) => {
        const liquidityId = `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        console.log(`Adding liquidity to ${protocol}: ${amountA} ${tokenA} + ${amountB} ${tokenB}`)
        return liquidityId
      },

      removeLiquidity: async (positionId: string, percentage: number) => {
        console.log(`Removing ${percentage}% liquidity from position ${positionId}`)
      },

      supply: async (protocol: DeFiProtocol, token: string, amount: number) => {
        const supplyId = `supply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        console.log(`Supplying ${amount} ${token} to ${protocol}`)
        return supplyId
      },

      borrow: async (protocol: DeFiProtocol, token: string, amount: number) => {
        const borrowId = `borrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        console.log(`Borrowing ${amount} ${token} from ${protocol}`)
        return borrowId
      },

      repay: async (positionId: string, amount?: number) => {
        console.log(`Repaying ${amount || 'full'} amount for position ${positionId}`)
      },

      // Utility Actions
      setSelectedSymbol: (symbol: string) => {
        set((state) => {
          state.selectedSymbol = symbol
        })
      },

      setSelectedTimeframe: (timeframe: string) => {
        set((state) => {
          state.selectedTimeframe = timeframe
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      // WebSocket Actions
      connect: () => {
        set((state) => {
          state.connected = true
          state.reconnecting = false
        })
      },

      disconnect: () => {
        set((state) => {
          state.connected = false
          state.reconnecting = false
        })
      },

      setConnectionStatus: (connected: boolean, reconnecting = false) => {
        set((state) => {
          state.connected = connected
          state.reconnecting = reconnecting
        })
      }
    }))
  )
)

// Selectors for performance optimization
export const useActivePortfolio = () => usePaperTrading(state => 
  state.activePortfolio ? state.portfolios[state.activePortfolio] : null
)

export const usePortfolioPositions = (portfolioId: string) => usePaperTrading(state =>
  state.portfolios[portfolioId]?.positions || []
)

export const usePortfolioOrders = (portfolioId: string) => usePaperTrading(state =>
  state.portfolios[portfolioId]?.openOrders || []
)

export const useMarketDataForSymbol = (symbol: string) => usePaperTrading(state =>
  state.marketData[symbol]
)

export const useOrderBookForSymbol = (symbol: string) => usePaperTrading(state =>
  state.orderBooks[symbol]
)

export const useUnprocessedEvents = () => usePaperTrading(state =>
  state.events.filter(event => !event.processed)
)

export const usePortfolioPerformance = (portfolioId: string) => usePaperTrading(state =>
  state.portfolios[portfolioId]?.performanceMetrics
)