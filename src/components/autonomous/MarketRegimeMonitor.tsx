'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, 
  BarChart3, LineChart, Target, Zap, RefreshCw, Timer, 
  ArrowUpRight, ArrowDownRight, Minus, Eye, Settings,
  ShieldCheck, AlertCircle, Brain, Gauge
} from 'lucide-react'

// Types matching the backend service
interface MarketConditions {
  timestamp: string
  volatility_1d: number
  volatility_7d: number
  volatility_30d: number
  trend_strength: number
  momentum: number
  volume_ratio: number
  correlation_breakdown: boolean
  vix_level: number
  economic_indicators: Record<string, number>
  sector_rotation: Record<string, number>
}

interface RegimeDetection {
  regime_id: string
  primary_regime: string
  secondary_regimes: string[]
  confidence: string
  probability_scores: Record<string, number>
  market_conditions: MarketConditions
  detected_at: string
  expected_duration?: number
  risk_level: number
  recommended_actions: string[]
  metadata: any
}

interface StrategyAdaptation {
  adaptation_id: string
  target_strategy: string
  current_allocation: number
  recommended_allocation: number
  adaptation_actions: string[]
  risk_adjustment: number
  expected_impact: Record<string, number>
  implementation_priority: number
  rationale: string
  created_at: string
  expires_at?: string
}

interface RegimeTransition {
  transition_id: string
  from_regime: string
  to_regime: string
  transition_probability: number
  transition_speed: number
  impact_assessment: Record<string, number>
  adaptation_triggers: string[]
  occurred_at: string
}

