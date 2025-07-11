/**
 * Enhanced Profit Securing Service with Flash Loan Integration
 * Automated profit taking from flash loan arbitrage with smart distribution
 */

import { ProfitSecuringService, ProfitRule } from './profit-securing-service'
import { supabaseFlashLoanService, FlashLoanTransaction, FlashLoanProfitRule } from './supabase-flashloan-service'
import { profitSecuringService } from './profit-securing-service'

export interface FlashLoanProfitDistribution {
  secured: {
    amount: number
    destination: 'usdc' | 'usdt' | 'dai'
    wallet: string
    percentage: number
  }
  reinvested: {
    amount: number
    strategy: 'compound' | 'aave' | 'curve' | 'yearn'
    apy: number
    percentage: number
  }
  reserved: {
    amount: number
    purpose: 'gas' | 'emergency' | 'buffer'
    percentage: number
  }
  goalContribution: {
    amount: number
    goalId?: string
    percentage: number
  }
  agentReward: {
    amount: number
    agentId: string
    percentage: number
  }
}

export interface FlashLoanProfitStats {
  total_secured_usd: number
  total_reinvested_usd: number
  total_reserved_usd: number
  total_goal_contributions_usd: number
  total_agent_rewards_usd: number
  avg_profit_per_loan: number
  best_performing_strategy: string
  most_profitable_pair: string
}

export class EnhancedProfitSecuringService extends ProfitSecuringService {
  private flashLoanProfitRules: Map<string, FlashLoanProfitRule> = new Map()
  private profitStats: FlashLoanProfitStats = {
    total_secured_usd: 0,
    total_reinvested_usd: 0,
    total_reserved_usd: 0,
    total_goal_contributions_usd: 0,
    total_agent_rewards_usd: 0,
    avg_profit_per_loan: 0,
    best_performing_strategy: '',
    most_profitable_pair: ''
  }

  constructor() {
    super()
    this.initializeFlashLoanRules()
  }

  private async initializeFlashLoanRules() {
    try {
      const rules = await supabaseFlashLoanService.getProfitRules()
      rules.forEach(rule => {
        this.flashLoanProfitRules.set(rule.id, rule)
      })
    } catch (error) {
      console.error('Error loading flash loan profit rules:', error)
      // Initialize default rules
      this.createDefaultFlashLoanRules()
    }
  }

  private createDefaultFlashLoanRules() {
    const defaultRules: Omit<FlashLoanProfitRule, 'id' | 'created_at'>[] = [
      {
        rule_name: 'Conservative Flash Loan Profit',
        trigger_type: 'profit_amount',
        trigger_value: 100,
        secure_percentage: 50,
        reinvest_percentage: 30,
        reserve_percentage: 10,
        min_profit_usd: 100,
        max_loan_usd: 100000,
        is_active: true
      },
      {
        rule_name: 'Aggressive Flash Loan Profit',
        trigger_type: 'profit_amount',
        trigger_value: 500,
        secure_percentage: 40,
        reinvest_percentage: 40,
        reserve_percentage: 10,
        min_profit_usd: 500,
        max_loan_usd: 500000,
        is_active: true
      },
      {
        rule_name: 'High Score Opportunity',
        trigger_type: 'opportunity_score',
        trigger_value: 90,
        secure_percentage: 35,
        reinvest_percentage: 45,
        reserve_percentage: 10,
        min_profit_usd: 200,
        max_loan_usd: 1000000,
        is_active: true
      }
    ]

    defaultRules.forEach(async (rule) => {
      try {
        const created = await supabaseFlashLoanService.createProfitRule(rule)
        this.flashLoanProfitRules.set(created.id, created)
      } catch (error) {
        console.error('Error creating default rule:', error)
      }
    })
  }

  async executeFlashLoanProfitSecuring(transaction: FlashLoanTransaction): Promise<FlashLoanProfitDistribution> {
    // Check if transaction is successful and has profit
    if (transaction.status !== 'success' || !transaction.net_profit_usd || transaction.net_profit_usd <= 0) {
      throw new Error('Transaction not eligible for profit securing')
    }

    // Find applicable profit rule
    const applicableRule = await this.findApplicableRule(transaction)
    if (!applicableRule) {
      throw new Error('No applicable profit rule found')
    }

    // Calculate distribution
    const distribution = await this.calculateProfitDistribution(
      transaction.net_profit_usd,
      applicableRule,
      transaction.agent_id
    )

    // Execute distribution
    await this.executeProfitDistribution(transaction, distribution)

    // Update statistics
    await this.updateProfitStats(distribution, transaction)

    return distribution
  }

  private async findApplicableRule(transaction: FlashLoanTransaction): Promise<FlashLoanProfitRule | null> {
    const rules = Array.from(this.flashLoanProfitRules.values())
      .filter(rule => rule.is_active)
      .sort((a, b) => b.trigger_value - a.trigger_value)

    for (const rule of rules) {
      if (rule.trigger_type === 'profit_amount' && transaction.net_profit_usd >= rule.trigger_value) {
        return rule
      }
      // Add more trigger type checks as needed
    }

    return null
  }

