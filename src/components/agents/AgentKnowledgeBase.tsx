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
  Book, Search, Globe, TrendingUp, TrendingDown, News,
  Brain, Lightbulb, Target, BarChart3, Clock, Award,
  AlertTriangle, CheckCircle2, RefreshCw, Filter, Tag,
  BookOpen, Database, Zap, Settings, Star, Download
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Agent Knowledge Base Component
 * Comprehensive repository of market insights, trading wisdom, and actionable intelligence
 * Enables agents to access accumulated knowledge for better decision-making
 */

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: 'market_analysis' | 'trading_strategy' | 'risk_management' | 'technical_analysis' | 'fundamental_analysis' | 'behavioral_finance' | 'macro_economics'
  subcategory: string
  tags: string[]
  confidence: number
  reliability: number
  source: 'agent_experience' | 'market_data' | 'news_analysis' | 'research_paper' | 'expert_insight' | 'pattern_recognition'
  createdAt: Date
  updatedAt: Date
  accessCount: number
  successRate: number
  applicableSymbols: string[]
  marketConditions: string[]
  timeframes: string[]
  relatedEntries: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  isValidated: boolean
}

interface MarketInsight {
  id: string
  insight: string
  category: string
  confidence: number
  impactLevel: 'low' | 'medium' | 'high'
  timeframe: string
  affectedAssets: string[]
  actionable: boolean
  sourceType: string
  generatedAt: Date
  expiresAt: Date
  validationStatus: 'pending' | 'validated' | 'invalidated'
}

interface TradingWisdom {
  id: string
  principle: string
  description: string
  category: 'entry_rules' | 'exit_rules' | 'risk_management' | 'position_sizing' | 'market_psychology' | 'timing'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  successRate: number
  applicability: string[]
  examples: string[]
  contraindications: string[]
  learningValue: number
}

interface KnowledgeMetrics {
  totalEntries: number
  validatedEntries: number
  avgConfidence: number
  avgReliability: number
  accessFrequency: number
  knowledgeGrowthRate: number
  applicationSuccessRate: number
  categoryCoverage: Record<string, number>
}

interface AgentKnowledgeBaseProps {
  agentId?: string
  onKnowledgeApplied?: (entry: KnowledgeEntry) => void
  onInsightGenerated?: (insight: MarketInsight) => void
  onWisdomLearned?: (wisdom: TradingWisdom) => void
  isActive?: boolean
  className?: string
}

