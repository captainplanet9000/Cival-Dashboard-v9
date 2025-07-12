'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Gauge, 
  TrendingUp, 
  Users, 
  Shield, 
  AlertTriangle,
  Activity,
  Settings,
  RefreshCw
} from 'lucide-react'

// Import leverage components
import { LeverageControlPanel } from '@/components/leverage/LeverageControlPanel'
import { LeverageMonitoringDashboard } from '@/components/leverage/LeverageMonitoringDashboard'
import { AgentLeverageCoordination } from '@/components/leverage/AgentLeverageCoordination'

// Import WebSocket hook
import { useLeverageWebSocket } from '@/lib/websocket/leverage-events'

// Import API client
import { backendClient } from '@/lib/api/backend-client'

// Types
interface Agent {
  agent_id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  current_leverage: number
  max_leverage: number
  margin_usage: number
  portfolio_value: number
  daily_pnl: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface LeverageMetrics {
  agent_id: string
  agent_name: string
  portfolio_leverage: number
  margin_usage: number
  var_1d: number
  var_5d: number
  liquidation_risk_score: number
  time_to_liquidation_hours: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  risk_score: number
  positions_count: number
  total_margin_used: number
  available_margin: number
  daily_pnl: number
  recommendations: string[]
  immediate_actions: string[]
}

interface AgentCoordinationData {
  agent_id: string
  agent_name: string
  current_leverage: number
  recommended_leverage: number
  capital_allocation: number
  risk_contribution: number
  coordination_status: 'participating' | 'excluded' | 'paused'
  performance_score: number
}

interface PortfolioLeverageData {
  timestamp: string
  total_leverage: number
  margin_usage: number
  var_amount: number
  risk_score: number
}

export default function LeveragePage() {
  // State
  const [agents, setAgents] = useState<Agent[]>([])
  const [leverageMetrics, setLeverageMetrics] = useState<LeverageMetrics[]>([])
  const [coordinationData, setCoordinationData] = useState<AgentCoordinationData[]>([])
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioLeverageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('control')

  // WebSocket connection
  const {
    isConnected,
    lastMessage,
    leverageData,
    setLeverage,
    emergencyDelever,
    coordinateAgents,
    subscribeToAgent
  } = useLeverageWebSocket()

  // Load initial data
  useEffect(() => {
    loadLeverageData()
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage)
    }
  }, [lastMessage])

  const loadLeverageData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load mock data for demonstration
      const mockAgents: Agent[] = [
        {
          agent_id: 'agent_marcus_momentum',
          name: 'Marcus Momentum',
          status: 'active',
          current_leverage: 8.5,
          max_leverage: 20.0,
          margin_usage: 0.65,
          portfolio_value: 50000,
          daily_pnl: 1250.75,
          risk_level: 'MEDIUM'
        },
        {
          agent_id: 'agent_alex_arbitrage', 
          name: 'Alex Arbitrage',
          status: 'active',
          current_leverage: 12.3,
          max_leverage: 20.0,
          margin_usage: 0.82,
          portfolio_value: 75000,
          daily_pnl: -325.50,
          risk_level: 'HIGH'
        },
        {
          agent_id: 'agent_sophia_reversion',
          name: 'Sophia Reversion',
          status: 'active', 
          current_leverage: 5.2,
          max_leverage: 15.0,
          margin_usage: 0.45,
          portfolio_value: 30000,
          daily_pnl: 680.25,
          risk_level: 'LOW'
        },
        {
          agent_id: 'agent_riley_risk',
          name: 'Riley Risk',
          status: 'paused',
          current_leverage: 3.1,
          max_leverage: 10.0,
          margin_usage: 0.25,
          portfolio_value: 25000,
          daily_pnl: 125.00,
          risk_level: 'LOW'
        }
      ]

      setAgents(mockAgents)

      // Generate leverage metrics
      const metrics: LeverageMetrics[] = mockAgents.map(agent => ({
        agent_id: agent.agent_id,
        agent_name: agent.name,
        portfolio_leverage: agent.current_leverage,
        margin_usage: agent.margin_usage,
        var_1d: agent.portfolio_value * 0.02 * agent.current_leverage,
        var_5d: agent.portfolio_value * 0.02 * agent.current_leverage * Math.sqrt(5),
        liquidation_risk_score: agent.margin_usage * 100,
        time_to_liquidation_hours: agent.margin_usage >= 0.8 ? 24 / (agent.margin_usage * 10) : Infinity,
        risk_level: agent.risk_level,
        risk_score: agent.margin_usage * 100,
        positions_count: Math.floor(Math.random() * 8) + 2,
        total_margin_used: agent.portfolio_value * agent.margin_usage,
        available_margin: agent.portfolio_value * (1 - agent.margin_usage),
        daily_pnl: agent.daily_pnl,
        recommendations: generateRecommendations(agent),
        immediate_actions: agent.risk_level === 'HIGH' ? ['Consider reducing leverage', 'Monitor margin usage'] : []
      }))

      setLeverageMetrics(metrics)

      // Generate coordination data
      const coordination: AgentCoordinationData[] = mockAgents.map(agent => ({
        agent_id: agent.agent_id,
        agent_name: agent.name,
        current_leverage: agent.current_leverage,
        recommended_leverage: agent.current_leverage * (0.8 + Math.random() * 0.4),
        capital_allocation: 100 / mockAgents.length,
        risk_contribution: agent.margin_usage * 25,
        coordination_status: agent.status === 'active' ? 'participating' : 'excluded',
        performance_score: 60 + Math.random() * 40
      }))

      setCoordinationData(coordination)

      // Generate portfolio history
      const history: PortfolioLeverageData[] = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        history.push({
          timestamp: timestamp.toISOString(),
          total_leverage: 6 + Math.random() * 8,
          margin_usage: 0.4 + Math.random() * 0.4,
          var_amount: 5000 + Math.random() * 15000,
          risk_score: 30 + Math.random() * 40
        })
      }

      setPortfolioHistory(history)

      // Subscribe to all agents via WebSocket
      mockAgents.forEach(agent => {
        subscribeToAgent(agent.agent_id)
      })

    } catch (err) {
      console.error('Error loading leverage data:', err)
      setError('Failed to load leverage data. Using mock data for demonstration.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = (agent: Agent): string[] => {
    const recommendations = []
    
    if (agent.current_leverage > 15) {
      recommendations.push('Consider reducing leverage below 15x')
    }
    
    if (agent.margin_usage > 0.8) {
      recommendations.push('High margin usage - monitor for margin calls')
    }
    
    if (agent.daily_pnl < 0) {
      recommendations.push('Negative daily P&L - review strategy performance')
    }
    
    if (agent.risk_level === 'HIGH') {
      recommendations.push('High risk detected - consider deleveraging')
    }
    
    return recommendations.length > 0 ? recommendations : ['All metrics within acceptable ranges']
  }

  const handleWebSocketMessage = (message: any) => {
    const { type, data } = message

    switch (type) {
      case 'leverage_update':
        // Update agent leverage in real-time
        setAgents(prev => prev.map(agent => 
          agent.agent_id === data.agent_id 
            ? { ...agent, current_leverage: data.new_leverage }
            : agent
        ))
        break

      case 'margin_alert':
        // Handle margin alerts
        console.warn('Margin Alert:', data)
        break

      case 'liquidation_warning':
        // Handle liquidation warnings  
        console.error('Liquidation Warning:', data)
        break

      case 'emergency_delever':
        // Handle emergency deleveraging
        console.log('Emergency Delever:', data)
        loadLeverageData() // Refresh data after emergency action
        break
    }
  }

  const handleLeverageChange = async (agentId: string, leverage: number) => {
    try {
      // Update via WebSocket
      setLeverage(agentId, 'default', leverage)
      
      // Update local state immediately for responsive UI
      setAgents(prev => prev.map(agent => 
        agent.agent_id === agentId 
          ? { ...agent, current_leverage: leverage }
          : agent
      ))

      // Also try API call as backup
      const response = await backendClient.post('/api/v1/leverage/set-agent-leverage', {
        agent_id: agentId,
        asset: 'default',
        leverage_ratio: leverage
      })

      if (!response.success) {
        throw new Error(response.message)
      }

    } catch (error) {
      console.error('Failed to update leverage:', error)
      // Revert optimistic update on error
      loadLeverageData()
    }
  }

  const handleAutoDeleverToggle = async (agentId: string, enabled: boolean) => {
    try {
      console.log(`Auto-delever ${enabled ? 'enabled' : 'disabled'} for ${agentId}`)
      // Would implement auto-delever toggle via API
    } catch (error) {
      console.error('Failed to toggle auto-delever:', error)
    }
  }

  const handleEmergencyDelever = async (agentId: string) => {
    try {
      // Trigger emergency deleveraging
      emergencyDelever(agentId)
      
      // Also try API call
      const response = await backendClient.post('/api/v1/leverage/emergency-delever', null, {
        params: { agent_id: agentId }
      })

      if (response.success) {
        console.log('Emergency deleveraging initiated:', response.data)
      }

    } catch (error) {
      console.error('Failed to execute emergency delever:', error)
    }
  }

  const handleCoordinationUpdate = async (agentAllocations: Record<string, number>) => {
    try {
      // Apply leverage coordination
      for (const [agentId, leverage] of Object.entries(agentAllocations)) {
        await handleLeverageChange(agentId, leverage)
      }
    } catch (error) {
      console.error('Failed to apply coordination:', error)
    }
  }

  const handleStrategyApply = async (strategyId: string) => {
    try {
      console.log(`Applying coordination strategy: ${strategyId}`)
      // Would implement strategy application via API
    } catch (error) {
      console.error('Failed to apply strategy:', error)
    }
  }

  const handleRiskToleranceChange = async (agentId: string, tolerance: string) => {
    try {
      console.log(`Risk tolerance changed for ${agentId}: ${tolerance}`)
      // Would implement risk tolerance update via API
    } catch (error) {
      console.error('Failed to update risk tolerance:', error)
    }
  }

  const handleRefresh = () => {
    loadLeverageData()
  }

  const handleEmergencyAction = async (agentId: string) => {
    await handleEmergencyDelever(agentId)
  }

  // Calculate summary statistics
  const summaryStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    avgLeverage: agents.length > 0 ? agents.reduce((sum, a) => sum + a.current_leverage, 0) / agents.length : 0,
    highRiskAgents: agents.filter(a => a.risk_level === 'HIGH').length,
    totalPortfolioValue: agents.reduce((sum, a) => sum + a.portfolio_value, 0),
    totalDailyPnL: agents.reduce((sum, a) => sum + a.daily_pnl, 0)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading leverage dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leverage Engine</h1>
          <p className="text-gray-600">Advanced 20x leverage management for autonomous trading agents</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryStats.activeAgents}/{summaryStats.totalAgents}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Leverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryStats.avgLeverage.toFixed(1)}x
                </p>
              </div>
              <Gauge className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {summaryStats.highRiskAgents}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily P&L</p>
                <p className={`text-2xl font-bold ${summaryStats.totalDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryStats.totalDailyPnL >= 0 ? '+' : ''}${summaryStats.totalDailyPnL.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Leverage Control
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Monitoring
          </TabsTrigger>
          <TabsTrigger value="coordination" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Agent Coordination
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          <LeverageControlPanel
            agents={agents}
            onLeverageChange={handleLeverageChange}
            onAutoDeleverToggle={handleAutoDeleverToggle}
            onEmergencyDelever={handleEmergencyDelever}
            onRiskToleranceChange={handleRiskToleranceChange}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <LeverageMonitoringDashboard
            agents={leverageMetrics}
            portfolioHistory={portfolioHistory}
            onRefresh={handleRefresh}
            onEmergencyAction={handleEmergencyAction}
          />
        </TabsContent>

        <TabsContent value="coordination" className="space-y-6">
          <AgentLeverageCoordination
            agents={coordinationData}
            onCoordinationUpdate={handleCoordinationUpdate}
            onStrategyApply={handleStrategyApply}
            onEmergencyStop={() => agents.forEach(a => handleEmergencyDelever(a.agent_id))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}