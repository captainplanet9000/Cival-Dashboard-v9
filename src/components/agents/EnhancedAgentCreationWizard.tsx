'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot, TrendingUp, Shield, Zap, DollarSign, AlertTriangle, CheckCircle2,
  Info, Sliders, Target, BarChart3, Brain, Settings, ArrowRight, ArrowLeft,
  Sparkles, Eye, Activity, Clock, User, Cpu, Database, Rocket, Star
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import our advanced strategy components
import { DarvasBoxStrategy } from '@/components/strategies/DarvasBoxStrategy'
import { WilliamsAlligatorStrategy } from '@/components/strategies/WilliamsAlligatorStrategy'
import { RenkoBreakoutStrategy } from '@/components/strategies/RenkoBreakoutStrategy'
import { HeikinAshiStrategy } from '@/components/strategies/HeikinAshiStrategy'
import { ElliottWaveStrategy } from '@/components/strategies/ElliottWaveStrategy'
import { StrategyExecutionEngine } from '@/components/strategies/StrategyExecutionEngine'

/**
 * Enhanced Agent Creation Wizard
 * Integrates advanced trading strategies with comprehensive agent configuration
 * Features strategy preview, backtesting, and autonomous agent deployment
 */

interface AgentConfig {
  // Basic Configuration
  name: string
  description: string
  avatar: string
  
  // Strategy Configuration
  selectedStrategies: string[]
  strategyWeights: Record<string, number>
  strategyParameters: Record<string, any>
  executionMode: 'consensus' | 'weighted' | 'sequential' | 'parallel'
  
  // Capital & Risk Management
  initialCapital: number
  maxPositionSize: number
  maxDailyLoss: number
  maxDrawdown: number
  maxLeverage: number
  allowedSymbols: string[]
  
  // AI & Learning Configuration
  enableLearning: boolean
  enableMemory: boolean
  enableDecisionHistory: boolean
  enableKnowledgeBase: boolean
  learningRate: number
  memoryCapacity: number
  
  // Autonomous Features
  enableAutoTrading: boolean
  enableRiskManagement: boolean
  enablePerformanceMonitoring: boolean
  enableAlerts: boolean
  
  // Advanced Settings
  executionSpeed: 'conservative' | 'balanced' | 'aggressive'
  marketSessions: string[]
  backtestPeriod: number
  paperTradingDuration: number
}

interface StrategyTemplate {
  id: string
  name: string
  description: string
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  riskLevel: 'low' | 'medium' | 'high'
  category: 'trend' | 'momentum' | 'reversal' | 'arbitrage' | 'pattern'
  component: React.ComponentType<any>
  defaultParams: Record<string, any>
  recommendedCapital: number
  averageReturn: number
  winRate: number
  maxDrawdown: number
  popularity: number
}

