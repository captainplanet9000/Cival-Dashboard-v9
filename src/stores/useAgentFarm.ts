import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  PaperTradingAgent,
  AgentType,
  AgentStatus,
  AgentConfig,
  AgentGoal,
  GoalType,
  Priority,
  GraduationStatus,
  GraduationCriteria,
  GraduatedAgent,
  AgentFarmPerformance,
  ResourceAllocation,
  AgentStrategy,
  BacktestResult,
  DeFiProtocol,
  RiskLimits
} from '@/types/paper-trading.types'

interface AgentFarmState {
  // Agents
  agents: Record<string, PaperTradingAgent>
  activeAgents: string[]
  graduatedAgents: Record<string, GraduatedAgent>
  
  // Performance & Analytics
  farmPerformance: AgentFarmPerformance
  leaderboard: PaperTradingAgent[]
  topPerformers: PaperTradingAgent[]
  worstPerformers: PaperTradingAgent[]
  
  // Resources
  resourceAllocation: ResourceAllocation
  
  // Graduation System
  graduationCriteria: GraduationCriteria
  pendingGraduation: string[]
  
  // UI State
  selectedAgent: string | null
  agentFilter: {
    status: AgentStatus[]
    type: AgentType[]
    performance: 'all' | 'top' | 'bottom'
    timeframe: '24h' | '7d' | '30d' | '90d' | 'all'
  }
  
  // System State
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

interface AgentFarmActions {
  // Agent Management
  createAgent: (config: AgentConfig) => Promise<string>
  updateAgent: (agentId: string, updates: Partial<PaperTradingAgent>) => void
  deleteAgent: (agentId: string) => Promise<void>
  startAgent: (agentId: string) => Promise<void>
  stopAgent: (agentId: string) => Promise<void>
  pauseAgent: (agentId: string) => Promise<void>
  resumeAgent: (agentId: string) => Promise<void>
  
  // Goal Management
  addGoal: (agentId: string, goal: Omit<AgentGoal, 'id' | 'createdAt' | 'progress' | 'progressHistory' | 'status'>) => string
  updateGoal: (agentId: string, goalId: string, updates: Partial<AgentGoal>) => void
  removeGoal: (agentId: string, goalId: string) => void
  updateGoalProgress: (agentId: string, goalId: string, progress: number) => void
  
  // Strategy Management
  addStrategy: (agentId: string, strategy: Omit<AgentStrategy, 'id' | 'createdAt' | 'lastModified'>) => string
  updateStrategy: (agentId: string, strategyId: string, updates: Partial<AgentStrategy>) => void
  removeStrategy: (agentId: string, strategyId: string) => void
  backtestStrategy: (agentId: string, strategyId: string) => Promise<BacktestResult>
  deployStrategy: (agentId: string, strategyId: string) => Promise<void>
  
  // Graduation System
  evaluateGraduation: (agentId: string) => GraduationStatus
  graduateAgent: (agentId: string, allocatedCapital: number) => Promise<void>
  updateGraduationCriteria: (criteria: Partial<GraduationCriteria>) => void
  
  // Performance Analytics
  updateFarmPerformance: () => void
  updateLeaderboard: () => void
  calculateAgentRanking: (agentId: string) => number
  
  // Resource Management
  allocateResources: (agentId: string, resources: Partial<ResourceAllocation>) => void
  optimizeResourceAllocation: () => void
  
  // Filtering & Search
  setSelectedAgent: (agentId: string | null) => void
  updateFilter: (filter: Partial<AgentFarmState['agentFilter']>) => void
  searchAgents: (query: string) => PaperTradingAgent[]
  
