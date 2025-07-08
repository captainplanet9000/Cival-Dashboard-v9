'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Brain, Cpu, Zap, Activity, TrendingUp, TrendingDown, 
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Star, Award, Target, BarChart3, PieChart, Users, Shield,
  Play, Pause, StopCircle, Eye, Download, Upload
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AI Provider Integration Hub Component
 * Manages multiple AI providers (Gemini, OpenAI, Claude) for enhanced trading decisions
 * Features provider comparison, model selection, and consensus analysis
 */

interface AIProvider {
  id: string
  name: string
  type: 'gemini' | 'openai' | 'claude' | 'custom'
  status: 'active' | 'inactive' | 'error' | 'maintenance'
  apiKey: string
  models: AIModel[]
  pricing: ProviderPricing
  capabilities: string[]
  performance: ProviderPerformance
  lastUsed: Date
  totalRequests: number
  successRate: number
}

interface AIModel {
  id: string
  name: string
  type: 'chat' | 'completion' | 'embedding' | 'vision'
  contextWindow: number
  maxTokens: number
  costPer1kTokens: number
  latency: number
  accuracy: number
  isAvailable: boolean
  specialties: string[]
}

interface ProviderPricing {
  inputCost: number
  outputCost: number
  currency: string
  billingModel: 'token' | 'request' | 'subscription'
  freeCredits: number
  usedCredits: number
}

interface ProviderPerformance {
  avgResponseTime: number
  uptime: number
  errorRate: number
  dailyRequests: number
  weeklyRequests: number
  monthlyRequests: number
  avgAccuracy: number
  trustScore: number
}

interface AIDecisionRequest {
  id: string
  prompt: string
  context: any
  requiredProviders: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timeout: number
  expectedFormat: 'json' | 'text' | 'structured'
}

interface AIDecisionResponse {
  providerId: string
  modelId: string
  response: any
  confidence: number
  processingTime: number
  tokensUsed: number
  cost: number
  timestamp: Date
  metadata: any
}

interface ConsensusAnalysis {
  requestId: string
  providers: string[]
  responses: AIDecisionResponse[]
  consensus: any
  confidence: number
  disagreement: number
  recommendedAction: string
  reasoning: string[]
  riskAssessment: 'low' | 'medium' | 'high'
}

interface AIProviderIntegrationHubProps {
  onDecisionMade?: (decision: ConsensusAnalysis) => void
  onProviderStatusChange?: (providerId: string, status: string) => void
  className?: string
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    status: 'active',
    apiKey: '',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        type: 'chat',
        contextWindow: 32768,
        maxTokens: 8192,
        costPer1kTokens: 0.0005,
        latency: 850,
        accuracy: 94.2,
        isAvailable: true,
        specialties: ['reasoning', 'analysis', 'code']
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        type: 'vision',
        contextWindow: 16384,
        maxTokens: 4096,
        costPer1kTokens: 0.0025,
        latency: 1200,
        accuracy: 91.8,
        isAvailable: true,
        specialties: ['chart-analysis', 'pattern-recognition']
      }
    ],
    pricing: {
      inputCost: 0.0005,
      outputCost: 0.0015,
      currency: 'USD',
      billingModel: 'token',
      freeCredits: 1000000,
      usedCredits: 245000
    },
    capabilities: ['chat', 'reasoning', 'analysis', 'vision', 'code'],
    performance: {
      avgResponseTime: 850,
      uptime: 99.8,
      errorRate: 0.2,
      dailyRequests: 1247,
      weeklyRequests: 8735,
      monthlyRequests: 35240,
      avgAccuracy: 94.2,
      trustScore: 9.6
    },
    lastUsed: new Date(Date.now() - 300000),
    totalRequests: 35240,
    successRate: 99.8
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    type: 'openai',
    status: 'active',
    apiKey: '',
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        type: 'chat',
        contextWindow: 128000,
        maxTokens: 4096,
        costPer1kTokens: 0.01,
        latency: 1200,
        accuracy: 96.1,
        isAvailable: true,
        specialties: ['reasoning', 'creativity', 'analysis']
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        type: 'chat',
        contextWindow: 16385,
        maxTokens: 4096,
        costPer1kTokens: 0.001,
        latency: 600,
        accuracy: 89.4,
        isAvailable: true,
        specialties: ['speed', 'general', 'efficiency']
      }
    ],
    pricing: {
      inputCost: 0.01,
      outputCost: 0.03,
      currency: 'USD',
      billingModel: 'token',
      freeCredits: 500000,
      usedCredits: 180000
    },
    capabilities: ['chat', 'reasoning', 'creativity', 'analysis', 'coding'],
    performance: {
      avgResponseTime: 900,
      uptime: 99.5,
      errorRate: 0.5,
      dailyRequests: 892,
      weeklyRequests: 6244,
      monthlyRequests: 25780,
      avgAccuracy: 92.8,
      trustScore: 9.2
    },
    lastUsed: new Date(Date.now() - 150000),
    totalRequests: 25780,
    successRate: 99.5
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    type: 'claude',
    status: 'active',
    apiKey: '',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        type: 'chat',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kTokens: 0.015,
        latency: 1100,
        accuracy: 97.3,
        isAvailable: true,
        specialties: ['reasoning', 'analysis', 'safety', 'ethics']
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        type: 'chat',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kTokens: 0.003,
        latency: 800,
        accuracy: 94.7,
        isAvailable: true,
        specialties: ['balance', 'efficiency', 'reasoning']
      }
    ],
    pricing: {
      inputCost: 0.003,
      outputCost: 0.015,
      currency: 'USD',
      billingModel: 'token',
      freeCredits: 750000,
      usedCredits: 165000
    },
    capabilities: ['chat', 'reasoning', 'analysis', 'safety', 'ethics'],
    performance: {
      avgResponseTime: 950,
      uptime: 99.7,
      errorRate: 0.3,
      dailyRequests: 654,
      weeklyRequests: 4578,
      monthlyRequests: 18960,
      avgAccuracy: 96.0,
      trustScore: 9.8
    },
    lastUsed: new Date(Date.now() - 45000),
    totalRequests: 18960,
    successRate: 99.7
  }
]

