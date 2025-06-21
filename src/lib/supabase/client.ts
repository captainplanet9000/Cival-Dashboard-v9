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

export default supabase