const STRATEGY_TEMPLATES: Record<string, StrategyTemplate> = {
  darvas_box: {
    id: 'darvas_box',
    name: 'Darvas Box Strategy',
    description: 'Advanced box breakout pattern detection with volume confirmation and momentum analysis',
    complexity: 'intermediate',
    riskLevel: 'medium',
    category: 'pattern',
    component: DarvasBoxStrategy,
    defaultParams: {
      volumeThreshold: 1.5,
      breakoutConfirmation: 2,
      boxMinHeight: 0.02,
      boxMaxAge: 30,
      stopLoss: 0.03,
      takeProfit: 0.08
    },
    recommendedCapital: 10000,
    averageReturn: 18.5,
    winRate: 68.2,
    maxDrawdown: 12.8,
    popularity: 85
  },
  williams_alligator: {
    id: 'williams_alligator',
    name: 'Williams Alligator',
    description: 'Sophisticated trend-following system using alligator indicator phases',
    complexity: 'advanced',
    riskLevel: 'medium',
    category: 'trend',
    component: WilliamsAlligatorStrategy,
    defaultParams: {
      jawPeriod: 13,
      jawShift: 8,
      teethPeriod: 8,
      teethShift: 5,
      lipsPeriod: 5,
      lipsShift: 3,
      awakePeriod: 3
    },
    recommendedCapital: 15000,
    averageReturn: 22.1,
    winRate: 71.5,
    maxDrawdown: 15.2,
    popularity: 92
  },
  renko_breakout: {
    id: 'renko_breakout',
    name: 'Renko Breakout System',
    description: 'Noise-filtered breakout trading using Renko brick patterns',
    complexity: 'beginner',
    riskLevel: 'low',
    category: 'pattern',
    component: RenkoBreakoutStrategy,
    defaultParams: {
      brickSize: 0.001,
      confirmationBricks: 2,
      reversalBricks: 3,
      volumeFilter: true,
      stopLoss: 0.02,
      takeProfit: 0.06
    },
    recommendedCapital: 5000,
    averageReturn: 14.8,
    winRate: 62.3,
    maxDrawdown: 8.5,
    popularity: 78
  },
  heikin_ashi: {
    id: 'heikin_ashi',
    name: 'Heikin Ashi Trend',
    description: 'Modified candlestick analysis for smooth trend identification',
    complexity: 'intermediate',
    riskLevel: 'low',
    category: 'trend',
    component: HeikinAshiStrategy,
    defaultParams: {
      trendStrength: 3,
      reversalCandles: 2,
      confirmationPeriod: 4,
      dojiTolerance: 0.0001,
      stopLoss: 0.025,
      takeProfit: 0.075
    },
    recommendedCapital: 8000,
    averageReturn: 16.2,
    winRate: 65.8,
    maxDrawdown: 10.1,
    popularity: 89
  },
  elliott_wave: {
    id: 'elliott_wave',
    name: 'Elliott Wave Pattern',
    description: 'Advanced wave pattern recognition with Fibonacci analysis',
    complexity: 'expert',
    riskLevel: 'high',
    category: 'pattern',
    component: ElliottWaveStrategy,
    defaultParams: {
      waveDegree: 'minor',
      fibonacciLevels: [0.236, 0.382, 0.5, 0.618, 0.786],
      waveConfirmation: 0.8,
      minimumWaveSize: 0.01,
      stopLoss: 0.04,
      takeProfit: 0.1
    },
    recommendedCapital: 25000,
    averageReturn: 28.7,
    winRate: 58.9,
    maxDrawdown: 22.5,
    popularity: 73
  }
}

interface EnhancedAgentCreationWizardProps {
  onAgentCreated?: (config: AgentConfig) => void
  onClose?: () => void
  className?: string
}

