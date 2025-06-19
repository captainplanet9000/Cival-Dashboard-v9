/**
 * Market Quotes API Endpoint
 * Real-time price quotes for multiple symbols
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock enhanced market data service (would be replaced with actual service)
class MockEnhancedMarketDataService {
  async getMultipleQuotes(symbols: string[]) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return symbols.map(symbol => ({
      symbol,
      price: this.generateMockPrice(symbol),
      change: this.generateMockChange(),
      change_percent: this.generateMockChangePercent(),
      volume: this.generateMockVolume(),
      bid: this.generateMockPrice(symbol) * 0.999,
      ask: this.generateMockPrice(symbol) * 1.001,
      high_24h: this.generateMockPrice(symbol) * 1.05,
      low_24h: this.generateMockPrice(symbol) * 0.95,
      timestamp: new Date().toISOString(),
      provider: 'yfinance',
      asset_type: this.getAssetType(symbol)
    }))
  }
  
  private generateMockPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'AAPL': 185.50,
      'MSFT': 378.85,
      'GOOGL': 142.25,
      'AMZN': 153.75,
      'TSLA': 248.50,
      'BTC-USD': 42500.00,
      'ETH-USD': 2650.00,
      'SPY': 475.25,
      'QQQ': 395.80,
      'IWM': 198.45
    }
    
    const basePrice = basePrices[symbol] || 100
    // Add some random variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04
    return basePrice * (1 + variation)
  }
  
  private generateMockChange(): number {
    return (Math.random() - 0.5) * 10 // ±5 change
  }
  
  private generateMockChangePercent(): number {
    return (Math.random() - 0.5) * 6 // ±3% change
  }
  
  private generateMockVolume(): number {
    return Math.floor(Math.random() * 10000000) + 1000000 // 1M to 10M
  }
  
  private getAssetType(symbol: string): string {
    if (symbol.includes('-USD') || symbol.includes('BTC') || symbol.includes('ETH')) {
      return 'crypto'
    }
    if (['SPY', 'QQQ', 'IWM'].includes(symbol)) {
      return 'index'
    }
    return 'stock'
  }
}

const mockMarketService = new MockEnhancedMarketDataService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Invalid symbols array' },
        { status: 400 }
      )
    }
    
    if (symbols.length === 0) {
      return NextResponse.json([])
    }
    
    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Too many symbols (max 50)' },
        { status: 400 }
      )
    }
    
    // Get quotes from market data service
    const quotes = await mockMarketService.getMultipleQuotes(symbols)
    
    return NextResponse.json(quotes)
    
  } catch (error) {
    console.error('Error in quotes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  
  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing symbols parameter' },
      { status: 400 }
    )
  }
  
  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => s.length > 0)
  
  try {
    const quotes = await mockMarketService.getMultipleQuotes(symbols)
    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error in quotes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}