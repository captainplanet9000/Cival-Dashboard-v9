/**
 * Simplified Trading Client - Direct API calls without AG-UI complexity
 * Use this for immediate wizard integration and live trading
 */

import { backendClient } from './backend-client'

interface AgentCreationData {
  name: string
  strategy_type: string
  funding_amount: number
  llm_provider?: string
  personality?: string
  risk_tolerance?: 'low' | 'medium' | 'high'
  profit_target?: number
  trade_count_target?: number
  win_rate_target?: number
}

interface FarmCreationData {
  name: string
  farm_type: string
  total_allocation: number
  assigned_agents: string[]
  coordination_rules?: any
}

interface GoalCreationData {
  name: string
  goal_type: string
  target_value: number
  collection_percentage?: number
  auto_collect?: boolean
}

interface TradingAgent {
  id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  wallet_address: string
  current_balance: number
  performance: {
    total_trades: number
    total_profit: number
    win_rate: number
    current_roi: number
  }
  goals: {
    profit_target: number
    current_progress: number
  }
}

interface Farm {
  id: string
  name: string
  type: string
  agents: TradingAgent[]
  total_allocation: number
  current_value: number
  performance: {
    total_profit: number
    roi: number
  }
}

interface Goal {
  id: string
  name: string
  type: string
  target_value: number
  current_value: number
  progress: number
  status: 'active' | 'completed' | 'paused'
  profit_collected: number
}

