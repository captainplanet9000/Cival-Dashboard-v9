'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Network,
  Users,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Types
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

interface CoordinationResult {
  total_portfolio_leverage: number
  risk_distribution: Record<string, number>
  optimization_score: number
  recommendations: string[]
  agent_allocations: Record<string, AgentCoordinationData>
}

interface CoordinationStrategy {
  strategy_id: string
  name: string
  description: string
  target_leverage: number
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  rebalance_frequency: number
  enabled: boolean
}

interface AgentLeverageCoordinationProps {
  agents: AgentCoordinationData[]
  onCoordinationUpdate: (agentAllocations: Record<string, number>) => void
  onStrategyApply: (strategyId: string) => void
  onEmergencyStop: () => void
}

export function AgentLeverageCoordination({
  agents,
  onCoordinationUpdate,
  onStrategyApply,
  onEmergencyStop
}: AgentLeverageCoordinationProps) {
  const [coordinationResult, setCoordinationResult] = useState<CoordinationResult | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('balanced')
  const [coordinationEnabled, setCoordinationEnabled] = useState(true)
  const [autoRebalance, setAutoRebalance] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Predefined coordination strategies
  const strategies: CoordinationStrategy[] = [
    {
      strategy_id: 'conservative',
      name: 'Conservative Risk Parity',
      description: 'Equal risk contribution across agents with low leverage',
      target_leverage: 5.0,
      risk_tolerance: 'conservative',
      rebalance_frequency: 3600, // 1 hour
      enabled: true
    },
    {
      strategy_id: 'balanced',
      name: 'Balanced Optimization',
      description: 'Optimize leverage based on agent performance and risk',
      target_leverage: 10.0,
      risk_tolerance: 'moderate',
      rebalance_frequency: 1800, // 30 minutes
      enabled: true
    },
    {
      strategy_id: 'aggressive',
      name: 'Aggressive Growth',
      description: 'Maximize leverage for high-performing agents',
      target_leverage: 18.0,
      risk_tolerance: 'aggressive',
      rebalance_frequency: 900, // 15 minutes
      enabled: true
    },
    {
      strategy_id: 'momentum',
      name: 'Momentum Following',
      description: 'Allocate more leverage to agents with positive momentum',
      target_leverage: 12.0,
      risk_tolerance: 'moderate',
      rebalance_frequency: 600, // 10 minutes
      enabled: true
    }
  ]

  // Calculate coordination metrics
  const coordinationMetrics = {
    totalAgents: agents.length,
    participatingAgents: agents.filter(a => a.coordination_status === 'participating').length,
    totalCapitalAllocated: agents.reduce((sum, agent) => sum + agent.capital_allocation, 0),
    avgPerformanceScore: agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.performance_score, 0) / agents.length 
      : 0,
    totalRiskContribution: agents.reduce((sum, agent) => sum + agent.risk_contribution, 0),
    leverageSpread: Math.max(...agents.map(a => a.current_leverage)) - Math.min(...agents.map(a => a.current_leverage))
  }

  // Mock coordination optimization
  const optimizeCoordination = async (strategyId: string) => {
    setIsOptimizing(true)
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const strategy = strategies.find(s => s.strategy_id === strategyId)
    if (!strategy) return

    // Generate optimization result
    const optimizedAllocations: Record<string, AgentCoordinationData> = {}
    let totalRisk = 0
    
    agents.forEach(agent => {
      // Calculate recommended leverage based on strategy
      let recommendedLeverage = strategy.target_leverage
      
      // Adjust based on performance
      const performanceMultiplier = (agent.performance_score / 100) * 0.5 + 0.75 // 0.75 - 1.25
      recommendedLeverage *= performanceMultiplier
      
      // Adjust based on risk tolerance
      if (strategy.risk_tolerance === 'conservative') {
        recommendedLeverage *= 0.8
      } else if (strategy.risk_tolerance === 'aggressive') {
        recommendedLeverage *= 1.3
      }
      
      recommendedLeverage = Math.min(20, Math.max(1, recommendedLeverage))
      
      const riskContribution = recommendedLeverage * agent.capital_allocation * 0.01
      totalRisk += riskContribution
      
      optimizedAllocations[agent.agent_id] = {
        ...agent,
        recommended_leverage: recommendedLeverage,
        risk_contribution: riskContribution
      }
    })

    const result: CoordinationResult = {
      total_portfolio_leverage: Object.values(optimizedAllocations).reduce(
        (sum, agent) => sum + (agent.recommended_leverage * agent.capital_allocation), 0
      ) / 100,
      risk_distribution: Object.fromEntries(
        Object.entries(optimizedAllocations).map(([id, agent]) => [
          id, agent.risk_contribution / totalRisk
        ])
      ),
      optimization_score: 85 + Math.random() * 15, // Mock score
      recommendations: [
        `Optimize leverage allocation across ${agents.length} agents`,
        `Target portfolio leverage: ${strategy.target_leverage}x`,
        `Risk tolerance: ${strategy.risk_tolerance}`,
        totalRisk > 50 ? 'Consider reducing overall risk exposure' : 'Risk levels are acceptable'
      ],
      agent_allocations: optimizedAllocations
    }

    setCoordinationResult(result)
    setIsOptimizing(false)
  }

  // Auto-optimization based on strategy
  useEffect(() => {
    if (coordinationEnabled && selectedStrategy) {
      optimizeCoordination(selectedStrategy)
    }
  }, [selectedStrategy, coordinationEnabled])

  const applyOptimization = () => {
    if (!coordinationResult) return
    
    const leverageAllocations = Object.fromEntries(
      Object.entries(coordinationResult.agent_allocations).map(([id, agent]) => [
        id, agent.recommended_leverage
      ])
    )
    
    onCoordinationUpdate(leverageAllocations)
    onStrategyApply(selectedStrategy)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'participating': return 'text-green-600 bg-green-50'
      case 'paused': return 'text-yellow-600 bg-yellow-50'
      case 'excluded': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Agent Leverage Coordination</CardTitle>
                <CardDescription>Intelligent cross-agent leverage optimization</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={coordinationEnabled}
                onCheckedChange={setCoordinationEnabled}
              />
              <Label>Coordination Enabled</Label>
              <Button
                variant="destructive"
                size="sm"
                onClick={onEmergencyStop}
              >
                Emergency Stop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Participating Agents</p>
                <p className="text-xl font-bold text-gray-900">
                  {coordinationMetrics.participatingAgents}/{coordinationMetrics.totalAgents}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className={`text-xl font-bold ${getPerformanceColor(coordinationMetrics.avgPerformanceScore)}`}>
                  {coordinationMetrics.avgPerformanceScore.toFixed(0)}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Leverage Spread</p>
                <p className="text-xl font-bold text-gray-900">
                  {coordinationMetrics.leverageSpread.toFixed(1)}x
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Optimization Score</p>
                <p className="text-xl font-bold text-gray-900">
                  {coordinationResult?.optimization_score.toFixed(0) || '--'}/100
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="strategy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategy">Strategy Selection</TabsTrigger>
          <TabsTrigger value="agents">Agent Allocation</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Results</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strategy) => (
              <Card 
                key={strategy.strategy_id}
                className={`cursor-pointer transition-all ${
                  selectedStrategy === strategy.strategy_id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedStrategy(strategy.strategy_id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {selectedStrategy === strategy.strategy_id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                      <Badge variant={strategy.enabled ? "default" : "secondary"}>
                        {strategy.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target Leverage:</span>
                      <span className="text-sm font-medium">{strategy.target_leverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Risk Tolerance:</span>
                      <Badge variant="outline" className="text-xs">
                        {strategy.risk_tolerance.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rebalance Frequency:</span>
                      <span className="text-sm font-medium">
                        {strategy.rebalance_frequency / 60} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => selectedStrategy && optimizeCoordination(selectedStrategy)}
              disabled={!selectedStrategy || isOptimizing}
              size="lg"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Coordination
                </>
              )}
            </Button>
            
            {coordinationResult && (
              <Button
                variant="outline"
                onClick={applyOptimization}
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Apply Optimization
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.agent_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                    <Badge className={getStatusColor(agent.coordination_status)}>
                      {agent.coordination_status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Current vs Recommended Leverage */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Leverage:</span>
                      <span className="text-sm font-medium">{agent.current_leverage.toFixed(1)}x</span>
                    </div>
                    {coordinationResult?.agent_allocations[agent.agent_id] && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Recommended:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {coordinationResult.agent_allocations[agent.agent_id].recommended_leverage.toFixed(1)}x
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Performance Score */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance Score:</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(agent.performance_score)}`}>
                        {agent.performance_score.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={agent.performance_score} className="h-2" />
                  </div>

                  {/* Capital Allocation */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capital Allocation:</span>
                      <span className="text-sm font-medium">{agent.capital_allocation.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.capital_allocation} className="h-2" />
                  </div>

                  {/* Risk Contribution */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Risk Contribution:</span>
                      <span className="text-sm font-medium">{agent.risk_contribution.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.risk_contribution} className="h-2" />
                  </div>

                  {/* Status Controls */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    
                    {agent.coordination_status === 'participating' ? (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {coordinationResult ? (
            <div className="space-y-6">
              {/* Optimization Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                  <CardDescription>
                    Strategy: {strategies.find(s => s.strategy_id === selectedStrategy)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Portfolio Leverage</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {coordinationResult.total_portfolio_leverage.toFixed(1)}x
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Optimization Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {coordinationResult.optimization_score.toFixed(0)}/100
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Distribution</p>
                      <p className="text-2xl font-bold text-purple-600">
                        Balanced
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Recommendations:</h4>
                    {coordinationResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Preview</CardTitle>
                  <CardDescription>
                    Changes that will be applied to agent leverage settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(coordinationResult.agent_allocations).map(([agentId, allocation]) => {
                      const currentAgent = agents.find(a => a.agent_id === agentId)
                      if (!currentAgent) return null
                      
                      const leverageChange = allocation.recommended_leverage - currentAgent.current_leverage
                      
                      return (
                        <div key={agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{allocation.agent_name}</p>
                            <p className="text-sm text-gray-600">
                              Current: {currentAgent.current_leverage.toFixed(1)}x → 
                              Recommended: {allocation.recommended_leverage.toFixed(1)}x
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {leverageChange > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : leverageChange < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <Activity className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`text-sm font-medium ${
                              leverageChange > 0 ? 'text-green-600' : 
                              leverageChange < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {leverageChange > 0 ? '+' : ''}{leverageChange.toFixed(1)}x
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Optimization Results</h3>
                <p className="text-gray-600 mb-4">
                  Select a strategy and run optimization to see coordination results.
                </p>
                <Button onClick={() => selectedStrategy && optimizeCoordination(selectedStrategy)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Optimization
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Coordination Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Coordination Metrics</CardTitle>
                <CardDescription>Live coordination performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="coordination_score" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Cross-agent risk allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="risk_distribution" 
                      stroke="#EF4444" 
                      fill="#FEE2E2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}