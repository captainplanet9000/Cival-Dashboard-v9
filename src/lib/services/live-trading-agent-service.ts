'use client'

import { EventEmitter } from 'events'
import { supabaseBankMasterService } from './supabase-bank-master-service'
import { enhancedAlchemyService } from '../blockchain/enhanced-alchemy-service'
import { mcpClient } from '../mcp/mcp-client'
import GoalsService from '../goals/goals-service'

export interface TradingStrategy {
  id: string
  name: string
  description: string
  strategy_type: 'arbitrage' | 'grid' | 'momentum' | 'mean_reversion' | 'scalping'
  parameters: {
    min_profit_threshold: number
    max_risk_percentage: number
    stop_loss_percentage: number
    take_profit_percentage: number
    max_position_size: number
    timeframe: string
    indicators: string[]
  }
  supported_chains: string[]
  supported_tokens: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LiveTradingAgent {
  id: string
  name: string
  strategy_id: string
  strategy: TradingStrategy
  allocated_amount: number
  current_balance: number
  chain: string
  wallet_address: string
  status: 'active' | 'paused' | 'stopped' | 'error'
  performance: {
    total_trades: number
    profitable_trades: number
    total_profit: number
    win_rate: number
    sharpe_ratio: number
    max_drawdown: number
    current_roi: number
  }
  goals: {
    profit_target: number
    trade_count_target: number
    win_rate_target: number
    current_progress: number
  }
  last_trade_time: string
  created_at: string
  updated_at: string
}

export interface MarketAnalysis {
  symbol: string
  price: number
  volume_24h: number
  price_change_24h: number
  indicators: {
    rsi: number
    macd: number
    bollinger_bands: { upper: number; middle: number; lower: number }
    moving_averages: { ma_20: number; ma_50: number; ma_200: number }
  }
  arbitrage_opportunities: Array<{
    exchange_from: string
    exchange_to: string
    profit_percentage: number
    execution_time_estimate: number
  }>
  trading_signals: {
    signal: 'buy' | 'sell' | 'hold'
    strength: number
    confidence: number
  }
  timestamp: string
}

export interface ArbitrageExecution {
  id: string
  agent_id: string
  opportunity_id: string
  token_pair: string
  buy_exchange: string
  sell_exchange: string
  buy_price: number
  sell_price: number
  amount: number
  expected_profit: number
  actual_profit: number
  execution_time: number
  status: 'pending' | 'executing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  completed_at?: string
}

class LiveTradingAgentService extends EventEmitter {
  private agents: Map<string, LiveTradingAgent> = new Map()
  private strategies: Map<string, TradingStrategy> = new Map()
  private marketAnalysis: Map<string, MarketAnalysis> = new Map()
  private activeArbitrageExecutions: Map<string, ArbitrageExecution> = new Map()
  private isActive = false
  private tradingInterval?: NodeJS.Timeout
  private analysisInterval?: NodeJS.Timeout

  constructor() {
    super()
    this.initializeService()
  }

  private async initializeService() {
    try {
      await this.loadStrategiesFromSupabase()
      await this.loadAgentsFromSupabase()
      await this.initializeMCPConnection()
      
      console.log('✅ Live Trading Agent Service initialized')
      this.emit('initialized')
    } catch (error) {
      console.error('Failed to initialize Live Trading Agent Service:', error)
    }
  }