  // Bulk Operations
  startAllAgents: () => Promise<void>
  stopAllAgents: () => Promise<void>
  rebalancePortfolios: () => Promise<void>
  
  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refreshData: () => Promise<void>
}

type AgentFarmStore = AgentFarmState & AgentFarmActions

export const useAgentFarm = create<AgentFarmStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial State
      agents: {},
      activeAgents: [],
      graduatedAgents: {},
      farmPerformance: {
        totalAgents: 0,
        activeAgents: 0,
        graduatedAgents: 0,
        totalVirtualCapital: 0,
        totalRealCapital: 0,
        averagePerformance: 0,
        topPerformers: [],
        worstPerformers: [],
        graduationRate: 0,
        farmEfficiency: 0,
        resourceUtilization: 0
      },
      leaderboard: [],
      topPerformers: [],
      worstPerformers: [],
      resourceAllocation: {
        computing: {
          totalCPU: 100,
          usedCPU: 0,
          cpuPerAgent: 5,
          maxConcurrentAgents: 20,
          processingQueue: 0
        },
        memory: {
          totalRAM: 16384, // 16GB in MB
          usedRAM: 0,
          ramPerAgent: 512, // 512MB per agent
          dataStorageUsed: 0,
          cacheSize: 1024 // 1GB cache
        },
        network: {
          bandwidth: 1000, // Mbps
          latency: 50, // ms
          requests_per_second: 1000,
          websocket_connections: 100,
          api_calls_per_minute: 6000
        },
        apiLimits: {
          exchangeApi: {},
          defiProtocols: {},
          priceFeeds: 1000,
          newsFeeds: 100,
          remainingQuota: {}
        },
        costs: {
          computing: 0,
          storage: 0,
          networking: 0,
          apiCalls: 0,
          totalMonthlyCost: 0,
          costPerAgent: 0,
          costPerTrade: 0
        }
      },
      graduationCriteria: {
        minProfitability: 15, // 15% annual return
        minSharpeRatio: 1.5,
        maxDrawdown: 10, // 10% max drawdown
        consistencyPeriod: 90, // 90 days
        minTradeCount: 100,
        minWinRate: 55, // 55% win rate
        maxRiskScore: 70,
        protocolProficiency: 80, // 80% proficiency
        minYieldGenerated: 5 // 5% yield for farming agents
      },
      pendingGraduation: [],
      selectedAgent: null,
      agentFilter: {
        status: [],
        type: [],
        performance: 'all',
        timeframe: '30d'
      },
      isLoading: false,
      error: null,
      lastUpdate: null,

