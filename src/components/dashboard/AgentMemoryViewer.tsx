'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  Clock,
  Lightbulb,
  Zap,
  Eye,
  BookOpen,
  ChevronRight,
  Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { redisAgentService } from '@/lib/redis/redis-agent-service'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'

interface PatternMemory {
  type: string
  pattern: string
  success_rate: number
  occurrences: number
  avg_return: number
  confidence: number
  market_conditions: string[]
  timeframes: string[]
  last_occurrence: string
}

interface LearningProgress {
  category: string
  progress: number
  insights_gained: number
  patterns_identified: number
  adaptations_made: number
  improvement_rate: number
}

interface AdaptiveParameter {
  name: string
  current_value: number
  initial_value: number
  optimization_history: Array<{
    timestamp: string
    value: number
    performance_impact: number
    reason: string
  }>
  effectiveness_score: number
}

interface AgentMemoryData {
  patterns: PatternMemory[]
  learning_progress: LearningProgress[]
  adaptive_parameters: AdaptiveParameter[]
  key_insights: Array<{
    insight: string
    importance: number
    timestamp: string
    impact: string
  }>
  strategy_evolution: Array<{
    timestamp: string
    change: string
    reason: string
    performance_before: number
    performance_after: number
  }>
}

interface AgentMemoryViewerProps {
  agentId?: string
  className?: string
}

