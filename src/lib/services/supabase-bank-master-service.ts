'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Bank Master Service Types
export interface BankMasterConfig {
  id: string
  name: string
  version: string
  capabilities: string[]
  risk_tolerance: number
  max_allocation_per_agent: number
  profit_threshold: number
  rebalance_interval_ms: number
  emergency_stop_threshold: number
  multi_chain_enabled: boolean
  supported_chains: string[]
  llm_enabled: boolean
  mcp_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VaultWallet {
  id: string
  bank_master_id: string
  name: string
  chain: string
  address: string
  is_testnet: boolean
  balance_usd: number
  last_balance_update: string
  created_at: string
  updated_at: string
}

export interface ProfitCollection {
  id: string
  bank_master_id: string
  collection_id: string
  source: 'goal' | 'agent' | 'farm' | 'manual'
  source_id: string
  source_name: string
  amount: number
  token: string
  chain: string
  vault_address: string
  status: 'pending' | 'completed' | 'failed'
  tx_hash?: string
  reason: string
  execution_time_ms?: number
  created_at: string
  completed_at?: string
  error_message?: string
}

export interface VaultOperation {
  id: string
  bank_master_id: string
  operation_id: string
  operation_type: 'deposit' | 'withdraw' | 'allocate' | 'rebalance' | 'emergency'
  amount: number
  token: string
  chain: string
  from_address: string
  to_address: string
  status: 'pending' | 'completed' | 'failed'
  tx_hash?: string
  gas_used?: number
  gas_price_gwei?: number
  reason: string
  execution_time_ms?: number
  created_at: string
  completed_at?: string
  error_message?: string
}

export interface BankMasterDecision {
  id: string
  bank_master_id: string
  decision_id: string
  decision_type: 'allocation' | 'collection' | 'rebalance' | 'emergency' | 'optimization'
  reasoning: string
  confidence: number
  expected_outcome: string
  risk_assessment: number
  parameters: any
  result?: any
  execution_time_ms?: number
  success?: boolean
  created_at: string
  executed_at?: string
}

export interface ChatMessage {
  id: string
  bank_master_id: string
  message_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: any
  created_at: string
}

export interface PerformanceMetrics {
  id: string
  bank_master_id: string
  total_assets_managed: number
  total_profits_collected: number
  total_allocated: number
  total_returns: number
  avg_roi: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  total_decisions: number
  successful_decisions: number
  chain_distribution: Record<string, number>
  top_performing_agents: Array<{ agentId: string; roi: number }>
  risk_exposure: Record<string, number>
  calculated_at: string
}

export interface GoalProfitMapping {
  id: string
  goal_id: string
  goal_name: string
  goal_type: string
  completed_at: string
  profit_amount: number
  profit_token: string
  profit_chain: string
  source_agent_id?: string
  source_farm_id?: string
  collection_status: 'pending' | 'collecting' | 'completed' | 'failed'
  collection_tx_hash?: string
  collection_timestamp?: string
  vault_address: string
  collection_reason: string
  created_at: string
}

export interface ProfitCollectionRule {
  id: string
  rule_id: string
  name: string
  goal_type: string
  trigger_condition: 'immediate' | 'threshold' | 'percentage' | 'time_based'
  trigger_value?: number
  collection_percentage: number
  preferred_chain: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface WalletBalance {
  id: string
  wallet_id: string
  token_symbol: string
  token_address?: string
  balance: number
  decimals: number
  usd_value?: number
  is_native: boolean
  last_updated: string
}

class SupabaseBankMasterService {
  private supabase: any
  private isAvailable: boolean = false

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    try {
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found for Bank Master service')
        return
      }

      this.supabase = createClient(supabaseUrl, supabaseKey)
      this.isAvailable = true
      console.log('✅ Supabase Bank Master Service initialized')
    } catch (error) {
      console.error('Failed to initialize Supabase Bank Master Service:', error)
      this.isAvailable = false
    }
  }

