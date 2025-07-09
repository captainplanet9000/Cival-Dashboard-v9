/**
 * Agent Strategy Integration Service
 * Bridges AI agents to trading strategy analysis and execution
 * Provides comprehensive strategy access through MCP infrastructure
 */

import { MarketPrice } from '@/types/market-data'
import { strategyService, StrategyType, STRATEGY_TYPES } from '@/lib/supabase/strategy-service'
import { agentMarketDataService } from '@/lib/agents/agent-market-data-service'

export interface AgentStrategyAccess {
  agentId: string
  assignedStrategies: StrategyType[]
  permissions: {
    canExecuteAnalysis: boolean
    canGetSignals: boolean
    canOptimizeParams: boolean
    canLogExecutions: boolean
  }
  performance: {
    [strategyType: string]: {
      totalExecutions: number
      winRate: number
      avgReturn: number
      lastExecution: Date
    }
  }
  preferences: {
    preferredStrategies: StrategyType[]
    riskTolerance: number
    timeframes: string[]
    assetClasses: string[]
  }
}

export interface StrategyExecution {
  id: string
  agentId: string
  strategyType: StrategyType
  symbol: string
  executionType: 'analysis' | 'signal' | 'entry' | 'exit'
  inputData: any
  results: any
  performance: {
    executionTime: number
    success: boolean
    confidence: number
    outcome?: any
  }
  timestamp: Date
}

export interface StrategySignal {
  id: string
  agentId: string
  strategyType: StrategyType
  symbol: string
  signalType: 'buy' | 'sell' | 'hold'
  strength: number
  confidence: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  conditionsMet: string[]
  marketConditions: any
  recommendation: string
  timestamp: Date
}

export interface MarketConditions {
  trend: 'bullish' | 'bearish' | 'neutral'
  volatility: number
  volume: 'high' | 'medium' | 'low'
  momentum: 'strong' | 'moderate' | 'weak'
  support: number
  resistance: number
  rsi: number
  macd: number
}

class AgentStrategyIntegration {
  private static instance: AgentStrategyIntegration
  private agentAccess: Map<string, AgentStrategyAccess> = new Map()
  private executionHistory: Map<string, StrategyExecution[]> = new Map()
  private activeSignals: Map<string, StrategySignal[]> = new Map()
  private mcpClient: any = null

  private constructor() {
    this.initializeMCPClient()
  }

  static getInstance(): AgentStrategyIntegration {
    if (!AgentStrategyIntegration.instance) {
      AgentStrategyIntegration.instance = new AgentStrategyIntegration()
    }
    return AgentStrategyIntegration.instance
  }

  private async initializeMCPClient() {
    try {
      // Initialize MCP client for strategy execution server
      // This would connect to the strategy_execution_mcp server on port 8006
      console.log('🔗 Initializing MCP Strategy Client connection...')
      
      // In a real implementation, this would establish the MCP connection
      // For now, we'll simulate the connection
      this.mcpClient = {
        connected: true,
        serverUrl: 'http://localhost:8006',
        availableTools: [
          'get_strategy_knowledge',
          'execute_strategy_analysis',
          'get_entry_signals',
          'get_exit_signals',
          'validate_risk_conditions',
          'get_strategy_performance',
          'optimize_strategy_params',
          'log_strategy_execution'
        ]
      }
      
      console.log('✅ MCP Strategy Client initialized with 8 tools')
    } catch (error) {
      console.error('❌ Failed to initialize MCP Strategy Client:', error)
      this.mcpClient = null
    }
  }

  /**
   * Register an agent for strategy access
   */
  async registerAgentForStrategies(
    agentId: string,
    strategies: StrategyType[] = Object.values(STRATEGY_TYPES),
    permissions: Partial<AgentStrategyAccess['permissions']> = {}
  ): Promise<{ success: boolean; access?: AgentStrategyAccess; error?: string }> {
    try {
      const access: AgentStrategyAccess = {
        agentId,
        assignedStrategies: strategies,
        permissions: {
          canExecuteAnalysis: true,
          canGetSignals: true,
          canOptimizeParams: true,
          canLogExecutions: true,
          ...permissions
        },
        performance: {},
        preferences: {
          preferredStrategies: strategies.slice(0, 3), // Default to first 3 strategies
          riskTolerance: 0.02, // 2% default risk tolerance
          timeframes: ['1h', '4h', '1d'],
          assetClasses: ['crypto', 'stocks', 'forex']
        }
      }

      // Initialize performance tracking for each strategy
      for (const strategy of strategies) {
        access.performance[strategy] = {
          totalExecutions: 0,
          winRate: 0,
          avgReturn: 0,
          lastExecution: new Date()
        }
      }

      this.agentAccess.set(agentId, access)
      this.executionHistory.set(agentId, [])
      this.activeSignals.set(agentId, [])

      console.log(`🤖 Agent ${agentId} registered for ${strategies.length} strategies`)

      return { success: true, access }
    } catch (error) {
      console.error(`❌ Failed to register agent ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get strategy knowledge for an agent
   */
  async getStrategyKnowledge(
    agentId: string,
    strategyType: StrategyType
  ): Promise<{ success: boolean; knowledge?: any; error?: string }> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        return { success: false, error: 'Agent not registered for strategy access' }
      }

      if (!access.assignedStrategies.includes(strategyType)) {
        return { success: false, error: `Agent not assigned to strategy ${strategyType}` }
      }

      // Get strategy knowledge from local service first
      const strategy = await strategyService.getOrCreateStrategy(strategyType)
      if (!strategy) {
        return { success: false, error: 'Strategy not found' }
      }

      // If MCP client is available, get enhanced knowledge
      let enhancedKnowledge = null
      if (this.mcpClient?.connected) {
        try {
          enhancedKnowledge = await this.callMCPTool('get_strategy_knowledge', {
            strategy_type: strategyType
          })
        } catch (mcpError) {
          console.warn('MCP call failed, using local knowledge:', mcpError)
        }
      }

      const knowledge = {
        basic: strategy,
        enhanced: enhancedKnowledge,
        agentPermissions: access.permissions,
        agentPerformance: access.performance[strategyType]
      }

      return { success: true, knowledge }
    } catch (error) {
      console.error(`❌ Failed to get strategy knowledge for ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Execute strategy analysis for an agent
   */
  async executeStrategyAnalysis(
    agentId: string,
    strategyType: StrategyType,
    symbol: string,
    marketData: MarketPrice
  ): Promise<{ success: boolean; analysis?: any; execution?: StrategyExecution; error?: string }> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access || !access.permissions.canExecuteAnalysis) {
        return { success: false, error: 'Agent not authorized for strategy analysis' }
      }

      const startTime = Date.now()
      const executionId = `${agentId}_${strategyType}_${symbol}_${Date.now()}`

      // Prepare market data for analysis
      const marketDataForAnalysis = {
        symbol,
        price: marketData.price,
        volume: marketData.volume24h,
        change24h: marketData.change24h,
        volatility: Math.abs(marketData.changePercent24h) / 100,
        timestamp: marketData.lastUpdate.toISOString()
      }

      let analysis = null
      let mcpSuccess = false

      // Try MCP analysis first
      if (this.mcpClient?.connected) {
        try {
          analysis = await this.callMCPTool('execute_strategy_analysis', {
            strategy_type: strategyType,
            symbol,
            market_data: JSON.stringify(marketDataForAnalysis)
          })
          mcpSuccess = true
        } catch (mcpError) {
          console.warn('MCP analysis failed, using local analysis:', mcpError)
        }
      }

      // Fallback to local analysis if MCP failed
      if (!analysis || !mcpSuccess) {
        analysis = await this.executeLocalAnalysis(strategyType, symbol, marketDataForAnalysis)
      }

      const executionTime = Date.now() - startTime
      const execution: StrategyExecution = {
        id: executionId,
        agentId,
        strategyType,
        symbol,
        executionType: 'analysis',
        inputData: marketDataForAnalysis,
        results: analysis,
        performance: {
          executionTime,
          success: analysis?.success || false,
          confidence: analysis?.analysis?.confidence || 0,
        },
        timestamp: new Date()
      }

      // Store execution history
      const history = this.executionHistory.get(agentId) || []
      history.push(execution)
      this.executionHistory.set(agentId, history.slice(-100)) // Keep last 100 executions

      // Update performance metrics
      access.performance[strategyType].totalExecutions++
      access.performance[strategyType].lastExecution = new Date()

      // Log execution to MCP if available
      if (this.mcpClient?.connected && access.permissions.canLogExecutions) {
        try {
          await this.callMCPTool('log_strategy_execution', {
            strategy_type: strategyType,
            symbol,
            execution_data: JSON.stringify({
              type: 'analysis',
              signal_data: analysis,
              market_conditions: marketDataForAnalysis,
              outcome: { success: analysis?.success || false }
            })
          })
        } catch (logError) {
          console.warn('Failed to log execution to MCP:', logError)
        }
      }

      return { success: true, analysis, execution }
    } catch (error) {
      console.error(`❌ Failed to execute strategy analysis for ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Generate strategy signals for an agent
   */
  async generateStrategySignals(
    agentId: string,
    strategyType: StrategyType,
    symbol: string,
    marketData: MarketPrice
  ): Promise<{ success: boolean; signals?: StrategySignal[]; error?: string }> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access || !access.permissions.canGetSignals) {
        return { success: false, error: 'Agent not authorized for signal generation' }
      }

      const marketDataForSignals = {
        symbol,
        price: marketData.price,
        volume: marketData.volume24h,
        change24h: marketData.change24h,
        volatility: Math.abs(marketData.changePercent24h) / 100,
        timestamp: marketData.lastUpdate.toISOString()
      }

      let signalData = null

      // Try MCP signal generation
      if (this.mcpClient?.connected) {
        try {
          signalData = await this.callMCPTool('get_entry_signals', {
            strategy_type: strategyType,
            symbol,
            market_data: JSON.stringify(marketDataForSignals)
          })
        } catch (mcpError) {
          console.warn('MCP signal generation failed:', mcpError)
        }
      }

      // Fallback to local signal generation
      if (!signalData) {
        signalData = await this.generateLocalSignals(strategyType, symbol, marketDataForSignals)
      }

      const signal: StrategySignal = {
        id: `${agentId}_${strategyType}_${symbol}_${Date.now()}`,
        agentId,
        strategyType,
        symbol,
        signalType: signalData?.entry_signals?.signal_type || 'hold',
        strength: signalData?.entry_signals?.strength || 50,
        confidence: signalData?.entry_signals?.confidence || 50,
        entryPrice: signalData?.entry_signals?.entry_price || marketData.price,
        stopLoss: signalData?.entry_signals?.stop_loss || marketData.price * 0.95,
        takeProfit: signalData?.entry_signals?.take_profit || marketData.price * 1.05,
        conditionsMet: signalData?.entry_signals?.conditions_met || [],
        marketConditions: this.assessMarketConditions(marketData),
        recommendation: signalData?.entry_signals?.recommendation || 'Hold position',
        timestamp: new Date()
      }

      // Store active signal
      const activeSignals = this.activeSignals.get(agentId) || []
      activeSignals.push(signal)
      this.activeSignals.set(agentId, activeSignals.slice(-50)) // Keep last 50 signals

      return { success: true, signals: [signal] }
    } catch (error) {
      console.error(`❌ Failed to generate strategy signals for ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Optimize strategy selection for an agent based on market conditions
   */
  async optimizeStrategySelection(
    agentId: string,
    marketConditions: MarketConditions
  ): Promise<{ success: boolean; recommendations?: any; error?: string }> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        return { success: false, error: 'Agent not registered for strategy access' }
      }

      const strategyRecommendations = []

      for (const strategyType of access.assignedStrategies) {
        const strategy = await strategyService.getOrCreateStrategy(strategyType)
        if (!strategy) continue

        // Get strategy performance
        const performance = access.performance[strategyType]
        let strategyPerformance = null

        // Try to get enhanced performance from MCP
        if (this.mcpClient?.connected) {
          try {
            strategyPerformance = await this.callMCPTool('get_strategy_performance', {
              strategy_type: strategyType,
              timeframe: '30d'
            })
          } catch (mcpError) {
            console.warn('MCP performance retrieval failed:', mcpError)
          }
        }

        // Calculate strategy suitability score
        const suitabilityScore = this.calculateStrategySuitability(
          strategyType,
          marketConditions,
          performance,
          strategyPerformance
        )

        strategyRecommendations.push({
          strategyType,
          suitabilityScore,
          reasoning: this.getStrategyReasoning(strategyType, marketConditions, suitabilityScore),
          performance: strategyPerformance || performance,
          recommended: suitabilityScore > 70
        })
      }

      // Sort by suitability score
      strategyRecommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore)

      return {
        success: true,
        recommendations: {
          agentId,
          marketConditions,
          strategyRecommendations,
          topStrategy: strategyRecommendations[0],
          recommendedStrategies: strategyRecommendations.filter(r => r.recommended)
        }
      }
    } catch (error) {
      console.error(`❌ Failed to optimize strategy selection for ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get agent's strategy performance
   */
  async getAgentStrategyPerformance(agentId: string): Promise<{ success: boolean; performance?: any; error?: string }> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        return { success: false, error: 'Agent not registered for strategy access' }
      }

      const executionHistory = this.executionHistory.get(agentId) || []
      const activeSignals = this.activeSignals.get(agentId) || []

      const performanceData = {
        agentId,
        totalExecutions: executionHistory.length,
        totalSignals: activeSignals.length,
        strategyPerformance: access.performance,
        recentExecutions: executionHistory.slice(-10),
        activeSignals: activeSignals.slice(-5),
        averageExecutionTime: executionHistory.length > 0 
          ? executionHistory.reduce((sum, exec) => sum + exec.performance.executionTime, 0) / executionHistory.length
          : 0,
        successRate: executionHistory.length > 0
          ? executionHistory.filter(exec => exec.performance.success).length / executionHistory.length
          : 0,
        lastActivity: access.performance[access.assignedStrategies[0]]?.lastExecution || new Date()
      }

      return { success: true, performance: performanceData }
    } catch (error) {
      console.error(`❌ Failed to get agent strategy performance for ${agentId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Private helper methods
   */

  private async callMCPTool(toolName: string, params: any): Promise<any> {
    // Simulate MCP tool call
    // In real implementation, this would make actual MCP calls
    console.log(`📡 MCP Tool Call: ${toolName}`, params)
    
    // Return mock data for now
    return {
      success: true,
      data: params,
      timestamp: new Date().toISOString()
    }
  }

  private async executeLocalAnalysis(strategyType: StrategyType, symbol: string, marketData: any): Promise<any> {
    // Local strategy analysis fallback
    const basePrice = marketData.price
    const volatility = marketData.volatility || 0.15
    
    const signalStrength = Math.random() * 100
    const signalType = signalStrength > 60 ? 'buy' : signalStrength < 40 ? 'sell' : 'hold'
    
    return {
      success: true,
      strategy_type: strategyType,
      symbol,
      analysis: {
        signal_type: signalType,
        signal_strength: signalStrength,
        confidence: Math.min(95, Math.max(5, signalStrength + (Math.random() - 0.5) * 20)),
        current_price: basePrice,
        stop_loss: basePrice * (1 - volatility * 2),
        take_profit: basePrice * (1 + volatility * 4),
        conditions_met: [`${strategyType}_condition_1`, `${strategyType}_condition_2`],
        recommendation: `${signalType.toUpperCase()} signal generated by ${strategyType} strategy`
      }
    }
  }

  private async generateLocalSignals(strategyType: StrategyType, symbol: string, marketData: any): Promise<any> {
    // Local signal generation fallback
    const analysis = await this.executeLocalAnalysis(strategyType, symbol, marketData)
    
    return {
      success: true,
      entry_signals: {
        signal_type: analysis.analysis.signal_type,
        strength: analysis.analysis.signal_strength,
        confidence: analysis.analysis.confidence,
        entry_price: analysis.analysis.current_price,
        stop_loss: analysis.analysis.stop_loss,
        take_profit: analysis.analysis.take_profit,
        conditions_met: analysis.analysis.conditions_met,
        recommendation: analysis.analysis.recommendation
      }
    }
  }

  private assessMarketConditions(marketData: MarketPrice): MarketConditions {
    const changePercent = marketData.changePercent24h
    const volatility = Math.abs(changePercent) / 100
    
    return {
      trend: changePercent > 2 ? 'bullish' : changePercent < -2 ? 'bearish' : 'neutral',
      volatility,
      volume: marketData.volume24h > 1000000 ? 'high' : marketData.volume24h > 100000 ? 'medium' : 'low',
      momentum: Math.abs(changePercent) > 5 ? 'strong' : Math.abs(changePercent) > 2 ? 'moderate' : 'weak',
      support: marketData.price * 0.95,
      resistance: marketData.price * 1.05,
      rsi: 50 + (changePercent * 2), // Simplified RSI calculation
      macd: changePercent > 0 ? 1 : -1 // Simplified MACD
    }
  }

  private calculateStrategySuitability(
    strategyType: StrategyType,
    marketConditions: MarketConditions,
    performance: any,
    strategyPerformance: any
  ): number {
    let score = 50 // Base score
    
    // Adjust based on market conditions
    if (marketConditions.trend === 'bullish' && ['darvas_box', 'heikin_ashi'].includes(strategyType)) {
      score += 20
    }
    
    if (marketConditions.volatility > 0.2 && strategyType === 'renko_breakout') {
      score += 15
    }
    
    if (marketConditions.trend === 'neutral' && strategyType === 'williams_alligator') {
      score -= 10
    }
    
    // Adjust based on performance
    if (performance.winRate > 0.6) {
      score += 15
    }
    
    if (performance.totalExecutions > 10) {
      score += 10
    }
    
    return Math.min(100, Math.max(0, score))
  }

  private getStrategyReasoning(strategyType: StrategyType, marketConditions: MarketConditions, score: number): string {
    if (score > 80) {
      return `${strategyType} is highly suitable for current ${marketConditions.trend} market with ${marketConditions.volatility.toFixed(2)} volatility`
    } else if (score > 60) {
      return `${strategyType} shows good potential in current market conditions`
    } else if (score > 40) {
      return `${strategyType} may work but consider other strategies`
    } else {
      return `${strategyType} not recommended for current market conditions`
    }
  }
}

// Export singleton instance
export const agentStrategyIntegration = AgentStrategyIntegration.getInstance()
export default agentStrategyIntegration

// Export types
export type { AgentStrategyAccess, StrategyExecution, StrategySignal, MarketConditions }