'use client'

/**
 * Technical Analysis Strategy Engine
 * Implements all 5 core technical analysis methods for autonomous trading
 */

import { EventEmitter } from 'events'

export interface MarketData {
  symbol: string
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalSignal {
  id: string
  strategy: string
  symbol: string
  type: 'buy' | 'sell' | 'hold'
  strength: number // 0-1
  confidence: number // 0-1
  price: number
  reasoning: string
  timestamp: Date
  metadata: Record<string, any>
}

export interface StrategyPerformance {
  strategyId: string
  totalSignals: number
  successfulSignals: number
  successRate: number
  avgProfitPerSignal: number
  maxDrawdown: number
  sharpeRatio: number
  lastUpdate: Date
}

// Darvas Box Implementation
export class DarvasBoxStrategy {
  private boxes: Map<string, DarvasBox[]> = new Map()
  
  constructor(private config: {
    volumeThreshold: number
    breakoutConfirmation: number
    boxMinHeight: number
    boxMaxAge: number
  }) {}
  
  analyze(data: MarketData[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const symbol = data[0]?.symbol
    if (!symbol) return signals
    
    // Get or create boxes for symbol
    const symbolBoxes = this.boxes.get(symbol) || []
    
    // Detect new Darvas boxes
    const newBoxes = this.detectDarvasBoxes(data)
    symbolBoxes.push(...newBoxes)
    
    // Analyze for breakout signals
    const breakoutSignals = this.analyzeBreakouts(data, symbolBoxes)
    signals.push(...breakoutSignals)
    
    // Clean old boxes
    this.cleanOldBoxes(symbolBoxes)
    this.boxes.set(symbol, symbolBoxes)
    
    return signals
  }
  
  private detectDarvasBoxes(data: MarketData[]): DarvasBox[] {
    const boxes: DarvasBox[] = []
    
    for (let i = 4; i < data.length; i++) {
      const current = data[i]
      const previous = data.slice(i-4, i)
      
      // Check for new high formation
      const isNewHigh = current.high > Math.max(...previous.map(d => d.high))
      const hasVolumeConfirmation = current.volume > this.calculateAverageVolume(data.slice(i-10, i)) * this.config.volumeThreshold
      
      if (isNewHigh && hasVolumeConfirmation) {
        // Look for consolidation pattern
        const consolidationPeriod = this.findConsolidationPeriod(data.slice(i-20, i))
        
        if (consolidationPeriod && consolidationPeriod.height >= this.config.boxMinHeight) {
          boxes.push({
            id: `box_${current.symbol}_${current.timestamp.getTime()}`,
            symbol: current.symbol,
            top: consolidationPeriod.high,
            bottom: consolidationPeriod.low,
            startTime: consolidationPeriod.startTime,
            endTime: current.timestamp,
            volume: current.volume,
            confidence: this.calculateBoxConfidence(consolidationPeriod, hasVolumeConfirmation)
          })
        }
      }
    }
    
    return boxes
  }
  
  private analyzeBreakouts(data: MarketData[], boxes: DarvasBox[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const latest = data[data.length - 1]
    
    for (const box of boxes) {
      // Check for breakout above box top
      if (latest.close > box.top && latest.volume > this.calculateAverageVolume(data.slice(-10))) {
        const confirmationCount = this.countBreakoutConfirmation(data, box.top)
        
        if (confirmationCount >= this.config.breakoutConfirmation) {
          signals.push({
            id: `darvas_breakout_${latest.symbol}_${latest.timestamp.getTime()}`,
            strategy: 'darvas_box',
            symbol: latest.symbol,
            type: 'buy',
            strength: Math.min(1, (latest.close - box.top) / box.top),
            confidence: box.confidence * (confirmationCount / this.config.breakoutConfirmation),
            price: latest.close,
            reasoning: `Darvas box breakout above ${box.top.toFixed(4)} with ${confirmationCount} confirmations`,
            timestamp: latest.timestamp,
            metadata: {
              boxTop: box.top,
              boxBottom: box.bottom,
              breakoutPrice: latest.close,
              volumeConfirmation: latest.volume > this.calculateAverageVolume(data.slice(-10))
            }
          })
        }
      }
      
      // Check for breakdown below box bottom (sell signal)
      if (latest.close < box.bottom) {
        signals.push({
          id: `darvas_breakdown_${latest.symbol}_${latest.timestamp.getTime()}`,
          strategy: 'darvas_box',
          symbol: latest.symbol,
          type: 'sell',
          strength: Math.min(1, (box.bottom - latest.close) / box.bottom),
          confidence: 0.8,
          price: latest.close,
          reasoning: `Darvas box breakdown below ${box.bottom.toFixed(4)}`,
          timestamp: latest.timestamp,
          metadata: {
            boxTop: box.top,
            boxBottom: box.bottom,
            breakdownPrice: latest.close
          }
        })
      }
    }
    
    return signals
  }
  
  private calculateAverageVolume(data: MarketData[]): number {
    return data.reduce((sum, d) => sum + d.volume, 0) / data.length
  }
  
  private findConsolidationPeriod(data: MarketData[]): { high: number, low: number, startTime: Date, height: number } | null {
    if (data.length < 5) return null
    
    const high = Math.max(...data.map(d => d.high))
    const low = Math.min(...data.map(d => d.low))
    const height = (high - low) / low
    
    return {
      high,
      low,
      startTime: data[0].timestamp,
      height
    }
  }
  
  private calculateBoxConfidence(consolidation: any, volumeConfirmation: boolean): number {
    let confidence = 0.5
    
    // Higher confidence for tighter consolidation
    confidence += (1 - consolidation.height) * 0.3
    
    // Volume confirmation adds confidence
    if (volumeConfirmation) confidence += 0.2
    
    return Math.min(1, confidence)
  }
  
  private countBreakoutConfirmation(data: MarketData[], breakoutLevel: number): number {
    const recentData = data.slice(-this.config.breakoutConfirmation)
    return recentData.filter(d => d.close > breakoutLevel).length
  }
  
  private cleanOldBoxes(boxes: DarvasBox[]) {
    const maxAge = this.config.boxMaxAge * 24 * 60 * 60 * 1000 // Convert days to milliseconds
    const cutoffTime = Date.now() - maxAge
    
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (boxes[i].endTime.getTime() < cutoffTime) {
        boxes.splice(i, 1)
      }
    }
  }
}

// Williams Alligator Implementation
export class WilliamsAlligatorStrategy {
  private alligatorData: Map<string, AlligatorData> = new Map()
  
  constructor(private config: {
    jawPeriod: number
    teethPeriod: number
    lipsPeriod: number
    jawShift: number
    teethShift: number
    lipsShift: number
    awesomeOscillator: boolean
  }) {}
  
  analyze(data: MarketData[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const symbol = data[0]?.symbol
    if (!symbol) return signals
    
    // Calculate Alligator lines
    const alligator = this.calculateAlligatorLines(data)
    this.alligatorData.set(symbol, alligator)
    
    // Analyze for trading signals
    const alligatorSignals = this.analyzeAlligatorSignals(data, alligator)
    signals.push(...alligatorSignals)
    
    return signals
  }
  
  private calculateAlligatorLines(data: MarketData[]): AlligatorData {
    const jaw = this.calculateSMA(data.map(d => (d.high + d.low) / 2), this.config.jawPeriod)
    const teeth = this.calculateSMA(data.map(d => (d.high + d.low) / 2), this.config.teethPeriod)
    const lips = this.calculateSMA(data.map(d => (d.high + d.low) / 2), this.config.lipsPeriod)
    
    return {
      jaw: this.shiftArray(jaw, this.config.jawShift),
      teeth: this.shiftArray(teeth, this.config.teethShift),
      lips: this.shiftArray(lips, this.config.lipsShift),
      awesomeOscillator: this.config.awesomeOscillator ? this.calculateAO(data) : []
    }
  }
  
  private analyzeAlligatorSignals(data: MarketData[], alligator: AlligatorData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const latest = data[data.length - 1]
    const latestIndex = data.length - 1
    
    if (latestIndex < Math.max(this.config.jawPeriod, this.config.teethPeriod, this.config.lipsPeriod)) {
      return signals
    }
    
    const currentJaw = alligator.jaw[latestIndex]
    const currentTeeth = alligator.teeth[latestIndex]
    const currentLips = alligator.lips[latestIndex]
    
    // Check if Alligator is awake (lines are properly ordered)
    const isAlligatorAwake = this.isAlligatorAwake(currentJaw, currentTeeth, currentLips)
    
    if (isAlligatorAwake) {
      // Bullish signal: Price above all lines, lines properly ordered
      if (latest.close > currentLips && currentLips > currentTeeth && currentTeeth > currentJaw) {
        const aoConfirmation = this.config.awesomeOscillator ? this.getAOConfirmation(alligator.awesomeOscillator, latestIndex) : true
        
        if (aoConfirmation) {
          signals.push({
            id: `alligator_bullish_${latest.symbol}_${latest.timestamp.getTime()}`,
            strategy: 'williams_alligator',
            symbol: latest.symbol,
            type: 'buy',
            strength: this.calculateAlligatorStrength(latest.close, currentLips, currentTeeth, currentJaw),
            confidence: 0.8,
            price: latest.close,
            reasoning: 'Price above Alligator lines in bullish formation with AO confirmation',
            timestamp: latest.timestamp,
            metadata: {
              jaw: currentJaw,
              teeth: currentTeeth,
              lips: currentLips,
              aoConfirmation
            }
          })
        }
      }
      
      // Bearish signal: Price below all lines, lines properly ordered
      if (latest.close < currentLips && currentLips < currentTeeth && currentTeeth < currentJaw) {
        const aoConfirmation = this.config.awesomeOscillator ? this.getAOConfirmation(alligator.awesomeOscillator, latestIndex, false) : true
        
        if (aoConfirmation) {
          signals.push({
            id: `alligator_bearish_${latest.symbol}_${latest.timestamp.getTime()}`,
            strategy: 'williams_alligator',
            symbol: latest.symbol,
            type: 'sell',
            strength: this.calculateAlligatorStrength(currentLips, latest.close, currentTeeth, currentJaw),
            confidence: 0.8,
            price: latest.close,
            reasoning: 'Price below Alligator lines in bearish formation with AO confirmation',
            timestamp: latest.timestamp,
            metadata: {
              jaw: currentJaw,
              teeth: currentTeeth,
              lips: currentLips,
              aoConfirmation
            }
          })
        }
      }
    }
    
    return signals
  }
  
  private calculateSMA(values: number[], period: number): number[] {
    const sma: number[] = []
    
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
    
    return sma
  }
  
  private shiftArray(arr: number[], shift: number): number[] {
    const shifted = new Array(arr.length + shift)
    for (let i = 0; i < arr.length; i++) {
      shifted[i + shift] = arr[i]
    }
    return shifted
  }
  
  private calculateAO(data: MarketData[]): number[] {
    const fastSMA = this.calculateSMA(data.map(d => (d.high + d.low) / 2), 5)
    const slowSMA = this.calculateSMA(data.map(d => (d.high + d.low) / 2), 34)
    
    const ao: number[] = []
    const startIndex = Math.max(0, slowSMA.length - fastSMA.length)
    
    for (let i = 0; i < Math.min(fastSMA.length, slowSMA.length); i++) {
      ao.push(fastSMA[startIndex + i] - slowSMA[i])
    }
    
    return ao
  }
  
  private isAlligatorAwake(jaw: number, teeth: number, lips: number): boolean {
    const tolerance = 0.001 // 0.1% tolerance for line separation
    return Math.abs(jaw - teeth) > tolerance && Math.abs(teeth - lips) > tolerance
  }
  
  private calculateAlligatorStrength(price: number, lips: number, teeth: number, jaw: number): number {
    const distance = Math.abs(price - lips) / lips
    return Math.min(1, distance * 10) // Scale distance to 0-1 range
  }
  
  private getAOConfirmation(ao: number[], index: number, bullish: boolean = true): boolean {
    if (index < 1 || index >= ao.length) return false
    
    const current = ao[index]
    const previous = ao[index - 1]
    
    if (bullish) {
      return current > 0 && current > previous // AO is positive and increasing
    } else {
      return current < 0 && current < previous // AO is negative and decreasing
    }
  }
}

// Renko Chart Strategy Implementation
export class RenkoBreakoutStrategy {
  private renkoBricks: Map<string, RenkoBrick[]> = new Map()
  
