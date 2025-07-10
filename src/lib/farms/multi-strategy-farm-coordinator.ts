'use client'

/**
 * Multi-Strategy Farm Coordinator
 * Coordinates multiple agents with different strategies for optimal performance
 */

import { EventEmitter } from 'events'
import { enhancedAgentCreationService, type CreatedAgent, type EnhancedAgentConfig } from '@/lib/agents/enhanced-agent-creation-service'
import { agentMemorySystem, type AgentMemory, type LearningInsight } from '@/lib/agents/agent-memory-system'
import { autonomousTradingLoop, type AgentPerformanceMetrics } from '@/lib/agents/autonomous-trading-loop'
import { agentWalletManager } from '@/lib/agents/agent-wallet-manager'
import { vaultIntegrationService } from '@/lib/vault/VaultIntegrationService'
import { backendClient } from '@/lib/api/backend-client'
import { globalThrottler } from '@/lib/utils/request-throttle'

export interface FarmConfiguration {
  id: string
  name: string
  description: string
  totalCapital: number
  maxAgents: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  
  // Strategy Distribution
  strategyAllocation: {
    darvas_box: { percentage: number; maxAgents: number; targetProfit: number }
    williams_alligator: { percentage: number; maxAgents: number; targetProfit: number }
    renko_breakout: { percentage: number; maxAgents: number; targetProfit: number }
    heikin_ashi: { percentage: number; maxAgents: number; targetProfit: number }
    elliott_wave: { percentage: number; maxAgents: number; targetProfit: number }
  }
  
  // Coordination Settings
  coordination: {
    enableCrossStrategy: boolean
    shareMarketData: boolean
    coordinateEntries: boolean
    riskPooling: boolean
    profitRebalancing: boolean
    learningSharing: boolean
  }
  
  // Performance Targets
  targets: {
    dailyProfitTarget: number
    maxDailyDrawdown: number
    minWinRate: number
    maxCorrelation: number
    rebalanceThreshold: number
  }
  
  // Vault Integration
  vault: {
    enabled: boolean
    vaultId?: string
    backupFrequency: 'hourly' | 'daily' | 'weekly'
    emergencyProtection: boolean
  }
}

export interface FarmAgent {
  agent: CreatedAgent
  allocation: number
  performance: AgentPerformanceMetrics
  memory: AgentMemory
  status: 'active' | 'paused' | 'stopped' | 'error'
  lastActivity: Date
  coordinationScore: number
}

export interface FarmPerformance {
  farmId: string
  timestamp: Date
  
  // Overall Performance
  totalPnL: number
  dailyPnL: number
  weeklyPnL: number
  monthlyPnL: number
  totalROI: number
  sharpeRatio: number
  maxDrawdown: number
  
  // Strategy Performance
  strategyBreakdown: Map<string, {
    pnl: number
    winRate: number
    agentCount: number
    avgPerformance: number
    correlation: number
  }>
  
  // Risk Metrics
  riskMetrics: {
    portfolioVaR: number
    conditionalVaR: number
    correlation: number[][]
    diversificationRatio: number
    concentrationRisk: number
  }
  
  // Coordination Metrics
  coordinationMetrics: {
    crossStrategySignals: number
    coordinatedTrades: number
    conflictResolutions: number
    learningSharing: number
    overallSynergy: number
  }
}

export interface StrategyCoordination {
  primaryStrategy: string
  supportingStrategies: string[]
  coordinationType: 'confirmation' | 'diversification' | 'hedge' | 'amplification'
  confidence: number
  expectedBenefit: number
  riskAdjustment: number
}

export interface FarmOptimization {
  farmId: string
  timestamp: Date
  optimizationType: 'rebalance' | 'strategy_adjustment' | 'risk_management' | 'performance_enhancement'
  changes: OptimizationChange[]
  expectedImpact: number
  actualImpact?: number
  success: boolean
  reason: string
}

export interface OptimizationChange {
  type: 'allocation' | 'strategy' | 'parameter' | 'coordination'
  target: string
  oldValue: any
  newValue: any
  reason: string
  expectedImpact: number
}

export interface CrossStrategySignal {
  id: string
  timestamp: Date
  primaryAgent: string
  supportingAgents: string[]
  signalType: 'entry' | 'exit' | 'hold' | 'avoid'
  confidence: number
  coordination: StrategyCoordination
  marketConditions: string[]
  expectedOutcome: string
}

class MultiStrategyFarmCoordinator extends EventEmitter {
  private farms: Map<string, FarmConfiguration> = new Map()
  private farmAgents: Map<string, FarmAgent[]> = new Map()
  private farmPerformance: Map<string, FarmPerformance> = new Map()
  private optimizationHistory: Map<string, FarmOptimization[]> = new Map()
  private crossStrategySignals: Map<string, CrossStrategySignal[]> = new Map()
  
