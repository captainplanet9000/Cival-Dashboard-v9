'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain, Database, Activity, Zap, HardDrive, 
  Cpu, RefreshCw, AlertTriangle, TrendingUp, BarChart3,
  Clock, Network, Search, Filter, Eye, Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, subHours } from 'date-fns'

interface MemoryEntry {
  id: string
  agentId: string
  agentName: string
  type: 'observation' | 'decision' | 'learning' | 'pattern' | 'error' | 'success'
  content: string
  importance: number // 0-1 scale
  timestamp: Date
  metadata: {
    symbol?: string
    action?: string
    outcome?: string
    confidence?: number
    tags?: string[]
  }
  relationships: string[] // IDs of related memories
  accessCount: number
  lastAccessed: Date
}

interface MemoryStats {
  totalMemories: number
  memoryUtilization: number // percentage
  averageImportance: number
  memoryTypes: Record<string, number>
  recentActivity: number
  patternMatches: number
  learningEvents: number
  errorCorrections: number
}

interface AgentMemoryProfile {
  agentId: string
  agentName: string
  memoryCapacity: number
  memoryUsed: number
  memoryEfficiency: number
  learningRate: number
  patternRecognition: number
  decisionAccuracy: number
  adaptationSpeed: number
  knowledgeRetention: number
}