  private async loadStrategiesFromSupabase() {
    try {
      // In a real implementation, this would load from a strategies table
      // For now, we'll create some default strategies
      const defaultStrategies: TradingStrategy[] = [
        {
          id: 'arbitrage_001',
          name: 'Multi-DEX Arbitrage',
          description: 'Exploits price differences across decentralized exchanges',
          strategy_type: 'arbitrage',
          parameters: {
            min_profit_threshold: 0.5, // 0.5% minimum profit
            max_risk_percentage: 2.0, // 2% max risk per trade
            stop_loss_percentage: 1.0,
            take_profit_percentage: 3.0,
            max_position_size: 1000,
            timeframe: '1m',
            indicators: ['price_difference', 'volume_ratio', 'gas_cost']
          },
          supported_chains: ['ethereum', 'arbitrum', 'base'],
          supported_tokens: ['USDC', 'USDT', 'WETH', 'WBTC'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'grid_001',
          name: 'Grid Trading Bot',
          description: 'Places buy and sell orders at predetermined intervals',
          strategy_type: 'grid',
          parameters: {
            min_profit_threshold: 0.3,
            max_risk_percentage: 1.5,
            stop_loss_percentage: 5.0,
            take_profit_percentage: 2.0,
            max_position_size: 500,
            timeframe: '5m',
            indicators: ['rsi', 'bollinger_bands', 'volume']
          },
          supported_chains: ['ethereum', 'arbitrum'],
          supported_tokens: ['USDC', 'WETH'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'momentum_001',
          name: 'Momentum Scalper',
          description: 'High-frequency momentum-based trading',
          strategy_type: 'momentum',
          parameters: {
            min_profit_threshold: 0.2,
            max_risk_percentage: 1.0,
            stop_loss_percentage: 0.5,
            take_profit_percentage: 1.0,
            max_position_size: 200,
            timeframe: '1m',
            indicators: ['macd', 'rsi', 'volume', 'price_momentum']
          },
          supported_chains: ['arbitrum', 'base'],
          supported_tokens: ['USDC', 'WETH'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      defaultStrategies.forEach(strategy => {
        this.strategies.set(strategy.id, strategy)
      })

      console.log(`Loaded ${defaultStrategies.length} trading strategies`)
    } catch (error) {
      console.error('Failed to load strategies:', error)
    }
  }

  private async loadAgentsFromSupabase() {
    try {
      // Create default agents using the strategies
      const defaultAgents: LiveTradingAgent[] = [
        {
          id: 'agent_arbitrage_001',
          name: 'Arbitrage Hunter Alpha',
          strategy_id: 'arbitrage_001',
          strategy: this.strategies.get('arbitrage_001')!,
          allocated_amount: 1000,
          current_balance: 1000,
          chain: 'ethereum',
          wallet_address: '0xarb1000000000000000000000000000000000000',
          status: 'active',
          performance: {
            total_trades: 0,
            profitable_trades: 0,
            total_profit: 0,
            win_rate: 0,
            sharpe_ratio: 0,
            max_drawdown: 0,
            current_roi: 0
          },
          goals: {
            profit_target: 100, // $100 profit target
            trade_count_target: 50,
            win_rate_target: 70,
            current_progress: 0
          },
          last_trade_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'agent_grid_001',
          name: 'Grid Master Beta',
          strategy_id: 'grid_001',
          strategy: this.strategies.get('grid_001')!,
          allocated_amount: 500,
          current_balance: 500,
          chain: 'arbitrum',
          wallet_address: '0xgrid000000000000000000000000000000000000',
          status: 'active',
          performance: {
            total_trades: 0,
            profitable_trades: 0,
            total_profit: 0,
            win_rate: 0,
            sharpe_ratio: 0,
            max_drawdown: 0,
            current_roi: 0
          },
          goals: {
            profit_target: 75,
            trade_count_target: 100,
            win_rate_target: 65,
            current_progress: 0
          },
          last_trade_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'agent_momentum_001',
          name: 'Momentum Scalper Gamma',
          strategy_id: 'momentum_001',
          strategy: this.strategies.get('momentum_001')!,
          allocated_amount: 200,
          current_balance: 200,
          chain: 'base',
          wallet_address: '0xmom0000000000000000000000000000000000000',
          status: 'active',
          performance: {
            total_trades: 0,
            profitable_trades: 0,
            total_profit: 0,
            win_rate: 0,
            sharpe_ratio: 0,
            max_drawdown: 0,
            current_roi: 0
          },
          goals: {
            profit_target: 50,
            trade_count_target: 200,
            win_rate_target: 60,
            current_progress: 0
          },
          last_trade_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      defaultAgents.forEach(agent => {
        this.agents.set(agent.id, agent)
      })

      console.log(`Loaded ${defaultAgents.length} trading agents`)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  private async initializeMCPConnection() {
    try {
      await mcpClient.initialize()
      console.log('MCP client initialized for trading agents')
    } catch (error) {
      console.error('Failed to initialize MCP client:', error)
    }
  }

  async startLiveTrading(): Promise<boolean> {
    try {
      if (this.isActive) {
        console.log('Live trading already active')
        return true
      }

      this.isActive = true
      
      // Start market analysis
      this.startMarketAnalysis()
      
      // Start trading loop
      this.startTradingLoop()
      
      this.emit('tradingStarted')
      console.log('🚀 Live trading started')
      
      return true
    } catch (error) {
      console.error('Failed to start live trading:', error)
      return false
    }
  }

  async stopLiveTrading(): Promise<boolean> {
    try {
      this.isActive = false
      
      if (this.tradingInterval) {
        clearInterval(this.tradingInterval)
      }
      
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval)
      }
      
      this.emit('tradingStopped')
      console.log('⏹️ Live trading stopped')
      
      return true
    } catch (error) {
      console.error('Failed to stop live trading:', error)
      return false
    }
  }

  private startMarketAnalysis() {
    this.analysisInterval = setInterval(async () => {
      await this.performMarketAnalysis()
    }, 30000) // Analyze every 30 seconds
  }

  private startTradingLoop() {
    this.tradingInterval = setInterval(async () => {
      await this.executeTradingCycle()
    }, 10000) // Execute trading cycle every 10 seconds
  }

  private async performMarketAnalysis() {
    try {
      if (!this.isActive) return

      const tokens = ['USDC', 'WETH', 'USDT', 'WBTC']
      
      for (const token of tokens) {
        // Get live market data
        const marketData = await mcpClient.getLiveMarketData({
          symbols: [token],
          include_analytics: true
        })

        if (marketData.success && marketData.data) {
          const tokenData = marketData.data.market_data[token]
          if (tokenData) {
            const analysis: MarketAnalysis = {
              symbol: token,
              price: tokenData.price,
              volume_24h: tokenData.volume_24h,
              price_change_24h: tokenData.change_24h_percentage,
              indicators: {
                rsi: Math.random() * 100, // Mock RSI
                macd: (Math.random() - 0.5) * 2, // Mock MACD
                bollinger_bands: {
                  upper: tokenData.price * 1.02,
                  middle: tokenData.price,
                  lower: tokenData.price * 0.98
                },
                moving_averages: {
                  ma_20: tokenData.price * 0.99,
                  ma_50: tokenData.price * 0.98,
                  ma_200: tokenData.price * 0.95
                }
              },
              arbitrage_opportunities: [],
              trading_signals: {
                signal: Math.random() > 0.5 ? 'buy' : Math.random() > 0.5 ? 'sell' : 'hold',
                strength: Math.random() * 100,
                confidence: Math.random() * 100
              },
              timestamp: new Date().toISOString()
            }

            // Detect arbitrage opportunities
            const arbitrageOpps = await mcpClient.detectArbitrageOpportunities({
              token_pairs: [`${token}/USDC`],
              min_profit_usd: 1,
              chains: ['ethereum', 'arbitrum', 'base']
            })

            if (arbitrageOpps.success && arbitrageOpps.data) {
              analysis.arbitrage_opportunities = arbitrageOpps.data.opportunities.map(opp => ({
                exchange_from: 'uniswap',
                exchange_to: 'sushiswap',
                profit_percentage: opp.profit_percentage,
                execution_time_estimate: opp.execution_time_estimate
              }))
            }

            this.marketAnalysis.set(token, analysis)
          }
        }
      }

      this.emit('marketAnalysisUpdated', Array.from(this.marketAnalysis.values()))
    } catch (error) {
      console.error('Error in market analysis:', error)
    }
  }

  private async executeTradingCycle() {
    try {
      if (!this.isActive) return

      // Execute trading logic for each active agent
      for (const [agentId, agent] of this.agents) {
        if (agent.status === 'active') {
          await this.executeAgentStrategy(agent)
        }
      }
    } catch (error) {
      console.error('Error in trading cycle:', error)
    }
  }

  private async executeAgentStrategy(agent: LiveTradingAgent) {
    try {
      const strategy = agent.strategy

      switch (strategy.strategy_type) {
        case 'arbitrage':
          await this.executeArbitrageStrategy(agent)
          break
        case 'grid':
          await this.executeGridStrategy(agent)
          break
        case 'momentum':
          await this.executeMomentumStrategy(agent)
          break
        default:
          console.warn(`Unknown strategy type: ${strategy.strategy_type}`)
      }
    } catch (error) {
      console.error(`Error executing strategy for agent ${agent.id}:`, error)
    }
  }

  private async executeArbitrageStrategy(agent: LiveTradingAgent) {
    try {
      // Look for arbitrage opportunities
      const opportunities = Array.from(this.marketAnalysis.values())
        .flatMap(analysis => analysis.arbitrage_opportunities)
        .filter(opp => opp.profit_percentage >= agent.strategy.parameters.min_profit_threshold)

      if (opportunities.length === 0) return

      // Select best opportunity
      const bestOpportunity = opportunities.reduce((best, current) => 
        current.profit_percentage > best.profit_percentage ? current : best
      )

      // Calculate position size
      const positionSize = Math.min(
        agent.current_balance * (agent.strategy.parameters.max_risk_percentage / 100),
        agent.strategy.parameters.max_position_size
      )

      // Execute arbitrage
      const execution: ArbitrageExecution = {
        id: `arb_${Date.now()}`,
        agent_id: agent.id,
        opportunity_id: `opp_${Date.now()}`,
        token_pair: 'USDC/WETH',
        buy_exchange: bestOpportunity.exchange_from,
        sell_exchange: bestOpportunity.exchange_to,
        buy_price: 2300, // Mock price
        sell_price: 2307, // Mock price
        amount: positionSize,
        expected_profit: positionSize * (bestOpportunity.profit_percentage / 100),
        actual_profit: 0,
        execution_time: 0,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      this.activeArbitrageExecutions.set(execution.id, execution)

      // Execute via MCP
      const result = await mcpClient.executeArbitrage({
        opportunity_id: execution.opportunity_id,
        execution_amount: positionSize,
        max_slippage: 0.5
      })

      if (result.success) {
        execution.status = 'completed'
        execution.actual_profit = execution.expected_profit * 0.95 // 95% of expected (slippage)
        execution.completed_at = new Date().toISOString()
        execution.execution_time = 2000 // 2 seconds

        // Update agent performance
        this.updateAgentPerformance(agent, execution)

        // Check if goals are met
        await this.checkGoalCompletion(agent)

        console.log(`✅ Arbitrage executed for ${agent.name}: $${execution.actual_profit.toFixed(2)} profit`)
      } else {
        execution.status = 'failed'
        execution.error_message = result.error || 'Unknown error'
        console.log(`❌ Arbitrage failed for ${agent.name}: ${execution.error_message}`)
      }

      this.emit('tradeExecuted', { agent, execution })
    } catch (error) {
      console.error('Error in arbitrage strategy:', error)
    }
  }

  private async executeGridStrategy(agent: LiveTradingAgent) {
    try {
      // Simplified grid strategy logic
      const marketData = this.marketAnalysis.get('WETH')
      if (!marketData) return

      const signal = marketData.trading_signals
      const positionSize = Math.min(
        agent.current_balance * 0.1, // 10% of balance per trade
        agent.strategy.parameters.max_position_size
      )

      if (signal.signal === 'buy' && signal.confidence > 70) {
        // Execute buy order
        const profit = positionSize * 0.005 // 0.5% profit simulation
        this.updateAgentPerformance(agent, {
          actual_profit: profit,
          status: 'completed'
        } as any)
        
        console.log(`📊 Grid buy executed for ${agent.name}: $${profit.toFixed(2)} profit`)
      } else if (signal.signal === 'sell' && signal.confidence > 70) {
        // Execute sell order
        const profit = positionSize * 0.003 // 0.3% profit simulation
        this.updateAgentPerformance(agent, {
          actual_profit: profit,
          status: 'completed'
        } as any)
        
        console.log(`📊 Grid sell executed for ${agent.name}: $${profit.toFixed(2)} profit`)
      }
    } catch (error) {
      console.error('Error in grid strategy:', error)
    }
  }

  private async executeMomentumStrategy(agent: LiveTradingAgent) {
    try {
      // Simplified momentum strategy logic
      const marketData = this.marketAnalysis.get('WETH')
      if (!marketData) return

      const signal = marketData.trading_signals
      const rsi = marketData.indicators.rsi

      if (signal.signal === 'buy' && rsi < 30 && signal.confidence > 80) {
        // Execute momentum buy
        const positionSize = Math.min(
          agent.current_balance * 0.05, // 5% of balance per trade
          agent.strategy.parameters.max_position_size
        )
        
        const profit = positionSize * 0.002 // 0.2% profit simulation
        this.updateAgentPerformance(agent, {
          actual_profit: profit,
          status: 'completed'
        } as any)
        
        console.log(`⚡ Momentum buy executed for ${agent.name}: $${profit.toFixed(2)} profit`)
      }
    } catch (error) {
      console.error('Error in momentum strategy:', error)
    }
  }

  private updateAgentPerformance(agent: LiveTradingAgent, execution: any) {
    agent.performance.total_trades++
    
    if (execution.actual_profit > 0) {
      agent.performance.profitable_trades++
      agent.performance.total_profit += execution.actual_profit
      agent.current_balance += execution.actual_profit
    } else {
      agent.current_balance += execution.actual_profit // Subtract loss
    }
    
    agent.performance.win_rate = (agent.performance.profitable_trades / agent.performance.total_trades) * 100
    agent.performance.current_roi = ((agent.current_balance - agent.allocated_amount) / agent.allocated_amount) * 100
    
    agent.last_trade_time = new Date().toISOString()
    agent.updated_at = new Date().toISOString()
    
    // Update goals progress
    agent.goals.current_progress = (agent.performance.total_profit / agent.goals.profit_target) * 100
    
    this.emit('agentPerformanceUpdated', agent)
  }

  private async checkGoalCompletion(agent: LiveTradingAgent) {
    try {
      const goalsMet = []
      
      // Check profit target
      if (agent.performance.total_profit >= agent.goals.profit_target) {
        goalsMet.push({
          type: 'profit',
          target: agent.goals.profit_target,
          achieved: agent.performance.total_profit
        })
      }
      
      // Check trade count target
      if (agent.performance.total_trades >= agent.goals.trade_count_target) {
        goalsMet.push({
          type: 'trades',
          target: agent.goals.trade_count_target,
          achieved: agent.performance.total_trades
        })
      }
      
      // Check win rate target
      if (agent.performance.win_rate >= agent.goals.win_rate_target) {
        goalsMet.push({
          type: 'winRate',
          target: agent.goals.win_rate_target,
          achieved: agent.performance.win_rate
        })
      }
      
      // If any goals are met, trigger profit collection
      if (goalsMet.length > 0) {
        for (const goal of goalsMet) {
          // Create goal in goals service
          const goalsService = GoalsService.getInstance()
          const goalId = await goalsService.createGoal({
            name: `${agent.name} ${goal.type} Goal`,
            description: `Achieve ${goal.target} ${goal.type}`,
            type: goal.type,
            target: goal.target,
            current: goal.achieved,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            agentId: agent.id
          })
          
          if (goalId) {
            await goalsService.updateGoalProgress(goalId, goal.achieved)
            await goalsService.completeGoal(goalId)
          }
        }
        
        console.log(`🎯 Goals completed for ${agent.name}:`, goalsMet)
        this.emit('goalCompleted', { agent, goalsMet })
      }
    } catch (error) {
      console.error('Error checking goal completion:', error)
    }
  }

  // Public API methods
  getAllAgents(): LiveTradingAgent[] {
    return Array.from(this.agents.values())
  }

  getAgent(agentId: string): LiveTradingAgent | undefined {
    return this.agents.get(agentId)
  }

  getAllStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values())
  }

  getMarketAnalysis(): MarketAnalysis[] {
    return Array.from(this.marketAnalysis.values())
  }

  getActiveArbitrageExecutions(): ArbitrageExecution[] {
    return Array.from(this.activeArbitrageExecutions.values())
  }

  async pauseAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    agent.status = 'paused'
    this.emit('agentStatusChanged', agent)
    return true
  }

  async resumeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    agent.status = 'active'
    this.emit('agentStatusChanged', agent)
    return true
  }

  isActive(): boolean {
    return this.isActive
  }

  getSystemStats() {
    const agents = Array.from(this.agents.values())
    const totalAllocated = agents.reduce((sum, agent) => sum + agent.allocated_amount, 0)
    const totalProfit = agents.reduce((sum, agent) => sum + agent.performance.total_profit, 0)
    const totalTrades = agents.reduce((sum, agent) => sum + agent.performance.total_trades, 0)
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalAllocated,
      totalProfit,
      totalTrades,
      systemROI: totalAllocated > 0 ? (totalProfit / totalAllocated) * 100 : 0,
      avgWinRate: agents.reduce((sum, agent) => sum + agent.performance.win_rate, 0) / agents.length
    }
  }
}

// Lazy initialization
let liveTradingAgentServiceInstance: LiveTradingAgentService | null = null

export function getLiveTradingAgentService(): LiveTradingAgentService {
  if (!liveTradingAgentServiceInstance) {
    liveTradingAgentServiceInstance = new LiveTradingAgentService()
  }
  return liveTradingAgentServiceInstance
}

// For backward compatibility
export const liveTradingAgentService = {
  get instance() {
    return getLiveTradingAgentService()
  }
}

export default liveTradingAgentService