export function AgentKnowledgeBase({
  agentId = 'agent-001',
  onKnowledgeApplied,
  onInsightGenerated,
  onWisdomLearned,
  isActive = true,
  className
}: AgentKnowledgeBaseProps) {
  const [knowledgeSystem, setKnowledgeSystem] = useState({
    enabled: isActive,
    autoLearning: true,
    insightGeneration: true,
    knowledgeValidation: true,
    realTimeUpdates: true,
    crossReference: true,
    confidenceThreshold: 70,
    maxEntries: 5000
  })

  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([])
  const [tradingWisdom, setTradingWisdom] = useState<TradingWisdom[]>([])
  const [knowledgeMetrics, setKnowledgeMetrics] = useState<KnowledgeMetrics>({
    totalEntries: 0,
    validatedEntries: 0,
    avgConfidence: 0,
    avgReliability: 0,
    accessFrequency: 0,
    knowledgeGrowthRate: 0,
    applicationSuccessRate: 0,
    categoryCoverage: {}
  })

  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    source: 'all',
    priority: 'all',
    timeframe: 'all',
    validated: 'all'
  })
  const [activeTab, setActiveTab] = useState('overview')

  // Generate mock knowledge entries
  const generateMockKnowledgeEntries = (): KnowledgeEntry[] => {
    const categories = ['market_analysis', 'trading_strategy', 'risk_management', 'technical_analysis', 'fundamental_analysis', 'behavioral_finance', 'macro_economics'] as const
    const sources = ['agent_experience', 'market_data', 'news_analysis', 'research_paper', 'expert_insight', 'pattern_recognition'] as const
    const priorities = ['low', 'medium', 'high', 'critical'] as const
    const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'SPY', 'GOLD']
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

    const knowledgeTemplates = [
      {
        title: 'Bull Market Momentum Patterns',
        content: 'During bull markets, momentum patterns tend to persist longer than expected. Key indicators include increasing volume on breakouts, higher highs and higher lows formation, and sustained buying pressure above key moving averages.',
        category: 'market_analysis' as const,
        subcategory: 'Market Cycles'
      },
      {
        title: 'Support and Resistance Validation',
        content: 'Strong support and resistance levels are validated by multiple touches, high volume reactions, and confluence with other technical indicators. Price reactions at these levels often provide high-probability trading opportunities.',
        category: 'technical_analysis' as const,
        subcategory: 'Price Action'
      },
      {
        title: 'Risk-Reward Ratio Optimization',
        content: 'Maintaining a minimum 2:1 risk-reward ratio significantly improves long-term profitability. This allows for a win rate as low as 40% while remaining profitable, providing buffer for inevitable losing trades.',
        category: 'risk_management' as const,
        subcategory: 'Position Sizing'
      },
      {
        title: 'Volume Confirmation Signals',
        content: 'Price movements accompanied by above-average volume are more likely to continue. Volume precedes price, making it a leading indicator for potential breakouts and trend reversals.',
        category: 'technical_analysis' as const,
        subcategory: 'Volume Analysis'
      },
      {
        title: 'Market Fear and Greed Cycles',
        content: 'Extreme fear often marks market bottoms while extreme greed signals potential tops. Contrarian approaches during these extremes historically yield superior returns.',
        category: 'behavioral_finance' as const,
        subcategory: 'Market Psychology'
      },
      {
        title: 'Fibonacci Retracement Accuracy',
        content: 'The 61.8% Fibonacci retracement level shows the highest probability of price reversal in trending markets. Combined with other confluence factors, it provides strong entry points.',
        category: 'technical_analysis' as const,
        subcategory: 'Fibonacci Analysis'
      },
      {
        title: 'News Impact on Volatility',
        content: 'Major economic announcements create volatility spikes that typically last 15-30 minutes. Pre-positioning before announcements carries high risk but potential high reward.',
        category: 'fundamental_analysis' as const,
        subcategory: 'Economic Events'
      },
      {
        title: 'Trend Following vs Mean Reversion',
        content: 'Trend following strategies work best in liquid markets with clear directional bias. Mean reversion strategies excel in range-bound, high-volatility environments.',
        category: 'trading_strategy' as const,
        subcategory: 'Strategy Selection'
      }
    ]

    return Array.from({ length: 150 }, (_, index) => {
      const template = knowledgeTemplates[index % knowledgeTemplates.length]
      const baseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Last 90 days

      return {
        id: `knowledge-${index}`,
        title: `${template.title} ${index > 7 ? `- Case ${Math.floor(index / 8)}` : ''}`,
        content: template.content + (index > 7 ? ` Additional insights from recent market analysis suggest this pattern has shown ${(60 + Math.random() * 30).toFixed(1)}% accuracy in similar conditions.` : ''),
        category: template.category,
        subcategory: template.subcategory,
        tags: [
          template.subcategory.toLowerCase().replace(/\s+/g, '_'),
          categories[Math.floor(Math.random() * categories.length)],
          'validated',
          Math.random() > 0.5 ? 'high_impact' : 'actionable'
        ].filter((tag, pos, arr) => arr.indexOf(tag) === pos),
        confidence: 65 + Math.random() * 30,
        reliability: 70 + Math.random() * 25,
        source: sources[Math.floor(Math.random() * sources.length)],
        createdAt: baseDate,
        updatedAt: new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        accessCount: Math.floor(Math.random() * 50) + 1,
        successRate: 65 + Math.random() * 30,
        applicableSymbols: symbols.filter(() => Math.random() > 0.6),
        marketConditions: ['trending', 'ranging', 'volatile', 'stable'].filter(() => Math.random() > 0.7),
        timeframes: timeframes.filter(() => Math.random() > 0.6),
        relatedEntries: [],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        isValidated: Math.random() > 0.2 // 80% validated
      }
    }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Generate mock market insights
  const generateMockInsights = (): MarketInsight[] => {
    const insightTemplates = [
      'Bitcoin showing strong correlation with tech stocks, indicating institutional adoption',
      'Ethereum gas fees declining suggest improved network efficiency and adoption',
      'VIX levels below 20 historically precede market complacency periods',
      'Dollar strength putting pressure on commodity prices across the board',
      'Yield curve inversion signals potential economic slowdown in 6-12 months',
      'Crypto market showing increased institutional flow during Asian trading hours',
      'Energy sector rotation suggests inflation concerns among institutional investors',
      'Small-cap underperformance indicates risk-off sentiment in equity markets'
    ]

    return Array.from({ length: 50 }, (_, index) => ({
      id: `insight-${index}`,
      insight: insightTemplates[index % insightTemplates.length],
      category: ['technical', 'fundamental', 'sentiment', 'macro', 'flow'][Math.floor(Math.random() * 5)],
      confidence: 60 + Math.random() * 35,
      impactLevel: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
      timeframe: ['short_term', 'medium_term', 'long_term'][Math.floor(Math.random() * 3)],
      affectedAssets: ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'SPY'].filter(() => Math.random() > 0.6),
      actionable: Math.random() > 0.3,
      sourceType: ['market_data', 'news_analysis', 'pattern_recognition'][Math.floor(Math.random() * 3)],
      generatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      validationStatus: (['pending', 'validated', 'invalidated'] as const)[Math.floor(Math.random() * 3)]
    })).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
  }

  // Generate mock trading wisdom
  const generateMockWisdom = (): TradingWisdom[] => {
    const wisdomEntries = [
      {
        principle: 'Cut Losses Short, Let Winners Run',
        description: 'The fundamental principle of risk management: limit downside while maximizing upside potential.',
        category: 'risk_management' as const,
        examples: ['Use trailing stops on profitable trades', 'Set predetermined stop-loss levels', 'Take partial profits at resistance levels']
      },
      {
        principle: 'Trade with the Trend',
        description: 'Trending markets offer the highest probability trades when trading in the direction of the dominant trend.',
        category: 'entry_rules' as const,
        examples: ['Buy pullbacks in uptrends', 'Sell rallies in downtrends', 'Use trend-following indicators for confirmation']
      },
      {
        principle: 'Volume Confirms Price Action',
        description: 'Genuine price movements are accompanied by increasing volume, providing confirmation of market conviction.',
        category: 'entry_rules' as const,
        examples: ['Look for volume spikes on breakouts', 'Avoid low-volume price movements', 'Use volume as a leading indicator']
      },
      {
        principle: 'Position Size Based on Risk',
        description: 'Never risk more than 1-2% of total capital on any single trade, regardless of confidence level.',
        category: 'position_sizing' as const,
        examples: ['Calculate position size before entry', 'Use stop-loss distance to determine size', 'Reduce size in uncertain conditions']
      },
      {
        principle: 'Market Psychology Drives Price',
        description: 'Understanding crowd psychology and sentiment extremes provides superior trading opportunities.',
        category: 'market_psychology' as const,
        examples: ['Buy when others are fearful', 'Sell when others are greedy', 'Monitor sentiment indicators']
      }
    ]

    return wisdomEntries.map((wisdom, index) => ({
      id: `wisdom-${index}`,
      principle: wisdom.principle,
      description: wisdom.description,
      category: wisdom.category,
      difficulty: (['beginner', 'intermediate', 'advanced', 'expert'] as const)[Math.floor(Math.random() * 4)],
      successRate: 70 + Math.random() * 25,
      applicability: ['all_markets', 'trending_markets', 'volatile_markets'].filter(() => Math.random() > 0.5),
      examples: wisdom.examples,
      contraindications: ['Extreme volatility periods', 'Low liquidity conditions', 'Major news events'].filter(() => Math.random() > 0.6),
      learningValue: 0.7 + Math.random() * 0.25
    }))
  }

  // Calculate knowledge metrics
  const calculateKnowledgeMetrics = useMemo(() => {
    if (knowledgeEntries.length === 0) return knowledgeMetrics

    const totalEntries = knowledgeEntries.length
    const validatedEntries = knowledgeEntries.filter(e => e.isValidated).length
    const avgConfidence = knowledgeEntries.reduce((acc, e) => acc + e.confidence, 0) / totalEntries
    const avgReliability = knowledgeEntries.reduce((acc, e) => acc + e.reliability, 0) / totalEntries
    const totalAccess = knowledgeEntries.reduce((acc, e) => acc + e.accessCount, 0)
    const avgSuccessRate = knowledgeEntries.reduce((acc, e) => acc + e.successRate, 0) / totalEntries

    // Category coverage
    const categoryCoverage = knowledgeEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEntries,
      validatedEntries,
      avgConfidence,
      avgReliability,
      accessFrequency: totalAccess / Math.max(totalEntries, 1),
      knowledgeGrowthRate: 15 + Math.random() * 10, // Mock growth rate
      applicationSuccessRate: avgSuccessRate,
      categoryCoverage
    }
  }, [knowledgeEntries])

  // Filter and search knowledge entries
  const filteredEntries = useMemo(() => {
    let filtered = knowledgeEntries

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(e => e.category === filters.category)
    }

    // Apply source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(e => e.source === filters.source)
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(e => e.priority === filters.priority)
    }

    // Apply validation filter
    if (filters.validated !== 'all') {
      if (filters.validated === 'validated') {
        filtered = filtered.filter(e => e.isValidated)
      } else {
        filtered = filtered.filter(e => !e.isValidated)
      }
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered.slice(0, 50) // Limit display for performance
  }, [knowledgeEntries, filters, searchQuery])

  // Initialize mock data
  useEffect(() => {
    if (knowledgeSystem.enabled) {
      setKnowledgeEntries(generateMockKnowledgeEntries())
      setMarketInsights(generateMockInsights())
      setTradingWisdom(generateMockWisdom())
    }
  }, [knowledgeSystem.enabled])

  // Update metrics
  useEffect(() => {
    setKnowledgeMetrics(calculateKnowledgeMetrics)
  }, [calculateKnowledgeMetrics])

  const toggleKnowledgeSystem = () => {
    setKnowledgeSystem(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const applyKnowledge = (entry: KnowledgeEntry) => {
    // Increment access count
    setKnowledgeEntries(prev => prev.map(e => 
      e.id === entry.id ? { ...e, accessCount: e.accessCount + 1 } : e
    ))

    if (onKnowledgeApplied) {
      onKnowledgeApplied(entry)
    }
  }

  const validateEntry = (entryId: string, isValid: boolean) => {
    setKnowledgeEntries(prev => prev.map(e => 
      e.id === entryId ? { ...e, isValidated: isValid, updatedAt: new Date() } : e
    ))
  }

  return (
    <Card className={`${className} ${knowledgeSystem.enabled ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-6 w-6 text-emerald-600" />
              Agent Knowledge Base
              <Badge variant={knowledgeSystem.enabled ? "default" : "secondary"}>
                {knowledgeMetrics.totalEntries} entries
              </Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive repository of market insights and trading wisdom for {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* Refresh knowledge base */}}
              disabled={!knowledgeSystem.enabled}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant={knowledgeSystem.enabled ? "destructive" : "default"}
              onClick={toggleKnowledgeSystem}
            >
              {knowledgeSystem.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="wisdom">Wisdom</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Knowledge Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Knowledge</div>
                <AnimatedCounter 
                  value={knowledgeMetrics.totalEntries}
                  className="text-2xl font-bold text-emerald-600"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {knowledgeMetrics.validatedEntries} validated
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Avg Confidence</div>
                <AnimatedCounter 
                  value={knowledgeMetrics.avgConfidence}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                <AnimatedCounter 
                  value={knowledgeMetrics.applicationSuccessRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Growth Rate</div>
                <AnimatedCounter 
                  value={knowledgeMetrics.knowledgeGrowthRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-orange-600"
                />
              </div>
            </div>

            {/* Knowledge Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(knowledgeMetrics.categoryCoverage).map(([category, count]) => ({
                      category: category.replace('_', ' '),
                      count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="category" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent High-Priority Knowledge */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                High-Priority Knowledge Entries
              </h4>
              <div className="grid gap-3">
                {knowledgeEntries
                  .filter(e => e.priority === 'high' || e.priority === 'critical')
                  .slice(0, 3)
                  .map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-emerald-200"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.priority === 'critical' ? 'destructive' : 'default'}>
                            {entry.priority}
                          </Badge>
                          <Badge variant="outline">{entry.category.replace('_', ' ')}</Badge>
                          {entry.isValidated && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                      <div className="font-semibold mb-1">{entry.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Accessed: {entry.accessCount} times</span>
                        <span>•</span>
                        <span>Success: {entry.successRate.toFixed(0)}%</span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter Knowledge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Categories</option>
                      <option value="market_analysis">Market Analysis</option>
                      <option value="trading_strategy">Trading Strategy</option>
                      <option value="risk_management">Risk Management</option>
                      <option value="technical_analysis">Technical Analysis</option>
                      <option value="fundamental_analysis">Fundamental Analysis</option>
                      <option value="behavioral_finance">Behavioral Finance</option>
                      <option value="macro_economics">Macro Economics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <select 
                      value={filters.source}
                      onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Sources</option>
                      <option value="agent_experience">Agent Experience</option>
                      <option value="market_data">Market Data</option>
                      <option value="news_analysis">News Analysis</option>
                      <option value="research_paper">Research Paper</option>
                      <option value="expert_insight">Expert Insight</option>
                      <option value="pattern_recognition">Pattern Recognition</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select 
                      value={filters.priority}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Priorities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Validation</Label>
                    <select 
                      value={filters.validated}
                      onChange={(e) => setFilters(prev => ({ ...prev, validated: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">All Entries</option>
                      <option value="validated">Validated</option>
                      <option value="unvalidated">Unvalidated</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <Input
                      placeholder="Search knowledge..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Knowledge Entries ({filteredEntries.length} of {knowledgeMetrics.totalEntries})
                </h4>
                <Badge variant="outline">
                  {filteredEntries.filter(e => e.isValidated).length} validated
                </Badge>
              </div>
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="cursor-pointer hover:border-emerald-200" onClick={() => setSelectedEntry(entry)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.priority === 'critical' ? 'destructive' :
                          entry.priority === 'high' ? 'default' :
                          entry.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {entry.priority}
                        </Badge>
                        <Badge variant="outline">{entry.category.replace('_', ' ')}</Badge>
                        <Badge variant="secondary">{entry.source.replace('_', ' ')}</Badge>
                        {entry.isValidated && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{entry.confidence.toFixed(0)}% confident</div>
                        <div className="text-xs text-muted-foreground">{entry.reliability.toFixed(0)}% reliable</div>
                      </div>
                    </div>
                    <div className="font-semibold mb-2">{entry.title}</div>
                    <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {entry.content}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Accessed: {entry.accessCount} times</span>
                        <span>Success: {entry.successRate.toFixed(0)}%</span>
                        <span>Updated: {entry.updatedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {!entry.isValidated && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); validateEntry(entry.id, true) }}>
                          Validate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); validateEntry(entry.id, false) }}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-4">
              {marketInsights.slice(0, 20).map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          insight.impactLevel === 'high' ? 'destructive' :
                          insight.impactLevel === 'medium' ? 'default' : 'secondary'
                        }>
                          {insight.impactLevel} impact
                        </Badge>
                        <Badge variant="outline">{insight.category}</Badge>
                        <Badge variant={
                          insight.validationStatus === 'validated' ? 'default' :
                          insight.validationStatus === 'invalidated' ? 'destructive' : 'secondary'
                        }>
                          {insight.validationStatus}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{insight.confidence.toFixed(0)}% confidence</div>
                        <div className="text-xs text-muted-foreground">{insight.timeframe.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="font-semibold mb-2">{insight.insight}</div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span>Source:</span> {insight.sourceType.replace('_', ' ')}
                      </div>
                      <div>
                        <span>Generated:</span> {insight.generatedAt.toLocaleDateString()}
                      </div>
                      <div>
                        <span>Expires:</span> {insight.expiresAt.toLocaleDateString()}
                      </div>
                    </div>
                    {insight.affectedAssets.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Affected Assets: </span>
                        {insight.affectedAssets.map(asset => (
                          <Badge key={asset} variant="outline" className="text-xs mr-1">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wisdom Tab */}
          <TabsContent value="wisdom" className="space-y-6">
            <div className="grid gap-4">
              {tradingWisdom.map((wisdom) => (
                <Card key={wisdom.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{wisdom.category.replace('_', ' ')}</Badge>
                        <Badge variant={
                          wisdom.difficulty === 'expert' ? 'destructive' :
                          wisdom.difficulty === 'advanced' ? 'default' :
                          wisdom.difficulty === 'intermediate' ? 'secondary' : 'outline'
                        }>
                          {wisdom.difficulty}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{wisdom.successRate.toFixed(0)}% success rate</div>
                        <div className="text-xs text-muted-foreground">Learning value: {(wisdom.learningValue * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-lg mb-2">{wisdom.principle}</div>
                    <div className="text-sm text-muted-foreground mb-3">{wisdom.description}</div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="font-semibold text-sm mb-1">Examples:</div>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {wisdom.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {wisdom.contraindications.length > 0 && (
                        <div>
                          <div className="font-semibold text-sm mb-1 text-red-600">Contraindications:</div>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {wisdom.contraindications.map((contra, index) => (
                              <li key={index}>{contra}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">Applicable to:</span>
                        {wisdom.applicability.map(app => (
                          <Badge key={app} variant="outline" className="text-xs">
                            {app.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Learning</Label>
                        <p className="text-sm text-muted-foreground">Automatically learn from market events</p>
                      </div>
                      <Switch 
                        checked={knowledgeSystem.autoLearning}
                        onCheckedChange={(checked) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          autoLearning: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Insight Generation</Label>
                        <p className="text-sm text-muted-foreground">Generate market insights automatically</p>
                      </div>
                      <Switch 
                        checked={knowledgeSystem.insightGeneration}
                        onCheckedChange={(checked) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          insightGeneration: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Knowledge Validation</Label>
                        <p className="text-sm text-muted-foreground">Validate knowledge entries for accuracy</p>
                      </div>
                      <Switch 
                        checked={knowledgeSystem.knowledgeValidation}
                        onCheckedChange={(checked) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          knowledgeValidation: checked 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="confidenceThreshold">Confidence Threshold (%)</Label>
                      <Input
                        id="confidenceThreshold"
                        type="number"
                        value={knowledgeSystem.confidenceThreshold}
                        onChange={(e) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          confidenceThreshold: parseInt(e.target.value) || 70 
                        }))}
                        min="50"
                        max="95"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxEntries">Max Knowledge Entries</Label>
                      <Input
                        id="maxEntries"
                        type="number"
                        value={knowledgeSystem.maxEntries}
                        onChange={(e) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          maxEntries: parseInt(e.target.value) || 5000 
                        }))}
                        min="100"
                        max="50000"
                        step="100"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Updates</Label>
                        <p className="text-sm text-muted-foreground">Update knowledge in real-time</p>
                      </div>
                      <Switch 
                        checked={knowledgeSystem.realTimeUpdates}
                        onCheckedChange={(checked) => setKnowledgeSystem(prev => ({ 
                          ...prev, 
                          realTimeUpdates: checked 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {knowledgeSystem.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {knowledgeSystem.enabled ? 'Knowledge Base Active' : 'Knowledge Base Inactive'}
            </span>
            {knowledgeSystem.autoLearning && (
              <Badge variant="outline" className="ml-2">
                Auto-learning enabled
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Agent: {agentId} • {knowledgeMetrics.totalEntries} knowledge entries • {knowledgeMetrics.validatedEntries} validated
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentKnowledgeBase