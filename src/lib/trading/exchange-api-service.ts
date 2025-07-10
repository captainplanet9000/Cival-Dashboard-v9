'use client'

import { EventEmitter } from 'events'
import CryptoJS from 'crypto-js'
import { secureAPIManager, type ExchangeCredentials } from './secure-api-manager'

export interface ExchangeOrder {
  id: string
  clientOrderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'
  executedQuantity: number
  fills: ExchangeFill[]
  createdAt: Date
  updatedAt: Date
}

export interface ExchangeFill {
  price: number
  quantity: number
  commission: number
  commissionAsset: string
  timestamp: Date
}

export interface ExchangeBalance {
  asset: string
  free: number
  locked: number
}

export interface ExchangePosition {
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  percentage: number
}

// Base Exchange API Class
abstract class BaseExchangeAPI extends EventEmitter {
  protected apiKey: string
  protected apiSecret: string
  protected baseUrl: string
  protected isTestnet: boolean

  constructor(apiKey: string, apiSecret: string, isTestnet = false) {
    super()
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.isTestnet = isTestnet
    this.baseUrl = this.getBaseUrl()
  }

  protected abstract getBaseUrl(): string
  protected abstract createSignature(params: string): string
  public abstract placeOrder(order: Partial<ExchangeOrder>): Promise<ExchangeOrder>
  public abstract cancelOrder(symbol: string, orderId: string): Promise<boolean>
  public abstract getOrder(symbol: string, orderId: string): Promise<ExchangeOrder>
  public abstract getBalances(): Promise<ExchangeBalance[]>
  public abstract getPositions(): Promise<ExchangePosition[]>
  public abstract testConnectivity(): Promise<boolean>
}

// Binance API Implementation
class BinanceAPI extends BaseExchangeAPI {
  protected getBaseUrl(): string {
    return this.isTestnet 
      ? 'https://testnet.binance.vision/api/v3'
      : 'https://api.binance.com/api/v3'
  }

