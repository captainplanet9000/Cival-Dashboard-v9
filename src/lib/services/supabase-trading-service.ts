import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

// Type definitions for paper trading
export interface PaperTradingSession {
  id: string
  name: string
  description?: string
  initial_balance: number
  current_balance: number
  currency: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  settings: Record<string, any>
  started_at: string
  ended_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PaperTrade {
  id: string
  session_id: string
  agent_id?: string
  order_id: string
  symbol: string
  side: 'buy' | 'sell'
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit'
  quantity: number
  price: number
  stop_price?: number
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
  filled_quantity: number
  avg_fill_price?: number
  commission: number
  slippage: number
  pnl?: number
  pnl_percentage?: number
  strategy_name?: string
  reasoning?: string
  market_conditions?: Record<string, any>
  created_at: string
  executed_at?: string
  updated_at: string
}

export interface PaperPosition {
  id: string
  session_id: string
  symbol: string
  quantity: number
  avg_entry_price: number
  current_price?: number
  market_value?: number
  unrealized_pnl?: number
  realized_pnl: number
  position_type: 'long' | 'short'
  opened_at: string
  closed_at?: string
  updated_at: string
}

export interface PaperPerformanceMetrics {
  id: string
  session_id: string
  timestamp: string
  total_equity: number
  cash_balance: number
  positions_value: number
  total_pnl?: number
  total_pnl_percentage?: number
  daily_pnl?: number
  daily_pnl_percentage?: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate?: number
  avg_win?: number
  avg_loss?: number
  profit_factor?: number
  sharpe_ratio?: number
  max_drawdown?: number
  max_drawdown_duration_days?: number
  created_at: string
}

export class SupabaseTradingService {
  private static instance: SupabaseTradingService
  private client = supabase

  private constructor() {}

  static getInstance(): SupabaseTradingService {
    if (!SupabaseTradingService.instance) {
      SupabaseTradingService.instance = new SupabaseTradingService()
    }
    return SupabaseTradingService.instance
  }

  // Trading Sessions
  async createTradingSession(sessionData: {
    name: string
    description?: string
    initial_balance?: number
    currency?: string
    settings?: Record<string, any>
  }): Promise<PaperTradingSession> {
    try {
      const newSession = {
        name: sessionData.name,
        description: sessionData.description,
        initial_balance: sessionData.initial_balance || 100000,
        current_balance: sessionData.initial_balance || 100000,
        currency: sessionData.currency || 'USD',
        status: 'active' as const,
        settings: sessionData.settings || {
          allow_shorting: false,
          use_real_time_data: true,
          commission_rate: 0.001,
          slippage_rate: 0.0005,
          margin_enabled: false,
          margin_rate: 2.0
        }
      }

      const { data, error } = await this.client
        .from('paper_trading_sessions')
        .insert(newSession)
        .select()
        .single()

      if (error) {
        console.error('Error creating trading session:', error)
        throw error
      }

      return data as PaperTradingSession
    } catch (error) {
      console.error('Error in createTradingSession:', error)
      throw error
    }
  }

  async getTradingSession(sessionId: string): Promise<PaperTradingSession | null> {
    try {
      const { data, error } = await this.client
        .from('paper_trading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching trading session:', error)
        throw error
      }

      return data as PaperTradingSession
    } catch (error) {
      console.error('Error in getTradingSession:', error)
      throw error
    }
  }

  // Paper Trades
  async createTrade(tradeData: {
    session_id: string
    agent_id?: string
    order_id: string
    symbol: string
    side: 'buy' | 'sell'
    order_type?: 'market' | 'limit' | 'stop' | 'stop_limit'
    quantity: number
    price: number
    stop_price?: number
    strategy_name?: string
    reasoning?: string
    market_conditions?: Record<string, any>
  }): Promise<PaperTrade> {
    try {
      const newTrade = {
        ...tradeData,
        order_type: tradeData.order_type || 'market',
        status: 'pending' as const,
        filled_quantity: 0,
        commission: 0,
        slippage: 0,
        realized_pnl: 0
      }

      const { data, error } = await this.client
        .from('paper_trades')
        .insert(newTrade)
        .select()
        .single()

      if (error) {
        console.error('Error creating trade:', error)
        throw error
      }

      return data as PaperTrade
    } catch (error) {
      console.error('Error in createTrade:', error)
      throw error
    }
  }

  async updateTrade(tradeId: string, updates: Partial<PaperTrade>): Promise<PaperTrade> {
    try {
      const { data, error } = await this.client
        .from('paper_trades')
        .update(updates)
        .eq('id', tradeId)
        .select()
        .single()

      if (error) {
        console.error('Error updating trade:', error)
        throw error
      }

      return data as PaperTrade
    } catch (error) {
      console.error('Error in updateTrade:', error)
      throw error
    }
  }

  async executeTrade(tradeId: string, executionData: {
    avg_fill_price: number
    filled_quantity: number
    commission?: number
    slippage?: number
  }): Promise<PaperTrade> {
    try {
      const updates = {
        status: 'filled' as const,
        avg_fill_price: executionData.avg_fill_price,
        filled_quantity: executionData.filled_quantity,
        commission: executionData.commission || 0,
        slippage: executionData.slippage || 0,
        executed_at: new Date().toISOString()
      }

      return await this.updateTrade(tradeId, updates)
    } catch (error) {
      console.error('Error in executeTrade:', error)
      throw error
    }
  }

  async getTradesBySession(sessionId: string): Promise<PaperTrade[]> {
    try {
      const { data, error } = await this.client
        .from('paper_trades')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching trades:', error)
        throw error
      }

      return data as PaperTrade[]
    } catch (error) {
      console.error('Error in getTradesBySession:', error)
      throw error
    }
  }

  async getTradesByAgent(agentId: string): Promise<PaperTrade[]> {
    try {
      const { data, error } = await this.client
        .from('paper_trades')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agent trades:', error)
        throw error
      }

      return data as PaperTrade[]
    } catch (error) {
      console.error('Error in getTradesByAgent:', error)
      throw error
    }
  }

  // Paper Positions
  async createOrUpdatePosition(positionData: {
    session_id: string
    symbol: string
    quantity: number
    avg_entry_price: number
    current_price?: number
    position_type?: 'long' | 'short'
  }): Promise<PaperPosition> {
    try {
      // First, try to find existing position
      const { data: existing } = await this.client
        .from('paper_positions')
        .select('*')
        .eq('session_id', positionData.session_id)
        .eq('symbol', positionData.symbol)
        .is('closed_at', null)
        .single()

      if (existing) {
        // Update existing position
        const newQuantity = existing.quantity + positionData.quantity
        const newAvgPrice = ((existing.avg_entry_price * existing.quantity) + 
                            (positionData.avg_entry_price * positionData.quantity)) / newQuantity

        const updates = {
          quantity: newQuantity,
          avg_entry_price: newAvgPrice,
          current_price: positionData.current_price,
          market_value: newQuantity * (positionData.current_price || positionData.avg_entry_price),
          unrealized_pnl: newQuantity * ((positionData.current_price || positionData.avg_entry_price) - newAvgPrice),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await this.client
          .from('paper_positions')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as PaperPosition
      } else {
        // Create new position
        const newPosition = {
          ...positionData,
          position_type: positionData.position_type || 'long',
          market_value: positionData.quantity * (positionData.current_price || positionData.avg_entry_price),
          unrealized_pnl: 0,
          realized_pnl: 0
        }

        const { data, error } = await this.client
          .from('paper_positions')
          .insert(newPosition)
          .select()
          .single()

        if (error) throw error
        return data as PaperPosition
      }
    } catch (error) {
      console.error('Error in createOrUpdatePosition:', error)
      throw error
    }
  }

  async getPositionsBySession(sessionId: string): Promise<PaperPosition[]> {
    try {
      const { data, error } = await this.client
        .from('paper_positions')
        .select('*')
        .eq('session_id', sessionId)
        .is('closed_at', null)
        .order('opened_at', { ascending: false })

      if (error) {
        console.error('Error fetching positions:', error)
        throw error
      }

      return data as PaperPosition[]
    } catch (error) {
      console.error('Error in getPositionsBySession:', error)
      throw error
    }
  }

  async closePosition(positionId: string, closePrice: number): Promise<PaperPosition> {
    try {
      const { data: position } = await this.client
        .from('paper_positions')
        .select('*')
        .eq('id', positionId)
        .single()

      if (!position) throw new Error('Position not found')

      const realizedPnl = position.quantity * (closePrice - position.avg_entry_price)

      const updates = {
        current_price: closePrice,
        market_value: 0,
        unrealized_pnl: 0,
        realized_pnl: realizedPnl,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.client
        .from('paper_positions')
        .update(updates)
        .eq('id', positionId)
        .select()
        .single()

      if (error) throw error
      return data as PaperPosition
    } catch (error) {
      console.error('Error in closePosition:', error)
      throw error
    }
  }

  // Performance Metrics
  async createPerformanceSnapshot(sessionId: string, metrics: {
    total_equity: number
    cash_balance: number
    positions_value: number
    total_pnl?: number
    total_pnl_percentage?: number
    daily_pnl?: number
    daily_pnl_percentage?: number
    total_trades: number
    winning_trades: number
    losing_trades: number
    win_rate?: number
    avg_win?: number
    avg_loss?: number
    profit_factor?: number
    sharpe_ratio?: number
    max_drawdown?: number
  }): Promise<PaperPerformanceMetrics> {
    try {
      const newMetrics = {
        session_id: sessionId,
        ...metrics,
        timestamp: new Date().toISOString()
      }

      const { data, error } = await this.client
        .from('paper_performance_metrics')
        .insert(newMetrics)
        .select()
        .single()

      if (error) {
        console.error('Error creating performance metrics:', error)
        throw error
      }

      return data as PaperPerformanceMetrics
    } catch (error) {
      console.error('Error in createPerformanceSnapshot:', error)
      throw error
    }
  }

  async getLatestPerformanceMetrics(sessionId: string): Promise<PaperPerformanceMetrics | null> {
    try {
      const { data, error } = await this.client
        .from('paper_performance_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching performance metrics:', error)
        throw error
      }

      return data as PaperPerformanceMetrics
    } catch (error) {
      console.error('Error in getLatestPerformanceMetrics:', error)
      throw error
    }
  }

  // Real-time subscriptions
  subscribeToTrades(sessionId: string, callback: (trades: PaperTrade[]) => void) {
    const subscription = this.client
      .channel(`trades_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paper_trades',
          filter: `session_id=eq.${sessionId}`
        },
        async () => {
          try {
            const trades = await this.getTradesBySession(sessionId)
            callback(trades)
          } catch (error) {
            console.error('Error in trades subscription callback:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  subscribeToPositions(sessionId: string, callback: (positions: PaperPosition[]) => void) {
    const subscription = this.client
      .channel(`positions_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paper_positions',
          filter: `session_id=eq.${sessionId}`
        },
        async () => {
          try {
            const positions = await this.getPositionsBySession(sessionId)
            callback(positions)
          } catch (error) {
            console.error('Error in positions subscription callback:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}

export const supabaseTradingService = SupabaseTradingService.getInstance()
export default supabaseTradingService