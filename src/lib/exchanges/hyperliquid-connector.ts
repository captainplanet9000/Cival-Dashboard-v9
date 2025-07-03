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

export interface HyperliquidConfig extends ExchangeConfig {
  baseUrl?: string
  testnet?: boolean
}

export class HyperliquidConnector extends ExchangeConnectorBase {
  private baseUrl: string
  private ws: WebSocket | null = null
  private marketDataCallbacks: Map<string, (data: MarketData) => void> = new Map()
  private orderBookCallbacks: Map<string, (data: OrderBook) => void> = new Map()

  constructor(config: HyperliquidConfig) {
    super(config)
    this.baseUrl = config.testnet 
      ? 'https://api.hyperliquid-testnet.xyz' 
      : 'https://api.hyperliquid.xyz'
  }

  // Connection Management
  async connect(): Promise<boolean> {
    try {
      // Test connection with a simple API call
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'meta'
        })
      })

      if (response.ok) {
        this.isConnected = true
        this.clearError()
        return true
      } else {
        this.setError(`Connection failed: ${response.status} ${response.statusText}`)
        return false
      }
    } catch (error) {
      this.setError(`Connection error: ${error.message}`)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async ping(): Promise<boolean> {
    return this.handleApiCall(async () => {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'meta'
        })
      })
      return response.ok
    }, 'ping') || false
  }

  // Market Data
  async getMarketData(symbol: string): Promise<MarketData | null> {
    return this.handleApiCall(async () => {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'allMids'
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      
      // Find the specific symbol data
      const symbolData = data.find((item: any) => item.coin === symbol.replace('/', ''))
      
      if (!symbolData) {
        // Return mock data if symbol not found
        return this.generateMockMarketData(symbol)
      }

      const price = parseFloat(symbolData.px || '0')
      
      return {
        symbol,
        price,
        bid: price * 0.999,
        ask: price * 1.001,
        volume: Math.random() * 1000000,
        change24h: (Math.random() - 0.5) * 10,
        high24h: price * 1.05,
        low24h: price * 0.95,
        timestamp: Date.now()
      }
    }, 'getMarketData')
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBook | null> {
    return this.handleApiCall(async () => {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'l2Book',
          coin: symbol.replace('/', '')
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      
      return {
        symbol,
        bids: (data.levels || [])
          .filter((level: any) => level.side === 'B')
          .slice(0, depth)
          .map((level: any) => [parseFloat(level.px), parseFloat(level.sz)]),
        asks: (data.levels || [])
          .filter((level: any) => level.side === 'A')
          .slice(0, depth)
          .map((level: any) => [parseFloat(level.px), parseFloat(level.sz)]),
        timestamp: Date.now()
      }
    }, 'getOrderBook')
  }

  async getSymbols(): Promise<string[]> {
    return this.handleApiCall(async () => {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'meta'
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      
      return (data.universe || []).map((asset: any) => `${asset.name}/USD`)
    }, 'getSymbols') || ['BTC/USD', 'ETH/USD', 'SOL/USD'] // Fallback symbols
  }

  // Trading (Mock Implementation - Requires API Key for real trading)
  async placeOrder(order: TradeOrder): Promise<OrderStatus | null> {
    if (!this.config.apiKey) {
      // Return mock order for demo purposes
      return {
        id: this.createOrderId(),
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        filledQuantity: 0,
        price: order.price,
        status: 'open',
        timestamp: Date.now(),
        clientOrderId: order.clientOrderId
      }
    }

    return this.handleApiCall(async () => {
      // Real implementation would require signing the request
      // This is a simplified version for demonstration
      throw new Error('Real trading requires API key configuration and request signing')
    }, 'placeOrder')
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    if (!this.config.apiKey) {
      // Mock successful cancellation
      return true
    }

    return this.handleApiCall(async () => {
      throw new Error('Real trading requires API key configuration and request signing')
    }, 'cancelOrder') || false
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderStatus | null> {
    // Mock implementation
    return {
      id: orderId,
      symbol,
      side: 'buy',
      type: 'limit',
      quantity: 1,
      filledQuantity: 0.5,
      price: 50000,
      averagePrice: 49950,
      status: 'open',
      timestamp: Date.now()
    }
  }

  async getOpenOrders(symbol?: string): Promise<OrderStatus[]> {
    // Mock implementation
    return [
      {
        id: 'order_1',
        symbol: symbol || 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 0.1,
        filledQuantity: 0,
        price: 45000,
        status: 'open',
        timestamp: Date.now() - 300000
      }
    ]
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<OrderStatus[]> {
    // Mock implementation
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `order_${i + 1}`,
      symbol: symbol || 'BTC/USD',
      side: i % 2 === 0 ? 'buy' : 'sell',
      type: 'limit',
      quantity: 0.1,
      filledQuantity: 0.1,
      price: 50000 + (Math.random() - 0.5) * 1000,
      averagePrice: 50000 + (Math.random() - 0.5) * 1000,
      status: 'filled',
      timestamp: Date.now() - (i * 60000)
    }))
  }

  // Account
  async getBalances(): Promise<Balance[]> {
    if (!this.config.apiKey) {
      // Mock balances for demo
      return [
        { asset: 'USD', free: 10000, locked: 0, total: 10000 },
        { asset: 'BTC', free: 0.1, locked: 0.05, total: 0.15 },
        { asset: 'ETH', free: 2.5, locked: 0, total: 2.5 }
      ]
    }

    return this.handleApiCall(async () => {
      // Real implementation would query user's balances
      throw new Error('Real balance query requires API key configuration')
    }, 'getBalances') || []
  }

  async getPositions(): Promise<Position[]> {
    if (!this.config.apiKey) {
      // Mock positions for demo
      return [
        {
          symbol: 'BTC/USD',
          side: 'long',
          size: 0.1,
          entryPrice: 48000,
          markPrice: 50000,
          unrealizedPnl: 200,
          percentage: 4.17
        }
      ]
    }

    return this.handleApiCall(async () => {
      throw new Error('Real position query requires API key configuration')
    }, 'getPositions') || []
  }

  // Exchange Info
  async getExchangeInfo(): Promise<ExchangeInfo> {
    return {
      name: 'Hyperliquid',
      isConnected: this.isConnected,
      isTestnet: this.config.testnet || false,
      rateLimits: {
        orders: 100,
        requests: 1200
      },
      symbols: await this.getSymbols(),
      fees: {
        maker: 0.0002,
        taker: 0.0005
      }
    }
  }

  // WebSocket Streams (Simplified Implementation)
  async subscribeToMarketData(symbol: string, callback: (data: MarketData) => void): Promise<void> {
    this.marketDataCallbacks.set(symbol, callback)
    
    // Simulate real-time updates
    const interval = setInterval(async () => {
      const data = await this.getMarketData(symbol)
      if (data && this.marketDataCallbacks.has(symbol)) {
        callback(data)
      }
    }, 1000)

    // Store interval for cleanup
    ;(this.marketDataCallbacks as any)[`${symbol}_interval`] = interval
  }

  async unsubscribeFromMarketData(symbol: string): Promise<void> {
    this.marketDataCallbacks.delete(symbol)
    const interval = (this.marketDataCallbacks as any)[`${symbol}_interval`]
    if (interval) {
      clearInterval(interval)
      delete (this.marketDataCallbacks as any)[`${symbol}_interval`]
    }
  }

  // Helper Methods
  private generateMockMarketData(symbol: string): MarketData {
    const basePrices: { [key: string]: number } = {
      'BTC/USD': 50000,
      'ETH/USD': 3000,
      'SOL/USD': 100,
      'AVAX/USD': 25,
      'MATIC/USD': 0.8
    }

    const basePrice = basePrices[symbol] || 100
    const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
    const price = basePrice * (1 + variation)

    return {
      symbol,
      price,
      bid: price * 0.999,
      ask: price * 1.001,
      volume: Math.random() * 1000000,
      change24h: (Math.random() - 0.5) * 10,
      high24h: price * 1.05,
      low24h: price * 0.95,
      timestamp: Date.now()
    }
  }
}

export default HyperliquidConnector