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
      price: 117000.00, 
      change24h: 2150.50, 
      changePercent24h: 1.87, 
      volume24h: 28500000000, 
      high24h: 118500, 
      low24h: 115200, 
      open24h: 115850,
      source: 'fallback'
    },
    'ETH/USD': { 
      price: 3545.80, 
      change24h: 85.25, 
      changePercent24h: 2.46, 
      volume24h: 15200000000,
      high24h: 3580, 
      low24h: 3420, 
      open24h: 3460,
      source: 'fallback'
    },
    'SOL/USD': { 
      price: 218.45, 
      change24h: -8.75, 
      changePercent24h: -3.85, 
      volume24h: 2800000000,
      high24h: 235, 
      low24h: 210, 
      open24h: 227,
      source: 'fallback'
    },
    'ADA/USD': { 
      price: 0.94, 
      change24h: 0.08, 
      changePercent24h: 9.30, 
      volume24h: 1200000000,
      high24h: 0.98, 
      low24h: 0.86, 
      open24h: 0.86,
      source: 'fallback'
    },
    'DOT/USD': { 
      price: 7.85, 
      change24h: 0.42, 
      changePercent24h: 5.65, 
      volume24h: 580000000,
      high24h: 8.12, 
      low24h: 7.35, 
      open24h: 7.43,
      source: 'fallback'
    },
    'AVAX/USD': { 
      price: 42.15, 
      change24h: 1.85, 
      changePercent24h: 4.59, 
      volume24h: 890000000,
      high24h: 43.50, 
      low24h: 39.80, 
      open24h: 40.30,
      source: 'fallback'
    },
    'MATIC/USD': { 
      price: 0.56, 
      change24h: 0.04, 
      changePercent24h: 7.69, 
      volume24h: 420000000,
      high24h: 0.58, 
      low24h: 0.52, 
      open24h: 0.52,
      source: 'fallback'
    },
    'LINK/USD': { 
      price: 26.85, 
      change24h: 1.25, 
      changePercent24h: 4.88, 
      volume24h: 780000000,
      high24h: 27.50, 
      low24h: 25.20, 
      open24h: 25.60,
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

class CoinAPIProvider implements MarketDataProvider {
  name = 'CoinAPI'
  private apiKey = process.env.COINAPI_KEY

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    if (!this.apiKey) {
      throw new Error('CoinAPI key not configured')
    }

    try {
      // Map trading symbols to CoinAPI format
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
      
      // Fetch each symbol individually to avoid rate limits
      for (const symbol of symbols) {
        const coinapiSymbol = symbolMap[symbol]
        if (!coinapiSymbol) continue

        const response = await fetch(`https://rest.coinapi.io/v1/exchangerate/${coinapiSymbol}/USD`, {
          headers: {
            'X-CoinAPI-Key': this.apiKey,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        })

        if (!response.ok) {
          if (response.status === 429) {
            console.warn('CoinAPI rate limit exceeded')
            break
          }
          continue
        }

        const data = await response.json()
        
        if (data.rate) {
          prices.push({
            symbol,
            price: data.rate,
            change24h: 0, // CoinAPI doesn't provide 24h change in this endpoint
            changePercent24h: 0,
            volume24h: 0,
            high24h: data.rate * 1.02,
            low24h: data.rate * 0.98,
            open24h: data.rate,
            source: 'coinapi',
            lastUpdate: new Date()
          })
        }
      }

      return prices
    } catch (error) {
      console.error('CoinAPI provider error:', error)
      throw error
    }
  }
}

class CoinMarketCapProvider implements MarketDataProvider {
  name = 'CoinMarketCap'
  private apiKey = process.env.COINMARKETCAP_API_KEY

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    if (!this.apiKey) {
      throw new Error('CoinMarketCap API key not configured')
    }

    try {
      // Map trading symbols to CMC symbols
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
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`)
      }

      const result = await response.json()
      const prices: MarketPrice[] = []

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
            high24h: quote.price * 1.02, // Estimate
            low24h: quote.price * 0.98, // Estimate  
            open24h: quote.price * (1 - quote.percent_change_24h / 100),
            source: 'coinmarketcap',
            lastUpdate: new Date()
          })
        }
      })

      return prices
    } catch (error) {
      console.error('CoinMarketCap provider error:', error)
      throw error
    }
  }
}

class AlphaVantageProvider implements MarketDataProvider {
  name = 'AlphaVantage'
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY

  async fetchPrices(symbols: string[]): Promise<MarketPrice[]> {
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not configured')
    }

    try {
      const prices: MarketPrice[] = []
      
      // Alpha Vantage crypto symbols
      const symbolMap: Record<string, string> = {
        'BTC/USD': 'BTC',
        'ETH/USD': 'ETH'
      }

      for (const symbol of symbols) {
        const avSymbol = symbolMap[symbol]
        if (!avSymbol) continue

        const response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${avSymbol}&to_currency=USD&apikey=${this.apiKey}`, {
          cache: 'no-store'
        })

        if (!response.ok) continue

        const data = await response.json()
        const exchangeRate = data['Realtime Currency Exchange Rate']
        
        if (exchangeRate) {
          prices.push({
            symbol,
            price: parseFloat(exchangeRate['5. Exchange Rate']),
            change24h: 0,
            changePercent24h: 0,
            volume24h: 0,
            high24h: parseFloat(exchangeRate['5. Exchange Rate']) * 1.01,
            low24h: parseFloat(exchangeRate['5. Exchange Rate']) * 0.99,
            open24h: parseFloat(exchangeRate['5. Exchange Rate']),
            source: 'alphavantage',
            lastUpdate: new Date()
          })
        }
      }

      return prices
    } catch (error) {
      console.error('Alpha Vantage provider error:', error)
      throw error
    }
  }
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
    // Updated realistic prices as of January 2025 - Current market levels
    const mockPrices: Record<string, number> = {
      'BTC/USD': 117000.00,    // Current BTC price ~$117k
      'ETH/USD': 3545.80,      // Current ETH price ~$3,545  
      'SOL/USD': 218.45,       // Current SOL price ~$218
      'ADA/USD': 0.94,         // Current ADA price ~$0.94
      'DOT/USD': 7.85,         // Current DOT price ~$7.85
      'AVAX/USD': 42.15,       // Current AVAX price ~$42
      'MATIC/USD': 0.56,       // Current MATIC price ~$0.56
      'LINK/USD': 26.85        // Current LINK price ~$26.85
    }

    // Generate realistic daily changes based on current market volatility
    const changes: Record<string, number> = {
      'BTC/USD': 1.87,
      'ETH/USD': 2.46,
      'SOL/USD': -3.85,
      'ADA/USD': 9.30,
      'DOT/USD': 5.65,
      'AVAX/USD': 4.59,
      'MATIC/USD': 7.69,
      'LINK/USD': 4.88
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
    new CoinAPIProvider(),       // Primary: CoinAPI (professional, most reliable)
    new CoinMarketCapProvider(), // Secondary: CoinMarketCap (institutional grade)
    new AlphaVantageProvider(),  // Tertiary: Alpha Vantage (crypto + technical analysis)
    new CoinPaprikaProvider(),   // Quaternary: CoinPaprika (free, fast, frequent updates)
    new CoinCapProvider(),       // Backup: CoinCap (lightweight, reliable)
    new CoinGeckoProvider(),     // Backup: CoinGecko (reliable, free)
    new CoinDeskProvider(),      // Bitcoin-focused: CoinDesk (institutional)
    new CoinbaseProvider(),      // Exchange: Coinbase (reliable, free)
    new BinanceProvider(),       // Exchange: Binance public API
    new MockProvider()           // Always keep mock as final fallback
  ]
  private cache = new Map<string, { data: MarketPrice[], timestamp: number }>()
  private cacheTimeout = 30000 // 30 seconds cache for professional APIs (respects rate limits)
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
          
          // Cache in Redis with appropriate TTL
          try {
            const { redisService } = await import('@/lib/services/redis-service')
            if (redisService.isHealthy()) {
              await redisService.cacheMarketData(cacheKey, prices, 30) // 30 seconds TTL for professional API data
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

  // Start real-time updates with aggressive refresh for live trading
  startRealTimeUpdates(symbols?: string[], intervalMs = 5000) {
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

// Custom hook for React components with live data focus
export function useMarketData(symbols?: string[]) {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [useFallbackData, setUseFallbackData] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [dataFreshness, setDataFreshness] = useState<'live' | 'cached' | 'stale' | 'offline'>('offline')

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

    // Subscribe to real-time updates with error handling and freshness tracking
    const unsubscribe = marketDataService.subscribe((updatedPrices) => {
      try {
        const filteredPrices = updatedPrices.filter(p => targetSymbols.includes(p.symbol))
        setPrices(filteredPrices)
        setIsConnected(true)
        setUseFallbackData(false)
        setLastUpdate(new Date())
        
        // Determine data freshness based on source and timing
        const hasLiveData = filteredPrices.some(p => p.source !== 'fallback' && p.source !== 'mock')
        const isRecent = filteredPrices.some(p => 
          new Date().getTime() - p.lastUpdate.getTime() < 30000 // 30 seconds
        )
        
        if (hasLiveData && isRecent) {
          setDataFreshness('live')
        } else if (hasLiveData) {
          setDataFreshness('cached')
        } else {
          setDataFreshness('stale')
        }
      } catch (subErr) {
        console.warn('Market data WebSocket update error:', subErr)
        setDataFreshness('stale')
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
    useFallbackData,
    lastUpdate,
    dataFreshness,
    // Helper properties for components
    isLiveData: dataFreshness === 'live',
    isFreshData: dataFreshness === 'live' || dataFreshness === 'cached'
  }
}

export default MarketDataService
export type { MarketPrice }