  private async calculateProfitDistribution(
    netProfit: number,
    rule: FlashLoanProfitRule,
    agentId: string
  ): Promise<FlashLoanProfitDistribution> {
    // Calculate amounts based on percentages
    const securedAmount = netProfit * (rule.secure_percentage / 100)
    const reinvestedAmount = netProfit * (rule.reinvest_percentage / 100)
    const reservedAmount = netProfit * (rule.reserve_percentage / 100)
    
    // Agent gets 10% as reward
    const agentRewardPercentage = 10
    const agentReward = netProfit * (agentRewardPercentage / 100)
    
    // Remaining goes to goals
    const goalContribution = netProfit - securedAmount - reinvestedAmount - reservedAmount - agentReward

    return {
      secured: {
        amount: securedAmount,
        destination: 'usdc', // Default to USDC
        wallet: await this.getSecureWallet(),
        percentage: rule.secure_percentage
      },
      reinvested: {
        amount: reinvestedAmount,
        strategy: 'aave', // Default to Aave for safety
        apy: 8.5, // Current Aave USDC APY
        percentage: rule.reinvest_percentage
      },
      reserved: {
        amount: reservedAmount,
        purpose: 'gas',
        percentage: rule.reserve_percentage
      },
      goalContribution: {
        amount: goalContribution,
        goalId: await this.getActiveGoalId(),
        percentage: Math.max(0, 100 - rule.secure_percentage - rule.reinvest_percentage - rule.reserve_percentage - agentRewardPercentage)
      },
      agentReward: {
        amount: agentReward,
        agentId: agentId,
        percentage: agentRewardPercentage
      }
    }
  }

  private async executeProfitDistribution(
    transaction: FlashLoanTransaction,
    distribution: FlashLoanProfitDistribution
  ) {
    try {
      // Record the distribution in Supabase
      await supabaseFlashLoanService.distributeProfits(transaction.id, {
        secured_amount: distribution.secured.amount,
        reinvested_amount: distribution.reinvested.amount,
        reserved_amount: distribution.reserved.amount,
        goal_contribution: distribution.goalContribution.amount
      })

      // TODO: Execute actual on-chain transactions
      // This would involve:
      // 1. Swap profits to stable coins
      // 2. Transfer to secure wallet
      // 3. Deposit to yield protocol
      // 4. Update agent wallet balance
      // 5. Contribute to goal fund

      console.log('Profit distribution executed:', distribution)
    } catch (error) {
      console.error('Error executing profit distribution:', error)
      throw error
    }
  }

  private async updateProfitStats(distribution: FlashLoanProfitDistribution, transaction: FlashLoanTransaction) {
    this.profitStats.total_secured_usd += distribution.secured.amount
    this.profitStats.total_reinvested_usd += distribution.reinvested.amount
    this.profitStats.total_reserved_usd += distribution.reserved.amount
    this.profitStats.total_goal_contributions_usd += distribution.goalContribution.amount
    this.profitStats.total_agent_rewards_usd += distribution.agentReward.amount

    // Update average
    const totalLoans = await this.getTotalFlashLoans()
    this.profitStats.avg_profit_per_loan = 
      (this.profitStats.total_secured_usd + this.profitStats.total_reinvested_usd) / totalLoans

    // Update best performing strategy
    if (transaction.strategy) {
      this.profitStats.best_performing_strategy = transaction.strategy
    }
  }

  private async getSecureWallet(): Promise<string> {
    // In production, this would return the actual secure wallet address
    // For now, return a placeholder
    return '0x1234567890123456789012345678901234567890'
  }

  private async getActiveGoalId(): Promise<string | undefined> {
    // In production, this would find the active goal with highest priority
    // For now, return undefined
    return undefined
  }

  private async getTotalFlashLoans(): Promise<number> {
    const stats = await supabaseFlashLoanService.getStats()
    return stats.total_transactions || 1
  }

  // Flash loan specific methods
  async addFlashLoanProfitRule(rule: Omit<FlashLoanProfitRule, 'id' | 'created_at'>): Promise<FlashLoanProfitRule> {
    const created = await supabaseFlashLoanService.createProfitRule(rule)
    this.flashLoanProfitRules.set(created.id, created)
    return created
  }

  async updateFlashLoanProfitRule(id: string, updates: Partial<FlashLoanProfitRule>): Promise<FlashLoanProfitRule> {
    const updated = await supabaseFlashLoanService.updateProfitRule(id, updates)
    this.flashLoanProfitRules.set(id, updated)
    return updated
  }

  async getFlashLoanProfitRules(): Promise<FlashLoanProfitRule[]> {
    return Array.from(this.flashLoanProfitRules.values())
  }

  async getFlashLoanProfitStats(): Promise<FlashLoanProfitStats> {
    return this.profitStats
  }

  // Auto-secure profits from successful flash loans
  async autoSecureFlashLoanProfits(transaction: FlashLoanTransaction): Promise<void> {
    try {
      // Only process successful transactions with profit
      if (transaction.status === 'success' && transaction.net_profit_usd > 0) {
        const distribution = await this.executeFlashLoanProfitSecuring(transaction)
        
        console.log(`Auto-secured flash loan profits:`, {
          transaction_id: transaction.id,
          total_profit: transaction.net_profit_usd,
          secured: distribution.secured.amount,
          reinvested: distribution.reinvested.amount,
          reserved: distribution.reserved.amount,
          goal_contribution: distribution.goalContribution.amount,
          agent_reward: distribution.agentReward.amount
        })
      }
    } catch (error) {
      console.error('Error auto-securing flash loan profits:', error)
    }
  }

  // Subscribe to successful flash loan transactions
  subscribeToFlashLoanProfits() {
    return supabaseFlashLoanService.subscribeToTransactions('all', async (transaction) => {
      if (transaction.status === 'success' && transaction.net_profit_usd > 0) {
        await this.autoSecureFlashLoanProfits(transaction)
      }
    })
  }
}

// Create and export singleton instance
export const enhancedProfitSecuringService = new EnhancedProfitSecuringService()