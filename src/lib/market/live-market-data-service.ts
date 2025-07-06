'use client'

import { EventEmitter } from 'events'

export interface LiveMarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change24h: number
  high24h: number
  low24h: number
  timestamp: Date
  source: 'binance' | 'coinbase' | 'kraken' | 'mock'
}

export interface OrderBookLevel {
  price: number
  quantity: number
}

export interface OrderBook {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: Date
}

export interface TradeData {
  symbol: string
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: Date
}

// Binance WebSocket Client
class BinanceWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private symbols: string[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000

  constructor(symbols: string[]) {
    super()
    this.symbols = symbols
  }

  connect() {
    if (typeof window === 'undefined') return
    
    const symbolsParam = this.symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbolsParam}`
    
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onopen = () => {
      console.log('🟢 Binance WebSocket connected')
      this.reconnectAttempts = 0
      this.emit('connected')
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleBinanceMessage(data)
      } catch (error) {
        console.error('Error parsing Binance message:', error)
      }
    }
    
    this.ws.onclose = () => {
      console.log('🔴 Binance WebSocket disconnected')
      this.emit('disconnected')
      this.attemptReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error)
      this.emit('error', error)
    }
  }

  private handleBinanceMessage(data: any) {
    if (data.e === '24hrTicker') {
      const marketData: LiveMarketData = {
        symbol: data.s.replace('USDT', '/USD'),
        price: parseFloat(data.c),
        bid: parseFloat(data.b),
        ask: parseFloat(data.a),
        volume: parseFloat(data.v),
        change24h: parseFloat(data.P),
        high24h: parseFloat(data.h),
        low24h: parseFloat(data.l),
        timestamp: new Date(data.E),
        source: 'binance'
      }
      this.emit('marketData', marketData)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect to Binance (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => this.connect(), this.reconnectDelay)
    } else {
      console.error('❌ Max reconnection attempts reached for Binance')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Coinbase WebSocket Client
class CoinbaseWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private symbols: string[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000

  constructor(symbols: string[]) {
    super()
    this.symbols = symbols
  }

  connect() {
    if (typeof window === 'undefined') return
    
    this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')
    
    this.ws.onopen = () => {
      console.log('🟢 Coinbase WebSocket connected')
      this.reconnectAttempts = 0
      
      // Subscribe to ticker channel
      const subscribeMessage = {
        type: 'subscribe',
        channels: [
          {
            name: 'ticker',
            product_ids: this.symbols.map(s => s.replace('/', '-'))
          }
        ]
      }
      
      this.ws?.send(JSON.stringify(subscribeMessage))
      this.emit('connected')
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleCoinbaseMessage(data)
      } catch (error) {
        console.error('Error parsing Coinbase message:', error)
      }
    }
    
    this.ws.onclose = () => {
      console.log('🔴 Coinbase WebSocket disconnected')
      this.emit('disconnected')
      this.attemptReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('Coinbase WebSocket error:', error)
      this.emit('error', error)
    }
  }

  private handleCoinbaseMessage(data: any) {
    if (data.type === 'ticker') {
      const marketData: LiveMarketData = {
        symbol: data.product_id.replace('-', '/'),
        price: parseFloat(data.price),
        bid: parseFloat(data.best_bid),
        ask: parseFloat(data.best_ask),
        volume: parseFloat(data.volume_24h),
        change24h: parseFloat(data.open_24h) ? 
          ((parseFloat(data.price) - parseFloat(data.open_24h)) / parseFloat(data.open_24h)) * 100 : 0,
        high24h: parseFloat(data.high_24h),
        low24h: parseFloat(data.low_24h),
        timestamp: new Date(data.time),
        source: 'coinbase'
      }
      this.emit('marketData', marketData)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect to Coinbase (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => this.connect(), this.reconnectDelay)
    } else {
      console.error('❌ Max reconnection attempts reached for Coinbase')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Main Live Market Data Service
export class LiveMarketDataService extends EventEmitter {
  private binanceClient: BinanceWebSocketClient | null = null
  private coinbaseClient: CoinbaseWebSocketClient | null = null
  private marketDataCache = new Map<string, LiveMarketData>()
  private isLiveMode = false
  private enabledExchanges: string[] = []

  constructor() {
    super()
    this.checkConfiguration()
  }

  private checkConfiguration() {
    // Check if exchange API keys are configured
    const hasBinanceConfig = typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_BINANCE_API_KEY || process.env.BINANCE_API_KEY)
    const hasCoinbaseConfig = typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_COINBASE_API_KEY || process.env.COINBASE_API_KEY)

    if (hasBinanceConfig) {
      this.enabledExchanges.push('binance')
    }
    if (hasCoinbaseConfig) {
      this.enabledExchanges.push('coinbase')
    }

    this.isLiveMode = this.enabledExchanges.length > 0
    
    if (!this.isLiveMode) {
      console.log('🟡 Live market data: No exchange credentials configured, using mock data')
    } else {
      console.log(`🟢 Live market data: Enabled exchanges: ${this.enabledExchanges.join(', ')}`)
    }
  }

  startLiveData(symbols: string[]) {
    if (!this.isLiveMode) {
      console.log('🟡 Starting mock market data for development')
      this.startMockData(symbols)
      return
    }

    console.log('🚀 Starting live market data feeds')

    // Start Binance if configured
    if (this.enabledExchanges.includes('binance')) {
      this.binanceClient = new BinanceWebSocketClient(symbols)
      this.binanceClient.on('marketData', (data: LiveMarketData) => {
        this.handleMarketData(data)
      })
      this.binanceClient.on('error', (error) => {
        console.error('Binance WebSocket error:', error)
        this.emit('exchangeError', 'binance', error)
      })
      this.binanceClient.connect()
    }

    // Start Coinbase if configured
    if (this.enabledExchanges.includes('coinbase')) {
      this.coinbaseClient = new CoinbaseWebSocketClient(symbols)
      this.coinbaseClient.on('marketData', (data: LiveMarketData) => {
        this.handleMarketData(data)
      })
      this.coinbaseClient.on('error', (error) => {
        console.error('Coinbase WebSocket error:', error)
        this.emit('exchangeError', 'coinbase', error)
      })
      this.coinbaseClient.connect()
    }
  }

  private startMockData(symbols: string[]) {
    // Use existing mock data generation from paper trading engine
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
      const mockData: LiveMarketData = {
        symbol,
        price: basePrice,
        bid: basePrice * 0.999,
        ask: basePrice * 1.001,
        volume: Math.random() * 1000000 + 100000,
        change24h: (Math.random() - 0.5) * 10,
        high24h: basePrice * 1.05,
        low24h: basePrice * 0.95,
        timestamp: new Date(),
        source: 'mock'
      }
      this.marketDataCache.set(symbol, mockData)
    })

    // Update mock data periodically
    setInterval(() => {
      this.updateMockData()
    }, 1000)
  }

  private updateMockData() {
    this.marketDataCache.forEach((data, symbol) => {
      const volatility = 0.001 // 0.1% volatility
      const change = (Math.random() - 0.5) * volatility
      const newPrice = data.price * (1 + change)
      const spread = newPrice * 0.001

      const updatedData: LiveMarketData = {
        ...data,
        price: newPrice,
        bid: newPrice - spread,
        ask: newPrice + spread,
        volume: data.volume + Math.random() * 10000 - 5000,
        timestamp: new Date()
      }

      this.marketDataCache.set(symbol, updatedData)
      this.emit('marketData', updatedData)
    })
  }

  private handleMarketData(data: LiveMarketData) {
    // Update cache
    this.marketDataCache.set(data.symbol, data)
    
    // Emit to listeners
    this.emit('marketData', data)
    this.emit(`marketData:${data.symbol}`, data)
    
    // Log significant price movements
    if (Math.abs(data.change24h) > 5) {
      console.log(`📈 Significant movement: ${data.symbol} ${data.change24h.toFixed(2)}%`)
    }
  }

  getLatestData(symbol: string): LiveMarketData | undefined {
    return this.marketDataCache.get(symbol)
  }

  getAllLatestData(): LiveMarketData[] {
    return Array.from(this.marketDataCache.values())
  }

  isConnected(): boolean {
    if (!this.isLiveMode) return true // Mock mode is always "connected"
    
    const binanceConnected = this.binanceClient ? true : false
    const coinbaseConnected = this.coinbaseClient ? true : false
    
    return binanceConnected || coinbaseConnected
  }

  getConnectionStatus(): { exchange: string; connected: boolean }[] {
    const status = []
    
    if (this.enabledExchanges.includes('binance')) {
      status.push({
        exchange: 'binance',
        connected: this.binanceClient !== null
      })
    }
    
    if (this.enabledExchanges.includes('coinbase')) {
      status.push({
        exchange: 'coinbase',
        connected: this.coinbaseClient !== null
      })
    }
    
    if (!this.isLiveMode) {
      status.push({
        exchange: 'mock',
        connected: true
      })
    }
    
    return status
  }

  disconnect() {
    if (this.binanceClient) {
      this.binanceClient.disconnect()
      this.binanceClient = null
    }
    
    if (this.coinbaseClient) {
      this.coinbaseClient.disconnect()
      this.coinbaseClient = null
    }
    
    console.log('🔴 Live market data service disconnected')
  }
}

// Singleton instance
export const liveMarketDataService = new LiveMarketDataService()