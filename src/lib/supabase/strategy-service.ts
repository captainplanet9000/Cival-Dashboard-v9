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

  // Helper methods for strategy configurations
  private getStrategyConfig(type: string) {
    const configs: Record<string, any> = {
      darvas_box: {
        name: 'Darvas Box Breakout',
        parameters: {
          boxPeriod: 20,
          volumeThreshold: 1.5,
          breakoutConfirmation: 2,
          stopLossPercent: 3
        },
        indicators: ['Volume', 'ATR', 'Price Action'],
        rules: {
          entryConditions: ['Box breakout', 'Volume surge', 'Trend alignment'],
          exitConditions: ['Box breakdown', 'Stop loss hit', 'Target reached']
        }
      },
      williams_alligator: {
        name: 'Williams Alligator Trend',
        parameters: {
          jawPeriod: 13,
          teethPeriod: 8,
          lipsPeriod: 5,
          jawOffset: 8,
          teethOffset: 5,
          lipsOffset: 3
        },
        indicators: ['Alligator Lines', 'Fractals', 'Awesome Oscillator'],
        rules: {
          entryConditions: ['Alligator awakens', 'Fractal breakout', 'AO momentum'],
          exitConditions: ['Alligator sleeps', 'Opposite fractal', 'AO divergence']
        }
      },
      renko_breakout: {
        name: 'Renko Momentum Breakout',
        parameters: {
          brickSize: 'ATR',
          atrPeriod: 14,
          confirmationBricks: 3,
          momentumThreshold: 1.2
        },
        indicators: ['Renko Bricks', 'ATR', 'Momentum'],
        rules: {
          entryConditions: ['Brick color change', 'Momentum surge', 'Trend continuation'],
          exitConditions: ['Brick reversal', 'Momentum fade', 'Pattern completion']
        }
      },
      heikin_ashi: {
        name: 'Heikin Ashi Trend Follow',
        parameters: {
          emaPeriod: 20,
          confirmationCandles: 2,
          trendStrength: 0.7,
          stopLossATR: 2
        },
        indicators: ['Heikin Ashi', 'EMA', 'MACD'],
        rules: {
          entryConditions: ['HA color change', 'EMA cross', 'MACD confirmation'],
          exitConditions: ['HA doji', 'EMA recross', 'MACD divergence']
        }
      },
      elliott_wave: {
        name: 'Elliott Wave Analyst',
        parameters: {
          waveDegree: 'Minor',
          fibLevels: [0.236, 0.382, 0.5, 0.618, 0.786],
          rsiPeriod: 14,
          minWaveSize: 50
        },
        indicators: ['Wave Patterns', 'Fibonacci', 'RSI'],
        rules: {
          entryConditions: ['Wave 3 or C start', 'Fib support', 'RSI momentum'],
          exitConditions: ['Wave completion', 'Fib resistance', 'RSI divergence']
        }
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

// Export singleton instance
export const strategyService = new StrategyService()

// Export strategy types
export const STRATEGY_TYPES = {
  DARVAS_BOX: 'darvas_box',
  WILLIAMS_ALLIGATOR: 'williams_alligator',
  RENKO_BREAKOUT: 'renko_breakout',
  HEIKIN_ASHI: 'heikin_ashi',
  ELLIOTT_WAVE: 'elliott_wave'
} as const

export type StrategyType = typeof STRATEGY_TYPES[keyof typeof STRATEGY_TYPES]