export class SimplifiedTradingClient {
  private baseUrl: string
  private headers: HeadersInit

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  // Agent Management
  async createAgent(agentData: AgentCreationData): Promise<TradingAgent> {
    try {
      console.log('🤖 Creating agent:', agentData.name)
      
      const response = await fetch(`${this.baseUrl}/api/v1/agents`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(agentData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.statusText}`)
      }

      const agent = await response.json()
      
      // Immediately integrate with live trading
      await this.integrateAgentWithLiveTrading(agent.id)
      
      console.log('✅ Agent created and integrated:', agent.name)
      return agent
    } catch (error) {
      console.error('❌ Failed to create agent:', error)
      throw error
    }
  }

  async integrateAgentWithLiveTrading(agentId: string): Promise<boolean> {
    try {
      console.log('🔄 Integrating agent with live trading:', agentId)
      
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/integrate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          enable_live_trading: true,
          create_wallet: true,
          start_trading: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to integrate agent: ${response.statusText}`)
      }

      console.log('✅ Agent integrated with live trading')
      return true
    } catch (error) {
      console.error('❌ Failed to integrate agent:', error)
      return false
    }
  }

  async getAgents(): Promise<TradingAgent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get agents: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get agents:', error)
      return []
    }
  }

  async startAgent(agentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/start`, {
        method: 'POST',
        headers: this.headers
      })

      return response.ok
    } catch (error) {
      console.error('❌ Failed to start agent:', error)
      return false
    }
  }

  async stopAgent(agentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/stop`, {
        method: 'POST',
        headers: this.headers
      })

      return response.ok
    } catch (error) {
      console.error('❌ Failed to stop agent:', error)
      return false
    }
  }

  // Farm Management
  async createFarm(farmData: FarmCreationData): Promise<Farm> {
    try {
      console.log('🏭 Creating farm:', farmData.name)
      
      const response = await fetch(`${this.baseUrl}/api/v1/farms`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(farmData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create farm: ${response.statusText}`)
      }

      const farm = await response.json()
      
      // Immediately integrate with coordination system
      await this.integrateFarmWithCoordination(farm.id)
      
      console.log('✅ Farm created and integrated:', farm.name)
      return farm
    } catch (error) {
      console.error('❌ Failed to create farm:', error)
      throw error
    }
  }

  async integrateFarmWithCoordination(farmId: string): Promise<boolean> {
    try {
      console.log('🔄 Integrating farm with coordination:', farmId)
      
      const response = await fetch(`${this.baseUrl}/api/v1/farms/${farmId}/integrate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          enable_coordination: true,
          distribute_funding: true,
          start_operations: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to integrate farm: ${response.statusText}`)
      }

      console.log('✅ Farm integrated with coordination')
      return true
    } catch (error) {
      console.error('❌ Failed to integrate farm:', error)
      return false
    }
  }

  async getFarms(): Promise<Farm[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/farms`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get farms: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get farms:', error)
      return []
    }
  }

  // Goal Management
  async createGoal(goalData: GoalCreationData): Promise<Goal> {
    try {
      console.log('🎯 Creating goal:', goalData.name)
      
      const response = await fetch(`${this.baseUrl}/api/v1/goals`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(goalData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create goal: ${response.statusText}`)
      }

      const goal = await response.json()
      
      // Immediately integrate with automation system
      await this.integrateGoalWithAutomation(goal.id)
      
      console.log('✅ Goal created and integrated:', goal.name)
      return goal
    } catch (error) {
      console.error('❌ Failed to create goal:', error)
      throw error
    }
  }

  async integrateGoalWithAutomation(goalId: string): Promise<boolean> {
    try {
      console.log('🔄 Integrating goal with automation:', goalId)
      
      const response = await fetch(`${this.baseUrl}/api/v1/goals/${goalId}/integrate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          enable_automation: true,
          auto_collect_profits: true,
          start_monitoring: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to integrate goal: ${response.statusText}`)
      }

      console.log('✅ Goal integrated with automation')
      return true
    } catch (error) {
      console.error('❌ Failed to integrate goal:', error)
      return false
    }
  }

  async getGoals(): Promise<Goal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/goals`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get goals: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get goals:', error)
      return []
    }
  }

  // Trading Operations
  async depositFunds(amount: number): Promise<boolean> {
    try {
      console.log('💰 Depositing funds:', amount)
      
      const response = await fetch(`${this.baseUrl}/api/v1/wallet/deposit`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          amount,
          currency: 'USD',
          auto_distribute: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to deposit funds: ${response.statusText}`)
      }

      console.log('✅ Funds deposited successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to deposit funds:', error)
      return false
    }
  }

  async getPortfolioSummary(): Promise<{
    total_value: number
    total_profit: number
    active_agents: number
    total_trades: number
    win_rate: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/portfolio/summary`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get portfolio: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get portfolio:', error)
      return {
        total_value: 0,
        total_profit: 0,
        active_agents: 0,
        total_trades: 0,
        win_rate: 0
      }
    }
  }

  async getSystemStatus(): Promise<{
    trading_active: boolean
    agents_running: number
    farms_active: number
    goals_monitoring: number
    last_trade_time: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/system/status`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get system status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get system status:', error)
      return {
        trading_active: false,
        agents_running: 0,
        farms_active: 0,
        goals_monitoring: 0,
        last_trade_time: new Date().toISOString()
      }
    }
  }

  // Real-time Updates (Polling instead of WebSocket)
  async pollForUpdates(): Promise<{
    agents: TradingAgent[]
    farms: Farm[]
    goals: Goal[]
    portfolio: any
    system: any
  }> {
    try {
      const [agents, farms, goals, portfolio, system] = await Promise.all([
        this.getAgents(),
        this.getFarms(),
        this.getGoals(),
        this.getPortfolioSummary(),
        this.getSystemStatus()
      ])

      return { agents, farms, goals, portfolio, system }
    } catch (error) {
      console.error('❌ Failed to poll for updates:', error)
      return {
        agents: [],
        farms: [],
        goals: [],
        portfolio: {},
        system: {}
      }
    }
  }

  // Wizard Integration Helper
  async processWizardCompletions(wizardResults: {
    agents?: AgentCreationData[]
    farms?: FarmCreationData[]
    goals?: GoalCreationData[]
    initialDeposit?: number
  }): Promise<{
    success: boolean
    agents: TradingAgent[]
    farms: Farm[]
    goals: Goal[]
    errors: string[]
  }> {
    const results = {
      success: true,
      agents: [] as TradingAgent[],
      farms: [] as Farm[],
      goals: [] as Goal[],
      errors: [] as string[]
    }

    try {
      // Step 1: Deposit initial funds if specified
      if (wizardResults.initialDeposit) {
        const depositSuccess = await this.depositFunds(wizardResults.initialDeposit)
        if (!depositSuccess) {
          results.errors.push('Failed to deposit initial funds')
          results.success = false
        }
      }

      // Step 2: Create agents
      if (wizardResults.agents) {
        for (const agentData of wizardResults.agents) {
          try {
            const agent = await this.createAgent(agentData)
            results.agents.push(agent)
          } catch (error) {
            results.errors.push(`Failed to create agent ${agentData.name}: ${error}`)
            results.success = false
          }
        }
      }

      // Step 3: Create farms
      if (wizardResults.farms) {
        for (const farmData of wizardResults.farms) {
          try {
            const farm = await this.createFarm(farmData)
            results.farms.push(farm)
          } catch (error) {
            results.errors.push(`Failed to create farm ${farmData.name}: ${error}`)
            results.success = false
          }
        }
      }

      // Step 4: Create goals
      if (wizardResults.goals) {
        for (const goalData of wizardResults.goals) {
          try {
            const goal = await this.createGoal(goalData)
            results.goals.push(goal)
          } catch (error) {
            results.errors.push(`Failed to create goal ${goalData.name}: ${error}`)
            results.success = false
          }
        }
      }

      console.log('✅ Wizard processing completed:', results)
      return results

    } catch (error) {
      console.error('❌ Failed to process wizard completions:', error)
      results.success = false
      results.errors.push(`General error: ${error}`)
      return results
    }
  }
}

// Singleton instance
export const simplifiedTradingClient = new SimplifiedTradingClient()
export default simplifiedTradingClient