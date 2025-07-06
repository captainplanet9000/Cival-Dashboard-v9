'use client'

import { EventEmitter } from 'events'
import CryptoJS from 'crypto-js'

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

// Main Exchange API Service
export class ExchangeAPIService extends EventEmitter {
  private exchanges = new Map<string, BaseExchangeAPI>()
  private isLiveMode = false

  constructor() {
    super()
    this.initializeExchanges()
  }

  private initializeExchanges() {
    // Initialize Binance if credentials are available
    const binanceKey = process.env.BINANCE_API_KEY || process.env.NEXT_PUBLIC_BINANCE_API_KEY
    const binanceSecret = process.env.BINANCE_API_SECRET || process.env.NEXT_PUBLIC_BINANCE_API_SECRET
    
    if (binanceKey && binanceSecret) {
      const binanceAPI = new BinanceAPI(binanceKey, binanceSecret, false)
      this.exchanges.set('binance', binanceAPI)
      this.isLiveMode = true
      console.log('🟢 Binance API initialized')
    }

    // Initialize Coinbase if credentials are available
    const coinbaseKey = process.env.COINBASE_API_KEY || process.env.NEXT_PUBLIC_COINBASE_API_KEY
    const coinbaseSecret = process.env.COINBASE_API_SECRET || process.env.NEXT_PUBLIC_COINBASE_API_SECRET
    
    if (coinbaseKey && coinbaseSecret) {
      const coinbaseAPI = new CoinbaseAPI(coinbaseKey, coinbaseSecret, false)
      this.exchanges.set('coinbase', coinbaseAPI)
      this.isLiveMode = true
      console.log('🟢 Coinbase API initialized')
    }

    if (!this.isLiveMode) {
      console.log('🟡 Exchange API Service: No credentials configured, using paper trading mode')
    }
  }

  async placeOrder(
    exchange: string, 
    order: Partial<ExchangeOrder>
  ): Promise<ExchangeOrder | null> {
    if (!this.isLiveMode) {
      console.log('🟡 Paper trading mode: Order would be placed on', exchange)
      return null
    }

    const exchangeAPI = this.exchanges.get(exchange)
    if (!exchangeAPI) {
      throw new Error(`Exchange ${exchange} not configured`)
    }

    try {
      const result = await exchangeAPI.placeOrder(order)
      this.emit('orderPlaced', exchange, result)
      console.log(`✅ Order placed on ${exchange}: ${result.side} ${result.quantity} ${result.symbol}`)
      return result
    } catch (error) {
      console.error(`❌ Error placing order on ${exchange}:`, error)
      this.emit('orderError', exchange, error)
      throw error
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

// Singleton instance
export const exchangeAPIService = new ExchangeAPIService()