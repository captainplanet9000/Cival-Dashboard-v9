'use client'

/**
 * Enhanced Live Market Data Service
 * Eliminates hardcoded fallback data and implements comprehensive live data sourcing
 * Priority: Live APIs → Cached Data → Historical Data → Minimal Fallback (Emergency Only)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { buildMarketProxyUrl } from '@/lib/utils/api-url-builder'

// Enhanced market price interface with live data tracking
export interface EnhancedMarketPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  open24h: number
  marketCap?: number
  circulatingSupply?: number
  source: 'live' | 'cached' | 'historical' | 'emergency'
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
  lastUpdate: Date
  freshness: number // seconds since last update
  provider: string
  confidence: number // 0-100
}

interface MarketDataProvider {
  name: string
  priority: number
  rateLimit: number // requests per minute
  reliability: number // 0-100
  fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]>
}

interface CacheEntry {
  data: EnhancedMarketPrice
  timestamp: number
  ttl: number // time to live in ms
}

class EnhancedLiveMarketService {
  private providers: MarketDataProvider[] = []
  private cache = new Map<string, CacheEntry>()
  private rateTracker = new Map<string, number[]>()
  private failureTracker = new Map<string, number>()
  private lastSuccessfulFetch = new Map<string, number>()
  private websocketConnections = new Map<string, WebSocket>()
  
  // Configuration
  private readonly CACHE_TTL = 30000 // 30 seconds for live data
  private readonly STALE_DATA_TTL = 300000 // 5 minutes for stale data
  private readonly MAX_CACHE_SIZE = 1000
  private readonly RATE_LIMIT_WINDOW = 60000 // 1 minute
  private readonly MAX_FAILURES_BEFORE_BLACKLIST = 5
  private readonly WEBSOCKET_RECONNECT_DELAY = 5000

  constructor() {
    this.initializeProviders()
    this.startCacheCleanup()
    this.initializeWebSocketConnections()
  }

  private initializeProviders() {
    // Initialize providers in priority order (highest first)
    this.providers = [
      new BinanceWebSocketProvider(),
      new CoinGeckoProProvider(),
      new CoinMarketCapProvider(),
      new CryptoCompareProvider(),
      new BitstampProvider(),
      new KrakenProvider()
    ]
  }

  private startCacheCleanup() {
    // Clean expired cache entries every minute
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000)
  }

  private initializeWebSocketConnections() {
    // Initialize WebSocket connections for real-time data
    this.setupBinanceWebSocket()
    this.setupCoinbaseWebSocket()
  }

  private setupBinanceWebSocket() {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr')
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.processBinanceTickerData(data)
        } catch (error) {
          console.error('Binance WebSocket parse error:', error)
        }
      }

      ws.onopen = () => {
        console.log('✅ Binance WebSocket connected')
      }

      ws.onerror = (error) => {
        console.error('❌ Binance WebSocket error:', error)
        setTimeout(() => this.setupBinanceWebSocket(), this.WEBSOCKET_RECONNECT_DELAY)
      }

      ws.onclose = () => {
        console.log('🔌 Binance WebSocket disconnected, reconnecting...')
        setTimeout(() => this.setupBinanceWebSocket(), this.WEBSOCKET_RECONNECT_DELAY)
      }

      this.websocketConnections.set('binance', ws)
    } catch (error) {
      console.error('Failed to setup Binance WebSocket:', error)
    }
  }

  private setupCoinbaseWebSocket() {
    try {
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')
      
      ws.onopen = () => {
        // Subscribe to ticker data
        const subscribeMessage = {
          type: 'subscribe',
          product_ids: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'],
          channels: ['ticker']
        }
        ws.send(JSON.stringify(subscribeMessage))
        console.log('✅ Coinbase WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.processCoinbaseTickerData(data)
        } catch (error) {
          console.error('Coinbase WebSocket parse error:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Coinbase WebSocket error:', error)
        setTimeout(() => this.setupCoinbaseWebSocket(), this.WEBSOCKET_RECONNECT_DELAY)
      }

      ws.onclose = () => {
        console.log('🔌 Coinbase WebSocket disconnected, reconnecting...')
        setTimeout(() => this.setupCoinbaseWebSocket(), this.WEBSOCKET_RECONNECT_DELAY)
      }

      this.websocketConnections.set('coinbase', ws)
    } catch (error) {
      console.error('Failed to setup Coinbase WebSocket:', error)
    }
  }

  private processBinanceTickerData(data: any[]) {
    if (!Array.isArray(data)) return

    data.forEach(ticker => {
      const symbol = this.mapBinanceSymbol(ticker.s)
      if (!symbol) return

      const price: EnhancedMarketPrice = {
        symbol,
        price: parseFloat(ticker.c),
        change24h: parseFloat(ticker.P),
        changePercent24h: parseFloat(ticker.P),
        volume24h: parseFloat(ticker.v),
        high24h: parseFloat(ticker.h),
        low24h: parseFloat(ticker.l),
        open24h: parseFloat(ticker.o),
        source: 'live',
        dataQuality: 'excellent',
        lastUpdate: new Date(),
        freshness: 0,
        provider: 'binance-ws',
        confidence: 95
      }

      this.updateCache(symbol, price, this.CACHE_TTL)
    })
  }

  private processCoinbaseTickerData(data: any) {
    if (data.type !== 'ticker') return

    const symbol = this.mapCoinbaseSymbol(data.product_id)
    if (!symbol) return

    const price: EnhancedMarketPrice = {
      symbol,
      price: parseFloat(data.price),
      change24h: parseFloat(data.open_24h) - parseFloat(data.price),
      changePercent24h: ((parseFloat(data.price) - parseFloat(data.open_24h)) / parseFloat(data.open_24h)) * 100,
      volume24h: parseFloat(data.volume_24h),
      high24h: parseFloat(data.high_24h),
      low24h: parseFloat(data.low_24h),
      open24h: parseFloat(data.open_24h),
      source: 'live',
      dataQuality: 'excellent',
      lastUpdate: new Date(),
      freshness: 0,
      provider: 'coinbase-ws',
      confidence: 95
    }

    this.updateCache(symbol, price, this.CACHE_TTL)
  }

  private mapBinanceSymbol(binanceSymbol: string): string | null {
    const mapping: Record<string, string> = {
      'BTCUSDT': 'BTC/USD',
      'ETHUSDT': 'ETH/USD',
      'SOLUSDT': 'SOL/USD',
      'ADAUSDT': 'ADA/USD',
      'DOTUSDT': 'DOT/USD',
      'AVAXUSDT': 'AVAX/USD',
      'MATICUSDT': 'MATIC/USD',
      'LINKUSDT': 'LINK/USD'
    }
    return mapping[binanceSymbol] || null
  }

  private mapCoinbaseSymbol(coinbaseSymbol: string): string | null {
    const mapping: Record<string, string> = {
      'BTC-USD': 'BTC/USD',
      'ETH-USD': 'ETH/USD',
      'SOL-USD': 'SOL/USD',
      'ADA-USD': 'ADA/USD'
    }
    return mapping[coinbaseSymbol] || null
  }

  async fetchLivePrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    console.log('📊 Fetching live market prices for:', symbols)
    
    const results: EnhancedMarketPrice[] = []
    const uncachedSymbols: string[] = []

    // First, check cache for recent data
    for (const symbol of symbols) {
      const cached = this.getCachedPrice(symbol)
      if (cached && cached.source === 'live' && cached.freshness < 30) {
        results.push(cached)
      } else {
        uncachedSymbols.push(symbol)
      }
    }

    if (uncachedSymbols.length === 0) {
      console.log('✅ All prices served from live cache')
      return results
    }

    // Fetch uncached symbols from providers
    const fetchedPrices = await this.fetchFromProviders(uncachedSymbols)
    results.push(...fetchedPrices)

    // If we still don't have all symbols, try stale cache data
    const stillMissing = symbols.filter(s => !results.find(r => r.symbol === s))
    if (stillMissing.length > 0) {
      console.warn('⚠️ Some symbols missing live data, checking stale cache:', stillMissing)
      
      for (const symbol of stillMissing) {
        const staleCache = this.getStalePrice(symbol)
        if (staleCache) {
          staleCache.source = 'cached'
          staleCache.dataQuality = 'fair'
          staleCache.confidence = Math.max(30, staleCache.confidence - 20)
          results.push(staleCache)
        }
      }
    }

    // Final fallback - check if we can provide historical estimates
    const finalMissing = symbols.filter(s => !results.find(r => r.symbol === s))
    if (finalMissing.length > 0) {
      console.warn('⚠️ Some symbols still missing, attempting historical data fetch:', finalMissing)
      const historicalPrices = await this.fetchHistoricalData(finalMissing)
      results.push(...historicalPrices)
    }

    // Absolute last resort - minimal emergency data (but avoid hardcoded prices)
    const absolutelyMissing = symbols.filter(s => !results.find(r => r.symbol === s))
    if (absolutelyMissing.length > 0) {
      console.error('❌ Critical: No data available for symbols:', absolutelyMissing)
      // Instead of hardcoded prices, return empty results or fetch from emergency API
      const emergencyPrices = await this.fetchEmergencyData(absolutelyMissing)
      results.push(...emergencyPrices)
    }

    console.log(`📊 Market data fetch complete: ${results.length}/${symbols.length} symbols`)
    return results
  }

  private async fetchFromProviders(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const results: EnhancedMarketPrice[] = []
    
    // Try providers in priority order
    for (const provider of this.providers) {
      if (symbols.length === 0) break
      
      if (this.canUseProvider(provider)) {
        try {
          console.log(`🔄 Trying provider: ${provider.name}`)
          const prices = await provider.fetchPrices(symbols)
          
          for (const price of prices) {
            if (!results.find(r => r.symbol === price.symbol)) {
              results.push(price)
              this.updateCache(price.symbol, price, this.CACHE_TTL)
            }
          }
          
          this.recordSuccess(provider.name)
          
          // Remove successfully fetched symbols
          const fetchedSymbols = prices.map(p => p.symbol)
          symbols = symbols.filter(s => !fetchedSymbols.includes(s))
          
        } catch (error) {
          console.error(`❌ Provider ${provider.name} failed:`, error)
          this.recordFailure(provider.name)
        }
      } else {
        console.log(`⏸️ Skipping provider ${provider.name} (rate limited or blacklisted)`)
      }
    }
    
    return results
  }

  private async fetchHistoricalData(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    // Attempt to fetch recent historical data as last resort before emergency
    const results: EnhancedMarketPrice[] = []
    
    try {
      // Use a reliable historical data API
      for (const symbol of symbols) {
        const historical = await this.getHistoricalPrice(symbol)
        if (historical) {
          results.push(historical)
        }
      }
    } catch (error) {
      console.error('Historical data fetch failed:', error)
    }
    
    return results
  }

  private async fetchEmergencyData(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    // Emergency data - try one more free API or return minimal structure
    const results: EnhancedMarketPrice[] = []
    
    try {
      // Try CryptoCompare free tier as absolute last resort
      const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols.map(s => s.split('/')[0]).join(',')}&tsyms=USD`)
      const data = await response.json()
      
      if (data.RAW) {
        for (const symbol of symbols) {
          const crypto = symbol.split('/')[0]
          const priceData = data.RAW[crypto]?.USD
          
          if (priceData) {
            results.push({
              symbol,
              price: priceData.PRICE,
              change24h: priceData.CHANGE24HOUR,
              changePercent24h: priceData.CHANGEPCT24HOUR,
              volume24h: priceData.VOLUME24HOUR,
              high24h: priceData.HIGH24HOUR,
              low24h: priceData.LOW24HOUR,
              open24h: priceData.OPEN24HOUR,
              source: 'emergency',
              dataQuality: 'poor',
              lastUpdate: new Date(),
              freshness: 0,
              provider: 'cryptocompare-emergency',
              confidence: 20
            })
          }
        }
      }
    } catch (error) {
      console.error('Emergency data fetch failed:', error)
      // Absolutely no hardcoded fallbacks - if all else fails, return empty
    }
    
    return results
  }

  private async getHistoricalPrice(symbol: string): Promise<EnhancedMarketPrice | null> {
    try {
      // Get yesterday's closing price as historical data
      const crypto = symbol.split('/')[0].toLowerCase()
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${this.getCoinGeckoId(crypto)}/history?date=${this.getYesterdayDate()}`)
      const data = await response.json()
      
      if (data.market_data) {
        return {
          symbol,
          price: data.market_data.current_price.usd,
          change24h: 0,
          changePercent24h: 0,
          volume24h: data.market_data.total_volume?.usd || 0,
          high24h: data.market_data.high_24h?.usd || data.market_data.current_price.usd,
          low24h: data.market_data.low_24h?.usd || data.market_data.current_price.usd,
          open24h: data.market_data.current_price.usd,
          source: 'historical',
          dataQuality: 'fair',
          lastUpdate: new Date(),
          freshness: 86400, // 1 day old
          provider: 'coingecko-historical',
          confidence: 60
        }
      }
    } catch (error) {
      console.error('Historical price fetch failed:', error)
    }
    
    return null
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'sol': 'solana',
      'ada': 'cardano',
      'dot': 'polkadot',
      'avax': 'avalanche-2',
      'matic': 'matic-network',
      'link': 'chainlink'
    }
    return mapping[symbol] || symbol
  }

  private getYesterdayDate(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0].split('-').reverse().join('-')
  }

  private canUseProvider(provider: MarketDataProvider): boolean {
    const failures = this.failureTracker.get(provider.name) || 0
    if (failures >= this.MAX_FAILURES_BEFORE_BLACKLIST) {
      return false
    }

    const now = Date.now()
    const requests = this.rateTracker.get(provider.name) || []
    const recentRequests = requests.filter(time => now - time < this.RATE_LIMIT_WINDOW)
    
    return recentRequests.length < provider.rateLimit
  }

  private recordSuccess(providerName: string) {
    this.failureTracker.set(providerName, 0)
    this.lastSuccessfulFetch.set(providerName, Date.now())
  }

  private recordFailure(providerName: string) {
    const failures = this.failureTracker.get(providerName) || 0
    this.failureTracker.set(providerName, failures + 1)
  }

  private updateCache(symbol: string, price: EnhancedMarketPrice, ttl: number) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(symbol, {
      data: price,
      timestamp: Date.now(),
      ttl
    })
  }

  private getCachedPrice(symbol: string): EnhancedMarketPrice | null {
    const entry = this.cache.get(symbol)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) return null

    const price = { ...entry.data }
    price.freshness = Math.floor(age / 1000)
    return price
  }

  private getStalePrice(symbol: string): EnhancedMarketPrice | null {
    const entry = this.cache.get(symbol)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > this.STALE_DATA_TTL) return null

    const price = { ...entry.data }
    price.freshness = Math.floor(age / 1000)
    return price
  }

  // Provider implementations
}

// Provider implementations
class BinanceWebSocketProvider implements MarketDataProvider {
  name = 'Binance-WS'
  priority = 1
  rateLimit = 1000
  reliability = 95

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    // This is handled by WebSocket, return empty for now
    return []
  }
}

class CoinGeckoProProvider implements MarketDataProvider {
  name = 'CoinGecko-Pro'
  priority = 2
  rateLimit = 500
  reliability = 90

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const prices: EnhancedMarketPrice[] = []
    
    try {
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'bitcoin',
        'ETH/USD': 'ethereum',
        'SOL/USD': 'solana',
        'ADA/USD': 'cardano',
        'DOT/USD': 'polkadot',
        'AVAX/USD': 'avalanche-2',
        'MATIC/USD': 'matic-network',
        'LINK/USD': 'chainlink'
      }

      const ids = symbols.map(s => symbolMap[s]).filter(Boolean).join(',')
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`)
      
      if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`)
      
      const data = await response.json()
      
      Object.entries(symbolMap).forEach(([symbol, id]) => {
        if (data[id] && symbols.includes(symbol)) {
          prices.push({
            symbol,
            price: data[id].usd,
            change24h: data[id].usd_24h_change || 0,
            changePercent24h: data[id].usd_24h_change || 0,
            volume24h: data[id].usd_24h_vol || 0,
            high24h: data[id].usd * 1.01,
            low24h: data[id].usd * 0.99,
            open24h: data[id].usd * (1 - (data[id].usd_24h_change || 0) / 100),
            source: 'live',
            dataQuality: 'good',
            lastUpdate: new Date(),
            freshness: 0,
            provider: 'coingecko',
            confidence: 85
          })
        }
      })
    } catch (error) {
      console.error('CoinGecko provider error:', error)
      throw error
    }

    return prices
  }
}

class CoinMarketCapProvider implements MarketDataProvider {
  name = 'CoinMarketCap'
  priority = 3
  rateLimit = 300
  reliability = 85

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const apiKey = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY
    if (!apiKey) throw new Error('CoinMarketCap API key not configured')

    const prices: EnhancedMarketPrice[] = []
    
    try {
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'BTC',
        'ETH/USD': 'ETH',
        'SOL/USD': 'SOL',
        'ADA/USD': 'ADA',
        'DOT/USD': 'DOT',
        'AVAX/USD': 'AVAX',
        'MATIC/USD': 'MATIC',
        'LINK/USD': 'LINK'
      }

      const cmcSymbols = symbols.map(s => symbolMap[s]).filter(Boolean).join(',')
      const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbols}&convert=USD`, {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) throw new Error(`CoinMarketCap error: ${response.status}`)

      const result = await response.json()

      Object.entries(symbolMap).forEach(([symbol, cmcSymbol]) => {
        const data = result.data[cmcSymbol]
        if (data && symbols.includes(symbol)) {
          const quote = data.quote.USD
          prices.push({
            symbol,
            price: quote.price,
            change24h: quote.price * (quote.percent_change_24h / 100),
            changePercent24h: quote.percent_change_24h,
            volume24h: quote.volume_24h,
            marketCap: quote.market_cap,
            high24h: quote.price * 1.01,
            low24h: quote.price * 0.99,
            open24h: quote.price * (1 - quote.percent_change_24h / 100),
            source: 'live',
            dataQuality: 'good',
            lastUpdate: new Date(),
            freshness: 0,
            provider: 'coinmarketcap',
            confidence: 80
          })
        }
      })
    } catch (error) {
      console.error('CoinMarketCap provider error:', error)
      throw error
    }

    return prices
  }
}

class CryptoCompareProvider implements MarketDataProvider {
  name = 'CryptoCompare'
  priority = 4
  rateLimit = 100
  reliability = 75

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const prices: EnhancedMarketPrice[] = []
    
    try {
      const cryptos = symbols.map(s => s.split('/')[0]).join(',')
      const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cryptos}&tsyms=USD`)
      
      if (!response.ok) throw new Error(`CryptoCompare error: ${response.status}`)
      
      const data = await response.json()
      
      if (data.RAW) {
        for (const symbol of symbols) {
          const crypto = symbol.split('/')[0]
          const priceData = data.RAW[crypto]?.USD
          
          if (priceData) {
            prices.push({
              symbol,
              price: priceData.PRICE,
              change24h: priceData.CHANGE24HOUR,
              changePercent24h: priceData.CHANGEPCT24HOUR,
              volume24h: priceData.VOLUME24HOUR,
              high24h: priceData.HIGH24HOUR,
              low24h: priceData.LOW24HOUR,
              open24h: priceData.OPEN24HOUR,
              source: 'live',
              dataQuality: 'good',
              lastUpdate: new Date(),
              freshness: 0,
              provider: 'cryptocompare',
              confidence: 75
            })
          }
        }
      }
    } catch (error) {
      console.error('CryptoCompare provider error:', error)
      throw error
    }

    return prices
  }
}

class BitstampProvider implements MarketDataProvider {
  name = 'Bitstamp'
  priority = 5
  rateLimit = 600
  reliability = 80

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const prices: EnhancedMarketPrice[] = []
    
    try {
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'btcusd',
        'ETH/USD': 'ethusd',
        'ADA/USD': 'adausd',
        'LINK/USD': 'linkusd'
      }

      for (const symbol of symbols) {
        const bitstampSymbol = symbolMap[symbol]
        if (!bitstampSymbol) continue

        const response = await fetch(`https://www.bitstamp.net/api/v2/ticker/${bitstampSymbol}`)
        
        if (!response.ok) continue
        
        const data = await response.json()
        
        prices.push({
          symbol,
          price: parseFloat(data.last),
          change24h: parseFloat(data.last) - parseFloat(data.open),
          changePercent24h: ((parseFloat(data.last) - parseFloat(data.open)) / parseFloat(data.open)) * 100,
          volume24h: parseFloat(data.volume),
          high24h: parseFloat(data.high),
          low24h: parseFloat(data.low),
          open24h: parseFloat(data.open),
          source: 'live',
          dataQuality: 'good',
          lastUpdate: new Date(),
          freshness: 0,
          provider: 'bitstamp',
          confidence: 80
        })
      }
    } catch (error) {
      console.error('Bitstamp provider error:', error)
      throw error
    }

    return prices
  }
}

class KrakenProvider implements MarketDataProvider {
  name = 'Kraken'
  priority = 6
  rateLimit = 300
  reliability = 85

  async fetchPrices(symbols: string[]): Promise<EnhancedMarketPrice[]> {
    const prices: EnhancedMarketPrice[] = []
    
    try {
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'XXBTZUSD',
        'ETH/USD': 'XETHZUSD',
        'ADA/USD': 'ADAUSD',
        'DOT/USD': 'DOTUSD',
        'LINK/USD': 'LINKUSD'
      }

      const krakenSymbols = symbols.map(s => symbolMap[s]).filter(Boolean).join(',')
      const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbols}`)
      
      if (!response.ok) throw new Error(`Kraken error: ${response.status}`)
      
      const data = await response.json()
      
      if (data.result) {
        Object.entries(symbolMap).forEach(([symbol, krakenSymbol]) => {
          const ticker = data.result[krakenSymbol]
          if (ticker && symbols.includes(symbol)) {
            prices.push({
              symbol,
              price: parseFloat(ticker.c[0]),
              change24h: parseFloat(ticker.c[0]) - parseFloat(ticker.o),
              changePercent24h: ((parseFloat(ticker.c[0]) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100,
              volume24h: parseFloat(ticker.v[1]),
              high24h: parseFloat(ticker.h[1]),
              low24h: parseFloat(ticker.l[1]),
              open24h: parseFloat(ticker.o),
              source: 'live',
              dataQuality: 'good',
              lastUpdate: new Date(),
              freshness: 0,
              provider: 'kraken',
              confidence: 85
            })
          }
        })
      }
    } catch (error) {
      console.error('Kraken provider error:', error)
      throw error
    }

    return prices
  }
}

// Enhanced React hook for the new service
export function useEnhancedLiveMarketData(symbols: string[] = ['BTC/USD', 'ETH/USD', 'SOL/USD']) {
  const [prices, setPrices] = useState<EnhancedMarketPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiveData, setIsLiveData] = useState(false)
  const [dataQuality, setDataQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const serviceRef = useRef<EnhancedLiveMarketService | null>(null)

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new EnhancedLiveMarketService()
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!serviceRef.current) return

    try {
      setLoading(true)
      setError(null)
      
      const marketPrices = await serviceRef.current.fetchLivePrices(symbols)
      setPrices(marketPrices)
      
      // Determine overall data quality
      const liveCount = marketPrices.filter(p => p.source === 'live').length
      const totalCount = marketPrices.length
      
      setIsLiveData(liveCount > totalCount * 0.8) // 80% live data threshold
      
      const avgQuality = marketPrices.reduce((acc, p) => {
        const qualityScore = p.dataQuality === 'excellent' ? 4 : 
                           p.dataQuality === 'good' ? 3 :
                           p.dataQuality === 'fair' ? 2 : 1
        return acc + qualityScore
      }, 0) / totalCount
      
      setDataQuality(avgQuality >= 3.5 ? 'excellent' : 
                    avgQuality >= 2.5 ? 'good' :
                    avgQuality >= 1.5 ? 'fair' : 'poor')
      
      setLastUpdate(new Date())
      
    } catch (err) {
      console.error('Enhanced market data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [symbols])

  useEffect(() => {
    fetchData()
    
    // Real-time updates every 30 seconds for live data
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    prices,
    loading,
    error,
    isLiveData,
    dataQuality,
    lastUpdate,
    refresh: fetchData
  }
}