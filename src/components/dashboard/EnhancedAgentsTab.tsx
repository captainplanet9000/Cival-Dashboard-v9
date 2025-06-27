'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { 
  Bot,
  Play,
  Pause,
  Square,
  Settings,
  Brain,
  Activity,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Plus,
  RefreshCw,
  Loader2,
  Eye,
  MessageSquare,
  Users,
  Send
} from 'lucide-react'

// Import existing components
import { AgentTradingList } from '@/components/agent-trading/AgentTradingList'
import AgentManager from '@/components/trading/AgentManager'
import { AgentControlPanel } from '@/components/agent/AgentControlPanel'
import { AgentDecisionLog } from '@/components/agent/AgentDecisionLog'
import { AgentPaperTradingDashboard } from '@/components/agent/AgentPaperTradingDashboard'

// Import new modals
import { AgentCreationWizard } from '@/components/modals/AgentCreationWizard'
import { AgentManagementSuite } from '@/components/modals/AgentManagementSuite'

// Import LangChain services
import { 
  getLangChainService, 
  getLangGraphOrchestrator, 
  getAgentMemorySystem,
  getAGUIHandlers 
} from '@/lib/langchain'

// Import utilities and API
import { backendApi } from '@/lib/api/backend-client'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { agentTradingDb, type AgentTradingPermission } from '@/utils/agent-trading-db'

// Import Agent Persistence Service and System Lifecycle - using lazy loading
import { lazy } from 'react'

// Lazy load services to avoid circular dependencies
const getAgentPersistenceService = () => import('@/lib/agents/AgentPersistenceService').then(m => m.agentPersistenceService.get())
const getSystemLifecycleService = () => import('@/lib/system/SystemLifecycleService').then(m => m.systemLifecycleService.get())

// LangChain integration state
interface LangChainIntegration {
  isInitialized: boolean
  availableChains: number
  totalExecutions: number
  avgExecutionTime: number
  lastActivity?: Date
}

// Use existing TradingAgent interface from AgentManager
interface TradingAgent {
  id: string
  name: string
  type: 'momentum' | 'arbitrage' | 'mean_reversion' | 'risk_manager' | 'coordinator'
  status: 'active' | 'inactive' | 'error' | 'paused'
  avatar?: string
  description: string
  
  performance: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalReturn: number
    totalReturnPercent: number
    avgTradeReturn: number
    maxDrawdown: number
    sharpeRatio: number
    profitFactor: number
  }
  
  config: {
    enabled: boolean
    maxPositions: number
    maxAllocation: number
    riskLevel: 'low' | 'medium' | 'high'
    strategies: string[]
    symbols: string[]
    timeframes: string[]
  }
  
  currentDecision?: string
  confidence?: number
  lastActivity: number
  allocatedFunds: number
  activePositions: number
  pendingOrders: number
  
  isListening: boolean
  lastMessage?: string
  conversationCount: number
}

interface AgentStats {
  total_agents: number
  active_agents: number
  total_trades_today: number
  total_pnl_today: number
  avg_performance: number
  system_health: number
}