export function EnhancedAgentCreationWizard({
  onAgentCreated,
  onClose,
  className = ''
}: EnhancedAgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [previewStrategy, setPreviewStrategy] = useState<string | null>(null)
  const [showBacktest, setShowBacktest] = useState(false)
  const [config, setConfig] = useState<AgentConfig>({
    // Basic Configuration
    name: '',
    description: '',
    avatar: 'default',
    
    // Strategy Configuration
    selectedStrategies: ['darvas_box'],
    strategyWeights: { darvas_box: 100 },
    strategyParameters: { darvas_box: STRATEGY_TEMPLATES.darvas_box.defaultParams },
    executionMode: 'consensus',
    
    // Capital & Risk Management
    initialCapital: 10000,
    maxPositionSize: 10,
    maxDailyLoss: 500,
    maxDrawdown: 20,
    maxLeverage: 1,
    allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    
    // AI & Learning Configuration
    enableLearning: true,
    enableMemory: true,
    enableDecisionHistory: true,
    enableKnowledgeBase: true,
    learningRate: 0.1,
    memoryCapacity: 10000,
    
    // Autonomous Features
    enableAutoTrading: true,
    enableRiskManagement: true,
    enablePerformanceMonitoring: true,
    enableAlerts: true,
    
    // Advanced Settings
    executionSpeed: 'balanced',
    marketSessions: ['us', 'eu', 'asia'],
    backtestPeriod: 90,
    paperTradingDuration: 30
  })

  const totalSteps = 6
  const progressPercentage = (currentStep / totalSteps) * 100

  const handleStrategyToggle = (strategyId: string) => {
    setConfig(prev => {
      const isSelected = prev.selectedStrategies.includes(strategyId)
      const newSelectedStrategies = isSelected
        ? prev.selectedStrategies.filter(id => id !== strategyId)
        : [...prev.selectedStrategies, strategyId]
      
      // Update weights to be evenly distributed
      const newWeights: Record<string, number> = {}
      const weightPerStrategy = 100 / newSelectedStrategies.length
      newSelectedStrategies.forEach(id => {
        newWeights[id] = weightPerStrategy
      })
      
      // Update parameters
      const newParameters = { ...prev.strategyParameters }
      if (!isSelected) {
        newParameters[strategyId] = STRATEGY_TEMPLATES[strategyId].defaultParams
      } else {
        delete newParameters[strategyId]
      }
      
      return {
        ...prev,
        selectedStrategies: newSelectedStrategies,
        strategyWeights: newWeights,
        strategyParameters: newParameters
      }
    })
  }

  const handleWeightChange = (strategyId: string, weight: number) => {
    setConfig(prev => ({
      ...prev,
      strategyWeights: {
        ...prev.strategyWeights,
        [strategyId]: weight
      }
    }))
  }

  const handleParameterChange = (strategyId: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      strategyParameters: {
        ...prev.strategyParameters,
        [strategyId]: {
          ...prev.strategyParameters[strategyId],
          [key]: value
        }
      }
    }))
  }

  const calculateRecommendedCapital = () => {
    return Math.max(
      ...config.selectedStrategies.map(id => STRATEGY_TEMPLATES[id].recommendedCapital)
    )
  }

  const calculateExpectedReturn = () => {
    return config.selectedStrategies.reduce((sum, id) => {
      const weight = config.strategyWeights[id] / 100
      return sum + (STRATEGY_TEMPLATES[id].averageReturn * weight)
    }, 0)
  }

  const calculateExpectedDrawdown = () => {
    return config.selectedStrategies.reduce((sum, id) => {
      const weight = config.strategyWeights[id] / 100
      return sum + (STRATEGY_TEMPLATES[id].maxDrawdown * weight)
    }, 0)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateAgent = async () => {
    setIsCreating(true)
    try {
      // Simulate agent creation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Agent "${config.name}" created successfully!`)
      onAgentCreated?.(config)
      onClose?.()
    } catch (error) {
      toast.error('Failed to create agent')
    } finally {
      setIsCreating(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicConfiguration()
      case 2:
        return renderStrategySelection()
      case 3:
        return renderStrategyConfiguration()
      case 4:
        return renderRiskManagement()
      case 5:
        return renderAIConfiguration()
      case 6:
        return renderReviewAndDeploy()
      default:
        return null
    }
  }

  const renderBasicConfiguration = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Bot className="w-16 h-16 text-blue-600 mx-auto" />
        <h2 className="text-2xl font-bold">Create Your Trading Agent</h2>
        <p className="text-gray-600">Let's start by configuring the basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="initialCapital">Initial Capital</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="initialCapital"
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                className="pl-10 mt-1"
                placeholder="10000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="avatar">Avatar Style</Label>
            <Select value={config.avatar} onValueChange={(value) => setConfig(prev => ({ ...prev, avatar: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Bot</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="futuristic">Futuristic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your agent's purpose and trading style..."
              className="mt-1 min-h-[120px]"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Setup Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose a descriptive name for easy identification</li>
              <li>• Start with at least $5,000 for optimal performance</li>
              <li>• Add detailed description for better organization</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStrategySelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Target className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold">Choose Trading Strategies</h2>
        <p className="text-gray-600">Select one or more strategies for your agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(STRATEGY_TEMPLATES).map(([id, strategy]) => (
          <Card
            key={id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              config.selectedStrategies.includes(id) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleStrategyToggle(id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {strategy.complexity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {strategy.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {strategy.averageReturn}% avg
                  </div>
                  <div className="text-xs text-gray-500">
                    {strategy.winRate}% win rate
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {strategy.popularity}% popularity
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewStrategy(id)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  {config.selectedStrategies.includes(id) && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {config.selectedStrategies.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">
            Selected Strategies ({config.selectedStrategies.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.selectedStrategies.map(id => (
              <Badge key={id} variant="outline" className="bg-white">
                {STRATEGY_TEMPLATES[id].name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Preview Modal */}
      <AnimatePresence>
        {previewStrategy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setPreviewStrategy(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">
                    {STRATEGY_TEMPLATES[previewStrategy].name} Preview
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewStrategy(null)}
                  >
                    Close
                  </Button>
                </div>
                <div className="h-96">
                  {React.createElement(STRATEGY_TEMPLATES[previewStrategy].component, {
                    isPreview: true,
                    className: "h-full"
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const renderStrategyConfiguration = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Sliders className="w-16 h-16 text-purple-600 mx-auto" />
        <h2 className="text-2xl font-bold">Configure Strategy Parameters</h2>
        <p className="text-gray-600">Fine-tune your strategies for optimal performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Weights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.selectedStrategies.map(id => (
                <div key={id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">
                      {STRATEGY_TEMPLATES[id].name}
                    </Label>
                    <span className="text-sm text-gray-600">
                      {config.strategyWeights[id]?.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.strategyWeights[id] || 0}
                    onChange={(e) => handleWeightChange(id, Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={config.executionMode}
                onValueChange={(value) => setConfig(prev => ({ ...prev, executionMode: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consensus">Consensus (All agree)</SelectItem>
                  <SelectItem value="weighted">Weighted (By allocation)</SelectItem>
                  <SelectItem value="sequential">Sequential (One at a time)</SelectItem>
                  <SelectItem value="parallel">Parallel (All active)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Projection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {calculateExpectedReturn().toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Expected Return</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {calculateExpectedDrawdown().toFixed(1)}%
                  </div>
                  <div className="text-sm text-red-700">Max Drawdown</div>
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  ${calculateRecommendedCapital().toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Recommended Capital</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Backtest</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowBacktest(true)}
                className="w-full"
                variant="outline"
              >
                <Activity className="w-4 h-4 mr-2" />
                Run Backtest
              </Button>
              {showBacktest && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded mb-2"></div>
                    <div className="text-sm text-gray-600">
                      Running backtest simulation...
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )

  const renderRiskManagement = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Shield className="w-16 h-16 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold">Risk Management</h2>
        <p className="text-gray-600">Configure safety parameters for your agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Position & Loss Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Maximum Position Size (%)</Label>
                <Input
                  type="number"
                  value={config.maxPositionSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxPositionSize: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Maximum Daily Loss ($)</Label>
                <Input
                  type="number"
                  value={config.maxDailyLoss}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxDailyLoss: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Maximum Drawdown (%)</Label>
                <Input
                  type="number"
                  value={config.maxDrawdown}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxDrawdown: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Maximum Leverage</Label>
                <Input
                  type="number"
                  value={config.maxLeverage}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxLeverage: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Risk Management</Label>
                  <p className="text-sm text-gray-600">Automatic stop-loss and take-profit</p>
                </div>
                <Switch
                  checked={config.enableRiskManagement}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableRiskManagement: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Performance Monitoring</Label>
                  <p className="text-sm text-gray-600">Real-time performance tracking</p>
                </div>
                <Switch
                  checked={config.enablePerformanceMonitoring}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enablePerformanceMonitoring: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Risk Alerts</Label>
                  <p className="text-sm text-gray-600">Notifications for risk events</p>
                </div>
                <Switch
                  checked={config.enableAlerts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAlerts: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 'us', name: 'US Session', time: '9:30 AM - 4:00 PM EST' },
                  { id: 'eu', name: 'European Session', time: '8:00 AM - 4:30 PM CET' },
                  { id: 'asia', name: 'Asian Session', time: '9:00 AM - 3:00 PM JST' }
                ].map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{session.name}</div>
                      <div className="text-sm text-gray-600">{session.time}</div>
                    </div>
                    <Switch
                      checked={config.marketSessions.includes(session.id)}
                      onCheckedChange={(checked) => {
                        setConfig(prev => ({
                          ...prev,
                          marketSessions: checked
                            ? [...prev.marketSessions, session.id]
                            : prev.marketSessions.filter(s => s !== session.id)
                        }))
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )

  const renderAIConfiguration = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Brain className="w-16 h-16 text-purple-600 mx-auto" />
        <h2 className="text-2xl font-bold">AI & Learning Configuration</h2>
        <p className="text-gray-600">Enable advanced AI features for your agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Machine Learning</Label>
                  <p className="text-sm text-gray-600">Adaptive strategy optimization</p>
                </div>
                <Switch
                  checked={config.enableLearning}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableLearning: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Agent Memory</Label>
                  <p className="text-sm text-gray-600">Pattern recognition and storage</p>
                </div>
                <Switch
                  checked={config.enableMemory}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableMemory: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Decision History</Label>
                  <p className="text-sm text-gray-600">Track and analyze decisions</p>
                </div>
                <Switch
                  checked={config.enableDecisionHistory}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableDecisionHistory: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Knowledge Base</Label>
                  <p className="text-sm text-gray-600">Market insights and wisdom</p>
                </div>
                <Switch
                  checked={config.enableKnowledgeBase}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableKnowledgeBase: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Learning Rate</Label>
                <div className="mt-2">
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={config.learningRate}
                    onChange={(e) => setConfig(prev => ({ ...prev, learningRate: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {config.learningRate.toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <Label>Memory Capacity</Label>
                <Input
                  type="number"
                  value={config.memoryCapacity}
                  onChange={(e) => setConfig(prev => ({ ...prev, memoryCapacity: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Execution Speed</Label>
                <Select
                  value={config.executionSpeed}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, executionSpeed: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Backtest Period (days)</Label>
                <Input
                  type="number"
                  value={config.backtestPeriod}
                  onChange={(e) => setConfig(prev => ({ ...prev, backtestPeriod: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Paper Trading Duration (days)</Label>
                <Input
                  type="number"
                  value={config.paperTradingDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, paperTradingDuration: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )

  const renderReviewAndDeploy = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Rocket className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold">Review & Deploy</h2>
        <p className="text-gray-600">Review your agent configuration and deploy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{config.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Initial Capital:</span>
                <span className="font-medium">${config.initialCapital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Strategies:</span>
                <span className="font-medium">{config.selectedStrategies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Return:</span>
                <span className="font-medium text-green-600">{calculateExpectedReturn().toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Drawdown:</span>
                <span className="font-medium text-red-600">{calculateExpectedDrawdown().toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.selectedStrategies.map(id => (
                  <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{STRATEGY_TEMPLATES[id].name}</div>
                      <div className="text-sm text-gray-600">
                        {STRATEGY_TEMPLATES[id].category} • {STRATEGY_TEMPLATES[id].riskLevel} risk
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {config.strategyWeights[id]?.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Position Size:</span>
                <span className="font-medium">{config.maxPositionSize}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Daily Loss:</span>
                <span className="font-medium">${config.maxDailyLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Drawdown:</span>
                <span className="font-medium">{config.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Leverage:</span>
                <span className="font-medium">{config.maxLeverage}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trading Sessions:</span>
                <span className="font-medium">{config.marketSessions.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Machine Learning:</span>
                <span className="font-medium">{config.enableLearning ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Agent Memory:</span>
                <span className="font-medium">{config.enableMemory ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Decision History:</span>
                <span className="font-medium">{config.enableDecisionHistory ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Knowledge Base:</span>
                <span className="font-medium">{config.enableKnowledgeBase ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Learning Rate:</span>
                <span className="font-medium">{config.learningRate.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Deployment Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="font-medium">Instant Deploy</div>
            <div className="text-sm text-gray-600">Start trading immediately</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="font-medium">Paper Trading</div>
            <div className="text-sm text-gray-600">Test with virtual funds first</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div className="font-medium">Schedule Launch</div>
            <div className="text-sm text-gray-600">Deploy at specific time</div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Agent Creation</h1>
            <p className="text-gray-600 mt-1">
              Create sophisticated trading agents with advanced AI capabilities
            </p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {progressPercentage.toFixed(0)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreateAgent} disabled={isCreating}>
            {isCreating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Creating Agent...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Agent
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}