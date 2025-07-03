'use client'

import ExchangeConnectorBase, {
  MarketData,
  OrderBook,
  TradeOrder,
  OrderStatus,
  Balance,
  Position,
  ExchangeInfo,
  ExchangeConfig
} from './exchange-connector-base'

export interface IBConfig extends ExchangeConfig {
  host?: string
  port?: number
  clientId?: number
  paperTrading?: boolean
}

export class InteractiveBrokersConnector extends ExchangeConnectorBase {
  private host: string
  private port: number
  private clientId: number
  private paperTrading: boolean

  constructor(config: IBConfig) {
    super(config)
    this.host = config.host || 'localhost'
    this.port = config.port || 7497 // TWS default port
    this.clientId = config.clientId || 1
    this.paperTrading = config.paperTrading || true
  }

  // Connection Management
  async connect(): Promise<boolean> {
    try {
      // Note: In a real implementation, this would connect to TWS/IB Gateway
      // For demo purposes, we'll simulate a connection
      console.log(`Attempting to connect to IB TWS at ${this.host}:${this.port}`)
      
      // Simulate connection delay
      await this.sleep(1000)
      
      this.isConnected = true
      this.clearError()
      console.log('Connected to Interactive Brokers (Demo Mode)')
      return true
    } catch (error) {
      this.setError(`IB Connection error: ${error.message}`)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false
    console.log('Disconnected from Interactive Brokers')
  }

  async ping(): Promise<boolean> {
    // In real implementation, this would ping the TWS connection
    return this.isConnected
  }

  // Market Data
  async getMarketData(symbol: string): Promise<MarketData | null> {
    return this.handleApiCall(async () => {
      // Convert symbol format (e.g., AAPL -> AAPL stock data)
      const ibSymbol = this.convertToIBSymbol(symbol)
      
      // In real implementation, this would request market data from IB
      // For demo, we'll generate realistic market data
      return this.generateMockStockData(symbol)
    }, 'getMarketData')
  }

  async getOrderBook(symbol: string, depth: number = 10): Promise<OrderBook | null> {
    return this.handleApiCall(async () => {
      const marketData = await this.getMarketData(symbol)
      if (!marketData) return null

      // Generate mock order book based on current price
      const price = marketData.price
      const spread = price * 0.001 // 0.1% spread

      const bids: Array<[number, number]> = []
      const asks: Array<[number, number]> = []

      for (let i = 0; i < depth; i++) {
        const bidPrice = price - spread - (i * spread * 0.1)
        const askPrice = price + spread + (i * spread * 0.1)
        const quantity = Math.floor(Math.random() * 1000) + 100

        bids.push([bidPrice, quantity])
        asks.push([askPrice, quantity])
      }

      return {
        symbol,
        bids,
        asks,
        timestamp: Date.now()
      }
    }, 'getOrderBook')
  }

  async getSymbols(): Promise<string[]> {
    // Common US stocks available through IB
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
      'META', 'NVDA', 'NFLX', 'BABA', 'V',
      'JPM', 'JNJ', 'WMT', 'PG', 'UNH',
      'DIS', 'HD', 'MA', 'PYPL', 'ADBE',
      // ETFs
      'SPY', 'QQQ', 'IWM', 'VTI', 'VOO',
      // Crypto (via futures/ETFs)
      'BTC-USD', 'ETH-USD'
    ]
  }

  // Trading
  async placeOrder(order: TradeOrder): Promise<OrderStatus | null> {
    if (!this.validateOrder(order)) {
      this.setError('Invalid order parameters')
      return null
    }

    return this.handleApiCall(async () => {
      // In real implementation, this would submit order to IB
      const orderId = this.createOrderId()
      
      // Simulate order processing delay
      await this.sleep(100)

      return {
        id: orderId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        filledQuantity: 0,
        price: order.price,
        status: 'pending',
        timestamp: Date.now(),
        clientOrderId: order.clientOrderId
      }
    }, 'placeOrder')
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    return this.handleApiCall(async () => {
      // In real implementation, this would cancel the order in IB
      console.log(`Cancelling order ${orderId} for ${symbol}`)
      await this.sleep(100)
      return true
    }, 'cancelOrder') || false
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderStatus | null> {
    return this.handleApiCall(async () => {
      // Mock order status
      const statuses = ['pending', 'open', 'filled', 'cancelled'] as const
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

      return {
        id: orderId,
        symbol,
        side: 'buy',
        type: 'limit',
        quantity: 100,
        filledQuantity: randomStatus === 'filled' ? 100 : Math.floor(Math.random() * 100),
        price: 150,
        averagePrice: randomStatus === 'filled' ? 149.95 : undefined,
        status: randomStatus,
        timestamp: Date.now()
      }
    }, 'getOrderStatus')
  }

  async getOpenOrders(symbol?: string): Promise<OrderStatus[]> {
    return this.handleApiCall(async () => {
      // Mock open orders
      return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        id: `ib_order_${i + 1}`,
        symbol: symbol || 'AAPL',
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: 'limit',
        quantity: (i + 1) * 100,
        filledQuantity: Math.floor(Math.random() * ((i + 1) * 100)),
        price: 150 + (Math.random() - 0.5) * 10,
        status: 'open',
        timestamp: Date.now() - (i * 60000)
      }))
    }, 'getOpenOrders') || []
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<OrderStatus[]> {
    return this.handleApiCall(async () => {
      // Mock order history
      return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
        id: `ib_hist_${i + 1}`,
        symbol: symbol || ['AAPL', 'MSFT', 'GOOGL'][i % 3],
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: Math.random() > 0.7 ? 'market' : 'limit',
        quantity: (Math.floor(Math.random() * 10) + 1) * 100,
        filledQuantity: (Math.floor(Math.random() * 10) + 1) * 100,
        price: 150 + (Math.random() - 0.5) * 50,
        averagePrice: 150 + (Math.random() - 0.5) * 50,
        status: Math.random() > 0.9 ? 'cancelled' : 'filled',
        timestamp: Date.now() - (i * 3600000) // Hours ago
      }))
    }, 'getOrderHistory') || []
  }

  // Account
  async getBalances(): Promise<Balance[]> {
    return this.handleApiCall(async () => {
      // Mock account balances
      return [
        { asset: 'USD', free: 50000, locked: 5000, total: 55000 },
        { asset: 'AAPL', free: 100, locked: 0, total: 100 },
        { asset: 'MSFT', free: 50, locked: 0, total: 50 },
        { asset: 'GOOGL', free: 10, locked: 0, total: 10 }
      ]
    }, 'getBalances') || []
  }

  async getPositions(): Promise<Position[]> {
    return this.handleApiCall(async () => {
      // Mock stock positions
      return [
        {
          symbol: 'AAPL',
          side: 'long',
          size: 100,
          entryPrice: 145.50,
          markPrice: 150.25,
          unrealizedPnl: 475,
          percentage: 3.26
        },
        {
          symbol: 'MSFT',
          side: 'long',
          size: 50,
          entryPrice: 310.00,
          markPrice: 315.75,
          unrealizedPnl: 287.50,
          percentage: 1.85
        }
      ]
    }, 'getPositions') || []
  }

  // Exchange Info
  async getExchangeInfo(): Promise<ExchangeInfo> {
    return {
      name: 'Interactive Brokers',
      isConnected: this.isConnected,
      isTestnet: this.paperTrading,
      rateLimits: {
        orders: 50, // Conservative limit
        requests: 100
      },
      symbols: await this.getSymbols(),
      fees: {
        maker: 0.0005, // $0.005 per share, minimum $1
        taker: 0.0005
      }
    }
  }

  // Helper Methods
  private convertToIBSymbol(symbol: string): string {
    // Convert common symbol formats to IB format
    if (symbol.includes('/')) {
      return symbol.split('/')[0]
    }
    return symbol.toUpperCase()
  }

  private generateMockStockData(symbol: string): MarketData {
    const basePrices: { [key: string]: number } = {
      'AAPL': 150,
      'MSFT': 315,
      'GOOGL': 2800,
      'AMZN': 3200,
      'TSLA': 250,
      'META': 280,
      'NVDA': 450,
      'NFLX': 380,
      'SPY': 420,
      'QQQ': 350,
      'BTC-USD': 50000,
      'ETH-USD': 3000
    }

    const basePrice = basePrices[symbol] || 100
    const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
    const price = basePrice * (1 + variation)

    return {
      symbol,
      price: this.roundPrice(price, 2),
      bid: this.roundPrice(price * 0.9995, 2),
      ask: this.roundPrice(price * 1.0005, 2),
      volume: Math.floor(Math.random() * 10000000) + 100000,
      change24h: (Math.random() - 0.5) * 6,
      high24h: this.roundPrice(price * 1.03, 2),
      low24h: this.roundPrice(price * 0.97, 2),
      timestamp: Date.now()
    }
  }

  // WebSocket Streams (Simplified)
  async subscribeToMarketData(symbol: string, callback: (data: MarketData) => void): Promise<void> {
    // Simulate real-time market data updates
    const interval = setInterval(async () => {
      const data = await this.getMarketData(symbol)
      if (data) {
        callback(data)
      }
    }, 1000)

    // Store interval for cleanup (in real implementation, would manage IB market data subscriptions)
    ;(this as any)[`${symbol}_interval`] = interval
  }

  async unsubscribeFromMarketData(symbol: string): Promise<void> {
    const interval = (this as any)[`${symbol}_interval`]
    if (interval) {
      clearInterval(interval)
      delete (this as any)[`${symbol}_interval`]
    }
  }
}

export default InteractiveBrokersConnector