export function AgentMemoryViewer({ agentId, className }: AgentMemoryViewerProps) {
  const [memoryData, setMemoryData] = useState<AgentMemoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string>(agentId || '')
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      loadAgentMemory(selectedAgent)
    }
  }, [selectedAgent])

  const loadAgents = async () => {
    try {
      const allAgents = await agentLifecycleManager.getAllAgents()
      setAgents(allAgents)
      
      if (!selectedAgent && allAgents.length > 0) {
        setSelectedAgent(allAgents[0].id)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      loadMockData()
    }
  }

  const loadAgentMemory = async (agentId: string) => {
    try {
      setLoading(true)
      
      // Get memory from Redis
      const memory = await redisAgentService.getMemory(agentId)
      
      if (memory) {
        setMemoryData(memory)
      } else {
        loadMockData()
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading agent memory:', error)
      loadMockData()
    }
  }

  const loadMockData = () => {
    const mockData: AgentMemoryData = {
      patterns: [
        {
          type: 'Darvas Box Breakout',
          pattern: 'Strong volume + price consolidation → breakout',
          success_rate: 0.89,
          occurrences: 47,
          avg_return: 0.038,
          confidence: 0.92,
          market_conditions: ['trending', 'moderate_volatility'],
          timeframes: ['4H', '1D'],
          last_occurrence: new Date(Date.now() - 3600000).toISOString()
        },
        {
          type: 'Williams Alligator Convergence',
          pattern: 'Jaw/Teeth/Lips convergence + momentum shift',
          success_rate: 0.76,
          occurrences: 32,
          avg_return: 0.024,
          confidence: 0.84,
          market_conditions: ['ranging', 'low_volatility'],
          timeframes: ['1H', '4H'],
          last_occurrence: new Date(Date.now() - 7200000).toISOString()
        },
        {
          type: 'False Breakout Recognition',
          pattern: 'High volume spike + immediate reversal',
          success_rate: 0.82,
          occurrences: 23,
          avg_return: -0.012,
          confidence: 0.78,
          market_conditions: ['high_volatility', 'news_events'],
          timeframes: ['15m', '1H'],
          last_occurrence: new Date(Date.now() - 10800000).toISOString()
        }
      ],
      learning_progress: [
        {
          category: 'Pattern Recognition',
          progress: 87,
          insights_gained: 142,
          patterns_identified: 47,
          adaptations_made: 23,
          improvement_rate: 0.15
        },
        {
          category: 'Risk Management',
          progress: 92,
          insights_gained: 98,
          patterns_identified: 31,
          adaptations_made: 18,
          improvement_rate: 0.12
        },
        {
          category: 'Market Timing',
          progress: 78,
          insights_gained: 76,
          patterns_identified: 25,
          adaptations_made: 15,
          improvement_rate: 0.18
        },
        {
          category: 'Position Sizing',
          progress: 85,
          insights_gained: 54,
          patterns_identified: 19,
          adaptations_made: 12,
          improvement_rate: 0.09
        }
      ],
      adaptive_parameters: [
        {
          name: 'Stop Loss Distance',
          current_value: 0.025,
          initial_value: 0.02,
          optimization_history: [
            {
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              value: 0.025,
              performance_impact: 0.08,
              reason: 'Reduced false stops in volatile conditions'
            },
            {
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              value: 0.022,
              performance_impact: 0.03,
              reason: 'Market volatility increased'
            }
          ],
          effectiveness_score: 0.85
        },
        {
          name: 'Position Size Multiplier',
          current_value: 1.2,
          initial_value: 1.0,
          optimization_history: [
            {
              timestamp: new Date(Date.now() - 43200000).toISOString(),
              value: 1.2,
              performance_impact: 0.12,
              reason: 'High confidence pattern detected'
            }
          ],
          effectiveness_score: 0.91
        },
        {
          name: 'Entry Confirmation Threshold',
          current_value: 0.78,
          initial_value: 0.75,
          optimization_history: [
            {
              timestamp: new Date(Date.now() - 129600000).toISOString(),
              value: 0.78,
              performance_impact: 0.06,
              reason: 'Reduced false signals'
            }
          ],
          effectiveness_score: 0.82
        }
      ],
      key_insights: [
        {
          insight: 'Darvas Box patterns work best during trending markets with moderate volatility',
          importance: 0.95,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          impact: 'Increased win rate by 12%'
        },
        {
          insight: 'Morning breakouts (8-10 AM EST) have 23% higher success rates',
          importance: 0.87,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          impact: 'Optimized trading schedule'
        },
        {
          insight: 'Volume must exceed 2.1x average for reliable breakout confirmation',
          importance: 0.83,
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          impact: 'Reduced false signals by 31%'
        }
      ],
      strategy_evolution: [
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          change: 'Added volume confirmation to Darvas Box entry criteria',
          reason: 'Noticed 34% more false breakouts during low volume periods',
          performance_before: 0.72,
          performance_after: 0.89
        },
        {
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          change: 'Implemented dynamic stop-loss based on volatility',
          reason: 'Fixed stops were too tight during volatile market conditions',
          performance_before: 0.68,
          performance_after: 0.76
        }
      ]
    }
    
    setMemoryData(mockData)
    setLoading(false)
  }

  const exportMemoryData = () => {
    if (!memoryData) return
    
    const dataStr = JSON.stringify(memoryData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agent-memory-${selectedAgent}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Memory & Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading agent memory data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Memory & Learning Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <Button
              onClick={exportMemoryData}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patterns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4" />
              <h3 className="font-semibold">Recognized Patterns</h3>
              <Badge variant="secondary">{memoryData?.patterns.length || 0} patterns</Badge>
            </div>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {memoryData?.patterns.map((pattern, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{pattern.type}</h4>
                        <p className="text-sm text-muted-foreground">{pattern.pattern}</p>
                      </div>
                      <Badge variant={pattern.success_rate > 0.8 ? 'default' : 'secondary'}>
                        {(pattern.success_rate * 100).toFixed(0)}% success
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Occurrences:</span>
                        <div className="font-medium">{pattern.occurrences}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Return:</span>
                        <div className={`font-medium ${pattern.avg_return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(pattern.avg_return * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="font-medium">{(pattern.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Market Conditions:</span>
                        <div className="flex gap-1">
                          {pattern.market_conditions.map(condition => (
                            <Badge key={condition} variant="outline" className="text-xs">
                              {condition.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Timeframes:</span>
                        <div className="flex gap-1">
                          {pattern.timeframes.map(timeframe => (
                            <Badge key={timeframe} variant="outline" className="text-xs">
                              {timeframe}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4" />
              <h3 className="font-semibold">Learning Progress</h3>
            </div>
            
            <div className="space-y-6">
              {memoryData?.learning_progress.map((progress, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{progress.category}</h4>
                    <Badge variant="outline">{progress.progress}% complete</Badge>
                  </div>
                  
                  <Progress value={progress.progress} className="h-2" />
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{progress.insights_gained}</div>
                      <div className="text-muted-foreground">Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{progress.patterns_identified}</div>
                      <div className="text-muted-foreground">Patterns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{progress.adaptations_made}</div>
                      <div className="text-muted-foreground">Adaptations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        +{(progress.improvement_rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">Improvement</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4" />
              <h3 className="font-semibold">Adaptive Parameters</h3>
            </div>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {memoryData?.adaptive_parameters.map((param, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{param.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Effectiveness: {(param.effectiveness_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Value:</span>
                        <div className="font-medium text-lg">{param.current_value}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Initial Value:</span>
                        <div className="font-medium text-lg text-muted-foreground">{param.initial_value}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Optimization History</h5>
                      <div className="space-y-2">
                        {param.optimization_history.slice(0, 3).map((change, changeIndex) => (
                          <div key={changeIndex} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                            <div>
                              <div className="font-medium">{change.value} ({change.reason})</div>
                              <div className="text-muted-foreground">
                                {new Date(change.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge 
                              variant={change.performance_impact > 0 ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {change.performance_impact > 0 ? '+' : ''}{(change.performance_impact * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4" />
              <h3 className="font-semibold">Key Insights</h3>
            </div>
            
            <div className="space-y-3">
              {memoryData?.key_insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{insight.insight}</p>
                    <Badge variant="outline">
                      {(insight.importance * 100).toFixed(0)}% importance
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Impact: {insight.impact}</span>
                    <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              <h3 className="font-semibold">Strategy Evolution</h3>
            </div>
            
            <div className="space-y-4">
              {memoryData?.strategy_evolution.map((evolution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(evolution.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-medium">{evolution.change}</h4>
                  <p className="text-sm text-muted-foreground">{evolution.reason}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Before:</span>
                      <span className="ml-1 font-medium">{(evolution.performance_before * 100).toFixed(0)}%</span>
                    </div>
                    <div>→</div>
                    <div>
                      <span className="text-muted-foreground">After:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {(evolution.performance_after * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Badge variant="default" className="ml-auto">
                      +{((evolution.performance_after - evolution.performance_before) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AgentMemoryViewer