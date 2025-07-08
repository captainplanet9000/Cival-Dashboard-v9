'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Brain, Cpu, Zap, Activity, TrendingUp, TrendingDown, 
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Star, Award, Target, BarChart3, PieChart, Users, Shield,
  Play, Pause, StopCircle, Eye, Download, Upload, ArrowRight,
  MessageSquare, Layers, GitBranch, Gauge, Timer, Sparkles
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, PieChart as RechartsPieChart, Cell
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Multi-LLM Decision Making Engine Component
 * Coordinates decisions across multiple AI providers for enhanced trading intelligence
 * Features consensus analysis, model comparison, and weighted decision making
 */

interface LLMProvider {
  id: string
  name: string
  type: 'gemini' | 'openai' | 'claude' | 'custom'
  model: string
  status: 'active' | 'inactive' | 'error' | 'rate_limited'
  weight: number
  confidence: number
  responseTime: number
  accuracy: number
  costPerToken: number
  tokensUsed: number
  dailyRequests: number
  requestLimit: number
  specialties: string[]
  lastUsed: Date
}

interface TradingDecision {
  id: string
  timestamp: Date
  symbol: string
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  price: number
  reasoning: string
  providerId: string
  providerName: string
  processingTime: number
  tokensUsed: number
  cost: number
  metadata: {
    technicalAnalysis: any
    fundamentalAnalysis: any
    riskAssessment: any
    timeframe: string
  }
}

interface ConsensusDecision {
  id: string
  timestamp: Date
  symbol: string
  finalAction: 'BUY' | 'SELL' | 'HOLD'
  consensusStrength: number
  weightedConfidence: number
  participatingProviders: string[]
  individualDecisions: TradingDecision[]
  divergenceScore: number
  reasoning: string
  riskLevel: 'low' | 'medium' | 'high'
  recommendedPosition: number
  stopLoss: number
  takeProfit: number
  executionPriority: 'urgent' | 'normal' | 'delayed'
}

interface DecisionMetrics {
  totalDecisions: number
  consensusRate: number
  avgProcessingTime: number
  avgConfidence: number
  providerAgreement: number
  accuracyScore: number
  profitability: number
  riskAdjustedReturn: number
  sharpeRatio: number
  maxDrawdown: number
}

