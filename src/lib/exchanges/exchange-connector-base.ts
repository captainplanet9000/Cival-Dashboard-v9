'use client'

export interface MarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change24h: number
  high24h: number
  low24h: number
  timestamp: number
}

export interface OrderBook {
  symbol: string
  bids: Array<[number, number]> // [price, quantity]
  asks: Array<[number, number]> // [price, quantity]
  timestamp: number
}

export interface TradeOrder {
  id?: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  clientOrderId?: string
}

export interface OrderStatus {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  quantity: number
  filledQuantity: number
  price?: number
  averagePrice?: number
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected'
  timestamp: number
  clientOrderId?: string
}

export interface Balance {
  asset: string
  free: number
  locked: number
  total: number
}

export interface Position {
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  percentage: number
}

export interface ExchangeInfo {
  name: string
  isConnected: boolean
  isTestnet: boolean
  rateLimits: {
    orders: number
    requests: number
  }
  symbols: string[]
  fees: {
    maker: number
    taker: number
  }
}

export interface ExchangeConfig {
  apiKey?: string
  apiSecret?: string
  passphrase?: string
  sandbox?: boolean
  testnet?: boolean
  baseUrl?: string
}

export abstract class ExchangeConnectorBase {
  protected config: ExchangeConfig
  protected isConnected: boolean = false
  protected lastError: string | null = null

  constructor(config: ExchangeConfig) {
    this.config = config
  }

  // Connection Management
  abstract connect(): Promise<boolean>
  abstract disconnect(): Promise<void>
  abstract ping(): Promise<boolean>

  // Market Data
  abstract getMarketData(symbol: string): Promise<MarketData | null>
  abstract getOrderBook(symbol: string, depth?: number): Promise<OrderBook | null>
  abstract getSymbols(): Promise<string[]>

  // Trading
  abstract placeOrder(order: TradeOrder): Promise<OrderStatus | null>
  abstract cancelOrder(orderId: string, symbol: string): Promise<boolean>
  abstract getOrderStatus(orderId: string, symbol: string): Promise<OrderStatus | null>
  abstract getOpenOrders(symbol?: string): Promise<OrderStatus[]>
  abstract getOrderHistory(symbol?: string, limit?: number): Promise<OrderStatus[]>

  // Account
  abstract getBalances(): Promise<Balance[]>
  abstract getPositions(): Promise<Position[]>

  // Exchange Info
  abstract getExchangeInfo(): Promise<ExchangeInfo>

  // WebSocket Streams (optional)
  subscribeToMarketData?(symbol: string, callback: (data: MarketData) => void): Promise<void>
  subscribeToOrderBook?(symbol: string, callback: (data: OrderBook) => void): Promise<void>
  subscribeToOrders?(callback: (order: OrderStatus) => void): Promise<void>
  unsubscribeFromMarketData?(symbol: string): Promise<void>
  unsubscribeFromOrderBook?(symbol: string): Promise<void>
  unsubscribeFromOrders?(): Promise<void>

  // Utility Methods
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getLastError(): string | null {
    return this.lastError
  }

  protected setError(error: string): void {
    this.lastError = error
    console.error(`[${this.constructor.name}] Error:`, error)
  }

  protected clearError(): void {
    this.lastError = null
  }

  // Price calculation helpers
  protected calculatePriceChange(current: number, previous: number): number {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  protected roundPrice(price: number, decimals: number = 8): number {
    return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  protected roundQuantity(quantity: number, decimals: number = 8): number {
    return Math.round(quantity * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  // Validation helpers
  protected validateSymbol(symbol: string): boolean {
    return symbol && symbol.length > 0
  }

  protected validateOrder(order: TradeOrder): boolean {
    if (!this.validateSymbol(order.symbol)) return false
    if (!['buy', 'sell'].includes(order.side)) return false
    if (!['market', 'limit', 'stop'].includes(order.type)) return false
    if (order.quantity <= 0) return false
    if (order.type === 'limit' && (!order.price || order.price <= 0)) return false
    if (order.type === 'stop' && (!order.stopPrice || order.stopPrice <= 0)) return false
    return true
  }

  // Rate limiting helpers
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected createOrderId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Error handling wrapper
  protected async handleApiCall<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    try {
      this.clearError()
      return await operation()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.setError(`${operationName} failed: ${errorMessage}`)
      return null
    }
  }
}

export default ExchangeConnectorBase