      // Agent Management
      createAgent: async (config: AgentConfig) => {
        const agentId = `agent_${config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const agent: PaperTradingAgent = {
          id: agentId,
          name: config.name,
          type: config.type,
          status: AgentStatus.INITIALIZING,
          config,
          paperTrading: {
            virtualBalance: config.initialCapital,
            portfolio: {} as any, // Will be created separately
            performanceMetrics: {} as any,
            goals: [],
            graduationStatus: {
              eligible: false,
              criteria: get().graduationCriteria,
              checks: {
                profitability: false,
                sharpeRatio: false,
                drawdown: false,
                consistency: false,
                tradeCount: false,
                winRate: false,
                riskScore: false,
                protocolProficiency: false,
                yieldGeneration: false,
                overallScore: 0
              },
              recommendedCapital: 0,
              nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              notes: ['Agent created - beginning paper trading phase']
            },
            strategies: [],
            riskLimits: {
              maxPositionSize: config.initialCapital * 0.1, // 10% max position
              maxPortfolioRisk: 20, // 20% portfolio risk
              maxDrawdown: config.maxDrawdown,
              maxLeverage: 1,
              stopLossPercent: 5,
              takeProfitPercent: 10,
              maxDailyLoss: config.initialCapital * 0.02, // 2% daily loss limit
              maxWeeklyLoss: config.initialCapital * 0.05, // 5% weekly loss limit
              maxMonthlyLoss: config.initialCapital * 0.1, // 10% monthly loss limit
              maxCorrelation: 0.7,
              maxConcentration: 25, // 25% max concentration
              var95Limit: config.initialCapital * 0.05,
              var99Limit: config.initialCapital * 0.1,
              protocolExposureLimit: Object.fromEntries(
                config.defiProtocols.map(protocol => [protocol, 30])
              ) as Record<DeFiProtocol, number>
            }
          },
          defiCapabilities: config.defiProtocols.map(protocol => ({
            protocol,
            capabilities: ['swap', 'liquidity_provision'],
            proficiencyLevel: 0,
            successRate: 0,
            totalVolume: 0,
            profitGenerated: 0,
            riskAssessment: 50
          })),
          communication: {
            canCommunicate: true,
            preferredChannels: ['websocket', 'api'],
            responseTime: 100,
            collaborationScore: 0,
            messagesExchanged: 0,
            coordinationSuccess: 0
          },
          learning: {
            learningRate: 0.01,
            adaptationSpeed: 0.1,
            knowledgeBase: [],
            experienceLevel: 0,
            mistakeCount: 0,
            improvementRate: 0,
            lastLearningUpdate: new Date()
          },
          createdAt: new Date(),
          lastActiveAt: new Date()
        }

        set((state) => {
          state.agents[agentId] = agent
          state.lastUpdate = new Date()
        })

        // Update farm performance
        get().updateFarmPerformance()

        return agentId
      },

      updateAgent: (agentId: string, updates: Partial<PaperTradingAgent>) => {
        set((state) => {
          if (state.agents[agentId]) {
            Object.assign(state.agents[agentId], updates)
            state.agents[agentId].lastActiveAt = new Date()
            state.lastUpdate = new Date()
          }
        })
      },

      deleteAgent: async (agentId: string) => {
        set((state) => {
          delete state.agents[agentId]
          state.activeAgents = state.activeAgents.filter(id => id !== agentId)
          state.pendingGraduation = state.pendingGraduation.filter(id => id !== agentId)
          if (state.selectedAgent === agentId) {
            state.selectedAgent = null
          }
        })
        
        get().updateFarmPerformance()
      },

      startAgent: async (agentId: string) => {
        set((state) => {
          if (state.agents[agentId]) {
            state.agents[agentId].status = AgentStatus.PAPER_TRADING
            state.agents[agentId].lastActiveAt = new Date()
            if (!state.activeAgents.includes(agentId)) {
              state.activeAgents.push(agentId)
            }
          }
        })
      },

      stopAgent: async (agentId: string) => {
        set((state) => {
          if (state.agents[agentId]) {
            state.agents[agentId].status = AgentStatus.PAUSED
            state.activeAgents = state.activeAgents.filter(id => id !== agentId)
          }
        })
      },

      pauseAgent: async (agentId: string) => {
        await get().stopAgent(agentId)
      },

      resumeAgent: async (agentId: string) => {
        await get().startAgent(agentId)
      },

      // Goal Management
      addGoal: (agentId: string, goalData) => {
        const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const goal: AgentGoal = {
          ...goalData,
          id: goalId,
          progress: 0,
          progressHistory: [],
          createdAt: new Date(),
          status: 'active'
        }

        set((state) => {
          if (state.agents[agentId]) {
            state.agents[agentId].paperTrading.goals.push(goal)
          }
        })

        return goalId
      },

      updateGoal: (agentId: string, goalId: string, updates: Partial<AgentGoal>) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            const goal = agent.paperTrading.goals.find(g => g.id === goalId)
            if (goal) {
              Object.assign(goal, updates)
            }
          }
        })
      },

      removeGoal: (agentId: string, goalId: string) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            agent.paperTrading.goals = agent.paperTrading.goals.filter(g => g.id !== goalId)
          }
        })
      },

      updateGoalProgress: (agentId: string, goalId: string, progress: number) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            const goal = agent.paperTrading.goals.find(g => g.id === goalId)
            if (goal) {
              goal.progress = progress
              goal.progressHistory.push({
                date: new Date(),
                value: progress,
                target: goal.target,
                percentage: (progress / goal.target) * 100
              })
              
              // Check if goal is completed
              if (progress >= goal.target && goal.status === 'active') {
                goal.status = 'completed'
              }
            }
          }
        })
      },

      // Strategy Management
      addStrategy: (agentId: string, strategyData) => {
        const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const strategy: AgentStrategy = {
          ...strategyData,
          id: strategyId,
          createdAt: new Date(),
          lastModified: new Date()
        }

        set((state) => {
          if (state.agents[agentId]) {
            state.agents[agentId].paperTrading.strategies.push(strategy)
          }
        })

        return strategyId
      },

      updateStrategy: (agentId: string, strategyId: string, updates: Partial<AgentStrategy>) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            const strategy = agent.paperTrading.strategies.find(s => s.id === strategyId)
            if (strategy) {
              Object.assign(strategy, updates)
              strategy.lastModified = new Date()
            }
          }
        })
      },

      removeStrategy: (agentId: string, strategyId: string) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            agent.paperTrading.strategies = agent.paperTrading.strategies.filter(s => s.id !== strategyId)
          }
        })
      },

      backtestStrategy: async (agentId: string, strategyId: string): Promise<BacktestResult> => {
        // Mock backtest result
        const backtest: BacktestResult = {
          period: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            end: new Date()
          },
          initialCapital: 10000,
          finalValue: 11500,
          totalReturn: 15,
          annualizedReturn: 60,
          sharpeRatio: 1.8,
          maxDrawdown: 8,
          winRate: 62,
          trades: 145,
          profitFactor: 1.45,
          equity: [],
          trades_detail: []
        }

        // Update strategy with backtest result
        get().updateStrategy(agentId, strategyId, { backtest })

        return backtest
      },

      deployStrategy: async (agentId: string, strategyId: string) => {
        set((state) => {
          const agent = state.agents[agentId]
          if (agent) {
            const strategy = agent.paperTrading.strategies.find(s => s.id === strategyId)
            if (strategy) {
              strategy.isActive = true
            }
          }
        })
      },

      // Graduation System
      evaluateGraduation: (agentId: string): GraduationStatus => {
        const agent = get().agents[agentId]
        if (!agent) {
          throw new Error(`Agent ${agentId} not found`)
        }

        const performance = agent.paperTrading.performanceMetrics
        const criteria = get().graduationCriteria
        
        const checks = {
          profitability: performance.annualizedReturn >= criteria.minProfitability,
          sharpeRatio: performance.sharpeRatio >= criteria.minSharpeRatio,
          drawdown: performance.maxDrawdown <= criteria.maxDrawdown,
          consistency: performance.consistencyScore >= (criteria.consistencyPeriod / 90) * 100,
          tradeCount: performance.totalTrades >= criteria.minTradeCount,
          winRate: performance.winRate >= criteria.minWinRate,
          riskScore: performance.riskScore <= criteria.maxRiskScore,
          protocolProficiency: agent.defiCapabilities.every(cap => cap.proficiencyLevel >= criteria.protocolProficiency),
          yieldGeneration: agent.type === AgentType.YIELD_FARMER ? 
            performance.annualizedReturn >= criteria.minYieldGenerated : true,
          overallScore: 0
        }

        const passedChecks = Object.values(checks).filter(Boolean).length - 1 // Exclude overallScore
        checks.overallScore = (passedChecks / 8) * 100

        const eligible = checks.overallScore >= 80 && passedChecks >= 7

        const recommendedCapital = eligible ? 
          Math.min(agent.config.initialCapital * (performance.sharpeRatio + 1), 100000) : 0

        const graduationStatus: GraduationStatus = {
          eligible,
          criteria,
          checks,
          recommendedCapital,
          nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: eligible ? 
            ['Agent meets graduation criteria', 'Ready for real capital deployment'] :
            ['Agent needs improvement in performance metrics', 'Continue paper trading']
        }

        // Update agent's graduation status
        set((state) => {
          if (state.agents[agentId]) {
            state.agents[agentId].paperTrading.graduationStatus = graduationStatus
            
            // Add to pending graduation if eligible
            if (eligible && !state.pendingGraduation.includes(agentId)) {
              state.pendingGraduation.push(agentId)
              state.agents[agentId].status = AgentStatus.READY_FOR_GRADUATION
            }
          }
        })

        return graduationStatus
      },

      graduateAgent: async (agentId: string, allocatedCapital: number) => {
        const agent = get().agents[agentId]
        if (!agent) return

        const graduatedAgent: GraduatedAgent = {
          agentId,
          graduationDate: new Date(),
          paperTradingPeriod: Math.floor((Date.now() - agent.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
          paperTradingPerformance: agent.paperTrading.performanceMetrics,
          allocatedCapital,
          status: 'active'
        }

        set((state) => {
          // Update agent status
          if (state.agents[agentId]) {
            state.agents[agentId].status = AgentStatus.GRADUATED
            state.agents[agentId].paperTrading.graduationStatus.graduationDate = new Date()
          }
          
          // Add to graduated agents
          state.graduatedAgents[agentId] = graduatedAgent
          
          // Remove from pending graduation
          state.pendingGraduation = state.pendingGraduation.filter(id => id !== agentId)
        })

        get().updateFarmPerformance()
      },

      updateGraduationCriteria: (criteria: Partial<GraduationCriteria>) => {
        set((state) => {
          Object.assign(state.graduationCriteria, criteria)
        })
      },

      // Performance Analytics
      updateFarmPerformance: () => {
        const agents = Object.values(get().agents)
        const graduated = Object.values(get().graduatedAgents)

        const performance: AgentFarmPerformance = {
          totalAgents: agents.length,
          activeAgents: agents.filter(a => a.status === AgentStatus.PAPER_TRADING).length,
          graduatedAgents: graduated.length,
          totalVirtualCapital: agents.reduce((sum, a) => sum + a.paperTrading.virtualBalance, 0),
          totalRealCapital: graduated.reduce((sum, a) => sum + a.allocatedCapital, 0),
          averagePerformance: agents.length > 0 ? 
            agents.reduce((sum, a) => sum + (a.paperTrading.performanceMetrics?.annualizedReturn || 0), 0) / agents.length : 0,
          topPerformers: agents
            .filter(a => a.paperTrading.performanceMetrics?.annualizedReturn > 0)
            .sort((a, b) => (b.paperTrading.performanceMetrics?.annualizedReturn || 0) - (a.paperTrading.performanceMetrics?.annualizedReturn || 0))
            .slice(0, 5),
          worstPerformers: agents
            .filter(a => a.paperTrading.performanceMetrics?.annualizedReturn < 0)
            .sort((a, b) => (a.paperTrading.performanceMetrics?.annualizedReturn || 0) - (b.paperTrading.performanceMetrics?.annualizedReturn || 0))
            .slice(0, 5),
          graduationRate: agents.length > 0 ? (graduated.length / agents.length) * 100 : 0,
          farmEfficiency: 85, // Mock efficiency score
          resourceUtilization: 65 // Mock utilization score
        }

        set((state) => {
          state.farmPerformance = performance
          state.topPerformers = performance.topPerformers
          state.worstPerformers = performance.worstPerformers
        })
      },

      updateLeaderboard: () => {
        const agents = Object.values(get().agents)
        const leaderboard = agents
          .sort((a, b) => {
            const scoreA = (a.paperTrading.performanceMetrics?.sharpeRatio || 0) * 
                          (a.paperTrading.performanceMetrics?.annualizedReturn || 0)
            const scoreB = (b.paperTrading.performanceMetrics?.sharpeRatio || 0) * 
                          (b.paperTrading.performanceMetrics?.annualizedReturn || 0)
            return scoreB - scoreA
          })

        set((state) => {
          state.leaderboard = leaderboard
        })
      },

      calculateAgentRanking: (agentId: string): number => {
        const leaderboard = get().leaderboard
        return leaderboard.findIndex(agent => agent.id === agentId) + 1
      },

      // Resource Management
      allocateResources: (agentId: string, resources: Partial<ResourceAllocation>) => {
        // Mock resource allocation
        console.log(`Allocating resources to agent ${agentId}`, resources)
      },

      optimizeResourceAllocation: () => {
        // Mock resource optimization
        console.log('Optimizing resource allocation across agent farm')
      },

      // UI Actions
      setSelectedAgent: (agentId: string | null) => {
        set((state) => {
          state.selectedAgent = agentId
        })
      },

      updateFilter: (filter: Partial<AgentFarmState['agentFilter']>) => {
        set((state) => {
          Object.assign(state.agentFilter, filter)
        })
      },

      searchAgents: (query: string): PaperTradingAgent[] => {
        const agents = Object.values(get().agents)
        return agents.filter(agent => 
          agent.name.toLowerCase().includes(query.toLowerCase()) ||
          agent.type.toLowerCase().includes(query.toLowerCase()) ||
          agent.id.toLowerCase().includes(query.toLowerCase())
        )
      },

      // Bulk Operations
      startAllAgents: async () => {
        const agentIds = Object.keys(get().agents)
        for (const agentId of agentIds) {
          await get().startAgent(agentId)
        }
      },

      stopAllAgents: async () => {
        const agentIds = Object.keys(get().agents)
        for (const agentId of agentIds) {
          await get().stopAgent(agentId)
        }
      },

      rebalancePortfolios: async () => {
        // Mock portfolio rebalancing
        console.log('Rebalancing all agent portfolios')
      },

      // Utility
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      refreshData: async () => {
        get().updateFarmPerformance()
        get().updateLeaderboard()
      }
    }))
  )
)

// Selectors
export const useAgent = (agentId: string) => useAgentFarm(state => state.agents[agentId])

export const useActiveAgents = () => useAgentFarm(state => 
  state.activeAgents.map(id => state.agents[id]).filter(Boolean)
)

export const useFilteredAgents = () => useAgentFarm(state => {
  // Safely handle potentially undefined state values
  const agents = Object.values(state.agents || {})
  const filter = state.agentFilter || { status: [], type: [], performance: 'all', timeframe: 'all' }
  
  return agents.filter(agent => {
    // Make sure agent and filter properties exist before accessing
    if (!agent) return false
    if (filter.status?.length > 0 && !filter.status.includes(agent.status)) return false
    if (filter.type?.length > 0 && !filter.type.includes(agent.type)) return false
    
    // Handle performance filtering
    if (filter.performance === 'top') {
      return (state.topPerformers || []).some(tp => tp?.id === agent.id)
    }
    if (filter.performance === 'bottom') {
      return state.worstPerformers.some(wp => wp.id === agent.id)
    }
    
    return true
  })
})

export const useAgentGoals = (agentId: string) => useAgentFarm(state =>
  state.agents[agentId]?.paperTrading.goals || []
)

export const useAgentStrategies = (agentId: string) => useAgentFarm(state =>
  state.agents[agentId]?.paperTrading.strategies || []
)

export const usePendingGraduationAgents = () => useAgentFarm(state =>
  state.pendingGraduation.map(id => state.agents[id]).filter(Boolean)
)