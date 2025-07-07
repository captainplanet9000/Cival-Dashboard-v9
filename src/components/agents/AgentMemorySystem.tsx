'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain, Database, Search, TrendingUp, TrendingDown, Zap,
  Clock, Target, BarChart3, Activity, Settings, Layers,
  CheckCircle2, AlertTriangle, RefreshCw, Archive
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Agent Memory System Component
 * Implements sophisticated pattern recognition and learning capabilities for AI agents
 * Stores and analyzes trading experiences to improve future decision-making
 */

interface MemoryPattern {
  id: string
  patternType: 'market_condition' | 'trading_signal' | 'risk_event' | 'performance_anomaly'
  description: string
  frequency: number
  accuracy: number
  profitability: number
  conditions: MarketCondition[]
  outcomes: TradeOutcome[]
  confidence: number
  lastSeen: Date
  agentId?: string
}

interface MarketCondition {
  indicator: string
  value: number
  threshold: number
  direction: 'above' | 'below' | 'between'
  timeframe: string
}

interface TradeOutcome {
  action: 'BUY' | 'SELL' | 'HOLD'
  price: number
  quantity: number
  timestamp: Date
  pnl: number
  duration: number
  success: boolean
}

interface MemoryEntry {
  id: string
  agentId: string
  eventType: 'trade_execution' | 'market_analysis' | 'risk_assessment' | 'strategy_adjustment'
  timestamp: Date
  marketConditions: MarketCondition[]
  decision: string
  outcome: TradeOutcome
  learningValue: number
  emotionalState?: 'confident' | 'cautious' | 'aggressive' | 'defensive'
  contextData: any
}

interface LearningMetrics {
  totalMemories: number
  patternsIdentified: number
  accuracyImprovement: number
  experienceLevel: number
  adaptabilityScore: number
  memoryRetention: number
  patternRecognitionRate: number
}

interface AgentMemorySystemProps {
  agentId?: string
  onPatternRecognized?: (pattern: MemoryPattern) => void
  onMemoryStored?: (memory: MemoryEntry) => void
  onLearningUpdate?: (metrics: LearningMetrics) => void
  isActive?: boolean
  className?: string
}

