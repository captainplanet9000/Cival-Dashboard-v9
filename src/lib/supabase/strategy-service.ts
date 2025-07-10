'use client'

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface StrategyDefinition {
  id: string
  name: string
  type: 'darvas_box' | 'williams_alligator' | 'renko_breakout' | 'heikin_ashi' | 'elliott_wave'
  parameters: Record<string, any>
  indicators: string[]
  rules: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StrategyPerformance {
  id: string
  strategy_id: string
  agent_id: string
  win_rate: number
  total_trades: number
  pnl: number
  sharpe_ratio: number
  max_drawdown: number
  timestamp: string
}

export interface StrategyPattern {
  id: string
  strategy_id: string
  pattern_type: string
  pattern_data: Record<string, any>
  confidence: number
  success_rate: number
  occurrences: number
}

export interface StrategyLearning {
  id: string
  strategy_id: string
  agent_id: string
  state_data: Record<string, any>
  action_taken: string
  reward: number
  q_values: Record<string, number>
  policy_params: Record<string, any>
  timestamp: string
}

export interface StrategySignal {
  id: string
  strategy_id: string
  symbol: string
  signal_type: 'buy' | 'sell' | 'hold'
  strength: number
  confidence: number
  entry_price: number
  target_price: number
  stop_loss: number
  timestamp: string
}

class StrategyService {
  private mockMode = !supabase

  // Create or get strategy definition
  async getOrCreateStrategy(type: string): Promise<StrategyDefinition | null> {
    if (this.mockMode) {
      return this.getMockStrategy(type)
    }

    try {
      // First try to get existing strategy
      const { data: existing, error: getError } = await supabase!
        .from('strategies')
        .select('*')
        .eq('type', type)
        .single()

      if (existing) return existing

      // Create new strategy if doesn't exist
      const strategyConfig = this.getStrategyConfig(type)
      const { data, error } = await supabase!
        .from('strategies')
        .insert([{
          name: strategyConfig.name,
          type,
          parameters: strategyConfig.parameters,
          indicators: strategyConfig.indicators,
          rules: strategyConfig.rules
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating strategy:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Strategy service error:', error)
      return this.getMockStrategy(type)
    }
  }

  // Get strategy performance metrics
  async getStrategyPerformance(strategyId: string, limit = 100): Promise<StrategyPerformance[]> {
    if (this.mockMode) {
      return this.getMockPerformance(strategyId)
    }

    try {
      const { data, error } = await supabase!
        .from('strategy_performance')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching performance:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Performance fetch error:', error)
      return this.getMockPerformance(strategyId)
    }
  }

  // Store pattern recognition data
  async storePattern(pattern: Omit<StrategyPattern, 'id'>): Promise<boolean> {
    if (this.mockMode) {
      console.log('Mock mode: Pattern stored', pattern)
      return true
    }

    try {
      const { error } = await supabase!
        .from('strategy_patterns')
        .insert([pattern])

      if (error) {
        console.error('Error storing pattern:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Pattern storage error:', error)
      return false
    }
  }

  // Get strategy patterns
  async getStrategyPatterns(strategyId: string): Promise<StrategyPattern[]> {
    if (this.mockMode) {
      return this.getMockPatterns(strategyId)
    }

    try {
      const { data, error } = await supabase!
        .from('strategy_patterns')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('confidence', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching patterns:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Pattern fetch error:', error)
      return this.getMockPatterns(strategyId)
    }
  }

  // Store reinforcement learning data
  async storeLearningData(learning: Omit<StrategyLearning, 'id'>): Promise<boolean> {
    if (this.mockMode) {
      console.log('Mock mode: Learning data stored', learning)
      return true
    }

    try {
      const { error } = await supabase!
        .from('strategy_learning')
        .insert([learning])

      if (error) {
        console.error('Error storing learning data:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Learning storage error:', error)
      return false
    }
  }

  // Get latest strategy signals
  async getStrategySignals(strategyId: string, symbol?: string): Promise<StrategySignal[]> {
    if (this.mockMode) {
      return this.getMockSignals(strategyId)
    }

    try {
      let query = supabase!
        .from('strategy_signals')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('timestamp', { ascending: false })
        .limit(20)

      if (symbol) {
        query = query.eq('symbol', symbol)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching signals:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Signal fetch error:', error)
      return this.getMockSignals(strategyId)
    }
  }

  // Subscribe to real-time strategy updates
  subscribeToStrategy(strategyId: string, callback: (data: any) => void) {
    if (this.mockMode) {
      console.log('Mock mode: Real-time subscription simulated')
      // Simulate real-time updates
      const interval = setInterval(() => {
        callback({
          type: 'signal',
          data: this.getMockSignals(strategyId)[0]
        })
      }, 5000)
      
      return () => clearInterval(interval)
    }

    const channel = supabase!
      .channel(`strategy_${strategyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'strategy_signals',
          filter: `strategy_id=eq.${strategyId}`
        },
        (payload) => callback({ type: 'signal', data: payload.new })
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'strategy_performance',
          filter: `strategy_id=eq.${strategyId}`
        },
        (payload) => callback({ type: 'performance', data: payload.new })
      )
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }

  // Helper methods for comprehensive strategy configurations
  private getStrategyConfig(type: string) {
    const configs: Record<string, any> = {
      darvas_box: {
        name: 'Darvas Box Breakout',
        description: 'Breakout strategy based on Nicolas Darvas box theory - identifying consolidation boxes and trading breakouts',
        parameters: {
          boxPeriod: 20,
          volumeThreshold: 1.5,
          breakoutConfirmation: 2,
          stopLossPercent: 8,
          profitTargetRatio: 2,
          minBoxSize: 0.05,
          maxBoxAge: 21
        },
        indicators: ['Volume', 'ATR', '200-day MA', 'Box levels', 'Support/Resistance'],
        rules: {
          entryConditions: {
            primary: [
              'Box formation: 3+ weeks consolidation within 10% range',
              'Breakout confirmation: 2+ consecutive closes above box high',
              'Volume surge: 150% of 50-day average volume',
              'Trend alignment: Price above 200-day MA'
            ],
            secondary: [
              'ATR expansion during breakout',
              'No major resistance within 2x box height',
              'Market not in oversold condition (RSI > 30)'
            ]
          },
          exitConditions: {
            stop_loss: '8% below breakout point',
            profit_target: '2x risk (16% gain)',
            trailing_stop: 'Move stop to breakeven after 8% gain',
            time_exit: 'Exit if no progress after 30 days'
          },
          riskManagement: {
            maxPositionSize: '2% of portfolio',
            maxCorrelation: '0.7 with existing positions',
            maxDailyLoss: '1% of portfolio',
            sectorExposure: 'Max 10% per sector'
          }
        },
        marketConditions: {
          optimal: ['Trending market', 'Medium to high volatility', 'Strong volume'],
          avoid: ['Sideways choppy market', 'Low volume periods', 'High correlation environment']
        },
        timeframes: ['Daily', '4-hour', '1-hour'],
        assetClasses: ['Stocks', 'Crypto', 'Forex'],
        complexity: 'Intermediate',
        winRate: 0.45,
        riskRewardRatio: 2.0
      },
      williams_alligator: {
        name: 'Williams Alligator Trend',
        description: 'Bill Williams Alligator system using 3 displaced moving averages to identify trend and momentum',
        parameters: {
          jawPeriod: 13,
          teethPeriod: 8,
          lipsPeriod: 5,
          jawOffset: 8,
          teethOffset: 5,
          lipsOffset: 3,
          fractalPeriod: 5,
          aoFastPeriod: 5,
          aoSlowPeriod: 34
        },
        indicators: ['Alligator Lines (Jaw, Teeth, Lips)', 'Fractals', 'Awesome Oscillator', 'Accelerator/Decelerator'],
        rules: {
          entryConditions: {
            primary: [
              'Alligator awakening: Jaw(13,8) < Teeth(8,5) < Lips(5,3) for bullish',
              'Fractal breakout: Price breaks above/below fractal level',
              'Momentum confirmation: Awesome Oscillator same direction',
              'Alligator lines expanding (not converging)'
            ],
            secondary: [
              'AC/DC oscillator confirming momentum',
              'Price above/below all alligator lines',
              'Volume increasing on breakout'
            ]
          },
          exitConditions: {
            primary: 'Alligator sleeping: Lines converging for 5+ bars',
            secondary: 'Opposite fractal signal confirmed',
            momentum: 'AO shows divergence or color change',
            time_exit: 'Exit if alligator sleeping for 10+ bars'
          },
          riskManagement: {
            stopLoss: 'Below/above nearest fractal',
            positionSizing: 'Based on fractal distance',
            maxPositionSize: '3% of portfolio',
            trailingStop: 'Trail with alligator lips'
          }
        },
        marketConditions: {
          optimal: ['Strong trending market', 'Clear directional bias', 'Low noise environment'],
          avoid: ['Choppy sideways market', 'Low volatility', 'News-driven volatility']
        },
        timeframes: ['Daily', '4-hour', '1-hour', '15-minute'],
        assetClasses: ['Forex', 'Stocks', 'Commodities', 'Crypto'],
        complexity: 'Advanced',
        winRate: 0.40,
        riskRewardRatio: 2.5
      },
      renko_breakout: {
        name: 'Renko Momentum Breakout',
        description: 'Price-based Renko chart strategy focusing on momentum and trend continuation',
        parameters: {
          brickSize: 'ATR',
          atrPeriod: 14,
          atrMultiplier: 2.0,
          confirmationBricks: 3,
          momentumThreshold: 1.2,
          trendStrength: 0.7,
          volumeMultiplier: 1.5
        },
        indicators: ['Renko Bricks', 'ATR', 'Momentum Oscillator', 'Volume', 'Trend Strength'],
        rules: {
          entryConditions: {
            primary: [
              'Renko brick color change: Green after red bricks (or vice versa)',
              'Momentum surge: 120% of average momentum',
              'Trend continuation: 3+ consecutive same-color bricks',
              'Volume confirmation: 150% of average volume'
            ],
            secondary: [
              'ATR expansion indicating volatility',
              'No major support/resistance nearby',
              'Momentum oscillator above/below zero line'
            ]
          },
          exitConditions: {
            primary: 'Brick color reversal with momentum confirmation',
            secondary: 'Momentum fade below threshold',
            pattern: 'Doji-like brick formation',
            time_exit: 'Exit after 20 bricks without progress'
          },
          riskManagement: {
            stopLoss: '2x brick size from entry',
            profitTarget: '6x brick size (3:1 ratio)',
            positionSizing: 'Based on brick size volatility',
            maxPositionSize: '2.5% of portfolio'
          }
        },
        marketConditions: {
          optimal: ['Trending market', 'Medium volatility', 'Clear momentum'],
          avoid: ['Sideways market', 'Low volatility', 'Erratic price movement']
        },
        timeframes: ['Renko-based (time-independent)', 'Daily equivalent', '4-hour equivalent'],
        assetClasses: ['Forex', 'Crypto', 'Stocks'],
        complexity: 'Intermediate',
        winRate: 0.50,
        riskRewardRatio: 3.0
      },
      heikin_ashi: {
        name: 'Heikin Ashi Trend Follow',
        description: 'Modified candlestick chart strategy using Heikin Ashi candles for trend identification',
        parameters: {
          emaPeriod: 20,
          confirmationCandles: 2,
          trendStrength: 0.7,
          stopLossATR: 2,
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          rsiPeriod: 14
        },
        indicators: ['Heikin Ashi Candles', 'EMA(20)', 'MACD', 'RSI', 'ATR'],
        rules: {
          entryConditions: {
            primary: [
              'HA color change: Green after red candles (bullish) or red after green (bearish)',
              'EMA cross: Price crosses above/below EMA(20)',
              'MACD confirmation: MACD line crosses signal line same direction',
              'Trend strength: No significant upper/lower shadows on HA candles'
            ],
            secondary: [
              'RSI not in extreme zones (30-70 range)',
              'Volume increasing on trend change',
              'ATR showing normal volatility levels'
            ]
          },
          exitConditions: {
            primary: 'HA doji formation or long shadows appearing',
            secondary: 'EMA recross in opposite direction',
            momentum: 'MACD divergence or opposite cross',
            time_exit: 'Exit if trend stalls for 10+ periods'
          },
          riskManagement: {
            stopLoss: '2x ATR from entry point',
            profitTarget: 'Trail with EMA(20)',
            positionSizing: 'Based on ATR volatility',
            maxPositionSize: '3% of portfolio'
          }
        },
        marketConditions: {
          optimal: ['Trending market', 'Normal volatility', 'Clear directional bias'],
          avoid: ['Choppy market', 'High volatility', 'News-driven movements']
        },
        timeframes: ['Daily', '4-hour', '1-hour', '30-minute'],
        assetClasses: ['Stocks', 'Forex', 'Crypto', 'Indices'],
        complexity: 'Beginner to Intermediate',
        winRate: 0.55,
        riskRewardRatio: 1.8
      },
      elliott_wave: {
        name: 'Elliott Wave Analyst',
        description: 'Ralph Nelson Elliott wave theory for market cycle analysis and trend prediction',
        parameters: {
          waveDegree: 'Minor',
          fibLevels: [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618],
          rsiPeriod: 14,
          minWaveSize: 50,
          maxWaveSize: 500,
          momentumDivergence: 0.15,
          volumeConfirmation: 1.25,
          trendlineTolerance: 0.02
        },
        indicators: ['Wave Patterns', 'Fibonacci Retracements/Extensions', 'RSI', 'MACD', 'Volume', 'Trendlines'],
        rules: {
          entryConditions: {
            primary: [
              'Wave identification: Clear 5-wave impulse pattern completion',
              'Wave 3 characteristics: Never shortest wave, highest volume',
              'Fibonacci confluence: 61.8% retracement + extension levels',
              'RSI momentum: Confirming wave direction'
            ],
            secondary: [
              'Volume pattern: Increasing on impulse waves (1,3,5)',
              'Momentum divergence: RSI/MACD divergence at wave 5',
              'Channel analysis: Price within trend channel',
              'Degree alignment: Multiple wave degrees confirming'
            ]
          },
          exitConditions: {
            primary: 'Wave completion: 5-wave impulse or 3-wave correction complete',
            secondary: 'Fibonacci resistance: Price reaches extension levels',
            momentum: 'RSI divergence at wave extremes',
            pattern: 'Overlapping waves indicating correction'
          },
          riskManagement: {
            stopLoss: 'Below wave 1 low for wave 3 entries',
            profitTarget: 'Fibonacci extensions (127.2%, 161.8%)',
            positionSizing: 'Based on wave volatility',
            maxPositionSize: '2% of portfolio per wave'
          }
        },
        marketConditions: {
          optimal: ['Trending market with clear cycles', 'Normal volatility', 'Established trend'],
          avoid: ['Choppy market', 'Low volatility', 'Unclear wave structure']
        },
        timeframes: ['Daily', 'Weekly', '4-hour', '1-hour'],
        assetClasses: ['Stocks', 'Indices', 'Forex', 'Crypto'],
        complexity: 'Advanced',
        winRate: 0.35,
        riskRewardRatio: 3.5
      }
    }

    return configs[type] || configs.darvas_box
  }

  // Mock data methods for development
  private getMockStrategy(type: string): StrategyDefinition {
    const config = this.getStrategyConfig(type)
    return {
      id: `strategy_${type}`,
      name: config.name,
      type: type as any,
      parameters: config.parameters,
      indicators: config.indicators,
      rules: config.rules,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private getMockPerformance(strategyId: string): StrategyPerformance[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `perf_${i}`,
      strategy_id: strategyId,
      agent_id: `agent_${i}`,
      win_rate: 0.5 + Math.random() * 0.4,
      total_trades: Math.floor(Math.random() * 100) + 20,
      pnl: (Math.random() - 0.3) * 5000,
      sharpe_ratio: 0.8 + Math.random() * 1.5,
      max_drawdown: Math.random() * 0.15,
      timestamp: new Date(Date.now() - i * 86400000).toISOString()
    }))
  }

  private getMockPatterns(strategyId: string): StrategyPattern[] {
    const patternTypes = ['Breakout', 'Reversal', 'Continuation', 'Consolidation']
    return Array.from({ length: 5 }, (_, i) => ({
      id: `pattern_${i}`,
      strategy_id: strategyId,
      pattern_type: patternTypes[i % patternTypes.length],
      pattern_data: {
        strength: Math.random(),
        duration: Math.floor(Math.random() * 20) + 5,
        priceAction: 'Bullish'
      },
      confidence: 0.7 + Math.random() * 0.3,
      success_rate: 0.6 + Math.random() * 0.3,
      occurrences: Math.floor(Math.random() * 50) + 10
    }))
  }

  private getMockSignals(strategyId: string): StrategySignal[] {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD']
    return Array.from({ length: 3 }, (_, i) => ({
      id: `signal_${i}`,
      strategy_id: strategyId,
      symbol: symbols[i % symbols.length],
      signal_type: Math.random() > 0.5 ? 'buy' : 'sell',
      strength: 0.6 + Math.random() * 0.4,
      confidence: 0.7 + Math.random() * 0.3,
      entry_price: 40000 + Math.random() * 5000,
      target_price: 42000 + Math.random() * 3000,
      stop_loss: 38000 + Math.random() * 2000,
      timestamp: new Date().toISOString()
    }))
  }
}

// Lazy initialization
let strategyServiceInstance: StrategyService | null = null

export function getStrategyService(): StrategyService {
  if (!strategyServiceInstance) {
    strategyServiceInstance = new StrategyService()
  }
  return strategyServiceInstance
}

// For backward compatibility
export const strategyService = {
  get instance() {
    return getStrategyService()
  }
}

// Export strategy types
export const STRATEGY_TYPES = {
  DARVAS_BOX: 'darvas_box',
  WILLIAMS_ALLIGATOR: 'williams_alligator',
  RENKO_BREAKOUT: 'renko_breakout',
  HEIKIN_ASHI: 'heikin_ashi',
  ELLIOTT_WAVE: 'elliott_wave'
} as const

export type StrategyType = typeof STRATEGY_TYPES[keyof typeof STRATEGY_TYPES]