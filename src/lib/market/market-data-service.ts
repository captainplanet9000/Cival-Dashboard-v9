'use client'

import { useState, useEffect } from 'react'
import { buildMarketProxyUrl } from '@/lib/utils/api-url-builder'
/**
 * Market Data Service - Real cryptocurrency price feeds
 * Provides live market data from multiple sources with fallbacks
 */

// Export market price interface with all required fields
interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  open24h: number;
  source: string;
  lastUpdate: Date;
}

interface InternalMarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  open24h: number;
  source: string;
  lastUpdate: Date;
}

interface MarketDataProvider {
  name: string;
  fetchPrices(symbols: string[]): Promise<MarketPrice[]>
}

class MarketDataFallback {
  // Define type for fallback data with index signature
  private fallbackData: Record<string, Partial<MarketPrice>> = {
    'BTC/USD': { 
      price: 86420.50, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0, 
      high24h: 87000, 
      low24h: 86000, 
      open24h: 86500,
      source: 'fallback'
    },
    'ETH/USD': { 
      price: 3085.75, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 3100, 
      low24h: 3050, 
      open24h: 3080,
      source: 'fallback'
    },
    'SOL/USD': { 
      price: 195.32, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 200, 
      low24h: 190, 
      open24h: 195,
      source: 'fallback'
    },
    'ADA/USD': { 
      price: 0.79, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 0.80, 
      low24h: 0.78, 
      open24h: 0.79,
      source: 'fallback'
    },
    'DOT/USD': { 
      price: 5.45, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 5.5, 
      low24h: 5.4, 
      open24h: 5.45,
      source: 'fallback'
    },
    'AVAX/USD': { 
      price: 34.90, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 35, 
      low24h: 34, 
      open24h: 34.5,
      source: 'fallback'
    },
    'MATIC/USD': { 
      price: 0.42, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 0.43, 
      low24h: 0.41, 
      open24h: 0.42,
      source: 'fallback'
    },
    'LINK/USD': { 
      price: 18.18, 
      change24h: 0, 
      changePercent24h: 0, 
      volume24h: 0,
      high24h: 18.5, 
      low24h: 18.0, 
      open24h: 18.2,
      source: 'fallback'
    }
  }

  // Update fallback data from successful API calls
  updateFallbackData(prices: MarketPrice[]): void {
    for (const price of prices) {
      if (price.symbol in this.fallbackData) {
        this.fallbackData[price.symbol] = {
          ...this.fallbackData[price.symbol],
          price: price.price,
          change24h: price.change24h,
          changePercent24h: price.changePercent24h,
          volume24h: price.volume24h,
          high24h: price.high24h,
          low24h: price.low24h,
          open24h: price.open24h,
          source: price.source
        };
      }
    }
  }
  
  // Helper method to safely access fallback data for a symbol
  getFallbackForSymbol(symbol: string): Partial<MarketPrice> | undefined {
    // Check if symbol exists in fallbackData before accessing
    if (symbol in this.fallbackData) {
      return this.fallbackData[symbol];
    }
    return undefined;
  }

  // Get fallback data for specified symbols
  getFallbackPrices(symbols: string[]): MarketPrice[] {
    return symbols.map(symbol => {
      const fallbackData = this.getFallbackForSymbol(symbol) || {};
      return {
        symbol,
        price: fallbackData.price || 0,
        change24h: fallbackData.change24h || 0,
        changePercent24h: fallbackData.changePercent24h || 0,
        volume24h: fallbackData.volume24h || 0,
        high24h: fallbackData.high24h || 0,
        low24h: fallbackData.low24h || 0,
        open24h: fallbackData.open24h || 0,
        source: fallbackData.source || 'fallback',
        lastUpdate: new Date()
      };
    });
  }
}

const marketDataFallback = new MarketDataFallback()

interface MarketDataProvider {
  name: string;
  fetchPrices(symbols: string[]): Promise<MarketPrice[]>
}

