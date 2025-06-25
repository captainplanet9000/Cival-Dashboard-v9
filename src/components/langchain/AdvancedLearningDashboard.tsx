/**
 * Advanced Learning Dashboard
 * Phase 8: Comprehensive dashboard for agent memory, learning, and strategy evolution
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target,
  BookOpen,
  Lightbulb,
  Network,
  GitBranch,
  Clock,
  Award,
  RefreshCw,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import services
import { agentMemorySystem, type MemoryEntry, type LearningPattern, type StrategyEvolution } from '@/lib/langchain/AgentMemorySystem'
import { advancedLearningCoordinator, type LearningGoal, type CollectiveLearning } from '@/lib/langchain/AdvancedLearningCoordinator'

interface AdvancedLearningDashboardProps {
  className?: string
}

export function AdvancedLearningDashboard({ className }: AdvancedLearningDashboardProps) {
  const [memoryStats, setMemoryStats] = useState<any>(null)
  const [learningStats, setLearningStats] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [agentMemories, setAgentMemories] = useState<MemoryEntry[]>([])
  const [agentPatterns, setAgentPatterns] = useState<LearningPattern[]>([])
  const [strategyEvolutions, setStrategyEvolutions] = useState<StrategyEvolution[]>([])
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([])
  const [collectiveLearnings, setCollectiveLearnings] = useState<CollectiveLearning[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock agent list (in real implementation, get from orchestrator)
  const agents = ['momentum_agent', 'mean_reversion_agent', 'risk_manager', 'sentiment_agent', 'arbitrage_agent']

  /**
   * Load dashboard data
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Get memory statistics
      const memStats = agentMemorySystem.getMemoryStats()
      setMemoryStats(memStats)

      // Get learning statistics
      const learnStats = advancedLearningCoordinator.getLearningStats()
      setLearningStats(learnStats)

      // Get agent-specific data if agent is selected
      if (selectedAgent) {
        const memories = await agentMemorySystem.retrieveMemories(selectedAgent, undefined, undefined, 20)
        const patterns = agentMemorySystem.getLearningPatterns(selectedAgent)
        const evolutions = agentMemorySystem.getStrategyEvolutions(selectedAgent)
        
        setAgentMemories(memories)
        setAgentPatterns(patterns)
        setStrategyEvolutions(evolutions)
      }

      // Mock collective learnings and goals (in real implementation, get from coordinator)
      setCollectiveLearnings([
        {
          id: 'cl1',
          type: 'market_pattern',
          pattern: 'High volatility correlation with news events',
          contributingAgents: ['sentiment_agent', 'momentum_agent'],
          confidence: 0.85,
          effectiveness: 0.78,
          validationCount: 5,
          timestamp: Date.now() - 3600000,
          sharedKnowledge: { pattern_type: 'volatility', confidence: 0.85 }
        },
        {
          id: 'cl2',
          type: 'risk_pattern',
          pattern: 'Weekend trading shows increased risk',
          contributingAgents: ['risk_manager', 'mean_reversion_agent'],
          confidence: 0.92,
          effectiveness: 0.84,
          validationCount: 8,
          timestamp: Date.now() - 7200000,
          sharedKnowledge: { timing: 'weekend', risk_factor: 1.3 }
        }
      ])

      setLearningGoals([
        {
          id: 'goal1',
          agentId: selectedAgent || 'momentum_agent',
          goalType: 'improve_accuracy',
          target: 85,
          currentValue: 78,
          progress: 91.8,
          deadline: Date.now() + 86400000,
          strategies: ['momentum_signals', 'risk_management'],
          adaptations: ['threshold_adjustment']
        },
        {
          id: 'goal2',
          agentId: selectedAgent || 'risk_manager',
          goalType: 'reduce_risk',
          target: 5,
          currentValue: 7.2,
          progress: 72,
          deadline: Date.now() + 172800000,
          strategies: ['position_sizing', 'stop_losses'],
          adaptations: ['dynamic_sizing']
        }
      ])

    } catch (error) {
      console.error('Failed to load learning dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgent])

  /**
   * Auto-refresh data
   */
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  /**
   * Format memory type
   */
  const formatMemoryType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Get memory type color
   */
  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'decision': return 'bg-blue-100 text-blue-800'
      case 'outcome': return 'bg-green-100 text-green-800'
      case 'market_condition': return 'bg-purple-100 text-purple-800'
      case 'strategy_adjustment': return 'bg-orange-100 text-orange-800'
      case 'interaction': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  /**
   * Get pattern type color
   */
  const getPatternTypeColor = (type: string) => {
    switch (type) {
      case 'success_pattern': return 'text-green-600'
      case 'failure_pattern': return 'text-red-600'
      case 'market_pattern': return 'text-blue-600'
      case 'strategy_pattern': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  /**
   * Get goal type icon
   */
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'improve_accuracy': return <Target className="h-4 w-4" />
      case 'reduce_risk': return <AlertCircle className="h-4 w-4" />
      case 'increase_profit': return <TrendingUp className="h-4 w-4" />
      case 'enhance_speed': return <Clock className="h-4 w-4" />
      case 'learn_pattern': return <Brain className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-500" />
            Advanced Learning System
          </h1>
          <p className="text-gray-600 mt-1">
            Agent memory, collective learning, and strategy evolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent} value={agent}>
                  {agent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {memoryStats && learningStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{memoryStats.totalMemories}</div>
                  <div className="text-sm text-gray-500">Total Memories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{memoryStats.totalPatterns}</div>
                  <div className="text-sm text-gray-500">Learning Patterns</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{learningStats.activeGoals}</div>
                  <div className="text-sm text-gray-500">Active Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Share2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{learningStats.collectiveLearnings}</div>
                  <div className="text-sm text-gray-500">Shared Knowledge</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="collective">Collective</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Memory Distribution */}
            {memoryStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Memory Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(memoryStats.memoryByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{formatMemoryType(type)}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getMemoryTypeColor(type)}>{count}</Badge>
                          <div className="w-20">
                            <Progress 
                              value={(count as number / memoryStats.totalMemories) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Goals</span>
                    <span className="font-bold">{learningStats?.activeGoals || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Achieved Goals</span>
                    <span className="font-bold text-green-600">{learningStats?.achievedGoals || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Collaborations</span>
                    <span className="font-bold">{learningStats?.collaborations || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Graph Size</span>
                    <span className="font-bold">{learningStats?.knowledgeGraphSize || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Recent Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {learningGoals.slice(0, 5).map((goal) => (
                      <div key={goal.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getGoalIcon(goal.goalType)}
                            <span className="font-medium text-sm">
                              {goal.goalType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <Badge variant={goal.progress >= 100 ? 'default' : 'secondary'}>
                            {goal.progress.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2 mb-2" />
                        <div className="text-xs text-gray-500">
                          Target: {goal.target} | Current: {goal.currentValue}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Collective Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Collective Knowledge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {collectiveLearnings.map((learning) => (
                      <div key={learning.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{learning.type.replace('_', ' ')}</Badge>
                          <div className="text-sm text-gray-500">
                            {learning.contributingAgents.length} agents
                          </div>
                        </div>
                        <div className="text-sm font-medium mb-1">{learning.pattern}</div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Confidence: {(learning.confidence * 100).toFixed(0)}%</span>
                          <span>Effectiveness: {(learning.effectiveness * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Memories Tab */}
        <TabsContent value="memories" className="space-y-6">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle>Agent Memories: {selectedAgent}</CardTitle>
                <CardDescription>
                  Showing {agentMemories.length} memories for this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {agentMemories.map((memory) => (
                      <div key={memory.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getMemoryTypeColor(memory.type)}>
                            {formatMemoryType(memory.type)}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            Importance: {(memory.importance * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-sm font-medium mb-2">{memory.content}</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Retrieved: {memory.retrieved} times</div>
                          <div>Created: {new Date(memory.timestamp).toLocaleString()}</div>
                          <div className="flex gap-1 flex-wrap">
                            {memory.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select an agent to view memories
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle>Learning Patterns: {selectedAgent}</CardTitle>
                <CardDescription>
                  Showing {agentPatterns.length} patterns learned by this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {agentPatterns.map((pattern) => (
                      <div key={pattern.patternId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={getPatternTypeColor(pattern.type)}>
                            {pattern.type.replace('_', ' ')}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            Confidence: {(pattern.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-sm font-medium mb-2">{pattern.pattern}</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Occurrences: {pattern.occurrences}</div>
                          <div>Effectiveness: {(pattern.effectiveness * 100).toFixed(0)}%</div>
                          <div>Last seen: {new Date(pattern.lastSeen).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select an agent to view learning patterns
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Learning Goals
              </CardTitle>
              <CardDescription>
                Track progress towards learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningGoals.map((goal) => (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getGoalIcon(goal.goalType)}
                        <span className="font-medium">
                          {goal.goalType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <Badge variant={goal.progress >= 100 ? 'default' : 'secondary'}>
                        {goal.progress >= 100 ? 'Achieved' : `${goal.progress.toFixed(0)}%`}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={goal.progress} className="h-3" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Target: {goal.target}</div>
                        <div>Current: {goal.currentValue}</div>
                        <div>Agent: {goal.agentId}</div>
                        <div>Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium">Strategies:</div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {goal.strategies.map(strategy => (
                            <Badge key={strategy} variant="outline" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collective Learning Tab */}
        <TabsContent value="collective" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Collective Learning
              </CardTitle>
              <CardDescription>
                Knowledge shared across multiple agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectiveLearnings.map((learning) => (
                  <div key={learning.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">
                        {learning.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {learning.contributingAgents.length} contributing agents
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium mb-2">{learning.pattern}</div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Confidence</div>
                        <div className="font-medium">{(learning.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Effectiveness</div>
                        <div className="font-medium">{(learning.effectiveness * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Validations</div>
                        <div className="font-medium">{learning.validationCount}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium">Contributing Agents:</div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {learning.contributingAgents.map(agent => (
                          <Badge key={agent} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Evolution Tab */}
        <TabsContent value="evolution" className="space-y-6">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-blue-500" />
                  Strategy Evolution: {selectedAgent}
                </CardTitle>
                <CardDescription>
                  Track how strategies have evolved over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {strategyEvolutions.map((evolution) => (
                      <div key={evolution.evolutionId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={evolution.validated ? 'default' : 'secondary'}>
                            {evolution.validated ? 'Validated' : 'Pending'}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {new Date(evolution.timestamp).toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium mb-2">{evolution.evolutionReason}</div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Performance Improvement: {evolution.performanceImprovement > 0 ? '+' : ''}{(evolution.performanceImprovement * 100).toFixed(1)}%
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium mb-1">Original Strategy:</div>
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              {JSON.stringify(evolution.originalStrategy, null, 2).slice(0, 100)}...
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Evolved Strategy:</div>
                            <div className="bg-blue-50 p-2 rounded text-xs">
                              {JSON.stringify(evolution.evolvedStrategy, null, 2).slice(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select an agent to view strategy evolution
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedLearningDashboard