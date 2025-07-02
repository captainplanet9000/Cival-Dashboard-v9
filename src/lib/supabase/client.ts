import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'cival-dashboard@1.0.0'
    }
  }
})

// Database type definitions
export interface AgentFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  storage_path: string
  uploaded_at: string
  agent_ingested: boolean
  ingested_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AgentPaperTrade {
  id: string
  agent_id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  executed_at: string
  status: 'pending' | 'filled' | 'cancelled'
  strategy: string
  reasoning?: string
  pnl?: number
  created_at: string
  updated_at: string
}

export interface AgentPortfolio {
  id: string
  agent_id: string
  symbol: string
  quantity: number
  avg_price: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  realized_pnl: number
  updated_at: string
}

export interface AgentDecision {
  id: string
  agent_id: string
  decision_type: 'trade' | 'hold' | 'rebalance' | 'analysis'
  symbol?: string
  reasoning: string
  confidence_score: number
  market_data: Record<string, any>
  action_taken: boolean
  result?: Record<string, any>
  created_at: string
}

export interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'paused'
  personality: Record<string, any>
  strategies: string[]
  paper_balance: number
  total_pnl: number
  win_rate: number
  trades_count: number
  risk_tolerance: number
  max_position_size: number
  created_at: string
  updated_at: string
}

// Helper functions for database operations
export const dbHelpers = {
  // Agent Files
  async uploadFile(file: Omit<AgentFile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('agent_files')
      .insert([{
        ...file,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getFiles() {
    const { data, error } = await supabase
      .from('agent_files')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Agent Operations
  async getAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async updateAgent(id: string, updates: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Paper Trading
  async createPaperTrade(trade: Omit<AgentPaperTrade, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('agent_paper_trades')
      .insert([{
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...trade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPaperTrades(agentId?: string) {
    let query = supabase
      .from('agent_paper_trades')
      .select('*')
    
    if (agentId) {
      query = query.eq('agent_id', agentId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Agent Decisions
  async createDecision(decision: Omit<AgentDecision, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('agent_decisions')
      .insert([{
        id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...decision,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getDecisions(agentId?: string, limit = 50) {
    let query = supabase
      .from('agent_decisions')
      .select('*')
    
    if (agentId) {
      query = query.eq('agent_id', agentId)
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Portfolio Operations
  async updatePortfolio(portfolio: Omit<AgentPortfolio, 'updated_at'>) {
    const { data, error } = await supabase
      .from('agent_portfolios')
      .upsert([{
        ...portfolio,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPortfolio(agentId: string) {
    const { data, error } = await supabase
      .from('agent_portfolios')
      .select('*')
      .eq('agent_id', agentId)
    
    if (error) throw error
    return data
  }
}

// Premium component database helpers
export const premiumDbHelpers = {
  // Advanced Portfolio Analytics
  async getAdvancedPortfolioMetrics(userId?: string, timeframe: string = '1d') {
    const { data, error } = await supabase
      .from('portfolio_analytics')
      .select(`
        *,
        portfolio_positions(
          symbol,
          quantity,
          avg_cost,
          current_price,
          unrealized_pnl,
          realized_pnl
        )
      `)
      .eq('user_id', userId || 'default')
      .eq('timeframe', timeframe)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Advanced Trading Data
  async getAdvancedOrderBook(symbol: string) {
    const { data, error } = await supabase
      .from('order_book_snapshots')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async createAdvancedOrder(orderData: any) {
    const { data, error } = await supabase
      .from('advanced_orders')
      .insert([{
        ...orderData,
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Chart Data
  async getAdvancedChartData(symbol: string, timeframe: string, limit: number = 1000) {
    const { data, error } = await supabase
      .from('market_data_ohlcv')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data?.reverse() // Return chronological order
  },

  async storeTechnicalIndicators(symbol: string, indicators: any) {
    const { data, error } = await supabase
      .from('technical_indicators')
      .upsert([{
        symbol,
        indicators_data: indicators,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Agent Management
  async getAgentOrchestrationStatus() {
    const { data, error } = await supabase
      .from('agent_orchestration')
      .select(`
        *,
        agents(
          id,
          name,
          status,
          strategy_type,
          current_capital,
          total_pnl
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateAgentOrchestration(config: any) {
    const { data, error } = await supabase
      .from('agent_orchestration')
      .upsert([{
        configuration: config,
        status: 'active',
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Risk Management
  async getRiskMetrics(portfolioId?: string) {
    const { data, error } = await supabase
      .from('risk_metrics')
      .select('*')
      .eq('portfolio_id', portfolioId || 'default')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateRiskLimits(riskLimits: any, portfolioId?: string) {
    const { data, error } = await supabase
      .from('risk_limits')
      .upsert([{
        portfolio_id: portfolioId || 'default',
        limits: riskLimits,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Strategy Management
  async getVisualStrategies(userId?: string) {
    const { data, error } = await supabase
      .from('visual_strategies')
      .select(`
        *,
        strategy_nodes(*),
        strategy_connections(*)
      `)
      .eq('user_id', userId || 'default')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createVisualStrategy(strategyData: any, userId?: string) {
    const { data, error } = await supabase
      .from('visual_strategies')
      .insert([{
        ...strategyData,
        user_id: userId || 'default',
        id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Notifications
  async getNotifications(userId?: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('premium_notifications')
      .select('*')
      .eq('user_id', userId || 'default')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async createNotification(notification: any, userId?: string) {
    const { data, error } = await supabase
      .from('premium_notifications')
      .insert([{
        ...notification,
        user_id: userId || 'default',
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Performance Tracking
  async getComponentPerformanceMetrics() {
    const { data, error } = await supabase
      .from('component_performance')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100)
    
    if (error) throw error
    return data
  },

  async recordComponentPerformance(metrics: any) {
    const { data, error } = await supabase
      .from('component_performance')
      .insert([{
        ...metrics,
        recorded_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Sortable Data Management
  async getSortableConfiguration(configType: string, userId?: string) {
    const { data, error } = await supabase
      .from('sortable_configurations')
      .select('*')
      .eq('config_type', configType)
      .eq('user_id', userId || 'default')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateSortableConfiguration(configType: string, configuration: any, userId?: string) {
    const { data, error } = await supabase
      .from('sortable_configurations')
      .upsert([{
        config_type: configType,
        user_id: userId || 'default',
        configuration,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Premium Real-time Subscriptions
  subscribeToPortfolioUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`portfolio:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_portfolios',
        filter: `agent_id=eq.${userId}`
      }, callback)
      .subscribe()
  },

  subscribeToAgentUpdates(agentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`agent:${agentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agents',
        filter: `id=eq.${agentId}`
      }, callback)
      .subscribe()
  },

  subscribeToMarketData(symbol: string, callback: (payload: any) => void) {
    return supabase
      .channel(`market:${symbol}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'market_data_live',
        filter: `symbol=eq.${symbol}`
      }, callback)
      .subscribe()
  },

  // Premium Data Aggregation
  async getAggregatedPortfolioData(userId?: string, timeRange?: string) {
    const { data, error } = await supabase
      .rpc('get_aggregated_portfolio_data', {
        p_user_id: userId || 'default',
        p_time_range: timeRange || '24h'
      })
    
    if (error) throw error
    return data
  },

  async getAggregatedAgentPerformance(timeRange?: string) {
    const { data, error } = await supabase
      .rpc('get_aggregated_agent_performance', {
        p_time_range: timeRange || '7d'
      })
    
    if (error) throw error
    return data
  },

  // Premium Feature Flags
  async getFeatureFlags(userId?: string) {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .or(`user_id.eq.${userId || 'default'},user_id.is.null`)
      .order('priority', { ascending: false })
    
    if (error) throw error
    return data
  },

  async updateFeatureFlag(flagName: string, enabled: boolean, userId?: string) {
    const { data, error } = await supabase
      .from('feature_flags')
      .upsert([{
        flag_name: flagName,
        enabled,
        user_id: userId || null,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export default supabase