  private coordinationLoops: Map<string, NodeJS.Timeout> = new Map()
  private performanceTracking: Map<string, NodeJS.Timeout> = new Map()
  
  constructor() {
    super()
    this.initializeCoordinator()
  }
  
  /**
   * Initialize the farm coordinator system
   */
  private initializeCoordinator() {
    // Monitor farm performance every 5 minutes
    setInterval(() => {
      this.updateAllFarmPerformance()
    }, 300000)
    
    // Run optimization every 30 minutes
    setInterval(() => {
      this.optimizeAllFarms()
    }, 1800000)
    
    // Clean old data every hour
    setInterval(() => {
      this.cleanOldData()
    }, 3600000)
  }
  
  /**
   * Create a new multi-strategy farm
   */
  async createFarm(config: FarmConfiguration): Promise<boolean> {
    try {
      // Validate configuration
      if (!this.validateFarmConfiguration(config)) {
        throw new Error('Invalid farm configuration')
      }
      
      // Create vault if enabled
      if (config.vault.enabled && !config.vault.vaultId) {
        const vault = await vaultIntegrationService.createVault({
          name: `${config.name}_vault`,
          type: 'multi_agent_farm',
          encryptionLevel: 'high',
          accessLevel: 'admin',
          metadata: {
            farmId: config.id,
            farmName: config.name
          }
        })
        
        if (vault) {
          config.vault.vaultId = vault.id
        }
      }
      
      // Store farm configuration
      this.farms.set(config.id, config)
      this.farmAgents.set(config.id, [])
      this.optimizationHistory.set(config.id, [])
      this.crossStrategySignals.set(config.id, [])
      
      // Initialize farm performance tracking
      this.initializeFarmPerformance(config.id)
      
      // Start coordination loop
      this.startCoordinationLoop(config.id)
      
      console.log(`Multi-strategy farm ${config.name} created with ID ${config.id}`)
      return true
      
    } catch (error) {
      console.error(`Failed to create farm ${config.name}:`, error)
      return false
    }
  }
  
  /**
   * Deploy agents to a farm based on strategy allocation
   */
  async deployAgentsToFarm(farmId: string): Promise<boolean> {
    const config = this.farms.get(farmId)
    if (!config) return false
    
    try {
      const agentsToCreate: { strategy: string; count: number; allocation: number }[] = []
      
      // Calculate agent distribution based on strategy allocation
      for (const [strategy, allocation] of Object.entries(config.strategyAllocation)) {
        const agentCount = Math.min(
          Math.floor((allocation.percentage / 100) * config.maxAgents),
          allocation.maxAgents
        )
        const agentAllocation = (config.totalCapital * allocation.percentage / 100) / agentCount
        
        agentsToCreate.push({
          strategy,
          count: agentCount,
          allocation: agentAllocation
        })
      }
      
      // Create agents for each strategy
      const farmAgents: FarmAgent[] = []
      
      for (const agentSpec of agentsToCreate) {
        for (let i = 0; i < agentSpec.count; i++) {
          const agentConfig = this.createAgentConfig(
            farmId,
            agentSpec.strategy,
            agentSpec.allocation,
            config,
            i
          )
          
          const agent = await enhancedAgentCreationService.createAgent(agentConfig)
          if (agent) {
            // Initialize agent memory
            const memory = agentMemorySystem.initializeAgentMemory(agent)
            
            // Start autonomous trading
            await autonomousTradingLoop.startTradingLoop(agent)
            
            const farmAgent: FarmAgent = {
              agent,
              allocation: agentSpec.allocation,
              performance: {
                agentId: agent.id,
                totalCycles: 0,
                successfulExecutions: 0,
                averageLatency: 0,
                totalPnL: 0,
                winRate: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                tradesPerHour: 0,
                signalAccuracy: 0,
                strategyEfficiency: 0,
                lastUpdate: new Date()
              },
              memory,
              status: 'active',
              lastActivity: new Date(),
              coordinationScore: 0.5
            }
            
            farmAgents.push(farmAgent)
          }
        }
      }
      
      // Store farm agents
      this.farmAgents.set(farmId, farmAgents)
      
      console.log(`Deployed ${farmAgents.length} agents to farm ${farmId}`)
      this.emit('farmDeployed', { farmId, agentCount: farmAgents.length })
      
      return true
      
    } catch (error) {
      console.error(`Failed to deploy agents to farm ${farmId}:`, error)
      return false
    }
  }
  
  /**
   * Coordinate cross-strategy signals and decisions
   */
  async coordinateStrategies(farmId: string): Promise<CrossStrategySignal[]> {
    const config = this.farms.get(farmId)
    const agents = this.farmAgents.get(farmId)
    
    if (!config || !agents || !config.coordination.enableCrossStrategy) return []
    
    const signals: CrossStrategySignal[] = []
    
    try {
      // Get recent signals from all agents
      const agentSignals = new Map<string, any[]>()
      
      for (const farmAgent of agents) {
        if (farmAgent.status === 'active') {
          const recentDecisions = agentMemorySystem.getAgentMemory(farmAgent.agent.id)
            ?.decisions.history.slice(-5) || []
          
          agentSignals.set(farmAgent.agent.id, recentDecisions)
        }
      }
      
      // Analyze for cross-strategy opportunities
      const strategies = Array.from(new Set(agents.map(a => a.agent.config.strategy.type)))
      
      for (const primaryStrategy of strategies) {
        const primaryAgents = agents.filter(a => a.agent.config.strategy.type === primaryStrategy)
        const supportingStrategies = strategies.filter(s => s !== primaryStrategy)
        
        for (const primaryAgent of primaryAgents) {
          if (primaryAgent.status !== 'active') continue
          
          const coordination = await this.analyzeStrategyCoordination(
            primaryAgent,
            agents.filter(a => supportingStrategies.includes(a.agent.config.strategy.type)),
            agentSignals
          )
          
          if (coordination && coordination.confidence > 0.7) {
            const signal: CrossStrategySignal = {
              id: `cross_signal_${farmId}_${Date.now()}`,
              timestamp: new Date(),
              primaryAgent: primaryAgent.agent.id,
              supportingAgents: agents
                .filter(a => supportingStrategies.includes(a.agent.config.strategy.type))
                .map(a => a.agent.id),
              signalType: this.determineSignalType(coordination),
              confidence: coordination.confidence,
              coordination,
              marketConditions: this.assessMarketConditions(),
              expectedOutcome: `${coordination.coordinationType} coordination with ${coordination.expectedBenefit.toFixed(2)}% expected benefit`
            }
            
            signals.push(signal)
            
            // Execute coordination if enabled
            if (config.coordination.coordinateEntries) {
              await this.executeCoordinatedAction(farmId, signal)
            }
          }
        }
      }
      
      // Store signals
      const existingSignals = this.crossStrategySignals.get(farmId) || []
      this.crossStrategySignals.set(farmId, [...existingSignals, ...signals].slice(-100))
      
      this.emit('crossStrategySignals', { farmId, signals })
      return signals
      
    } catch (error) {
      console.error(`Failed to coordinate strategies for farm ${farmId}:`, error)
      return []
    }
  }
  
  /**
   * Optimize farm performance through rebalancing and adjustments
   */
  async optimizeFarm(farmId: string): Promise<FarmOptimization | null> {
    const config = this.farms.get(farmId)
    const agents = this.farmAgents.get(farmId)
    const performance = this.farmPerformance.get(farmId)
    
    if (!config || !agents || !performance) return null
    
    try {
      const optimization: FarmOptimization = {
        farmId,
        timestamp: new Date(),
        optimizationType: this.determineOptimizationType(performance, config),
        changes: [],
        expectedImpact: 0,
        success: false,
        reason: 'Performance optimization based on current metrics'
      }
      
      // Analyze current performance
      const needsRebalancing = this.needsRebalancing(performance, config)
      const underperformingStrategies = this.identifyUnderperformingStrategies(performance, config)
      const riskExposure = this.assessRiskExposure(performance, config)
      
      // Generate optimization changes
      if (needsRebalancing) {
        const rebalanceChanges = await this.generateRebalanceChanges(farmId, performance, config)
        optimization.changes.push(...rebalanceChanges)
      }
      
      if (underperformingStrategies.length > 0) {
        const strategyChanges = await this.generateStrategyAdjustments(farmId, underperformingStrategies)
        optimization.changes.push(...strategyChanges)
      }
      
      if (riskExposure > config.targets.maxDailyDrawdown) {
        const riskChanges = await this.generateRiskAdjustments(farmId, riskExposure, config)
        optimization.changes.push(...riskChanges)
      }
      
      // Calculate expected impact
      optimization.expectedImpact = optimization.changes.reduce((sum, change) => sum + change.expectedImpact, 0)
      
      // Execute optimizations if beneficial
      if (optimization.expectedImpact > 0.05) { // 5% expected improvement
        optimization.success = await this.executeOptimization(farmId, optimization)
      }
      
      // Store optimization
      const history = this.optimizationHistory.get(farmId) || []
      history.push(optimization)
      this.optimizationHistory.set(farmId, history.slice(-50)) // Keep last 50
      
      this.emit('farmOptimized', optimization)
      return optimization
      
    } catch (error) {
      console.error(`Failed to optimize farm ${farmId}:`, error)
      return null
    }
  }
  