  // Bank Master Configuration
  async getBankMasterConfig(): Promise<BankMasterConfig | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('bank_master_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching bank master config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getBankMasterConfig:', error)
      return null
    }
  }

  async updateBankMasterConfig(id: string, updates: Partial<BankMasterConfig>): Promise<boolean> {
    if (!this.isAvailable) return false

    try {
      const { error } = await this.supabase
        .from('bank_master_config')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating bank master config:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateBankMasterConfig:', error)
      return false
    }
  }

  // Vault Wallets
  async getVaultWallets(): Promise<VaultWallet[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('vault_wallets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vault wallets:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getVaultWallets:', error)
      return []
    }
  }

  async createVaultWallet(wallet: Omit<VaultWallet, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('vault_wallets')
        .insert([wallet])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating vault wallet:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createVaultWallet:', error)
      return null
    }
  }

  async updateVaultWalletBalance(walletId: string, balanceUsd: number): Promise<boolean> {
    if (!this.isAvailable) return false

    try {
      const { error } = await this.supabase
        .from('vault_wallets')
        .update({ 
          balance_usd: balanceUsd,
          last_balance_update: new Date().toISOString()
        })
        .eq('id', walletId)

      if (error) {
        console.error('Error updating vault wallet balance:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateVaultWalletBalance:', error)
      return false
    }
  }

  // Profit Collections
  async getProfitCollections(limit: number = 50): Promise<ProfitCollection[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('profit_collections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching profit collections:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getProfitCollections:', error)
      return []
    }
  }

  async createProfitCollection(collection: Omit<ProfitCollection, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('profit_collections')
        .insert([collection])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating profit collection:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createProfitCollection:', error)
      return null
    }
  }

  async updateProfitCollectionStatus(
    collectionId: string, 
    status: 'pending' | 'completed' | 'failed',
    txHash?: string,
    errorMessage?: string
  ): Promise<boolean> {
    if (!this.isAvailable) return false

    try {
      const updates: any = { status }
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
        if (txHash) updates.tx_hash = txHash
      }
      
      if (status === 'failed' && errorMessage) {
        updates.error_message = errorMessage
      }

      const { error } = await this.supabase
        .from('profit_collections')
        .update(updates)
        .eq('collection_id', collectionId)

      if (error) {
        console.error('Error updating profit collection status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateProfitCollectionStatus:', error)
      return false
    }
  }

  // Vault Operations
  async getVaultOperations(limit: number = 30): Promise<VaultOperation[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('vault_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching vault operations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getVaultOperations:', error)
      return []
    }
  }

  async createVaultOperation(operation: Omit<VaultOperation, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('vault_operations')
        .insert([operation])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating vault operation:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createVaultOperation:', error)
      return null
    }
  }

  // Bank Master Decisions
  async getBankMasterDecisions(limit: number = 20): Promise<BankMasterDecision[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('bank_master_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching bank master decisions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getBankMasterDecisions:', error)
      return []
    }
  }

  async createBankMasterDecision(decision: Omit<BankMasterDecision, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('bank_master_decisions')
        .insert([decision])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating bank master decision:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createBankMasterDecision:', error)
      return null
    }
  }

  // Chat Messages
  async getChatMessages(limit: number = 100): Promise<ChatMessage[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('bank_master_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching chat messages:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getChatMessages:', error)
      return []
    }
  }

  async saveChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('bank_master_chat')
        .insert([message])
        .select('id')
        .single()

      if (error) {
        console.error('Error saving chat message:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in saveChatMessage:', error)
      return null
    }
  }

  // Performance Metrics
  async getLatestPerformanceMetrics(): Promise<PerformanceMetrics | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('bank_master_performance')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching performance metrics:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getLatestPerformanceMetrics:', error)
      return null
    }
  }

  async savePerformanceMetrics(metrics: Omit<PerformanceMetrics, 'id' | 'calculated_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('bank_master_performance')
        .insert([{ ...metrics, calculated_at: new Date().toISOString() }])
        .select('id')
        .single()

      if (error) {
        console.error('Error saving performance metrics:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in savePerformanceMetrics:', error)
      return null
    }
  }

  // Goal Profit Mappings
  async getGoalProfitMappings(): Promise<GoalProfitMapping[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('goal_profit_mappings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching goal profit mappings:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getGoalProfitMappings:', error)
      return []
    }
  }

  async createGoalProfitMapping(mapping: Omit<GoalProfitMapping, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('goal_profit_mappings')
        .insert([mapping])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating goal profit mapping:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createGoalProfitMapping:', error)
      return null
    }
  }

  // Profit Collection Rules
  async getProfitCollectionRules(): Promise<ProfitCollectionRule[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('profit_collection_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) {
        console.error('Error fetching profit collection rules:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getProfitCollectionRules:', error)
      return []
    }
  }

  async createProfitCollectionRule(rule: Omit<ProfitCollectionRule, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.isAvailable) return null

    try {
      const { data, error } = await this.supabase
        .from('profit_collection_rules')
        .insert([rule])
        .select('id')
        .single()

      if (error) {
        console.error('Error creating profit collection rule:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in createProfitCollectionRule:', error)
      return null
    }
  }

  async updateProfitCollectionRule(ruleId: string, updates: Partial<ProfitCollectionRule>): Promise<boolean> {
    if (!this.isAvailable) return false

    try {
      const { error } = await this.supabase
        .from('profit_collection_rules')
        .update(updates)
        .eq('rule_id', ruleId)

      if (error) {
        console.error('Error updating profit collection rule:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateProfitCollectionRule:', error)
      return false
    }
  }

  // Wallet Balances
  async getWalletBalances(walletId: string): Promise<WalletBalance[]> {
    if (!this.isAvailable) return []

    try {
      const { data, error } = await this.supabase
        .from('wallet_balances')
        .select('*')
        .eq('wallet_id', walletId)
        .order('last_updated', { ascending: false })

      if (error) {
        console.error('Error fetching wallet balances:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getWalletBalances:', error)
      return []
    }
  }

  async updateWalletBalance(walletId: string, tokenSymbol: string, balance: number, usdValue?: number): Promise<boolean> {
    if (!this.isAvailable) return false

    try {
      const { error } = await this.supabase
        .from('wallet_balances')
        .upsert({
          wallet_id: walletId,
          token_symbol: tokenSymbol,
          balance,
          usd_value: usdValue,
          last_updated: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating wallet balance:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateWalletBalance:', error)
      return false
    }
  }

  // Utility methods
  async isHealthy(): Promise<boolean> {
    return this.isAvailable
  }

  async getTotalStats(): Promise<{
    totalCollections: number
    totalOperations: number
    totalDecisions: number
    totalWallets: number
  }> {
    if (!this.isAvailable) return { totalCollections: 0, totalOperations: 0, totalDecisions: 0, totalWallets: 0 }

    try {
      const [collections, operations, decisions, wallets] = await Promise.all([
        this.supabase.from('profit_collections').select('count', { count: 'exact' }),
        this.supabase.from('vault_operations').select('count', { count: 'exact' }),
        this.supabase.from('bank_master_decisions').select('count', { count: 'exact' }),
        this.supabase.from('vault_wallets').select('count', { count: 'exact' })
      ])

      return {
        totalCollections: collections.count || 0,
        totalOperations: operations.count || 0,
        totalDecisions: decisions.count || 0,
        totalWallets: wallets.count || 0
      }
    } catch (error) {
      console.error('Error fetching total stats:', error)
      return { totalCollections: 0, totalOperations: 0, totalDecisions: 0, totalWallets: 0 }
    }
  }
}

export const supabaseBankMasterService = new SupabaseBankMasterService()
export default supabaseBankMasterService