  constructor(private config: {
    brickSize: number
    useATR: boolean
    atrPeriod: number
    reverseThreshold: number
  }) {}
  
  analyze(data: MarketData[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const symbol = data[0]?.symbol
    if (!symbol) return signals
    
    // Calculate brick size if using ATR
    const brickSize = this.config.useATR ? this.calculateATRBrickSize(data) : this.config.brickSize
    
    // Generate Renko bricks
    const bricks = this.generateRenkoBricks(data, brickSize)
    this.renkoBricks.set(symbol, bricks)
    
    // Analyze for breakout signals
    const breakoutSignals = this.analyzeRenkoBreakouts(bricks, data[data.length - 1])
    signals.push(...breakoutSignals)
    
    return signals
  }
  
  private calculateATRBrickSize(data: MarketData[]): number {
    const atr = this.calculateATR(data, this.config.atrPeriod)
    return atr[atr.length - 1] * this.config.brickSize // Use ATR as base for brick size
  }
  
  private calculateATR(data: MarketData[], period: number): number[] {
    const tr: number[] = []
    const atr: number[] = []
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i]
      const previous = data[i - 1]
      
      const highLow = current.high - current.low
      const highClose = Math.abs(current.high - previous.close)
      const lowClose = Math.abs(current.low - previous.close)
      
      tr.push(Math.max(highLow, highClose, lowClose))
    }
    
    // Calculate ATR using SMA of True Range
    for (let i = period - 1; i < tr.length; i++) {
      const sum = tr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      atr.push(sum / period)
    }
    
    return atr
  }
  
  private generateRenkoBricks(data: MarketData[], brickSize: number): RenkoBrick[] {
    const bricks: RenkoBrick[] = []
    if (data.length === 0) return bricks
    
    let currentPrice = data[0].close
    let brickOpen = currentPrice
    let brickDirection: 'up' | 'down' = 'up'
    
    for (let i = 1; i < data.length; i++) {
      const price = data[i].close
      
      if (brickDirection === 'up') {
        // Check for up brick formation
        if (price >= brickOpen + brickSize) {
          const numBricks = Math.floor((price - brickOpen) / brickSize)
          
          for (let j = 0; j < numBricks; j++) {
            const brickClose = brickOpen + brickSize
            bricks.push({
              id: `brick_${data[i].symbol}_${bricks.length}`,
              open: brickOpen,
              close: brickClose,
              direction: 'up',
              timestamp: data[i].timestamp,
              volume: data[i].volume
            })
            brickOpen = brickClose
          }
        }
        // Check for reversal
        else if (price <= brickOpen - (brickSize * 2)) {
          brickDirection = 'down'
          brickOpen = brickOpen - brickSize
          
          const brickClose = brickOpen - brickSize
          bricks.push({
            id: `brick_${data[i].symbol}_${bricks.length}`,
            open: brickOpen,
            close: brickClose,
            direction: 'down',
            timestamp: data[i].timestamp,
            volume: data[i].volume
          })
          brickOpen = brickClose
        }
      } else {
        // Check for down brick formation
        if (price <= brickOpen - brickSize) {
          const numBricks = Math.floor((brickOpen - price) / brickSize)
          
          for (let j = 0; j < numBricks; j++) {
            const brickClose = brickOpen - brickSize
            bricks.push({
              id: `brick_${data[i].symbol}_${bricks.length}`,
              open: brickOpen,
              close: brickClose,
              direction: 'down',
              timestamp: data[i].timestamp,
              volume: data[i].volume
            })
            brickOpen = brickClose
          }
        }
        // Check for reversal
        else if (price >= brickOpen + (brickSize * 2)) {
          brickDirection = 'up'
          brickOpen = brickOpen + brickSize
          
          const brickClose = brickOpen + brickSize
          bricks.push({
            id: `brick_${data[i].symbol}_${bricks.length}`,
            open: brickOpen,
            close: brickClose,
            direction: 'up',
            timestamp: data[i].timestamp,
            volume: data[i].volume
          })
          brickOpen = brickClose
        }
      }
    }
    
    return bricks
  }
  