export function MemoryAnalyticsDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<'all' | string>('all')
  const [timeFrame, setTimeFrame] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [memoryFilter, setMemoryFilter] = useState<'all' | 'observation' | 'decision' | 'learning' | 'pattern' | 'error' | 'success'>('all')
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null)
  const [agentProfiles, setAgentProfiles] = useState<AgentMemoryProfile[]>([])

  // Generate mock data
  useEffect(() => {
    generateMockData()
  }, [selectedAgent, timeFrame])

  const generateMockData = () => {
    // Generate mock agents
    const mockAgents: AgentMemoryProfile[] = [
      {
        agentId: 'momentum_master',
        agentName: 'Momentum Master',
        memoryCapacity: 10000,
        memoryUsed: 7500,
        memoryEfficiency: 0.92,
        learningRate: 0.87,
        patternRecognition: 0.94,
        decisionAccuracy: 0.78,
        adaptationSpeed: 0.83,
        knowledgeRetention: 0.89
      },
      {
        agentId: 'mean_reversion',
        agentName: 'Mean Reversion Pro',
        memoryCapacity: 8000,
        memoryUsed: 6200,
        memoryEfficiency: 0.88,
        learningRate: 0.91,
        patternRecognition: 0.86,
        decisionAccuracy: 0.82,
        adaptationSpeed: 0.75,
        knowledgeRetention: 0.93
      },
      {
        agentId: 'arbitrage_hunter',
        agentName: 'Arbitrage Hunter',
        memoryCapacity: 12000,
        memoryUsed: 9100,
        memoryEfficiency: 0.95,
        learningRate: 0.79,
        patternRecognition: 0.97,
        decisionAccuracy: 0.91,
        adaptationSpeed: 0.88,
        knowledgeRetention: 0.85
      }
    ]

    // Generate mock memories
    const mockMemories: MemoryEntry[] = []
    const memoryTypes: MemoryEntry['type'][] = ['observation', 'decision', 'learning', 'pattern', 'error', 'success']
    const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL', 'TSLA']
    
    for (let i = 0; i < 200; i++) {
      const agentIndex = Math.floor(Math.random() * mockAgents.length)
      const agent = mockAgents[agentIndex]
      const type = memoryTypes[Math.floor(Math.random() * memoryTypes.length)]
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      
      // Generate timestamp within timeframe
      const hoursBack = getTimeFrameHours(timeFrame)
      const timestamp = subHours(new Date(), Math.random() * hoursBack)
      
      mockMemories.push({
        id: `mem_${i}`,
        agentId: agent.agentId,
        agentName: agent.agentName,
        type,
        content: generateMemoryContent(type, symbol),
        importance: Math.random(),
        timestamp,
        metadata: {
          symbol,
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          outcome: Math.random() > 0.3 ? 'success' : 'failure',
          confidence: Math.random(),
          tags: [`${symbol.split('/')[0]}`, type, 'trading']
        },
        relationships: [], // Would be calculated based on content similarity
        accessCount: Math.floor(Math.random() * 20),
        lastAccessed: subHours(new Date(), Math.random() * 12)
      })
    }

    // Calculate stats
    const stats: MemoryStats = {
      totalMemories: mockMemories.length,
      memoryUtilization: mockAgents.reduce((sum, agent) => sum + (agent.memoryUsed / agent.memoryCapacity), 0) / mockAgents.length * 100,
      averageImportance: mockMemories.reduce((sum, mem) => sum + mem.importance, 0) / mockMemories.length,
      memoryTypes: memoryTypes.reduce((acc, type) => {
        acc[type] = mockMemories.filter(m => m.type === type).length
        return acc
      }, {} as Record<string, number>),
      recentActivity: mockMemories.filter(m => m.timestamp > subHours(new Date(), 1)).length,
      patternMatches: mockMemories.filter(m => m.type === 'pattern').length,
      learningEvents: mockMemories.filter(m => m.type === 'learning').length,
      errorCorrections: mockMemories.filter(m => m.type === 'error').length
    }

    setAgentProfiles(mockAgents)
    setMemories(mockMemories)
    setMemoryStats(stats)
  }

  const getTimeFrameHours = (timeFrame: string): number => {
    switch (timeFrame) {
      case '1h': return 1
      case '6h': return 6
      case '24h': return 24
      case '7d': return 168
      case '30d': return 720
      default: return 24
    }
  }

  const generateMemoryContent = (type: MemoryEntry['type'], symbol: string): string => {
    const contents = {
      observation: [
        `Observed strong momentum in ${symbol} with RSI breaking above 70`,
        `Price action in ${symbol} showing consolidation pattern`,
        `Volume spike detected in ${symbol} at resistance level`
      ],
      decision: [
        `Decided to enter long position in ${symbol} based on trend analysis`,
        `Exited ${symbol} position due to risk management rules`,
        `Held ${symbol} position despite minor volatility`
      ],
      learning: [
        `Learned that ${symbol} tends to reverse at 50% retracement levels`,
        `Updated strategy parameters based on recent ${symbol} performance`,
        `Recognized new pattern correlation between ${symbol} and market sentiment`
      ],
      pattern: [
        `Identified bullish flag pattern in ${symbol} 4-hour chart`,
        `Detected head and shoulders formation in ${symbol}`,
        `Recognized support/resistance flip in ${symbol} at key level`
      ],
      error: [
        `Failed to recognize false breakout in ${symbol}`,
        `Missed stop-loss execution due to gap in ${symbol}`,
        `Overestimated momentum strength in ${symbol} leading to early exit`
      ],
      success: [
        `Successfully predicted ${symbol} breakout with 85% accuracy`,
        `Optimal entry timing in ${symbol} resulted in 3.2% gain`,
        `Risk management prevented major loss during ${symbol} crash`
      ]
    }
    
    const typeContents = contents[type]
    return typeContents[Math.floor(Math.random() * typeContents.length)]
  }

  // Filter memories based on selections
  const filteredMemories = useMemo(() => {
    let filtered = memories

    if (selectedAgent !== 'all') {
      filtered = filtered.filter(m => m.agentId === selectedAgent)
    }

    if (memoryFilter !== 'all') {
      filtered = filtered.filter(m => m.type === memoryFilter)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [memories, selectedAgent, memoryFilter])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    if (!memoryStats) return null

    const agentCount = selectedAgent === 'all' ? agentProfiles.length : 1
    const relevantMemories = filteredMemories

    return {
      ...memoryStats,
      totalMemories: relevantMemories.length,
      averageImportance: relevantMemories.length > 0 
        ? relevantMemories.reduce((sum, mem) => sum + mem.importance, 0) / relevantMemories.length
        : 0,
      recentActivity: relevantMemories.filter(m => m.timestamp > subHours(new Date(), 1)).length
    }
  }, [memoryStats, filteredMemories, selectedAgent, agentProfiles])

  const getMemoryTypeColor = (type: MemoryEntry['type']): string => {
    const colors = {
      observation: 'bg-blue-100 text-blue-800',
      decision: 'bg-green-100 text-green-800',
      learning: 'bg-purple-100 text-purple-800',
      pattern: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800',
      success: 'bg-emerald-100 text-emerald-800'
    }
    return colors[type]
  }

  const getMemoryTypeIcon = (type: MemoryEntry['type']) => {
    const icons = {
      observation: <Eye className="h-4 w-4" />,
      decision: <Brain className="h-4 w-4" />,
      learning: <TrendingUp className="h-4 w-4" />,
      pattern: <BarChart3 className="h-4 w-4" />,
      error: <AlertTriangle className="h-4 w-4" />,
      success: <Zap className="h-4 w-4" />
    }
    return icons[type]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Memory Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor agent memory usage, learning patterns, and knowledge evolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={generateMockData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agentProfiles.map(agent => (
              <SelectItem key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeFrame} onValueChange={(value: any) => setTimeFrame(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="6h">6 Hours</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={memoryFilter} onValueChange={(value: any) => setMemoryFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="observation">Observations</SelectItem>
            <SelectItem value="decision">Decisions</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="pattern">Patterns</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Memory Statistics */}
      {filteredStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.totalMemories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {filteredStats.recentActivity} in last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.memoryUtilization.toFixed(1)}%</div>
              <Progress value={filteredStats.memoryUtilization} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Avg Importance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(filteredStats.averageImportance * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Memory relevance score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Learning Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{filteredStats.learningEvents}</div>
              <p className="text-xs text-muted-foreground">
                Knowledge updates
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="memories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memories">Memory Stream</TabsTrigger>
          <TabsTrigger value="agents">Agent Profiles</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="memories" className="space-y-4">
          {/* Memory Stream */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Stream</CardTitle>
              <CardDescription>
                Real-time view of agent memory formation and access patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredMemories.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Memories Found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters to see memory entries
                    </p>
                  </div>
                ) : (
                  filteredMemories.slice(0, 50).map((memory, index) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getMemoryTypeColor(memory.type)}>
                            <div className="flex items-center gap-1">
                              {getMemoryTypeIcon(memory.type)}
                              {memory.type}
                            </div>
                          </Badge>
                          <Badge variant="outline">{memory.agentName}</Badge>
                          {memory.metadata.symbol && (
                            <Badge variant="secondary">{memory.metadata.symbol}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(memory.timestamp, 'HH:mm:ss')}
                          </span>
                          <span>Importance: {(memory.importance * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{memory.content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {memory.metadata.confidence && (
                            <span>Confidence: {(memory.metadata.confidence * 100).toFixed(0)}%</span>
                          )}
                          <span>Accessed: {memory.accessCount} times</span>
                        </div>
                        {memory.metadata.outcome && (
                          <Badge variant={memory.metadata.outcome === 'success' ? 'default' : 'destructive'}>
                            {memory.metadata.outcome}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          {/* Agent Memory Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentProfiles.map((agent, index) => (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{agent.agentName}</span>
                      <Badge variant={agent.memoryUsed / agent.memoryCapacity > 0.8 ? 'destructive' : 'default'}>
                        {((agent.memoryUsed / agent.memoryCapacity) * 100).toFixed(0)}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {agent.memoryUsed.toLocaleString()} / {agent.memoryCapacity.toLocaleString()} memories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Efficiency</span>
                        <span className="font-mono">{(agent.memoryEfficiency * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.memoryEfficiency * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Learning Rate</span>
                        <span className="font-mono">{(agent.learningRate * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.learningRate * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pattern Recognition</span>
                        <span className="font-mono">{(agent.patternRecognition * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.patternRecognition * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Decision Accuracy</span>
                        <span className="font-mono">{(agent.decisionAccuracy * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.decisionAccuracy * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {/* Pattern Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Memory Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {memoryStats && (
                  <div className="space-y-3">
                    {Object.entries(memoryStats.memoryTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getMemoryTypeIcon(type as MemoryEntry['type'])}
                          <span className="capitalize text-sm font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 ml-4">
                          <Progress 
                            value={(count / memoryStats.totalMemories) * 100} 
                            className="flex-1" 
                          />
                          <span className="text-sm font-mono min-w-12">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Recent Learning</div>
                    <div className="text-xs text-blue-700">
                      Agents have formed {memoryStats?.learningEvents || 0} new knowledge patterns in the last {timeFrame}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800 mb-1">Pattern Recognition</div>
                    <div className="text-xs text-green-700">
                      {memoryStats?.patternMatches || 0} successful pattern matches identified
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-800 mb-1">Error Correction</div>
                    <div className="text-xs text-orange-700">
                      {memoryStats?.errorCorrections || 0} errors identified and learning adjustments made
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-800 mb-1">Memory Efficiency</div>
                    <div className="text-xs text-purple-700">
                      Average memory importance score: {memoryStats ? (memoryStats.averageImportance * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MemoryAnalyticsDashboard