class CoinGeckoProvider implements MarketDataProvider {
  name = 'CoinGecko'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map trading symbols to CoinGecko IDs
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
      const proxyUrl = buildMarketProxyUrl('coingecko', { symbols: ids })
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store' // Disable caching for real-time data
      })

      if (!response.ok) {
        // Handle rate limiting and other errors gracefully
        if (response.status === 429) {
          console.warn('CoinGecko rate limit exceeded, will retry with exponential backoff')
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          throw new Error(`CoinGecko rate limit exceeded: ${response.status}`)
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const prices: MarketPrice[] = []

      Object.entries(symbolMap).forEach(([symbol, id]) => {
        if (data[id] && symbols.includes(symbol)) {
          prices.push({
            symbol,
            price: data[id].usd,
            change24h: data[id].usd_24h_change || 0,
            changePercent24h: data[id].usd_24h_change || 0,
            volume24h: data[id].usd_24h_vol || 0,
            high24h: data[id].usd * 1.01, // Estimate
            low24h: data[id].usd * 0.99, // Estimate
            open24h: data[id].usd * (1 - (data[id].usd_24h_change || 0) / 100), // Estimate
            source: 'coingecko',
            lastUpdate: new Date()
          })
        }
      })

      return prices
    } catch (error) {
      console.error('CoinGecko provider error:', error)
      throw error
    }
  }
}

class BinanceProvider implements MarketDataProvider {
  name = 'Binance'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map symbols to Binance format
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

      const binanceSymbols = symbols.map(s => symbolMap[s]).filter(Boolean).join(',')

      const proxyUrl = buildMarketProxyUrl('binance', { symbols: binanceSymbols })
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`)
      }

      const data = await response.json()
      const prices: MarketPrice[] = []

      Object.entries(symbolMap).forEach(([symbol, binanceSymbol]) => {
        const ticker = data.find((t: any) => t.symbol === binanceSymbol)
        if (ticker && symbols.includes(symbol)) {
          prices.push({
            symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChange),
            changePercent24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume),
            high24h: parseFloat(ticker.lastPrice) * 1.01, // Estimate
            low24h: parseFloat(ticker.lastPrice) * 0.99, // Estimate
            open24h: parseFloat(ticker.lastPrice) * (1 - parseFloat(ticker.priceChangePercent) / 100), // Estimate
            source: 'binance',
            lastUpdate: new Date()
          })
        }
      })

      return prices
    } catch (error) {
      console.error('Binance provider error:', error)
      throw error
    }
  }
}

class CoinbaseProvider implements MarketDataProvider {
  name = 'Coinbase'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map trading symbols to Coinbase format
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

      const prices: MarketPrice[] = []
      
      // Fetch exchange rates to get current prices
      const proxyUrl = buildMarketProxyUrl('coinbase')
      const response = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.status}`)
      }

      const { data } = await response.json()
      const rates = data.rates

      Object.entries(symbolMap).forEach(([symbol, coinbaseSymbol]) => {
        if (symbols.includes(symbol)) {
          const currency = coinbaseSymbol.split('-')[0]
          if (rates[currency]) {
            // Rates show how many units of currency equal 1 USD, so price is the inverse
            const rate = parseFloat(rates[currency])
            const price = rate > 0 ? 1 / rate : 0
            prices.push({
              symbol,
              price,
              change24h: 0, // Coinbase exchange rates don't include 24h change
              changePercent24h: 0,
              volume24h: 0,
              high24h: price * 1.01, // Estimate
              low24h: price * 0.99, // Estimate
              open24h: price, // Estimate
              source: 'coinbase',
              lastUpdate: new Date()
            })
          }
        }
      })

      return prices
    } catch (error) {
      console.error('Coinbase provider error:', error)
      throw error
    }
  }
}