  private analyzeRenkoBreakouts(bricks: RenkoBrick[], latestData: MarketData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    
    if (bricks.length < this.config.reverseThreshold + 1) return signals
    
    const recentBricks = bricks.slice(-this.config.reverseThreshold - 1)
    const latestBrick = recentBricks[recentBricks.length - 1]
    
    // Check for bullish breakout (multiple consecutive up bricks)
    const consecutiveUpBricks = this.countConsecutiveBricks(recentBricks, 'up')
    if (consecutiveUpBricks >= this.config.reverseThreshold) {
      signals.push({
        id: `renko_bullish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'renko_breakout',
        symbol: latestData.symbol,
        type: 'buy',
        strength: Math.min(1, consecutiveUpBricks / (this.config.reverseThreshold * 2)),
        confidence: 0.75,
        price: latestData.close,
        reasoning: `Renko bullish breakout with ${consecutiveUpBricks} consecutive up bricks`,
        timestamp: latestData.timestamp,
        metadata: {
          consecutiveBricks: consecutiveUpBricks,
          latestBrickDirection: latestBrick.direction,
          brickSize: Math.abs(latestBrick.close - latestBrick.open)
        }
      })
    }
    
    // Check for bearish breakout (multiple consecutive down bricks)
    const consecutiveDownBricks = this.countConsecutiveBricks(recentBricks, 'down')
    if (consecutiveDownBricks >= this.config.reverseThreshold) {
      signals.push({
        id: `renko_bearish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'renko_breakout',
        symbol: latestData.symbol,
        type: 'sell',
        strength: Math.min(1, consecutiveDownBricks / (this.config.reverseThreshold * 2)),
        confidence: 0.75,
        price: latestData.close,
        reasoning: `Renko bearish breakout with ${consecutiveDownBricks} consecutive down bricks`,
        timestamp: latestData.timestamp,
        metadata: {
          consecutiveBricks: consecutiveDownBricks,
          latestBrickDirection: latestBrick.direction,
          brickSize: Math.abs(latestBrick.close - latestBrick.open)
        }
      })
    }
    
    return signals
  }
  
  private countConsecutiveBricks(bricks: RenkoBrick[], direction: 'up' | 'down'): number {
    let count = 0
    
    for (let i = bricks.length - 1; i >= 0; i--) {
      if (bricks[i].direction === direction) {
        count++
      } else {
        break
      }
    }
    
    return count
  }
}

// Heikin Ashi Strategy Implementation
export class HeikinAshiTrendStrategy {
  private heikinAshiData: Map<string, HeikinAshiCandle[]> = new Map()
  
  constructor(private config: {
    smoothing: number
    trendConfirmation: number
    reversalDetection: boolean
  }) {}
  
  analyze(data: MarketData[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const symbol = data[0]?.symbol
    if (!symbol) return signals
    
    // Convert to Heikin Ashi candles
    const heikinAshi = this.convertToHeikinAshi(data)
    this.heikinAshiData.set(symbol, heikinAshi)
    
    // Apply smoothing if configured
    const smoothedHA = this.config.smoothing > 1 ? this.smoothHeikinAshi(heikinAshi) : heikinAshi
    
    // Analyze for trend signals
    const trendSignals = this.analyzeTrendSignals(smoothedHA, data[data.length - 1])
    signals.push(...trendSignals)
    
    return signals
  }
  
  private convertToHeikinAshi(data: MarketData[]): HeikinAshiCandle[] {
    const heikinAshi: HeikinAshiCandle[] = []
    
    for (let i = 0; i < data.length; i++) {
      const current = data[i]
      
      if (i === 0) {
        // First candle uses regular OHLC
        heikinAshi.push({
          timestamp: current.timestamp,
          open: current.open,
          high: current.high,
          low: current.low,
          close: (current.open + current.high + current.low + current.close) / 4,
          volume: current.volume
        })
      } else {
        const previous = heikinAshi[i - 1]
        
        const haClose = (current.open + current.high + current.low + current.close) / 4
        const haOpen = (previous.open + previous.close) / 2
        const haHigh = Math.max(current.high, haOpen, haClose)
        const haLow = Math.min(current.low, haOpen, haClose)
        
        heikinAshi.push({
          timestamp: current.timestamp,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
          volume: current.volume
        })
      }
    }
    
    return heikinAshi
  }
  
  private smoothHeikinAshi(heikinAshi: HeikinAshiCandle[]): HeikinAshiCandle[] {
    const smoothed: HeikinAshiCandle[] = []
    
    for (let i = this.config.smoothing - 1; i < heikinAshi.length; i++) {
      const slice = heikinAshi.slice(i - this.config.smoothing + 1, i + 1)
      
      smoothed.push({
        timestamp: heikinAshi[i].timestamp,
        open: slice.reduce((sum, candle) => sum + candle.open, 0) / this.config.smoothing,
        high: slice.reduce((sum, candle) => sum + candle.high, 0) / this.config.smoothing,
        low: slice.reduce((sum, candle) => sum + candle.low, 0) / this.config.smoothing,
        close: slice.reduce((sum, candle) => sum + candle.close, 0) / this.config.smoothing,
        volume: slice.reduce((sum, candle) => sum + candle.volume, 0) / this.config.smoothing
      })
    }
    
    return smoothed
  }
  
  private analyzeTrendSignals(heikinAshi: HeikinAshiCandle[], latestData: MarketData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    
    if (heikinAshi.length < this.config.trendConfirmation) return signals
    
    const recentCandles = heikinAshi.slice(-this.config.trendConfirmation)
    const latestCandle = recentCandles[recentCandles.length - 1]
    
    // Check for bullish trend (consecutive green candles)
    const consecutiveBullish = this.countConsecutiveTrend(recentCandles, true)
    if (consecutiveBullish >= this.config.trendConfirmation) {
      signals.push({
        id: `heikin_ashi_bullish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'heikin_ashi',
        symbol: latestData.symbol,
        type: 'buy',
        strength: this.calculateTrendStrength(recentCandles, true),
        confidence: 0.8,
        price: latestData.close,
        reasoning: `Heikin Ashi bullish trend with ${consecutiveBullish} consecutive green candles`,
        timestamp: latestData.timestamp,
        metadata: {
          consecutiveBullish,
          candleBody: Math.abs(latestCandle.close - latestCandle.open),
          trendStrength: this.calculateTrendStrength(recentCandles, true)
        }
      })
    }
    
    // Check for bearish trend (consecutive red candles)
    const consecutiveBearish = this.countConsecutiveTrend(recentCandles, false)
    if (consecutiveBearish >= this.config.trendConfirmation) {
      signals.push({
        id: `heikin_ashi_bearish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'heikin_ashi',
        symbol: latestData.symbol,
        type: 'sell',
        strength: this.calculateTrendStrength(recentCandles, false),
        confidence: 0.8,
        price: latestData.close,
        reasoning: `Heikin Ashi bearish trend with ${consecutiveBearish} consecutive red candles`,
        timestamp: latestData.timestamp,
        metadata: {
          consecutiveBearish,
          candleBody: Math.abs(latestCandle.close - latestCandle.open),
          trendStrength: this.calculateTrendStrength(recentCandles, false)
        }
      })
    }
    
    // Check for trend reversal if enabled
    if (this.config.reversalDetection) {
      const reversalSignals = this.detectTrendReversal(heikinAshi, latestData)
      signals.push(...reversalSignals)
    }
    
    return signals
  }
  
  private countConsecutiveTrend(candles: HeikinAshiCandle[], bullish: boolean): number {
    let count = 0
    
    for (let i = candles.length - 1; i >= 0; i--) {
      const candle = candles[i]
      const isBullishCandle = candle.close > candle.open
      
      if ((bullish && isBullishCandle) || (!bullish && !isBullishCandle)) {
        count++
      } else {
        break
      }
    }
    
    return count
  }
  
  private calculateTrendStrength(candles: HeikinAshiCandle[], bullish: boolean): number {
    const avgBody = candles.reduce((sum, candle) => sum + Math.abs(candle.close - candle.open), 0) / candles.length
    const avgRange = candles.reduce((sum, candle) => sum + (candle.high - candle.low), 0) / candles.length
    
    // Strength based on body to range ratio
    return Math.min(1, avgBody / avgRange)
  }
  
  private detectTrendReversal(heikinAshi: HeikinAshiCandle[], latestData: MarketData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    
    if (heikinAshi.length < 3) return signals
    
    const latest = heikinAshi[heikinAshi.length - 1]
    const previous = heikinAshi[heikinAshi.length - 2]
    const beforePrevious = heikinAshi[heikinAshi.length - 3]
    
    // Bullish reversal: red -> red -> green
    if (beforePrevious.close < beforePrevious.open && 
        previous.close < previous.open && 
        latest.close > latest.open) {
      signals.push({
        id: `heikin_ashi_reversal_bullish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'heikin_ashi',
        symbol: latestData.symbol,
        type: 'buy',
        strength: 0.6,
        confidence: 0.7,
        price: latestData.close,
        reasoning: 'Heikin Ashi bullish reversal pattern detected',
        timestamp: latestData.timestamp,
        metadata: {
          reversalType: 'bullish',
          previousTrend: 'bearish'
        }
      })
    }
    
    // Bearish reversal: green -> green -> red
    if (beforePrevious.close > beforePrevious.open && 
        previous.close > previous.open && 
        latest.close < latest.open) {
      signals.push({
        id: `heikin_ashi_reversal_bearish_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'heikin_ashi',
        symbol: latestData.symbol,
        type: 'sell',
        strength: 0.6,
        confidence: 0.7,
        price: latestData.close,
        reasoning: 'Heikin Ashi bearish reversal pattern detected',
        timestamp: latestData.timestamp,
        metadata: {
          reversalType: 'bearish',
          previousTrend: 'bullish'
        }
      })
    }
    
    return signals
  }
}

// Elliott Wave Strategy Implementation
export class ElliottWaveStrategy {
  private waveData: Map<string, WaveAnalysis> = new Map()
  
  constructor(private config: {
    fibonacciLevels: number[]
    waveCountMethod: 'classic' | 'neo' | 'ai_assisted'
    patternRecognition: boolean
    degreeAnalysis: boolean
  }) {}
  
  analyze(data: MarketData[]): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    const symbol = data[0]?.symbol
    if (!symbol) return signals
    
    // Perform wave analysis
    const waveAnalysis = this.performWaveAnalysis(data)
    this.waveData.set(symbol, waveAnalysis)
    
    // Generate trading signals based on wave position
    const waveSignals = this.generateWaveSignals(waveAnalysis, data[data.length - 1])
    signals.push(...waveSignals)
    
    return signals
  }
  
  private performWaveAnalysis(data: MarketData[]): WaveAnalysis {
    // Simplified Elliott Wave analysis
    const pivots = this.findPivotPoints(data)
    const waves = this.identifyWaves(pivots)
    const currentWave = this.determineCurrentWave(waves, data[data.length - 1])
    const fibonacciProjections = this.calculateFibonacciProjections(waves)
    
    return {
      pivots,
      waves,
      currentWave,
      fibonacciProjections,
      confidence: this.calculateWaveConfidence(waves),
      lastUpdate: new Date()
    }
  }
  
  private findPivotPoints(data: MarketData[], lookback: number = 5): PivotPoint[] {
    const pivots: PivotPoint[] = []
    
    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i]
      const leftData = data.slice(i - lookback, i)
      const rightData = data.slice(i + 1, i + lookback + 1)
      
      // Check for high pivot
      const isHighPivot = leftData.every(d => d.high < current.high) && rightData.every(d => d.high < current.high)
      
      // Check for low pivot
      const isLowPivot = leftData.every(d => d.low > current.low) && rightData.every(d => d.low > current.low)
      
      if (isHighPivot) {
        pivots.push({
          timestamp: current.timestamp,
          price: current.high,
          type: 'high',
          index: i
        })
      }
      
      if (isLowPivot) {
        pivots.push({
          timestamp: current.timestamp,
          price: current.low,
          type: 'low',
          index: i
        })
      }
    }
    
    return pivots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }
  
  private identifyWaves(pivots: PivotPoint[]): Wave[] {
    const waves: Wave[] = []
    
    if (pivots.length < 6) return waves // Need at least 6 pivots for a 5-wave pattern
    
    // Simplified wave identification
    for (let i = 0; i < pivots.length - 1; i++) {
      const start = pivots[i]
      const end = pivots[i + 1]
      
      waves.push({
        id: `wave_${i + 1}`,
        startPoint: start,
        endPoint: end,
        direction: start.type === 'low' && end.type === 'high' ? 'up' : 'down',
        degree: this.determineDegree(start, end),
        waveNumber: (i % 5) + 1,
        confidence: 0.7
      })
    }
    
    return waves
  }
  
  private determineCurrentWave(waves: Wave[], currentData: MarketData): CurrentWave | null {
    if (waves.length === 0) return null
    
    const latestWave = waves[waves.length - 1]
    const progress = this.calculateWaveProgress(latestWave, currentData.close)
    
    return {
      waveNumber: latestWave.waveNumber,
      direction: latestWave.direction,
      progress,
      expectedTarget: this.calculateWaveTarget(latestWave, waves),
      confidence: latestWave.confidence
    }
  }
  
  private calculateFibonacciProjections(waves: Wave[]): FibonacciProjection[] {
    const projections: FibonacciProjection[] = []
    
    if (waves.length < 2) return projections
    
    const lastWave = waves[waves.length - 1]
    const previousWave = waves[waves.length - 2]
    
    const basePrice = previousWave.startPoint.price
    const waveHeight = Math.abs(previousWave.endPoint.price - previousWave.startPoint.price)
    
    for (const level of this.config.fibonacciLevels) {
      const projectionPrice = lastWave.direction === 'up' 
        ? basePrice + (waveHeight * level)
        : basePrice - (waveHeight * level)
      
      projections.push({
        level,
        price: projectionPrice,
        type: lastWave.direction === 'up' ? 'resistance' : 'support'
      })
    }
    
    return projections
  }
  
  private generateWaveSignals(waveAnalysis: WaveAnalysis, latestData: MarketData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    
    if (!waveAnalysis.currentWave || waveAnalysis.waves.length < 3) return signals
    
    const currentWave = waveAnalysis.currentWave
    
    // Wave 3 entry signal (typically strongest wave)
    if (currentWave.waveNumber === 3 && currentWave.progress < 0.3) {
      signals.push({
        id: `elliott_wave3_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'elliott_wave',
        symbol: latestData.symbol,
        type: currentWave.direction === 'up' ? 'buy' : 'sell',
        strength: 0.9,
        confidence: currentWave.confidence,
        price: latestData.close,
        reasoning: `Elliott Wave 3 entry signal - strongest impulse wave expected`,
        timestamp: latestData.timestamp,
        metadata: {
          waveNumber: currentWave.waveNumber,
          direction: currentWave.direction,
          progress: currentWave.progress,
          expectedTarget: currentWave.expectedTarget
        }
      })
    }
    
    // Wave 5 entry signal with caution
    if (currentWave.waveNumber === 5 && currentWave.progress < 0.5) {
      signals.push({
        id: `elliott_wave5_${latestData.symbol}_${latestData.timestamp.getTime()}`,
        strategy: 'elliott_wave',
        symbol: latestData.symbol,
        type: currentWave.direction === 'up' ? 'buy' : 'sell',
        strength: 0.6,
        confidence: currentWave.confidence * 0.8, // Lower confidence for wave 5
        price: latestData.close,
        reasoning: `Elliott Wave 5 entry signal - final impulse wave with caution`,
        timestamp: latestData.timestamp,
        metadata: {
          waveNumber: currentWave.waveNumber,
          direction: currentWave.direction,
          progress: currentWave.progress,
          expectedTarget: currentWave.expectedTarget,
          caution: 'Final wave - prepare for reversal'
        }
      })
    }
    
    // Fibonacci retracement entry signals
    const fibonacciSignals = this.generateFibonacciSignals(waveAnalysis, latestData)
    signals.push(...fibonacciSignals)
    
    return signals
  }
  
  private generateFibonacciSignals(waveAnalysis: WaveAnalysis, latestData: MarketData): TechnicalSignal[] {
    const signals: TechnicalSignal[] = []
    
    for (const projection of waveAnalysis.fibonacciProjections) {
      const distanceToLevel = Math.abs(latestData.close - projection.price) / projection.price
      
      // Signal when price is near Fibonacci level (within 0.5%)
      if (distanceToLevel < 0.005) {
        signals.push({
          id: `elliott_fibonacci_${latestData.symbol}_${projection.level}_${latestData.timestamp.getTime()}`,
          strategy: 'elliott_wave',
          symbol: latestData.symbol,
          type: projection.type === 'support' ? 'buy' : 'sell',
          strength: 0.7,
          confidence: 0.75,
          price: latestData.close,
          reasoning: `Price near Fibonacci ${projection.level} level (${projection.price.toFixed(4)})`,
          timestamp: latestData.timestamp,
          metadata: {
            fibonacciLevel: projection.level,
            projectionPrice: projection.price,
            distanceToLevel,
            type: projection.type
          }
        })
      }
    }
    
    return signals
  }
  
  private calculateWaveConfidence(waves: Wave[]): number {
    if (waves.length < 5) return 0.3
    
    // Higher confidence for complete 5-wave patterns
    const recentWaves = waves.slice(-5)
    let confidence = 0.5
    
    // Check for alternation in wave patterns
    if (this.checkWaveAlternation(recentWaves)) confidence += 0.2
    
    // Check for proper wave proportions
    if (this.checkWaveProportions(recentWaves)) confidence += 0.2
    
    return Math.min(1, confidence)
  }
  
  private checkWaveAlternation(waves: Wave[]): boolean {
    // Simplified alternation check
    return waves.length >= 3 && 
           waves[0].direction !== waves[1].direction && 
           waves[1].direction !== waves[2].direction
  }
  
  private checkWaveProportions(waves: Wave[]): boolean {
    // Simplified proportion check
    if (waves.length < 3) return false
    
    const wave1Length = Math.abs(waves[0].endPoint.price - waves[0].startPoint.price)
    const wave3Length = Math.abs(waves[2].endPoint.price - waves[2].startPoint.price)
    
    // Wave 3 should typically be longer than wave 1
    return wave3Length > wave1Length
  }
  
  private determineDegree(start: PivotPoint, end: PivotPoint): 'minute' | 'minor' | 'intermediate' | 'primary' {
    const priceMove = Math.abs(end.price - start.price) / start.price
    
    if (priceMove > 0.2) return 'primary'
    if (priceMove > 0.1) return 'intermediate'
    if (priceMove > 0.05) return 'minor'
    return 'minute'
  }
  
  private calculateWaveProgress(wave: Wave, currentPrice: number): number {
    const start = wave.startPoint.price
    const end = wave.endPoint.price
    const range = Math.abs(end - start)
    const progress = Math.abs(currentPrice - start) / range
    
    return Math.min(1, Math.max(0, progress))
  }
  
  private calculateWaveTarget(currentWave: Wave, allWaves: Wave[]): number {
    // Simplified target calculation using Fibonacci extensions
    if (allWaves.length < 2) return currentWave.endPoint.price
    
    const previousWave = allWaves[allWaves.length - 2]
    const waveHeight = Math.abs(previousWave.endPoint.price - previousWave.startPoint.price)
    
    // Use 1.618 Fibonacci extension as target
    return currentWave.direction === 'up' 
      ? currentWave.startPoint.price + (waveHeight * 1.618)
      : currentWave.startPoint.price - (waveHeight * 1.618)
  }
}

// Supporting interfaces
interface DarvasBox {
  id: string
  symbol: string
  top: number
  bottom: number
  startTime: Date
  endTime: Date
  volume: number
  confidence: number
}

interface AlligatorData {
  jaw: number[]
  teeth: number[]
  lips: number[]
  awesomeOscillator: number[]
}

interface RenkoBrick {
  id: string
  open: number
  close: number
  direction: 'up' | 'down'
  timestamp: Date
  volume: number
}

interface HeikinAshiCandle {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface WaveAnalysis {
  pivots: PivotPoint[]
  waves: Wave[]
  currentWave: CurrentWave | null
  fibonacciProjections: FibonacciProjection[]
  confidence: number
  lastUpdate: Date
}

interface PivotPoint {
  timestamp: Date
  price: number
  type: 'high' | 'low'
  index: number
}

interface Wave {
  id: string
  startPoint: PivotPoint
  endPoint: PivotPoint
  direction: 'up' | 'down'
  degree: 'minute' | 'minor' | 'intermediate' | 'primary'
  waveNumber: number
  confidence: number
}

interface CurrentWave {
  waveNumber: number
  direction: 'up' | 'down'
  progress: number
  expectedTarget: number
  confidence: number
}

interface FibonacciProjection {
  level: number
  price: number
  type: 'support' | 'resistance'
}

// Main Technical Analysis Engine
export class TechnicalAnalysisEngine extends EventEmitter {
  private strategies: Map<string, any> = new Map()
  private performance: Map<string, StrategyPerformance> = new Map()
  
  constructor() {
    super()
  }
  
  /**
   * Initialize strategy with configuration
   */
  initializeStrategy(strategyType: string, config: any) {
    let strategy: any
    
    switch (strategyType) {
      case 'darvas_box':
        strategy = new DarvasBoxStrategy(config)
        break
      case 'williams_alligator':
        strategy = new WilliamsAlligatorStrategy(config)
        break
      case 'renko_breakout':
        strategy = new RenkoBreakoutStrategy(config)
        break
      case 'heikin_ashi':
        strategy = new HeikinAshiTrendStrategy(config)
        break
      case 'elliott_wave':
        strategy = new ElliottWaveStrategy(config)
        break
      default:
        throw new Error(`Unknown strategy type: ${strategyType}`)
    }
    
    this.strategies.set(strategyType, strategy)
    this.performance.set(strategyType, {
      strategyId: strategyType,
      totalSignals: 0,
      successfulSignals: 0,
      successRate: 0,
      avgProfitPerSignal: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      lastUpdate: new Date()
    })
  }
  
  /**
   * Analyze market data with specified strategy
   */
  analyzeWithStrategy(strategyType: string, data: MarketData[]): TechnicalSignal[] {
    const strategy = this.strategies.get(strategyType)
    if (!strategy) {
      throw new Error(`Strategy ${strategyType} not initialized`)
    }
    
    try {
      const signals = strategy.analyze(data)
      this.updatePerformanceMetrics(strategyType, signals)
      return signals
    } catch (error) {
      console.error(`Error analyzing with ${strategyType}:`, error)
      return []
    }
  }
  
  /**
   * Analyze with all initialized strategies
   */
  analyzeWithAllStrategies(data: MarketData[]): Map<string, TechnicalSignal[]> {
    const results = new Map<string, TechnicalSignal[]>()
    
    for (const [strategyType, strategy] of this.strategies) {
      try {
        const signals = strategy.analyze(data)
        results.set(strategyType, signals)
        this.updatePerformanceMetrics(strategyType, signals)
      } catch (error) {
        console.error(`Error with strategy ${strategyType}:`, error)
        results.set(strategyType, [])
      }
    }
    
    return results
  }
  
  /**
   * Get strategy performance metrics
   */
  getStrategyPerformance(strategyType: string): StrategyPerformance | undefined {
    return this.performance.get(strategyType)
  }
  
  /**
   * Get all strategy performances
   */
  getAllPerformances(): Map<string, StrategyPerformance> {
    return new Map(this.performance)
  }
  
  private updatePerformanceMetrics(strategyType: string, signals: TechnicalSignal[]) {
    const performance = this.performance.get(strategyType)
    if (!performance) return
    
    performance.totalSignals += signals.length
    performance.lastUpdate = new Date()
    
    // Emit signals for processing
    signals.forEach(signal => {
      this.emit('signal', { strategy: strategyType, signal })
    })
  }
}

// Singleton instance with lazy initialization
let technicalAnalysisEngineInstance: TechnicalAnalysisEngine | null = null

export function getTechnicalAnalysisEngine(): TechnicalAnalysisEngine {
  if (!technicalAnalysisEngineInstance) {
    technicalAnalysisEngineInstance = new TechnicalAnalysisEngine()
  }
  return technicalAnalysisEngineInstance
}

// For backward compatibility - but use getTechnicalAnalysisEngine() instead
export const technicalAnalysisEngine = {
  get instance() {
    return getTechnicalAnalysisEngine()
  }
}