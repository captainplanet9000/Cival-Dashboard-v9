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
  History, Search, Filter, TrendingUp, TrendingDown, Clock,
  BarChart3, PieChart, Target, AlertTriangle, CheckCircle2,
  Brain, Activity, Zap, RefreshCw, Download, Eye, Calendar
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Agent Decision History Component
 * Comprehensive tracking and analytics for all agent trading decisions
 * Provides detailed insights into decision patterns, performance, and learning progress
 */

interface DecisionEntry {
  id: string
  agentId: string
  timestamp: Date
  decisionType: 'trade_entry' | 'trade_exit' | 'position_size' | 'risk_adjustment' | 'strategy_change' | 'market_analysis'
  action: 'BUY' | 'SELL' | 'HOLD' | 'SCALE_IN' | 'SCALE_OUT' | 'STOP_LOSS' | 'TAKE_PROFIT'
  symbol: string
  price: number
  quantity: number
  confidence: number
  reasoning: string
  marketConditions: MarketCondition[]
  technicalIndicators: TechnicalIndicator[]
  fundamentalFactors: string[]
  riskFactors: RiskFactor[]
  outcome: DecisionOutcome
  learningValue: number
  emotionalState: 'confident' | 'cautious' | 'aggressive' | 'defensive' | 'uncertain'
  strategy: string
  timeframe: string
}

interface MarketCondition {
  indicator: string
  value: number
  status: 'bullish' | 'bearish' | 'neutral'
  strength: number
}

interface TechnicalIndicator {
  name: string
  value: number
  signal: 'buy' | 'sell' | 'neutral'
  timeframe: string
  reliability: number
}

interface RiskFactor {
  type: 'market_risk' | 'position_risk' | 'portfolio_risk' | 'external_risk'
  severity: 'low' | 'medium' | 'high'
  description: string
  impact: number
}

interface DecisionOutcome {
  executed: boolean
  actualPrice?: number
  slippage?: number
  pnl?: number
  timeToExecution?: number
  success: boolean
  accuracy: number
  impactOnPortfolio: number
}

interface DecisionAnalytics {
  totalDecisions: number
  successRate: number
  avgConfidence: number
  avgLearningValue: number
  decisionsByType: Record<string, number>
  decisionsByAction: Record<string, number>
  decisionsByOutcome: Record<string, number>
  performanceByTimeframe: Record<string, number>
  emotionalStateDistribution: Record<string, number>
  riskFactorAnalysis: Record<string, number>
}

interface DecisionPattern {
  id: string
  pattern: string
  frequency: number
  successRate: number
  avgPnL: number
  conditions: string[]
  recommendation: string
  confidence: number
}

interface AgentDecisionHistoryProps {
  agentId?: string
  onDecisionAnalyzed?: (decision: DecisionEntry) => void
  onPatternDetected?: (pattern: DecisionPattern) => void
  maxHistorySize?: number
  isActive?: boolean
  className?: string
}

