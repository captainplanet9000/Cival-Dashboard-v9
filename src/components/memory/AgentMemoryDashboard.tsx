'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  BarChart3,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react'
import { 
  getSimpleMemoryService, 
  type AgentMemoryNode, 
  type AgentPersonality 
} from '@/lib/memory/simple-agent-memory'

export function AgentMemoryDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [agents, setAgents] = useState<AgentPersonality[]>([])
  const [memories, setMemories] = useState<AgentMemoryNode[]>([])
  const [memoryStats, setMemoryStats] = useState<any>(null)
  const [decisionSimulation, setDecisionSimulation] = useState<any>(null)

  const memoryService = getSimpleMemoryService()

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      loadAgentData()
    }
  }, [selectedAgent])

  const loadAgents = () => {
    const allAgents = memoryService.getAllAgents()
    setAgents(allAgents)
    if (allAgents.length > 0 && !selectedAgent) {
      setSelectedAgent(allAgents[0].agentId)
    }
  }

  const loadAgentData = () => {
    if (!selectedAgent) return

    const agentMemories = memoryService.retrieveMemories(selectedAgent, undefined, undefined, 20)
    const stats = memoryService.getMemoryStats(selectedAgent)
    
    setMemories(agentMemories)
    setMemoryStats(stats)
  }

  const simulateDecision = () => {
    if (!selectedAgent) return

    // Mock market data for simulation
    const mockMarketData = {
      symbol: 'BTC/USD',
      price: 45000 + (Math.random() - 0.5) * 2000,
      changePercent24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000000
    }

    const decision = memoryService.simulateAgentDecision(selectedAgent, 'BTC/USD', mockMarketData)
    setDecisionSimulation({ ...decision, marketData: mockMarketData })
  }

  const getMemoryTypeIcon = (type: AgentMemoryNode['type']) => {
    switch (type) {
      case 'trade_decision': return <Target className="w-4 h-4" />
      case 'market_insight': return <Lightbulb className="w-4 h-4" />
      case 'strategy_learning': return <Brain className="w-4 h-4" />
      case 'risk_observation': return <Shield className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getMemoryTypeColor = (type: AgentMemoryNode['type']) => {
    switch (type) {
      case 'trade_decision': return 'bg-blue-100 text-blue-800'
      case 'market_insight': return 'bg-yellow-100 text-yellow-800'
      case 'strategy_learning': return 'bg-purple-100 text-purple-800'
      case 'risk_observation': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatImportance = (importance: number) => {
    if (importance >= 0.8) return { level: 'High', color: 'text-red-600' }
    if (importance >= 0.6) return { level: 'Medium', color: 'text-yellow-600' }
    return { level: 'Low', color: 'text-green-600' }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Memory Dashboard</h1>
          <p className="text-muted-foreground">AI agent memory and learning system</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Brain className="w-4 h-4 mr-1" />
          Memory Active
        </Badge>
      </div>

      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.agentId} value={agent.agentId}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={simulateDecision} disabled={!selectedAgent}>
              <Zap className="w-4 h-4 mr-2" />
              Simulate Decision
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Overview */}
      {selectedAgent && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryStats?.totalMemories || 0}</div>
              <p className="text-xs text-muted-foreground">Stored experiences</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((agents.find(a => a.agentId === selectedAgent)?.tradingHistory.successRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Trading accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryStats?.averageImportance || 0}</div>
              <p className="text-xs text-muted-foreground">Memory relevance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryStats?.recentActivity || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="memories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memories">Memory Timeline</TabsTrigger>
          <TabsTrigger value="personality">Agent Profile</TabsTrigger>
          <TabsTrigger value="simulation">Decision Simulation</TabsTrigger>
          <TabsTrigger value="analytics">Memory Analytics</TabsTrigger>
        </TabsList>

        {/* Memory Timeline */}
        <TabsContent value="memories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Memory Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memories.map(memory => (
                  <div key={memory.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getMemoryTypeIcon(memory.type)}
                        <Badge className={getMemoryTypeColor(memory.type)}>
                          {memory.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={formatImportance(memory.importance).color}>
                          {formatImportance(memory.importance).level}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {memory.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm mb-3">{memory.content}</p>
                    {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        <strong>Context:</strong> {' '}
                        {Object.entries(memory.metadata)
                          .filter(([_, value]) => value !== undefined)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' • ')}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Accessed {memory.accessCount} times
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Personality */}
        <TabsContent value="personality">
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Personality Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const agent = agents.find(a => a.agentId === selectedAgent)
                  if (!agent) return null
                  
                  return (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Trading Characteristics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Risk Tolerance:</span>
                            <Badge className="ml-2" variant={
                              agent.riskTolerance === 'aggressive' ? 'destructive' :
                              agent.riskTolerance === 'conservative' ? 'default' : 'secondary'
                            }>
                              {agent.riskTolerance}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Learning Style:</span>
                            <Badge className="ml-2" variant="outline">
                              {agent.learningStyle.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Preferred Strategies</h3>
                        <div className="flex flex-wrap gap-2">
                          {agent.preferredStrategies.map(strategy => (
                            <Badge key={strategy} variant="secondary">
                              {strategy.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Trading History</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Total Trades:</span>
                            <span className="ml-2 font-medium">{agent.tradingHistory.totalTrades}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Success Rate:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {(agent.tradingHistory.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Avg P&L:</span>
                            <span className={`ml-2 font-medium ${agent.tradingHistory.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${agent.tradingHistory.avgProfitLoss.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Best Strategy:</span>
                            <Badge className="ml-2" variant="default">
                              {agent.tradingHistory.bestStrategy}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Memory Configuration</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Max Memories:</span>
                            <span className="ml-2 font-medium">{agent.memoryPreferences.maxMemoryNodes}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Importance Threshold:</span>
                            <span className="ml-2 font-medium">{agent.memoryPreferences.importanceThreshold}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Retention Days:</span>
                            <span className="ml-2 font-medium">{agent.memoryPreferences.forgetAfterDays}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decision Simulation */}
        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle>Decision Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {decisionSimulation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Market Context</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <div>Symbol: {decisionSimulation.marketData.symbol}</div>
                        <div>Price: ${decisionSimulation.marketData.price.toFixed(2)}</div>
                        <div className={`${decisionSimulation.marketData.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          24h Change: {decisionSimulation.marketData.changePercent24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Decision Output</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <span>Decision:</span>
                          <Badge variant={
                            decisionSimulation.decision === 'buy' ? 'default' :
                            decisionSimulation.decision === 'sell' ? 'destructive' : 'secondary'
                          }>
                            {decisionSimulation.decision.toUpperCase()}
                          </Badge>
                        </div>
                        <div>Confidence: {(decisionSimulation.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Reasoning</h3>
                    <p className="text-sm bg-blue-50 p-3 rounded">{decisionSimulation.reasoning}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Memory Influence ({decisionSimulation.memoryInfluence.length} memories)</h3>
                    <div className="space-y-2">
                      {decisionSimulation.memoryInfluence.slice(0, 3).map((memory: AgentMemoryNode) => (
                        <div key={memory.id} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            {getMemoryTypeIcon(memory.type)}
                            <Badge size="sm" className={getMemoryTypeColor(memory.type)}>
                              {memory.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p>{memory.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Click "Simulate Decision" to see how the agent would make a trading decision</p>
                  <Button onClick={simulateDecision} disabled={!selectedAgent}>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Simulation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Memory Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {memoryStats && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Memory Type Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(memoryStats.typeDistribution).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{type.replace('_', ' ')}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Memory Utilization</h3>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${(memoryStats.memoryUtilization * 100).toFixed(1)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(memoryStats.memoryUtilization * 100).toFixed(1)}% of memory capacity used
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}