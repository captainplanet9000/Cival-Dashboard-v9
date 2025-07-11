/**
 * Supabase Flash Loan Service
 * Handles all flash loan related database operations with profit tracking integration
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface FlashLoanProtocol {
  id: string
  name: string
  protocol_type: 'aave' | 'uniswap' | 'balancer' | 'dydx' | 'maker'
  contract_address: string
  fee_percentage: number
  max_loan_usd: number
  is_active: boolean
  created_at: string
}

export interface FlashLoanTransaction {
  id: string
  agent_id: string
  protocol_id: string
  strategy: string
  assets: any[]
  loan_amount_usd: number
  profit_usd: number
  gas_cost_usd: number
  fee_usd: number
  net_profit_usd: number
  tx_hash?: string
  block_number?: number
  status: 'pending' | 'success' | 'failed' | 'reverted'
  error_reason?: string
  execution_time_ms?: number
  created_at: string
  executed_at?: string
  completed_at?: string
}

export interface FlashLoanProfitRule {
  id: string
  rule_name: string
  trigger_type: 'profit_amount' | 'profit_percentage' | 'opportunity_score'
  trigger_value: number
  secure_percentage: number
  reinvest_percentage: number
  reserve_percentage: number
  min_profit_usd: number
  max_loan_usd: number
  is_active: boolean
  created_at: string
}

export interface FlashLoanProfitHistory {
  id: string
  flashloan_tx_id: string
  agent_id: string
  gross_profit_usd: number
  secured_amount_usd: number
  reinvested_amount_usd: number
  reserved_amount_usd: number
  profit_rule_id?: string
  destination_wallet?: string
  destination_type: 'stable_coin' | 'master_wallet' | 'agent_wallet' | 'goal_fund'
  tx_hash?: string
  created_at: string
}

export interface FlashLoanOpportunity {
  id: string
  symbol: string
  exchange_from: string
  exchange_to: string
  price_from: number
  price_to: number
  spread_percentage: number
  estimated_profit_usd: number
  required_capital_usd: number
  gas_cost_usd: number
  net_profit_usd: number
  risk_level: 'low' | 'medium' | 'high'
  time_to_execute: number
  expires_at: string
  created_at: string
}

class SupabaseFlashLoanService {
  // Flash Loan Protocols
  async getProtocols() {
    const { data, error } = await supabase
      .from('flashloan_protocols')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data as FlashLoanProtocol[]
  }

  async createProtocol(protocol: Omit<FlashLoanProtocol, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('flashloan_protocols')
      .insert(protocol)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Flash Loan Transactions
  async getTransactions(filters?: {
    agent_id?: string
    status?: string
    limit?: number
  }) {
    let query = supabase
      .from('flashloan_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as FlashLoanTransaction[]
  }

  async createTransaction(transaction: Omit<FlashLoanTransaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('flashloan_transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTransaction(id: string, updates: Partial<FlashLoanTransaction>) {
    const { data, error } = await supabase
      .from('flashloan_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Flash Loan Opportunities
  async getOpportunities(filters?: {
    risk_level?: string
    min_profit?: number
  }) {
    let query = supabase
      .from('flashloan_opportunities')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('net_profit_usd', { ascending: false })

    if (filters?.risk_level) {
      query = query.eq('risk_level', filters.risk_level)
    }
    if (filters?.min_profit) {
      query = query.gte('net_profit_usd', filters.min_profit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as FlashLoanOpportunity[]
  }

  async createOpportunity(opportunity: Omit<FlashLoanOpportunity, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('flashloan_opportunities')
      .insert(opportunity)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Profit Rules
  async getProfitRules() {
    const { data, error } = await supabase
      .from('flashloan_profit_rules')
      .select('*')
      .eq('is_active', true)
      .order('trigger_value', { ascending: false })

    if (error) throw error
    return data as FlashLoanProfitRule[]
  }

  async createProfitRule(rule: Omit<FlashLoanProfitRule, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('flashloan_profit_rules')
      .insert(rule)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateProfitRule(id: string, updates: Partial<FlashLoanProfitRule>) {
    const { data, error } = await supabase
      .from('flashloan_profit_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Profit History
  async getProfitHistory(filters?: {
    start_date?: string
    end_date?: string
    agent_id?: string
  }) {
    let query = supabase
      .from('flashloan_profit_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }
    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id)
    }

    const { data, error } = await query
    if (error) throw error
    return data as FlashLoanProfitHistory[]
  }

  async createProfitHistory(history: Omit<FlashLoanProfitHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('flashloan_profit_history')
      .insert(history)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Agent Limits
  async getAgentLimits(agentId: string) {
    const { data, error } = await supabase
      .from('agent_flashloan_limits')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateAgentLimits(agentId: string, limits: any) {
    const { data, error } = await supabase
      .from('agent_flashloan_limits')
      .upsert({
        agent_id: agentId,
        ...limits,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Statistics
  async getStats(agentId?: string) {
    const baseQuery = supabase
      .from('flashloan_transactions')
      .select('status, net_profit_usd, gas_cost_usd, execution_time_ms')

    const query = agentId 
      ? baseQuery.eq('agent_id', agentId) 
      : baseQuery

    const { data, error } = await query
    if (error) throw error

    const stats = {
      total_transactions: data.length,
      successful_transactions: data.filter(t => t.status === 'success').length,
      failed_transactions: data.filter(t => t.status === 'failed').length,
      total_profit_usd: data
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.net_profit_usd || 0), 0),
      total_gas_cost_usd: data
        .reduce((sum, t) => sum + (t.gas_cost_usd || 0), 0),
      avg_execution_time_ms: data.length > 0
        ? data.reduce((sum, t) => sum + (t.execution_time_ms || 0), 0) / data.length
        : 0,
      success_rate: data.length > 0
        ? (data.filter(t => t.status === 'success').length / data.length) * 100
        : 0
    }

    return stats
  }

  // Real-time subscriptions
  subscribeToOpportunities(callback: (opportunity: FlashLoanOpportunity) => void) {
    return supabase
      .channel('flashloan-opportunities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'flashloan_opportunities'
      }, (payload) => {
        callback(payload.new as FlashLoanOpportunity)
      })
      .subscribe()
  }

  subscribeToTransactions(agentId: string, callback: (transaction: FlashLoanTransaction) => void) {
    return supabase
      .channel(`flashloan-transactions-${agentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flashloan_transactions',
        filter: `agent_id=eq.${agentId}`
      }, (payload) => {
        callback(payload.new as FlashLoanTransaction)
      })
      .subscribe()
  }

  subscribeToProfits(callback: (profit: FlashLoanProfitHistory) => void) {
    return supabase
      .channel('flashloan-profits')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'flashloan_profit_history'
      }, (payload) => {
        callback(payload.new as FlashLoanProfitHistory)
      })
      .subscribe()
  }

  // Profit distribution
  async distributeProfits(
    transactionId: string,
    distribution: {
      secured_amount: number
      reinvested_amount: number
      reserved_amount: number
      goal_contribution: number
    }
  ) {
    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from('flashloan_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError) throw txError
    if (!transaction) throw new Error('Transaction not found')

    // Create profit history record
    const profitHistory: Omit<FlashLoanProfitHistory, 'id' | 'created_at'> = {
      flashloan_tx_id: transactionId,
      agent_id: transaction.agent_id,
      gross_profit_usd: transaction.net_profit_usd || 0,
      secured_amount_usd: distribution.secured_amount,
      reinvested_amount_usd: distribution.reinvested_amount,
      reserved_amount_usd: distribution.reserved_amount,
      destination_type: 'stable_coin',
      destination_wallet: '0x...', // Would be actual wallet address
    }

    const { data, error } = await supabase
      .from('flashloan_profit_history')
      .insert(profitHistory)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Create and export singleton instance
export const supabaseFlashLoanService = new SupabaseFlashLoanService()