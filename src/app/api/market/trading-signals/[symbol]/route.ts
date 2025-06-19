/**
 * Trading Signals API Endpoint
 * Trading signals for a specific symbol
 */

import { NextRequest, NextResponse } from 'next/server'

interface TradingSignal {
  symbol: string
  signalType: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  source: string
  reasoning: string
  timeframe: string
  targetPrice?: number
  stopLoss?: number
  takeProfit?: number
  riskScore?: number
  timestamp: string
}

// Mock trading signals service
class MockTradingSignalsService {
  async generateTradingSignals(symbol: string): Promise<TradingSignal[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const signals: TradingSignal[] = []
    const basePrice = this.getBasePrice(symbol)
    
    // Generate 0-3 signals randomly
    const numSignals = Math.floor(Math.random() * 4)
    
    for (let i = 0; i < numSignals; i++) {
      const signal = this.generateRandomSignal(symbol, basePrice)
      if (signal.confidence >= 0.6) { // Only include high-confidence signals
        signals.push(signal)
      }
    }
    
    // Sort by confidence (highest first)
    return signals.sort((a, b) => b.confidence - a.confidence)
  }
  
  private generateRandomSignal(symbol: string, basePrice: number): TradingSignal {
    const signalTypes: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD']
    const sources = [
      'RSI_OVERSOLD',
      'RSI_OVERBOUGHT', 
      'GOLDEN_CROSS',
      'DEATH_CROSS',
      'MACD_BULLISH',
      'MACD_BEARISH',
      'BOLLINGER_OVERSOLD',
      'BOLLINGER_OVERBOUGHT',
      'VOLUME_BREAKOUT',
      'SUPPORT_BOUNCE',
      'RESISTANCE_BREAK'
    ]
    
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d']
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const confidence = 0.6 + Math.random() * 0.4 // 0.6 to 1.0
    
    let reasoning = this.generateReasoning(source, signalType)
    
    const signal: TradingSignal = {
      symbol,
      signalType,
      confidence: Math.round(confidence * 100) / 100,
      source,
      reasoning,
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      riskScore: Math.round((1 - confidence + Math.random() * 0.3) * 100) / 100,
      timestamp: new Date().toISOString()
    }
    
    // Add price targets for BUY/SELL signals
    if (signalType === 'BUY') {
      signal.targetPrice = basePrice * (1.02 + Math.random() * 0.08) // 2-10% upside
      signal.stopLoss = basePrice * (0.95 - Math.random() * 0.03)    // 2-5% downside
      signal.takeProfit = basePrice * (1.05 + Math.random() * 0.10)  // 5-15% upside
    } else if (signalType === 'SELL') {
      signal.targetPrice = basePrice * (0.98 - Math.random() * 0.08) // 2-10% downside
      signal.stopLoss = basePrice * (1.05 + Math.random() * 0.03)    // 2-5% upside
      signal.takeProfit = basePrice * (0.95 - Math.random() * 0.10)  // 5-15% downside
    }
    
    return signal
  }
  
  private generateReasoning(source: string, signalType: string): string {
    const reasoningMap: Record<string, Record<string, string>> = {
      'RSI_OVERSOLD': {
        'BUY': 'RSI below 30 indicates oversold condition, potential bounce expected',
        'HOLD': 'RSI oversold but awaiting confirmation'
      },
      'RSI_OVERBOUGHT': {
        'SELL': 'RSI above 70 indicates overbought condition, potential pullback expected',
        'HOLD': 'RSI overbought but momentum may continue'
      },
      'GOLDEN_CROSS': {
        'BUY': 'SMA 20 crossed above SMA 50, bullish momentum confirmed',
        'HOLD': 'Golden cross pattern but waiting for volume confirmation'
      },
      'DEATH_CROSS': {
        'SELL': 'SMA 20 crossed below SMA 50, bearish momentum confirmed',
        'HOLD': 'Death cross pattern but oversold conditions present'
      },
      'MACD_BULLISH': {
        'BUY': 'MACD line above signal line in positive territory, bullish momentum',
        'HOLD': 'MACD bullish but approaching resistance'
      },
      'MACD_BEARISH': {
        'SELL': 'MACD line below signal line in negative territory, bearish momentum',
        'HOLD': 'MACD bearish but approaching support'
      },
      'BOLLINGER_OVERSOLD': {
        'BUY': 'Price near lower Bollinger Band, oversold bounce expected',
        'HOLD': 'Near lower Bollinger Band but trend unclear'
      },
      'BOLLINGER_OVERBOUGHT': {
        'SELL': 'Price near upper Bollinger Band, overbought pullback expected',
        'HOLD': 'Near upper Bollinger Band but momentum strong'
      },
      'VOLUME_BREAKOUT': {
        'BUY': 'High volume breakout above resistance level confirmed',
        'SELL': 'High volume breakdown below support level confirmed',
        'HOLD': 'Volume spike but direction unclear'
      },
      'SUPPORT_BOUNCE': {
        'BUY': 'Price bounced off key support level with volume confirmation',
        'HOLD': 'At support level but bounce strength uncertain'
      },
      'RESISTANCE_BREAK': {
        'BUY': 'Price broke above key resistance level with strong volume',
        'SELL': 'Failed to break resistance, rejection confirmed',
        'HOLD': 'Testing resistance level, outcome unclear'
      }
    }
    
    return reasoningMap[source]?.[signalType] || `${source} signal generated for ${signalType} recommendation`
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
}

const mockSignalsService = new MockTradingSignalsService()

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
    
    // Get trading signals
    const signals = await mockSignalsService.generateTradingSignals(symbol)
    
    return NextResponse.json(signals)
    
  } catch (error) {
    console.error(`Error in trading signals API for ${params.symbol}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}