export function AgentDecisionHistory({
  agentId = 'agent-001',
  onDecisionAnalyzed,
  onPatternDetected,
  maxHistorySize = 1000,
  isActive = true,
  className
}: AgentDecisionHistoryProps) {
  const [historySystem, setHistorySystem] = useState({
    enabled: isActive,
    autoAnalysis: true,
    patternDetection: true,
    realTimeTracking: true,
    learningEnabled: true,
    showAdvancedMetrics: true,
    analyticsInterval: 60000 // 1 minute
  })

  const [decisions, setDecisions] = useState<DecisionEntry[]>([])
  const [filteredDecisions, setFilteredDecisions] = useState<DecisionEntry[]>([])
  const [analytics, setAnalytics] = useState<DecisionAnalytics>({
    totalDecisions: 0,
    successRate: 0,
    avgConfidence: 0,
    avgLearningValue: 0,
    decisionsByType: {},
    decisionsByAction: {},
    decisionsByOutcome: {},
    performanceByTimeframe: {},
    emotionalStateDistribution: {},
    riskFactorAnalysis: {}
  })
  const [patterns, setPatterns] = useState<DecisionPattern[]>([])
  const [selectedDecision, setSelectedDecision] = useState<DecisionEntry | null>(null)
  
  const [filters, setFilters] = useState({
    timeframe: 'all', // 'all', '24h', '7d', '30d'
    decisionType: 'all',
    action: 'all',
    outcome: 'all', // 'all', 'successful', 'failed'
    symbol: '',
    minConfidence: 0,
    maxConfidence: 100
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Generate mock decision history
  const generateMockDecisions = (): DecisionEntry[] => {
    const decisionTypes = ['trade_entry', 'trade_exit', 'position_size', 'risk_adjustment', 'strategy_change', 'market_analysis'] as const
    const actions = ['BUY', 'SELL', 'HOLD', 'SCALE_IN', 'SCALE_OUT', 'STOP_LOSS', 'TAKE_PROFIT'] as const
    const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'GOOGL', 'MSFT']
    const strategies = ['Darvas Box', 'Williams Alligator', 'Renko Breakout', 'Heikin Ashi', 'Elliott Wave']
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d']
    const emotionalStates = ['confident', 'cautious', 'aggressive', 'defensive', 'uncertain'] as const

    return Array.from({ length: 500 }, (_, index) => {
      const timestamp = new Date(Date.now() - index * 15 * 60 * 1000) // Every 15 minutes
      const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const basePrice = symbol.includes('/') ? 45000 + Math.random() * 10000 : 150 + Math.random() * 200
      const confidence = 50 + Math.random() * 45 // 50-95%
      const success = Math.random() > 0.3 // 70% success rate
      const pnl = success ? Math.random() * 1000 + 100 : -(Math.random() * 500 + 50)

      const marketConditions: MarketCondition[] = [
        {
          indicator: 'RSI',
          value: 30 + Math.random() * 40,
          status: Math.random() > 0.5 ? 'bullish' : 'bearish',
          strength: Math.random() * 100
        },
        {
          indicator: 'MACD',
          value: -5 + Math.random() * 10,
          status: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'bullish' : 'bearish') : 'neutral',
          strength: Math.random() * 100
        },
        {
          indicator: 'Volume',
          value: 1000000 + Math.random() * 2000000,
          status: Math.random() > 0.5 ? 'bullish' : 'neutral',
          strength: Math.random() * 100
        }
      ]

      const technicalIndicators: TechnicalIndicator[] = [
        {
          name: 'Moving Average',
          value: basePrice * (0.98 + Math.random() * 0.04),
          signal: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'neutral',
          timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
          reliability: 0.6 + Math.random() * 0.35
        },
        {
          name: 'Support/Resistance',
          value: basePrice * (0.95 + Math.random() * 0.1),
          signal: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'neutral',
          timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
          reliability: 0.7 + Math.random() * 0.25
        }
      ]

      const riskFactors: RiskFactor[] = [
        {
          type: 'market_risk',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          description: 'Market volatility increased',
          impact: Math.random() * 100
        },
        {
          type: 'position_risk',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          description: 'Position size relative to portfolio',
          impact: Math.random() * 100
        }
      ]

      return {
        id: `decision-${index}`,
        agentId,
        timestamp,
        decisionType,
        action,
        symbol,
        price: basePrice + (Math.random() - 0.5) * basePrice * 0.02,
        quantity: Math.random() * 10 + 0.01,
        confidence,
        reasoning: `${decisionType.replace('_', ' ')} based on ${Math.random() > 0.5 ? 'technical' : 'fundamental'} analysis showing ${Math.random() > 0.5 ? 'bullish' : 'bearish'} signals`,
        marketConditions,
        technicalIndicators,
        fundamentalFactors: ['Economic indicators', 'News sentiment', 'Sector rotation'].filter(() => Math.random() > 0.5),
        riskFactors,
        outcome: {
          executed: Math.random() > 0.1, // 90% execution rate
          actualPrice: basePrice + (Math.random() - 0.5) * basePrice * 0.001, // Small slippage
          slippage: Math.random() * 0.1,
          pnl,
          timeToExecution: Math.random() * 5000 + 100, // 100ms to 5s
          success,
          accuracy: success ? 0.7 + Math.random() * 0.25 : 0.2 + Math.random() * 0.4,
          impactOnPortfolio: Math.abs(pnl) / 100000 * 100 // Percentage impact
        },
        learningValue: success ? Math.random() * 0.1 + 0.05 : Math.random() * 0.05,
        emotionalState: emotionalStates[Math.floor(Math.random() * emotionalStates.length)],
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)]
      }
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Calculate analytics
  const calculateAnalytics = useMemo(() => {
    if (decisions.length === 0) return analytics

    const totalDecisions = decisions.length
    const successfulDecisions = decisions.filter(d => d.outcome.success).length
    const successRate = (successfulDecisions / totalDecisions) * 100

    const avgConfidence = decisions.reduce((acc, d) => acc + d.confidence, 0) / totalDecisions
    const avgLearningValue = decisions.reduce((acc, d) => acc + d.learningValue, 0) / totalDecisions

    // Group by decision type
    const decisionsByType = decisions.reduce((acc, d) => {
      acc[d.decisionType] = (acc[d.decisionType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by action
    const decisionsByAction = decisions.reduce((acc, d) => {
      acc[d.action] = (acc[d.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by outcome
    const decisionsByOutcome = {
      successful: successfulDecisions,
      failed: totalDecisions - successfulDecisions,
      executed: decisions.filter(d => d.outcome.executed).length,
      not_executed: decisions.filter(d => !d.outcome.executed).length
    }

    // Performance by timeframe
    const performanceByTimeframe = decisions.reduce((acc, d) => {
      const key = d.timeframe
      if (!acc[key]) acc[key] = { total: 0, successful: 0 }
      acc[key].total++
      if (d.outcome.success) acc[key].successful++
      return acc
    }, {} as Record<string, { total: number, successful: number }>)

    const performanceByTimeframePercent = Object.entries(performanceByTimeframe).reduce((acc, [key, value]) => {
      acc[key] = (value.successful / value.total) * 100
      return acc
    }, {} as Record<string, number>)

    // Emotional state distribution
    const emotionalStateDistribution = decisions.reduce((acc, d) => {
      acc[d.emotionalState] = (acc[d.emotionalState] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Risk factor analysis
    const riskFactorAnalysis = decisions.reduce((acc, d) => {
      d.riskFactors.forEach(risk => {
        acc[risk.type] = (acc[risk.type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return {
      totalDecisions,
      successRate,
      avgConfidence,
      avgLearningValue,
      decisionsByType,
      decisionsByAction,
      decisionsByOutcome,
      performanceByTimeframe: performanceByTimeframePercent,
      emotionalStateDistribution,
      riskFactorAnalysis
    }
  }, [decisions])

  // Detect decision patterns
  const detectPatterns = useMemo(() => {
    if (decisions.length < 10) return []

    const detectedPatterns: DecisionPattern[] = []

    // Pattern 1: High confidence decisions performance
    const highConfidenceDecisions = decisions.filter(d => d.confidence >= 80)
    if (highConfidenceDecisions.length >= 5) {
      const successRate = (highConfidenceDecisions.filter(d => d.outcome.success).length / highConfidenceDecisions.length) * 100
      const avgPnL = highConfidenceDecisions.reduce((acc, d) => acc + (d.outcome.pnl || 0), 0) / highConfidenceDecisions.length

      detectedPatterns.push({
        id: 'high-confidence-pattern',
        pattern: 'High Confidence Decisions',
        frequency: highConfidenceDecisions.length,
        successRate,
        avgPnL,
        conditions: ['Confidence >= 80%'],
        recommendation: successRate > 75 ? 'Continue prioritizing high-confidence trades' : 'Review confidence calibration',
        confidence: 85
      })
    }

    // Pattern 2: Emotional state impact
    const confidentDecisions = decisions.filter(d => d.emotionalState === 'confident')
    if (confidentDecisions.length >= 5) {
      const successRate = (confidentDecisions.filter(d => d.outcome.success).length / confidentDecisions.length) * 100
      const avgPnL = confidentDecisions.reduce((acc, d) => acc + (d.outcome.pnl || 0), 0) / confidentDecisions.length

      detectedPatterns.push({
        id: 'confident-emotional-pattern',
        pattern: 'Confident Emotional State',
        frequency: confidentDecisions.length,
        successRate,
        avgPnL,
        conditions: ['Emotional state = confident'],
        recommendation: successRate > 70 ? 'Emotional confidence correlates with success' : 'Review decision process when confident',
        confidence: 78
      })
    }

    // Pattern 3: Strategy performance
    const strategies = Array.from(new Set(decisions.map(d => d.strategy)))
    strategies.forEach(strategy => {
      const strategyDecisions = decisions.filter(d => d.strategy === strategy)
      if (strategyDecisions.length >= 5) {
        const successRate = (strategyDecisions.filter(d => d.outcome.success).length / strategyDecisions.length) * 100
        const avgPnL = strategyDecisions.reduce((acc, d) => acc + (d.outcome.pnl || 0), 0) / strategyDecisions.length

        detectedPatterns.push({
          id: `strategy-${strategy.toLowerCase().replace(/\s+/g, '-')}-pattern`,
          pattern: `${strategy} Strategy Performance`,
          frequency: strategyDecisions.length,
          successRate,
          avgPnL,
          conditions: [`Strategy = ${strategy}`],
          recommendation: successRate > 70 ? `${strategy} is performing well` : `Consider adjusting ${strategy} parameters`,
          confidence: 72
        })
      }
    })

    return detectedPatterns.sort((a, b) => b.confidence - a.confidence).slice(0, 10)
  }, [decisions])

  // Apply filters
  const applyFilters = useMemo(() => {
    let filtered = decisions

    // Time filter
    if (filters.timeframe !== 'all') {
      const now = new Date()
      const timeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }
      const timeLimit = timeMap[filters.timeframe as keyof typeof timeMap]
      filtered = filtered.filter(d => now.getTime() - d.timestamp.getTime() <= timeLimit)
    }

    // Decision type filter
    if (filters.decisionType !== 'all') {
      filtered = filtered.filter(d => d.decisionType === filters.decisionType)
    }

    // Action filter
    if (filters.action !== 'all') {
      filtered = filtered.filter(d => d.action === filters.action)
    }

    // Outcome filter
    if (filters.outcome !== 'all') {
      if (filters.outcome === 'successful') {
        filtered = filtered.filter(d => d.outcome.success)
      } else if (filters.outcome === 'failed') {
        filtered = filtered.filter(d => !d.outcome.success)
      }
    }

    // Symbol filter
    if (filters.symbol) {
      filtered = filtered.filter(d => d.symbol.toLowerCase().includes(filters.symbol.toLowerCase()))
    }

    // Confidence filter
    filtered = filtered.filter(d => d.confidence >= filters.minConfidence && d.confidence <= filters.maxConfidence)

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.reasoning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.strategy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [decisions, filters, searchQuery])

  // Initialize mock data
  useEffect(() => {
    if (historySystem.enabled) {
      const mockDecisions = generateMockDecisions()
      setDecisions(mockDecisions)
    }
  }, [historySystem.enabled])

  // Update analytics and patterns
  useEffect(() => {
    setAnalytics(calculateAnalytics)
    setPatterns(detectPatterns)
  }, [calculateAnalytics, detectPatterns])

  // Update filtered decisions
  useEffect(() => {
    setFilteredDecisions(applyFilters)
  }, [applyFilters])

  const toggleHistorySystem = () => {
    setHistorySystem(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const resetFilters = () => {
    setFilters({
      timeframe: 'all',
      decisionType: 'all',
      action: 'all',
      outcome: 'all',
      symbol: '',
      minConfidence: 0,
      maxConfidence: 100
    })
    setSearchQuery('')
  }

  // Chart colors for different categories
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  return (
    <Card className={`${className} ${historySystem.enabled ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6 text-indigo-600" />
              Agent Decision History
              <Badge variant={historySystem.enabled ? "default" : "secondary"}>
                {analytics.totalDecisions} decisions
              </Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive decision tracking and analytics for {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset Filters
            </Button>
            <Button
              size="sm"
              variant={historySystem.enabled ? "destructive" : "default"}
              onClick={toggleHistorySystem}
            >
              {historySystem.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Decisions</div>
                <AnimatedCounter 
                  value={analytics.totalDecisions}
                  className="text-2xl font-bold text-indigo-600"
                />
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                <AnimatedCounter 
                  value={analytics.successRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Avg Confidence</div>
                <AnimatedCounter 
                  value={analytics.avgConfidence}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Learning Value</div>
                <AnimatedCounter 
                  value={analytics.avgLearningValue * 100}
                  precision={2}
                  suffix="%"
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
            </div>

            {/* Decision Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decision Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={decisions.slice(0, 50).reverse().map((decision, index) => ({
                      index,
                      confidence: decision.confidence,
                      success: decision.outcome.success ? 100 : 0,
                      learningValue: decision.learningValue * 100
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="index" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="#6366F1"
                        fill="#6366F1"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name="Confidence"
                      />
                      <Area
                        type="monotone"
                        dataKey="learningValue"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Learning Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent High-Impact Decisions */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recent High-Impact Decisions
              </h4>
              <div className="grid gap-3">
                {decisions
                  .filter(d => d.outcome.impactOnPortfolio > 5) // High impact decisions
                  .slice(0, 3)
                  .map((decision) => (
                    <motion.div
                      key={decision.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-indigo-200"
                      onClick={() => setSelectedDecision(decision)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{decision.action} {decision.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {decision.decisionType.replace('_', ' ')} • {decision.strategy}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${decision.outcome.success ? 'text-green-600' : 'text-red-600'}`}>
                            {decision.outcome.success ? 'Success' : 'Failed'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {decision.confidence.toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <select 
                      value={filters.timeframe}
                      onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Time</option>
                      <option value="24h">Last 24h</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select 
                      value={filters.decisionType}
                      onChange={(e) => setFilters(prev => ({ ...prev, decisionType: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Types</option>
                      <option value="trade_entry">Trade Entry</option>
                      <option value="trade_exit">Trade Exit</option>
                      <option value="position_size">Position Size</option>
                      <option value="risk_adjustment">Risk Adjustment</option>
                      <option value="strategy_change">Strategy Change</option>
                      <option value="market_analysis">Market Analysis</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <select 
                      value={filters.action}
                      onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Actions</option>
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                      <option value="HOLD">Hold</option>
                      <option value="SCALE_IN">Scale In</option>
                      <option value="SCALE_OUT">Scale Out</option>
                      <option value="STOP_LOSS">Stop Loss</option>
                      <option value="TAKE_PROFIT">Take Profit</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <select 
                      value={filters.outcome}
                      onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Outcomes</option>
                      <option value="successful">Successful</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="Filter by symbol"
                      value={filters.symbol}
                      onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Confidence</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.minConfidence}
                      onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search decisions by reasoning, symbol, or strategy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Decision List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Decisions ({filteredDecisions.length} of {analytics.totalDecisions})
                </h4>
                <Badge variant="outline">
                  {filteredDecisions.filter(d => d.outcome.success).length} successful
                </Badge>
              </div>
              {filteredDecisions.slice(0, 20).map((decision) => (
                <Card key={decision.id} className="cursor-pointer hover:border-indigo-200" onClick={() => setSelectedDecision(decision)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={decision.outcome.success ? 'default' : 'destructive'}>
                          {decision.action}
                        </Badge>
                        <Badge variant="outline">{decision.decisionType.replace('_', ' ')}</Badge>
                        <span className="font-semibold">{decision.symbol}</span>
                        <Badge variant="secondary">{decision.emotionalState}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {decision.timestamp.toLocaleString()}
                        </div>
                        <div className="font-semibold">{decision.confidence.toFixed(0)}% confidence</div>
                      </div>
                    </div>
                    <div className="text-sm mb-2">{decision.reasoning}</div>
                    <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>Price: <AnimatedPrice value={decision.price} currency="$" precision={2} size="sm" showTrend={false} /></div>
                      <div>Quantity: {decision.quantity.toFixed(3)}</div>
                      <div>Strategy: {decision.strategy}</div>
                      <div>P&L: <span className={decision.outcome.pnl && decision.outcome.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {decision.outcome.pnl ? `$${decision.outcome.pnl.toFixed(0)}` : 'N/A'}
                      </span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <div className="grid gap-4">
              {patterns.map((pattern) => (
                <Card key={pattern.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pattern.pattern}</span>
                        <Badge variant="outline">
                          {pattern.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {pattern.successRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">success rate</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Frequency:</span> {pattern.frequency}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg P&L:</span> 
                        <span className={pattern.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${pattern.avgPnL.toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conditions:</span> {pattern.conditions.length}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Conditions:</strong> {pattern.conditions.join(', ')}
                    </div>
                    <div className="text-sm">
                      <strong>Recommendation:</strong> {pattern.recommendation}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decision Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Decisions by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(analytics.decisionsByType).map(([type, count]) => ({
                        type: type.replace('_', ' '),
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="type" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366F1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip />
                        <RechartsPieChart dataKey="value" data={Object.entries(analytics.decisionsByAction).map(([action, count], index) => ({
                          name: action,
                          value: count,
                          fill: chartColors[index % chartColors.length]
                        }))} cx="50%" cy="50%" outerRadius={80}>
                          {Object.entries(analytics.decisionsByAction).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Performance by Timeframe */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Timeframe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(analytics.performanceByTimeframe).map(([timeframe, performance]) => ({
                        timeframe,
                        performance
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="timeframe" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Success Rate']} />
                        <Bar dataKey="performance" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Emotional States */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emotional State Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(analytics.emotionalStateDistribution).map(([state, count]) => ({
                        state,
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="state" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Decision History Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Analysis</Label>
                        <p className="text-sm text-muted-foreground">Automatically analyze new decisions</p>
                      </div>
                      <Switch 
                        checked={historySystem.autoAnalysis}
                        onCheckedChange={(checked) => setHistorySystem(prev => ({ 
                          ...prev, 
                          autoAnalysis: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Pattern Detection</Label>
                        <p className="text-sm text-muted-foreground">Detect and learn from patterns</p>
                      </div>
                      <Switch 
                        checked={historySystem.patternDetection}
                        onCheckedChange={(checked) => setHistorySystem(prev => ({ 
                          ...prev, 
                          patternDetection: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Tracking</Label>
                        <p className="text-sm text-muted-foreground">Track decisions in real-time</p>
                      </div>
                      <Switch 
                        checked={historySystem.realTimeTracking}
                        onCheckedChange={(checked) => setHistorySystem(prev => ({ 
                          ...prev, 
                          realTimeTracking: checked 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Learning Enabled</Label>
                        <p className="text-sm text-muted-foreground">Use decisions for learning</p>
                      </div>
                      <Switch 
                        checked={historySystem.learningEnabled}
                        onCheckedChange={(checked) => setHistorySystem(prev => ({ 
                          ...prev, 
                          learningEnabled: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Advanced Metrics</Label>
                        <p className="text-sm text-muted-foreground">Show detailed analytics</p>
                      </div>
                      <Switch 
                        checked={historySystem.showAdvancedMetrics}
                        onCheckedChange={(checked) => setHistorySystem(prev => ({ 
                          ...prev, 
                          showAdvancedMetrics: checked 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="historySize">Max History Size</Label>
                      <Input
                        id="historySize"
                        type="number"
                        value={maxHistorySize}
                        onChange={(e) => {/* Update max history size */}}
                        min="100"
                        max="10000"
                        step="100"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {historySystem.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {historySystem.enabled ? 'Decision History Active' : 'Decision History Inactive'}
            </span>
            {historySystem.patternDetection && (
              <Badge variant="outline" className="ml-2">
                {patterns.length} patterns detected
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Agent: {agentId} • {analytics.totalDecisions} decisions tracked
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentDecisionHistory