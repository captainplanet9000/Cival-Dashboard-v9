/**
 * Technical Analysis API Endpoint
 * Technical indicators for a specific symbol
 */

import { NextRequest, NextResponse } from 'next/server'

interface TechnicalIndicators {
  symbol: string
  rsi?: number
  macd?: number
  macdSignal?: number
  macdHistogram?: number
  sma20?: number
  sma50?: number
  sma200?: number
  ema12?: number
  ema26?: number
  bollingerUpper?: number
  bollingerMiddle?: number
  bollingerLower?: number
  atr?: number
  volumeSma?: number
  obv?: number
  supportLevel?: number
  resistanceLevel?: number
  timestamp: string
}

// Mock technical analysis service
class MockTechnicalAnalysisService {
  async calculateIndicators(symbol: string): Promise<TechnicalIndicators> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const basePrice = this.getBasePrice(symbol)
    
    return {
      symbol,
      rsi: this.generateRSI(),
      macd: this.generateMACD(),
      macdSignal: this.generateMACDSignal(),
      macdHistogram: this.generateMACDHistogram(),
      sma20: basePrice * (0.98 + Math.random() * 0.04),
      sma50: basePrice * (0.95 + Math.random() * 0.06),
      sma200: basePrice * (0.90 + Math.random() * 0.15),
      ema12: basePrice * (0.99 + Math.random() * 0.02),
      ema26: basePrice * (0.97 + Math.random() * 0.04),
      bollingerUpper: basePrice * 1.05,
      bollingerMiddle: basePrice,
      bollingerLower: basePrice * 0.95,
      atr: basePrice * (0.02 + Math.random() * 0.03),
      volumeSma: Math.floor(Math.random() * 5000000) + 1000000,
      obv: Math.floor(Math.random() * 100000000),
      supportLevel: basePrice * (0.92 + Math.random() * 0.06),
      resistanceLevel: basePrice * (1.02 + Math.random() * 0.06),
      timestamp: new Date().toISOString()
    }
  }
  
  private getBasePrice(symbol: string): number {
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
    
    return basePrices[symbol] || 100
  }
  
  private generateRSI(): number {
    // Generate RSI between 20-80 with higher probability in 40-60 range
    const rand = Math.random()
    if (rand < 0.1) return 20 + Math.random() * 10  // Oversold
    if (rand < 0.2) return 70 + Math.random() * 10  // Overbought
    return 40 + Math.random() * 20  // Normal range
  }
  
  private generateMACD(): number {
    return (Math.random() - 0.5) * 2 // ±1
  }
  
  private generateMACDSignal(): number {
    return (Math.random() - 0.5) * 1.8 // ±0.9
  }
  
  private generateMACDHistogram(): number {
    return (Math.random() - 0.5) * 0.5 // ±0.25
  }
}

const mockTechnicalService = new MockTechnicalAnalysisService()

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase()
    
    if (!symbol || symbol.length === 0) {
      return NextResponse.json(
        { error: 'Invalid symbol' },
        { status: 400 }
      )
    }
    
    // Validate symbol format (basic validation)
    if (!/^[A-Z0-9\-\.]{1,10}$/.test(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol format' },
        { status: 400 }
      )
    }
    
    // Get technical indicators
    const indicators = await mockTechnicalService.calculateIndicators(symbol)
    
    return NextResponse.json(indicators)
    
  } catch (error) {
    console.error(`Error in technical analysis API for ${params.symbol}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}