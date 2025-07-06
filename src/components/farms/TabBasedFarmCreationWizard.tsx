'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Alert } from '@/components/ui/feedback/alert'
import { Space } from '@/components/ui/layout/space'
import { Statistic } from '@/components/ui/data-display/statistic'
import { Loader2 } from 'lucide-react'
import {
  Target,
  Bot,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Settings,
  BarChart3,
  Plus,
  Save,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react'
import { paperTradingEngine, TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
import { backendApi } from '@/lib/api/backend-client'
import { toast } from 'react-hot-toast'

// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

interface FarmConfig {
  name: string
  description: string
  strategy: {
    type: TradingStrategy['type']
    name: string
    parameters: Record<string, any>
    description: string
  }
  riskLimits: RiskLimits
  agentCount: number
  initialCapitalPerAgent: number
  totalAllocatedCapital: number
  targetDailyProfit: number
  targetWinRate: number
  maxRiskPerTrade: number
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  profitDistribution: 'equal' | 'performance' | 'capital'
  autoScaling: boolean
  emergencyStopLoss: number
}

interface TabBasedFarmCreationWizardProps {
  onFarmCreated?: (farm: any) => void
  onCancel?: () => void
  className?: string
  onReturn?: () => void // To return to the farms list view
}

// Strategy templates (same as EnhancedFarmCreationWizard)
const STRATEGY_TEMPLATES = {
  momentum: {
    name: 'Momentum Trading',
    description: 'Follows price trends and momentum indicators',
    defaultParams: {
      threshold: 0.02,
      lookbackPeriod: 20,
      confirmationPeriod: 5,
      stopLoss: 0.05,
      takeProfit: 0.1
    },
    riskProfile: 'medium',
    recommendedAgents: { min: 3, max: 8, optimal: 5 }
  },
  mean_reversion: {
    name: 'Mean Reversion',
    description: 'Trades against extreme price movements expecting reversion',
    defaultParams: {
      threshold: 0.03,
      oversoldLevel: 0.3,
      overboughtLevel: 0.7,
      holdingPeriod: 10,
      stopLoss: 0.04
    },
    riskProfile: 'low',
    recommendedAgents: { min: 2, max: 6, optimal: 4 }
  },
  arbitrage: {
    name: 'Arbitrage Hunter',
    description: 'Exploits price differences and spreads',
    defaultParams: {
      minSpread: 0.005,
      maxHoldTime: 60,
      maxExposure: 0.1,
      feeThreshold: 0.001
    },
    riskProfile: 'very_low',
    recommendedAgents: { min: 5, max: 12, optimal: 8 }
  },
  trend_following: {
    name: 'Trend Following',
    description: 'Identifies and follows market trends',
    defaultParams: {
      entryThreshold: 0.015,
      exitThreshold: 0.01,
      lookbackWindow: 30,
      stopLoss: 0.06,
      trailingStop: true
    },
    riskProfile: 'medium',
    recommendedAgents: { min: 3, max: 7, optimal: 5 }
  },
  breakout: {
    name: 'Breakout Trading',
    description: 'Capitalizes on price movements beyond support/resistance',
    defaultParams: {
      volatilityWindow: 20,
      breachThreshold: 0.025,
      volumeConfirmation: true,
      stopLoss: 0.07,
      profitTarget: 0.15
    },
    riskProfile: 'high',
    recommendedAgents: { min: 2, max: 5, optimal: 3 }
  }
}

export function TabBasedFarmCreationWizard({ onFarmCreated, onCancel, onReturn, className }: TabBasedFarmCreationWizardProps) {
  const [activeStep, setActiveStep] = useState('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [existingAgents, setExistingAgents] = useState<TradingAgent[]>([])
  const [wizardData, setWizardData] = useState<FarmConfig>({
    name: '',
    description: '',
    strategy: {
      type: 'momentum',
      name: STRATEGY_TEMPLATES.momentum.name,
      parameters: STRATEGY_TEMPLATES.momentum.defaultParams,
      description: STRATEGY_TEMPLATES.momentum.description
    },
    riskLimits: {
      maxPositionSize: 10,
      maxDailyLoss: 500,
      maxDrawdown: 20,
      maxLeverage: 1,
      allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
      stopLossEnabled: true,
      takeProfitEnabled: true
    },
    agentCount: 5,
    initialCapitalPerAgent: 10000,
    totalAllocatedCapital: 50000,
    targetDailyProfit: 1000,
    targetWinRate: 75,
    maxRiskPerTrade: 2.5,
    coordinationMode: 'coordinated',
    profitDistribution: 'performance',
    autoScaling: true,
    emergencyStopLoss: 10
  })

  // Load existing agents on component mount
  useEffect(() => {
    loadExistingAgents()
  }, [])

  useEffect(() => {
    // Update total allocated capital when agent count or capital per agent changes
    setWizardData(prev => ({
      ...prev,
      totalAllocatedCapital: prev.agentCount * prev.initialCapitalPerAgent
    }))
  }, [wizardData.agentCount, wizardData.initialCapitalPerAgent])

  const loadExistingAgents = async () => {
    try {
      const agents = paperTradingEngine.getAllAgents()
      setExistingAgents(agents)
      
      // Also try to load from backend
      try {
        const response = await backendApi.get('/api/v1/agents/status')
        if (response.data) {
          console.log('Backend agents:', response.data)
        }
      } catch (backendError) {
        console.log('Backend API not available:', backendError)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    setWizardData(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        type: strategyType,
        name: template.name,
        description: template.description,
        parameters: template.defaultParams
      },
      agentCount: template.recommendedAgents.optimal
    }))
  }

  const handleParameterChange = (key: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        parameters: {
          ...prev.strategy.parameters,
          [key]: value
        }
      }
    }))
  }

  const validateStep = (stepId: string): boolean | string => {
    switch (stepId) {
      case 'basic':
        if (!wizardData.name?.trim()) {
          return 'Farm name is required'
        }
        if (wizardData.name.length < 3) {
          return 'Farm name must be at least 3 characters'
        }
        if (wizardData.totalAllocatedCapital < 5000) {
          return 'Minimum capital is $5,000'
        }
        break

      case 'strategy':
        if (!wizardData.strategy?.name?.trim()) {
          return 'Strategy name is required'
        }
        if (wizardData.agentCount < 1 || wizardData.agentCount > 20) {
          return 'Agent count must be between 1 and 20'
        }
        break

      case 'risk':
        if (wizardData.riskLimits?.maxPositionSize < 1 || wizardData.riskLimits?.maxPositionSize > 50) {
          return 'Position size must be between 1% and 50%'
        }
        if (wizardData.riskLimits?.maxDailyLoss < 100) {
          return 'Minimum daily loss limit is $100'
        }
        if (wizardData.targetDailyProfit <= 0) {
          return 'Target daily profit must be positive'
        }
        break
    }

    return true
  }

  const handleNextStep = () => {
    const validation = validateStep(activeStep)
    if (validation !== true) {
      toast.error(validation as string)
      return
    }

    if (activeStep === 'basic') {
      setActiveStep('strategy')
    } else if (activeStep === 'strategy') {
      setActiveStep('risk')
    } else if (activeStep === 'risk') {
      setActiveStep('review')
    } else if (activeStep === 'review') {
      handleCreateFarm()
    }
  }

  const handlePrevStep = () => {
    if (activeStep === 'strategy') {
      setActiveStep('basic')
    } else if (activeStep === 'risk') {
      setActiveStep('strategy')
    } else if (activeStep === 'review') {
      setActiveStep('risk')
    }
  }

  const handleCreateFarm = async () => {
    setIsCreating(true)
    try {
      // Start the trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const createdAgents: TradingAgent[] = []

      // Create agents for the farm
      for (let i = 0; i < wizardData.agentCount; i++) {
        const agentConfig = {
          name: `${wizardData.name} Agent ${i + 1}`,
          strategy: {
            name: `${wizardData.strategy.name} ${i + 1}`,
            type: wizardData.strategy.type,
            parameters: wizardData.strategy.parameters,
            description: wizardData.strategy.description
          },
          initialCapital: wizardData.initialCapitalPerAgent,
          riskLimits: {
            ...wizardData.riskLimits,
            maxDailyLoss: wizardData.riskLimits.maxDailyLoss / wizardData.agentCount
          }
        }

        const agent = paperTradingEngine.createAgent(agentConfig)
        createdAgents.push(agent)
      }

      // Create farm object
      const farm = {
        farm_id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farm_name: wizardData.name,
        description: wizardData.description,
        strategy_type: wizardData.strategy.type,
        status: 'active',
        created_at: new Date().toISOString(),
        target_daily_profit: wizardData.targetDailyProfit,
        target_win_rate: wizardData.targetWinRate,
        max_risk_per_trade: wizardData.maxRiskPerTrade,
        total_allocated_capital: wizardData.totalAllocatedCapital,
        coordination_mode: wizardData.coordinationMode,
        profit_distribution: wizardData.profitDistribution,
        auto_scaling: wizardData.autoScaling,
        emergency_stop_loss: wizardData.emergencyStopLoss,
        agents: createdAgents.map(agent => agent.id),
        metadata: {
          agent_count: wizardData.agentCount,
          strategy_parameters: wizardData.strategy.parameters,
          risk_limits: wizardData.riskLimits,
          creation_wizard_version: '2.0'
        }
      }

      // Try to save to backend first
      try {
        const backendResponse = await backendApi.post('/api/v1/farms', farm)
        console.log('Farm saved to backend:', backendResponse.data)
      } catch (backendError) {
        console.error('Error saving farm to backend:', backendError)
        // Continue with local creation even if backend fails
      }

      toast.success('Farm created successfully!')
      
      if (onFarmCreated) {
        onFarmCreated(farm)
      }
      
      // Return to farms list view
      if (onReturn) {
        onReturn()
      }

    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Failed to create farm')
    } finally {
      setIsCreating(false)
    }
  }

  // Progress calculation
  const getStepProgress = () => {
    const steps = ['basic', 'strategy', 'risk', 'review']
    const currentIndex = steps.indexOf(activeStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Trading Farm</h1>
            <p className="text-gray-600">Set up a coordinated group of AI trading agents</p>
          </div>
          <div className="flex gap-2">
            {onReturn && (
              <Button variant="outline" onClick={onReturn}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farms
              </Button>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      {/* Tabs for steps */}
      <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="risk">Risk & Capital</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Farm Configuration</CardTitle>
              <CardDescription>Basic settings for your trading farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farm-name">Farm Name *</Label>
                  <Input
                    id="farm-name"
                    value={wizardData.name}
                    onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter farm name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-count">Number of Agents</Label>
                  <Input
                    id="agent-count"
                    type="number"
                    min="1"
                    max="20"
                    value={wizardData.agentCount}
                    onChange={(e) => setWizardData(prev => ({ ...prev, agentCount: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="farm-description">Description</Label>
                <Textarea
                  id="farm-description"
                  value={wizardData.description}
                  onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your farm's purpose and strategy..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capital-per-agent">Capital per Agent ($)</Label>
                  <Input
                    id="capital-per-agent"
                    type="number"
                    min="1000"
                    value={wizardData.initialCapitalPerAgent}
                    onChange={(e) => setWizardData(prev => ({ ...prev, initialCapitalPerAgent: parseInt(e.target.value) || 10000 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Total Allocated Capital</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="text-lg font-semibold text-green-600">
                      ${wizardData.totalAllocatedCapital.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {wizardData.agentCount} agents × ${wizardData.initialCapitalPerAgent.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Strategy</CardTitle>
              <CardDescription>Configure the trading strategy for your farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Strategy Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        wizardData.strategy.type === key
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleStrategyChange(key as TradingStrategy['type'])}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {wizardData.strategy.type === key && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {template.riskProfile.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {template.recommendedAgents.optimal} agents
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Strategy Parameters */}
              <div>
                <Label>Strategy Parameters</Label>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(wizardData.strategy.parameters).map(([key, value]) => (
                        <div key={key}>
                          <Label htmlFor={`param-${key}`}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <Input
                            id={`param-${key}`}
                            type="number"
                            step="0.001"
                            value={value as number}
                            onChange={(e) => handleParameterChange(key, parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk & Capital Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure risk limits and safety measures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-position">Max Position Size (%)</Label>
                  <Input
                    id="max-position"
                    type="number"
                    min="1"
                    max="50"
                    value={wizardData.riskLimits.maxPositionSize}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      riskLimits: { ...prev.riskLimits, maxPositionSize: parseInt(e.target.value) || 10 }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max-daily-loss">Max Daily Loss ($)</Label>
                  <Input
                    id="max-daily-loss"
                    type="number"
                    min="100"
                    value={wizardData.riskLimits.maxDailyLoss}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      riskLimits: { ...prev.riskLimits, maxDailyLoss: parseInt(e.target.value) || 500 }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-profit">Target Daily Profit ($)</Label>
                  <Input
                    id="target-profit"
                    type="number"
                    min="1"
                    value={wizardData.targetDailyProfit}
                    onChange={(e) => setWizardData(prev => ({ ...prev, targetDailyProfit: parseInt(e.target.value) || 1000 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="target-winrate">Target Win Rate (%)</Label>
                  <Input
                    id="target-winrate"
                    type="number"
                    min="50"
                    max="95"
                    value={wizardData.targetWinRate}
                    onChange={(e) => setWizardData(prev => ({ ...prev, targetWinRate: parseInt(e.target.value) || 75 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Risk Controls</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Stop Loss Protection</div>
                      <div className="text-sm text-gray-600">Automatically close losing positions</div>
                    </div>
                    <Switch
                      checked={wizardData.riskLimits.stopLossEnabled}
                      onCheckedChange={(checked) => setWizardData(prev => ({
                        ...prev,
                        riskLimits: { ...prev.riskLimits, stopLossEnabled: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Take Profit Orders</div>
                      <div className="text-sm text-gray-600">Lock in profits at target levels</div>
                    </div>
                    <Switch
                      checked={wizardData.riskLimits.takeProfitEnabled}
                      onCheckedChange={(checked) => setWizardData(prev => ({
                        ...prev,
                        riskLimits: { ...prev.riskLimits, takeProfitEnabled: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Scaling</div>
                      <div className="text-sm text-gray-600">Automatically adjust position sizes</div>
                    </div>
                    <Switch
                      checked={wizardData.autoScaling}
                      onCheckedChange={(checked) => setWizardData(prev => ({ ...prev, autoScaling: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Review your farm configuration before creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Basic Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farm Name:</span>
                      <span className="font-medium">{wizardData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agents:</span>
                      <span className="font-medium">{wizardData.agentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Capital:</span>
                      <span className="font-medium">${wizardData.totalAllocatedCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategy:</span>
                      <span className="font-medium">{wizardData.strategy.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Risk Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Position:</span>
                      <span className="font-medium">{wizardData.riskLimits.maxPositionSize}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Daily Loss:</span>
                      <span className="font-medium">${wizardData.riskLimits.maxDailyLoss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Profit:</span>
                      <span className="font-medium">${wizardData.targetDailyProfit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Win Rate:</span>
                      <span className="font-medium">{wizardData.targetWinRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {wizardData.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {wizardData.description}
                  </p>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <div>
                  <div className="font-medium">Ready to Create</div>
                  <div className="text-sm">
                    Your farm will create {wizardData.agentCount} AI trading agents with ${wizardData.initialCapitalPerAgent.toLocaleString()} each.
                    They will trade using the {wizardData.strategy.name} strategy.
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={activeStep === 'basic'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNextStep}
          disabled={isCreating}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : activeStep === 'review' ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Farm
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
