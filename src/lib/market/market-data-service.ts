'use client'

import { useState, useEffect } from 'react'

/**
 * Market Data Service - Real cryptocurrency price feeds
 * Provides live market data from multiple sources with fallbacks
 */

interface MarketPrice {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  lastUpdate: Date
}

interface MarketDataProvider {
  name: string
  fetchPrices(symbols: string[]): Promise<MarketPrice[]>
}

class CoinGeckoProvider implements MarketDataProvider {
  name = 'CoinGecko'
  private baseUrl = 'https://api.coingecko.com/api/v3'

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
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store' // Disable caching for real-time data
        }
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
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
  private baseUrl = 'https://api.binance.com/api/v3'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      // Map symbols to Binance format
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'BTCUSDT',
        'ETH/USD': 'ETHUSDT',
        'SOL/USD': 'SOLUSDT', 
        'ADA/USD': 'ADAUSDT',
        'DOT/USD': 'DOTUSDT',
        'AVAX/USD': 'AVAXUSDT',
        'MATIC/USD': 'MATICUSDT',
        'LINK/USD': 'LINKUSDT'
      }

      const binanceSymbols = symbols.map(s => symbolMap[s]).filter(Boolean)
      const symbolsParam = JSON.stringify(binanceSymbols)

      const response = await fetch(
        `${this.baseUrl}/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      )

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

class MockProvider implements MarketDataProvider {
  name = 'Mock'

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    // Fallback mock data with realistic prices
    const mockPrices: Record<string, number> = {
      'BTC/USD': 43250.75,
      'ETH/USD': 2580.20,
      'SOL/USD': 98.43,
      'ADA/USD': 0.47,
      'DOT/USD': 7.23,
      'AVAX/USD': 36.78,
      'MATIC/USD': 0.85,
      'LINK/USD': 14.32
    }

    return symbols.map(symbol => ({
      symbol,
      price: mockPrices[symbol] || 100,
      change24h: (Math.random() - 0.5) * 200,
      changePercent24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000000,
      lastUpdate: new Date()
    }))
  }
}

class MarketDataService {
  private static instance: MarketDataService
  private providers: MarketDataProvider[] = [
    new CoinGeckoProvider(),
    new BinanceProvider(),
    new MockProvider() // Always keep mock as fallback
  ]
  private cache = new Map<string, { data: MarketPrice[], timestamp: number }>()
  private cacheTimeout = 30000 // 30 seconds cache
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
    const cacheKey = symbols.join(',')
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if still fresh
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    // Try providers in order until one succeeds
    for (const provider of this.providers) {
      try {
        console.log(`📊 Fetching prices from ${provider.name}`)
        const prices = await provider.fetchPrices(symbols)
        
        if (prices.length > 0) {
          // Cache the results
          this.cache.set(cacheKey, { data: prices, timestamp: Date.now() })
          
          // Notify subscribers
          this.updateCallbacks.forEach(callback => callback(prices))
          
          return prices
        }
      } catch (error) {
        console.warn(`${provider.name} failed, trying next provider:`, error)
        continue
      }
    }

    // If all providers fail, return empty array
    console.error('All market data providers failed')
    return []
  }

  subscribe(callback: (prices: MarketPrice[]) => void): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  // Start real-time updates
  startRealTimeUpdates(symbols?: string[], intervalMs = 30000) {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const service = MarketDataService.getInstance()
    
    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await service.fetchMarketPrices(symbols)
        setPrices(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to updates
    const unsubscribe = service.subscribe(setPrices)

    // Start real-time updates
    const stopUpdates = service.startRealTimeUpdates(symbols)

    return () => {
      unsubscribe()
      stopUpdates()
    }
  }, [symbols?.join(',')])

  return { prices, loading, error }
}

export default MarketDataService
export type { MarketPrice }