export function AgentMemorySystem({
  agentId = 'agent-001',
  onPatternRecognized,
  onMemoryStored,
  onLearningUpdate,
  isActive = true,
  className
}: AgentMemorySystemProps) {
  const [memorySystem, setMemorySystem] = useState({
    enabled: isActive,
    maxMemories: 10000,
    patternThreshold: 0.75, // 75% confidence threshold for pattern recognition
    learningRate: 0.01, // How quickly the agent learns from new experiences
    memoryDecay: 0.95, // How memories fade over time
    contextWindow: 100, // Number of recent memories to analyze for patterns
    adaptiveThreshold: true, // Adjust thresholds based on performance
    realTimeAnalysis: true
  })

  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [patterns, setPatterns] = useState<MemoryPattern[]>([])
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    totalMemories: 0,
    patternsIdentified: 0,
    accuracyImprovement: 0,
    experienceLevel: 0,
    adaptabilityScore: 0,
    memoryRetention: 0,
    patternRecognitionRate: 0
  })

  const [selectedPattern, setSelectedPattern] = useState<MemoryPattern | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Generate mock memory data for demonstration
  const generateMockMemories = () => {
    const mockMemories: MemoryEntry[] = []
    const eventTypes = ['trade_execution', 'market_analysis', 'risk_assessment', 'strategy_adjustment'] as const
    const emotionalStates = ['confident', 'cautious', 'aggressive', 'defensive'] as const
    
    for (let i = 0; i < 200; i++) {
      const timestamp = new Date(Date.now() - i * 2 * 60 * 60 * 1000) // Every 2 hours
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const success = Math.random() > 0.35 // 65% success rate
      const pnl = success ? Math.random() * 1000 + 100 : -(Math.random() * 500 + 50)
      
      mockMemories.push({
        id: `memory-${i}`,
        agentId,
        eventType,
        timestamp,
        marketConditions: [
          {
            indicator: 'RSI',
            value: 30 + Math.random() * 40,
            threshold: 70,
            direction: 'below',
            timeframe: '1h'
          },
          {
            indicator: 'Volume',
            value: 1000000 + Math.random() * 2000000,
            threshold: 1500000,
            direction: 'above',
            timeframe: '15m'
          }
        ],
        decision: `${eventType.replace('_', ' ')} based on market conditions`,
        outcome: {
          action: Math.random() > 0.5 ? 'BUY' : 'SELL',
          price: 45000 + (Math.random() - 0.5) * 10000,
          quantity: Math.random() * 0.1 + 0.01,
          timestamp,
          pnl,
          duration: Math.random() * 24 * 60 * 60 * 1000, // Duration in milliseconds
          success
        },
        learningValue: success ? Math.random() * 0.1 + 0.05 : Math.random() * 0.05,
        emotionalState: emotionalStates[Math.floor(Math.random() * emotionalStates.length)],
        contextData: {
          marketPhase: Math.random() > 0.5 ? 'trending' : 'ranging',
          volatility: Math.random() * 0.05 + 0.01,
          sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish'
        }
      })
    }
    
    return mockMemories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Pattern recognition algorithm
  const recognizePatterns = useMemo(() => {
    if (memories.length < 10) return []

    const recognizedPatterns: MemoryPattern[] = []
    const recentMemories = memories.slice(0, memorySystem.contextWindow)

    // Pattern 1: Market Condition Patterns
    const marketConditionPatterns = new Map<string, MemoryEntry[]>()
    recentMemories.forEach(memory => {
      memory.marketConditions.forEach(condition => {
        const key = `${condition.indicator}_${condition.direction}_${condition.timeframe}`
        if (!marketConditionPatterns.has(key)) {
          marketConditionPatterns.set(key, [])
        }
        marketConditionPatterns.get(key)!.push(memory)
      })
    })

    marketConditionPatterns.forEach((memoryGroup, conditionKey) => {
      if (memoryGroup.length >= 5) { // Minimum occurrences for pattern
        const successfulTrades = memoryGroup.filter(m => m.outcome.success)
        const accuracy = successfulTrades.length / memoryGroup.length
        const avgPnL = memoryGroup.reduce((acc, m) => acc + m.outcome.pnl, 0) / memoryGroup.length
        
        if (accuracy >= memorySystem.patternThreshold) {
          recognizedPatterns.push({
            id: `pattern-${conditionKey}-${Date.now()}`,
            patternType: 'market_condition',
            description: `High success rate when ${conditionKey.replace(/_/g, ' ')}`,
            frequency: memoryGroup.length,
            accuracy,
            profitability: avgPnL,
            conditions: memoryGroup[0].marketConditions,
            outcomes: memoryGroup.map(m => m.outcome),
            confidence: Math.min(95, accuracy * 100),
            lastSeen: memoryGroup[0].timestamp,
            agentId
          })
        }
      }
    })

    // Pattern 2: Trading Signal Patterns
    const signalPatterns = new Map<string, MemoryEntry[]>()
    recentMemories.forEach(memory => {
      if (memory.eventType === 'trade_execution') {
        const key = `${memory.outcome.action}_${memory.emotionalState}`
        if (!signalPatterns.has(key)) {
          signalPatterns.set(key, [])
        }
        signalPatterns.get(key)!.push(memory)
      }
    })

    signalPatterns.forEach((memoryGroup, signalKey) => {
      if (memoryGroup.length >= 3) {
        const successfulTrades = memoryGroup.filter(m => m.outcome.success)
        const accuracy = successfulTrades.length / memoryGroup.length
        const avgPnL = memoryGroup.reduce((acc, m) => acc + m.outcome.pnl, 0) / memoryGroup.length
        
        if (accuracy >= memorySystem.patternThreshold) {
          recognizedPatterns.push({
            id: `pattern-${signalKey}-${Date.now()}`,
            patternType: 'trading_signal',
            description: `Effective ${signalKey.replace('_', ' ')} trading pattern`,
            frequency: memoryGroup.length,
            accuracy,
            profitability: avgPnL,
            conditions: [],
            outcomes: memoryGroup.map(m => m.outcome),
            confidence: Math.min(95, accuracy * 100),
            lastSeen: memoryGroup[0].timestamp,
            agentId
          })
        }
      }
    })

    // Pattern 3: Risk Event Patterns
    const riskEvents = recentMemories.filter(m => m.outcome.pnl < -100)
    if (riskEvents.length >= 3) {
      const avgLoss = riskEvents.reduce((acc, m) => acc + Math.abs(m.outcome.pnl), 0) / riskEvents.length
      recognizedPatterns.push({
        id: `pattern-risk-events-${Date.now()}`,
        patternType: 'risk_event',
        description: `Risk pattern: Average loss of $${avgLoss.toFixed(0)} in similar conditions`,
        frequency: riskEvents.length,
        accuracy: 0,
        profitability: -avgLoss,
        conditions: riskEvents[0].marketConditions,
        outcomes: riskEvents.map(m => m.outcome),
        confidence: 80,
        lastSeen: riskEvents[0].timestamp,
        agentId
      })
    }

    return recognizedPatterns.slice(0, 10) // Keep top 10 patterns
  }, [memories, memorySystem, agentId])

  // Learning metrics calculation
  const calculateLearningMetrics = useMemo(() => {
    if (memories.length === 0) return learningMetrics

    const recentMemories = memories.slice(0, 50)
    const olderMemories = memories.slice(50, 100)
    
    const recentAccuracy = recentMemories.length > 0 ? 
      recentMemories.filter(m => m.outcome.success).length / recentMemories.length : 0
    const olderAccuracy = olderMemories.length > 0 ? 
      olderMemories.filter(m => m.outcome.success).length / olderMemories.length : 0
    
    const accuracyImprovement = recentAccuracy - olderAccuracy
    const experienceLevel = Math.min(100, (memories.length / 1000) * 100)
    
    return {
      totalMemories: memories.length,
      patternsIdentified: patterns.length,
      accuracyImprovement: accuracyImprovement * 100,
      experienceLevel,
      adaptabilityScore: 75 + Math.random() * 20, // Mock adaptive score
      memoryRetention: Math.max(0, 100 - (memories.length / memorySystem.maxMemories) * 10),
      patternRecognitionRate: patterns.length > 0 ? (patterns.length / memories.length) * 100 : 0
    }
  }, [memories, patterns, memorySystem.maxMemories])

  // Memory search and filtering
  const filteredMemories = useMemo(() => {
    if (!searchQuery) return memories.slice(0, 20)
    
    return memories.filter(memory => 
      memory.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.eventType.includes(searchQuery.toLowerCase()) ||
      memory.emotionalState?.includes(searchQuery.toLowerCase())
    ).slice(0, 20)
  }, [memories, searchQuery])

  // Initialize mock data
  useEffect(() => {
    if (memorySystem.enabled) {
      const mockMemories = generateMockMemories()
      setMemories(mockMemories)
    }
  }, [memorySystem.enabled, agentId])

  // Update patterns when memories change
  useEffect(() => {
    setPatterns(recognizePatterns)
  }, [recognizePatterns])

  // Update learning metrics
  useEffect(() => {
    const newMetrics = calculateLearningMetrics
    setLearningMetrics(newMetrics)
    
    if (onLearningUpdate) {
      onLearningUpdate(newMetrics)
    }
  }, [calculateLearningMetrics, onLearningUpdate])

  // Store new memory entry
  const storeMemory = (memory: MemoryEntry) => {
    setMemories(prev => {
      const newMemories = [memory, ...prev].slice(0, memorySystem.maxMemories)
      return newMemories
    })

    if (onMemoryStored) {
      onMemoryStored(memory)
    }
  }

  // Clear old memories
  const clearOldMemories = () => {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    setMemories(prev => prev.filter(m => m.timestamp > cutoffDate))
  }

  const toggleMemorySystem = () => {
    setMemorySystem(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <Card className={`${className} ${memorySystem.enabled ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Agent Memory System
              <Badge variant={memorySystem.enabled ? "default" : "secondary"}>
                {memorySystem.enabled ? 'Learning' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Advanced pattern recognition and learning system for {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearOldMemories}
              disabled={!memorySystem.enabled}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive Old
            </Button>
            <Button
              size="sm"
              variant={memorySystem.enabled ? "destructive" : "default"}
              onClick={toggleMemorySystem}
            >
              {memorySystem.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Learning Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Memories</div>
                <AnimatedCounter 
                  value={learningMetrics.totalMemories}
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Patterns Found</div>
                <AnimatedCounter 
                  value={learningMetrics.patternsIdentified}
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Experience Level</div>
                <AnimatedCounter 
                  value={learningMetrics.experienceLevel}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Adaptability</div>
                <AnimatedCounter 
                  value={learningMetrics.adaptabilityScore}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-orange-600"
                />
              </div>
            </div>

            {/* Memory Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Memory Formation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memories.slice(0, 50).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any) => [value.toFixed(2), 'Learning Value']}
                        labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="learningValue"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Patterns */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recently Discovered Patterns
              </h4>
              <div className="grid gap-3">
                {patterns.slice(0, 3).map((pattern) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-purple-200"
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{pattern.description}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {pattern.patternType.replace('_', ' ')} • Frequency: {pattern.frequency}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {pattern.confidence.toFixed(0)}% confidence
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {pattern.accuracy > 0 ? `${(pattern.accuracy * 100).toFixed(0)}% accurate` : 'Risk pattern'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <div className="grid gap-4">
              {patterns.map((pattern) => (
                <Card key={pattern.id} className="cursor-pointer hover:border-purple-200" onClick={() => setSelectedPattern(pattern)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          pattern.patternType === 'market_condition' ? 'default' :
                          pattern.patternType === 'trading_signal' ? 'secondary' :
                          pattern.patternType === 'risk_event' ? 'destructive' : 'outline'
                        }>
                          {pattern.patternType.replace('_', ' ')}
                        </Badge>
                        <span className="font-semibold">{pattern.description}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {pattern.confidence.toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">confidence</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Frequency:</span> {pattern.frequency}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span> {(pattern.accuracy * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profitability:</span> 
                        <span className={pattern.profitability >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${pattern.profitability.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Memories Tab */}
          <TabsContent value="memories" className="space-y-6">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Memory List */}
            <div className="space-y-3">
              {filteredMemories.map((memory) => (
                <Card key={memory.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{memory.eventType.replace('_', ' ')}</Badge>
                        {memory.emotionalState && (
                          <Badge variant="secondary">{memory.emotionalState}</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {memory.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className={`font-semibold ${memory.outcome.success ? 'text-green-600' : 'text-red-600'}`}>
                        {memory.outcome.success ? 'Success' : 'Failed'}
                      </div>
                    </div>
                    <div className="text-sm mb-2">{memory.decision}</div>
                    <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>Action: {memory.outcome.action}</div>
                      <div>Price: ${memory.outcome.price.toLocaleString()}</div>
                      <div>P&L: <span className={memory.outcome.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${memory.outcome.pnl.toFixed(0)}
                      </span></div>
                      <div>Learning: {(memory.learningValue * 100).toFixed(1)}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="space-y-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {learningMetrics.accuracyImprovement >= 0 ? '+' : ''}{learningMetrics.accuracyImprovement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy Improvement</div>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {learningMetrics.memoryRetention.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Memory Retention</div>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {learningMetrics.patternRecognitionRate.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Pattern Recognition Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Curve */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Curve Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memories.slice(0, 30).reverse().map((memory, index) => ({
                      index,
                      accuracy: memories.slice(0, index + 10).filter(m => m.outcome.success).length / Math.max(1, index + 10),
                      learningValue: memory.learningValue
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="index" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} name="Accuracy" />
                      <Line type="monotone" dataKey="learningValue" stroke="#8B5CF6" strokeWidth={2} name="Learning Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Memory System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxMemories">Max Memories</Label>
                      <Input
                        id="maxMemories"
                        type="number"
                        value={memorySystem.maxMemories}
                        onChange={(e) => setMemorySystem(prev => ({ 
                          ...prev, 
                          maxMemories: parseInt(e.target.value) || 10000 
                        }))}
                        min="100"
                        max="50000"
                        step="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Pattern Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        step="0.05"
                        value={memorySystem.patternThreshold}
                        onChange={(e) => setMemorySystem(prev => ({ 
                          ...prev, 
                          patternThreshold: parseFloat(e.target.value) || 0.75 
                        }))}
                        min="0.5"
                        max="0.95"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="learningRate">Learning Rate</Label>
                      <Input
                        id="learningRate"
                        type="number"
                        step="0.001"
                        value={memorySystem.learningRate}
                        onChange={(e) => setMemorySystem(prev => ({ 
                          ...prev, 
                          learningRate: parseFloat(e.target.value) || 0.01 
                        }))}
                        min="0.001"
                        max="0.1"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Analysis</Label>
                        <p className="text-sm text-muted-foreground">Continuously analyze patterns</p>
                      </div>
                      <Switch 
                        checked={memorySystem.realTimeAnalysis}
                        onCheckedChange={(checked) => setMemorySystem(prev => ({ 
                          ...prev, 
                          realTimeAnalysis: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Adaptive Threshold</Label>
                        <p className="text-sm text-muted-foreground">Adjust thresholds based on performance</p>
                      </div>
                      <Switch 
                        checked={memorySystem.adaptiveThreshold}
                        onCheckedChange={(checked) => setMemorySystem(prev => ({ 
                          ...prev, 
                          adaptiveThreshold: checked 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contextWindow">Context Window</Label>
                      <Input
                        id="contextWindow"
                        type="number"
                        value={memorySystem.contextWindow}
                        onChange={(e) => setMemorySystem(prev => ({ 
                          ...prev, 
                          contextWindow: parseInt(e.target.value) || 100 
                        }))}
                        min="10"
                        max="500"
                        step="10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {memorySystem.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {memorySystem.enabled ? 'Memory System Active' : 'Memory System Inactive'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Agent: {agentId} • {learningMetrics.totalMemories} memories stored
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentMemorySystem