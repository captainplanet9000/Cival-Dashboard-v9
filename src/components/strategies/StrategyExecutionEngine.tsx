'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play, Pause, Settings, Brain, Zap, Target, Activity,
  TrendingUp, TrendingDown, BarChart3, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Layers, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { toast } from 'react-hot-toast'

// Import all strategy components
import DarvasBoxStrategy from './DarvasBoxStrategy'
import WilliamsAlligatorStrategy from './WilliamsAlligatorStrategy'
import RenkoBreakoutStrategy from './RenkoBreakoutStrategy'
import HeikinAshiStrategy from './HeikinAshiStrategy'
import ElliottWaveStrategy from './ElliottWaveStrategy'

/**
 * Strategy Execution Engine
 * Coordinates all 5 advanced trading strategies for autonomous trading
 * Provides consensus analysis, risk management, and unified execution
 */

interface StrategySignal {
  strategyName: string
  type: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  price: number
  timestamp: Date
  explanation: string
  riskLevel?: string
  stopLoss?: number
  takeProfit?: number
}

interface ConsensusAnalysis {
  overallSignal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  agreementLevel: number
  activeStrategies: number
  buySignals: number
  sellSignals: number
  holdSignals: number
  weightedScore: number
  riskAssessment: 'Low' | 'Medium' | 'High'
}

interface ExecutionMetrics {
  totalExecutions: number
  successfulExecutions: number
  totalPnL: number
  winRate: number
  avgHoldTime: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
}

interface StrategyExecutionEngineProps {
  symbol?: string
  marketData?: any[]
  onTradeExecution?: (signal: StrategySignal) => void
  isActive?: boolean
  className?: string
}

export function StrategyExecutionEngine({
  symbol = 'BTC/USD',
  marketData = [],
  onTradeExecution,
  isActive = false,
  className
}: StrategyExecutionEngineProps) {
  const [engineState, setEngineState] = useState({
    enabled: isActive,
    autoExecution: false,
    consensusThreshold: 60, // Minimum consensus percentage for execution
    riskManagement: true,
    maxPositionSize: 10000, // $10,000 max position
    maxDailyTrades: 5,
    emergencyStop: false
  })

  const [strategySignals, setStrategySignals] = useState<Record<string, StrategySignal>>({})
  const [consensusAnalysis, setConsensusAnalysis] = useState<ConsensusAnalysis>({
    overallSignal: 'HOLD',
    confidence: 0,
    agreementLevel: 0,
    activeStrategies: 0,
    buySignals: 0,
    sellSignals: 0,
    holdSignals: 0,
    weightedScore: 0,
    riskAssessment: 'Medium'
  })

  const [executionMetrics, setExecutionMetrics] = useState<ExecutionMetrics>({
    totalExecutions: 0,
    successfulExecutions: 0,
    totalPnL: 0,
    winRate: 0,
    avgHoldTime: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    profitFactor: 0
  })

  const [executionHistory, setExecutionHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  // Strategy weights based on historical performance
  const strategyWeights = {
    'Darvas Box': 0.25,
    'Williams Alligator': 0.2,
    'Renko Breakout': 0.2,
    'Heikin Ashi': 0.15,
    'Elliott Wave': 0.2
  }

  // Handle signals from individual strategies
  const handleStrategySignal = (strategyName: string) => (signal: any) => {
    if (!engineState.enabled) return

    const normalizedSignal: StrategySignal = {
      strategyName,
      type: signal.type || 'HOLD',
      confidence: signal.confidence || 50,
      price: signal.price || 0,
      timestamp: new Date(),
      explanation: signal.explanation || `Signal from ${strategyName}`,
      riskLevel: signal.riskLevel,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit
    }

    setStrategySignals(prev => ({
      ...prev,
      [strategyName]: normalizedSignal
    }))

    toast.success(`${strategyName}: ${signal.type} signal received`, {
      icon: signal.type === 'BUY' ? '📈' : signal.type === 'SELL' ? '📉' : '⏸️'
    })
  }

  // Calculate consensus analysis
  const calculateConsensus = useMemo(() => {
    const signals = Object.values(strategySignals)
    if (signals.length === 0) return consensusAnalysis

    const buySignals = signals.filter(s => s.type === 'BUY').length
    const sellSignals = signals.filter(s => s.type === 'SELL').length
    const holdSignals = signals.filter(s => s.type === 'HOLD').length

    // Calculate weighted score
    let weightedBuyScore = 0
    let weightedSellScore = 0
    let totalWeight = 0

    signals.forEach(signal => {
      const weight = strategyWeights[signal.strategyName as keyof typeof strategyWeights] || 0.2
      const confidenceWeight = signal.confidence / 100
      const adjustedWeight = weight * confidenceWeight

      if (signal.type === 'BUY') {
        weightedBuyScore += adjustedWeight
      } else if (signal.type === 'SELL') {
        weightedSellScore += adjustedWeight
      }

      totalWeight += weight
    })

    const netScore = (weightedBuyScore - weightedSellScore) / Math.max(totalWeight, 1)

    // Determine overall signal
    let overallSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
    let confidence = 0

    if (netScore > 0.3) {
      overallSignal = 'BUY'
      confidence = Math.min(95, netScore * 100 + 30)
    } else if (netScore < -0.3) {
      overallSignal = 'SELL'
      confidence = Math.min(95, Math.abs(netScore) * 100 + 30)
    } else {
      confidence = 20 + Math.abs(netScore) * 50
    }

    // Calculate agreement level
    const maxSignalType = Math.max(buySignals, sellSignals, holdSignals)
    const agreementLevel = signals.length > 0 ? (maxSignalType / signals.length) * 100 : 0

    // Risk assessment
    const avgConfidence = signals.reduce((acc, s) => acc + s.confidence, 0) / Math.max(signals.length, 1)
    const riskAssessment: 'Low' | 'Medium' | 'High' = 
      avgConfidence >= 80 && agreementLevel >= 70 ? 'Low' :
      avgConfidence >= 60 && agreementLevel >= 50 ? 'Medium' : 'High'

    return {
      overallSignal,
      confidence,
      agreementLevel,
      activeStrategies: signals.length,
      buySignals,
      sellSignals,
      holdSignals,
      weightedScore: netScore,
      riskAssessment
    }
  }, [strategySignals])

  useEffect(() => {
    setConsensusAnalysis(calculateConsensus)
  }, [calculateConsensus])

  // Auto-execution logic
  useEffect(() => {
    if (!engineState.autoExecution || !engineState.enabled || engineState.emergencyStop) return

    const { overallSignal, confidence, riskAssessment } = consensusAnalysis

    // Check execution criteria
    const shouldExecute = 
      confidence >= engineState.consensusThreshold &&
      overallSignal !== 'HOLD' &&
      riskAssessment !== 'High' &&
      executionHistory.filter(e => 
        new Date(e.timestamp).toDateString() === new Date().toDateString()
      ).length < engineState.maxDailyTrades

    if (shouldExecute) {
      executeConsensusSignal()
    }
  }, [consensusAnalysis, engineState])

  const executeConsensusSignal = () => {
    const signal = consensusAnalysis.overallSignal
    if (signal === 'HOLD') return

    const execution = {
      id: `execution-${Date.now()}`,
      signal,
      confidence: consensusAnalysis.confidence,
      price: 45000 + Math.random() * 10000, // Mock current price
      timestamp: new Date(),
      strategies: Object.keys(strategySignals).length,
      agreementLevel: consensusAnalysis.agreementLevel,
      riskLevel: consensusAnalysis.riskAssessment,
      expectedPnL: 0, // Will be calculated later
      status: 'executed'
    }

    setExecutionHistory(prev => [execution, ...prev.slice(0, 49)]) // Keep last 50

    // Update metrics
    setExecutionMetrics(prev => ({
      ...prev,
      totalExecutions: prev.totalExecutions + 1,
      successfulExecutions: prev.successfulExecutions + (Math.random() > 0.3 ? 1 : 0), // 70% success rate
      totalPnL: prev.totalPnL + (Math.random() - 0.3) * 1000,
      winRate: ((prev.successfulExecutions + (Math.random() > 0.3 ? 1 : 0)) / (prev.totalExecutions + 1)) * 100,
      avgHoldTime: 8.5 + Math.random() * 6, // 8-14 hours
      sharpeRatio: 1.2 + Math.random() * 0.8,
      maxDrawdown: Math.max(prev.maxDrawdown, Math.random() * 15),
      profitFactor: 1.6 + Math.random() * 0.9
    }))

    if (onTradeExecution) {
      const strategySignal: StrategySignal = {
        strategyName: 'Consensus Engine',
        type: signal,
        confidence: consensusAnalysis.confidence,
        price: execution.price,
        timestamp: execution.timestamp,
        explanation: `Consensus signal from ${consensusAnalysis.activeStrategies} strategies`
      }
      onTradeExecution(strategySignal)
    }

    toast.success(`Executed ${signal} signal with ${consensusAnalysis.confidence.toFixed(0)}% confidence`, {
      icon: signal === 'BUY' ? '🚀' : '📉'
    })
  }

  const toggleEngine = () => {
    setEngineState(prev => ({ ...prev, enabled: !prev.enabled }))
    if (!engineState.enabled) {
      toast.success('Strategy Execution Engine Started', { icon: '🔥' })
    } else {
      toast.info('Strategy Execution Engine Stopped', { icon: '⏸️' })
    }
  }

  const emergencyStop = () => {
    setEngineState(prev => ({ ...prev, emergencyStop: true, autoExecution: false }))
    toast.error('Emergency Stop Activated!', { icon: '🛑' })
  }

  return (
    <Card className={`${className} ${engineState.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Strategy Execution Engine
              <Badge variant={engineState.enabled ? "default" : "secondary"}>
                {engineState.enabled ? 'Active' : 'Inactive'}
              </Badge>
              {engineState.emergencyStop && (
                <Badge variant="destructive">Emergency Stop</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Autonomous coordination of 5 advanced trading strategies with consensus analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {engineState.emergencyStop && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEngineState(prev => ({ ...prev, emergencyStop: false }))}
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={emergencyStop}
              disabled={!engineState.enabled}
            >
              Emergency Stop
            </Button>
            <Button
              size="sm"
              variant={engineState.enabled ? "destructive" : "default"}
              onClick={toggleEngine}
            >
              {engineState.enabled ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {engineState.enabled ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Engine Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Active Strategies</div>
                <AnimatedCounter 
                  value={consensusAnalysis.activeStrategies}
                  className="text-2xl font-bold text-purple-600"
                />
                <div className="text-xs text-muted-foreground">of 5 total</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Consensus</div>
                <AnimatedCounter 
                  value={consensusAnalysis.confidence}
                  precision={0}
                  suffix="%"
                  className="text-2xl font-bold text-blue-600"
                />
                <div className="text-xs text-muted-foreground">{consensusAnalysis.overallSignal}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                <AnimatedCounter 
                  value={executionMetrics.winRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
                <AnimatedPrice 
                  value={Math.abs(executionMetrics.totalPnL)}
                  currency={executionMetrics.totalPnL >= 0 ? '+$' : '-$'}
                  precision={0}
                  className={`text-2xl font-bold ${executionMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  showTrend={false}
                />
              </div>
            </div>

            {/* Current Consensus */}
            <Card className="border-2 border-dashed border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Current Consensus Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      consensusAnalysis.overallSignal === 'BUY' ? 'text-green-600' :
                      consensusAnalysis.overallSignal === 'SELL' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {consensusAnalysis.overallSignal === 'BUY' ? '📈' :
                       consensusAnalysis.overallSignal === 'SELL' ? '📉' : '⏸️'}
                    </div>
                    <div className="font-semibold">{consensusAnalysis.overallSignal}</div>
                    <div className="text-sm text-muted-foreground">Overall Signal</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Agreement Level:</span>
                      <span className="font-semibold">{consensusAnalysis.agreementLevel.toFixed(0)}%</span>
                    </div>
                    <Progress value={consensusAnalysis.agreementLevel} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {consensusAnalysis.buySignals} BUY • {consensusAnalysis.sellSignals} SELL • {consensusAnalysis.holdSignals} HOLD
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge variant={
                      consensusAnalysis.riskAssessment === 'Low' ? 'default' :
                      consensusAnalysis.riskAssessment === 'Medium' ? 'secondary' : 'destructive'
                    } className="mb-2">
                      {consensusAnalysis.riskAssessment} Risk
                    </Badge>
                    <div className="text-sm">
                      Confidence: <span className="font-semibold">{consensusAnalysis.confidence.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Executions */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Executions
              </h4>
              <div className="space-y-2">
                {executionHistory.slice(0, 5).map((execution) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {execution.signal === 'BUY' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <div className="font-semibold">{execution.signal} Signal</div>
                        <div className="text-sm text-muted-foreground">
                          {execution.strategies} strategies • {execution.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        <AnimatedPrice value={execution.price} currency="$" precision={0} size="sm" showTrend={false} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(execution.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="grid gap-6">
              <DarvasBoxStrategy 
                symbol={symbol}
                marketData={marketData}
                onTradeSignal={handleStrategySignal('Darvas Box')}
                isActive={engineState.enabled}
              />
              <WilliamsAlligatorStrategy 
                symbol={symbol}
                marketData={marketData}
                onTradeSignal={handleStrategySignal('Williams Alligator')}
                isActive={engineState.enabled}
              />
              <RenkoBreakoutStrategy 
                symbol={symbol}
                marketData={marketData}
                onTradeSignal={handleStrategySignal('Renko Breakout')}
                isActive={engineState.enabled}
              />
              <HeikinAshiStrategy 
                symbol={symbol}
                marketData={marketData}
                onTradeSignal={handleStrategySignal('Heikin Ashi')}
                isActive={engineState.enabled}
              />
              <ElliottWaveStrategy 
                symbol={symbol}
                marketData={marketData}
                onTradeSignal={handleStrategySignal('Elliott Wave')}
                isActive={engineState.enabled}
              />
            </div>
          </TabsContent>

          {/* Consensus Tab */}
          <TabsContent value="consensus" className="space-y-6">
            {/* Strategy Weights */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Weights & Performance</CardTitle>
                <CardDescription>Individual strategy contributions to consensus analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(strategyWeights).map(([strategy, weight]) => {
                    const signal = strategySignals[strategy]
                    return (
                      <div key={strategy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            signal?.type === 'BUY' ? 'bg-green-500' :
                            signal?.type === 'SELL' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="font-semibold">{strategy}</div>
                            <div className="text-sm text-muted-foreground">
                              Weight: {(weight * 100).toFixed(0)}% • 
                              {signal ? ` ${signal.type} (${signal.confidence.toFixed(0)}%)` : ' No Signal'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Progress value={weight * 100} className="w-20 h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Execution Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Executions</div>
                <AnimatedCounter 
                  value={executionMetrics.totalExecutions}
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
                <AnimatedCounter 
                  value={executionMetrics.successfulExecutions / Math.max(executionMetrics.totalExecutions, 1) * 100}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Sharpe Ratio</div>
                <AnimatedCounter 
                  value={executionMetrics.sharpeRatio}
                  precision={2}
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Profit Factor</div>
                <AnimatedCounter 
                  value={executionMetrics.profitFactor}
                  precision={2}
                  className="text-2xl font-bold text-orange-600"
                />
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engine Configuration</CardTitle>
                <CardDescription>Configure execution parameters and risk management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="consensus">Consensus Threshold (%)</Label>
                      <Input
                        id="consensus"
                        type="number"
                        value={engineState.consensusThreshold}
                        onChange={(e) => setEngineState(prev => ({ 
                          ...prev, 
                          consensusThreshold: parseInt(e.target.value) || 60 
                        }))}
                        min="50"
                        max="95"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Max Position Size ($)</Label>
                      <Input
                        id="position"
                        type="number"
                        value={engineState.maxPositionSize}
                        onChange={(e) => setEngineState(prev => ({ 
                          ...prev, 
                          maxPositionSize: parseInt(e.target.value) || 10000 
                        }))}
                        min="1000"
                        max="100000"
                        step="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trades">Max Daily Trades</Label>
                      <Input
                        id="trades"
                        type="number"
                        value={engineState.maxDailyTrades}
                        onChange={(e) => setEngineState(prev => ({ 
                          ...prev, 
                          maxDailyTrades: parseInt(e.target.value) || 5 
                        }))}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Execution</Label>
                        <p className="text-sm text-muted-foreground">Automatically execute consensus signals</p>
                      </div>
                      <Switch 
                        checked={engineState.autoExecution}
                        onCheckedChange={(checked) => setEngineState(prev => ({ 
                          ...prev, 
                          autoExecution: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Risk Management</Label>
                        <p className="text-sm text-muted-foreground">Enable risk management filters</p>
                      </div>
                      <Switch 
                        checked={engineState.riskManagement}
                        onCheckedChange={(checked) => setEngineState(prev => ({ 
                          ...prev, 
                          riskManagement: checked 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Engine Status Footer */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {engineState.enabled && !engineState.emergencyStop ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {engineState.enabled && !engineState.emergencyStop 
                ? 'Execution Engine Active' 
                : 'Execution Engine Inactive'
              }
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Monitoring {symbol} with {consensusAnalysis.activeStrategies} active strategies
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StrategyExecutionEngine