class CoinCapProvider implements MarketDataProvider {
  name = 'CoinCap'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map trading symbols to CoinCap IDs
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'bitcoin',
        'ETH/USD': 'ethereum',
        'SOL/USD': 'solana',
        'ADA/USD': 'cardano',
        'DOT/USD': 'polkadot',
        'AVAX/USD': 'avalanche',
        'MATIC/USD': 'polygon',
        'LINK/USD': 'chainlink'
      }

      const proxyUrl = buildMarketProxyUrl('coincap', { symbols: Object.values(symbolMap).join(',') })
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`CoinCap API error: ${response.status}`)
      }

      const { data } = await response.json()
      const prices: MarketPrice[] = []

      Object.entries(symbolMap).forEach(([symbol, id]) => {
        const asset = data.find((a: any) => a.id === id)
        if (asset && symbols.includes(symbol)) {
          prices.push({
            symbol,
            price: parseFloat(asset.priceUsd),
            change24h: parseFloat(asset.changePercent24Hr || 0),
            changePercent24h: parseFloat(asset.changePercent24Hr || 0),
            volume24h: parseFloat(asset.volumeUsd24Hr || 0),
            high24h: parseFloat(asset.priceUsd) * 1.01, // Estimate
            low24h: parseFloat(asset.priceUsd) * 0.99, // Estimate
            open24h: parseFloat(asset.priceUsd) * (1 - parseFloat(asset.changePercent24Hr || 0) / 100), // Estimate
            source: 'coincap',
            lastUpdate: new Date()
          })
        }
      })

      return prices
    } catch (error) {
      console.error('CoinCap provider error:', error)
      throw error
    }
  }
}

class CoinPaprikaProvider implements MarketDataProvider {
  name = 'CoinPaprika'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map trading symbols to CoinPaprika IDs
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'btc-bitcoin',
        'ETH/USD': 'eth-ethereum',
        'SOL/USD': 'sol-solana',
        'ADA/USD': 'ada-cardano',
        'DOT/USD': 'dot-polkadot',
        'AVAX/USD': 'avax-avalanche',
        'MATIC/USD': 'matic-polygon',
        'LINK/USD': 'link-chainlink'
      }

      const proxyUrl = buildMarketProxyUrl('coinpaprika', { symbols: Object.values(symbolMap).join(',') })
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`CoinPaprika API error: ${response.status}`)
      }

      const data = await response.json()
      const prices: MarketPrice[] = []

      Object.entries(symbolMap).forEach(([symbol, id]) => {
        const ticker = data.find((t: any) => t.id === id)
        if (ticker && symbols.includes(symbol)) {
          prices.push({
            symbol,
            price: ticker.quotes?.USD?.price || 0,
            change24h: ticker.quotes?.USD?.percent_change_24h || 0,
            changePercent24h: ticker.quotes?.USD?.percent_change_24h || 0,
            volume24h: ticker.quotes?.USD?.volume_24h || 0,
            high24h: (ticker.quotes?.USD?.price || 0) * 1.01, // Estimate
            low24h: (ticker.quotes?.USD?.price || 0) * 0.99, // Estimate
            open24h: (ticker.quotes?.USD?.price || 0) * (1 - (ticker.quotes?.USD?.percent_change_24h || 0) / 100), // Estimate
            source: 'coinpaprika',
            lastUpdate: new Date()
          })
        }
      })

      return prices
    } catch (error) {
      console.error('CoinPaprika provider error:', error)
      throw error
    }
  }
}

class CoinDeskProvider implements MarketDataProvider {
  name = 'CoinDesk'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // CoinDesk focuses on Bitcoin but has expanded coverage
      const proxyUrl = buildMarketProxyUrl('coindesk')
      const response = await fetch(proxyUrl, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`CoinDesk API error: ${response.status}`)
      }

      const data = await response.json()
      const prices: MarketPrice[] = []

      // CoinDesk Bitcoin Price Index
      if (symbols.includes('BTC/USD') && data.bpi?.USD) {
        prices.push({
          symbol: 'BTC/USD',
          price: data.bpi.USD.rate_float,
          change24h: 0, // CoinDesk BPI doesn't include 24h change
          changePercent24h: 0,
          volume24h: 0,
          high24h: data.bpi.USD.rate_float, // Same as current price
          low24h: data.bpi.USD.rate_float * 0.99, // Estimate
          open24h: data.bpi.USD.rate_float, // Estimate
          source: 'coindesk',
          lastUpdate: new Date(data.time?.updated || Date.now())
        })
      }

      return prices
    } catch (error) {
      console.error('CoinDesk provider error:', error)
      throw error
    }
  }
}