const MOCK_PROVIDERS: LLMProvider[] = [
  {
    id: 'gemini-pro',
    name: 'Google Gemini Pro',
    type: 'gemini',
    model: 'gemini-pro-1.5',
    status: 'active',
    weight: 0.35,
    confidence: 87.5,
    responseTime: 2.3,
    accuracy: 78.2,
    costPerToken: 0.0015,
    tokensUsed: 245780,
    dailyRequests: 1432,
    requestLimit: 2000,
    specialties: ['Technical Analysis', 'Pattern Recognition', 'Market Sentiment'],
    lastUsed: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4 Turbo',
    type: 'openai',
    model: 'gpt-4-turbo',
    status: 'active',
    weight: 0.4,
    confidence: 91.2,
    responseTime: 1.8,
    accuracy: 82.1,
    costPerToken: 0.003,
    tokensUsed: 189432,
    dailyRequests: 987,
    requestLimit: 1500,
    specialties: ['Fundamental Analysis', 'News Analysis', 'Risk Assessment'],
    lastUsed: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: 'claude-3-sonnet',
    name: 'Anthropic Claude 3 Sonnet',
    type: 'claude',
    model: 'claude-3-sonnet-20240229',
    status: 'active',
    weight: 0.25,
    confidence: 89.7,
    responseTime: 2.1,
    accuracy: 79.8,
    costPerToken: 0.0025,
    tokensUsed: 156890,
    dailyRequests: 654,
    requestLimit: 1000,
    specialties: ['Economic Analysis', 'Long-term Trends', 'Volatility Prediction'],
    lastUsed: new Date(Date.now() - 8 * 60 * 1000)
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

interface MultiLLMDecisionEngineProps {
  symbol?: string
  onDecisionMade?: (decision: ConsensusDecision) => void
  className?: string
}

export function MultiLLMDecisionEngine({
  symbol = 'BTC/USD',
  onDecisionMade,
  className = ''
}: MultiLLMDecisionEngineProps) {
  const [providers, setProviders] = useState<LLMProvider[]>(MOCK_PROVIDERS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentDecision, setCurrentDecision] = useState<ConsensusDecision | null>(null)
  const [decisionHistory, setDecisionHistory] = useState<ConsensusDecision[]>([])
  const [metrics, setMetrics] = useState<DecisionMetrics>({
    totalDecisions: 0,
    consensusRate: 0,
    avgProcessingTime: 0,
    avgConfidence: 0,
    providerAgreement: 0,
    accuracyScore: 0,
    profitability: 0,
    riskAdjustedReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  })
  const [settings, setSettings] = useState({
    minConsensusThreshold: 0.6,
    maxProcessingTime: 10,
    enableAutoExecution: false,
    riskTolerance: 'medium',
    requireUnanimous: false,
    enableRealTimeAnalysis: true,
    analysisInterval: 30 // seconds
  })

  // Mock market data for analysis
  const marketData = useMemo(() => {
    const basePrice = 45000
    const data = []
    for (let i = 0; i < 50; i++) {
      const price = basePrice + (Math.random() - 0.5) * 5000
      data.push({
        timestamp: new Date(Date.now() - (50 - i) * 60 * 1000),
        price,
        volume: 1000000 + Math.random() * 2000000,
        volatility: 0.15 + Math.random() * 0.1,
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish'
      })
    }
    return data
  }, [])

  // Generate individual provider decisions
  const generateProviderDecisions = useCallback(async (prompt: string, context: any) => {
    const decisions: TradingDecision[] = []
    
    for (const provider of providers) {
      if (provider.status !== 'active') continue
      
      // Simulate provider-specific decision making
      const processingTime = provider.responseTime + Math.random() * 0.5
      const baseConfidence = provider.confidence + (Math.random() - 0.5) * 10
      
      // Provider-specific biases
      let action: 'BUY' | 'SELL' | 'HOLD'
      let confidence = Math.max(50, Math.min(95, baseConfidence))
      
      if (provider.type === 'gemini') {
        // Gemini tends to be more technical analysis focused
        action = Math.random() > 0.4 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD'
        confidence *= 0.95 // Slightly more conservative
      } else if (provider.type === 'openai') {
        // OpenAI tends to be more fundamental analysis focused
        action = Math.random() > 0.35 ? 'BUY' : Math.random() > 0.6 ? 'SELL' : 'HOLD'
        confidence *= 1.02 // Slightly more confident
      } else if (provider.type === 'claude') {
        // Claude tends to be more cautious
        action = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.7 ? 'SELL' : 'HOLD'
        confidence *= 0.92 // More conservative
      } else {
        action = Math.random() > 0.5 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD'
      }
      
      const tokensUsed = 150 + Math.floor(Math.random() * 100)
      const cost = tokensUsed * provider.costPerToken
      
      decisions.push({
        id: `decision-${provider.id}-${Date.now()}`,
        timestamp: new Date(),
        symbol,
        action,
        confidence,
        price: marketData[marketData.length - 1].price,
        reasoning: `Based on ${provider.specialties.join(', ')} analysis, ${action} signal detected with ${confidence.toFixed(1)}% confidence`,
        providerId: provider.id,
        providerName: provider.name,
        processingTime,
        tokensUsed,
        cost,
        metadata: {
          technicalAnalysis: {
            rsi: 45 + Math.random() * 40,
            macd: (Math.random() - 0.5) * 2,
            support: marketData[marketData.length - 1].price * 0.95,
            resistance: marketData[marketData.length - 1].price * 1.05
          },
          fundamentalAnalysis: {
            marketCap: 850000000000,
            volume24h: 25000000000,
            news_sentiment: Math.random() > 0.5 ? 'positive' : 'negative'
          },
          riskAssessment: {
            volatility: 0.15 + Math.random() * 0.1,
            liquidity: 'high',
            correlation: Math.random() - 0.5
          },
          timeframe: '1h'
        }
      })
    }
    
    return decisions
  }, [providers, symbol, marketData])

  // Calculate consensus decision
  const calculateConsensus = useCallback((decisions: TradingDecision[]) => {
    if (decisions.length === 0) return null
    
    const activeProviders = providers.filter(p => p.status === 'active')
    const totalWeight = activeProviders.reduce((sum, p) => sum + p.weight, 0)
    
    // Calculate weighted scores for each action
    const actionScores = { BUY: 0, SELL: 0, HOLD: 0 }
    let totalWeightedConfidence = 0
    
    decisions.forEach(decision => {
      const provider = providers.find(p => p.id === decision.providerId)
      if (!provider) return
      
      const weight = provider.weight
      const score = (decision.confidence / 100) * weight
      
      actionScores[decision.action] += score
      totalWeightedConfidence += decision.confidence * weight
    })
    
    // Determine final action
    const finalAction = Object.entries(actionScores).reduce((a, b) => 
      actionScores[a[0] as keyof typeof actionScores] > actionScores[b[0] as keyof typeof actionScores] ? a : b
    )[0] as 'BUY' | 'SELL' | 'HOLD'
    
    // Calculate consensus strength
    const maxScore = Math.max(...Object.values(actionScores))
    const consensusStrength = maxScore / totalWeight
    
    // Calculate divergence score
    const actionCounts = { BUY: 0, SELL: 0, HOLD: 0 }
    decisions.forEach(d => actionCounts[d.action]++)
    const maxCount = Math.max(...Object.values(actionCounts))
    const divergenceScore = 1 - (maxCount / decisions.length)
    
    // Calculate risk level
    const avgVolatility = decisions.reduce((sum, d) => sum + d.metadata.riskAssessment.volatility, 0) / decisions.length
    const riskLevel = avgVolatility > 0.2 ? 'high' : avgVolatility > 0.1 ? 'medium' : 'low'
    
    const currentPrice = marketData[marketData.length - 1].price
    
    const consensusDecision: ConsensusDecision = {
      id: `consensus-${Date.now()}`,
      timestamp: new Date(),
      symbol,
      finalAction,
      consensusStrength,
      weightedConfidence: totalWeightedConfidence / totalWeight,
      participatingProviders: decisions.map(d => d.providerName),
      individualDecisions: decisions,
      divergenceScore,
      reasoning: `${decisions.length} AI providers analyzed ${symbol}. Consensus: ${finalAction} with ${(consensusStrength * 100).toFixed(1)}% strength`,
      riskLevel,
      recommendedPosition: finalAction === 'BUY' ? 0.1 : finalAction === 'SELL' ? -0.1 : 0,
      stopLoss: finalAction === 'BUY' ? currentPrice * 0.95 : finalAction === 'SELL' ? currentPrice * 1.05 : currentPrice,
      takeProfit: finalAction === 'BUY' ? currentPrice * 1.1 : finalAction === 'SELL' ? currentPrice * 0.9 : currentPrice,
      executionPriority: consensusStrength > 0.8 ? 'urgent' : consensusStrength > 0.6 ? 'normal' : 'delayed'
    }
    
    return consensusDecision
  }, [providers, symbol, marketData])

  // Perform multi-LLM analysis
  const performAnalysis = useCallback(async () => {
    if (isAnalyzing) return
    
    setIsAnalyzing(true)
    
    try {
      // Generate analysis prompt
      const prompt = `Analyze ${symbol} for trading opportunities. Consider current market conditions, technical indicators, and risk factors.`
      const context = {
        symbol,
        currentPrice: marketData[marketData.length - 1].price,
        marketData: marketData.slice(-10),
        timeframe: '1h'
      }
      
      // Get decisions from all providers
      const decisions = await generateProviderDecisions(prompt, context)
      
      // Calculate consensus
      const consensus = calculateConsensus(decisions)
      
      if (consensus) {
        setCurrentDecision(consensus)
        setDecisionHistory(prev => [consensus, ...prev].slice(0, 50))
        
        // Update metrics
        const newMetrics = {
          totalDecisions: decisionHistory.length + 1,
          consensusRate: (decisionHistory.filter(d => d.consensusStrength > 0.6).length + (consensus.consensusStrength > 0.6 ? 1 : 0)) / (decisionHistory.length + 1),
          avgProcessingTime: decisions.reduce((sum, d) => sum + d.processingTime, 0) / decisions.length,
          avgConfidence: consensus.weightedConfidence,
          providerAgreement: 1 - consensus.divergenceScore,
          accuracyScore: 75 + Math.random() * 15,
          profitability: 8.5 + Math.random() * 12,
          riskAdjustedReturn: 1.2 + Math.random() * 0.8,
          sharpeRatio: 1.5 + Math.random() * 0.5,
          maxDrawdown: 15 + Math.random() * 10
        }
        setMetrics(newMetrics)
        
        // Update provider usage stats
        setProviders(prev => prev.map(provider => {
          const decision = decisions.find(d => d.providerId === provider.id)
          if (decision) {
            return {
              ...provider,
              tokensUsed: provider.tokensUsed + decision.tokensUsed,
              dailyRequests: provider.dailyRequests + 1,
              lastUsed: new Date()
            }
          }
          return provider
        }))
        
        // Trigger callback
        if (onDecisionMade) {
          onDecisionMade(consensus)
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, symbol, marketData, generateProviderDecisions, calculateConsensus, decisionHistory, onDecisionMade])

  // Auto-analysis interval
  useEffect(() => {
    if (!settings.enableRealTimeAnalysis) return
    
    const interval = setInterval(() => {
      performAnalysis()
    }, settings.analysisInterval * 1000)
    
    return () => clearInterval(interval)
  }, [settings.enableRealTimeAnalysis, settings.analysisInterval, performAnalysis])

  // Chart data for provider comparison
  const providerComparisonData = useMemo(() => {
    return providers.map(provider => ({
      name: provider.name.split(' ')[0],
      accuracy: provider.accuracy,
      confidence: provider.confidence,
      responseTime: provider.responseTime,
      weight: provider.weight * 100,
      dailyRequests: provider.dailyRequests,
      cost: provider.tokensUsed * provider.costPerToken
    }))
  }, [providers])

  // Decision timeline data
  const decisionTimelineData = useMemo(() => {
    return decisionHistory.slice(0, 20).reverse().map((decision, index) => ({
      index,
      timestamp: decision.timestamp.toLocaleTimeString(),
      action: decision.finalAction,
      confidence: decision.weightedConfidence,
      consensus: decision.consensusStrength * 100,
      providers: decision.participatingProviders.length
    }))
  }, [decisionHistory])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Multi-LLM Decision Engine
                <Badge variant={currentDecision ? "default" : "secondary"}>
                  {currentDecision ? 'Active' : 'Standby'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Coordinated AI analysis from {providers.filter(p => p.status === 'active').length} providers
                • {symbol} • Real-time consensus
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Decision */}
      <AnimatePresence>
        {currentDecision && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className={`border-l-4 ${
              currentDecision.finalAction === 'BUY' ? 'border-green-500 bg-green-50' :
              currentDecision.finalAction === 'SELL' ? 'border-red-500 bg-red-50' :
              'border-gray-500 bg-gray-50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentDecision.finalAction === 'BUY' ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : currentDecision.finalAction === 'SELL' ? (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    ) : (
                      <Activity className="h-6 w-6 text-gray-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {currentDecision.finalAction} {currentDecision.symbol}
                      </CardTitle>
                      <CardDescription>
                        {currentDecision.participatingProviders.length} providers • 
                        {currentDecision.consensusStrength > 0.8 ? ' Strong' : currentDecision.consensusStrength > 0.6 ? ' Moderate' : ' Weak'} consensus
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      <AnimatedCounter
                        value={currentDecision.weightedConfidence}
                        precision={1}
                        suffix="%"
                      />
                    </div>
                    <Badge variant="outline" className={`${
                      currentDecision.executionPriority === 'urgent' ? 'border-red-500 text-red-600' :
                      currentDecision.executionPriority === 'normal' ? 'border-blue-500 text-blue-600' :
                      'border-gray-500 text-gray-600'
                    }`}>
                      {currentDecision.executionPriority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-muted-foreground">Consensus Strength</div>
                    <div className="text-lg font-semibold">
                      {(currentDecision.consensusStrength * 100).toFixed(1)}%
                    </div>
                    <Progress value={currentDecision.consensusStrength * 100} className="mt-2" />
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                    <div className="text-lg font-semibold capitalize">
                      {currentDecision.riskLevel}
                    </div>
                    <Badge variant={
                      currentDecision.riskLevel === 'high' ? 'destructive' :
                      currentDecision.riskLevel === 'medium' ? 'default' : 'secondary'
                    } className="mt-2">
                      {currentDecision.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-muted-foreground">Divergence</div>
                    <div className="text-lg font-semibold">
                      {(currentDecision.divergenceScore * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentDecision.divergenceScore < 0.3 ? 'Low' : currentDecision.divergenceScore < 0.6 ? 'Medium' : 'High'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-sm text-muted-foreground">Providers</div>
                    <div className="text-lg font-semibold">
                      {currentDecision.participatingProviders.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Reasoning:</div>
                  <p className="text-sm text-muted-foreground">{currentDecision.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map(provider => (
              <Card key={provider.id} className={`${
                provider.status === 'active' ? 'border-green-200' : 'border-gray-200'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {provider.model} • Weight: {(provider.weight * 100).toFixed(0)}%
                      </CardDescription>
                    </div>
                    <Badge variant={
                      provider.status === 'active' ? 'default' :
                      provider.status === 'error' ? 'destructive' :
                      provider.status === 'rate_limited' ? 'secondary' : 'outline'
                    }>
                      {provider.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy:</span>
                      <span className="font-medium">{provider.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence:</span>
                      <span className="font-medium">{provider.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Response Time:</span>
                      <span className="font-medium">{provider.responseTime.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Daily Requests:</span>
                      <span className="font-medium">
                        {provider.dailyRequests}/{provider.requestLimit}
                      </span>
                    </div>
                    <Progress 
                      value={(provider.dailyRequests / provider.requestLimit) * 100} 
                      className="h-2" 
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.specialties.map(specialty => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Provider Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={providerComparisonData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.1}
                    />
                    <Radar
                      name="Confidence"
                      dataKey="confidence"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consensus Tab */}
        <TabsContent value="consensus" className="space-y-4">
          {currentDecision && (
            <Card>
              <CardHeader>
                <CardTitle>Individual Provider Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentDecision.individualDecisions.map(decision => (
                    <div key={decision.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            decision.action === 'BUY' ? 'default' :
                            decision.action === 'SELL' ? 'destructive' : 'secondary'
                          }>
                            {decision.action}
                          </Badge>
                          <span className="font-medium">{decision.providerName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {decision.confidence.toFixed(1)}% • {decision.processingTime.toFixed(1)}s
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{decision.reasoning}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Tokens: {decision.tokensUsed} • Cost: ${decision.cost.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={decisionTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Confidence"
                    />
                    <Line
                      type="monotone"
                      dataKey="consensus"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Consensus"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {decisionHistory.slice(0, 10).map(decision => (
                  <div key={decision.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        decision.finalAction === 'BUY' ? 'default' :
                        decision.finalAction === 'SELL' ? 'destructive' : 'secondary'
                      }>
                        {decision.finalAction}
                      </Badge>
                      <div>
                        <div className="font-medium">{decision.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {decision.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{decision.weightedConfidence.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        {decision.participatingProviders.length} providers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedCounter value={metrics.totalDecisions} />
                </div>
                <div className="text-sm text-muted-foreground">Total Decisions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedCounter value={metrics.consensusRate * 100} precision={1} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Consensus Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedCounter value={metrics.avgConfidence} precision={1} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter value={metrics.avgProcessingTime} precision={1} suffix="s" />
                </div>
                <div className="text-sm text-muted-foreground">Avg Processing</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Provider Agreement:</span>
                    <span className="font-medium">{(metrics.providerAgreement * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy Score:</span>
                    <span className="font-medium">{metrics.accuracyScore.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profitability:</span>
                    <span className="font-medium">{metrics.profitability.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Risk-Adjusted Return:</span>
                    <span className="font-medium">{metrics.riskAdjustedReturn.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-medium">{metrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-medium">{metrics.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Engine Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consensusThreshold">Min Consensus Threshold</Label>
                  <Input
                    id="consensusThreshold"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1"
                    value={settings.minConsensusThreshold}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      minConsensusThreshold: parseFloat(e.target.value) || 0.6
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processingTime">Max Processing Time (s)</Label>
                  <Input
                    id="processingTime"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.maxProcessingTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      maxProcessingTime: parseInt(e.target.value) || 10
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select
                    value={settings.riskTolerance}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      riskTolerance: value as 'low' | 'medium' | 'high'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysisInterval">Analysis Interval (s)</Label>
                  <Input
                    id="analysisInterval"
                    type="number"
                    min="10"
                    max="300"
                    value={settings.analysisInterval}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      analysisInterval: parseInt(e.target.value) || 30
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoExecution">Enable Auto Execution</Label>
                  <Switch
                    id="autoExecution"
                    checked={settings.enableAutoExecution}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      enableAutoExecution: checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireUnanimous">Require Unanimous Decisions</Label>
                  <Switch
                    id="requireUnanimous"
                    checked={settings.requireUnanimous}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      requireUnanimous: checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="realTimeAnalysis">Enable Real-time Analysis</Label>
                  <Switch
                    id="realTimeAnalysis"
                    checked={settings.enableRealTimeAnalysis}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      enableRealTimeAnalysis: checked
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MultiLLMDecisionEngine