export function AIProviderIntegrationHub({
  onDecisionMade,
  onProviderStatusChange,
  className = ''
}: AIProviderIntegrationHubProps) {
  const [providers, setProviders] = useState<AIProvider[]>(AI_PROVIDERS)
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini')
  const [activeTab, setActiveTab] = useState('overview')
  const [isTestingProviders, setIsTestingProviders] = useState(false)
  const [consensusMode, setConsensusMode] = useState<'majority' | 'weighted' | 'unanimous'>('weighted')
  const [decisionHistory, setDecisionHistory] = useState<ConsensusAnalysis[]>([])
  
  // Provider configuration
  const [providerConfig, setProviderConfig] = useState({
    enableConsensus: true,
    minProviders: 2,
    maxProviders: 3,
    timeoutMs: 30000,
    fallbackProvider: 'gemini',
    costThreshold: 0.1,
    qualityThreshold: 0.8
  })

  // Real-time metrics
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    avgResponseTime: 0,
    totalCost: 0,
    consensusAccuracy: 0,
    providerAgreement: 0
  })

  // Mock decision requests for demonstration
  const generateMockDecisionRequest = (): AIDecisionRequest => ({
    id: `req-${Date.now()}`,
    prompt: `Analyze the current market conditions for BTC/USD and provide a trading recommendation. Consider technical indicators, volume patterns, and risk factors.`,
    context: {
      symbol: 'BTC/USD',
      currentPrice: 50234.56,
      priceChange24h: 2.34,
      volume24h: 28546789,
      technicalIndicators: {
        rsi: 67.4,
        macd: 'bullish',
        bollingerBands: 'neutral',
        movingAverage: 'above'
      }
    },
    requiredProviders: ['gemini', 'openai', 'claude'],
    priority: 'high',
    timeout: 30000,
    expectedFormat: 'json'
  })

  // Mock consensus analysis
  const generateMockConsensus = (): ConsensusAnalysis => ({
    requestId: `req-${Date.now()}`,
    providers: ['gemini', 'openai', 'claude'],
    responses: [
      {
        providerId: 'gemini',
        modelId: 'gemini-pro',
        response: { action: 'BUY', confidence: 0.78, reasoning: 'Strong technical momentum with volume confirmation' },
        confidence: 0.78,
        processingTime: 850,
        tokensUsed: 1247,
        cost: 0.0062,
        timestamp: new Date(),
        metadata: { version: '1.0', temperature: 0.7 }
      },
      {
        providerId: 'openai',
        modelId: 'gpt-4-turbo',
        response: { action: 'BUY', confidence: 0.82, reasoning: 'Bullish patterns emerging with good risk-reward ratio' },
        confidence: 0.82,
        processingTime: 1200,
        tokensUsed: 1156,
        cost: 0.0116,
        timestamp: new Date(),
        metadata: { version: '0613', temperature: 0.7 }
      },
      {
        providerId: 'claude',
        modelId: 'claude-3-sonnet',
        response: { action: 'HOLD', confidence: 0.71, reasoning: 'Market conditions are favorable but risk management suggests caution' },
        confidence: 0.71,
        processingTime: 800,
        tokensUsed: 1089,
        cost: 0.0033,
        timestamp: new Date(),
        metadata: { version: '20240229', temperature: 0.7 }
      }
    ],
    consensus: { action: 'BUY', confidence: 0.77 },
    confidence: 0.77,
    disagreement: 0.33,
    recommendedAction: 'BUY with reduced position size due to some uncertainty',
    reasoning: [
      'Two providers recommend BUY with high confidence',
      'Strong technical indicators support bullish sentiment',
      'Risk management considerations suggest careful position sizing'
    ],
    riskAssessment: 'medium'
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update provider performance metrics
      setProviders(prev => prev.map(provider => ({
        ...provider,
        performance: {
          ...provider.performance,
          dailyRequests: provider.performance.dailyRequests + Math.floor(Math.random() * 5),
          avgResponseTime: provider.performance.avgResponseTime + (Math.random() - 0.5) * 100,
          uptime: Math.min(100, provider.performance.uptime + (Math.random() - 0.5) * 0.1)
        },
        pricing: {
          ...provider.pricing,
          usedCredits: provider.pricing.usedCredits + Math.floor(Math.random() * 10)
        }
      })))

      // Update global metrics
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 3),
        successfulRequests: prev.successfulRequests + Math.floor(Math.random() * 3),
        avgResponseTime: 900 + Math.random() * 200,
        totalCost: prev.totalCost + Math.random() * 0.01,
        consensusAccuracy: 85 + Math.random() * 10,
        providerAgreement: 70 + Math.random() * 20
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleTestProviders = async () => {
    setIsTestingProviders(true)
    
    // Simulate testing each provider
    for (const provider of providers) {
      setProviders(prev => prev.map(p => 
        p.id === provider.id ? { ...p, status: 'active' } : p
      ))
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setIsTestingProviders(false)
  }

  const handleMakeDecision = async () => {
    const request = generateMockDecisionRequest()
    
    // Simulate consensus analysis
    setTimeout(() => {
      const consensus = generateMockConsensus()
      setDecisionHistory(prev => [consensus, ...prev.slice(0, 9)])
      onDecisionMade?.(consensus)
    }, 2000)
  }

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const selectedProviderData = providers.find(p => p.id === selectedProvider)

  const performanceComparisonData = providers.map(provider => ({
    name: provider.name,
    accuracy: provider.performance.avgAccuracy,
    speed: 2000 - provider.performance.avgResponseTime,
    uptime: provider.performance.uptime,
    cost: (1 / provider.pricing.inputCost) * 100,
    trust: provider.performance.trustScore * 10
  }))

  const usageData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    gemini: Math.floor(Math.random() * 100) + 50,
    openai: Math.floor(Math.random() * 80) + 40,
    claude: Math.floor(Math.random() * 60) + 30,
    total: 0
  })).map(item => ({
    ...item,
    total: item.gemini + item.openai + item.claude
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Provider Integration Hub</h1>
            <p className="text-sm text-gray-600">Multi-LLM decision making with consensus analysis</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {providers.filter(p => p.status === 'active').length} Active
          </Badge>
          <Button
            onClick={handleTestProviders}
            disabled={isTestingProviders}
            variant="outline"
            size="sm"
          >
            {isTestingProviders ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Activity className="w-4 h-4 mr-1" />}
            {isTestingProviders ? 'Testing...' : 'Test All'}
          </Button>
          <Button onClick={handleMakeDecision} size="sm">
            <Zap className="w-4 h-4 mr-1" />
            Make Decision
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={metrics.totalRequests} />
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((metrics.successfulRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={metrics.avgResponseTime} suffix="ms" />
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: &lt;1000ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consensus Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={metrics.consensusAccuracy} suffix="%" />
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.providerAgreement.toFixed(1)}% agreement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedPrice value={metrics.totalCost} prefix="$" />
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Status */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Status</CardTitle>
                <CardDescription>Real-time status of all AI providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          provider.status === 'active' ? 'bg-green-500' :
                          provider.status === 'error' ? 'bg-red-500' :
                          provider.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-gray-600">
                            {provider.models.length} models • {provider.performance.uptime.toFixed(1)}% uptime
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getProviderStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {provider.performance.dailyRequests} requests today
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Usage</CardTitle>
                <CardDescription>Requests per hour by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="gemini" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="openai" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="claude" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Decisions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Consensus Decisions</CardTitle>
              <CardDescription>Latest AI-powered trading decisions with consensus analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {decisionHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No decisions made yet. Click "Make Decision" to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {decisionHistory.slice(0, 3).map((decision, index) => (
                    <motion.div
                      key={decision.requestId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={decision.consensus.action === 'BUY' ? 'default' : 
                                         decision.consensus.action === 'SELL' ? 'destructive' : 'secondary'}>
                            {decision.consensus.action}
                          </Badge>
                          <span className="text-sm font-medium">
                            Confidence: {(decision.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Badge className={`${
                          decision.riskAssessment === 'low' ? 'bg-green-100 text-green-800' :
                          decision.riskAssessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {decision.riskAssessment} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.recommendedAction}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{decision.providers.length} providers</span>
                        <span>{(decision.disagreement * 100).toFixed(0)}% disagreement</span>
                        <span>{decision.responses.reduce((sum, r) => sum + r.cost, 0).toFixed(4)} cost</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>{provider.name}</span>
                    </CardTitle>
                    <Badge className={getProviderStatusColor(provider.status)}>
                      {provider.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {provider.performance.avgAccuracy.toFixed(1)}%
                      </div>
                      <div className="text-xs text-blue-700">Accuracy</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {provider.performance.avgResponseTime}ms
                      </div>
                      <div className="text-xs text-green-700">Avg Speed</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uptime</span>
                      <span>{provider.performance.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={provider.performance.uptime} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Credits Used</span>
                      <span>
                        {((provider.pricing.usedCredits / provider.pricing.freeCredits) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={(provider.pricing.usedCredits / provider.pricing.freeCredits) * 100} 
                      className="h-2" 
                    />
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Models: {provider.models.length}</div>
                    <div>Requests: {provider.totalRequests.toLocaleString()}</div>
                    <div>Trust Score: {provider.performance.trustScore}/10</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Comparison</CardTitle>
              <CardDescription>Multi-dimensional analysis of AI provider capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceComparisonData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar name="Performance" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Speed" dataKey="speed" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Reliability" dataKey="uptime" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Consensus Configuration</CardTitle>
                <CardDescription>Configure how AI providers reach consensus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Consensus Mode</Label>
                  <Select value={consensusMode} onValueChange={(value) => setConsensusMode(value as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="majority">Majority Vote</SelectItem>
                      <SelectItem value="weighted">Weighted by Accuracy</SelectItem>
                      <SelectItem value="unanimous">Unanimous Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Consensus</Label>
                    <p className="text-sm text-gray-600">Use multiple providers for decisions</p>
                  </div>
                  <Switch
                    checked={providerConfig.enableConsensus}
                    onCheckedChange={(checked) => 
                      setProviderConfig(prev => ({ ...prev, enableConsensus: checked }))
                    }
                  />
                </div>

                <div>
                  <Label>Minimum Providers: {providerConfig.minProviders}</Label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={providerConfig.minProviders}
                    onChange={(e) => 
                      setProviderConfig(prev => ({ ...prev, minProviders: Number(e.target.value) }))
                    }
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={providerConfig.timeoutMs}
                    onChange={(e) => 
                      setProviderConfig(prev => ({ ...prev, timeoutMs: Number(e.target.value) }))
                    }
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision Analytics</CardTitle>
                <CardDescription>Analysis of consensus decision patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {decisionHistory.filter(d => d.consensus.action === 'BUY').length}
                      </div>
                      <div className="text-xs text-green-700">Buy Decisions</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        {decisionHistory.filter(d => d.consensus.action === 'SELL').length}
                      </div>
                      <div className="text-xs text-red-700">Sell Decisions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-600">
                        {decisionHistory.filter(d => d.consensus.action === 'HOLD').length}
                      </div>
                      <div className="text-xs text-gray-700">Hold Decisions</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Confidence</span>
                      <span>
                        {decisionHistory.length > 0 
                          ? (decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / decisionHistory.length * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={decisionHistory.length > 0 
                        ? decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / decisionHistory.length * 100
                        : 0} 
                      className="h-2" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Provider Agreement</span>
                      <span>
                        {decisionHistory.length > 0 
                          ? ((1 - decisionHistory.reduce((sum, d) => sum + d.disagreement, 0) / decisionHistory.length) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={decisionHistory.length > 0 
                        ? (1 - decisionHistory.reduce((sum, d) => sum + d.disagreement, 0) / decisionHistory.length) * 100
                        : 0} 
                      className="h-2" 
                    />
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