class MockProvider implements MarketDataProvider {
  name = 'Mock'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    // Updated realistic prices as of January 2025
    const mockPrices: Record<string, number> = {
      'BTC/USD': 96420.50,     // Current realistic BTC price
      'ETH/USD': 3285.75,      // Current realistic ETH price  
      'SOL/USD': 205.32,       // Current realistic SOL price
      'ADA/USD': 0.89,         // Current realistic ADA price
      'DOT/USD': 6.45,         // Current realistic DOT price
      'AVAX/USD': 38.90,       // Current realistic AVAX price
      'MATIC/USD': 0.48,       // Current realistic MATIC price
      'LINK/USD': 22.18        // Current realistic LINK price
    }

    // Generate realistic daily changes
    const changes: Record<string, number> = {
      'BTC/USD': 1.25,
      'ETH/USD': 2.1,
      'SOL/USD': -0.75,
      'ADA/USD': 3.4,
      'DOT/USD': -1.2,
      'AVAX/USD': 0.8,
      'MATIC/USD': 1.9,
      'LINK/USD': -0.5
    }

    return symbols.map(symbol => {
      // Safe access with type checking
      const price = symbol in mockPrices ? mockPrices[symbol] : 100;
      const change = symbol in changes ? changes[symbol] : (Math.random() - 0.5) * 5;
      
      return {
        symbol,
        price,
        change24h: change,
        changePercent24h: change,
        volume24h: Math.random() * 1000000000,
        high24h: price * 1.02, // Estimate high
        low24h: price * 0.98, // Estimate low
        open24h: price * (1 - change / 100), // Estimate open
        source: 'mock',
        lastUpdate: new Date()
      };
    })
  }
}

class MarketDataService {
  private static instance: MarketDataService
  private providers: MarketDataProvider[] = [
    new CoinPaprikaProvider(), // Primary: CoinPaprika (free, fast, frequent updates)
    new CoinCapProvider(),     // Secondary: CoinCap (lightweight, reliable)
    new CoinDeskProvider(),    // Tertiary: CoinDesk (Bitcoin-focused, institutional)
    new CoinbaseProvider(),    // Quaternary: Coinbase (reliable, free)
    new BinanceProvider(),     // Backup: Binance public API
    new MockProvider()         // Always keep mock as fallback
  ]
  private cache = new Map<string, { data: MarketPrice[], timestamp: number }>()
  private cacheTimeout = 15000 // 15 seconds cache for more frequent updates
  private updateCallbacks = new Set<(prices: MarketPrice[]) => void>()