export default function MarketRegimeMonitor() {
  const [currentRegime, setCurrentRegime] = useState<RegimeDetection | null>(null)
  const [regimeHistory, setRegimeHistory] = useState<RegimeDetection[]>([])
  const [adaptations, setAdaptations] = useState<StrategyAdaptation[]>([])
  const [transitions, setTransitions] = useState<RegimeTransition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Mock data that matches the backend service
  useEffect(() => {
    const mockMarketConditions: MarketConditions = {
      timestamp: new Date().toISOString(),
      volatility_1d: 0.025,
      volatility_7d: 0.018,
      volatility_30d: 0.022,
      trend_strength: 0.35,
      momentum: 0.12,
      volume_ratio: 1.15,
      correlation_breakdown: false,
      vix_level: 18.5,
      economic_indicators: {
        unemployment: 3.8,
        inflation: 2.3,
        interest_rate: 5.25,
        gdp_growth: 2.4
      },
      sector_rotation: {
        technology: 0.08,
        healthcare: 0.05,
        financials: -0.03,
        energy: 0.12,
        utilities: -0.02
      }
    }

    const mockCurrentRegime: RegimeDetection = {
      regime_id: 'regime-001',
      primary_regime: 'bull_market',
      secondary_regimes: ['trending', 'low_volatility'],
      confidence: 'high',
      probability_scores: {
        bull_market: 0.75,
        trending: 0.65,
        low_volatility: 0.55,
        bear_market: 0.15,
        high_volatility: 0.25,
        sideways: 0.30
      },
      market_conditions: mockMarketConditions,
      detected_at: new Date(Date.now() - 600000).toISOString(),
      expected_duration: 7776000, // 90 days
      risk_level: 0.35,
      recommended_actions: ['increase_position', 'change_strategy'],
      metadata: {
        detection_model: 'rule_based_v1',
        data_points_used: 1000
      }
    }

    const mockRegimeHistory: RegimeDetection[] = [
      mockCurrentRegime,
      {
        regime_id: 'regime-002',
        primary_regime: 'sideways',
        secondary_regimes: ['low_volatility'],
        confidence: 'medium',
        probability_scores: {
          sideways: 0.60,
          low_volatility: 0.50,
          bull_market: 0.35,
          bear_market: 0.20
        },
        market_conditions: mockMarketConditions,
        detected_at: new Date(Date.now() - 1800000).toISOString(),
        expected_duration: 2592000, // 30 days
        risk_level: 0.25,
        recommended_actions: ['rebalance_portfolio', 'change_strategy'],
        metadata: {}
      }
    ]

    const mockAdaptations: StrategyAdaptation[] = [
      {
        adaptation_id: 'adapt-001',
        target_strategy: 'momentum_strategy',
        current_allocation: 0.25,
        recommended_allocation: 0.35,
        adaptation_actions: ['increase_position', 'adjust_risk_params'],
        risk_adjustment: -0.05,
        expected_impact: {
          return_change: 0.02,
          risk_change: -0.05
        },
        implementation_priority: 1,
        rationale: 'Bull market regime favors momentum strategies with increased allocation',
        created_at: new Date(Date.now() - 300000).toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString()
      },
      {
        adaptation_id: 'adapt-002',
        target_strategy: 'mean_reversion_strategy',
        current_allocation: 0.30,
        recommended_allocation: 0.20,
        adaptation_actions: ['decrease_position', 'adjust_risk_params'],
        risk_adjustment: 0.10,
        expected_impact: {
          return_change: -0.01,
          risk_change: 0.10
        },
        implementation_priority: 2,
        rationale: 'Bull market regime suggests reducing mean reversion exposure',
        created_at: new Date(Date.now() - 300000).toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString()
      }
    ]

    const mockTransitions: RegimeTransition[] = [
      {
        transition_id: 'trans-001',
        from_regime: 'sideways',
        to_regime: 'bull_market',
        transition_probability: 0.75,
        transition_speed: 0.8,
        impact_assessment: {
          portfolio_risk_change: -0.05,
          expected_return_change: 0.08,
          adaptation_urgency: 0.6
        },
        adaptation_triggers: ['increase_position', 'change_strategy'],
        occurred_at: new Date(Date.now() - 600000).toISOString()
      }
    ]

    setCurrentRegime(mockCurrentRegime)
    setRegimeHistory(mockRegimeHistory)
    setAdaptations(mockAdaptations)
    setTransitions(mockTransitions)
    setIsLoading(false)
  }, [])

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate regime probability fluctuations
      if (currentRegime) {
        const updatedRegime = {
          ...currentRegime,
          probability_scores: {
            ...currentRegime.probability_scores,
            bull_market: Math.max(0.5, Math.min(0.9, currentRegime.probability_scores.bull_market + (Math.random() - 0.5) * 0.1)),
            trending: Math.max(0.4, Math.min(0.8, currentRegime.probability_scores.trending + (Math.random() - 0.5) * 0.1))
          },
          risk_level: Math.max(0.1, Math.min(0.8, currentRegime.risk_level + (Math.random() - 0.5) * 0.1))
        }
        setCurrentRegime(updatedRegime)
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, currentRegime])

  const getRegimeIcon = (regime: string) => {
    switch (regime) {
      case 'bull_market': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'bear_market': return <TrendingDown className="h-5 w-5 text-red-600" />
      case 'sideways': return <Minus className="h-5 w-5 text-gray-600" />
      case 'high_volatility': return <Activity className="h-5 w-5 text-orange-600" />
      case 'low_volatility': return <Activity className="h-5 w-5 text-blue-600" />
      case 'trending': return <TrendingUp className="h-5 w-5 text-purple-600" />
      case 'mean_reverting': return <BarChart3 className="h-5 w-5 text-indigo-600" />
      case 'crisis': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'recovery': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Eye className="h-5 w-5 text-gray-600" />
    }
  }

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'bull_market': return 'text-green-600 bg-green-50 border-green-200'
      case 'bear_market': return 'text-red-600 bg-red-50 border-red-200'
      case 'sideways': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'high_volatility': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low_volatility': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'trending': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'mean_reverting': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      case 'crisis': return 'text-red-600 bg-red-50 border-red-200'
      case 'recovery': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high': return 'text-green-600'
      case 'high': return 'text-blue-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'increase_position': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'decrease_position': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'change_strategy': return <RefreshCw className="h-4 w-4 text-blue-600" />
      case 'adjust_risk_params': return <Settings className="h-4 w-4 text-purple-600" />
      case 'pause_trading': return <Timer className="h-4 w-4 text-orange-600" />
      case 'resume_trading': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'emergency_exit': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'rebalance_portfolio': return <Target className="h-4 w-4 text-indigo-600" />
      default: return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading market regime analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Regime Monitor</h2>
          <p className="text-muted-foreground">
            AI-powered market condition analysis and strategy adaptation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current Regime Overview */}
      {currentRegime && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-2 ${getRegimeColor(currentRegime.primary_regime)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Regime</p>
                  <p className="text-xl font-bold capitalize">
                    {currentRegime.primary_regime.replace('_', ' ')}
                  </p>
                </div>
                {getRegimeIcon(currentRegime.primary_regime)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className={`text-xl font-bold capitalize ${getConfidenceColor(currentRegime.confidence)}`}>
                    {currentRegime.confidence}
                  </p>
                </div>
                <Brain className={`h-8 w-8 ${getConfidenceColor(currentRegime.confidence)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className="text-xl font-bold">
                    {(currentRegime.risk_level * 100).toFixed(1)}%
                  </p>
                </div>
                <Gauge className={`h-8 w-8 ${
                  currentRegime.risk_level > 0.7 ? 'text-red-600' : 
                  currentRegime.risk_level > 0.4 ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Adaptations</p>
                  <p className="text-xl font-bold">
                    {adaptations.length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="adaptations">Adaptations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Regime Probabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Regime Probability Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentRegime && Object.entries(currentRegime.probability_scores)
                  .sort(([,a], [,b]) => b - a)
                  .map(([regime, probability]) => (
                    <div key={regime} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRegimeIcon(regime)}
                          <span className="capitalize">{regime.replace('_', ' ')}</span>
                        </div>
                        <span className="font-medium">{(probability * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={probability * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRegime?.recommended_actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    {getActionIcon(action)}
                    <span className="capitalize">{action.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          {/* Market Conditions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Volatility Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentRegime && [
                  { label: '1-Day Volatility', value: currentRegime.market_conditions.volatility_1d },
                  { label: '7-Day Volatility', value: currentRegime.market_conditions.volatility_7d },
                  { label: '30-Day Volatility', value: currentRegime.market_conditions.volatility_30d }
                ].map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{metric.label}</span>
                      <span>{(metric.value * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={metric.value * 200} className="h-2" /> {/* Scale for visibility */}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentRegime && [
                  { label: 'Trend Strength', value: currentRegime.market_conditions.trend_strength },
                  { label: 'Momentum', value: currentRegime.market_conditions.momentum },
                  { label: 'Volume Ratio', value: currentRegime.market_conditions.volume_ratio - 1 }
                ].map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{metric.label}</span>
                      <span>{(metric.value * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.abs(metric.value) * 100} 
                      className={`h-2 ${metric.value < 0 ? 'bg-red-100' : 'bg-green-100'}`} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Economic Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Economic Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentRegime && Object.entries(currentRegime.market_conditions.economic_indicators).map(([indicator, value]) => (
                  <div key={indicator} className="text-center">
                    <div className="text-sm text-muted-foreground capitalize">{indicator.replace('_', ' ')}</div>
                    <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-4">
          {/* Strategy Adaptations */}
          <div className="grid grid-cols-1 gap-4">
            {adaptations.map(adaptation => (
              <Card key={adaptation.adaptation_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      <span className="capitalize">{adaptation.target_strategy.replace('_', ' ')}</span>
                    </div>
                    <Badge variant={adaptation.implementation_priority === 1 ? 'default' : 'secondary'}>
                      Priority {adaptation.implementation_priority}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{adaptation.rationale}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Allocation</div>
                        <div className="text-2xl font-bold">{(adaptation.current_allocation * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Recommended Allocation</div>
                        <div className="text-2xl font-bold">{(adaptation.recommended_allocation * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Change</div>
                        <div className={`text-2xl font-bold ${
                          adaptation.recommended_allocation > adaptation.current_allocation ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {((adaptation.recommended_allocation - adaptation.current_allocation) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {adaptation.adaptation_actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                          {getActionIcon(action)}
                          <span className="text-sm capitalize">{action.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Regime History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Regime Detection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {regimeHistory.map(regime => (
                  <div key={regime.regime_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRegimeIcon(regime.primary_regime)}
                      <div>
                        <div className="font-medium capitalize">{regime.primary_regime.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(regime.detected_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getConfidenceColor(regime.confidence)}>
                        {regime.confidence}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {regime.expected_duration ? formatDuration(regime.expected_duration) : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Regime Transitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transitions.map(transition => (
                  <div key={transition.transition_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRegimeIcon(transition.from_regime)}
                        <ArrowDownRight className="h-4 w-4 text-gray-400" />
                        {getRegimeIcon(transition.to_regime)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {transition.from_regime.replace('_', ' ')} → {transition.to_regime.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transition.occurred_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{(transition.transition_probability * 100).toFixed(1)}% probability</div>
                      <div className="text-sm text-muted-foreground">
                        Speed: {(transition.transition_speed * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}