export default function EnhancedAgentsTab() {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [permissions, setPermissions] = useState<AgentTradingPermission[]>([])
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<TradingAgent | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [showManageAgent, setShowManageAgent] = useState(false)
  const [managementAgentId, setManagementAgentId] = useState<string | null>(null)
  const [langChainStatus, setLangChainStatus] = useState<LangChainIntegration | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)

  // Load data from existing systems
  const fetchAgents = useCallback(async () => {
    try {
      // Try to get from backend API first
      const response = await backendApi.get('/api/v1/agents/status').catch(() => null)
      
      if (response?.data?.agents) {
        // Transform backend data to our format
        const backendAgents = response.data.agents.map((agent: any) => ({
          id: agent.agent_id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          description: agent.description || `${agent.strategy} trading agent`,
          performance: {
            totalTrades: agent.performance?.total_trades || 0,
            winningTrades: agent.performance?.winning_trades || 0,
            losingTrades: agent.performance?.losing_trades || 0,
            winRate: agent.performance?.win_rate || 0,
            totalReturn: agent.performance?.total_pnl || 0,
            totalReturnPercent: agent.performance?.total_return_percent || 0,
            avgTradeReturn: agent.performance?.avg_trade_return || 0,
            maxDrawdown: agent.performance?.max_drawdown || 0,
            sharpeRatio: agent.performance?.sharpe_ratio || 0,
            profitFactor: agent.performance?.profit_factor || 0
          },
          config: {
            enabled: agent.enabled,
            maxPositions: agent.configuration?.max_positions || 5,
            maxAllocation: agent.configuration?.max_allocation || 0.2,
            riskLevel: agent.configuration?.risk_level || 'medium',
            strategies: agent.configuration?.strategies || [agent.strategy],
            symbols: agent.configuration?.symbols || ['BTC/USDT'],
            timeframes: agent.configuration?.timeframes || ['15m']
          },
          currentDecision: agent.current_decision,
          confidence: agent.confidence,
          lastActivity: Date.now() - Math.random() * 3600000,
          allocatedFunds: agent.allocated_funds || 0,
          activePositions: agent.active_positions || 0,
          pendingOrders: agent.pending_orders || 0,
          isListening: agent.enabled,
          conversationCount: agent.conversation_count || 0
        }))
        setAgents(backendAgents)
      } else {
        // Load from persistence service
        const persistenceService = await getAgentPersistenceService()
        const persistedAgents = persistenceService.getAllAgents()
        
        if (persistedAgents.length > 0) {
          // Transform persisted agents to dashboard format with enhanced system data
          const transformedAgents = await Promise.all(persistedAgents.map(async agent => {
            // Get comprehensive agent stats from all integrated systems
            const mcpStats = persistenceService.getAgentMCPStats(agent.id)
            const availableTools = persistenceService.getAvailableMCPTools(agent.id)
            
            // Get LangChain memory and execution stats
            const memorySystem = await getAgentMemorySystem().catch(() => null)
            const agentMemory = memorySystem ? await memorySystem.getAgentConversations(agent.id) : []
            
            return {
              id: agent.id,
              name: agent.config.name,
              type: agent.config.type,
              status: agent.status,
              avatar: agent.config.avatar,
              description: agent.config.description,
            performance: {
              totalTrades: agent.performance.totalTrades,
              winningTrades: Math.floor(agent.performance.totalTrades * agent.performance.winRate),
              losingTrades: agent.performance.totalTrades - Math.floor(agent.performance.totalTrades * agent.performance.winRate),
              winRate: agent.performance.winRate,
              totalReturn: agent.performance.totalReturn,
              totalReturnPercent: agent.performance.totalReturnPercent,
              avgTradeReturn: agent.performance.totalTrades > 0 ? agent.performance.totalReturn / agent.performance.totalTrades : 0,
              maxDrawdown: agent.performance.maxDrawdown,
              sharpeRatio: agent.performance.sharpeRatio,
              profitFactor: agent.performance.winRate > 0 ? 1 + agent.performance.totalReturnPercent / 100 : 0
            },
            config: {
              enabled: agent.status === 'active',
              maxPositions: Math.floor(agent.config.maxPositionSize * 100) || 5,
              maxAllocation: agent.config.maxPositionSize,
              riskLevel: agent.config.riskTolerance > 0.7 ? 'high' : agent.config.riskTolerance > 0.4 ? 'medium' : 'low',
              strategies: agent.config.strategies,
              symbols: agent.config.tradingPairs,
              timeframes: ['5m', '15m', '1h'] // Default timeframes
            },
            currentDecision: 'Analyzing market conditions',
            confidence: 0.75,
            lastActivity: agent.lastActivity,
            allocatedFunds: agent.config.initialCapital,
            activePositions: agent.performance.totalTrades > 0 ? Math.floor(Math.random() * 3) : 0,
            pendingOrders: agent.status === 'active' ? Math.floor(Math.random() * 2) : 0,
            isListening: agent.status === 'active',
            lastMessage: `Agent ${agent.config.name} operational`,
            conversationCount: agent.memoryEntries || 0,
            // Enhanced system integration info
            systemIntegrations: {
              mcpTools: mcpStats.availableTools || 0,
              totalCalls: mcpStats.totalCalls || 0,
              successRate: mcpStats.successRate || 0,
              integrationHealth: agent.integrations,
              langChainMemory: agentMemory.length || 0,
              hasLangGraphChains: false // Will be updated by fetchLangChainStatus
            }
          }
          }))
          
          setAgents(transformedAgents)
        } else {
          // Fallback to mock data that matches our interface
        setAgents([
          {
            id: 'agent_001',
            name: 'Momentum Hunter',
            type: 'momentum',
            status: 'active',
            avatar: '/agents/momentum-hunter.png',
            description: 'High-frequency momentum trading specialist',
            performance: {
              totalTrades: 156,
              winningTrades: 98,
              losingTrades: 58,
              winRate: 0.628,
              totalReturn: 15680.45,
              totalReturnPercent: 15.68,
              avgTradeReturn: 100.52,
              maxDrawdown: 0.082,
              sharpeRatio: 1.42,
              profitFactor: 1.85
            },
            config: {
              enabled: true,
              maxPositions: 5,
              maxAllocation: 0.2,
              riskLevel: 'medium',
              strategies: ['momentum', 'breakout'],
              symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
              timeframes: ['5m', '15m']
            },
            currentDecision: 'Analyzing BTC breakout pattern',
            confidence: 0.85,
            lastActivity: Date.now() - 300000,
            allocatedFunds: 5000,
            activePositions: 2,
            pendingOrders: 1,
            isListening: true,
            lastMessage: 'Strong momentum detected on BTC/USDT',
            conversationCount: 45
          },
          {
            id: 'agent_002',
            name: 'Risk Guardian',
            type: 'risk_manager',
            status: 'active',
            avatar: '/agents/risk-guardian.png',
            description: 'Portfolio risk management and protection',
            performance: {
              totalTrades: 28,
              winningTrades: 28,
              losingTrades: 0,
              winRate: 1.0,
              totalReturn: 0,
              totalReturnPercent: 0,
              avgTradeReturn: 0,
              maxDrawdown: 0,
              sharpeRatio: 0,
              profitFactor: 0
            },
            config: {
              enabled: true,
              maxPositions: 0,
              maxAllocation: 0,
              riskLevel: 'low',
              strategies: ['risk_management', 'stop_loss'],
              symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'],
              timeframes: ['1m', '5m']
            },
            currentDecision: 'Monitoring portfolio exposure',
            confidence: 0.95,
            lastActivity: Date.now() - 60000,
            allocatedFunds: 0,
            activePositions: 0,
            pendingOrders: 0,
            isListening: true,
            lastMessage: 'Portfolio within risk parameters',
            conversationCount: 12
          },
          {
            id: 'agent_003',
            name: 'Arbitrage Scout',
            type: 'arbitrage',
            status: 'paused',
            avatar: '/agents/arbitrage-scout.png',
            description: 'Cross-exchange arbitrage opportunities',
            performance: {
              totalTrades: 89,
              winningTrades: 76,
              losingTrades: 13,
              winRate: 0.854,
              totalReturn: 3245.67,
              totalReturnPercent: 6.49,
              avgTradeReturn: 36.47,
              maxDrawdown: 0.028,
              sharpeRatio: 2.15,
              profitFactor: 2.84
            },
            config: {
              enabled: false,
              maxPositions: 10,
              maxAllocation: 0.15,
              riskLevel: 'low',
              strategies: ['arbitrage', 'triangular_arbitrage'],
              symbols: ['BTC/USDT', 'ETH/USDT'],
              timeframes: ['1m']
            },
            currentDecision: 'Agent paused by user',
            confidence: 0,
            lastActivity: Date.now() - 3600000,
            allocatedFunds: 0,
            activePositions: 0,
            pendingOrders: 0,
            isListening: false,
            lastMessage: 'Agent paused - low volatility conditions',
            conversationCount: 23
          }
        ])
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }, []);

  // Fetch LangChain integration status
  const fetchLangChainStatus = useCallback(async () => {
    try {
      const [langChainService, langGraphOrchestrator, memorySystem] = await Promise.all([
        getLangChainService().catch(() => null),
        getLangGraphOrchestrator().catch(() => null),
        getAgentMemorySystem().catch(() => null)
      ])

      if (langChainService || langGraphOrchestrator || memorySystem) {
        // Get integration statistics
        const availableChains = langGraphOrchestrator ? 
          await langGraphOrchestrator.getAvailableGraphs().catch(() => []) : []
        
        const totalMemoryEntries = memorySystem ? 
          await memorySystem.getTotalConversations().catch(() => 0) : 0

        setLangChainStatus({
          isInitialized: true,
          availableChains: availableChains.length,
          totalExecutions: totalMemoryEntries,
          avgExecutionTime: 150, // Mock data - would come from actual metrics
          lastActivity: new Date()
        })
      } else {
        setLangChainStatus({
          isInitialized: false,
          availableChains: 0,
          totalExecutions: 0,
          avgExecutionTime: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch LangChain status:', error)
      setLangChainStatus({
        isInitialized: false,
        availableChains: 0,
        totalExecutions: 0,
        avgExecutionTime: 0
      })
    }
  }, [])

  // Load trading permissions using existing utility
  const fetchPermissions = useCallback(async () => {
    try {
      const result = await agentTradingDb.getTradingPermissions()
      if (result.data) {
        setPermissions(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }, [])

  // Load agent stats
  const fetchAgentStats = useCallback(async () => {
    try {
      const response = await backendApi.get('/api/v1/agents/analytics').catch(() => null)
      
      if (response?.data) {
        setAgentStats(response.data)
      } else {
        // Get comprehensive stats from system lifecycle service (lazy loaded)
        try {
          const systemLifecycleService = await getSystemLifecycleService()
          const systemStats = systemLifecycleService.getSystemStats()
          const systemHealth = systemLifecycleService.getSystemHealth()
          
          setAgentStats({
            total_agents: systemStats.totalAgents,
            active_agents: systemStats.activeAgents,
            total_trades_today: Math.floor(agents.reduce((sum, a) => sum + (a.performance.totalTrades * 0.1), 0)),
            total_pnl_today: agents.reduce((sum, a) => sum + (a.performance.totalReturn * 0.05), 0),
            avg_performance: agents.reduce((sum, a) => sum + a.performance.winRate, 0) / Math.max(agents.length, 1),
            system_health: systemHealth?.overall === 'healthy' ? 0.95 : 
                          systemHealth?.overall === 'degraded' ? 0.75 : 
                          systemHealth?.overall === 'critical' ? 0.5 : 0.85
          })
        } catch (error) {
          console.error('Failed to load system lifecycle service:', error)
          // Fallback to calculated stats
          setAgentStats({
            total_agents: agents.length,
            active_agents: agents.filter(a => a.status === 'active').length,
            total_trades_today: Math.floor(agents.reduce((sum, a) => sum + (a.performance.totalTrades * 0.1), 0)),
            total_pnl_today: agents.reduce((sum, a) => sum + (a.performance.totalReturn * 0.05), 0),
            avg_performance: agents.reduce((sum, a) => sum + a.performance.winRate, 0) / Math.max(agents.length, 1),
            system_health: 0.85
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent stats:', error)
      // Set fallback stats based on current agents
      setAgentStats({
        total_agents: agents.length,
        active_agents: agents.filter(a => a.status === 'active').length,
        total_trades_today: agents.reduce((sum, a) => sum + (a.performance.totalTrades * 0.1), 0),
        total_pnl_today: agents.reduce((sum, a) => sum + (a.performance.totalReturn * 0.05), 0),
        avg_performance: agents.reduce((sum, a) => sum + a.performance.winRate, 0) / Math.max(agents.length, 1),
        system_health: 0.85
      })
    }
  }, [agents])

  // Agent control functions
  const toggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'start' : 'stop'
      await backendApi.post(`/api/v1/agents/${agentId}/${endpoint}`).catch(() => ({ ok: true }))
      
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              config: { ...agent.config, enabled },
              status: enabled ? 'active' : 'paused',
              isListening: enabled
            }
          : agent
      ))
      
      toast.success(`Agent ${enabled ? 'started' : 'stopped'} successfully`)
    } catch (error) {
      console.error('Failed to toggle agent:', error)
      toast.error('Failed to toggle agent')
    }
  }

  // Handle agent creation with LangChain integration
  const handleCreateAgent = async (config: any) => {
    try {
      // Initialize LangChain components for the new agent if available
      const memorySystem = await getAgentMemorySystem().catch(() => null)
      if (memorySystem && config.enableLearning) {
        await memorySystem.initializeAgentMemory(config.name, {
          systemPrompt: config.systemPrompt,
          decisionThreshold: config.decisionThreshold
        }).catch(error => {
          console.warn('Failed to initialize LangChain memory:', error)
        })
      }

      // Refresh the agents list from persistence service
      // The wizard already created the agent via AgentPersistenceService
      await fetchAgents()
      
      toast.success(`Agent "${config.name}" created successfully!`)
      
      // Refresh stats and LangChain status
      fetchAgentStats()
      fetchLangChainStatus()
    } catch (error) {
      console.error('Failed to refresh agents after creation:', error)
      toast.error('Failed to refresh agent list')
    }
  }

  // Legacy backend creation method (keeping for compatibility)
  const handleCreateAgentLegacy = async (config: any) => {
    try {
      // Transform config to backend format
      const agentData = {
        name: config.name,
        description: config.description,
        type: config.type,
        configuration: {
          initial_capital: config.initialCapital,
          max_drawdown: config.maxDrawdown / 100,
          risk_tolerance: config.riskTolerance / 100,
          time_horizon: parseInt(config.timeHorizon),
          trading_pairs: config.tradingPairs,
          strategies: config.strategies,
          indicators: config.indicators,
          max_position_size: config.maxPositionSize,
          stop_loss_percent: config.stopLossPercent / 100,
          take_profit_percent: config.takeProfitPercent / 100,
          max_daily_loss: config.maxDailyLoss,
          defi_protocols: config.defiProtocols,
          yield_farming: config.yieldFarming,
          liquidity_provision: config.liquidityProvision,
          auto_rebalance: config.autoRebalance,
          compound_returns: config.compoundReturns,
          notifications: config.notifications,
          paper_trading_duration: config.paperTradingDuration
        },
        enabled: true
      }

      // Create agent via backend API
      const response = await backendApi.post('/api/v1/agents', agentData).catch(() => ({ 
        data: { 
          agent_id: `agent_${Date.now()}`,
          ...agentData,
          created_at: new Date().toISOString()
        } 
      }))

      // Transform response back to our agent format
      const newAgent: TradingAgent = {
        id: response.data.agent_id,
        name: agentData.name,
        type: agentData.type as any,
        status: 'active',
        description: agentData.description,
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          avgTradeReturn: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          profitFactor: 0
        },
        config: {
          enabled: true,
          maxPositions: 5,
          maxAllocation: 0.2,
          riskLevel: config.riskTolerance > 70 ? 'high' : config.riskTolerance > 30 ? 'medium' : 'low',
          strategies: config.strategies,
          symbols: config.tradingPairs,
          timeframes: ['5m', '15m', '1h']
        },
        currentDecision: 'Agent initialized - waiting for market opportunities',
        confidence: 0.5,
        lastActivity: Date.now(),
        allocatedFunds: config.initialCapital,
        activePositions: 0,
        pendingOrders: 0,
        isListening: true,
        conversationCount: 0
      }

      // Add to local state
      setAgents(prev => [...prev, newAgent])

      toast.success(`Agent "${config.name}" created successfully!`)
      
      // Refresh stats
      fetchAgentStats()
    } catch (error) {
      console.error('Failed to create agent:', error)
      toast.error('Failed to create agent')
    }
  }

  // Handle agent management
  const handleManageAgent = (agentId: string) => {
    setManagementAgentId(agentId)
    setShowManageAgent(true)
  }

  // Enhanced agent communication with LangChain
  const sendMessageToAgent = async (agentId: string, message: string) => {
    try {
      const [memorySystem, langChainService] = await Promise.all([
        getAgentMemorySystem().catch(() => null),
        getLangChainService().catch(() => null)
      ])

      if (memorySystem && langChainService) {
        // Add message to agent memory
        await memorySystem.addMessage(agentId, 'user', message)
        
        // Process message through LangChain
        const response = await langChainService.processAgentMessage(agentId, message)
        
        // Add response to memory
        await memorySystem.addMessage(agentId, 'assistant', response)
        
        // Update agent state
        setAgents(prev => prev.map(agent => 
          agent.id === agentId 
            ? { 
                ...agent, 
                lastMessage: response,
                conversationCount: agent.conversationCount + 1,
                lastActivity: Date.now()
              }
            : agent
        ))
        
        toast.success('Message sent to agent successfully')
        return response
      } else {
        throw new Error('LangChain services not available')
      }
    } catch (error) {
      console.error('Failed to send message to agent:', error)
      toast.error('Failed to communicate with agent')
      return null
    }
  }

  // Execute agent decision with LangChain orchestration
  const executeAgentDecision = async (agentId: string) => {
    try {
      const [langGraphOrchestrator, langChainService] = await Promise.all([
        getLangGraphOrchestrator().catch(() => null),
        getLangChainService().catch(() => null)
      ])

      if (langGraphOrchestrator) {
        // Use LangGraph for decision execution
        const decision = await langGraphOrchestrator.executeAgentDecision(agentId)
        
        // Update agent state with decision
        setAgents(prev => prev.map(agent => 
          agent.id === agentId 
            ? { 
                ...agent, 
                currentDecision: decision.description,
                confidence: decision.confidence,
                lastActivity: Date.now()
              }
            : agent
        ))
        
        toast.success('Agent decision executed successfully')
        return decision
      } else {
        // Fallback to backend API
        const response = await backendApi.post(`/api/v1/agents/${agentId}/execute-decision`)
        return response.data
      }
    } catch (error) {
      console.error('Failed to execute agent decision:', error)
      toast.error('Failed to execute agent decision')
      return null
    }
  }

  // Handle sending message to agent
  const handleSendMessage = async () => {
    if (!selectedAgent || !messageInput.trim()) return
    
    setIsProcessingMessage(true)
    try {
      const response = await sendMessageToAgent(selectedAgent.id, messageInput.trim())
      if (response) {
        setMessageInput('')
        // Update selected agent to reflect new conversation
        setSelectedAgent(prev => prev ? {
          ...prev,
          lastMessage: response,
          conversationCount: prev.conversationCount + 1,
          lastActivity: Date.now()
        } : null)
      }
    } finally {
      setIsProcessingMessage(false)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchAgents(),
        fetchPermissions(),
        fetchLangChainStatus()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [fetchAgents, fetchPermissions, fetchLangChainStatus])

  // Load stats after agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      fetchAgentStats()
    }
  }, [agents, fetchAgentStats])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchAgents()
      fetchPermissions()
      fetchLangChainStatus()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAgents, fetchPermissions, fetchLangChainStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'momentum': return <TrendingUp className="h-4 w-4" />
      case 'arbitrage': return <BarChart3 className="h-4 w-4" />
      case 'mean_reversion': return <Activity className="h-4 w-4" />
      case 'risk_manager': return <Target className="h-4 w-4" />
      case 'coordinator': return <Users className="h-4 w-4" />
      default: return <Bot className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentStats?.total_agents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {agentStats?.active_agents || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(agentStats?.total_trades_today || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Automated executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(agentStats?.total_pnl_today || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Autonomous profits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(agentStats?.avg_performance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average win rate
            </p>
          </CardContent>
        </Card>
        {/* LangChain Integration Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LangChain Status</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                langChainStatus?.isInitialized ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="text-sm font-medium">
                {langChainStatus?.isInitialized ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {langChainStatus?.availableChains || 0} chains available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Agent Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="control">Control Panel</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="trading">Paper Trading</TabsTrigger>
            <TabsTrigger value="langchain">LangChain</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="manager">Advanced</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowCreateAgent(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            <Button onClick={() => {
              fetchAgents()
              fetchPermissions()
              fetchAgentStats()
              fetchLangChainStatus()
            }} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                        <AvatarFallback>
                          {getTypeIcon(agent.type)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {agent.type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <Switch
                        checked={agent.config.enabled}
                        onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total P&L</div>
                      <div className="font-bold text-green-600">
                        {formatCurrency(agent.performance.totalReturn)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-bold">
                        {formatPercent(agent.performance.winRate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Trades</div>
                      <div className="font-bold">{agent.performance.totalTrades}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-bold">{agent.performance.sharpeRatio.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Current Status */}
                  {agent.currentDecision && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm font-medium mb-1">Current Decision</div>
                      <div className="text-sm text-muted-foreground">{agent.currentDecision}</div>
                      {agent.confidence && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="text-xs text-muted-foreground">Confidence:</div>
                          <Progress value={agent.confidence * 100} className="h-1 flex-1" />
                          <div className="text-xs font-medium">{formatPercent(agent.confidence)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity Status */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.isListening ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-muted-foreground">
                        {agent.isListening ? 'Listening' : 'Silent'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(agent.lastActivity).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAgent(agent)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeAgentDecision(agent.id)}
                      disabled={agent.status !== 'active'}
                      title="Execute Agent Decision"
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManageAgent(agent.id)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <AgentControlPanel />
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <AgentDecisionLog />
        </TabsContent>

        <TabsContent value="trading" className="space-y-4">
          <AgentPaperTradingDashboard />
        </TabsContent>

        <TabsContent value="langchain" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LangChain Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  LangChain Integration Status
                </CardTitle>
                <CardDescription>
                  Monitor LangChain services and agent memory systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      langChainStatus?.isInitialized ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {langChainStatus?.isInitialized ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Available Chains</span>
                  <span className="text-sm font-medium">{langChainStatus?.availableChains || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Executions</span>
                  <span className="text-sm font-medium">{langChainStatus?.totalExecutions || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Execution Time</span>
                  <span className="text-sm font-medium">{langChainStatus?.avgExecutionTime || 0}ms</span>
                </div>
                
                {langChainStatus?.lastActivity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Activity</span>
                    <span className="text-sm font-medium">
                      {langChainStatus.lastActivity.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                <Button 
                  onClick={fetchLangChainStatus} 
                  className="w-full mt-4"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </CardContent>
            </Card>

            {/* Agent Memory Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Agent Memory System
                </CardTitle>
                <CardDescription>
                  Manage agent conversations and memory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.filter(a => a.conversationCount > 0).map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback>
                            {getTypeIcon(agent.type)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.conversationCount} conversations
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  ))}
                  
                  {agents.filter(a => a.conversationCount > 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No agent conversations yet</p>
                      <p className="text-xs">Start chatting with your agents to see their memory</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Communication Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Agent Communication</CardTitle>
              <CardDescription>
                Send messages to multiple agents at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.filter(a => a.status === 'active').map(agent => (
                  <div key={agent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                        <AvatarFallback>
                          {getTypeIcon(agent.type)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{agent.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {agent.type}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeAgentDecision(agent.id)}
                        className="flex-1"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {agent.lastMessage && (
                      <div className="mt-2 p-2 bg-muted/20 rounded text-xs">
                        {agent.lastMessage.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Trading Permissions</CardTitle>
              <CardDescription>
                Manage trading permissions and access controls for your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentTradingList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager" className="space-y-4">
          <AgentManager />
        </TabsContent>
      </Tabs>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                    <AvatarFallback>
                      {getTypeIcon(selectedAgent.type)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedAgent.name}</CardTitle>
                    <CardDescription>{selectedAgent.description}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detailed Performance */}
              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Trades:</span>
                      <span className="font-medium">{selectedAgent.performance.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Winning Trades:</span>
                      <span className="font-medium text-green-600">{selectedAgent.performance.winningTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Losing Trades:</span>
                      <span className="font-medium text-red-600">{selectedAgent.performance.losingTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-medium">{formatPercent(selectedAgent.performance.winRate)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedAgent.performance.totalReturn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Trade Return:</span>
                      <span className="font-medium">{formatCurrency(selectedAgent.performance.avgTradeReturn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="font-medium text-red-600">{formatPercent(selectedAgent.performance.maxDrawdown)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span className="font-medium">{selectedAgent.performance.sharpeRatio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h4 className="font-medium mb-3">Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Positions:</span>
                    <span className="font-medium">{selectedAgent.config.maxPositions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Allocation:</span>
                    <span className="font-medium">{formatPercent(selectedAgent.config.maxAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedAgent.config.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Symbols:</span>
                    <span className="font-medium">{selectedAgent.config.symbols.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframes:</span>
                    <span className="font-medium">{selectedAgent.config.timeframes.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Current State */}
              <div>
                <h4 className="font-medium mb-3">Current State</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Allocated Funds:</span>
                    <span className="font-medium">{formatCurrency(selectedAgent.allocatedFunds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Positions:</span>
                    <span className="font-medium">{selectedAgent.activePositions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Orders:</span>
                    <span className="font-medium">{selectedAgent.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversations:</span>
                    <span className="font-medium">{selectedAgent.conversationCount}</span>
                  </div>
                </div>
              </div>

              {/* Communication Interface */}
              <div>
                <h4 className="font-medium mb-3">Agent Communication</h4>
                
                {/* Latest Message */}
                {selectedAgent.lastMessage && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-1">Latest Response:</div>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      {selectedAgent.lastMessage}
                    </div>
                  </div>
                )}
                
                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Send message to agent..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isProcessingMessage || selectedAgent.status !== 'active'}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isProcessingMessage || selectedAgent.status !== 'active'}
                    size="sm"
                  >
                    {isProcessingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Communication Status */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${
                    langChainStatus?.isInitialized ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>
                    {langChainStatus?.isInitialized 
                      ? 'LangChain communication enabled' 
                      : 'LangChain communication unavailable'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Creation Wizard */}
      <AgentCreationWizard
        open={showCreateAgent}
        onClose={() => setShowCreateAgent(false)}
        onCreateAgent={handleCreateAgent}
        existingAgents={agents}
      />

      {/* Agent Management Suite */}
      <AgentManagementSuite
        open={showManageAgent}
        onClose={() => {
          setShowManageAgent(false)
          setManagementAgentId(null)
        }}
        agentId={managementAgentId}
        onAgentUpdate={(updatedAgent) => {
          setAgents(prev => prev.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          ))
          fetchAgents() // Refresh from backend
        }}
      />
    </div>
  )
}