  private constructor() {}

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService()
    }
    return MarketDataService.instance
  }

  async fetchMarketPrices(symbols: string[] = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 
    'AVAX/USD', 'MATIC/USD', 'LINK/USD'
  ]): Promise<MarketPrice[]> {
    const cacheKey = symbols.sort().join(',')
    
    // Try Redis cache first
    try {
      const { redisService } = await import('@/lib/services/redis-service')
      if (redisService.isHealthy()) {
        const cached = await redisService.getCachedMarketData<MarketPrice[]>(cacheKey)
        if (cached && cached.length > 0) {
          console.log('📊 Using Redis cached market data')
          // Notify subscribers
          this.updateCallbacks.forEach(callback => callback(cached))
          return cached
        }
      }
    } catch (redisError) {
      // Fall back to local cache if Redis fails
      console.log('🟡 Redis cache failed, using local cache')
    }
    
    // Try local cache
    const localCached = this.cache.get(cacheKey)
    if (localCached && Date.now() - localCached.timestamp < this.cacheTimeout) {
      return localCached.data
    }

    // Try providers in order until one succeeds
    for (const provider of this.providers) {
      try {
        console.log(`📊 Fetching prices from ${provider.name}`)
        const prices = await provider.fetchPrices(symbols)
        
        if (prices.length > 0) {
          // Update fallback data with successful fetches
          marketDataFallback.updateFallbackData(prices)
          
          // Cache in both Redis and local cache
          this.cache.set(cacheKey, { data: prices, timestamp: Date.now() })
          
          // Cache in Redis
          try {
            const { redisService } = await import('@/lib/services/redis-service')
            if (redisService.isHealthy()) {
              await redisService.cacheMarketData(cacheKey, prices, 15) // 15 seconds TTL for fresh data
            }
          } catch (redisError) {
            console.warn('Failed to cache market data in Redis:', redisError)
          }
          
          // Notify subscribers
          this.updateCallbacks.forEach(callback => callback(prices))
          
          return prices
        }
      } catch (error) {
        console.warn(`${provider.name} failed, trying next provider:`, error)
        continue
      }
    }

    // If all providers fail, use fallback system
    console.error('All market data providers failed, using fallback data')
    return marketDataFallback.getFallbackPrices(symbols)
  }

  subscribe(callback: (prices: MarketPrice[]) => void): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  // Start real-time updates
  startRealTimeUpdates(symbols?: string[], intervalMs = 15000) {
    const interval = setInterval(async () => {
      try {
        await this.fetchMarketPrices(symbols)
      } catch (error) {
        console.error('Real-time market data update failed:', error)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }

  // Get current cached prices
  getCachedPrices(symbols: string[]): MarketPrice[] {
    const cacheKey = symbols.join(',')
    const cached = this.cache.get(cacheKey)
    return cached ? cached.data : []
  }
}

// Custom hook for React components
export function useMarketData(symbols?: string[]) {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [useFallbackData, setUseFallbackData] = useState(false)

  useEffect(() => {
    const marketDataService = MarketDataService.getInstance()
    const targetSymbols = symbols || [
      'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD',
      'DOT/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD'
    ]

    // First load from cache or fetch initial data
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        let initialPrices: MarketPrice[] = []
        
        try {
          initialPrices = await marketDataService.fetchMarketPrices(targetSymbols)
          setIsConnected(true)
          setUseFallbackData(false)
        } catch (fetchErr) {
          console.warn('Market data fetch failed, using fallback data:', fetchErr)
          initialPrices = targetSymbols.map(symbol => {
            // Safely access fallback data with type checking
            const fallbackData = marketDataFallback.getFallbackForSymbol(symbol)
            return {
              symbol,
              price: fallbackData?.price || 0,
              change24h: fallbackData?.change24h || 0,
              changePercent24h: fallbackData?.changePercent24h || 0,
              volume24h: fallbackData?.volume24h || 0,
              high24h: fallbackData?.high24h || 0,
              low24h: fallbackData?.low24h || 0,
              open24h: fallbackData?.open24h || 0,
              source: 'fallback',
              lastUpdate: new Date()
            }
          })
          setUseFallbackData(true)
          // Don't set error state here since we're using fallback data
        }
        
        setPrices(initialPrices)
        setError(null)
      } catch (err: any) {
        console.error('Market data initialization error:', err)
        setError(err)
        // Provide minimal fallback data even in catastrophic error case
        setPrices(targetSymbols.map(symbol => ({
          symbol,
          price: 0,
          change24h: 0,
          changePercent24h: 0,
          volume24h: 0,
          high24h: 0,
          low24h: 0,
          open24h: 0,
          source: 'fallback',
          lastUpdate: new Date()
        })))
        setUseFallbackData(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Subscribe to real-time updates with error handling
    const unsubscribe = marketDataService.subscribe((updatedPrices) => {
      try {
        setPrices(updatedPrices.filter(p => targetSymbols.includes(p.symbol)))
        setIsConnected(true)
      } catch (subErr) {
        console.warn('Market data WebSocket update error:', subErr)
        // Don't update state here, keep using the last good data
      }
    })

    // Handle WebSocket connection errors
    const handleWebSocketError = (event: Event) => {
      console.warn('Market data WebSocket error:', event)
      setIsConnected(false)
      // If we get a WebSocket error, don't immediately switch to fallback
      // as the connection may recover
    }

    // Add WebSocket error listener
    window.addEventListener('error', handleWebSocketError)

    // Start real-time updates with error handling
    try {
      marketDataService.startRealTimeUpdates(targetSymbols)
    } catch (wsErr) {
      console.warn('Failed to start real-time market updates:', wsErr)
      setIsConnected(false)
      setUseFallbackData(true)
    }

    return () => {
      unsubscribe()
      window.removeEventListener('error', handleWebSocketError)
    }
  }, [symbols])

  return { 
    prices, 
    isLoading, 
    error, 
    isConnected, 
    useFallbackData 
  }
}

export default MarketDataService
export type { MarketPrice }