  protected createSignature(params: string): string {
    return CryptoJS.HmacSHA256(params, this.apiSecret).toString()
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', params: any = {}) {
    const timestamp = Date.now()
    const queryString = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    }).toString()
    
    const signature = this.createSignature(queryString)
    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Binance API error: ${error.msg || error.message}`)
    }
    
    return response.json()
  }

  async placeOrder(order: Partial<ExchangeOrder>): Promise<ExchangeOrder> {
    const params = {
      symbol: order.symbol?.replace('/', ''),
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      ...(order.price && { price: order.price }),
      ...(order.stopPrice && { stopPrice: order.stopPrice }),
      newClientOrderId: order.clientOrderId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const response = await this.makeRequest('/order', 'POST', params)
    
    return {
      id: response.orderId.toString(),
      clientOrderId: response.clientOrderId,
      symbol: order.symbol!,
      side: response.side,
      type: response.type,
      quantity: parseFloat(response.origQty),
      price: response.price ? parseFloat(response.price) : undefined,
      status: response.status,
      executedQuantity: parseFloat(response.executedQty),
      fills: response.fills?.map((fill: any) => ({
        price: parseFloat(fill.price),
        quantity: parseFloat(fill.qty),
        commission: parseFloat(fill.commission),
        commissionAsset: fill.commissionAsset,
        timestamp: new Date(response.transactTime)
      })) || [],
      createdAt: new Date(response.transactTime),
      updatedAt: new Date(response.transactTime)
    }
  }

  async cancelOrder(symbol: string, orderId: string): Promise<boolean> {
    try {
      await this.makeRequest('/order', 'DELETE', {
        symbol: symbol.replace('/', ''),
        orderId
      })
      return true
    } catch (error) {
      console.error('Error canceling Binance order:', error)
      return false
    }
  }

  async getOrder(symbol: string, orderId: string): Promise<ExchangeOrder> {
    const response = await this.makeRequest('/order', 'GET', {
      symbol: symbol.replace('/', ''),
      orderId
    })
    
    return {
      id: response.orderId.toString(),
      clientOrderId: response.clientOrderId,
      symbol: symbol,
      side: response.side,
      type: response.type,
      quantity: parseFloat(response.origQty),
      price: response.price ? parseFloat(response.price) : undefined,
      status: response.status,
      executedQuantity: parseFloat(response.executedQty),
      fills: [],
      createdAt: new Date(response.time),
      updatedAt: new Date(response.updateTime)
    }
  }

  async getBalances(): Promise<ExchangeBalance[]> {
    const response = await this.makeRequest('/account', 'GET')
    
    return response.balances
      .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
      .map((balance: any) => ({
        asset: balance.asset,
        free: parseFloat(balance.free),
        locked: parseFloat(balance.locked)
      }))
  }

  async getPositions(): Promise<ExchangePosition[]> {
    // Binance spot doesn't have positions, return empty array
    // For futures, would need different endpoint
    return []
  }

  async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Coinbase API Implementation
class CoinbaseAPI extends BaseExchangeAPI {
  protected getBaseUrl(): string {
    return this.isTestnet 
      ? 'https://api-public.sandbox.exchange.coinbase.com'
      : 'https://api.exchange.coinbase.com'
  }

  protected createSignature(params: string): string {
    const timestamp = Date.now() / 1000
    const method = 'POST'
    const requestPath = '/orders'
    const message = timestamp + method + requestPath + params
    
    return CryptoJS.HmacSHA256(message, CryptoJS.enc.Base64.parse(this.apiSecret)).toString(CryptoJS.enc.Base64)
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: any) {
    const timestamp = Date.now() / 1000
    const bodyString = body ? JSON.stringify(body) : ''
    const message = timestamp + method + endpoint + bodyString
    
    const signature = CryptoJS.HmacSHA256(message, CryptoJS.enc.Base64.parse(this.apiSecret)).toString(CryptoJS.enc.Base64)
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CB-ACCESS-KEY': this.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp.toString(),
        'CB-ACCESS-PASSPHRASE': process.env.COINBASE_PASSPHRASE || ''
      },
      body: bodyString || undefined
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Coinbase API error: ${error.message}`)
    }
    
    return response.json()
  }

  async placeOrder(order: Partial<ExchangeOrder>): Promise<ExchangeOrder> {
    const params = {
      product_id: order.symbol?.replace('/', '-'),
      side: order.side?.toLowerCase(),
      type: order.type?.toLowerCase(),
      size: order.quantity?.toString(),
      ...(order.price && { price: order.price.toString() }),
      ...(order.stopPrice && { stop_price: order.stopPrice.toString() }),
      client_oid: order.clientOrderId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const response = await this.makeRequest('/orders', 'POST', params)
    
    return {
      id: response.id,
      clientOrderId: response.client_oid,
      symbol: order.symbol!,
      side: response.side.toUpperCase(),
      type: response.type.toUpperCase(),
      quantity: parseFloat(response.size),
      price: response.price ? parseFloat(response.price) : undefined,
      status: this.mapCoinbaseStatus(response.status),
      executedQuantity: parseFloat(response.filled_size || '0'),
      fills: [],
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.created_at)
    }
  }

  private mapCoinbaseStatus(status: string): ExchangeOrder['status'] {
    switch (status) {
      case 'open': return 'NEW'
      case 'done': return 'FILLED'
      case 'cancelled': return 'CANCELED'
      case 'rejected': return 'REJECTED'
      default: return 'NEW'
    }
  }

  async cancelOrder(symbol: string, orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/orders/${orderId}`, 'DELETE')
      return true
    } catch (error) {
      console.error('Error canceling Coinbase order:', error)
      return false
    }
  }

  async getOrder(symbol: string, orderId: string): Promise<ExchangeOrder> {
    const response = await this.makeRequest(`/orders/${orderId}`, 'GET')
    
    return {
      id: response.id,
      clientOrderId: response.client_oid,
      symbol: response.product_id.replace('-', '/'),
      side: response.side.toUpperCase(),
      type: response.type.toUpperCase(),
      quantity: parseFloat(response.size),
      price: response.price ? parseFloat(response.price) : undefined,
      status: this.mapCoinbaseStatus(response.status),
      executedQuantity: parseFloat(response.filled_size || '0'),
      fills: [],
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.created_at)
    }
  }

  async getBalances(): Promise<ExchangeBalance[]> {
    const response = await this.makeRequest('/accounts', 'GET')
    
    return response
      .filter((account: any) => parseFloat(account.balance) > 0 || parseFloat(account.hold) > 0)
      .map((account: any) => ({
        asset: account.currency,
        free: parseFloat(account.available),
        locked: parseFloat(account.hold)
      }))
  }

  async getPositions(): Promise<ExchangePosition[]> {
    // Coinbase doesn't have positions for spot trading
    return []
  }

  async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/time`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Enhanced Exchange API Service with Secure Credential Management
export class ExchangeAPIService extends EventEmitter {
  private exchanges = new Map<string, BaseExchangeAPI>()
  private isLiveMode = false
  private liveModeEnabled = false // User-controlled live trading toggle

  constructor() {
    super()
    this.initializeExchanges()
    this.setupSecureCredentialSystem()
  }

  private async setupSecureCredentialSystem() {
    // Initialize secure API manager and load existing credentials
    const configuredExchanges = secureAPIManager.getConfiguredExchanges()
    
    for (const exchangeId of configuredExchanges) {
      await this.initializeExchangeFromSecureStorage(exchangeId)
    }

    console.log(`🔐 Secure credential system initialized for ${configuredExchanges.length} exchanges`)
  }

  private async initializeExchangeFromSecureStorage(exchangeId: string): Promise<void> {
    try {
      const credentials = await secureAPIManager.getCredentials(exchangeId)
      if (!credentials) {
        console.warn(`❌ No credentials found for ${exchangeId}`)
        return
      }

      // Only initialize if credentials are ready and healthy
      if (!secureAPIManager.isExchangeReady(exchangeId)) {
        console.warn(`⚠️ Exchange ${exchangeId} credentials not ready`)
        return
      }

      let exchangeAPI: BaseExchangeAPI

      switch (exchangeId) {
        case 'binance':
          exchangeAPI = new BinanceAPI(credentials.apiKey, credentials.apiSecret, credentials.testnet || false)
          break
        case 'coinbase':
          exchangeAPI = new CoinbaseAPI(credentials.apiKey, credentials.apiSecret, credentials.testnet || false)
          break
        default:
          console.warn(`❌ Unsupported exchange: ${exchangeId}`)
          return
      }

      // Test the connection before adding to active exchanges
      const isConnected = await exchangeAPI.testConnectivity()
      if (isConnected) {
        this.exchanges.set(exchangeId, exchangeAPI)
        this.isLiveMode = true
        console.log(`✅ ${exchangeId} API initialized and connected`)
        this.emit('exchangeConnected', exchangeId)
      } else {
        console.error(`❌ Failed to connect to ${exchangeId}`)
        this.emit('exchangeError', exchangeId, 'Connection failed')
      }

    } catch (error) {
      console.error(`❌ Error initializing ${exchangeId}:`, error)
      this.emit('exchangeError', exchangeId, error)
    }
  }

  private initializeExchanges() {
    // Legacy initialization for backward compatibility
    // Initialize Binance if credentials are available in environment
    const binanceKey = process.env.BINANCE_API_KEY || process.env.NEXT_PUBLIC_BINANCE_API_KEY
    const binanceSecret = process.env.BINANCE_API_SECRET || process.env.NEXT_PUBLIC_BINANCE_API_SECRET
    
    if (binanceKey && binanceSecret) {
      const binanceAPI = new BinanceAPI(binanceKey, binanceSecret, false)
      this.exchanges.set('binance', binanceAPI)
      this.isLiveMode = true
      console.log('🟢 Binance API initialized from environment')
    }

    // Initialize Coinbase if credentials are available in environment
    const coinbaseKey = process.env.COINBASE_API_KEY || process.env.NEXT_PUBLIC_COINBASE_API_KEY
    const coinbaseSecret = process.env.COINBASE_API_SECRET || process.env.NEXT_PUBLIC_COINBASE_API_SECRET
    
    if (coinbaseKey && coinbaseSecret) {
      const coinbaseAPI = new CoinbaseAPI(coinbaseKey, coinbaseSecret, false)
      this.exchanges.set('coinbase', coinbaseAPI)
      this.isLiveMode = true
      console.log('🟢 Coinbase API initialized from environment')
    }

    if (!this.isLiveMode) {
      console.log('🟡 Exchange API Service: No credentials configured, using paper trading mode')
    }
  }

  // NEW: Add exchange credentials securely
  async addExchange(credentials: Omit<ExchangeCredentials, 'status'>): Promise<boolean> {
    try {
      // Store credentials securely
      const stored = await secureAPIManager.storeCredentials(credentials)
      if (!stored) {
        throw new Error('Failed to store credentials securely')
      }

      // Initialize the exchange
      await this.initializeExchangeFromSecureStorage(credentials.exchangeId)
      
      console.log(`✅ Exchange ${credentials.exchangeId} added successfully`)
      return true
    } catch (error) {
      console.error(`❌ Failed to add exchange ${credentials.exchangeId}:`, error)
      return false
    }
  }

  // NEW: Remove exchange
  async removeExchange(exchangeId: string): Promise<boolean> {
    try {
      // Remove from active exchanges
      this.exchanges.delete(exchangeId)
      
      // Remove credentials from secure storage
      await secureAPIManager.removeCredentials(exchangeId)
      
      // Update live mode status
      this.isLiveMode = this.exchanges.size > 0
      
      console.log(`✅ Exchange ${exchangeId} removed`)
      this.emit('exchangeRemoved', exchangeId)
      return true
    } catch (error) {
      console.error(`❌ Failed to remove exchange ${exchangeId}:`, error)
      return false
    }
  }

  // NEW: Toggle live trading mode
  setLiveTradingMode(enabled: boolean): void {
    this.liveModeEnabled = enabled
    console.log(`🔄 Live trading mode ${enabled ? 'ENABLED' : 'DISABLED'}`)
    this.emit('liveModeChanged', enabled)
  }

  // NEW: Get exchange health status
  getExchangeHealth(): Map<string, any> {
    return secureAPIManager.getHealthStatus()
  }

  // NEW: Test all exchange connections
  async testAllConnections(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    
    for (const [exchangeId, exchangeAPI] of this.exchanges) {
      try {
        const isConnected = await exchangeAPI.testConnectivity()
        results.set(exchangeId, isConnected)
        
        if (isConnected) {
          console.log(`✅ ${exchangeId} connection test passed`)
        } else {
          console.log(`❌ ${exchangeId} connection test failed`)
        }
      } catch (error) {
        console.error(`❌ ${exchangeId} connection test error:`, error)
        results.set(exchangeId, false)
      }
    }
    
    return results
  }

  async placeOrder(
    exchange: string, 
    order: Partial<ExchangeOrder>,
    options: {
      forcePaper?: boolean
      skipSafetyChecks?: boolean
      dryRun?: boolean
    } = {}
  ): Promise<ExchangeOrder | null> {
    // Enhanced safety checks for live trading
    const isReallyLive = this.isLiveMode && this.liveModeEnabled && !options.forcePaper
    
    if (!isReallyLive || options.dryRun) {
      console.log(`🟡 ${options.dryRun ? 'Dry run' : 'Paper trading'} mode: Order would be placed on ${exchange}`)
      
      // Return simulated order for paper trading/dry run
      return {
        id: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientOrderId: order.clientOrderId || `paper_${Date.now()}`,
        symbol: order.symbol!,
        side: order.side!,
        type: order.type!,
        quantity: order.quantity!,
        price: order.price,
        status: 'FILLED', // Simulate immediate fill for paper trading
        executedQuantity: order.quantity!,
        fills: [{
          price: order.price || 0,
          quantity: order.quantity!,
          commission: 0,
          commissionAsset: 'USD',
          timestamp: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    const exchangeAPI = this.exchanges.get(exchange)
    if (!exchangeAPI) {
      throw new Error(`Exchange ${exchange} not configured`)
    }

    // Pre-flight safety checks for live trading
    if (!options.skipSafetyChecks) {
      const safetyCheck = await this.performSafetyChecks(exchange, order)
      if (!safetyCheck.passed) {
        throw new Error(`Safety check failed: ${safetyCheck.reason}`)
      }
    }

    try {
      console.log(`🚨 LIVE TRADING: Placing real order on ${exchange}`)
      console.log(`   ${order.side} ${order.quantity} ${order.symbol} at ${order.price || 'market price'}`)
      
      const result = await exchangeAPI.placeOrder(order)
      
      this.emit('orderPlaced', exchange, result, { isLive: true })
      console.log(`✅ LIVE ORDER PLACED on ${exchange}: ${result.side} ${result.quantity} ${result.symbol}`)
      
      // Store order in database for tracking
      await this.storeOrderInDatabase(exchange, result)
      
      return result
    } catch (error) {
      console.error(`❌ LIVE TRADING ERROR on ${exchange}:`, error)
      this.emit('orderError', exchange, error, { isLive: true })
      throw error
    }
  }

  // NEW: Safety checks before placing live orders
  private async performSafetyChecks(exchange: string, order: Partial<ExchangeOrder>): Promise<{
    passed: boolean
    reason?: string
  }> {
    try {
      // Check 1: Exchange connection health
      const isConnected = await this.testConnectivity(exchange)
      if (!isConnected) {
        return { passed: false, reason: `Exchange ${exchange} not connected` }
      }

      // Check 2: Valid order parameters
      if (!order.symbol || !order.side || !order.type || !order.quantity) {
        return { passed: false, reason: 'Missing required order parameters' }
      }

      // Check 3: Reasonable order size (prevent fat finger trades)
      if (order.quantity! > 10000) { // Configurable limit
        return { passed: false, reason: `Order size ${order.quantity} exceeds safety limit` }
      }

      // Check 4: Price sanity check for limit orders
      if (order.type === 'LIMIT' && order.price) {
        const currentPrice = await this.getCurrentPrice(exchange, order.symbol!)
        if (currentPrice) {
          const priceDiff = Math.abs(order.price - currentPrice) / currentPrice
          if (priceDiff > 0.1) { // 10% price difference threshold
            return { passed: false, reason: `Order price ${order.price} deviates ${(priceDiff * 100).toFixed(1)}% from market price ${currentPrice}` }
          }
        }
      }

      // Check 5: Account balance check
      const balances = await this.getBalances(exchange)
      const requiredBalance = this.calculateRequiredBalance(order)
      const hasBalance = this.checkSufficientBalance(balances, requiredBalance)
      if (!hasBalance) {
        return { passed: false, reason: 'Insufficient balance for order' }
      }

      return { passed: true }
    } catch (error) {
      return { passed: false, reason: `Safety check error: ${error}` }
    }
  }

  // Helper methods for safety checks
  private async getCurrentPrice(exchange: string, symbol: string): Promise<number | null> {
    // This would integrate with market data service
    // For now, return null to skip price checks
    return null
  }

  private calculateRequiredBalance(order: Partial<ExchangeOrder>): { asset: string; amount: number } {
    if (order.side === 'BUY') {
      if (order.type === 'MARKET') {
        // For market buy, estimate required quote currency
        return { asset: 'USD', amount: (order.quantity! * 50000) } // Rough estimate
      } else {
        // For limit buy, calculate exact quote currency needed
        return { asset: 'USD', amount: order.quantity! * order.price! }
      }
    } else {
      // For sell orders, need base currency
      const baseAsset = order.symbol!.split('/')[0]
      return { asset: baseAsset, amount: order.quantity! }
    }
  }

  private checkSufficientBalance(balances: ExchangeBalance[], required: { asset: string; amount: number }): boolean {
    const balance = balances.find(b => b.asset === required.asset || 
      (required.asset === 'USD' && ['USDT', 'USDC', 'USD'].includes(b.asset)))
    
    return balance ? balance.free >= required.amount : false
  }

  private async storeOrderInDatabase(exchange: string, order: ExchangeOrder): Promise<void> {
    try {
      // This would integrate with the existing backend API to store order
      // For now, just log the order
      console.log(`💾 Storing order in database: ${order.id}`)
      
      // TODO: Integrate with existing backendApi client
      // await backendApi.post('/orders', { exchange, order })
    } catch (error) {
      console.error('Failed to store order in database:', error)
    }
  }

  async cancelOrder(exchange: string, symbol: string, orderId: string): Promise<boolean> {
    if (!this.isLiveMode) {
      console.log('🟡 Paper trading mode: Order would be canceled on', exchange)
      return true
    }

    const exchangeAPI = this.exchanges.get(exchange)
    if (!exchangeAPI) {
      throw new Error(`Exchange ${exchange} not configured`)
    }

    try {
      const result = await exchangeAPI.cancelOrder(symbol, orderId)
      this.emit('orderCanceled', exchange, symbol, orderId)
      return result
    } catch (error) {
      console.error(`❌ Error canceling order on ${exchange}:`, error)
      this.emit('orderError', exchange, error)
      throw error
    }
  }

  async getBalances(exchange: string): Promise<ExchangeBalance[]> {
    const exchangeAPI = this.exchanges.get(exchange)
    if (!exchangeAPI) {
      throw new Error(`Exchange ${exchange} not configured`)
    }

    return exchangeAPI.getBalances()
  }

  async testConnectivity(exchange: string): Promise<boolean> {
    const exchangeAPI = this.exchanges.get(exchange)
    if (!exchangeAPI) {
      return false
    }

    return exchangeAPI.testConnectivity()
  }

  getConfiguredExchanges(): string[] {
    return Array.from(this.exchanges.keys())
  }

  isConfigured(exchange: string): boolean {
    return this.exchanges.has(exchange)
  }

  isLive(): boolean {
    return this.isLiveMode
  }
}

// Lazy initialization to prevent circular dependencies
let _exchangeAPIServiceInstance: ExchangeAPIService | null = null

export const getExchangeAPIService = (): ExchangeAPIService => {
  if (!_exchangeAPIServiceInstance) {
    _exchangeAPIServiceInstance = new ExchangeAPIService()
  }
  return _exchangeAPIServiceInstance
}

// Backward compatibility
export const exchangeAPIService = {
  get instance() {
    return getExchangeAPIService()
  }
}