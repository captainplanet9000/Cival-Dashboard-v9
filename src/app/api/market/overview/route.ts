/**
 * Market Overview API Endpoint
 * Overall market conditions and statistics
 */

import { NextRequest, NextResponse } from 'next/server'

interface MarketOverview {
  timestamp: string
  marketStatus: string
  majorIndices: Record<string, number>
  marketSentiment: number
  volatilityIndex?: number
  sectorPerformance: Record<string, number>
  trendingSymbols: string[]
  topGainers: string[]
  topLosers: string[]
}

// Mock market overview service
class MockMarketOverviewService {
  async getMarketOverview(): Promise<MarketOverview> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const currentHour = new Date().getHours()
    const isMarketHours = currentHour >= 9 && currentHour <= 16 // Simplified market hours
    
    return {
      timestamp: new Date().toISOString(),
      marketStatus: isMarketHours ? 'OPEN' : 'CLOSED',
      majorIndices: this.generateMajorIndices(),
      marketSentiment: this.generateMarketSentiment(),
      volatilityIndex: this.generateVolatilityIndex(),
      sectorPerformance: this.generateSectorPerformance(),
      trendingSymbols: this.generateTrendingSymbols(),
      topGainers: this.generateTopGainers(),
      topLosers: this.generateTopLosers()
    }
  }
  
  private generateMajorIndices(): Record<string, number> {
    const baseIndices = {
      'SPY': 475.25,
      'QQQ': 395.80,
      'IWM': 198.45,
      'DIA': 345.20,
      'VTI': 245.60,
      'ARKK': 52.30
    }
    
    const indices: Record<string, number> = {}
    
    for (const [symbol, basePrice] of Object.entries(baseIndices)) {
      // Add some daily variation (±1%)
      const variation = (Math.random() - 0.5) * 0.02
      indices[symbol] = Math.round((basePrice * (1 + variation)) * 100) / 100
    }
    
    return indices
  }
  
  private generateMarketSentiment(): number {
    // Generate sentiment between -1 and 1, with slight bullish bias
    const baseSentiment = 0.1 // Slight bullish bias
    const variation = (Math.random() - 0.5) * 0.8 // ±0.4 variation
    return Math.round((baseSentiment + variation) * 100) / 100
  }
  
  private generateVolatilityIndex(): number {
    // VIX-like index (0-100, typically 10-30)
    return Math.round((15 + Math.random() * 15) * 100) / 100
  }
  
  private generateSectorPerformance(): Record<string, number> {
    const sectors = [
      'Technology',
      'Healthcare', 
      'Financial Services',
      'Consumer Cyclical',
      'Communication Services',
      'Industrials',
      'Consumer Defensive',
      'Energy',
      'Utilities',
      'Real Estate',
      'Basic Materials'
    ]
    
    const performance: Record<string, number> = {}
    
    for (const sector of sectors) {
      // Generate daily performance (±3%)
      const dailyPerformance = (Math.random() - 0.5) * 0.06
      performance[sector] = Math.round(dailyPerformance * 10000) / 10000
    }
    
    return performance
  }
  
  private generateTrendingSymbols(): string[] {
    const allSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD',
      'SPY', 'QQQ', 'IWM', 'DIA'
    ]
    
    // Randomly select 5-8 trending symbols
    const numTrending = 5 + Math.floor(Math.random() * 4)
    const shuffled = allSymbols.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, numTrending)
  }
  
  private generateTopGainers(): string[] {
    const gainers = [
      'NVDA', 'TSLA', 'META', 'AMZN', 'GOOGL', 'BTC-USD', 'ETH-USD', 'SOL-USD'
    ]
    
    // Randomly select 3-5 gainers
    const numGainers = 3 + Math.floor(Math.random() * 3)
    const shuffled = gainers.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, numGainers)
  }
  
  private generateTopLosers(): string[] {
    const losers = [
      'NFLX', 'PYPL', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'ZM', 'PELOTON'
    ]
    
    // Randomly select 3-5 losers
    const numLosers = 3 + Math.floor(Math.random() * 3)
    const shuffled = losers.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, numLosers)
  }
}

const mockOverviewService = new MockMarketOverviewService()

export async function GET(request: NextRequest) {
  try {
    // Get market overview
    const overview = await mockOverviewService.getMarketOverview()
    
    return NextResponse.json(overview)
    
  } catch (error) {
    console.error('Error in market overview API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}