  /**
   * Share learning insights across agents in the farm
   */
  async shareLearningInsights(farmId: string): Promise<boolean> {
    const config = this.farms.get(farmId)
    const agents = this.farmAgents.get(farmId)
    
    if (!config || !agents || !config.coordination.learningSharing) return false
    
    try {
      // Collect insights from all agents
      const allInsights: Map<string, LearningInsight[]> = new Map()
      
      for (const farmAgent of agents) {
        const memory = agentMemorySystem.getAgentMemory(farmAgent.agent.id)
        if (memory) {
          const insights = agentMemorySystem.generateInsights(farmAgent.agent.id)
          if (insights.length > 0) {
            allInsights.set(farmAgent.agent.id, insights)
          }
        }
      }
      
      // Identify valuable cross-strategy insights
      const sharedInsights = this.identifySharedInsights(allInsights)
      
      // Distribute insights to relevant agents
      for (const farmAgent of agents) {
        const relevantInsights = sharedInsights.filter(insight => 
          this.isInsightRelevant(insight, farmAgent.agent.config.strategy.type)
        )
        
        if (relevantInsights.length > 0) {
          await this.applySharedInsights(farmAgent.agent.id, relevantInsights)
        }
      }
      
      console.log(`Shared ${sharedInsights.length} insights across ${agents.length} agents in farm ${farmId}`)
      this.emit('learningShared', { farmId, insightCount: sharedInsights.length })
      
      return true
      
    } catch (error) {
      console.error(`Failed to share learning insights for farm ${farmId}:`, error)
      return false
    }
  }
  
  /**
   * Get comprehensive farm status
   */
  getFarmStatus(farmId: string): {
    config: FarmConfiguration
    agents: FarmAgent[]
    performance: FarmPerformance
    recentOptimizations: FarmOptimization[]
    crossStrategySignals: CrossStrategySignal[]
  } | null {
    const config = this.farms.get(farmId)
    const agents = this.farmAgents.get(farmId)
    const performance = this.farmPerformance.get(farmId)
    const optimizations = this.optimizationHistory.get(farmId)
    const signals = this.crossStrategySignals.get(farmId)
    
    if (!config || !agents || !performance) return null
    
    return {
      config,
      agents,
      performance,
      recentOptimizations: (optimizations || []).slice(-10),
      crossStrategySignals: (signals || []).slice(-20)
    }
  }
  
  /**
   * Private helper methods
   */
  
  private validateFarmConfiguration(config: FarmConfiguration): boolean {
    // Validate strategy allocation percentages sum to 100%
    const totalPercentage = Object.values(config.strategyAllocation)
      .reduce((sum, allocation) => sum + allocation.percentage, 0)
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      console.error('Strategy allocation percentages must sum to 100%')
      return false
    }
    
    // Validate other constraints
    if (config.totalCapital <= 0 || config.maxAgents <= 0) {
      console.error('Total capital and max agents must be positive')
      return false
    }
    
    return true
  }
  
  private createAgentConfig(
    farmId: string,
    strategy: string,
    allocation: number,
    farmConfig: FarmConfiguration,
    agentIndex: number
  ): EnhancedAgentConfig {
    const strategyConfig = farmConfig.strategyAllocation[strategy as keyof typeof farmConfig.strategyAllocation]
    
    return {
      name: `${farmConfig.name}_${strategy}_${agentIndex}`,
      description: `${strategy} agent for farm ${farmConfig.name}`,
      initialCapital: allocation,
      
      strategy: {
        type: strategy as any,
        frequency: this.getStrategyFrequency(strategy),
        targetProfitPerTrade: strategyConfig.targetProfit,
        parameters: this.getStrategyParameters(strategy)
      },
      
      riskLimits: {
        maxDrawdown: farmConfig.targets.maxDailyDrawdown / farmConfig.maxAgents,
        maxPositionSize: allocation * 0.1,
        maxDailyLoss: allocation * 0.05,
        maxOpenPositions: 3,
        stopLossPercentage: 0.02,
        takeProfitPercentage: 0.04
      },
      
      walletConfig: {
        createDedicatedWallet: true,
        walletType: 'hot',
        initialFunding: allocation,
        autoFunding: true,
        fundingThreshold: allocation * 0.2,
        maxWalletBalance: allocation * 2,
        vaultIntegration: farmConfig.vault.enabled,
        backupToVault: farmConfig.vault.enabled,
        vaultBackupFrequency: farmConfig.vault.backupFrequency
      },
      
      vaultConfig: {
        enabled: farmConfig.vault.enabled,
        vaultId: farmConfig.vault.vaultId,
        encryptionLevel: 'high',
        accessLevel: 'write',
        sharedVault: true,
        backupStrategy: 'incremental',
        retentionPeriod: 30
      },
      
      llmConfig: {
        provider: 'gemini',
        model: 'gemini-pro',
        decisionFrequency: this.getDecisionFrequency(strategy),
        contextWindow: 4000,
        temperature: 0.7,
        enableLearning: true
      },
      
      mcpTools: {
        enabled: this.getMCPTools(strategy),
        permissions: ['read', 'write', 'execute'],
        customTools: []
      },
      
      memory: {
        historyRetention: 30,
        learningEnabled: true,
        adaptiveParameters: true,
        performanceTracking: true
      },
      
      autonomous: {
        autoStart: true,
        continuousTrading: true,
        adaptiveStrategy: true,
        riskAdjustment: true
      }
    }
  }
  
  private getStrategyFrequency(strategy: string): 'high' | 'medium' | 'low' {
    const frequencies = {
      'renko_breakout': 'high',
      'williams_alligator': 'high',
      'darvas_box': 'medium',
      'heikin_ashi': 'medium',
      'elliott_wave': 'low'
    }
    return frequencies[strategy as keyof typeof frequencies] || 'medium'
  }
  
  private getDecisionFrequency(strategy: string): number {
    const frequencies = {
      'renko_breakout': 5000,
      'williams_alligator': 8000,
      'darvas_box': 15000,
      'heikin_ashi': 12000,
      'elliott_wave': 20000
    }
    return frequencies[strategy as keyof typeof frequencies] || 10000
  }
  
  private getStrategyParameters(strategy: string): any {
    // Return strategy-specific parameters based on the user's requirements
    const parameters = {
      'darvas_box': {
        darvasBox: {
          volumeThreshold: 1.5,
          breakoutConfirmation: 3,
          boxMinHeight: 0.02,
          boxMaxAge: 5
        }
      },
      'williams_alligator': {
        williamsAlligator: {
          jawPeriod: 13,
          teethPeriod: 8,
          lipsPeriod: 5,
          aoThreshold: 0.001
        }
      },
      'renko_breakout': {
        renkoBreakout: {
          brickSize: 0.001,
          minConsecutive: 3,
          volumeConfirmation: true,
          breakoutThreshold: 0.002
        }
      },
      'heikin_ashi': {
        heikinAshi: {
          trendConfirmation: 3,
          reversalSensitivity: 0.8,
          volumeFilter: true,
          smoothing: true
        }
      },
      'elliott_wave': {
        elliottWave: {
          waveComplexity: 'standard',
          fibonacciLevels: [0.236, 0.382, 0.618],
          patternConfidence: 0.7,
          timeframeAnalysis: true
        }
      }
    }
    
    return parameters[strategy as keyof typeof parameters] || {}
  }
  
  private getMCPTools(strategy: string): string[] {
    const baseTools = ['market_data_fetcher', 'order_executor', 'portfolio_analyzer', 'risk_calculator']
    
    const strategyTools = {
      'darvas_box': ['darvas_box_detector', 'volume_analyzer'],
      'williams_alligator': ['alligator_calculator', 'momentum_analyzer'],
      'renko_breakout': ['renko_generator', 'breakout_detector'],
      'heikin_ashi': ['heikin_ashi_converter', 'trend_analyzer'],
      'elliott_wave': ['wave_counter', 'fibonacci_calculator']
    }
    
    return [...baseTools, ...(strategyTools[strategy as keyof typeof strategyTools] || [])]
  }
  
  private initializeFarmPerformance(farmId: string) {
    const performance: FarmPerformance = {
      farmId,
      timestamp: new Date(),
      totalPnL: 0,
      dailyPnL: 0,
      weeklyPnL: 0,
      monthlyPnL: 0,
      totalROI: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      strategyBreakdown: new Map(),
      riskMetrics: {
        portfolioVaR: 0,
        conditionalVaR: 0,
        correlation: [],
        diversificationRatio: 0,
        concentrationRisk: 0
      },
      coordinationMetrics: {
        crossStrategySignals: 0,
        coordinatedTrades: 0,
        conflictResolutions: 0,
        learningSharing: 0,
        overallSynergy: 0
      }
    }
    
    this.farmPerformance.set(farmId, performance)
  }
  
  private startCoordinationLoop(farmId: string) {
    const loop = setInterval(async () => {
      try {
        await this.coordinateStrategies(farmId)
        await this.updateFarmPerformance(farmId)
      } catch (error) {
        console.error(`Coordination loop error for farm ${farmId}:`, error)
      }
    }, 60000) // Every minute
    
    this.coordinationLoops.set(farmId, loop)
  }
  
  private async updateFarmPerformance(farmId: string) {
    const agents = this.farmAgents.get(farmId)
    const config = this.farms.get(farmId)
    
    if (!agents || !config) return
    
    const performance = this.farmPerformance.get(farmId)
    if (!performance) return
    
    // Update overall performance
    performance.totalPnL = agents.reduce((sum, a) => sum + a.performance.totalPnL, 0)
    performance.totalROI = (performance.totalPnL / config.totalCapital) * 100
    performance.timestamp = new Date()
    
    // Update strategy breakdown
    const strategies = new Set(agents.map(a => a.agent.config.strategy.type))
    
    for (const strategy of strategies) {
      const strategyAgents = agents.filter(a => a.agent.config.strategy.type === strategy)
      const strategyPnL = strategyAgents.reduce((sum, a) => sum + a.performance.totalPnL, 0)
      const avgWinRate = strategyAgents.reduce((sum, a) => sum + a.performance.winRate, 0) / strategyAgents.length
      
      performance.strategyBreakdown.set(strategy, {
        pnl: strategyPnL,
        winRate: avgWinRate,
        agentCount: strategyAgents.length,
        avgPerformance: strategyPnL / strategyAgents.length,
        correlation: this.calculateStrategyCorrelation(strategy, agents)
      })
    }
    
    // Update coordination metrics
    const signals = this.crossStrategySignals.get(farmId) || []
    performance.coordinationMetrics.crossStrategySignals = signals.length
    performance.coordinationMetrics.overallSynergy = this.calculateSynergyScore(agents)
    
    this.emit('performanceUpdated', { farmId, performance })
  }
  
  private async updateAllFarmPerformance() {
    for (const farmId of this.farms.keys()) {
      await this.updateFarmPerformance(farmId)
    }
  }
  
  private async optimizeAllFarms() {
    for (const farmId of this.farms.keys()) {
      await this.optimizeFarm(farmId)
    }
  }
  
  private cleanOldData() {
    const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // 7 days
    
    for (const [farmId, signals] of this.crossStrategySignals.entries()) {
      const filtered = signals.filter(s => s.timestamp > cutoffDate)
      this.crossStrategySignals.set(farmId, filtered)
    }
  }
  
  private async analyzeStrategyCoordination(
    primaryAgent: FarmAgent,
    supportingAgents: FarmAgent[],
    agentSignals: Map<string, any[]>
  ): Promise<StrategyCoordination | null> {
    // Simplified coordination analysis
    const primarySignals = agentSignals.get(primaryAgent.agent.id) || []
    const recentPrimary = primarySignals.slice(-3)
    
    if (recentPrimary.length === 0) return null
    
    // Check for confirmation patterns
    let confirmationScore = 0
    let conflictScore = 0
    
    for (const supportingAgent of supportingAgents) {
      const supportingSignals = agentSignals.get(supportingAgent.agent.id) || []
      const recentSupporting = supportingSignals.slice(-3)
      
      for (const primaryDecision of recentPrimary) {
        for (const supportingDecision of recentSupporting) {
          if (this.decisionsAlign(primaryDecision, supportingDecision)) {
            confirmationScore += 0.2
          } else if (this.decisionsConflict(primaryDecision, supportingDecision)) {
            conflictScore += 0.1
          }
        }
      }
    }
    
    const confidence = Math.max(0, Math.min(1, confirmationScore - conflictScore))
    
    if (confidence > 0.6) {
      return {
        primaryStrategy: primaryAgent.agent.config.strategy.type,
        supportingStrategies: supportingAgents.map(a => a.agent.config.strategy.type),
        coordinationType: confirmationScore > conflictScore * 2 ? 'confirmation' : 'diversification',
        confidence,
        expectedBenefit: confidence * 15, // 15% max benefit
        riskAdjustment: 1 - (conflictScore * 0.1)
      }
    }
    
    return null
  }
  
  private decisionsAlign(decision1: any, decision2: any): boolean {
    // Simplified alignment check
    if (!decision1.decision || !decision2.decision) return false
    
    const action1 = decision1.decision.decision?.action
    const action2 = decision2.decision.decision?.action
    
    return action1 === action2 && action1 !== 'hold'
  }
  
  private decisionsConflict(decision1: any, decision2: any): boolean {
    // Simplified conflict check
    if (!decision1.decision || !decision2.decision) return false
    
    const action1 = decision1.decision.decision?.action
    const action2 = decision2.decision.decision?.action
    
    return (action1 === 'buy' && action2 === 'sell') || (action1 === 'sell' && action2 === 'buy')
  }
  
  private determineSignalType(coordination: StrategyCoordination): 'entry' | 'exit' | 'hold' | 'avoid' {
    if (coordination.confidence > 0.8 && coordination.expectedBenefit > 10) return 'entry'
    if (coordination.confidence > 0.7 && coordination.coordinationType === 'confirmation') return 'entry'
    if (coordination.coordinationType === 'hedge') return 'avoid'
    return 'hold'
  }
  
  private assessMarketConditions(): string[] {
    // Mock market condition assessment
    return ['normal_volatility', 'trending_market', 'good_liquidity']
  }
  
  private async executeCoordinatedAction(farmId: string, signal: CrossStrategySignal) {
    // Execute coordinated actions across multiple agents
    console.log(`Executing coordinated ${signal.signalType} action for farm ${farmId}`)
    // Implementation would coordinate actual trades
  }
  
  private determineOptimizationType(
    performance: FarmPerformance,
    config: FarmConfiguration
  ): 'rebalance' | 'strategy_adjustment' | 'risk_management' | 'performance_enhancement' {
    if (performance.maxDrawdown > config.targets.maxDailyDrawdown) return 'risk_management'
    if (performance.totalROI < 0) return 'strategy_adjustment'
    if (Math.abs(performance.totalPnL) > config.totalCapital * 0.1) return 'rebalance'
    return 'performance_enhancement'
  }
  
  private needsRebalancing(performance: FarmPerformance, config: FarmConfiguration): boolean {
    return Math.abs(performance.totalPnL) > config.totalCapital * (config.targets.rebalanceThreshold / 100)
  }
  
  private identifyUnderperformingStrategies(
    performance: FarmPerformance,
    config: FarmConfiguration
  ): string[] {
    const underperforming: string[] = []
    
    for (const [strategy, strategyPerf] of performance.strategyBreakdown.entries()) {
      const target = config.strategyAllocation[strategy as keyof typeof config.strategyAllocation]
      if (strategyPerf.winRate < config.targets.minWinRate || strategyPerf.pnl < target.targetProfit * 0.5) {
        underperforming.push(strategy)
      }
    }
    
    return underperforming
  }
  
  private assessRiskExposure(performance: FarmPerformance, config: FarmConfiguration): number {
    return Math.abs(performance.maxDrawdown)
  }
  
  private async generateRebalanceChanges(
    farmId: string,
    performance: FarmPerformance,
    config: FarmConfiguration
  ): Promise<OptimizationChange[]> {
    // Generate rebalancing changes
    return [{
      type: 'allocation',
      target: 'portfolio_rebalance',
      oldValue: 'current_allocation',
      newValue: 'optimized_allocation',
      reason: 'Portfolio drift correction',
      expectedImpact: 0.05
    }]
  }
  
  private async generateStrategyAdjustments(
    farmId: string,
    underperformingStrategies: string[]
  ): Promise<OptimizationChange[]> {
    // Generate strategy adjustment changes
    return underperformingStrategies.map(strategy => ({
      type: 'strategy',
      target: strategy,
      oldValue: 'current_parameters',
      newValue: 'adjusted_parameters',
      reason: `Underperformance in ${strategy}`,
      expectedImpact: 0.08
    }))
  }
  
  private async generateRiskAdjustments(
    farmId: string,
    riskExposure: number,
    config: FarmConfiguration
  ): Promise<OptimizationChange[]> {
    // Generate risk adjustment changes
    return [{
      type: 'parameter',
      target: 'risk_limits',
      oldValue: riskExposure,
      newValue: riskExposure * 0.8,
      reason: 'Excessive risk exposure',
      expectedImpact: 0.1
    }]
  }
  
  private async executeOptimization(farmId: string, optimization: FarmOptimization): Promise<boolean> {
    // Execute the optimization changes
    console.log(`Executing optimization for farm ${farmId}:`, optimization.changes.length, 'changes')
    
    // Implementation would apply the actual changes
    // For now, return success
    return true
  }
  
  private identifySharedInsights(allInsights: Map<string, LearningInsight[]>): LearningInsight[] {
    const shared: LearningInsight[] = []
    
    // Find insights that appear across multiple agents
    const insightTypes = new Map<string, { count: number; insights: LearningInsight[] }>()
    
    for (const [agentId, insights] of allInsights.entries()) {
      for (const insight of insights) {
        const key = `${insight.type}_${insight.title}`
        const current = insightTypes.get(key) || { count: 0, insights: [] }
        current.count++
        current.insights.push(insight)
        insightTypes.set(key, current)
      }
    }
    
    // Select insights that appear in multiple agents
    for (const [key, data] of insightTypes.entries()) {
      if (data.count > 1 && data.insights[0].confidence > 0.7) {
        shared.push(data.insights[0])
      }
    }
    
    return shared
  }
  
  private isInsightRelevant(insight: LearningInsight, strategyType: string): boolean {
    // Check if insight is relevant to the strategy type
    if (insight.type === 'pattern' || insight.type === 'performance') return true
    if (insight.title.toLowerCase().includes(strategyType.toLowerCase())) return true
    return false
  }
  
  private async applySharedInsights(agentId: string, insights: LearningInsight[]) {
    // Apply shared insights to an agent
    console.log(`Applying ${insights.length} shared insights to agent ${agentId}`)
    // Implementation would modify agent parameters or memory
  }
  
  private calculateStrategyCorrelation(strategy: string, agents: FarmAgent[]): number {
    // Calculate correlation between strategy and other strategies
    const strategyAgents = agents.filter(a => a.agent.config.strategy.type === strategy)
    const otherAgents = agents.filter(a => a.agent.config.strategy.type !== strategy)
    
    if (strategyAgents.length === 0 || otherAgents.length === 0) return 0
    
    // Simplified correlation calculation
    const strategyAvgPnL = strategyAgents.reduce((sum, a) => sum + a.performance.totalPnL, 0) / strategyAgents.length
    const otherAvgPnL = otherAgents.reduce((sum, a) => sum + a.performance.totalPnL, 0) / otherAgents.length
    
    return Math.min(1, Math.abs(strategyAvgPnL - otherAvgPnL) / Math.max(Math.abs(strategyAvgPnL), Math.abs(otherAvgPnL), 1))
  }
  
  private calculateSynergyScore(agents: FarmAgent[]): number {
    // Calculate overall synergy score
    const totalPerformance = agents.reduce((sum, a) => sum + a.performance.totalPnL, 0)
    const expectedIndividualPerformance = agents.reduce((sum, a) => sum + a.allocation * 0.1, 0) // 10% expected return
    
    return Math.max(0, Math.min(1, totalPerformance / Math.max(expectedIndividualPerformance, 1)))
  }
  
  /**
   * Stop farm operations
   */
  async stopFarm(farmId: string): Promise<boolean> {
    try {
      // Stop coordination loop
      const coordinationLoop = this.coordinationLoops.get(farmId)
      if (coordinationLoop) {
        clearInterval(coordinationLoop)
        this.coordinationLoops.delete(farmId)
      }
      
      // Stop all agents in the farm
      const agents = this.farmAgents.get(farmId)
      if (agents) {
        for (const farmAgent of agents) {
          autonomousTradingLoop.stopTradingLoop(farmAgent.agent.id)
          farmAgent.status = 'stopped'
        }
      }
      
      console.log(`Farm ${farmId} stopped successfully`)
      this.emit('farmStopped', { farmId })
      return true
      
    } catch (error) {
      console.error(`Failed to stop farm ${farmId}:`, error)
      return false
    }
  }
  
  /**
   * Get all farms
   */
  getAllFarms(): Map<string, FarmConfiguration> {
    return new Map(this.farms)
  }
  
  /**
   * Remove farm
   */
  async removeFarm(farmId: string): Promise<boolean> {
    try {
      await this.stopFarm(farmId)
      
      this.farms.delete(farmId)
      this.farmAgents.delete(farmId)
      this.farmPerformance.delete(farmId)
      this.optimizationHistory.delete(farmId)
      this.crossStrategySignals.delete(farmId)
      
      console.log(`Farm ${farmId} removed successfully`)
      this.emit('farmRemoved', { farmId })
      return true
      
    } catch (error) {
      console.error(`Failed to remove farm ${farmId}:`, error)
      return false
    }
  }
}

// Lazy initialization to prevent circular dependencies
let _multiStrategyFarmCoordinatorInstance: MultiStrategyFarmCoordinator | null = null

export const getMultiStrategyFarmCoordinator = (): MultiStrategyFarmCoordinator => {
  if (!_multiStrategyFarmCoordinatorInstance) {
    _multiStrategyFarmCoordinatorInstance = new MultiStrategyFarmCoordinator()
  }
  return _multiStrategyFarmCoordinatorInstance
}

// Backward compatibility
export const multiStrategyFarmCoordinator = {
  get instance() {
    return getMultiStrategyFarmCoordinator()
  }
}